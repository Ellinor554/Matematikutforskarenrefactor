// ═══════════════════════════════════════════════════════════════════════════
// modules/tools/DecimaltalView.js
// Stage 1 view: sidebar (input + shift buttons + value + toggle + reset)
// and the place-value table with animated digit tokens.
// ═══════════════════════════════════════════════════════════════════════════

import { DecimaltalEngine, DEC_COL_DEFS } from './DecimaltalEngine.js';

const TOKEN_SIZE = 80;

const SHIFT_BUTTONS = [
    { steps:  1, label: '× 10',   group: 'mul' },
    { steps:  2, label: '× 100',  group: 'mul' },
    { steps:  3, label: '× 1000', group: 'mul' },
    { steps: -1, label: '÷ 10',   group: 'div' },
    { steps: -2, label: '÷ 100',  group: 'div' },
    { steps: -3, label: '÷ 1000', group: 'div' },
];

const MUL_STYLE = 'background:rgba(21,101,192,0.10);border-color:#1565C0;color:#1565C0;';
const DIV_STYLE = 'background:rgba(183,28,28,0.10);border-color:#B71C1C;color:#B71C1C;';

export class DecimaltalView {
    #engine;
    #unsubscribe;
    #root;
    #els = {};
    #lastReading = null;
    #resizeListener = null;
    #dragX = null;
    #dragShift = 0;

