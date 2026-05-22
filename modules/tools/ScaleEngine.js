// ═══════════════════════════════════════════════════════════════════════════
// modules/tools/ScaleEngine.js
//
// Pure domain model for the Skala och mått tool. Holds the active object,
// its real-world dimensions in cm, the current scale ratio (num:den),
// the proportion lock, and the hover state used to flash the original.
// Knows nothing about canvas drawing.
// ═══════════════════════════════════════════════════════════════════════════

const ROUND = 1000;

export const SCALE_OBJECTS = Object.freeze({
    skruv:        { label: 'Skruv',        w: 0.5, h: 4.0, type: 'skruv' },
    insekt:       { label: 'Insekt',       w: 1.4, h: 2.0, type: 'insekt' },
    gem:          { label: 'Gem',          w: 0.8, h: 3.0, type: 'gem' },
    blyertspenna: { label: 'Blyertspenna', w: 0.6, h: 7.0, type: 'blyertspenna' },
    rektangel:    { label: 'Rektangel',    w: 4.0, h: 2.5, type: 'rektangel' },
    kvadrat:      { label: 'Kvadrat',      w: 3.0, h: 3.0, type: 'kvadrat' },
});

export const SCALE_RATIOS = Object.freeze({
    reductions: [{ n: 1, d: 100 }, { n: 1, d: 10 }, { n: 1, d: 5 }, { n: 1, d: 2 }],
    original:    { n: 1, d: 1 },
    enlargements: [{ n: 2, d: 1 }, { n: 5, d: 1 }, { n: 10, d: 1 }],
});

const DEFAULT_OBJECT_KEY = 'gem';

export class ScaleEngine {
    #activeObject;
    #objWCm;
    #objHCm;
    #lockProp = false;
    #numerator = 1;
    #denominator = 1;
    #hovering = false;
    #listeners = new Set();

    constructor() { this.setObject(DEFAULT_OBJECT_KEY); }

    setObject(key) {
        const def = SCALE_OBJECTS[key];
        if (!def) return;
        this.#activeObject = key;
        this.#objWCm = def.w;
        this.#objHCm = def.h;
        this.#emit();
    }

    setScale(numerator, denominator) {
        if (!Number.isFinite(numerator) || !Number.isFinite(denominator)) return;
        if (numerator <= 0 || denominator <= 0) return;
        this.#numerator = numerator;
        this.#denominator = denominator;
        this.#emit();
    }

    setLockProportion(locked) { this.#lockProp = !!locked; this.#emit(); }

    setWidthCm(newWCm) {
        if (!Number.isFinite(newWCm) || newWCm <= 0) return;
