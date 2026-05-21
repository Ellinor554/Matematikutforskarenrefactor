import { GeometryEngine } from './GeometryEngine.js';
import { GeometryView }   from './GeometryView.js';

export function createGeometryTool() {
    const engine = new GeometryEngine();
    const view   = new GeometryView(engine);
    return {
        id:    'geometry',
        title: 'Geometri',
        mount(parentEl) { return view.mount(parentEl); },
        onLeave()       { view.cleanup(); },
    };
}
