import { ScaleEngine, SCALE_OBJECTS } from './ScaleEngine.js';

const CELL = 40;
const REAL_COLOR = '#5b80a5';
const DRAW_COLOR = '#b8a36e';

function drawDimLines(ctx, x, y, w, h, wLabel, hLabel) {
    const tickLen = 6;
    ctx.save();
    ctx.strokeStyle = '#555';
    ctx.fillStyle = '#555';
    ctx.lineWidth = 1.2;
    ctx.font = '11px Nunito,sans-serif';
    ctx.textAlign = 'center';
    // Width line above
    ctx.beginPath(); ctx.moveTo(x, y - 14); ctx.lineTo(x + w, y - 14); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(x, y - 14 - tickLen); ctx.lineTo(x, y - 14 + tickLen); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(x + w, y - 14 - tickLen); ctx.lineTo(x + w, y - 14 + tickLen); ctx.stroke();
    ctx.fillText(wLabel, x + w / 2, y - 18);
    // Height line left
    ctx.textAlign = 'right';
    ctx.beginPath(); ctx.moveTo(x - 14, y); ctx.lineTo(x - 14, y + h); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(x - 14 - tickLen, y); ctx.lineTo(x - 14 + tickLen, y); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(x - 14 - tickLen, y + h); ctx.lineTo(x - 14 + tickLen, y + h); ctx.stroke();
    ctx.save();
    ctx.translate(x - 18, y + h / 2);
    ctx.rotate(-Math.PI / 2);
    ctx.textAlign = 'center';
    ctx.fillText(hLabel, 0, 0);
    ctx.restore();
    ctx.restore();
}

function drawObject(ctx, key, x, y, wPx, hPx, color) {
    ctx.save();
    ctx.fillStyle = color;
    ctx.strokeStyle = color + 'cc';
    ctx.lineWidth = 2;
    if (key === 'gem') {
        ctx.beginPath();
        ctx.moveTo(x + wPx / 2, y);
        ctx.lineTo(x + wPx, y + hPx * 0.3);
        ctx.lineTo(x + wPx, y + hPx * 0.7);
        ctx.lineTo(x + wPx / 2, y + hPx);
        ctx.lineTo(x, y + hPx * 0.7);
        ctx.lineTo(x, y + hPx * 0.3);
        ctx.closePath();
        ctx.fill(); ctx.stroke();
    } else if (key === 'skruv') {
        ctx.fillRect(x, y, wPx, hPx * 0.15);
        ctx.fillRect(x + wPx * 0.2, y + hPx * 0.15, wPx * 0.6, hPx * 0.85);
        ctx.strokeRect(x + wPx * 0.2, y + hPx * 0.15, wPx * 0.6, hPx * 0.85);
    } else if (key === 'insekt') {
        // Body oval
        ctx.beginPath();
        ctx.ellipse(x + wPx / 2, y + hPx / 2, wPx / 2, hPx / 2, 0, 0, Math.PI * 2);
        ctx.fill(); ctx.stroke();
        // Head
        ctx.beginPath();
        ctx.arc(x + wPx / 2, y + hPx * 0.1, wPx * 0.3, 0, Math.PI * 2);
        ctx.fill();
        // Legs
        ctx.lineWidth = 1;
        for (let i = 0; i < 3; i++) {
            const ly = y + hPx * 0.35 + i * hPx * 0.2;
            ctx.beginPath(); ctx.moveTo(x, ly); ctx.lineTo(x - wPx * 0.8, ly + hPx * 0.1); ctx.stroke();
            ctx.beginPath(); ctx.moveTo(x + wPx, ly); ctx.lineTo(x + wPx * 1.8, ly + hPx * 0.1); ctx.stroke();
        }
    } else if (key === 'blyertspenna') {
        ctx.fillRect(x, y, wPx, hPx * 0.85);
        ctx.strokeRect(x, y, wPx, hPx * 0.85);
        ctx.beginPath();
        ctx.moveTo(x, y + hPx * 0.85);
        ctx.lineTo(x + wPx / 2, y + hPx);
        ctx.lineTo(x + wPx, y + hPx * 0.85);
        ctx.fill();
    } else {
        // rektangel / kvadrat
        ctx.fillRect(x, y, wPx, hPx);
        ctx.strokeRect(x, y, wPx, hPx);
    }
    ctx.restore();
}

export class ScaleView {
    #engine;
    #root = null;
    #leftCanvas = null;
    #rightCanvas = null;
    #hoverRight = false;
    #wInput = null;
    #hInput = null;
    #infoOverlay = null;

