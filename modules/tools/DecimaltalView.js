import { DecimaltalEngine, DEC_COL_DEFS } from './DecimaltalEngine.js';

const COL_W = 80;
const COL_H = 200;
const TOKEN_SIZE = 64;

export class DecimaltalView {
    #engine;
    #root = null;
    #tableEl = null;
    #tokensLayer = null;
    #blocksArea = null;
    #blocksActions = null;
    #nlSvg = null;
    #nlRangeLabel = null;
    #valueInput = null;
    #valueDisplay = null;
    #panelBlocks = null;
    #panelNl = null;
    #tokenEls = new Map();

    constructor(engine) {
        this.#engine = engine;
    }

    mount(parentEl) {
        this.#root = document.createElement('section');
        this.#root.className = 'tool-view flex flex-row h-full overflow-hidden';
        this.#root.innerHTML = this.#buildHTML();
        this.#grabRefs();
        this.#buildTable();
        this.#bindEvents();
        this.#engine.subscribe(() => this.#render());
        this.#render();
        parentEl.appendChild(this.#root);
        return this.#root;
    }

    #buildHTML() {
        return `
        <aside class="tool-sidebar flex flex-col gap-2 p-3 overflow-y-auto" style="min-width:220px;max-width:220px;">
            <div class="text-xs font-bold text-muted uppercase tracking-wide">Ange tal</div>
            <div class="flex gap-1">
                <input id="dec-val-input" type="text" placeholder="0,5" class="tool-input flex-1 px-2 py-1 rounded border text-sm"/>
                <button id="dec-val-set" class="tool-btn px-2 text-xs">Sätt</button>
            </div>
            <div id="dec-value-display" class="text-center font-mono text-lg font-bold text-gray-700 py-1"></div>
            <hr/>
            <div class="text-xs font-bold text-muted uppercase tracking-wide">Flytta siffror</div>
            <div class="grid grid-cols-3 gap-1">
                <button class="dec-op-btn" data-shift="3" style="background:rgba(21,101,192,0.10);border-color:#1565C0;color:#1565C0;">× 1000</button>
                <button class="dec-op-btn" data-shift="2" style="background:rgba(21,101,192,0.10);border-color:#1565C0;color:#1565C0;">× 100</button>
                <button class="dec-op-btn" data-shift="1" style="background:rgba(21,101,192,0.10);border-color:#1565C0;color:#1565C0;">× 10</button>
                <button class="dec-op-btn" data-shift="-3" style="background:rgba(183,28,28,0.10);border-color:#B71C1C;color:#B71C1C;">÷ 1000</button>
                <button class="dec-op-btn" data-shift="-2" style="background:rgba(183,28,28,0.10);border-color:#B71C1C;color:#B71C1C;">÷ 100</button>
                <button class="dec-op-btn" data-shift="-1" style="background:rgba(183,28,28,0.10);border-color:#B71C1C;color:#B71C1C;">÷ 10</button>
            </div>
            <hr/>
            <div class="flex flex-col gap-1 text-xs">
                <button id="dec-toggle-blocks" class="tool-btn text-xs">🟦 Visa block</button>
                <button id="dec-toggle-nl" class="tool-btn text-xs">📏 Visa tallinje</button>
                <button id="dec-toggle-cols" class="tool-btn text-xs">📊 Dölj kolumner</button>
            </div>
            <hr/>
            <button id="dec-reset" class="tool-btn-danger text-xs">Rensa</button>
            <div class="text-xs text-muted bg-blue-50 rounded p-2 mt-1">
                💡 Ange ett decimaltal och klicka Sätt. Dra i tabellhuvudet för att flytta.
            </div>
        </aside>
        <div class="flex-1 flex flex-col overflow-hidden">
            <div class="flex-shrink-0 overflow-x-auto relative" style="min-height:${COL_H + 60}px;">
                <div id="dec-table" class="dec-table" title="Dra vänster/höger för att flytta siffror"></div>
                <div id="dec-tokens-layer" style="position:absolute;top:0;left:0;pointer-events:none;"></div>
            </div>
            <div class="flex-1 flex flex-col overflow-hidden">
                <div id="dec-panel-blocks" class="dec-tab-panel active flex-1 overflow-auto">
                    <div class="flex gap-2 mb-2" id="dec-blocks-actions"></div>
                    <div id="dec-blocks-area" class="dec-blocks-aligned"></div>
                </div>
                <div id="dec-panel-numberline" class="dec-tab-panel overflow-auto" style="max-height:240px;">
                    <div class="flex items-center gap-3 mb-2">
                        <button id="dec-nl-zoomout" class="dec-op-btn text-xs" style="background:#eee;border-color:#999;color:#333;">Zooma ut</button>
                        <button id="dec-nl-pin" class="dec-op-btn text-xs" style="background:#f3e5f5;border-color:#8E24AA;color:#6A1B9A;">📌 Nåla</button>
                        <button id="dec-nl-clearpin" class="dec-op-btn text-xs" style="background:#eee;border-color:#999;color:#555;">Rensa nålar</button>
                        <span id="dec-nl-range-label" class="text-xs font-semibold text-gray-500"></span>
                    </div>
                    <svg id="dec-nl-svg" width="100%" height="130" style="cursor:pointer;"></svg>
                </div>
            </div>
        </div>`;
    }

