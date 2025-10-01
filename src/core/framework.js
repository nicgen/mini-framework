/**
 * MiniFramework - A lightweight JavaScript framework
 * Core API and framework orchestration
 */

import { VirtualDOM } from './virtual-dom.js';
import { EventSystem } from './event-system.js';
import { StateManager } from './state-manager.js';
import { Router } from './router.js';

class MiniFramework {
    constructor(options = {}) {
        // Initialize EventSystem first
        this.events = new EventSystem();

        // Pass EventSystem to VirtualDOM for integrated event handling
        this.vdom = new VirtualDOM(this.events);

        this.state = new StateManager();
        this.router = new Router();

        this.rootElement = options.root || document.body;
        this.currentApp = null;
    }

    // Main API methods
    createElement(tag, props = {}, ...children) {
        return this.vdom.createElement(tag, props, ...children);
    }

    render(element, container = this.rootElement) {
        return this.vdom.render(element, container);
    }

    component(ComponentClass) {
        return new ComponentClass(this);
    }

    // State management
    createStore(initialState, reducers = {}) {
        return this.state.createStore(initialState, reducers);
    }

    // Routing
    route(path, handler) {
        return this.router.route(path, handler);
    }

    navigate(path) {
        return this.router.navigate(path);
    }

    // App initialization
    mount(app, container = this.rootElement) {
        this.currentApp = app;
        this.router.init();
        return this.render(app, container);
    }

    // Lifecycle hooks
    onMount(callback) {
        this.events.on('framework:mount', callback);
    }

    onUnmount(callback) {
        this.events.on('framework:unmount', callback);
    }
}

// Global framework instance
const framework = new MiniFramework();

// Export both the class and the instance
export { MiniFramework, framework as default };