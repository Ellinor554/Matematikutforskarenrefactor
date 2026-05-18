import { PosSystemEngine, POS_COL_DEFS } from './PosSystemEngine.js';

const SNAP = 40;
let _zIdx = 10;

function makeSvgBlock(col) {
    const c = col.color;
    const v = col.value;
    if (v === 1000) {
        return `<svg width="48" height="48" viewBox="0 0 48 48" xmlns="http://www.w3.org/2000/svg">
            <polygon points="4,40 22,40 22,10 4,10" fill="${c}" stroke="#0008" stroke-width="1"/>
            <polygon points="22,10 40,4 40,34 22,40" fill="${c}cc" stroke="#0008" stroke-width="1"/>
            <polygon points="4,10 22,4 40,4 22,10" fill="${c}ee" stroke="#0008" stroke-width="1"/>
        </svg>`;
    }
    if (v === 100) {
        return `<svg width="38" height="38" viewBox="0 0 38 38" xmlns="http://www.w3.org/2000/svg">
            <rect x="4" y="8" width="26" height="26" fill="${c}" stroke="#0008" stroke-width="1"/>
            <polygon points="4,8 12,2 38,2 30,8" fill="${c}ee" stroke="#0008" stroke-width="1"/>
            <polygon points="30,8 38,2 38,28 30,34" fill="${c}cc" stroke="#0008" stroke-width="1"/>
        </svg>`;
    }
    if (v === 10) {
        return `<svg width="16" height="44" viewBox="0 0 16 44" xmlns="http://www.w3.org/2000/svg">
            <rect x="2" y="4" width="10" height="36" fill="${c}" stroke="#0008" stroke-width="1" rx="2"/>
        </svg>`;
    }
    return `<svg width="20" height="20" viewBox="0 0 20 20" xmlns="http://www.w3.org/2000/svg">
        <circle cx="10" cy="10" r="8" fill="${c}" stroke="#0008" stroke-width="1.5"/>
    </svg>`;
}

function makeSvgPengar(col) {
    const c = col.color;
    const v = col.value;
    if (v >= 100) {
        const lbl = v === 1000 ? '1000' : '100';
        return `<svg width="64" height="36" viewBox="0 0 64 36" xmlns="http://www.w3.org/2000/svg">
            <rect x="2" y="2" width="60" height="32" rx="5" fill="${c}" stroke="#0006" stroke-width="1.5"/>
            <text x="32" y="21" text-anchor="middle" font-size="${v===1000?'10':'13'}" font-weight="bold" fill="${col.textColor}" font-family="Nunito,sans-serif">${lbl} kr</text>
        </svg>`;
    }
    if (v === 10) {
        return `<svg width="36" height="36" viewBox="0 0 36 36" xmlns="http://www.w3.org/2000/svg">
            <circle cx="18" cy="18" r="16" fill="${c}" stroke="#0006" stroke-width="1.5"/>
            <text x="18" y="23" text-anchor="middle" font-size="11" font-weight="bold" fill="${col.textColor}" font-family="Nunito,sans-serif">10</text>
        </svg>`;
    }
    return `<svg width="28" height="28" viewBox="0 0 28 28" xmlns="http://www.w3.org/2000/svg">
        <circle cx="14" cy="14" r="12" fill="${c}" stroke="#0006" stroke-width="1.5"/>
        <text x="14" y="19" text-anchor="middle" font-size="11" font-weight="bold" fill="${col.textColor}" font-family="Nunito,sans-serif">1</text>
    </svg>`;
}

function makeDraggableLocal(el, workspace) {
    let startX, startY, origX, origY;

    function onMove(e) {
        const dx = e.clientX - startX;
        const dy = e.clientY - startY;
        el.dataset.x = origX + dx;
        el.dataset.y = origY + dy;
        updateTransformLocal(el);
    }

    function onUp() {
        el.releasePointerCapture && el.releasePointerCapture(this._pid);
        document.removeEventListener('pointermove', onMove);
        document.removeEventListener('pointerup', onUp);
    }

    el.addEventListener('pointerdown', e => {
        if (e.button && e.button !== 0) return;
        if (e.target.classList.contains('pos-resize-handle')) return;
        e.stopPropagation();
        startX = e.clientX;
        startY = e.clientY;
        origX = parseFloat(el.dataset.x) || 0;
        origY = parseFloat(el.dataset.y) || 0;
        el.style.zIndex = ++_zIdx;
        el.setPointerCapture(e.pointerId);
        onMove._pid = e.pointerId;
        el.addEventListener('pointermove', onMove);
        el.addEventListener('pointerup', () => {
            el.removeEventListener('pointermove', onMove);
        }, { once: true });
        e.preventDefault();
    });
}

