// ─── module-level drag helpers ───────────────────────────────────────────────
function geoUpdateTransform(el) {
    const x   = parseFloat(el.dataset.x)     || 0;
    const y   = parseFloat(el.dataset.y)     || 0;
    const rot = parseFloat(el.dataset.rot)   || 0;
    const s   = parseFloat(el.dataset.scale) || 1;
    el.style.left      = x + 'px';
    el.style.top       = y + 'px';
    el.style.transform = `rotate(${rot}deg) scale(${s})`;
}

function geoMakeDraggable(el, onDragEnd = null) {
    if (!el.dataset.x)     el.dataset.x     = 0;
    if (!el.dataset.y)     el.dataset.y     = 0;
    if (!el.dataset.rot)   el.dataset.rot   = 0;
    if (!el.dataset.scale) el.dataset.scale = 1;
    geoUpdateTransform(el);

    let sx, sy, ix, iy;
    el.addEventListener('pointerdown', e => {
        if (e.button !== 0) return;
        if (e.target.classList.contains('geo-resize-handle')) return;
        if (e.target.classList.contains('angle-drag-handle')) return;
        sx = e.clientX; sy = e.clientY;
        ix = parseFloat(el.dataset.x) || 0;
        iy = parseFloat(el.dataset.y) || 0;
        el.setPointerCapture(e.pointerId);
        e.preventDefault();
    });
    el.addEventListener('pointermove', e => {
        if (!el.hasPointerCapture(e.pointerId)) return;
        el.dataset.x = ix + (e.clientX - sx);
        el.dataset.y = iy + (e.clientY - sy);
        geoUpdateTransform(el);
    });
    el.addEventListener('pointerup', e => {
        if (!el.hasPointerCapture(e.pointerId)) return;
        el.releasePointerCapture(e.pointerId);
        if (onDragEnd) onDragEnd(el);
    });
}

// ─── base dimensions (cm at scale 1) ─────────────────────────────────────────
const GEO_DIMS = {
    circle:      { r:5 },
    square:      { a:10 },
    rectangle:   { b:11, h:7 },
    triangle:    { b:10, h:9 },
    pentagon:    { a:5.88 },
    hexagon:     { a:5 },
    rhombus:     { d1:10.4, d2:10 },
    parallelogram:{ b:9, h:8 },
    cube:        { a:10 },
    cuboid:      { a:14, b:9, c:8 },
    sphere:      { r:7.5 },
    cylinder:    { r:5, h:10 },
    pyramid:     { a:10, h:10 },
    cone:        { r:5, h:10 },
};

// ─── THREE.js shape map ───────────────────────────────────────────────────────
function getShapeMap(T) {
    return {
        cube:     [new T.BoxGeometry(2,2,2),           0x4f7c75, false],
        cuboid:   [new T.BoxGeometry(2.8,1.8,1.6),     0x5b80a5, false],
        sphere:   [new T.SphereGeometry(1.5,32,32),    0xa85c72, false],
        pyramid:  [new T.ConeGeometry(1.5,2,4),        0xdec894, true ],
        cylinder: [new T.CylinderGeometry(1,1,2.5,32), 0x5b80a5, false],
        cone:     [new T.ConeGeometry(1,2.5,32),       0x938db3, false],
    };
}