    #grabRefs() {
        this.#tableEl = this.#root.querySelector('#dec-table');
        this.#tokensLayer = this.#root.querySelector('#dec-tokens-layer');
        this.#blocksArea = this.#root.querySelector('#dec-blocks-area');
        this.#blocksActions = this.#root.querySelector('#dec-blocks-actions');
        this.#nlSvg = this.#root.querySelector('#dec-nl-svg');
        this.#nlRangeLabel = this.#root.querySelector('#dec-nl-range-label');
        this.#valueInput = this.#root.querySelector('#dec-val-input');
        this.#valueDisplay = this.#root.querySelector('#dec-value-display');
        this.#panelBlocks = this.#root.querySelector('#dec-panel-blocks');
        this.#panelNl = this.#root.querySelector('#dec-panel-numberline');
    }

    #buildTable() {
        let html = '';
        for (const col of DEC_COL_DEFS) {
            const isSep = col.pos === -1;
            if (isSep) {
                html += `<div class="flex flex-col items-center justify-end" style="width:24px;flex-shrink:0;padding-bottom:8px;">
                    <div class="dec-dot"></div>
                </div>`;
            }
            html += `<div class="dec-col" data-pos="${col.pos}" style="min-width:${COL_W}px;border-right:2px solid ${col.bg}33;">
                <div class="dec-col-head" style="background:${col.bg};color:${col.text};padding:6px 4px;text-align:center;font-size:11px;font-weight:700;writing-mode:horizontal-tb;">
                    ${col.label}
                </div>
                <div class="dec-col-body" style="flex:1;position:relative;min-height:${COL_H - 36}px;"></div>
            </div>`;
        }
        this.#tableEl.innerHTML = html;
        this.#bindTableDrag();
    }

    #bindTableDrag() {
        let startX = null;
        const table = this.#tableEl;
        table.addEventListener('pointerdown', e => {
            if (!e.target.classList.contains('dec-col-head')) return;
            startX = e.clientX;
            table.setPointerCapture(e.pointerId);
            e.preventDefault();
        });
        table.addEventListener('pointermove', e => {
            if (startX === null) return;
            const dx = e.clientX - startX;
            if (Math.abs(dx) >= COL_W) {
                const steps = Math.round(dx / COL_W);
                this.#engine.shift(steps);
                startX = e.clientX;
            }
        });
        table.addEventListener('pointerup', () => { startX = null; });
        table.addEventListener('pointercancel', () => { startX = null; });
    }

    #bindEvents() {
        this.#root.querySelector('#dec-val-set').addEventListener('click', () => {
            this.#engine.setValue(this.#valueInput.value);
        });
        this.#valueInput.addEventListener('keydown', e => {
            if (e.key === 'Enter') this.#engine.setValue(this.#valueInput.value);
        });
        this.#root.querySelectorAll('[data-shift]').forEach(btn => {
            btn.addEventListener('click', () => this.#engine.shift(parseInt(btn.dataset.shift)));
        });
        this.#root.querySelector('#dec-toggle-blocks').addEventListener('click', () => this.#engine.toggleBlocks());
        this.#root.querySelector('#dec-toggle-nl').addEventListener('click', () => this.#engine.toggleNumberLine());
        this.#root.querySelector('#dec-toggle-cols').addEventListener('click', () => this.#engine.toggleColumns());
        this.#root.querySelector('#dec-reset').addEventListener('click', () => { this.#engine.reset(); this.#valueInput.value = ''; });
        this.#root.querySelector('#dec-nl-zoomout').addEventListener('click', () => this.#engine.zoomOut());
        this.#root.querySelector('#dec-nl-pin').addEventListener('click', () => this.#engine.pinCurrent());
        this.#root.querySelector('#dec-nl-clearpin').addEventListener('click', () => this.#engine.clearPins());
        this.#nlSvg.addEventListener('click', e => this.#handleNlClick(e));
    }

    #render() {
        const state = this.#engine.getState();
        this.#valueDisplay.textContent = state.displayString;
        this.#renderTokens(state);
        if (state.showBlocks) this.#renderBlocks(state);
        if (state.showNumberLine) this.#renderNumberLine(state);
        this.#panelBlocks.classList.toggle('active', state.showBlocks);
        this.#panelNl.classList.toggle('active', state.showNumberLine);
        this.#tableEl.classList.toggle('hide-dividers', !state.showColumns);
    }

    #renderTokens(state) {
        const existing = new Set(this.#tokenEls.keys());
        const digits = state.digits;
        const seen = new Set();

        for (const d of digits) {
            const key = `${d.pos}:${d.val}`;
            seen.add(key);
            if (!this.#tokenEls.has(key)) {
                const el = this.#createTokenEl(d);
                this.#tokensLayer.appendChild(el);
                this.#tokenEls.set(key, el);
            }
            this.#positionToken(this.#tokenEls.get(key), d.pos, d.val);
        }

        for (const key of existing) {
            if (!seen.has(key)) {
                this.#tokenEls.get(key)?.remove();
                this.#tokenEls.delete(key);
            }
        }
    }

    #createTokenEl(d) {
        const colDef = DEC_COL_DEFS.find(c => c.pos === d.pos);
        const bg = colDef ? colDef.bg : '#999';
        const text = colDef ? colDef.text : '#fff';
        const el = document.createElement('div');
        el.className = 'dec-token';
        el.style.cssText = `position:absolute;width:${TOKEN_SIZE}px;height:${TOKEN_SIZE}px;border-radius:10px;background:${bg};color:${text};display:flex;align-items:center;justify-content:center;font-size:28px;font-weight:900;font-family:'Nunito',sans-serif;box-shadow:0 3px 12px #0003;transition:left 0.3s;pointer-events:none;z-index:2;`;
        el.textContent = d.val;
        return el;
    }

    #positionToken(el, pos, val) {
        const colEl = this.#tableEl.querySelector(`.dec-col[data-pos="${pos}"]`);
        if (!colEl) { el.style.display = 'none'; return; }
        el.style.display = 'flex';
        const tableRect = this.#tableEl.getBoundingClientRect();
        const colRect = colEl.getBoundingClientRect();
        const parentRect = this.#tokensLayer.parentElement.getBoundingClientRect();
        const x = colRect.left - parentRect.left + (colRect.width - TOKEN_SIZE) / 2;
        const y = colRect.top - parentRect.top + 40;
        el.style.left = x + 'px';
        el.style.top = y + 'px';
    }

    #renderBlocks(state) {
        const { blocksOnes: ones, blocksTenths: tenths, blocksHundredths: hundredths } = state;
        const area = this.#blocksArea;
        const actions = this.#blocksActions;
        area.innerHTML = '';
        actions.innerHTML = '';

        const makePlate = (w, h, color, label) => {
            const el = document.createElement('div');
            el.style.cssText = `width:${w}px;height:${h}px;background:${color};border:1.5px solid #0004;border-radius:3px;display:inline-block;margin:2px;`;
            el.title = label;
            return el;
        };

        // Ones column (ental: 120×120)
        if (ones > 0) {
            const col = document.createElement('div');
            col.className = 'dec-blocks-col';
            const head = document.createElement('div');
            head.className = 'text-xs font-bold text-center mb-1';
            head.style.color = '#E53935';
            head.textContent = `Ental (${ones})`;
            col.appendChild(head);
            const row = document.createElement('div');
            row.className = 'dec-blk-row dec-blk-enter';
            for (let i = 0; i < ones; i++) row.appendChild(makePlate(60, 60, '#E5393599', `1 ental`));
            col.appendChild(row);
            area.appendChild(col);
        }

        // Decimal separator
        if (ones > 0 && (tenths > 0 || hundredths > 0)) {
            const sep = document.createElement('div');
            sep.className = 'dec-blocks-sep flex items-center justify-center font-bold text-2xl text-gray-400';
            sep.textContent = ',';
            area.appendChild(sep);
        }

        // Tenths column (tiondelar: 12×120)
        if (tenths > 0) {
            const col = document.createElement('div');
            col.className = 'dec-blocks-col';
            const head = document.createElement('div');
            head.className = 'text-xs font-bold text-center mb-1';
            head.style.color = '#8E24AA';
            head.textContent = `Tiondel (${tenths})`;
            col.appendChild(head);
            const row = document.createElement('div');
            row.className = 'dec-blk-row dec-blk-enter';
            for (let i = 0; i < tenths; i++) row.appendChild(makePlate(12, 60, '#8E24AA99', `0,1`));
            col.appendChild(row);
            area.appendChild(col);
        }

        // Hundredths column (hundradedlar: 12×12)
        if (hundredths > 0) {
            const col = document.createElement('div');
            col.className = 'dec-blocks-col';
            const head = document.createElement('div');
            head.className = 'text-xs font-bold text-center mb-1';
            head.style.color = '#00838F';
            head.textContent = `Hundradel (${hundredths})`;
            col.appendChild(head);
            const row = document.createElement('div');
            row.className = 'dec-blk-row dec-blk-enter';
            for (let i = 0; i < hundredths; i++) row.appendChild(makePlate(12, 12, '#00838F99', `0,01`));
            col.appendChild(row);
            area.appendChild(col);
        }

        // Action buttons
        if (ones > 0) {
            const btn = document.createElement('button');
            btn.className = 'dec-op-btn text-xs';
            btn.style = 'background:#fce4ec;border-color:#c62828;color:#c62828;';
            btn.textContent = 'Dela 1 ental → 10 tiondelar';
            btn.addEventListener('click', () => this.#engine.splitOne());
            actions.appendChild(btn);
        }
        if (tenths >= 10) {
            const btn = document.createElement('button');
            btn.className = 'dec-op-btn text-xs';
            btn.style = 'background:#f3e5f5;border-color:#6a1b9a;color:#6a1b9a;';
            btn.textContent = 'Slå ihop 10 tiondelar → 1 ental';
            btn.addEventListener('click', () => this.#engine.mergeTenths());
            actions.appendChild(btn);
        }
        if (tenths > 0) {
            const btn = document.createElement('button');
            btn.className = 'dec-op-btn text-xs';
            btn.style = 'background:#e0f7fa;border-color:#00838f;color:#00838f;';
            btn.textContent = 'Dela 1 tiondel → 10 hundradelar';
            btn.addEventListener('click', () => this.#engine.splitTenth());
            actions.appendChild(btn);
        }
        if (hundredths >= 10) {
            const btn = document.createElement('button');
            btn.className = 'dec-op-btn text-xs';
            btn.style = 'background:#e0f2f1;border-color:#00695c;color:#00695c;';
            btn.textContent = 'Slå ihop 10 hundradelar → 1 tiondel';
            btn.addEventListener('click', () => this.#engine.mergeHundredths());
            actions.appendChild(btn);
        }
    }

    #renderNumberLine(state) {
        const { zoomStart: zs, zoomEnd: ze, value, pinnedPoints } = state;
        const svgEl = this.#nlSvg;
        const W = svgEl.clientWidth || 600;
        const H = 130;
        const PAD_H = 40;
        const PAD_V = 30;
        const axisY = H - PAD_V;
        const range = ze - zs;
        const toX = v => PAD_H + ((v - zs) / range) * (W - 2 * PAD_H);

        // How many ticks per segment
        const nSegments = 10;
        const segW = range / nSegments;
        const precision = Math.max(0, -Math.floor(Math.log10(segW)));

        const fmt = v => {
            const s = v.toFixed(precision).replace('.', ',');
            return s === '-0' ? '0' : s;
        };

        let html = '';
        // Axis
        html += `<line x1="${PAD_H}" y1="${axisY}" x2="${W - PAD_H}" y2="${axisY}" stroke="#555" stroke-width="2"/>`;
        // Arrow right
        html += `<polygon points="${W - PAD_H + 8},${axisY} ${W - PAD_H},${axisY - 5} ${W - PAD_H},${axisY + 5}" fill="#555"/>`;

        // Segments
        for (let i = 0; i <= nSegments; i++) {
            const v = zs + i * segW;
            const x = toX(v);
            const isMajor = i === 0 || i === nSegments || i === nSegments / 2;
            html += `<line x1="${x}" y1="${axisY - (isMajor ? 10 : 5)}" x2="${x}" y2="${axisY + 3}" stroke="#555" stroke-width="${isMajor ? 2 : 1}"/>`;
            if (isMajor) html += `<text x="${x}" y="${axisY + 16}" text-anchor="middle" font-size="11" fill="#444">${fmt(v)}</text>`;
        }

        // Clickable segments
        for (let i = 0; i < nSegments; i++) {
            const sv = zs + i * segW;
            const ev = sv + segW;
            const x1 = toX(sv);
            const x2 = toX(ev);
            html += `<rect x="${x1}" y="${axisY - 14}" width="${x2 - x1}" height="22" fill="transparent" class="dec-nl-segment" data-start="${sv}" data-end="${ev}"/>`;
        }

        // Pinned points
        for (const pin of pinnedPoints) {
            if (pin.value >= zs && pin.value <= ze) {
                const x = toX(pin.value);
                html += `<circle cx="${x}" cy="${axisY}" r="6" fill="#8E24AA" stroke="white" stroke-width="2"/>`;
                html += `<text x="${x}" y="${axisY - 14}" text-anchor="middle" font-size="10" fill="#6A1B9A" font-weight="bold">${pin.label}</text>`;
            }
        }

        // Current value marker
        if (state.digits.length > 0 && value >= zs && value <= ze) {
            const x = toX(value);
            html += `<line x1="${x}" y1="${PAD_V}" x2="${x}" y2="${axisY}" stroke="#E53935" stroke-width="2.5" stroke-dasharray="4,3"/>`;
            html += `<circle cx="${x}" cy="${axisY}" r="7" fill="#E53935" stroke="white" stroke-width="2.5"/>`;
            html += `<text x="${x}" y="${PAD_V - 4}" text-anchor="middle" font-size="11" fill="#E53935" font-weight="bold">${state.displayString}</text>`;
        }

        svgEl.innerHTML = html;
        this.#nlRangeLabel.textContent = `${fmt(zs)} – ${fmt(ze)}`;

        // Bind click on segments
        svgEl.querySelectorAll('.dec-nl-segment').forEach(rect => {
            rect.style.cursor = 'pointer';
            rect.addEventListener('click', () => {
                const start = parseFloat(rect.dataset.start);
                const end = parseFloat(rect.dataset.end);
                this.#engine.zoomTo(start, end);
            });
        });
    }

    #handleNlClick(e) {
        // handled by segment listeners
    }

    onEnter() {
        // Re-position tokens after layout change
        const state = this.#engine.getState();
        this.#renderTokens(state);
        if (state.showBlocks) this.#renderBlocks(state);
        if (state.showNumberLine) this.#renderNumberLine(state);
    }
}
