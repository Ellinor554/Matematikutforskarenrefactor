import { CountingEngine } from './CountingEngine.js';
import { CountingView }   from './CountingView.js';

export function CountingTool() {
    const engine = new CountingEngine();
    const view   = new CountingView(engine);
    return {
        id:    'counting',
        title: 'Räkning',
        mount(parentEl) { return view.mount(parentEl); },
        onLeave()       { view.cleanup(); },
    };
}
