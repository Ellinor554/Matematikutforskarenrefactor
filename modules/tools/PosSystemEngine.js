export const POS_COL_DEFS = [
    { key: 'tusental',  label: 'Tusental',  color: '#1E88E5', textColor: '#fff', value: 1000 },
    { key: 'hundratal', label: 'Hundratal', color: '#388E3C', textColor: '#fff', value: 100  },
    { key: 'tiotal',    label: 'Tiotal',    color: '#F9A825', textColor: '#222', value: 10   },
    { key: 'ental',     label: 'Ental',     color: '#E53935', textColor: '#fff', value: 1    },
];

export class PosSystemEngine {
    #visibleCols = { tusental: true, hundratal: true, tiotal: true, ental: true };
    #showColumns = true;
    #autoExchange = true;
    #listeners = [];

    getVisibleCols() { return { ...this.#visibleCols }; }

    setVisibleCol(key, bool) {
        this.#visibleCols[key] = bool;
        this.#notify();
    }

    getShowColumns() { return this.#showColumns; }
    setShowColumns(bool) { this.#showColumns = bool; this.#notify(); }

    getAutoExchange() { return this.#autoExchange; }
    setAutoExchange(bool) { this.#autoExchange = bool; this.#notify(); }

    getState() {
        return {
            visibleCols: { ...this.#visibleCols },
            showColumns: this.#showColumns,
            autoExchange: this.#autoExchange,
        };
    }

    subscribe(listener) {
        this.#listeners.push(listener);
        return () => { this.#listeners = this.#listeners.filter(l => l !== listener); };
    }

    #notify() { this.#listeners.forEach(l => l()); }
}
