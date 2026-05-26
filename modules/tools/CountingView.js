// ═══════════════════════════════════════════════════════════════════════════
// modules/tools/CountingView.js
// View for the Räkning (Counting) tool — three modes:
//   • Tiokompisar: drag balls between two zones, see the sum stay at 10
//   • Multiplikationskvadrat: 10×10 grid with hover highlight on row+column
//   • Divisionskvadrat: same grid but click cells to mark them
// ═══════════════════════════════════════════════════════════════════════════

import { CountingEngine } from './CountingEngine.js';

export class CountingView {
    #engine;
    #unsubscribe;
    #root;
    #els = {};
    #lastReading = null;

    constructor(engine = new CountingEngine()) { this.#engine = engine; }
    get engine() { return this.#engine; }

    mount(parent) {
        this.#root = document.createElement('section');
        this.#root.id = 'view-counting';
        this.#root.className = 'view-section flex-row h-full';
        this.#root.innerHTML = this.#template();
        parent.appendChild(this.#root);

        this.#cacheRefs();
        this.#wireEvents();

        this.#unsubscribe = this.#engine.subscribe(reading => {
            this.#lastReading = reading;
            this.#render(reading);
        });

        return this.#root;
    }

    onEnter() {}
    onLeave() {}
    destroy() {
        this.#unsubscribe?.();
        this.#root?.remove();
    }

    #template() {
        return `
        <aside class="w-64 bg-soft-surface shadow-md z-10 p-5 flex flex-col gap-4
                      overflow-y-auto border-r border-soft-border shrink-0">
            <h3 class="font-bold text-soft-text text-sm uppercase tracking-wider text-soft-muted">
                Välj övning
            </h3>
            <div class="flex flex-col gap-2">
                <button data-mode="tiokompisar"
                        class="counting-mode-btn flex items-center gap-2 px-3 py-2 rounded-xl border font-bold text-sm">
                    <i class="fas fa-circle text-soft-pink"></i> Tiokompisar
                </button>
                <button data-mode="multiplikation"
                        class="counting-mode-btn flex items-center gap-2 px-3 py-2 rounded-xl border font-bold text-sm">
                    <i class="fas fa-times text-soft-blue"></i> Multiplikationskvadrat
                </button>
                <button data-mode="division"
                        class="counting-mode-btn flex items-center gap-2 px-3 py-2 rounded-xl border font-bold text-sm">
                    <i class="fas fa-divide text-soft-green"></i> Divisionskvadrat
                </button>
            </div>
            <div data-role="info-panel"
                 class="bg-soft-tealLight/15 border border-soft-tealLight/30 rounded-xl p-3 text-sm text-soft-text"></div>
            <button data-action="reset"
                    class="bg-soft-text hover:bg-soft-muted text-white p-2 rounded-lg text-sm font-semibold mt-auto">
                <i class="fas fa-trash mr-1"></i> Återställ
            </button>
        </aside>

        <div data-role="workspace" class="flex-1 flex flex-col items-center justify-center p-4 overflow-auto">
            <div data-role="tiokompisar-zone" class="w-full max-w-2xl"></div>
            <div data-role="grid-zone" class="w-full max-w-2xl"></div>
        </div>`;
    }