// ─── SVG shape generators ─────────────────────────────────────────────────────
function buildShapeSVG(type, dims) {
    const vb = '0 0 120 120';
    const ns = 'http://www.w3.org/2000/svg';
    const svg = document.createElementNS(ns, 'svg');
    svg.setAttribute('viewBox', vb);
    svg.setAttribute('width', '200');
    svg.setAttribute('height', '200');
    svg.setAttribute('xmlns', ns);
    svg.style.display = 'block';

    const fillMap = {
        circle:'#a85c72', square:'#5b80a5', rectangle:'#4f7c75',
        triangle:'#dec894', pentagon:'#938db3', hexagon:'#4f7c75',
        rhombus:'#a85c72', parallelogram:'#5b80a5',
    };
    const fill = fillMap[type] || '#5b80a5';

    function line(x1,y1,x2,y2,cls) {
        const l = document.createElementNS(ns,'line');
        l.setAttribute('x1',x1); l.setAttribute('y1',y1);
        l.setAttribute('x2',x2); l.setAttribute('y2',y2);
        l.setAttribute('stroke','#555'); l.setAttribute('stroke-width','1');
        l.setAttribute('stroke-dasharray','3,3');
        if (cls) { l.setAttribute('class',cls); }
        return l;
    }
    function text(x,y,txt,cls) {
        const t = document.createElementNS(ns,'text');
        t.setAttribute('x',x); t.setAttribute('y',y);
        t.setAttribute('text-anchor','middle');
        t.setAttribute('font-size','9');
        t.setAttribute('fill','#444');
        if (cls) t.setAttribute('class',cls);
        t.textContent = txt;
        return t;
    }
    function dim(el,key) {
        el.setAttribute('data-dim',key);
        el.setAttribute('class','geoEdu_dimLine');
        return el;
    }

    switch (type) {
        case 'circle': {
            const r = dims.r || 5;
            const c = document.createElementNS(ns,'circle');
            c.setAttribute('cx',60); c.setAttribute('cy',60); c.setAttribute('r',44);
            c.setAttribute('fill',fill); c.setAttribute('stroke','#333'); c.setAttribute('stroke-width','1.5');
            svg.appendChild(c);
            const dl = line(60,60,104,60,'geoEdu_dimLine'); dl.setAttribute('data-dim','r');
            svg.appendChild(dl);
            svg.appendChild(text(82,57,`r=${r}cm`,'geoEdu_dimLine'));
            break;
        }
        case 'square': {
            const a = dims.a || 10;
            const rect = document.createElementNS(ns,'rect');
            rect.setAttribute('x',20); rect.setAttribute('y',20);
            rect.setAttribute('width',80); rect.setAttribute('height',80);
            rect.setAttribute('fill',fill); rect.setAttribute('stroke','#333'); rect.setAttribute('stroke-width','1.5');
            svg.appendChild(rect);
            svg.appendChild(dim(line(20,115,100,115),  'a'));
            svg.appendChild(dim(text(60,125,`a=${a}cm`),'a'));
            break;
        }
        case 'rectangle': {
            const b = dims.b||11, h = dims.h||7;
            const rect = document.createElementNS(ns,'rect');
            rect.setAttribute('x',10); rect.setAttribute('y',30);
            rect.setAttribute('width',100); rect.setAttribute('height',60);
            rect.setAttribute('fill',fill); rect.setAttribute('stroke','#333'); rect.setAttribute('stroke-width','1.5');
            svg.appendChild(rect);
            svg.appendChild(dim(line(10,97,110,97),'b'));
            svg.appendChild(dim(text(60,107,`b=${b}cm`),'b'));
            svg.appendChild(dim(line(115,30,115,90),'h'));
            svg.appendChild(dim(text(115,62,`h=${h}cm`),'h'));
            break;
        }
        case 'triangle': {
            const b = dims.b||10, h = dims.h||9;
            const poly = document.createElementNS(ns,'polygon');
            poly.setAttribute('points','60,15 10,100 110,100');
            poly.setAttribute('fill',fill); poly.setAttribute('stroke','#333'); poly.setAttribute('stroke-width','1.5');
            svg.appendChild(poly);
            svg.appendChild(dim(line(10,107,110,107),'b'));
            svg.appendChild(dim(text(60,117,`b=${b}cm`),'b'));
            svg.appendChild(dim(line(115,15,115,100),'h'));
            svg.appendChild(dim(text(115,58,`h=${h}cm`),'h'));
            break;
        }
        case 'pentagon': {
            const a = dims.a||5.88;
            const pts = [];
            for (let i=0;i<5;i++) {
                const ang = (i*72-90)*Math.PI/180;
                pts.push(`${60+46*Math.cos(ang)},${60+46*Math.sin(ang)}`);
            }
            const poly = document.createElementNS(ns,'polygon');
            poly.setAttribute('points',pts.join(' '));
            poly.setAttribute('fill',fill); poly.setAttribute('stroke','#333'); poly.setAttribute('stroke-width','1.5');
            svg.appendChild(poly);
            svg.appendChild(dim(line(60,110,60+46*Math.cos(18*Math.PI/180),
                60+46*Math.sin(18*Math.PI/180)),'a'));
            svg.appendChild(dim(text(80,115,`a=${a}cm`),'a'));
            break;
        }
        case 'hexagon': {
            const a = dims.a||5;
            const pts = [];
            for (let i=0;i<6;i++) {
                const ang = i*60*Math.PI/180;
                pts.push(`${60+46*Math.cos(ang)},${60+46*Math.sin(ang)}`);
            }
            const poly = document.createElementNS(ns,'polygon');
            poly.setAttribute('points',pts.join(' '));
            poly.setAttribute('fill',fill); poly.setAttribute('stroke','#333'); poly.setAttribute('stroke-width','1.5');
            svg.appendChild(poly);
            svg.appendChild(dim(line(60,60,60+46,60),'a'));
            svg.appendChild(dim(text(83,55,`a=${a}cm`),'a'));
            break;
        }
        case 'rhombus': {
            const d1 = dims.d1||10.4, d2 = dims.d2||10;
            const poly = document.createElementNS(ns,'polygon');
            poly.setAttribute('points','60,15 110,60 60,105 10,60');
            poly.setAttribute('fill',fill); poly.setAttribute('stroke','#333'); poly.setAttribute('stroke-width','1.5');
            svg.appendChild(poly);
            svg.appendChild(dim(line(60,15,60,105),'d1'));
            svg.appendChild(dim(text(60,112,`d1=${d1}cm`),'d1'));
            svg.appendChild(dim(line(10,60,110,60),'d2'));
            svg.appendChild(dim(text(93,56,`d2=${d2}cm`),'d2'));
            break;
        }
        case 'parallelogram': {
            const b = dims.b||9, h = dims.h||8;
            const poly = document.createElementNS(ns,'polygon');
            poly.setAttribute('points','30,25 110,25 90,95 10,95');
            poly.setAttribute('fill',fill); poly.setAttribute('stroke','#333'); poly.setAttribute('stroke-width','1.5');
            svg.appendChild(poly);
            svg.appendChild(dim(line(10,102,90,102),'b'));
            svg.appendChild(dim(text(50,112,`b=${b}cm`),'b'));
            svg.appendChild(dim(line(115,25,115,95),'h'));
            svg.appendChild(dim(text(115,62,`h=${h}cm`),'h'));
            break;
        }
        default: break;
    }
    return svg;
}

