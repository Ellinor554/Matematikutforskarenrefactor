export class CountingEngine {
    #mode      = 'friends'; // 'friends' | 'multiplication' | 'division'
    #listeners = [];

    setMode(mode) { this.#mode = mode; this.#notify(); }
    getMode()     { return this.#mode; }

    subscribe(listener) {
        this.#listeners.push(listener);
        return () => { this.#listeners = this.#listeners.filter(l => l !== listener); };
    }

    #notify() { this.#listeners.forEach(l => l()); }
}
