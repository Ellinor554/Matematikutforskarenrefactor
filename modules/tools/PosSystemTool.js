import { PosSystemEngine } from './PosSystemEngine.js';
import { PosSystemView } from './PosSystemView.js';

export const PosSystemTool = {
    id: 'positionssystem',
    title: 'Positionssystemet',
    mount(parentEl) {
        const engine = new PosSystemEngine();
        const view = new PosSystemView(engine);
        const root = view.mount(parentEl);
        this._view = view;
        return root;
    },
};
