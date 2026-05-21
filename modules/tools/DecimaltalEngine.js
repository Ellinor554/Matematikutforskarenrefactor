export const DEC_COL_DEFS = [
    { pos: 3,  label: 'Tusental',    bg: '#1E88E5', text: '#fff'  },
    { pos: 2,  label: 'Hundratal',   bg: '#388E3C', text: '#fff'  },
    { pos: 1,  label: 'Tiotal',      bg: '#F9A825', text: '#222'  },
    { pos: 0,  label: 'Ental',       bg: '#E53935', text: '#fff'  },
    { pos: -1, label: 'Tiondelar',   bg: '#8E24AA', text: '#fff'  },
    { pos: -2, label: 'Hundradedlar',bg: '#00838F', text: '#fff'  },
    { pos: -3, label: 'Tusendelar',  bg: '#546E7A', text: '#fff'  },
];

export class DecimaltalEngine {
    #digits = [];
    #showBlocks = true;
    #showNumberLine = false;
    #showColumns = true;
    #blocksOnes = 0;
    #blocksTenths = 0;
    #blocksHundredths = 0;
    #zoomStart = 0;
    #zoomEnd = 10;
    #pinnedPoints = [];
    #listeners = [];

    getValue() {
        return this.#digits.reduce((s, d) => s + d.val * Math.pow(10, d.pos), 0);
    }

