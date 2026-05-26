// ═══════════════════════════════════════════════════════════════════════════
// modules/tools/GeometryView.js
// Stage 1 — 2D shapes only.
// Sidebar with 8 shape-add buttons + rotate/delete/clear.
// Workspace with absolutely-positioned SVG wrappers; drag to move,
// click resize-handle to scale, click to select.
// ═══════════════════════════════════════════════════════════════════════════

import { GeometryEngine, SHAPE_DEFS_2D } from './GeometryEngine.js';

const SHAPE_BUTTONS = [
    { type: 'circle',        label: 'Cirkel',
      svg: '<circle cx="20" cy="20" r="16" fill="#ffffff" stroke="#000000" stroke-width="2"/>' },
    { type: 'triangle',      label: 'Triangel',
      svg: '<polygon points="20,5 37,35 3,35" fill="#ffffff" stroke="#000000" stroke-width="2" stroke-linejoin="round"/>' },
    { type: 'square',        label: 'Kvadrat',
      svg: '<rect x="5" y="5" width="30" height="30" fill="#ffffff" stroke="#000000" stroke-width="2"/>' },
    { type: 'rectangle',     label: 'Rektangel',
      svg: '<rect x="2" y="11" width="36" height="20" fill="#ffffff" stroke="#000000" stroke-width="2"/>' },
    { type: 'pentagon',      label: 'Pentagon',
      svg: '<polygon points="20,3 37,15 31,35 9,35 3,15" fill="#ffffff" stroke="#000000" stroke-width="2"/>' },
    { type: 'hexagon',       label: 'Hexagon',
      svg: '<polygon points="20,2 36,11 36,29 20,38 4,29 4,11" fill="#ffffff" stroke="#000000" stroke-width="2"/>' },
    { type: 'rhombus',       label: 'Romb',
      svg: '<polygon points="20,3 37,20 20,37 3,20" fill="#ffffff" stroke="#000000" stroke-width="2"/>' },
    { type: 'parallelogram', label: 'Parallellogram',
      svg: '<polygon points="10,32 4,8 30,8 36,32" fill="#ffffff" stroke="#000000" stroke-width="2"/>' },
];

const SHAPE_SIZE_PX = 200;
const SVG_VIEWBOX  = 120;

export class GeometryView {
    #engine;
    #unsubscribe;
    #root;
    #els = {};
    #shapeEls = new Map();
    #zCounter = 100;

    constructor(engine = new GeometryEngine()) { this.#engine = engine; }
    get engine() { return this.#engine; }

    mount(parent) {
        this.#root = document.createElement('section');
        this.#root.id = 'view-geometry';
        this.#root.className = 'view-section flex-row h-full';
        this.#root.innerHTML = this.#template();
        parent.appendChild(this.#root);

        this.#cacheRefs();
        this.#wireEvents();
        this.#unsubscribe = this.#engine.subscribe(reading => this.#render(reading));

        return this.#root;
    }

    onEnter() {}
    onLeave() {}
    destroy() {
        this.#unsubscribe?.();
        this.#root?.remove();
    }

    #template() {
        const shapeBtns = SHAPE_BUTTONS.map(b => `
            <button data-add-shape="${b.type}" class="geo-btn">
                <svg viewBox="0 0 40 40" width="28" height="28">${b.svg}</svg>${b.label}
            </button>`).join('');

        return `
        <div id="geometry-sidebar"
             class="w-64 bg-soft-surface shadow-md z-10 p-4 flex flex-col gap-3
                    overflow-y-auto border-r border-soft-border shrink-0">

            <h3 class="font-bold text-xs uppercase tracking-wider text-soft-muted">2D-former</h3>
            <div class="grid grid-cols-2 gap-1.5">${shapeBtns}</div>

            <hr class="border-soft-border my-1"/>

            <div class="flex gap-2">
                <button data-action="rotate-ccw"
                        class="flex-1 bg-soft-bg p-2 rounded text-soft-text hover:bg-[#eae8e3]
                               text-sm border border-soft-border"
                        title="Rotera moturs">
                    <i class="fas fa-undo"></i>
                </button>
                <button data-action="rotate-cw"
                        class="flex-1 bg-soft-bg p-2 rounded text-soft-text hover:bg-[#eae8e3]
                               text-sm border border-soft-border"
                        title="Rotera medurs">
                    <i class="fas fa-redo"></i>
                </button>
                <button data-action="delete"
                        class="flex-1 bg-soft-pinkLight/20 text-soft-pink p-2 rounded
                               hover:bg-soft-pinkLight/40 text-sm border border-soft-pinkLight/30"
                        title="Ta bort markerad">
                    <i class="fas fa-trash"></i>
                </button>
            </div>

            <div class="p-2.5 bg-soft-blueLight/15 rounded-xl text-xs text-soft-blue
                        border border-soft-blueLight/30 leading-relaxed">
                <i class="fas fa-search-plus mr-1"></i>
                <strong>Dra ⌟-hörnet</strong> för att ändra storlek.<br/>
                <i class="fas fa-arrows-alt mr-1 mt-1"></i>
                Dra på formen för att flytta.
            </div>

            <button data-action="clear"
                    class="bg-soft-text hover:bg-soft-muted text-white p-2 rounded
                           mt-auto text-sm font-semibold">
                Rensa allt
            </button>
        </div>

        <div class="flex-1 workspace relative" data-role="workspace" id="workspace-geometry"></div>`;
    }

    #cacheRefs() {
        this.#els = {
            workspace: this.#root.querySelector('[data-role="workspace"]'),
            addBtns:   this.#root.querySelectorAll('[data-add-shape]'),
        };
    }