    constructor(engine = new DecimaltalEngine()) { this.#engine = engine; }
    get engine() { return this.#engine; }

    mount(parent) {
        this.#root = document.createElement('section');
        this.#root.id = 'view-decimaltal';
        this.#root.className = 'view-section flex-row h-full';
        this.#root.innerHTML = this.#template();
        parent.appendChild(this.#root);

        this.#cacheRefs();
        this.#buildTableColumns();
        this.#wireEvents();

        this.#unsubscribe = this.#engine.subscribe(reading => {
            this.#lastReading = reading;
            this.#render(reading);
        });

        this.#resizeListener = () => this.#positionTokens(false);
        window.addEventListener('resize', this.#resizeListener);

        return this.#root;
    }

    onEnter() {
        if (this.#lastReading) this.#positionTokens(false);
    }
    onLeave() {}
    destroy() {
        if (this.#resizeListener) window.removeEventListener('resize', this.#resizeListener);
        this.#unsubscribe?.();
        this.#root?.remove();
    }

    #template() {
        const shiftBtns = SHIFT_BUTTONS.map(b => `
            <button data-shift="${b.steps}" class="dec-op-btn"
                    style="${b.group === 'mul' ? MUL_STYLE : DIV_STYLE}">
                ${b.label}
            </button>`).join('');

        return `
        <div id="decimaltal-sidebar"
             class="w-64 bg-soft-surface shadow-md z-10 p-5 flex flex-col gap-4
                    overflow-y-auto border-r border-soft-border shrink-0">

            <h3 class="font-bold text-soft-text text-sm uppercase tracking-wider text-soft-muted">
                Skriv ett tal
            </h3>
            <input data-role="input" type="text" placeholder="t.ex. 0,14" inputmode="decimal"
                   class="w-full border-2 border-soft-border rounded-xl px-3 py-2
                          font-bold text-soft-text text-lg focus:outline-none
                          focus:border-soft-teal"/>

            <hr class="border-soft-border"/>

            <div>
                <h4 class="font-bold text-xs uppercase tracking-wider text-soft-muted mb-3">Flytta siffror</h4>
                <div class="grid grid-cols-2 gap-2">${shiftBtns}</div>
                <p class="text-xs text-soft-muted mt-2">
                    <i class="fas fa-hand-point-left mr-1"></i>
                    Dra i tabellen vänster/höger för manuell förflyttning.
                </p>
            </div>

            <hr class="border-soft-border"/>

            <div class="bg-soft-tealLight/15 border border-soft-tealLight/30 rounded-xl p-3">
                <div class="text-xs font-bold text-soft-muted uppercase tracking-wider mb-1">Nuvarande värde</div>
                <div class="text-2xl font-extrabold text-soft-teal" data-role="value-display">—</div>
                <div data-role="range-warning" class="hidden mt-1 text-xs text-soft-pink font-semibold">
                    <i class="fas fa-exclamation-triangle mr-1"></i>Tal utanför tabellen
                </div>
            </div>

            <hr class="border-soft-border"/>

            <div>
                <h4 class="font-bold text-xs uppercase tracking-wider text-soft-muted mb-3">Visa / Dölj</h4>
                <button data-action="toggle-columns"
                        class="flex items-center gap-2 px-3 py-2 rounded-xl border
                               font-bold text-sm transition-all w-full"
                        style="background:rgba(61,138,138,0.15);border-color:#3d8a8a;color:#3d8a8a;">
                    <i class="fas fa-eye text-sm" data-role="toggle-icon"></i> Kolumnavdelare
                </button>
            </div>

            <hr class="border-soft-border"/>
            <button data-action="reset"
                    class="bg-soft-text hover:bg-soft-muted text-white p-2
                           rounded-lg text-sm font-semibold mt-auto">
                <i class="fas fa-trash mr-1"></i> Rensa
            </button>
        </div>

        <div data-role="workspace" class="flex-1 flex flex-col overflow-hidden">
            <div data-role="table" class="dec-table"
                 title="Dra vänster/höger för att flytta siffror">
                <div data-role="tokens-layer" id="dec-tokens-layer"></div>
            </div>
        </div>`;
    }

    #cacheRefs() {
        const $  = sel => this.#root.querySelector(sel);
        const $$ = sel => this.#root.querySelectorAll(sel);
        this.#els = {
            input:         $('[data-role="input"]'),
            valueDisplay:  $('[data-role="value-display"]'),
            rangeWarning:  $('[data-role="range-warning"]'),
            table:         $('[data-role="table"]'),
            tokensLayer:   $('[data-role="tokens-layer"]'),
            toggleIcon:    $('[data-role="toggle-icon"]'),
            toggleBtn:     $('[data-action="toggle-columns"]'),
            shiftBtns:     $$('[data-shift]'),
        };
    }

    #buildTableColumns() {
        const table = this.#els.table;
        const tokensLayer = this.#els.tokensLayer;

        DEC_COL_DEFS.forEach((col, i) => {
            if (i === 4) {
                const sep = document.createElement('div');
                sep.className = 'dec-sep';
                sep.innerHTML = '<div class="dec-dot"></div>';
                table.insertBefore(sep, tokensLayer);
            }
            const colDiv = document.createElement('div');
            colDiv.className = 'dec-col';
            colDiv.id = `dec-col-${col.key}`;
            colDiv.dataset.colKey = col.key;

            const head = document.createElement('div');
            head.className = 'dec-col-head';
            head.innerHTML =
                  `${col.abbr ? `<span class="cab">${col.abbr}</span>` : ''}` +
                  `<span class="cnm">${col.label}</span>` +
                  `<span class="cval" data-cval="${col.key}"></span>`;

            const body = document.createElement('div');
            body.className = 'dec-col-body';
            body.id = `dec-body-${col.pos}`;

            colDiv.appendChild(head);
            colDiv.appendChild(body);
            table.insertBefore(colDiv, tokensLayer);
        });
    }

