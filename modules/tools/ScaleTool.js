import { ScaleEngine } from './ScaleEngine.js';
import { ScaleView } from './ScaleView.js';

export const ScaleTool = {
    id: 'scale',
    title: 'Skala och mått',
    mount(parentEl) {
        const engine = new ScaleEngine();
        const view = new ScaleView(engine);
        const root = view.mount(parentEl);
        this._view = view;
        return root;
    },
    onEnter() { this._view?.onEnter(); },
    onResize() { this._view?.onEnter(); },
};
