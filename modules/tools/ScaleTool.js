// ═══════════════════════════════════════════════════════════════════════════
// modules/tools/ScaleTool.js
//
// Assembles the Scale engine and view into a ToolModule. Exported as a
// pre-built object (rather than a factory) to match the existing
// main.js import style: `import { ScaleTool } from './tools/ScaleTool.js'`
// ═══════════════════════════════════════════════════════════════════════════

import { ScaleEngine } from './ScaleEngine.js';
import { ScaleView }   from './ScaleView.js';

const engine = new ScaleEngine();
const view   = new ScaleView(engine);

export const ScaleTool = {
    id:    'scale',
    title: '<i class="fas fa-ruler-combined text-soft-blue mr-2"></i>Skala och mått',

    mount(parent) { return view.mount(parent); },
    onEnter()     { view.onEnter(); },
    onLeave()     { view.onLeave(); },

    _engine: engine,
    _view:   view,
};