    getDisplayString() {
        if (this.#digits.length === 0) return '';
        const sortedPos = [...new Set(this.#digits.map(d => d.pos))].sort((a, b) => b - a);
        let intPart = '';
        let fracPart = '';
        for (const pos of sortedPos) {
            const d = this.#digits.find(x => x.pos === pos);
            const v = d ? d.val : 0;
            if (pos >= 0) intPart = v.toString() + intPart;
            else fracPart += v.toString();
        }
        if (!intPart) intPart = '0';
        return fracPart ? `${intPart},${fracPart}` : intPart;
    }

    setValue(str) {
        this.#digits = this.#parseInput(str);
        this.#insertPlaceholderZeros();
        this.#syncBlocksFromDigits();
        this.#notify();
    }

    shift(steps) {
        if (!steps || this.#digits.length === 0) return;
        this.#digits = this.#digits.map(d => ({ pos: d.pos + steps, val: d.val }));
        this.#digits = this.#digits.filter(d => d.pos >= -3 && d.pos <= 3);
        this.#insertPlaceholderZeros();
        this.#syncBlocksFromDigits();
        this.#notify();
    }

    getDigits() { return this.#digits.map(d => ({ ...d })); }
    getShowBlocks() { return this.#showBlocks; }
    getShowNumberLine() { return this.#showNumberLine; }
    getShowColumns() { return this.#showColumns; }
    getBlocksState() { return { ones: this.#blocksOnes, tenths: this.#blocksTenths, hundredths: this.#blocksHundredths }; }
    getZoomRange() { return [this.#zoomStart, this.#zoomEnd]; }
    getPinnedPoints() { return this.#pinnedPoints.map(p => ({ ...p })); }

    toggleBlocks() { this.#showBlocks = !this.#showBlocks; this.#notify(); }
    toggleNumberLine() { this.#showNumberLine = !this.#showNumberLine; this.#notify(); }
    toggleColumns() { this.#showColumns = !this.#showColumns; this.#notify(); }

    splitOne() {
        if (this.#blocksOnes < 1) return;
        this.#blocksOnes--;
        this.#blocksTenths += 10;
        this.#notify();
    }

    mergeTenths() {
        if (this.#blocksTenths < 10) return;
        this.#blocksTenths -= 10;
        this.#blocksOnes++;
        this.#notify();
    }

    splitTenth() {
        if (this.#blocksTenths < 1) return;
        this.#blocksTenths--;
        this.#blocksHundredths += 10;
        this.#notify();
    }

    mergeHundredths() {
        if (this.#blocksHundredths < 10) return;
        this.#blocksHundredths -= 10;
        this.#blocksTenths++;
        this.#notify();
    }

    zoomOut() {
        const range = this.#zoomEnd - this.#zoomStart;
        const ns = this.#zoomStart - range * 4.5;
        const ne = this.#zoomEnd + range * 4.5;
        if (ne - ns > 10000) { this.#zoomStart = 0; this.#zoomEnd = 10; }
        else { this.#zoomStart = ns; this.#zoomEnd = ne; }
        this.#notify();
    }

    zoomTo(start, end) {
        this.#zoomStart = start;
        this.#zoomEnd = end;
        this.#notify();
    }

    pinCurrent() {
        const val = this.getValue();
        if (this.#digits.length === 0) return;
        if (!this.#pinnedPoints.some(p => Math.abs(p.value - val) < 1e-10)) {
            const label = val.toLocaleString('sv-SE', { maximumFractionDigits: 4 });
            this.#pinnedPoints.push({ value: val, label });
            this.#notify();
        }
    }

    clearPins() { this.#pinnedPoints = []; this.#notify(); }

    reset() {
        this.#digits = [];
        this.#blocksOnes = 0;
        this.#blocksTenths = 0;
        this.#blocksHundredths = 0;
        this.#zoomStart = 0;
        this.#zoomEnd = 10;
        this.#pinnedPoints = [];
        this.#notify();
    }

    getState() {
        return {
            digits: this.#digits.map(d => ({ ...d })),
            displayString: this.getDisplayString(),
            value: this.getValue(),
            showBlocks: this.#showBlocks,
            showNumberLine: this.#showNumberLine,
            showColumns: this.#showColumns,
            blocksOnes: this.#blocksOnes,
            blocksTenths: this.#blocksTenths,
            blocksHundredths: this.#blocksHundredths,
            zoomStart: this.#zoomStart,
            zoomEnd: this.#zoomEnd,
            pinnedPoints: this.#pinnedPoints.map(p => ({ ...p })),
        };
    }

    subscribe(listener) {
        this.#listeners.push(listener);
        return () => { this.#listeners = this.#listeners.filter(l => l !== listener); };
    }

    #notify() { this.#listeners.forEach(l => l()); }

    #parseInput(str) {
        str = (str || '').trim().replace(',', '.').replace(/\s/g, '');
        if (!str) return [];
        const num = parseFloat(str);
        if (isNaN(num) || !isFinite(num)) return [];
        const negative = str.startsWith('-');
        const absStr = negative ? str.slice(1) : str;
        const dotIdx = absStr.indexOf('.');
        const intPart = dotIdx >= 0 ? absStr.slice(0, dotIdx) : absStr;
        const fracPart = dotIdx >= 0 ? absStr.slice(dotIdx + 1) : '';
        const result = [];
        for (let i = 0; i < intPart.length && (intPart.length - 1 - i) <= 3; i++) {
            const pos = intPart.length - 1 - i;
            const val = parseInt(intPart[i], 10);
            if (!isNaN(val)) result.push({ pos, val });
        }
        for (let i = 0; i < fracPart.length && i < 3; i++) {
            const val = parseInt(fracPart[i], 10);
            if (!isNaN(val)) result.push({ pos: -(i + 1), val });
        }
        return result;
    }

    #syncBlocksFromDigits() {
        this.#blocksOnes = 0;
        this.#blocksTenths = 0;
        this.#blocksHundredths = 0;
        for (const d of this.#digits) {
            if (d.pos === 0)  this.#blocksOnes = d.val;
            if (d.pos === -1) this.#blocksTenths = d.val;
            if (d.pos === -2) this.#blocksHundredths = d.val;
        }
    }

    #insertPlaceholderZeros() {
        if (this.#digits.length === 0) return;
        const positions = this.#digits.map(d => d.pos);
        const maxPos = Math.max(...positions);
        const minPos = Math.min(...positions);
        if (maxPos < 0 && !positions.includes(0)) {
            this.#digits.push({ pos: 0, val: 0 });
        }
        for (let p = maxPos - 1; p > minPos; p--) {
            if (p >= -3 && p <= 3 && !positions.includes(p)) {
                this.#digits.push({ pos: p, val: 0 });
            }
        }
    }
}