function updateTransformLocal(el) {
    el.style.left = (parseFloat(el.dataset.x) || 0) + 'px';
    el.style.top  = (parseFloat(el.dataset.y) || 0) + 'px';
    el.style.transform = `rotate(${el.dataset.rot || 0}deg) scale(${el.dataset.scale || 1})`;
}

function addResizeHandleLocal(el) {
    const handle = document.createElement('div');
    handle.className = 'pos-resize-handle';
    handle.style.cssText = 'position:absolute;bottom:2px;right:2px;width:12px;height:12px;cursor:se-resize;z-index:1;font-size:10px;color:#888;text-align:center;line-height:12px;';
    handle.textContent = '⌟';
    let startX, startScale;
    handle.addEventListener('pointerdown', e => {
        e.stopPropagation();
        startX = e.clientX;
        startScale = parseFloat(el.dataset.scale) || 1;
        handle.setPointerCapture(e.pointerId);
        function onMove(e) {
            const ds = (e.clientX - startX) * 0.01;
            el.dataset.scale = Math.max(0.3, Math.min(4, startScale + ds));
            updateTransformLocal(el);
        }
        function onUp() {
            handle.removeEventListener('pointermove', onMove);
            handle.removeEventListener('pointerup', onUp);
        }
        handle.addEventListener('pointermove', onMove);
        handle.addEventListener('pointerup', onUp);
        e.preventDefault();
    });
    el.appendChild(handle);
}

function snapToGrid(el) {
    const x = Math.round((parseFloat(el.dataset.x) || 0) / SNAP) * SNAP;
    const y = Math.round((parseFloat(el.dataset.y) || 0) / SNAP) * SNAP;
    el.dataset.x = x;
    el.dataset.y = y;
    updateTransformLocal(el);
}

export class PosSystemView {
    #engine;
    #root = null;
    #workspace = null;
    #countDisplay = null;
    #mode = 'block';

    constructor(engine) {
        this.#engine = engine;
    }

