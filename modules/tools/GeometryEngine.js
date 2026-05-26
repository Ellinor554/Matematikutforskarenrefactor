// ═══════════════════════════════════════════════════════════════════════════
// modules/tools/GeometryEngine.js
// Stage 1 — pure model for 2D shape workspace: shapes array + selection.
// Stage 2 will add 3D objects. Stage 3 will add the formula calculator.
// ═══════════════════════════════════════════════════════════════════════════

export const SHAPE_DEFS_2D = Object.freeze({
    circle:        { label: 'Cirkel',        dims: ['r'] },
    triangle:      { label: 'Triangel',      dims: ['b', 'h'] },
    square:        { label: 'Kvadrat',       dims: ['a'] },
    rectangle:     { label: 'Rektangel',     dims: ['b', 'h'] },
    pentagon:      { label: 'Pentagon',      dims: ['a'] },
    hexagon:       { label: 'Hexagon',       dims: ['a'] },
    rhombus:       { label: 'Romb',          dims: ['d1', 'd2'] },
    parallelogram: { label: 'Parallellogram', dims: ['b', 'h'] },
});

const VALID_2D_TYPES = Object.keys(SHAPE_DEFS_2D);
const ROT_STEP_DEG = 15;
const MIN_SCALE = 0.3;
const MAX_SCALE = 5;

let nextId = 1;

export class GeometryEngine {
    #shapes = [];
    #selectedId = null;
    #listeners = new Set();

    add2DShape(type, x = 100, y = 100) {
        if (!VALID_2D_TYPES.includes(type)) return null;
        const shape = {
            id: nextId++,
            kind: '2d',
            type,
            x,
            y,
            rotation: 0,
            scale: 1,
        };
        this.#shapes.push(shape);
        this.#selectedId = shape.id;
        this.#emit();
        return shape.id;
    }

    setPosition(id, x, y) {
        const s = this.#findById(id);
        if (!s) return;
        s.x = x;
        s.y = y;
        this.#emit();
    }

    setScale(id, scale) {
        const s = this.#findById(id);
        if (!s) return;
        s.scale = Math.max(MIN_SCALE, Math.min(MAX_SCALE, scale));
        this.#emit();
    }

    setRotation(id, deg) {
        const s = this.#findById(id);
        if (!s) return;
        s.rotation = deg;
        this.#emit();
    }

    select(id) {
        if (id === this.#selectedId) return;
        if (id !== null && !this.#findById(id)) return;
        this.#selectedId = id;
        this.#emit();
    }

    rotateSelected(deltaDeg = ROT_STEP_DEG) {
        if (this.#selectedId == null) return;
        const s = this.#findById(this.#selectedId);
        if (!s) return;
        s.rotation = (s.rotation || 0) + deltaDeg;
        this.#emit();
    }

    deleteSelected() {
        if (this.#selectedId == null) return;
        const before = this.#shapes.length;
        this.#shapes = this.#shapes.filter(s => s.id !== this.#selectedId);
        if (this.#shapes.length === before) return;
        this.#selectedId = null;
        this.#emit();
    }

    clear() {
        if (this.#shapes.length === 0 && this.#selectedId == null) return;
        this.#shapes = [];
        this.#selectedId = null;
        this.#emit();
    }

    getReading() {
        const selected = this.#selectedId == null
            ? null
            : this.#findById(this.#selectedId);
        return Object.freeze({
            shapes:       Object.freeze(this.#shapes.map(s => ({ ...s }))),
            selectedId:   this.#selectedId,
            selectedType: selected ? selected.type : null,
            hasSelection: selected != null,
        });
    }

    getState() { return this.getReading(); }

    subscribe(listener) {
        this.#listeners.add(listener);
        listener(this.getReading());
        return () => this.#listeners.delete(listener);
    }

    #emit() {
        const reading = this.getReading();
        for (const l of this.#listeners) {
            try { l(reading); }
            catch (err) { console.error('[GeometryEngine] listener threw:', err); }
        }
    }

    #findById(id) {
        return this.#shapes.find(s => s.id === id) || null;
    }
}