    #cacheRefs() {
        const $  = sel => this.#root.querySelector(sel);
        const $$ = sel => this.#root.querySelectorAll(sel);
        this.#els = {
            modeBtns:        $$('[data-mode]'),
            infoPanel:       $('[data-role="info-panel"]'),
            tiokompisarZone: $('[data-role="tiokompisar-zone"]'),
            gridZone:        $('[data-role="grid-zone"]'),
        };
    }

    #wireEvents() {
        this.#root.addEventListener('click', evt => {
            const modeBtn = evt.target.closest('[data-mode]');
            if (modeBtn) {
                this.#engine.setMode(modeBtn.dataset.mode);
                return;
            }
            if (evt.target.closest('[data-action="reset"]')) {
                this.#engine.reset();
            }
        });
    }

    #render(reading) {
        for (const btn of this.#els.modeBtns) {
            btn.classList.toggle('active', btn.dataset.mode === reading.mode);
        }

        if (reading.mode === 'tiokompisar') {
            this.#els.tiokompisarZone.style.display = '';
            this.#els.gridZone.style.display = 'none';
            this.#renderTiokompisar(reading);
            this.#els.infoPanel.innerHTML =
                `<i class="fas fa-lightbulb mr-1"></i>Dra bollarna mellan zonerna. Summan blir alltid 10!`;
        } else {
            this.#els.tiokompisarZone.style.display = 'none';
            this.#els.gridZone.style.display = '';
            this.#renderGrid(reading);
            if (reading.mode === 'multiplikation') {
                this.#els.infoPanel.innerHTML =
                    `<i class="fas fa-lightbulb mr-1"></i>För muspekaren över rutorna för att se rad och kolumn.`;
            } else {
                this.#els.infoPanel.innerHTML =
                    `<i class="fas fa-lightbulb mr-1"></i>Klicka på rutorna för att markera dem.`;
            }
        }
    }

    #renderTiokompisar(reading) {
        const zone = this.#els.tiokompisarZone;
        const { leftCount, rightCount } = reading;

        zone.innerHTML = `
            <div class="text-center mb-4">
                <span class="text-4xl font-extrabold text-soft-blue">${leftCount}</span>
                <span class="text-3xl font-bold text-soft-muted mx-3">+</span>
                <span class="text-4xl font-extrabold text-soft-pink">${rightCount}</span>
                <span class="text-3xl font-bold text-soft-muted mx-3">=</span>
                <span class="text-4xl font-extrabold text-soft-green">10</span>
            </div>
            <div class="flex gap-4">
                <div data-zone="left"
                     class="flex-1 min-h-48 bg-soft-blueLight/10 border-2 border-soft-blueLight/30
                            border-dashed rounded-2xl p-4 flex flex-wrap gap-2 content-start"></div>
                <div data-zone="right"
                     class="flex-1 min-h-48 bg-soft-pinkLight/10 border-2 border-soft-pinkLight/30
                            border-dashed rounded-2xl p-4 flex flex-wrap gap-2 content-start"></div>
            </div>`;

        const leftZone  = zone.querySelector('[data-zone="left"]');
        const rightZone = zone.querySelector('[data-zone="right"]');
        for (let i = 0; i < leftCount; i++) {
            leftZone.appendChild(this.#makeBall(i, 'left'));
        }
        for (let i = 0; i < rightCount; i++) {
            rightZone.appendChild(this.#makeBall(leftCount + i, 'right'));
        }

        for (const z of [leftZone, rightZone]) {
            z.addEventListener('dragover', e => e.preventDefault());
            z.addEventListener('drop', e => {
                e.preventDefault();
                const which = z.dataset.zone;
                this.#engine.moveBall(which);
            });
        }
    }

    #makeBall(id, zone) {
        const ball = document.createElement('div');
        ball.className = 'w-10 h-10 rounded-full cursor-grab shadow';
        ball.style.background = zone === 'left' ? '#5b80a5' : '#a85c72';
        ball.draggable = true;
        ball.dataset.ballId = id;
        ball.dataset.zone = zone;
        ball.addEventListener('dragstart', e => {
            e.dataTransfer.setData('text/plain', String(id));
        });
        return ball;
    }

    #renderGrid(reading) {
        const zone = this.#els.gridZone;
        const { mode, selectedCells } = reading;

        let html = '<div class="grid grid-cols-10 gap-1 max-w-fit mx-auto">';
        for (let r = 1; r <= 10; r++) {
            for (let c = 1; c <= 10; c++) {
                const key = `${r},${c}`;
                const selected = selectedCells?.has?.(key) || selectedCells?.includes?.(key);
                html += `<button data-cell="${r},${c}"
                                 class="w-10 h-10 border border-soft-border rounded text-sm font-bold transition-colors
                                        ${selected ? 'bg-soft-blue text-white' : 'bg-soft-bg hover:bg-soft-blueLight/40'}">${r * c}</button>`;
            }
        }
        html += '</div>';
        zone.innerHTML = html;

        // Wire grid interactions
        const cells = zone.querySelectorAll('[data-cell]');
        for (const cell of cells) {
            if (mode === 'multiplikation') {
                cell.addEventListener('mouseenter', () => {
                    const [r, c] = cell.dataset.cell.split(',').map(Number);
                    for (const other of cells) {
                        const [or, oc] = other.dataset.cell.split(',').map(Number);
                        if (or === r || oc === c) {
                            other.style.background = '#dbeafe';
                        }
                    }
                });
                cell.addEventListener('mouseleave', () => {
                    for (const other of cells) other.style.background = '';
                });
            } else if (mode === 'division') {
                cell.addEventListener('click', () => {
                    this.#engine.toggleCell(cell.dataset.cell);
                });
            }
        }
    }
}