    mount(parentEl) {
        this.#root = document.createElement('section');
        this.#root.className = 'tool-view flex flex-row h-full overflow-hidden';

        this.#root.innerHTML = `
            <aside class="tool-sidebar flex flex-col gap-3 p-3 overflow-y-auto" style="min-width:210px;max-width:210px;">
                <div class="text-xs font-bold text-muted uppercase tracking-wide">Typ</div>
                <div class="flex gap-2">
                    <button data-pmode="block" class="flex-1 px-2 py-1 rounded font-bold text-sm border-2 border-blue-400 bg-blue-50 text-blue-700">Block</button>
                    <button data-pmode="pengar" class="flex-1 px-2 py-1 rounded font-bold text-sm border-2 border-gray-300 text-gray-600 bg-white">Pengar</button>
                </div>
                <hr/>
                <div class="text-xs font-bold text-muted uppercase tracking-wide">Lägg till</div>
                <div id="pos-add-btns" class="flex flex-col gap-2"></div>
                <hr/>
                <div class="text-xs font-bold text-muted uppercase tracking-wide">Visa kolumner</div>
                <div id="pos-col-checks" class="flex flex-col gap-1 text-xs"></div>
                <div class="flex items-center gap-2 text-xs">
                    <input id="pos-show-cols" type="checkbox" checked/>
                    <label for="pos-show-cols">Visa kolumngränser</label>
                </div>
                <div class="flex items-center gap-2 text-xs">
                    <input id="pos-auto-exchange" type="checkbox" checked/>
                    <label for="pos-auto-exchange">Auto-växla (10→1)</label>
                </div>
                <hr/>
                <div id="pos-count-display" class="flex flex-col gap-1 text-sm font-mono"></div>
                <hr/>
                <div class="flex gap-2">
                    <button id="pos-snap-btn" class="flex-1 tool-btn text-xs">Snäpp till rutnät</button>
                    <button id="pos-clear-btn" class="flex-1 tool-btn-danger text-xs">Rensa</button>
                </div>
                <div class="text-xs text-muted bg-blue-50 rounded p-2 mt-1">
                    💡 Klicka på en bit för att lägga till den. Dra för att flytta. Dubbelklicka för att ta bort.
                </div>
            </aside>
            <div class="flex-1 relative overflow-hidden">
                <div id="pos-workspace" class="workspace" style="background-size:40px 40px;"></div>
                <div id="pos-col-headers" class="absolute top-0 left-0 w-full h-full pointer-events-none" style="z-index:5;"></div>
            </div>`;

        this.#workspace = this.#root.querySelector('#pos-workspace');
        this.#countDisplay = this.#root.querySelector('#pos-count-display');

        this.#buildAddButtons();
        this.#buildColChecks();
        this.#bindControls();
        this.#engine.subscribe(() => this.#renderSettings());
        this.#renderSettings();

        parentEl.appendChild(this.#root);
        return this.#root;
    }

    #buildAddButtons() {
        const container = this.#root.querySelector('#pos-add-btns');
        container.innerHTML = '';
        for (const col of POS_COL_DEFS) {
            const btn = document.createElement('button');
            btn.dataset.addType = col.key;
            btn.className = 'flex items-center gap-2 px-2 py-1 rounded font-bold text-xs border-2 cursor-pointer hover:opacity-80 transition-opacity';
            btn.style.cssText = `background:${col.color}22;border-color:${col.color};color:${col.color === '#F9A825' ? '#7a5c00' : col.color};`;
            btn.innerHTML = `<span>${col.label}</span><span class="ml-auto text-xs opacity-60">${col.value}</span>`;
            btn.addEventListener('click', () => this.#addPiece(col.key));
            container.appendChild(btn);
        }
    }

    #buildColChecks() {
        const container = this.#root.querySelector('#pos-col-checks');
        container.innerHTML = '';
        for (const col of POS_COL_DEFS) {
            const label = document.createElement('label');
            label.className = 'flex items-center gap-2 cursor-pointer';
            label.innerHTML = `<input type="checkbox" data-col-key="${col.key}" checked class="mr-1"/>
                <span class="font-bold" style="color:${col.color === '#F9A825' ? '#7a5c00' : col.color};">${col.label}</span>`;
            const cb = label.querySelector('input');
            cb.addEventListener('change', () => this.#engine.setVisibleCol(col.key, cb.checked));
            container.appendChild(label);
        }
    }

    #bindControls() {
        this.#root.querySelector('#pos-show-cols').addEventListener('change', e => this.#engine.setShowColumns(e.target.checked));
        this.#root.querySelector('#pos-auto-exchange').addEventListener('change', e => this.#engine.setAutoExchange(e.target.checked));
        this.#root.querySelector('#pos-snap-btn').addEventListener('click', () => {
            this.#workspace.querySelectorAll('.pos-piece').forEach(el => snapToGrid(el));
            this.#updateCounter();
        });
        this.#root.querySelector('#pos-clear-btn').addEventListener('click', () => {
            this.#workspace.innerHTML = '';
            this.#updateCounter();
        });
        this.#root.querySelectorAll('[data-pmode]').forEach(btn => {
            btn.addEventListener('click', () => {
                this.#mode = btn.dataset.pmode;
                this.#renderModeButtons();
            });
        });
    }

    #renderModeButtons() {
        this.#root.querySelectorAll('[data-pmode]').forEach(btn => {
            const active = btn.dataset.pmode === this.#mode;
            btn.className = `flex-1 px-2 py-1 rounded font-bold text-sm border-2 ${active ? 'border-blue-400 bg-blue-50 text-blue-700' : 'border-gray-300 text-gray-600 bg-white'}`;
        });
    }

    #addPiece(type) {
        const col = POS_COL_DEFS.find(c => c.key === type);
        if (!col) return;
        const ws = this.#workspace;
        const wsRect = ws.getBoundingClientRect();

        const el = document.createElement('div');
        el.className = 'pos-piece draggable-item';
        el.dataset.posType = type;
        el.style.cssText = 'position:absolute;cursor:grab;user-select:none;';
        el.innerHTML = this.#mode === 'block' ? makeSvgBlock(col) : makeSvgPengar(col);

        const randX = Math.floor(Math.random() * Math.max(1, (wsRect.width || 400) - 80));
        const randY = Math.floor(Math.random() * Math.max(1, (wsRect.height || 300) - 80));
        el.dataset.x = randX;
        el.dataset.y = randY;
        el.dataset.scale = '1';
        el.dataset.rot = '0';
        updateTransformLocal(el);

        el.addEventListener('dblclick', () => {
            el.remove();
            this.#updateCounter();
            if (this.#engine.getAutoExchange()) this.#checkAutoExchange();
        });

        makeDraggableLocal(el, ws);
        addResizeHandleLocal(el);

        el.addEventListener('pointerup', () => {
            setTimeout(() => {
                this.#updateCounter();
                if (this.#engine.getAutoExchange()) this.#checkAutoExchange();
            }, 50);
        });

        ws.appendChild(el);
        this.#updateCounter();
        if (this.#engine.getAutoExchange()) this.#checkAutoExchange();
    }

    #checkAutoExchange() {
        const ws = this.#workspace;
        const order = ['ental', 'tiotal', 'hundratal', 'tusental'];
        let changed = false;
        for (let i = 0; i < order.length - 1; i++) {
            const lowerKey = order[i];
            const upperKey = order[i + 1];
            const lowerEls = [...ws.querySelectorAll(`.pos-piece[data-pos-type="${lowerKey}"]`)];
            if (lowerEls.length >= 10) {
                for (let k = 0; k < 10; k++) lowerEls[k].remove();
                const col = POS_COL_DEFS.find(c => c.key === upperKey);
                if (col) {
                    const el = document.createElement('div');
                    el.className = 'pos-piece draggable-item';
                    el.dataset.posType = upperKey;
                    el.style.cssText = 'position:absolute;cursor:grab;user-select:none;';
                    el.innerHTML = this.#mode === 'block' ? makeSvgBlock(col) : makeSvgPengar(col);
                    el.dataset.x = Math.floor(Math.random() * 200);
                    el.dataset.y = Math.floor(Math.random() * 150);
                    el.dataset.scale = '1';
                    el.dataset.rot = '0';
                    updateTransformLocal(el);
                    el.addEventListener('dblclick', () => { el.remove(); this.#updateCounter(); });
                    makeDraggableLocal(el, ws);
                    addResizeHandleLocal(el);
                    ws.appendChild(el);
                    changed = true;
                }
            }
        }
        this.#updateCounter();
        if (changed) this.#checkAutoExchange();
    }

    #updateCounter() {
        const ws = this.#workspace;
        const counts = {};
        let total = 0;
        for (const col of POS_COL_DEFS) {
            const n = ws.querySelectorAll(`.pos-piece[data-pos-type="${col.key}"]`).length;
            counts[col.key] = n;
            total += n * col.value;
        }
        let html = '';
        for (const col of POS_COL_DEFS) {
            if (!this.#engine.getVisibleCols()[col.key]) continue;
            const n = counts[col.key];
            const cText = col.color === '#F9A825' ? '#7a5c00' : col.color;
            html += `<div class="flex justify-between"><span style="color:${cText};" class="font-bold">${col.label}:</span><span class="font-mono">${n}</span></div>`;
        }
        html += `<div class="flex justify-between font-bold border-t pt-1 mt-1"><span>Summa:</span><span>${total}</span></div>`;
        this.#countDisplay.innerHTML = html;
    }

    #renderSettings() {
        const state = this.#engine.getState();
        const headers = this.#root.querySelector('#pos-col-headers');
        headers.innerHTML = '';

        if (state.showColumns) {
            const visibleCols = POS_COL_DEFS.filter(c => state.visibleCols[c.key]);
            const n = visibleCols.length;
            if (n > 0) {
                for (let i = 0; i < n; i++) {
                    const col = visibleCols[i];
                    const pct = (i / n) * 100;
                    const w = 100 / n;
                    const header = document.createElement('div');
                    header.className = 'absolute flex items-center justify-center text-xs font-bold opacity-70 pointer-events-none';
                    header.style.cssText = `left:${pct}%;width:${w}%;top:0;height:28px;border-right:2px dashed ${col.color}44;background:${col.color}11;color:${col.color === '#F9A825' ? '#7a5c00' : col.color};`;
                    header.textContent = col.label;
                    headers.appendChild(header);
                }
            }
        }

        // Sync column checkboxes
        this.#root.querySelectorAll('[data-col-key]').forEach(cb => {
            cb.checked = state.visibleCols[cb.dataset.colKey];
        });
        this.#root.querySelector('#pos-show-cols').checked = state.showColumns;
        this.#root.querySelector('#pos-auto-exchange').checked = state.autoExchange;
        this.#updateCounter();
    }
}