    #wireEvents() {
        this.#root.addEventListener('click', evt => {
            const addBtn = evt.target.closest('[data-add-shape]');
            if (addBtn) {
                const ws = this.#els.workspace;
                const wsW = ws.clientWidth, wsH = ws.clientHeight;
                const x = (wsW / 2) - (SHAPE_SIZE_PX / 2) + (Math.random() * 60 - 30);
                const y = wsH - SHAPE_SIZE_PX - 20 + (Math.random() * 30 - 15);
                this.#engine.add2DShape(addBtn.dataset.addShape,
                                        Math.max(10, x), Math.max(10, y));
                return;
            }
            const action = evt.target.closest('[data-action]')?.dataset.action;
            if (action === 'rotate-ccw') this.#engine.rotateSelected(-15);
            if (action === 'rotate-cw')  this.#engine.rotateSelected(15);
            if (action === 'delete')     this.#engine.deleteSelected();
            if (action === 'clear')      this.#engine.clear();
        });

        this.#els.workspace.addEventListener('pointerdown', evt => {
            if (evt.target === this.#els.workspace) {
                this.#engine.select(null);
            }
        });
    }

    #render(reading) {
        const liveIds = new Set(reading.shapes.map(s => s.id));
        for (const [id, el] of this.#shapeEls) {
            if (!liveIds.has(id)) {
                el.remove();
                this.#shapeEls.delete(id);
            }
        }
        for (const shape of reading.shapes) {
            let el = this.#shapeEls.get(shape.id);
            if (!el) {
                el = this.#createShapeElement(shape);
                this.#shapeEls.set(shape.id, el);
                this.#els.workspace.appendChild(el);
            }
            this.#applyTransform(el, shape);
            el.classList.toggle('selected', shape.id === reading.selectedId);
        }
    }

    #applyTransform(el, shape) {
        el.style.left = shape.x + 'px';
        el.style.top  = shape.y + 'px';
        el.style.transform = `rotate(${shape.rotation}deg) scale(${shape.scale})`;
    }

    #createShapeElement(shape) {
        const wrapper = document.createElement('div');
        wrapper.className = 'draggable-item';
        wrapper.dataset.shapeType = shape.type;
        wrapper.dataset.shapeCat = '2d';
        wrapper.dataset.id = String(shape.id);
        wrapper.style.cssText =
            `position:absolute;width:${SHAPE_SIZE_PX}px;height:${SHAPE_SIZE_PX}px;` +
            `transform-origin:center center;`;
        wrapper.innerHTML =
            `<svg width="${SHAPE_SIZE_PX}" height="${SHAPE_SIZE_PX}" viewBox="0 0 ${SVG_VIEWBOX} ${SVG_VIEWBOX}">` +
            shapeSvg(shape.type) +
            '</svg>';

        const handle = document.createElement('div');
        handle.className = 'geo-resize-handle';
        handle.textContent = '⌟';
        wrapper.appendChild(handle);

        this.#wireShapeEvents(wrapper, shape.id, handle);
        return wrapper;
    }

    #wireShapeEvents(wrapper, shapeId, handle) {
        let dragging = false;
        let startPointerX = 0, startPointerY = 0;
        let startShapeX = 0, startShapeY = 0;

        wrapper.addEventListener('pointerdown', e => {
            if (e.target === handle) return;
            if (e.button !== 0) return;
            e.preventDefault();
            const reading = this.#engine.getReading();
            const shape = reading.shapes.find(s => s.id === shapeId);
            if (!shape) return;

            this.#engine.select(shapeId);
            this.#zCounter += 1;
            wrapper.style.zIndex = String(this.#zCounter);

            dragging = true;
            startPointerX = e.clientX;
            startPointerY = e.clientY;
            startShapeX = shape.x;
            startShapeY = shape.y;
            wrapper.setPointerCapture(e.pointerId);
        });

        wrapper.addEventListener('pointermove', e => {
            if (!dragging) return;
            const dx = e.clientX - startPointerX;
            const dy = e.clientY - startPointerY;
            this.#engine.setPosition(shapeId, startShapeX + dx, startShapeY + dy);
        });

        const endDrag = e => {
            if (!dragging) return;
            dragging = false;
            try { wrapper.releasePointerCapture(e.pointerId); } catch {}
        };
        wrapper.addEventListener('pointerup', endDrag);
        wrapper.addEventListener('pointercancel', endDrag);

        let resizing = false;
        let resizeStartX = 0, resizeStartScale = 1;

        handle.addEventListener('pointerdown', e => {
            if (e.button !== 0) return;
            e.preventDefault();
            e.stopPropagation();
            const reading = this.#engine.getReading();
            const shape = reading.shapes.find(s => s.id === shapeId);
            if (!shape) return;

            resizing = true;
            resizeStartX = e.clientX;
            resizeStartScale = shape.scale;
            handle.setPointerCapture(e.pointerId);
        });
        handle.addEventListener('pointermove', e => {
            if (!resizing) return;
            const delta = e.clientX - resizeStartX;
            const newScale = resizeStartScale + delta / SHAPE_SIZE_PX;
            this.#engine.setScale(shapeId, newScale);
        });
        const endResize = e => {
            if (!resizing) return;
            resizing = false;
            try { handle.releasePointerCapture(e.pointerId); } catch {}
        };
        handle.addEventListener('pointerup', endResize);
        handle.addEventListener('pointercancel', endResize);
    }
}