// ─── GeometryView ─────────────────────────────────────────────────────────────
export class GeometryView {
    #engine;
    #root;
    #workspace;
    #selectedItem  = null;
    #zIndex        = 100;
    #presOverlay   = null;
    #presVisible   = false;
    #unsub;

    // formula panel refs
    #showFormulas;
    #unitSel;
    #formulaPanel;
    #calcArea;

    constructor(engine) {
        this.#engine = engine;
    }

    mount(parentEl) {
        this.#root = this.#buildDOM();
        parentEl.appendChild(this.#root);
        this.#buildPresOverlay();
        this.#unsub = this.#engine.subscribe(() => this.#onEngineUpdate());
        return this.#root;
    }

    cleanup() {
        // stop all 3D animation loops and dispose renderers
        this.#engine.getCards().forEach(c => {
            cancelAnimationFrame(c.rafId);
            c.renderer.dispose();
        });
        this.#engine.clearCards();
        if (this.#presOverlay && this.#presOverlay.parentNode) {
            this.#presOverlay.parentNode.removeChild(this.#presOverlay);
        }
        this.#presOverlay = null;
        if (this.#unsub) this.#unsub();
    }

    #onEngineUpdate() {
        this.#updateFormulaPanel();
    }

    // ── DOM construction ──────────────────────────────────────────────────────
    #buildDOM() {
        const section = document.createElement('section');
        section.className = 'tool-view flex flex-col h-full';

        // ── sidebar ─────────────────────────────────────────────────────────
        const sidebar = document.createElement('div');
        sidebar.className = 'flex flex-row flex-wrap gap-2 p-2 bg-gray-50 border-b overflow-auto flex-shrink-0';

        // 2D shape buttons
        const shapes2D = [
            ['circle','Cirkel'],['square','Kvadrat'],['rectangle','Rektangel'],
            ['triangle','Triangel'],['pentagon','Femhörning'],['hexagon','Sexhörning'],
            ['rhombus','Romb'],['parallelogram','Parallellogram'],
        ];
        shapes2D.forEach(([type, label]) => {
            const btn = document.createElement('button');
            btn.className = 'geo-btn';
            btn.textContent = label;
            btn.addEventListener('click', () => this.#add2DShape(type));
            sidebar.appendChild(btn);
        });

        // 3D shape buttons
        const shapes3D = [
            ['cube','Kub'],['cuboid','Rätblock'],['sphere','Klot'],
            ['pyramid','Pyramid'],['cylinder','Cylinder'],['cone','Kon'],
        ];
        shapes3D.forEach(([type, label]) => {
            const btn = document.createElement('button');
            btn.className = 'geo-btn';
            btn.textContent = label;
            btn.addEventListener('click', () => this.#add3DCard(type));
            sidebar.appendChild(btn);
        });

        // Angle tool button
        const angleBtn = document.createElement('button');
        angleBtn.className = 'geo-btn';
        angleBtn.textContent = 'Vinkelverktyg';
        angleBtn.addEventListener('click', () => this.#addAngleTool());
        sidebar.appendChild(angleBtn);

        // separator
        const sep = document.createElement('div');
        sep.className = 'w-full border-t my-1';
        sidebar.appendChild(sep);

        // rotate left/right, scale down/up, delete
        const ctrlBtns = [
            ['↺ Rotera vänster', () => this.#rotateSelected(-15)],
            ['↻ Rotera höger',   () => this.#rotateSelected(15)],
            ['− Förminska',      () => this.#scaleSelected(0.9)],
            ['+ Förstora',       () => this.#scaleSelected(1/0.9)],
            ['🗑 Ta bort',       () => this.#deleteSelected()],
        ];
        ctrlBtns.forEach(([lbl, fn]) => {
            const b = document.createElement('button');
            b.className = 'geo-btn';
            b.textContent = lbl;
            b.addEventListener('click', fn);
            sidebar.appendChild(b);
        });

        // Clear all
        const clearBtn = document.createElement('button');
        clearBtn.className = 'geo-btn text-red-600';
        clearBtn.textContent = '× Rensa alla';
        clearBtn.addEventListener('click', () => this.#clearAll());
        sidebar.appendChild(clearBtn);

        // Presentation toggle
        const presBtn = document.createElement('button');
        presBtn.className = 'geo-btn';
        presBtn.textContent = '🖥 Presentation';
        presBtn.addEventListener('click', () => this.#togglePresentation());
        sidebar.appendChild(presBtn);

        // Formula toggle checkbox
        const formulaRow = document.createElement('label');
        formulaRow.className = 'flex items-center gap-1 text-sm cursor-pointer';
        this.#showFormulas = document.createElement('input');
        this.#showFormulas.type = 'checkbox';
        this.#showFormulas.addEventListener('change', () => this.#updateFormulaPanel());
        formulaRow.appendChild(this.#showFormulas);
        formulaRow.append('Visa formler');
        sidebar.appendChild(formulaRow);

        // Unit selector
        const unitRow = document.createElement('div');
        unitRow.className = 'flex items-center gap-1 text-sm';
        unitRow.append('Enhet: ');
        this.#unitSel = document.createElement('select');
        this.#unitSel.className = 'border rounded text-xs px-1';
        ['cm','m','mm','dm'].forEach(u => {
            const o = document.createElement('option');
            o.value = u; o.textContent = u;
            this.#unitSel.appendChild(o);
        });
        this.#unitSel.addEventListener('change', () => this.#updateFormulaPanel());
        unitRow.appendChild(this.#unitSel);
        sidebar.appendChild(unitRow);

        // Formula panel
        this.#formulaPanel = document.createElement('div');
        this.#formulaPanel.id = 'calcGeo_panel';
        this.#calcArea = document.createElement('div');
        this.#calcArea.className = 'calcGeo_area';
        this.#formulaPanel.appendChild(this.#calcArea);
        sidebar.appendChild(this.#formulaPanel);

        // ── workspace ───────────────────────────────────────────────────────
        this.#workspace = document.createElement('div');
        this.#workspace.className = 'workspace flex-1 relative overflow-hidden';
        this.#workspace.style.cssText = 'background:#e8f0ff;background-image:linear-gradient(#aac4e8 1px,transparent 1px),linear-gradient(90deg,#aac4e8 1px,transparent 1px);background-size:30px 30px;';
        this.#workspace.addEventListener('click', e => {
            if (e.target === this.#workspace) this.#deselect();
        });

        section.appendChild(sidebar);
        section.appendChild(this.#workspace);
        return section;
    }

    // ── 2D shapes ─────────────────────────────────────────────────────────────
    #add2DShape(type) {
        const wrapper = document.createElement('div');
        wrapper.className = 'draggable-item';
        wrapper.dataset.type = type;
        wrapper.dataset.cat  = '2d';
        wrapper.style.cssText = 'width:200px;height:200px;position:absolute;cursor:grab;transform-origin:center center;';

        const dims = { ...GEO_DIMS[type] };
        wrapper.dataset.dims = JSON.stringify(dims);
        const svg = buildShapeSVG(type, dims);
        wrapper.appendChild(svg);

        // resize handle
        const handle = document.createElement('button');
        handle.className = 'geo-resize-handle';
        handle.textContent = '⤡';
        handle.title = 'Ändra storlek';
        wrapper.appendChild(handle);

        this.#placeRandom(wrapper);
        geoMakeDraggable(wrapper);
        this.#workspace.appendChild(wrapper);

        wrapper.addEventListener('click', e => {
            e.stopPropagation();
            this.#select(wrapper);
        });
        handle.addEventListener('pointerdown', e => {
            e.stopPropagation();
            this.#startResize(e, wrapper);
        });

        this.#select(wrapper);
    }

    #startResize(e, wrapper) {
        e.preventDefault();
        const initScale = parseFloat(wrapper.dataset.scale) || 1;
        const startY = e.clientY;
        const onMove = me => {
            const dy = me.clientY - startY;
            wrapper.dataset.scale = Math.max(0.2, Math.min(4, initScale - dy/200));
            geoUpdateTransform(wrapper);
        };
        const onUp = () => {
            window.removeEventListener('pointermove', onMove);
            window.removeEventListener('pointerup',   onUp);
        };
        window.addEventListener('pointermove', onMove);
        window.addEventListener('pointerup',   onUp);
    }

    // ── 3D cards ──────────────────────────────────────────────────────────────
    #add3DCard(type) {
        const T = window.THREE;
        if (!T) { console.warn('Three.js not found'); return; }
        const shapeMap = getShapeMap(T);
        const [geo, color, hasEdges] = shapeMap[type] || shapeMap.cube;

        const card = document.createElement('div');
        card.className = 'geo-3d-card draggable-item';
        card.dataset.type  = type;
        card.dataset.cat   = '3d';
        card.style.cssText = 'width:240px;position:absolute;cursor:grab;transform-origin:top left;';

        const header = document.createElement('div');
        header.className = 'geo-3d-header text-xs font-bold px-2 py-1 bg-gray-200 rounded-t';
        const typeNames = {cube:'Kub',cuboid:'Rätblock',sphere:'Klot',pyramid:'Pyramid',cylinder:'Cylinder',cone:'Kon'};
        header.textContent = typeNames[type] || type;
        card.appendChild(header);

        const canvas = document.createElement('canvas');
        canvas.width  = 240;
        canvas.height = 240;
        canvas.style.display = 'block';
        card.appendChild(canvas);

        this.#placeRandom(card);
        geoMakeDraggable(card);
        this.#workspace.appendChild(card);
        card.addEventListener('click', e => { e.stopPropagation(); this.#select(card); });

        // Three.js mini scene
        const renderer = new T.WebGLRenderer({ canvas, antialias: true, alpha: true });
        renderer.setSize(240, 240);
        renderer.setClearColor(0xf0f4f8, 1);

        const scene  = new T.Scene();
        const camera = new T.PerspectiveCamera(45, 1, 0.1, 100);
        camera.position.set(0, 2, 5);
        camera.lookAt(0,0,0);

        const ambient = new T.AmbientLight(0xffffff, 0.7);
        const dirLight = new T.DirectionalLight(0xffffff, 0.8);
        dirLight.position.set(5,10,7);
        scene.add(ambient, dirLight);

        const mat  = new T.MeshPhongMaterial({ color });
        const mesh = new T.Mesh(geo, mat);
        scene.add(mesh);

        if (hasEdges) {
            const edges = new T.EdgesGeometry(geo);
            const line  = new T.LineSegments(edges, new T.LineBasicMaterial({ color: 0x222222 }));
            scene.add(line);
        }

        let rafId;
        const animate = () => {
            rafId = requestAnimationFrame(animate);
            if (this.#engine.getAutoRotate()) {
                mesh.rotation.y += 0.006;
                mesh.rotation.x += 0.002;
            }
            renderer.render(scene, camera);
        };
        animate();

        const cardState = { renderer, rafId: null, geo, mat };
        // store latest rafId reference
        Object.defineProperty(cardState, 'rafId', {
            get: () => rafId,
            set: v => { rafId = v; },
            configurable: true,
        });
        this.#engine.addCard(cardState);

        this.#select(card);
    }

    // ── angle tool ────────────────────────────────────────────────────────────
    #addAngleTool() {
        const ns  = 'http://www.w3.org/2000/svg';
        const W   = 260;
        const H   = 258;

        const card = document.createElement('div');
        card.className = 'angle-card draggable-item';
        card.dataset.cat = 'angle';
        card.style.cssText = `width:${W}px;height:${H}px;position:absolute;cursor:grab;transform-origin:top left;background:#fff;border:1px solid #ccc;border-radius:8px;overflow:hidden;`;

        const headerDiv = document.createElement('div');
        headerDiv.className = 'text-xs font-bold px-2 py-1 bg-gray-200';
        headerDiv.textContent = 'Vinkelverktyg';
        card.appendChild(headerDiv);

        const svg = document.createElementNS(ns,'svg');
        svg.setAttribute('width', W);
        svg.setAttribute('height','170');
        svg.setAttribute('viewBox',`0 0 ${W} 170`);
        svg.style.display = 'block';
        card.appendChild(svg);

        // base ray (fixed)
        const baseRay = document.createElementNS(ns,'line');
        baseRay.setAttribute('x1','20'); baseRay.setAttribute('y1','150');
        baseRay.setAttribute('x2','240'); baseRay.setAttribute('y2','150');
        baseRay.setAttribute('stroke','#333'); baseRay.setAttribute('stroke-width','2');
        svg.appendChild(baseRay);

        // moving ray
        let angleDeg = 45;
        const movRay = document.createElementNS(ns,'line');
        movRay.setAttribute('stroke','#a85c72'); movRay.setAttribute('stroke-width','2');
        svg.appendChild(movRay);

        // arc
        const arc = document.createElementNS(ns,'path');
        arc.setAttribute('stroke','#4f7c75'); arc.setAttribute('stroke-width','1.5');
        arc.setAttribute('fill','rgba(79,124,117,0.1)');
        svg.appendChild(arc);

        // angle label
        const label = document.createElementNS(ns,'text');
        label.setAttribute('x','70'); label.setAttribute('y','135');
        label.setAttribute('font-size','14'); label.setAttribute('fill','#333');
        svg.appendChild(label);

        // drag handle on moving ray
        const handle = document.createElementNS(ns,'circle');
        handle.setAttribute('r','10'); handle.setAttribute('fill','#5b80a5');
        handle.setAttribute('cursor','pointer'); handle.setAttribute('class','angle-drag-handle');
        svg.appendChild(handle);

        const cx = 20, cy = 150, len = 200;

        const redraw = () => {
            const rad = angleDeg * Math.PI / 180;
            const ex  = cx + len * Math.cos(-rad);
            const ey  = cy + len * Math.sin(-rad);
            movRay.setAttribute('x1', cx); movRay.setAttribute('y1', cy);
            movRay.setAttribute('x2', ex); movRay.setAttribute('y2', ey);
            handle.setAttribute('cx', ex); handle.setAttribute('cy', ey);
            label.textContent = `${Math.round(angleDeg)}°`;
            // arc path
            const r    = 50;
            const arcX = cx + r * Math.cos(-rad);
            const arcY = cy + r * Math.sin(-rad);
            const large= angleDeg > 180 ? 1 : 0;
            arc.setAttribute('d',`M ${cx+r} ${cy} A ${r} ${r} 0 ${large} 0 ${arcX} ${arcY} L ${cx} ${cy} Z`);
        };
        redraw();

        // drag for moving ray
        handle.addEventListener('pointerdown', e => {
            e.stopPropagation();
            handle.setPointerCapture(e.pointerId);
            const onMove = me => {
                const rect = svg.getBoundingClientRect();
                const mx   = me.clientX - rect.left - cx;
                const my   = me.clientY - rect.top  - cy;
                angleDeg   = Math.max(1, Math.min(359, Math.round(-Math.atan2(my,mx)*180/Math.PI)));
                redraw();
                uiDeg.value = angleDeg;
            };
            const onUp = me => {
                handle.releasePointerCapture(me.pointerId);
                svg.removeEventListener('pointermove', onMove);
                svg.removeEventListener('pointerup',   onUp);
            };
            svg.addEventListener('pointermove', onMove);
            svg.addEventListener('pointerup',   onUp);
        });

        // numeric input row
        const uiRow = document.createElement('div');
        uiRow.className = 'flex items-center gap-2 px-3 py-1 text-sm';
        uiRow.innerHTML = '<span>Vinkel:</span>';
        const uiDeg = document.createElement('input');
        uiDeg.type = 'number'; uiDeg.min = '1'; uiDeg.max = '359';
        uiDeg.value = angleDeg;
        uiDeg.className = 'border rounded px-1 w-16 text-sm';
        uiDeg.addEventListener('input', () => {
            angleDeg = Math.max(1, Math.min(359, parseInt(uiDeg.value)||45));
            redraw();
        });
        uiRow.appendChild(uiDeg);
        uiRow.innerHTML += '<span>°</span>';
        card.appendChild(uiRow);

        this.#placeRandom(card);
        geoMakeDraggable(card);
        this.#workspace.appendChild(card);
        card.addEventListener('click', e => { e.stopPropagation(); this.#select(card); });
        this.#select(card);
    }

    // ── selection helpers ─────────────────────────────────────────────────────
    #select(el) {
        if (this.#selectedItem) this.#selectedItem.classList.remove('ring-2','ring-yellow-400');
        this.#selectedItem = el;
        el.classList.add('ring-2','ring-yellow-400');
        el.style.zIndex = ++this.#zIndex;
        this.#engine.setSelected(el);
        this.#updateFormulaPanel();
    }

    #deselect() {
        if (this.#selectedItem) this.#selectedItem.classList.remove('ring-2','ring-yellow-400');
        this.#selectedItem = null;
        this.#engine.setSelected(null);
        this.#updateFormulaPanel();
    }

    #rotateSelected(deg) {
        const el = this.#selectedItem;
        if (!el) return;
        el.dataset.rot = (parseFloat(el.dataset.rot)||0) + deg;
        geoUpdateTransform(el);
    }

    #scaleSelected(factor) {
        const el = this.#selectedItem;
        if (!el) return;
        el.dataset.scale = Math.max(0.2, Math.min(4, (parseFloat(el.dataset.scale)||1) * factor));
        geoUpdateTransform(el);
    }

    #deleteSelected() {
        const el = this.#selectedItem;
        if (!el) return;
        el.remove();
        this.#selectedItem = null;
        this.#engine.setSelected(null);
        this.#updateFormulaPanel();
    }

    #clearAll() {
        this.#engine.getCards().forEach(c => {
            cancelAnimationFrame(c.rafId);
            c.renderer.dispose();
        });
        this.#engine.clearCards();
        this.#workspace.innerHTML = '';
        this.#selectedItem = null;
        this.#engine.setSelected(null);
        this.#updateFormulaPanel();
    }

    #placeRandom(el) {
        const wsRect = this.#workspace.getBoundingClientRect();
        const maxX   = Math.max(20, (wsRect.width  || 600) - 260);
        const maxY   = Math.max(20, (wsRect.height || 400) - 260);
        el.dataset.x   = 20 + Math.random() * maxX;
        el.dataset.y   = 20 + Math.random() * maxY;
        el.dataset.rot   = 0;
        el.dataset.scale = 1;
        geoUpdateTransform(el);
    }

    // ── formula panel ─────────────────────────────────────────────────────────
    #updateFormulaPanel() {
        if (!this.#showFormulas.checked || !this.#selectedItem) {
            this.#formulaPanel.classList.remove('calcGeo_visible');
            return;
        }
        this.#formulaPanel.classList.add('calcGeo_visible');
        const el   = this.#selectedItem;
        const type = el.dataset.type;
        const cat  = el.dataset.cat;
        const unit = this.#unitSel.value;
        const dims = el.dataset.dims ? JSON.parse(el.dataset.dims) : (GEO_DIMS[type] || {});

        this.#calcArea.innerHTML = '';
        if (!type || cat === 'angle') return;

        const rows = this.#buildFormulaRows(type, dims, unit);
        rows.forEach(r => this.#calcArea.appendChild(r));
    }

    #buildFormulaRows(type, dims, unit) {
        const rows  = [];
        const fmtN  = v => parseFloat(v.toFixed(2));
        const pi    = Math.PI;

        const row = (label, value) => {
            const d = document.createElement('div');
            d.className = 'calcGeo_row';
            d.innerHTML = `<span class="calcGeo_lbl">${label}:</span> <span class="calcGeo_val">${fmtN(value)} ${unit}${label.includes('V') ? '³' : label.includes('A') ? '²' : ''}</span>`;
            return d;
        };
        const inputRow = (dimKey, label) => {
            const d = document.createElement('div');
            d.className = 'calcGeo_inprow';
            d.innerHTML = `<label class="calcGeo_dimLbl">${label}:</label>`;
            const inp = document.createElement('input');
            inp.type  = 'number'; inp.step = '0.1'; inp.min = '0.1';
            inp.className = 'calcGeo_inp';
            inp.value = dims[dimKey] || 1;
            inp.dataset.dim = dimKey;
            inp.addEventListener('input', () => {
                const val = parseFloat(inp.value);
                if (!isNaN(val) && val > 0) {
                    dims[dimKey] = val;
                    if (this.#selectedItem) this.#selectedItem.dataset.dims = JSON.stringify(dims);
                    this.#updateFormulaPanel();
                    this.#redraw2DShape(this.#selectedItem);
                }
            });
            d.appendChild(inp);
            d.append(` ${unit}`);
            return d;
        };

        switch (type) {
            case 'circle': {
                const r = dims.r||5;
                rows.push(inputRow('r','r'));
                rows.push(row('Omkrets',  2*pi*r));
                rows.push(row('Area',     pi*r*r));
                break;
            }
            case 'square': {
                const a = dims.a||10;
                rows.push(inputRow('a','a'));
                rows.push(row('Omkrets', 4*a));
                rows.push(row('Area',    a*a));
                break;
            }
            case 'rectangle': {
                const b = dims.b||11, h = dims.h||7;
                rows.push(inputRow('b','b'));
                rows.push(inputRow('h','h'));
                rows.push(row('Omkrets', 2*(b+h)));
                rows.push(row('Area',    b*h));
                break;
            }
            case 'triangle': {
                const b = dims.b||10, h = dims.h||9;
                rows.push(inputRow('b','b'));
                rows.push(inputRow('h','h'));
                rows.push(row('Area', 0.5*b*h));
                break;
            }
            case 'pentagon': {
                const a = dims.a||5.88;
                rows.push(inputRow('a','a'));
                rows.push(row('Omkrets', 5*a));
                rows.push(row('Area',    (a*a/4)*Math.sqrt(25+10*Math.sqrt(5))));
                break;
            }
            case 'hexagon': {
                const a = dims.a||5;
                rows.push(inputRow('a','a'));
                rows.push(row('Omkrets',  6*a));
                rows.push(row('Area',     (3*Math.sqrt(3)/2)*a*a));
                break;
            }
            case 'rhombus': {
                const d1 = dims.d1||10.4, d2 = dims.d2||10;
                rows.push(inputRow('d1','d1'));
                rows.push(inputRow('d2','d2'));
                rows.push(row('Area', 0.5*d1*d2));
                break;
            }
            case 'parallelogram': {
                const b = dims.b||9, h = dims.h||8;
                rows.push(inputRow('b','b'));
                rows.push(inputRow('h','h'));
                rows.push(row('Area', b*h));
                break;
            }
            case 'cube': {
                const a = dims.a||10;
                rows.push(inputRow('a','a'));
                rows.push(row('Yta',   6*a*a));
                rows.push(row('V',     a*a*a));
                break;
            }
            case 'cuboid': {
                const a=dims.a||14, b=dims.b||9, c=dims.c||8;
                rows.push(inputRow('a','a'));
                rows.push(inputRow('b','b'));
                rows.push(inputRow('c','c'));
                rows.push(row('Yta', 2*(a*b+b*c+a*c)));
                rows.push(row('V',   a*b*c));
                break;
            }
            case 'sphere': {
                const r = dims.r||7.5;
                rows.push(inputRow('r','r'));
                rows.push(row('Yta', 4*pi*r*r));
                rows.push(row('V',   (4/3)*pi*r*r*r));
                break;
            }
            case 'cylinder': {
                const r = dims.r||5, h = dims.h||10;
                rows.push(inputRow('r','r'));
                rows.push(inputRow('h','h'));
                rows.push(row('Yta', 2*pi*r*(r+h)));
                rows.push(row('V',   pi*r*r*h));
                break;
            }
            case 'pyramid': {
                const a = dims.a||10, h = dims.h||10;
                const sl = Math.sqrt(h*h+(a/2)*(a/2));
                rows.push(inputRow('a','a'));
                rows.push(inputRow('h','h'));
                rows.push(row('Yta', a*a + 2*a*sl));
                rows.push(row('V',   (1/3)*a*a*h));
                break;
            }
            case 'cone': {
                const r = dims.r||5, h = dims.h||10;
                const sl = Math.sqrt(h*h+r*r);
                rows.push(inputRow('r','r'));
                rows.push(inputRow('h','h'));
                rows.push(row('Yta', pi*r*(r+sl)));
                rows.push(row('V',   (1/3)*pi*r*r*h));
                break;
            }
            default: break;
        }
        return rows;
    }

    #redraw2DShape(wrapper) {
        if (!wrapper || wrapper.dataset.cat !== '2d') return;
        const type = wrapper.dataset.type;
        const dims = wrapper.dataset.dims ? JSON.parse(wrapper.dataset.dims) : (GEO_DIMS[type]||{});
        const old  = wrapper.querySelector('svg');
        const neu  = buildShapeSVG(type, dims);
        if (old) wrapper.replaceChild(neu, old);
    }

    // ── presentation overlay ──────────────────────────────────────────────────
    #buildPresOverlay() {
        const d = document.createElement('div');
        d.id = 'geoEdu_presentation';
        d.style.cssText = 'position:fixed;top:16px;right:16px;z-index:9000;background:#fff;border:2px solid #5b80a5;border-radius:12px;padding:16px;min-width:220px;display:none;box-shadow:0 4px 20px rgba(0,0,0,0.3);';
        const title = document.createElement('div');
        title.style.cssText = 'font-weight:bold;font-size:1.1em;margin-bottom:8px;color:#5b80a5;';
        title.textContent = 'Informationspanel';
        const content = document.createElement('div');
        content.id = 'geoEdu_presContent';
        const closeBtn = document.createElement('button');
        closeBtn.textContent = '✕';
        closeBtn.style.cssText = 'position:absolute;top:8px;right:10px;background:none;border:none;font-size:1.2em;cursor:pointer;color:#888;';
        closeBtn.addEventListener('click', () => this.#togglePresentation());
        d.appendChild(closeBtn);
        d.appendChild(title);
        d.appendChild(content);
        document.body.appendChild(d);
        this.#presOverlay = d;
    }

    #togglePresentation() {
        this.#presVisible = !this.#presVisible;
        if (this.#presOverlay) {
            this.#presOverlay.style.display = this.#presVisible ? 'block' : 'none';
        }
        if (this.#presVisible) this.#updatePresContent();
    }

    #updatePresContent() {
        if (!this.#presOverlay) return;
        const content = this.#presOverlay.querySelector('#geoEdu_presContent');
        if (!content) return;
        const el   = this.#selectedItem;
        if (!el) { content.textContent = 'Välj en form.'; return; }
        const type = el.dataset.type;
        const dims = el.dataset.dims ? JSON.parse(el.dataset.dims) : (GEO_DIMS[type]||{});
        const unit = this.#unitSel.value;
        const typeNames = {
            circle:'Cirkel',square:'Kvadrat',rectangle:'Rektangel',
            triangle:'Triangel',pentagon:'Femhörning',hexagon:'Sexhörning',
            rhombus:'Romb',parallelogram:'Parallellogram',
            cube:'Kub',cuboid:'Rätblock',sphere:'Klot',
            pyramid:'Pyramid',cylinder:'Cylinder',cone:'Kon',
        };
        content.innerHTML = `<strong>${typeNames[type]||type}</strong><br>` +
            Object.entries(dims).map(([k,v]) => `${k} = ${v} ${unit}`).join('<br>');
    }
}
