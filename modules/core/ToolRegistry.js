import { bus } from './EventBus.js';
import { appState } from './AppState.js';

export class ToolRegistry {
    #tools = new Map();
    #mountPoint = null;
    #titleEl = null;
    #backBtn = null;
    #controlsArea = null;
    #currentRoot = null;
    #currentTool = null;

    init(mountPoint, titleEl, backBtn, controlsArea) {
        this.#mountPoint = mountPoint;
        this.#titleEl = titleEl;
        this.#backBtn = backBtn;
        this.#controlsArea = controlsArea;

        bus.on('tool:activated', ({ id }) => this.#showTool(id));
        bus.on('tool:deactivated', ({ id }) => this.#hideTool(id));

        backBtn.addEventListener('click', () => appState.setActiveTool('home'));
    }

    register(toolModule) {
        this.#tools.set(toolModule.id, toolModule);
    }

    #showTool(id) {
        const tool = this.#tools.get(id);
        if (!tool) return;

        // Clear previous
        if (this.#currentRoot) {
            this.#currentRoot.remove();
            this.#currentRoot = null;
        }
        this.#controlsArea.innerHTML = '';

        if (id === 'home') {
            this.#backBtn.classList.add('hidden');
            this.#titleEl.innerHTML = '<i class="fas fa-shapes text-soft-blue mr-2"></i> Matematikutforskaren';
        } else {
            this.#backBtn.classList.remove('hidden');
            this.#titleEl.innerHTML = tool.title;
            // Add fullscreen button
            this.#controlsArea.innerHTML = `
                <button id="fs-btn" onclick="document.documentElement.requestFullscreen&&document.documentElement.requestFullscreen()" 
                    class="flex items-center gap-2 px-4 py-2 bg-soft-blue text-white font-bold rounded-xl text-sm hover:opacity-90 transition-opacity shadow-sm">
                    <i class="fas fa-expand"></i> Helskärm
                </button>`;
        }

        const root = tool.mount(this.#mountPoint);
        this.#currentRoot = root;
        this.#currentTool = tool;

        if (tool.onEnter) setTimeout(() => tool.onEnter(), 80);
    }

    #hideTool(id) {
        const tool = this.#tools.get(id);
        if (tool?.onLeave) tool.onLeave();
    }
}
