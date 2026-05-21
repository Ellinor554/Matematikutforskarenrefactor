const SCALE_CELL_PX = 40;
const SCALE_ROUND = 1000;

export const SCALE_OBJECTS = [
    { key: 'skruv',       label: 'Skruv',        wCm: 0.5, hCm: 4   },
    { key: 'insekt',      label: 'Insekt',        wCm: 1.4, hCm: 2   },
    { key: 'gem',         label: 'Gem',           wCm: 0.8, hCm: 3   },
    { key: 'blyertspenna',label: 'Blyertspenna',  wCm: 0.6, hCm: 7   },
    { key: 'rektangel',   label: 'Rektangel',     wCm: 4,   hCm: 2.5 },
    { key: 'kvadrat',     label: 'Kvadrat',       wCm: 3,   hCm: 3   },
];

function fmtCm(cm) {
    const r = Math.round(cm * SCALE_ROUND) / SCALE_ROUND;
    if (Number.isInteger(r)) return r + ' cm';
    return r.toString().replace('.', ',') + ' cm';
}

export class ScaleEngine {
    #numerator = 1;
    #denominator = 4;
    #activeKey = 'gem';
    #wCm;
    #hCm;
    #lockProportions = false;
    #listeners = [];

    constructor() {
        const obj = SCALE_OBJECTS.find(o => o.key === this.#activeKey);
        this.#wCm = obj.wCm;
        this.#hCm = obj.hCm;
    }

    getScale() { return { numerator: this.#numerator, denominator: this.#denominator }; }
    getActiveKey() { return this.#activeKey; }
    getLockProportions() { return this.#lockProportions; }
    getDimensions() { return { wCm: this.#wCm, hCm: this.#hCm }; }

    getScaledDimensions() {
        const factor = this.#numerator / this.#denominator;
        return {
            wCm: Math.round(this.#wCm * factor * SCALE_ROUND) / SCALE_ROUND,
            hCm: Math.round(this.#hCm * factor * SCALE_ROUND) / SCALE_ROUND,
        };
    }

    setScale(numerator, denominator) {
        this.#numerator = numerator;
        this.#denominator = denominator;
        this.#notify();
    }

    setObject(key) {
        const obj = SCALE_OBJECTS.find(o => o.key === key);
        if (!obj) return;
        this.#activeKey = key;
        this.#wCm = obj.wCm;
        this.#hCm = obj.hCm;
        this.#notify();
    }

    setWidth(wCm) {
        const orig = SCALE_OBJECTS.find(o => o.key === this.#activeKey);
        if (this.#lockProportions && orig && orig.wCm > 0) {
            this.#hCm = Math.round(wCm * (orig.hCm / orig.wCm) * SCALE_ROUND) / SCALE_ROUND;
        }
        this.#wCm = wCm;
        this.#notify();
    }

    setHeight(hCm) {
        const orig = SCALE_OBJECTS.find(o => o.key === this.#activeKey);
        if (this.#lockProportions && orig && orig.hCm > 0) {
            this.#wCm = Math.round(hCm * (orig.wCm / orig.hCm) * SCALE_ROUND) / SCALE_ROUND;
        }
        this.#hCm = hCm;
        this.#notify();
    }

    setLockProportions(bool) { this.#lockProportions = bool; this.#notify(); }

    getState() {
        return {
            numerator: this.#numerator,
            denominator: this.#denominator,
            activeKey: this.#activeKey,
            wCm: this.#wCm,
            hCm: this.#hCm,
            lockProportions: this.#lockProportions,
            scaled: this.getScaledDimensions(),
            fmtCm,
        };
    }

    subscribe(listener) {
        this.#listeners.push(listener);
        return () => { this.#listeners = this.#listeners.filter(l => l !== listener); };
    }

    #notify() { this.#listeners.forEach(l => l()); }
}