function shapeSvg(type) {
    switch (type) {
        case 'square':
            return `<rect x="10" y="10" width="100" height="100" fill="#ffffff" stroke="#000000" stroke-width="2"/>`;
        case 'circle':
            return `<circle cx="60" cy="60" r="50" fill="#ffffff" stroke="#000000" stroke-width="2"/>`;
        case 'triangle':
            return `<polygon points="60,10 110,100 10,100" fill="#ffffff" stroke="#000000" stroke-width="2" stroke-linejoin="round"/>`;
        case 'rectangle':
            return `<rect x="5" y="25" width="110" height="70" fill="#ffffff" stroke="#000000" stroke-width="2"/>`;
        case 'pentagon': {
            const pts = Array.from({ length: 5 }, (_, i) => {
                const a = (i * 72 - 90) * Math.PI / 180;
                return `${(60 + 50 * Math.cos(a)).toFixed(1)},${(60 + 50 * Math.sin(a)).toFixed(1)}`;
            }).join(' ');
            return `<polygon points="${pts}" fill="#ffffff" stroke="#000000" stroke-width="2"/>`;
        }
        case 'hexagon': {
            const pts = Array.from({ length: 6 }, (_, i) => {
                const a = (i * 60 - 90) * Math.PI / 180;
                return `${(60 + 50 * Math.cos(a)).toFixed(1)},${(60 + 50 * Math.sin(a)).toFixed(1)}`;
            }).join(' ');
            return `<polygon points="${pts}" fill="#ffffff" stroke="#000000" stroke-width="2"/>`;
        }
        case 'rhombus':
            return `<polygon points="60,8 110,60 60,112 10,60" fill="#ffffff" stroke="#000000" stroke-width="2"/>`;
        case 'parallelogram':
            return `<polygon points="25,100 5,20 95,20 115,100" fill="#ffffff" stroke="#000000" stroke-width="2"/>`;
        default:
            return '';
    }
}
