// ═══════════════════════════════════════════════════════════════════════════
// modules/tools/GeometryView.js
// Stage 2 — 2D shapes (SVG) + 3D objects (Three.js via window.THREE global).
// View owns all WebGL resources and disposes them on shape removal.
// ═══════════════════════════════════════════════════════════════════════════

import { GeometryEngine, SHAPE_DEFS_2D, SHAPE_DEFS_3D } from './GeometryEngine.js';

const SHAPE_BUTTONS_2D = [
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

const SHAPE_BUTTONS_3D = [
    { type: 'cylinder', label: 'Cylinder', iconClass: 'fa-database',  color: '#5b80a5' },
    { type: 'cube',     label: 'Kub',      iconClass: 'fa-cube',      color: '#4f7c75' },
    { type: 'cuboid',   label: 'Rätblock', iconClass: 'fa-box',       color: '#5b80a5' },
    { type: 'sphere',   label: 'Klot',     iconClass: 'fa-globe',     color: '#a85c72' },
    { type: 'pyramid',  label: 'Pyramid',  iconClass: 'fa-caret-up',  color: '#dec894' },
    { type: 'cone',     label: 'Kon',      iconClass: 'fa-caret-up',  color: '#938db3' },
];

const SHAPE_SIZE_PX = 200;
const SVG_VIEWBOX  = 120;
const CARD_3D_SIZE = 240;
const CARD_3D_HEADER_H = 24;

const TYPE_LABELS_3D = {
    cylinder: 'Cylinder', cube: 'Kub', cuboid: 'Rätblock',
    sphere: 'Klot', pyramid: 'Pyramid', cone: 'Kon',
};

export class GeometryView {
    #engine;
    #unsubscribe;
    #root;
    #els = {};
    #shapeEls = new Map();
    #threeStates = new Map();
    #zCounter = 100;
    #autoRotateCache = true;

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
        this.#disposeAllThree();
        this.#unsubscribe?.();
        this.#root?.remove();
    }

    #template() {
        const btns2d = SHAPE_BUTTONS_2D.map(b => `
            <button data-add-shape="${b.type}" data-shape-kind="2d" class="geo-btn">
                <svg viewBox="0 0 40 40" width="28" height="28">${b.svg}</svg>${b.label}
            </button>`).join('');

        const btns3d = SHAPE_BUTTONS_3D.map(b => `
            <button data-add-shape="${b.type}" data-shape-kind="3d" class="geo-btn">
                <i class="fas ${b.iconClass} text-xl" style="color:${b.color}"></i>${b.label}
            </button>`).join('');

        return `
        <div id="geometry-sidebar"
             class="w-64 bg-soft-surface shadow-md z-10 p-4 flex flex-col gap-3
                    overflow-y-auto border-r border-soft-border shrink-0">

            <h3 class="font-bold text-xs uppercase tracking-wider text-soft-muted">2D-former</h3>
            <div class="grid grid-cols-2 gap-1.5">${btns2d}</div>

            <hr class="border-soft-border my-1"/>

            <h3 class="font-bold text-xs uppercase tracking-wider text-soft-muted">3D-objekt</h3>
            <div class="grid grid-cols-2 gap-1.5">${btns3d}</div>

            <hr class="border-soft-border my-1"/>

            <div class="flex gap-2">
                <button data-action="rotate-ccw"
                        class="flex-1 bg-soft-bg p-2 rounded text-soft-text hover:bg-[#eae8e3]
                               text-sm border border-soft-border"
                        title="Rotera moturs (2D)">
                    <i class="fas fa-undo"></i>
                </button>
                <button data-action="rotate-cw"
                        class="flex-1 bg-soft-bg p-2 rounded text-soft-text hover:bg-[#eae8e3]
                               text-sm border border-soft-border"
                        title="Rotera medurs (2D)">
                    <i class="fas fa-redo"></i>
                </button>
                <button data-action="delete"
                        class="flex-1 bg-soft-pinkLight/20 text-soft-pink p-2 rounded
                               hover:bg-soft-pinkLight/40 text-sm border border-soft-pinkLight/30"
                        title="Ta bort markerad">
                    <i class="fas fa-trash"></i>
                </button>
            </div>

            <button data-action="toggle-spin"
                    class="bg-soft-bg p-2 rounded-lg text-soft-text hover:bg-[#eae8e3]
                           text-sm border border-soft-border flex items-center gap-2 w-full justify-center">
                <i class="fas fa-sync-alt"></i>
                <span data-role="spin-label">Rotation: PÅ</span>
            </button>

            <div class="p-2.5 bg-soft-blueLight/15 rounded-xl text-xs text-soft-blue
                        border border-soft-blueLight/30 leading-relaxed">
                <i class="fas fa-search-plus mr-1"></i>
                <strong>Dra ⌟-hörnet</strong> för att ändra storlek.<br/>
                <i class="fas fa-hand-paper mr-1 mt-1"></i>
                Dra på 3D-objektet för att vrida det.<br/>
                <i class="fas fa-arrows-alt mr-1 mt-1"></i>
                Dra i namnlistan för att flytta.
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
            spinLabel: this.#root.querySelector('[data-role="spin-label"]'),
        };
    }

    #wireEvents() {
        this.#root.addEventListener('click', evt => {
            const addBtn = evt.target.closest('[data-add-shape]');
            if (addBtn) {
                const kind = addBtn.dataset.shapeKind;
                const type = addBtn.dataset.addShape;
                const ws = this.#els.workspace;
                const wsW = ws.clientWidth, wsH = ws.clientHeight;
                const sizeForKind = kind === '3d' ? CARD_3D_SIZE + CARD_3D_HEADER_H : SHAPE_SIZE_PX;
                const x = (wsW / 2) - (sizeForKind / 2) + (Math.random() * 80 - 40);
                const y = wsH - sizeForKind - 20 + (Math.random() * 30 - 15);
                if (kind === '3d') {
                    if (!window.THREE) {
                        alert('Three.js är inte laddad. Kontrollera att skriptet finns i index.html.');
                        return;
                    }
                    this.#engine.add3DShape(type, Math.max(10, x), Math.max(10, y));
                } else {
                    this.#engine.add2DShape(type, Math.max(10, x), Math.max(10, y));
                }
                return;
            }
            const action = evt.target.closest('[data-action]')?.dataset.action;
            if (action === 'rotate-ccw') this.#engine.rotateSelected(-15);
            if (action === 'rotate-cw')  this.#engine.rotateSelected(15);
            if (action === 'delete')     this.#engine.deleteSelected();
            if (action === 'clear')      this.#engine.clear();
            if (action === 'toggle-spin') this.#engine.toggleAutoRotate3D();
        });

        this.#els.workspace.addEventListener('pointerdown', evt => {
            if (evt.target === this.#els.workspace) {
                this.#engine.select(null);
            }
        });
    }

    #render(reading) {
        this.#autoRotateCache = reading.autoRotate3D;
        this.#els.spinLabel.textContent =
            `Rotation: ${reading.autoRotate3D ? 'PÅ' : 'AV'}`;

        const liveIds = new Set(reading.shapes.map(s => s.id));
        for (const [id, el] of this.#shapeEls) {
            if (!liveIds.has(id)) {
                this.#disposeThreeFor(id);
                el.remove();
                this.#shapeEls.delete(id);
            }
        }
        for (const shape of reading.shapes) {
            let el = this.#shapeEls.get(shape.id);
            if (!el) {
                el = shape.kind === '3d'
                    ? this.#create3DCardElement(shape)
                    : this.#create2DShapeElement(shape);
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
        if (shape.kind === '3d') {
            el.style.transform = `scale(${shape.scale})`;
        } else {
            el.style.transform = `rotate(${shape.rotation}deg) scale(${shape.scale})`;
        }
    }

    #create2DShapeElement(shape) {
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
            shape2dSvg(shape.type) +
            '</svg>';

        const handle = document.createElement('div');
        handle.className = 'geo-resize-handle';
        handle.textContent = '⌟';
        wrapper.appendChild(handle);

        this.#wire2DShapeEvents(wrapper, shape.id, handle);
        return wrapper;
    }

    #wire2DShapeEvents(wrapper, shapeId, handle) {
        let dragging = false;
        let pStartX = 0, pStartY = 0, sStartX = 0, sStartY = 0;

        wrapper.addEventListener('pointerdown', e => {
            if (e.target === handle) return;
            if (e.button !== 0) return;
            e.preventDefault();
            const shape = this.#engine.getReading().shapes.find(s => s.id === shapeId);
            if (!shape) return;
            this.#engine.select(shapeId);
            this.#zCounter += 1;
            wrapper.style.zIndex = String(this.#zCounter);
            dragging = true;
            pStartX = e.clientX; pStartY = e.clientY;
            sStartX = shape.x;   sStartY = shape.y;
            wrapper.setPointerCapture(e.pointerId);
        });
        wrapper.addEventListener('pointermove', e => {
            if (!dragging) return;
            this.#engine.setPosition(shapeId,
                sStartX + (e.clientX - pStartX),
                sStartY + (e.clientY - pStartY));
        });
        const endDrag = e => {
            if (!dragging) return;
            dragging = false;
            try { wrapper.releasePointerCapture(e.pointerId); } catch {}
        };
        wrapper.addEventListener('pointerup', endDrag);
        wrapper.addEventListener('pointercancel', endDrag);

        let resizing = false, rStartX = 0, rStartScale = 1;
        handle.addEventListener('pointerdown', e => {
            if (e.button !== 0) return;
            e.preventDefault();
            e.stopPropagation();
            const shape = this.#engine.getReading().shapes.find(s => s.id === shapeId);
            if (!shape) return;
            resizing = true;
            rStartX = e.clientX;
            rStartScale = shape.scale;
            handle.setPointerCapture(e.pointerId);
        });
        handle.addEventListener('pointermove', e => {
            if (!resizing) return;
            this.#engine.setScale(shapeId,
                rStartScale + (e.clientX - rStartX) / SHAPE_SIZE_PX);
        });
        const endResize = e => {
            if (!resizing) return;
            resizing = false;
            try { handle.releasePointerCapture(e.pointerId); } catch {}
        };
        handle.addEventListener('pointerup', endResize);
        handle.addEventListener('pointercancel', endResize);
    }

    #create3DCardElement(shape) {
        const card = document.createElement('div');
        card.className = 'geo-3d-card draggable-item';
        card.dataset.shapeType = shape.type;
        card.dataset.shapeCat = '3d';
        card.dataset.id = String(shape.id);
        card.style.cssText =
            `position:absolute;width:${CARD_3D_SIZE}px;` +
            `height:${CARD_3D_SIZE + CARD_3D_HEADER_H}px;` +
            `transform-origin:top left;`;

        const header = document.createElement('div');
        header.style.cssText =
            `width:100%;height:${CARD_3D_HEADER_H}px;display:flex;` +
            `align-items:center;justify-content:center;font-size:10px;` +
            `font-weight:700;color:#6a6b70;user-select:none;cursor:move;` +
            `background:rgba(100,110,130,0.12);border-radius:10px 10px 0 0;`;
        header.textContent = `⠿ ${TYPE_LABELS_3D[shape.type] || shape.type}`;
        card.appendChild(header);

        const threeState = this.#initThreeScene(card, shape.type, CARD_3D_SIZE);
        if (threeState) {
            this.#threeStates.set(shape.id, threeState);
        }

        const overlay = document.createElement('div');
        overlay.style.cssText =
            `position:absolute;top:${CARD_3D_HEADER_H}px;left:0;` +
            `width:100%;height:${CARD_3D_SIZE}px;z-index:5;cursor:grab;`;
        card.appendChild(overlay);

        const handle = document.createElement('div');
        handle.className = 'geo-resize-handle';
        handle.textContent = '⌟';
        card.appendChild(handle);

        this.#wire3DCardEvents(card, shape.id, header, overlay, handle, threeState);
        return card;
    }

    #wire3DCardEvents(card, shapeId, header, overlay, handle, threeState) {
        let dragging = false;
        let pStartX = 0, pStartY = 0, sStartX = 0, sStartY = 0;

        header.addEventListener('pointerdown', e => {
            if (e.button !== 0) return;
            e.preventDefault();
            const shape = this.#engine.getReading().shapes.find(s => s.id === shapeId);
            if (!shape) return;
            this.#engine.select(shapeId);
            this.#zCounter += 1;
            card.style.zIndex = String(this.#zCounter);
            dragging = true;
            pStartX = e.clientX; pStartY = e.clientY;
            sStartX = shape.x;   sStartY = shape.y;
            header.setPointerCapture(e.pointerId);
        });
        header.addEventListener('pointermove', e => {
            if (!dragging) return;
            this.#engine.setPosition(shapeId,
                sStartX + (e.clientX - pStartX),
                sStartY + (e.clientY - pStartY));
        });
        const endDrag = e => {
            if (!dragging) return;
            dragging = false;
            try { header.releasePointerCapture(e.pointerId); } catch {}
        };
        header.addEventListener('pointerup', endDrag);
        header.addEventListener('pointercancel', endDrag);

        let rotating = false;
        let prevX = 0, prevY = 0;
        overlay.addEventListener('pointerdown', e => {
            if (e.button !== 0) return;
            e.preventDefault();
            e.stopPropagation();
            this.#engine.select(shapeId);
            this.#zCounter += 1;
            card.style.zIndex = String(this.#zCounter);
            overlay.setPointerCapture(e.pointerId);
            rotating = true;
            if (threeState) threeState.manualRotating = true;
            prevX = e.clientX; prevY = e.clientY;
            overlay.style.cursor = 'grabbing';
        });
        overlay.addEventListener('pointermove', e => {
            if (!rotating || !threeState) return;
            const dx = e.clientX - prevX;
            const dy = e.clientY - prevY;
            threeState.mesh.rotation.y += dx * 0.01;
            threeState.mesh.rotation.x += dy * 0.01;
            prevX = e.clientX; prevY = e.clientY;
        });
        const endRotate = e => {
            if (!rotating) return;
            rotating = false;
            if (threeState) threeState.manualRotating = false;
            overlay.style.cursor = 'grab';
            try { overlay.releasePointerCapture(e.pointerId); } catch {}
        };
        overlay.addEventListener('pointerup', endRotate);
        overlay.addEventListener('pointercancel', endRotate);

        let resizing = false, rStartX = 0, rStartScale = 1;
        handle.addEventListener('pointerdown', e => {
            if (e.button !== 0) return;
            e.preventDefault();
            e.stopPropagation();
            const shape = this.#engine.getReading().shapes.find(s => s.id === shapeId);
            if (!shape) return;
            resizing = true;
            rStartX = e.clientX;
            rStartScale = shape.scale;
            handle.setPointerCapture(e.pointerId);
        });
        handle.addEventListener('pointermove', e => {
            if (!resizing) return;
            this.#engine.setScale(shapeId,
                rStartScale + (e.clientX - rStartX) / CARD_3D_SIZE);
        });
        const endResize = e => {
            if (!resizing) return;
            resizing = false;
            try { handle.releasePointerCapture(e.pointerId); } catch {}
        };
        handle.addEventListener('pointerup', endResize);
        handle.addEventListener('pointercancel', endResize);
    }

    #initThreeScene(card, type, size) {
        const THREE = window.THREE;
        if (!THREE) {
            console.error('[GeometryView] window.THREE not available');
            return null;
        }

        const scene = new THREE.Scene();
        const camera = new THREE.PerspectiveCamera(50, 1, 0.1, 1000);
        camera.position.z = 5;

        const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
        renderer.setSize(size, size);
        renderer.setPixelRatio(window.devicePixelRatio);
        renderer.setClearColor(0x000000, 0);

        const canvas = renderer.domElement;
        canvas.style.cssText =
            `display:block;width:${size}px;height:${size}px;pointer-events:none;`;
        card.appendChild(canvas);

        scene.add(new THREE.AmbientLight(0xffffff, 0.7));
        const dl = new THREE.DirectionalLight(0xffffff, 0.8);
        dl.position.set(5, 5, 5);
        scene.add(dl);
        const dl2 = new THREE.DirectionalLight(0xffffff, 0.3);
        dl2.position.set(-5, -3, 5);
        scene.add(dl2);

        const shapeMap = {
            cube:     [new THREE.BoxGeometry(2, 2, 2),         0x4f7c75, false],
            cuboid:   [new THREE.BoxGeometry(2.8, 1.8, 1.6),   0x5b80a5, false],
            sphere:   [new THREE.SphereGeometry(1.5, 32, 32),  0xa85c72, false],
            pyramid:  [new THREE.ConeGeometry(1.5, 2, 4),      0xdec894, true],
            cylinder: [new THREE.CylinderGeometry(1, 1, 2.5, 32), 0x5b80a5, false],
            cone:     [new THREE.ConeGeometry(1, 2.5, 32),     0x938db3, false],
        };
        const [geo, color, flat] = shapeMap[type] || shapeMap.cube;
        const mat = new THREE.MeshPhongMaterial({
            color, flatShading: flat,
            polygonOffset: true, polygonOffsetFactor: 1, polygonOffsetUnits: 1,
        });
        const mesh = new THREE.Mesh(geo, mat);

        if (type === 'cube' || type === 'cuboid' || type === 'pyramid') {
            mesh.add(new THREE.LineSegments(
                new THREE.EdgesGeometry(geo),
                new THREE.LineBasicMaterial({ color: 0x333333, transparent: true, opacity: 0.6 }),
            ));
        }
        mesh.rotation.x = 0.4;
        mesh.rotation.y = 0.5;
        scene.add(mesh);

        const state = {
            scene, camera, renderer, mesh, canvas, geo, mat,
            animId: null, manualRotating: false, type,
        };

        const view = this;
        function animate() {
            state.animId = requestAnimationFrame(animate);
            if (view.#autoRotateCache && !state.manualRotating) {
                mesh.rotation.y += 0.006;
                mesh.rotation.x += 0.002;
            }
            renderer.render(scene, camera);
        }
        animate();

        return state;
    }

    #disposeThreeFor(shapeId) {
        const state = this.#threeStates.get(shapeId);
        if (!state) return;
        if (state.animId) cancelAnimationFrame(state.animId);
        try { state.geo?.dispose(); } catch {}
        try { state.mat?.dispose(); } catch {}
        try { state.renderer?.dispose(); } catch {}
        if (state.canvas && state.canvas.parentNode) {
            state.canvas.parentNode.removeChild(state.canvas);
        }
        this.#threeStates.delete(shapeId);
    }

    #disposeAllThree() {
        for (const id of [...this.#threeStates.keys()]) {
            this.#disposeThreeFor(id);
        }
    }
}

function shape2dSvg(type) {
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