    constructor(engine) {
        this.#engine = engine;
    }

    mount(parentEl) {
        this.#root = document.createElement('section');
        this.#root.className = 'tool-view flex flex-row h-full overflow-hidden';
        this.#root.innerHTML = `
            <aside class="tool-sidebar flex flex-col gap-2 p-3 overflow-y-auto" style="min-width:210px;max-width:210px;">
                <div class="text-xs font-bold text-muted uppercase tracking-wide">Objekt</div>
                <div id="scale-obj-btns" class="flex flex-col gap-1"></div>
                <hr/>
                <div class="text-xs font-bold text-muted uppercase tracking-wide">Skala (ritning:verklighet)</div>
                <div id="scale-preset-btns" class="flex flex-wrap gap-1"></div>
                <hr/>
                <div class="text-xs font-bold text-muted uppercase tracking-wide">Mått (verklighet)</div>
                <div class="flex gap-1 items-center text-xs">
                    <span class="w-8">Bredd</span>
                    <input id="scale-w-input" type="number" step="0.1" min="0.1" class="tool-input flex-1 px-1 py-1 rounded border text-sm scale-matt-input"/>
                    <span>cm</span>
                </div>
                <div class="flex gap-1 items-center text-xs">
                    <span class="w-8">Höjd</span>
                    <input id="scale-h-input" type="number" step="0.1" min="0.1" class="tool-input flex-1 px-1 py-1 rounded border text-sm scale-matt-input"/>
                    <span>cm</span>
                </div>
                <label class="flex items-center gap-2 text-xs cursor-pointer">
                    <input id="scale-lock" type="checkbox"/> Låst förhållande
                </label>
                <hr/>
                <div id="scale-info-overlay" class="text-sm bg-amber-50 rounded p-2 text-gray-700 min-h-10"></div>
                <div class="text-xs text-muted bg-blue-50 rounded p-2 mt-auto">
                    💡 Hovra över ritningen för att markera originalet. Ändra skala och mått.
                </div>
            </aside>
            <div class="flex-1 flex flex-row overflow-hidden">
                <div class="flex-1 flex flex-col items-center overflow-hidden p-2">
                    <div class="text-xs font-bold text-blue-600 mb-1">Verklighet (1:1)</div>
                    <canvas id="scale-left-canvas" class="border rounded bg-white" style="max-width:100%;max-height:100%;"></canvas>
                </div>
                <div id="scale-divider" class="w-1 bg-gray-300 flex-shrink-0"></div>
                <div class="flex-1 flex flex-col items-center overflow-hidden p-2">
                    <div id="scale-right-label" class="text-xs font-bold text-amber-600 mb-1">Ritning</div>
                    <canvas id="scale-right-canvas" class="border rounded bg-white" style="max-width:100%;max-height:100%;cursor:crosshair;" ></canvas>
                </div>
            </div>`;

        this.#leftCanvas = this.#root.querySelector('#scale-left-canvas');
        this.#rightCanvas = this.#root.querySelector('#scale-right-canvas');
        this.#infoOverlay = this.#root.querySelector('#scale-info-overlay');
        this.#wInput = this.#root.querySelector('#scale-w-input');
        this.#hInput = this.#root.querySelector('#scale-h-input');

        this.#buildObjButtons();
        this.#buildPresetButtons();
        this.#bindControls();
        this.#engine.subscribe(() => this.#render());
        this.#render();

        parentEl.appendChild(this.#root);
        return this.#root;
    }

    #buildObjButtons() {
        const container = this.#root.querySelector('#scale-obj-btns');
        for (const obj of SCALE_OBJECTS) {
            const btn = document.createElement('button');
            btn.className = 'scale-obj-btn tool-btn text-xs text-left';
            btn.dataset.objKey = obj.key;
            btn.textContent = obj.label;
            btn.addEventListener('click', () => this.#engine.setObject(obj.key));
            container.appendChild(btn);
        }
    }

    #buildPresetButtons() {
        const container = this.#root.querySelector('#scale-preset-btns');
        const presets = [
            [1,1],[1,2],[1,4],[1,5],[1,10],[2,1],[4,1],[5,1],[10,1]
        ];
        for (const [n, d] of presets) {
            const btn = document.createElement('button');
            btn.className = 'scale-btn tool-btn text-xs';
            btn.dataset.num = n;
            btn.dataset.den = d;
            btn.textContent = `${n}:${d}`;
            btn.addEventListener('click', () => this.#engine.setScale(n, d));
            container.appendChild(btn);
        }
    }

    #bindControls() {
        this.#wInput.addEventListener('change', () => {
            const v = parseFloat(this.#wInput.value);
            if (v > 0) this.#engine.setWidth(v);
        });
        this.#hInput.addEventListener('change', () => {
            const v = parseFloat(this.#hInput.value);
            if (v > 0) this.#engine.setHeight(v);
        });
        this.#root.querySelector('#scale-lock').addEventListener('change', e => {
            this.#engine.setLockProportions(e.target.checked);
        });
        this.#rightCanvas.addEventListener('mouseenter', () => { this.#hoverRight = true; this.#render(); });
        this.#rightCanvas.addEventListener('mouseleave', () => { this.#hoverRight = false; this.#render(); });
    }

    onEnter() {
        this.#resizeCanvases();
        this.#render();
    }

    #resizeCanvases() {
        const state = this.#engine.getState();
        const maxW = Math.max(200, state.wCm * CELL + 100);
        const maxH = Math.max(200, state.hCm * CELL + 100);
        const sz = Math.min(Math.max(maxW, maxH), 400);
        this.#leftCanvas.width = sz;
        this.#leftCanvas.height = sz;
        this.#rightCanvas.width = sz;
        this.#rightCanvas.height = sz;
    }

    #render() {
        const state = this.#engine.getState();
        this.#wInput.value = state.wCm;
        this.#hInput.value = state.hCm;
        this.#root.querySelector('#scale-lock').checked = state.lockProportions;

        // Highlight active obj button
        this.#root.querySelectorAll('[data-obj-key]').forEach(btn => {
            btn.style.fontWeight = btn.dataset.objKey === state.activeKey ? '900' : '';
            btn.style.background = btn.dataset.objKey === state.activeKey ? '#f0f4ff' : '';
        });

        // Highlight active scale button
        this.#root.querySelectorAll('[data-num]').forEach(btn => {
            const active = parseInt(btn.dataset.num) === state.numerator && parseInt(btn.dataset.den) === state.denominator;
            btn.style.fontWeight = active ? '900' : '';
            btn.style.background = active ? '#fef3c7' : '';
        });

        // Update scale label
        this.#root.querySelector('#scale-right-label').textContent = `Ritning (${state.numerator}:${state.denominator})`;

        const { wCm, hCm } = state;
        const { wCm: sw, hCm: sh } = state.scaled;
        const { fmtCm } = state;
        this.#infoOverlay.innerHTML = `
            <div><strong>Verklighet:</strong> ${fmtCm(wCm)} × ${fmtCm(hCm)}</div>
            <div><strong>Ritning:</strong> ${fmtCm(sw)} × ${fmtCm(sh)}</div>`;

        if (!this.#leftCanvas.width || this.#leftCanvas.width < 50) this.#resizeCanvases();

        this.#drawCanvas(this.#leftCanvas, state.activeKey, wCm, hCm, REAL_COLOR, this.#hoverRight);
        this.#drawCanvas(this.#rightCanvas, state.activeKey, sw, sh, DRAW_COLOR, false);
    }

    #drawCanvas(canvas, key, wCm, hCm, color, highlight) {
        const ctx = canvas.getContext('2d');
        const W = canvas.width;
        const H = canvas.height;
        ctx.clearRect(0, 0, W, H);

        // Grid
        ctx.strokeStyle = '#e8ecf0';
        ctx.lineWidth = 0.7;
        for (let x = 0; x < W; x += CELL) { ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, H); ctx.stroke(); }
        for (let y = 0; y < H; y += CELL) { ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(W, y); ctx.stroke(); }

        const wPx = wCm * CELL;
        const hPx = hCm * CELL;
        const ox = Math.max(30, (W - wPx) / 2);
        const oy = Math.max(30, (H - hPx) / 2);

        if (highlight) {
            ctx.save();
            ctx.strokeStyle = '#f59e0b';
            ctx.lineWidth = 3;
            ctx.setLineDash([6, 3]);
            ctx.strokeRect(ox - 8, oy - 8, wPx + 16, hPx + 16);
            ctx.restore();
        }

        drawObject(ctx, key, ox, oy, wPx, hPx, color);
        const { fmtCm } = this.#engine.getState();
        drawDimLines(ctx, ox, oy, wPx, hPx, fmtCm(wCm), fmtCm(hCm));
    }
}
