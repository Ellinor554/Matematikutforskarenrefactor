export class GeometryEngine {
    #autoRotate3D = true;
    #selectedEl   = null;
    #three3DCards = [];
    #listeners    = [];

    setAutoRotate(bool) { this.#autoRotate3D = bool; this.#notify(); }
    getAutoRotate()     { return this.#autoRotate3D; }

    setSelected(el) { this.#selectedEl = el; this.#notify(); }
    getSelected()   { return this.#selectedEl; }

    addCard(state)  { this.#three3DCards.push(state); }
    getCards()      { return [...this.#three3DCards]; }
    clearCards()    { this.#three3DCards = []; }

    subscribe(listener) {
        this.#listeners.push(listener);
        return () => { this.#listeners = this.#listeners.filter(l => l !== listener); };
    }

    #notify() { this.#listeners.forEach(l => l()); }
}