    #wireEvents() {
        this.#els.input.addEventListener('input', () => {
            this.#engine.setFromString(this.#els.input.value);
        });
        this.#els.input.addEventListener('keydown', e => {
            if (e.key === 'Enter') this.#engine.setFromString(this.#els.input.value);
        });

        this.#root.addEventListener('click', evt => {
            const shiftBtn = evt.target.closest('[data-shift]');
            if (shiftBtn) {
                this.#engine.shift(Number(shiftBtn.dataset.shift));
                return;
            }
            if (evt.target.closest('[data-action="reset"]')) {
                this.#engine.reset();
                this.#els.input.value = '';
                return;
            }
            if (evt.target.closest('[data-action="toggle-columns"]')) {
                const next = !(this.#lastReading?.columnsVisible ?? true);
                this.#engine.setColumnsVisible(next);
                return;
            }
        });

        const table = this.#els.table;
        table.addEventListener('pointerdown', e => {
            if (e.button !== 0) return;
            this.#dragX = e.clientX;
            this.#dragShift = 0;
            table.setPointerCapture(e.pointerId);
            e.preventDefault();
        });
        table.addEventListener('pointermove', e => {
            if (this.#dragX === null) return;
            const colW = Math.max(48, table.offsetWidth / (DEC_COL_DEFS.length + 1));
            const dx = e.clientX - this.#dragX;
            const newShift = -Math.round(dx / colW);
            if (newShift !== this.#dragShift) {
                this.#engine.shift(newShift - this.#dragShift);
                this.#dragShift = newShift;
            }
        });
        const endDrag = () => { this.#dragX = null; this.#dragShift = 0; };
        table.addEventListener('pointerup', endDrag);
        table.addEventListener('pointercancel', endDrag);
    }

    #render(reading) {
        this.#els.valueDisplay.textContent = reading.valueText;
        this.#els.rangeWarning.classList.toggle('hidden', !reading.outOfRange);

        for (const col of DEC_COL_DEFS) {
            const span = this.#root.querySelector(`[data-cval="${col.key}"]`);
            if (span) span.textContent = reading.headerVals[col.key] || '';
        }

        this.#els.table.classList.toggle('hide-dividers', !reading.columnsVisible);
        const icon = this.#els.toggleIcon;
        const btn  = this.#els.toggleBtn;
        if (reading.columnsVisible) {
            btn.style.cssText = 'background:rgba(61,138,138,0.15);border-color:#3d8a8a;color:#3d8a8a;';
            if (icon) icon.className = 'fas fa-eye text-sm';
        } else {
            btn.style.cssText = 'background:rgba(91,128,165,0.08);border-color:#8c8d92;color:#8c8d92;';
            if (icon) icon.className = 'fas fa-eye-slash text-sm';
        }

        this.#rebuildTokens(reading);
    }

    #rebuildTokens(reading) {
        const layer = this.#els.tokensLayer;
        const existing = Array.from(layer.querySelectorAll('.dec-token'));
        const needed = reading.digits.length;

        if (existing.length !== needed) {
            existing.forEach(t => t.remove());
            reading.digits.forEach((digit, i) => {
                const token = document.createElement('div');
                token.id = `dec-token-${i}`;
                token.className = 'dec-token';
                token.textContent = String(digit.val);
                token.style.transition = 'none';
                layer.appendChild(token);
            });
            this.#positionTokens(false);
        } else {
            reading.digits.forEach((digit, i) => {
                const token = layer.querySelector(`#dec-token-${i}`);
                if (token) token.textContent = String(digit.val);
            });
            this.#positionTokens(true);
        }
    }

    #positionTokens(animate) {
        const layer = this.#els.tokensLayer;
        if (!layer || !this.#lastReading) return;
        const layerRect = layer.getBoundingClientRect();
        if (!layerRect.width) return;

        const table = this.#els.table;
        const headEl = table.querySelector('.dec-col-head');
        const headH = headEl ? headEl.offsetHeight : 52;
        const tableH = table.offsetHeight;
        const tokenTop = headH + Math.max(0, (tableH - headH - TOKEN_SIZE) / 2);

        const transition = animate
            ? 'left 0.5s cubic-bezier(0.34,1.56,0.64,1), opacity 0.35s'
            : 'none';

        this.#lastReading.digits.forEach((digit, i) => {
            const token = layer.querySelector(`#dec-token-${i}`);
            if (!token) return;

            const col = DEC_COL_DEFS.find(c => c.pos === digit.pos);

            if (!col) {
                token.style.transition = transition;
                token.style.opacity = '0.15';
                token.style.left = (digit.pos > 3 ? layerRect.width - TOKEN_SIZE : 0) + 'px';
                token.style.top = tokenTop + 'px';
            } else {
                const colEl = this.#root.querySelector(`#dec-col-${col.key}`);
                if (!colEl) return;
                const colRect = colEl.getBoundingClientRect();
                const centerX = colRect.left - layerRect.left + colRect.width / 2;
                const newLeft = Math.round(centerX - TOKEN_SIZE / 2);

                token.style.transition = transition;
                token.style.opacity = '1';
                token.style.left = newLeft + 'px';
                token.style.top = tokenTop + 'px';
            }
        });
    }
}
