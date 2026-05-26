// ═══════════════════════════════════════════════════════════════════════════
// modules/tools/DecimaltalEngine.js
// Stage 1 — pure place-value model: digit positions, shift, headers, value.
// ═══════════════════════════════════════════════════════════════════════════

export const DEC_COL_DEFS = Object.freeze([
    { pos: 3,  key: 'tusental',    label: 'Tusental',    abbr: 'T',  color: '#1565C0', bg: 'rgba(30,136,229,0.09)',  border: '#1565C0' },
    { pos: 2,  key: 'hundratal',   label: 'Hundratal',   abbr: 'H',  color: '#2E7D32', bg: 'rgba(56,142,60,0.09)',   border: '#2E7D32' },
    { pos: 1,  key: 'tiotal',      label: 'Tiotal',      abbr: 'Ti', color: '#92700A', bg: 'rgba(249,168,37,0.11)',  border: '#92700A' },
    { pos: 0,  key: 'ental',       label: 'Ental',       abbr: 'E',  color: '#C62828', bg: 'rgba(229,57,53,0.09)',   border: '#C62828' },
    { pos: -1, key: 'tiondelar',   label: 'Tiondelar',   abbr: '',   color: '#6a1b9a', bg: 'rgba(106,27,154,0.09)', border: '#6a1b9a' },
    { pos: -2, key: 'hundradelar', label: 'Hundradelar', abbr: '',   color: '#00695c', bg: 'rgba(0,105,92,0.09)',   border: '#00695c' },
    { pos: -3, key: 'tusendelar',  label: 'Tusendelar',  abbr: '',   color: '#4527a0', bg: 'rgba(69,39,160,0.09)',  border: '#4527a0' },
]);

const MIN_POS = -3;
const MAX_POS = 3;

export class DecimaltalEngine {
    #digits = [];
    #columnsVisible = true;
    #listeners = new Set();

    setFromString(str) {
        this.#digits = parseInput(str);
        this.#emit();
    }

    shift(steps) {
        if (!steps || this.#digits.length === 0) return;
        this.#digits = this.#digits.map(d => ({ ...d, pos: d.pos + steps }));
        this.#insertPlaceholderZeros();
        this.#emit();
    }

    reset() {
        if (this.#digits.length === 0) return;
        this.#digits = [];
        this.#emit();
    }

    setColumnsVisible(visible) {
        const v = !!visible;
        if (this.#columnsVisible === v) return;
        this.#columnsVisible = v;
        this.#emit();
    }

    getReading() {
        const value = this.#digits.reduce(
            (s, d) => s + d.val * Math.pow(10, d.pos), 0);

        const headerVals = {};
        for (const col of DEC_COL_DEFS) {
            const digit = this.#digits.find(d => d.pos === col.pos);
            if (!digit) { headerVals[col.key] = ''; continue; }
            const contribution = digit.val * Math.pow(10, col.pos);
            headerVals[col.key] = fmtSE(contribution, Math.max(0, -col.pos));
        }

        const outOfRange = this.#digits.some(d => d.pos < MIN_POS || d.pos > MAX_POS);

        return Object.freeze({
            digits:          Object.freeze(this.#digits.map(d => ({ ...d }))),
            value,
            valueText:       this.#digits.length === 0 ? '—' : fmtSE(value),
            headerVals:      Object.freeze(headerVals),
            outOfRange,
            columnsVisible:  this.#columnsVisible,
            isEmpty:         this.#digits.length === 0,
        });
    }

    subscribe(listener) {
        this.#listeners.add(listener);
        listener(this.getReading());
        return () => this.#listeners.delete(listener);
    }

    #emit() {
        const reading = this.getReading();
        for (const l of this.#listeners) {
            try { l(reading); }
            catch (err) { console.error('[DecimaltalEngine] listener threw:', err); }
        }
    }

    #insertPlaceholderZeros() {
        if (this.#digits.length === 0) return;
        const maxPos = Math.max(...this.#digits.map(d => d.pos));
        const minPos = Math.min(...this.#digits.map(d => d.pos));

        if (maxPos < 0) {
            this.#digits.push({ pos: 0, val: 0 });
        }
        if (minPos < -1) {
            for (let pos = -1; pos > minPos; pos--) {
                if (!this.#digits.some(d => d.pos === pos)) {
                    this.#digits.push({ pos, val: 0 });
                }
            }
        }
        const newMax = Math.max(...this.#digits.map(d => d.pos));
        if (newMax > 0) {
            for (let pos = 0; pos < newMax; pos++) {
                if (!this.#digits.some(d => d.pos === pos)) {
                    this.#digits.push({ pos, val: 0 });
                }
            }
        }
    }
}

function parseInput(str) {
    const s = (str ?? '').toString().trim().replace(',', '.').replace(/\s/g, '');
    const num = parseFloat(s);
    if (!s || !Number.isFinite(num)) return [];

    const absStr = s.startsWith('-') ? s.slice(1) : s;
    const [intPart = '0', fracPart = ''] = absStr.split('.');
    const result = [];

    for (let i = 0; i < intPart.length; i++) {
        const pos = intPart.length - 1 - i;
        if (pos > MAX_POS) continue;
        const val = parseInt(intPart[i], 10);
        if (!Number.isNaN(val)) result.push({ pos, val });
    }
    for (let i = 0; i < fracPart.length && i < 3; i++) {
        const val = parseInt(fracPart[i], 10);
        if (!Number.isNaN(val)) result.push({ pos: -(i + 1), val });
    }
    return result;
}

function fmtSE(n, maxFrac = 6) {
    return n.toLocaleString('sv-SE', {
        maximumFractionDigits: maxFrac,
        minimumFractionDigits: 0,
    });
}
