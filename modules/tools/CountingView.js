const BALL_COLORS = [
    '#5b80a5','#a85c72','#4f7c75','#dec894','#938db3',
    '#d58b99','#8bb39c','#8db1d1','#e6a95a','#7ec8a0',
];

export class CountingView {
    #engine;
    #root;
    #friendsView;
    #gridView;
    #balls       = [];
    #unsub;

    // friends state
    #zone1Count  = 0;
    #zone2Count  = 0;
    #zone1El;
    #zone2El;
    #countDisplay;

    // grid state
    #gridMode       = 'multiplication'; // 'multiplication' or 'division'
    #gridFactor1    = 0;
    #gridFactor2    = 0;
    #eqDisplay;
    #gridTable;

    constructor(engine) {
        this.#engine = engine;
    }

    mount(parentEl) {
        this.#root = this.#buildDOM();
        parentEl.appendChild(this.#root);
        this.#unsub = this.#engine.subscribe(() => this.#onModeChange());
        this.#initFriends();
        return this.#root;
    }

    cleanup() {
        this.#removeBalls();
        if (this.#unsub) this.#unsub();
    }

    // ── DOM construction ──────────────────────────────────────────────────────
    #buildDOM() {
        const section = document.createElement('section');
        section.className = 'tool-view flex flex-col h-full';

        // topbar
        const topbar = document.createElement('div');
        topbar.className = 'flex flex-row gap-2 p-2 bg-gray-50 border-b flex-shrink-0 items-center';

        const modes = [
            ['friends',       'Tio-kompisar'],
            ['multiplication','Multiplikation'],
            ['division',      'Division'],
        ];
        modes.forEach(([mode, label]) => {
            const btn = document.createElement('button');
            btn.className = 'geo-btn';
            btn.textContent = label;
            btn.addEventListener('click', () => {
                this.#engine.setMode(mode);
            });
            topbar.appendChild(btn);
        });

        section.appendChild(topbar);

        // ── friends view ──────────────────────────────────────────────────────
        this.#friendsView = document.createElement('div');
        this.#friendsView.className = 'flex flex-col flex-1 overflow-auto p-4 gap-4';

        const title = document.createElement('h2');
        title.className = 'text-lg font-bold text-center';
        title.textContent = 'Tio-kompisar – dra bollarna till zonerna';
        this.#friendsView.appendChild(title);

        const zonesRow = document.createElement('div');
        zonesRow.className = 'flex flex-row gap-6 justify-center flex-wrap';

        this.#zone1El = this.#makeZone('Zon 1 (rosa)', '#a85c72');
        this.#zone2El = this.#makeZone('Zon 2 (blå)',  '#5b80a5');
        zonesRow.appendChild(this.#zone1El);
        zonesRow.appendChild(this.#zone2El);
        this.#friendsView.appendChild(zonesRow);

        const launchRow = document.createElement('div');
        launchRow.className = 'flex justify-center';
        const launchBtn = document.createElement('button');
        launchBtn.className = 'geo-btn';
        launchBtn.textContent = '▶ Starta bollar';
        launchBtn.addEventListener('click', () => {
            this.#removeBalls();
            setTimeout(() => this.#spawnBalls(), 50);
        });
        launchRow.appendChild(launchBtn);
        this.#friendsView.appendChild(launchRow);

        this.#countDisplay = document.createElement('div');
        this.#countDisplay.className = 'text-center text-xl font-bold py-2';
        this.#countDisplay.textContent = '';
        this.#friendsView.appendChild(this.#countDisplay);

        section.appendChild(this.#friendsView);

        // ── grid view ─────────────────────────────────────────────────────────
        this.#gridView = document.createElement('div');
        this.#gridView.className = 'flex flex-col flex-1 overflow-auto p-4 gap-3';
        this.#gridView.style.display = 'none';

        this.#eqDisplay = document.createElement('div');
        this.#eqDisplay.className = 'text-center text-2xl font-bold py-2';
        this.#gridView.appendChild(this.#eqDisplay);

        this.#gridTable = document.createElement('div');
        this.#gridTable.className = 'overflow-auto';
        this.#gridView.appendChild(this.#gridTable);

        section.appendChild(this.#gridView);

        return section;
    }

    #makeZone(label, color) {
        const zone = document.createElement('div');
        zone.className = 'drop-zone';
        zone.style.cssText = `min-width:180px;min-height:160px;border:3px dashed ${color};border-radius:12px;padding:12px;position:relative;display:flex;flex-direction:column;align-items:center;gap:4px;`;

        const lbl = document.createElement('div');
        lbl.className = 'text-sm font-semibold mb-2';
        lbl.style.color = color;
        lbl.textContent = label;
        zone.appendChild(lbl);
        return zone;
    }

    // ── mode switch ───────────────────────────────────────────────────────────
    #onModeChange() {
        const mode = this.#engine.getMode();
        this.#removeBalls();

        if (mode === 'friends') {
            this.#friendsView.style.display = '';
            this.#gridView.style.display    = 'none';
            setTimeout(() => this.#spawnBalls(), 50);
        } else {
            this.#friendsView.style.display = 'none';
            this.#gridView.style.display    = '';
            this.#gridMode = mode;
            this.#buildGrid();
        }
    }

    #initFriends() {
        setTimeout(() => this.#spawnBalls(), 150);
    }

    // ── ten-friends balls ─────────────────────────────────────────────────────
    #spawnBalls() {
        const launchBtn = this.#friendsView.querySelector('button');
        const rect      = launchBtn ? launchBtn.getBoundingClientRect() : { left:100, top:200 };

        for (let i = 0; i < 10; i++) {
            const ball = document.createElement('div');
            ball.className = 'w-12 h-12 rounded-full shadow-md cursor-grab border-2 border-white draggable-item ten-friend-item';
            ball.style.cssText = `position:absolute;background:${BALL_COLORS[i % BALL_COLORS.length]};z-index:1000;display:flex;align-items:center;justify-content:center;color:#fff;font-weight:bold;font-size:1.1em;user-select:none;`;
            ball.textContent = i + 1;

            const bx = rect.left + 20 + i * 55;
            const by = rect.top  + 20;
            ball.dataset.x = bx;
            ball.dataset.y = by;
            ball.style.left = bx + 'px';
            ball.style.top  = by + 'px';

            document.body.appendChild(ball);
            this.#balls.push(ball);
            this.#makeBallDraggable(ball);
        }
        this.#updateZoneCounts();
    }

    #removeBalls() {
        this.#balls.forEach(b => b.remove());
        this.#balls = [];
        this.#zone1Count = 0;
        this.#zone2Count = 0;
        if (this.#countDisplay) this.#countDisplay.textContent = '';
    }

    #makeBallDraggable(ball) {
        let sx, sy, ix, iy;
        ball.addEventListener('pointerdown', e => {
            if (e.button !== 0) return;
            sx = e.clientX; sy = e.clientY;
            ix = parseFloat(ball.dataset.x) || 0;
            iy = parseFloat(ball.dataset.y) || 0;
            ball.setPointerCapture(e.pointerId);
            ball.style.cursor = 'grabbing';
            e.preventDefault();
        });
        ball.addEventListener('pointermove', e => {
            if (!ball.hasPointerCapture(e.pointerId)) return;
            ball.dataset.x = ix + (e.clientX - sx);
            ball.dataset.y = iy + (e.clientY - sy);
            ball.style.left = ball.dataset.x + 'px';
            ball.style.top  = ball.dataset.y + 'px';
        });
        ball.addEventListener('pointerup', e => {
            if (!ball.hasPointerCapture(e.pointerId)) return;
            ball.releasePointerCapture(e.pointerId);
            ball.style.cursor = 'grab';
            this.#snapToZone(ball);
            this.#updateZoneCounts();
        });
    }

    #snapToZone(ball) {
        const bx = parseFloat(ball.dataset.x) + 24;
        const by = parseFloat(ball.dataset.y) + 24;
        [this.#zone1El, this.#zone2El].forEach(zone => {
            const r = zone.getBoundingClientRect();
            if (bx >= r.left && bx <= r.right && by >= r.top && by <= r.bottom) {
                // snap inside zone
                const nx = r.left + 10 + Math.random() * (r.width  - 60);
                const ny = r.top  + 30 + Math.random() * (r.height - 60);
                ball.dataset.x = nx;
                ball.dataset.y = ny;
                ball.style.left = nx + 'px';
                ball.style.top  = ny + 'px';
            }
        });
    }

    #updateZoneCounts() {
        let c1 = 0, c2 = 0;
        this.#balls.forEach(ball => {
            const bx = parseFloat(ball.dataset.x) + 24;
            const by = parseFloat(ball.dataset.y) + 24;
            const r1 = this.#zone1El.getBoundingClientRect();
            const r2 = this.#zone2El.getBoundingClientRect();
            if (bx >= r1.left && bx <= r1.right && by >= r1.top && by <= r1.bottom) c1++;
            else if (bx >= r2.left && bx <= r2.right && by >= r2.top && by <= r2.bottom) c2++;
        });
        this.#zone1Count = c1;
        this.#zone2Count = c2;
        const sum = c1 + c2;
        this.#countDisplay.textContent = sum > 0
            ? `Zon 1: ${c1}  •  Zon 2: ${c2}  •  Totalt: ${sum}`
            : '';
        // ten-friends hint
        if (c1 + c2 === 10) {
            this.#countDisplay.textContent += `  →  ${c1} + ${c2} = 10 ✓`;
        }
    }

    // ── multiplication / division grid ────────────────────────────────────────
    #buildGrid() {
        this.#gridTable.innerHTML = '';
        this.#gridFactor1 = 0;
        this.#gridFactor2 = 0;
        this.#updateEqDisplay();

        const table = document.createElement('table');
        table.className = 'border-collapse';

        for (let row = 0; row <= 10; row++) {
            const tr = document.createElement('tr');
            for (let col = 0; col <= 10; col++) {
                const td = document.createElement('td');
                td.className = 'math-grid-cell border border-gray-300 text-center cursor-pointer select-none';
                td.style.cssText = 'width:36px;height:36px;font-size:0.85em;';

                const isHeader = row === 0 || col === 0;
                if (isHeader) {
                    const val = row === 0 ? col : row;
                    td.textContent = val === 0 ? '×' : val;
                    td.style.background = '#dbeafe';
                    td.style.fontWeight = 'bold';
                } else {
                    td.textContent = row * col;
                }

                td.dataset.row = row;
                td.dataset.col = col;

                td.addEventListener('mouseenter', () => this.#hoverCell(td));
                td.addEventListener('mouseleave', () => this.#unhoverCell());
                td.addEventListener('click',      () => this.#clickCell(td));
                td.addEventListener('touchstart',  e => { e.preventDefault(); this.#clickCell(td); }, {passive:false});

                tr.appendChild(td);
            }
            table.appendChild(tr);
        }
        this.#gridTable.appendChild(table);
    }

    #hoverCell(td) {
        const r = parseInt(td.dataset.row);
        const c = parseInt(td.dataset.col);
        if (r === 0 || c === 0) return;
        this.#gridTable.querySelectorAll('td').forEach(cell => {
            const cr = parseInt(cell.dataset.row);
            const cc = parseInt(cell.dataset.col);
            if (cr === r || cc === c) cell.classList.add('highlight-row-col');
        });
    }

    #unhoverCell() {
        this.#gridTable.querySelectorAll('.highlight-row-col').forEach(c => c.classList.remove('highlight-row-col'));
    }

    #clickCell(td) {
        const r = parseInt(td.dataset.row);
        const c = parseInt(td.dataset.col);
        if (r === 0 || c === 0) return;
        this.#gridFactor1 = r;
        this.#gridFactor2 = c;
        this.#updateEqDisplay();
        this.#unhoverCell();
        this.#gridTable.querySelectorAll('td').forEach(cell => {
            const cr = parseInt(cell.dataset.row);
            const cc = parseInt(cell.dataset.col);
            if (cr === r || cc === c) cell.classList.add('highlight-row-col');
        });
    }

    #updateEqDisplay() {
        const a = this.#gridFactor1;
        const b = this.#gridFactor2;
        if (!a || !b) {
            this.#eqDisplay.textContent = this.#gridMode === 'multiplication'
                ? 'Klicka i tabellen för att räkna'
                : 'Klicka i tabellen för att räkna';
            return;
        }
        if (this.#gridMode === 'multiplication') {
            this.#eqDisplay.textContent = `${a} × ${b} = ${a*b}`;
        } else {
            this.#eqDisplay.textContent = b !== 0
                ? `${a*b} ÷ ${b} = ${a}`
                : '';
        }
    }
}
