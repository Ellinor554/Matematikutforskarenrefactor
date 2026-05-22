// ═══════════════════════════════════════════════════════════════════════════
// modules/tools/ScaleView.js
// View for the Skala och mått tool: two canvases (Verklighet / Ritning),
// sidebar with object & ratio buttons, dimension inputs, and hover ring.
// ═══════════════════════════════════════════════════════════════════════════

import { ScaleEngine, SCALE_OBJECTS, SCALE_RATIOS, fmtCm, fmtCmVal } from './ScaleEngine.js';

const CELL_PX = 40;
const MARGIN_TOP_PX = 70;

const OBJECT_BUTTONS = [
    { key: 'skruv',        emoji: '🔩', label: 'Skruv' },
    { key: 'insekt',       emoji: '🐛', label: 'Insekt' },
    { key: 'gem',          emoji: '📎', label: 'Gem' },
    { key: 'blyertspenna', emoji: '✏️', label: 'Blyertspenna' },
    { key: 'rektangel',    emoji: '▬',  label: 'Rektangel' },
    { key: 'kvadrat',      emoji: '□',  label: 'Kvadrat' },
];

const REAL_COLOR      = '#5b80a5';
const DRAWING_COLOR   = '#b8a36e';
const HIGHLIGHT_COLOR = '#f5a623';

export class ScaleView {
    #engine;
    #unsubscribe;
    #root;
    #els = {};
    #resizeListener = null;
    #lastReading = null;

    constructor(engine = new ScaleEngine()) { this.#engine = engine; }
    get engine() { return this.#engine; }

    mount(parent) {
        this.#root = document.createElement('section');
        this.#root.id = 'view-scale';
        this.#root.className = 'flex-row h-full';
        this.#root.innerHTML = this.#template();
        parent.appendChild(this.#root);

        this.#cacheRefs();
        this.#wireEvents();

        this.#unsubscribe = this.#engine.subscribe(reading => {
            this.#lastReading = reading;
            this.#render(reading);
        });

        this.#resizeListener = () => this.#resizeAndDraw();
        window.addEventListener('resize', this.#resizeListener);

        return this.#root;
    }

    onEnter() { this.#resizeAndDraw(); }
    onLeave() {}
    destroy() {
        if (this.#resizeListener) window.removeEventListener('resize', this.#resizeListener);
        this.#unsubscribe?.();
        this.#root?.remove();
    }

    #template() {
        const objBtns = OBJECT_BUTTONS.map(o => `
            <button data-set-object="${o.key}" class="scale-obj-btn">${o.emoji} ${o.label}</button>`).join('');

        const reductionBtns = SCALE_RATIOS.reductions.map(r => `
            <button data-set-ratio="${r.n}:${r.d}"
                    class="scale-btn bg-soft-blueLight/20 text-soft-blue">${r.n}:${r.d}</button>`).join('');

        const enlargementBtns = SCALE_RATIOS.enlargements.map(r => {
            const span = r.n === 10 ? ' col-span-2' : '';
            return `<button data-set-ratio="${r.n}:${r.d}"
                            class="scale-btn bg-soft-greenLight/20 text-soft-green${span}">${r.n}:${r.d}</button>`;
        }).join('');

        return `
        <aside id="scale-sidebar"
               class="w-56 bg-soft-surface shadow-md z-10 p-3 flex flex-col gap-2
                      overflow-y-auto border-r border-soft-border shrink-0">

            <p class="text-xs font-800 text-soft-muted uppercase tracking-widest mt-1">Välj objekt</p>
            <div class="grid grid-cols-2 gap-1.5">${objBtns}</div>

            <hr class="border-soft-border my-0.5">

            <p class="text-xs font-800 text-soft-muted uppercase tracking-widest">Förminskning</p>
            <div class="grid grid-cols-2 gap-1.5">${reductionBtns}</div>

            <p class="text-xs font-800 text-soft-muted uppercase tracking-widest">Original</p>
            <button data-set-ratio="1:1"
                    class="scale-btn bg-soft-yellow/30 text-soft-yellowDark border border-soft-yellow">
                1:1 (Original)
            </button>

            <p class="text-xs font-800 text-soft-muted uppercase tracking-widest">Förstoring</p>
            <div class="grid grid-cols-2 gap-1.5">${enlargementBtns}</div>

            <div class="scale-tips-box mt-1">
                <i class="fas fa-info-circle"></i> <strong>Tips:</strong>
                Håll muspekaren över ritningen till höger för att se sambandet med originalet.
            </div>

            <div id="scale-matt-section" class="mt-auto flex flex-col gap-1.5">
                <div class="flex items-center justify-between">
                    <span class="text-xs font-800 text-soft-muted uppercase tracking-widest">Mått</span>
                    <label class="flex items-center gap-1 text-xs font-700 text-soft-muted cursor-pointer">
                        <input type="checkbox" data-role="lock-prop"> Lås prop.
                    </label>
                </div>
                <div class="flex items-center gap-1.5">
                    <span class="text-xs font-700 text-soft-text w-10">Bredd:</span>
                    <input type="number" data-role="input-w" class="scale-matt-input"
                           min="0.1" max="50" step="0.1">
                    <span class="text-xs text-soft-muted">cm</span>
                </div>
                <div class="flex items-center gap-1.5">
                    <span class="text-xs font-700 text-soft-text w-10">Höjd:</span>
                    <input type="number" data-role="input-h" class="scale-matt-input"
                           min="0.1" max="50" step="0.1">
                    <span class="text-xs text-soft-muted">cm</span>
                </div>
                <div class="text-xs text-soft-muted">
                    Ritning bredd:
                    <span data-role="label-rw" class="font-bold" style="color:#b8a36e;">0,800 cm</span>
                </div>
                <div class="text-xs text-soft-muted">
                    Ritning höjd:
                    <span data-role="label-rh" class="font-bold text-soft-green">3 cm</span>
                </div>
            </div>
        </aside>

        <div class=
