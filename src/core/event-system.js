/**
 * Custom Event System
 * Handles event delegation and custom event management without direct addEventListener usage
 */

export class EventSystem {
    constructor() {
        this.eventHandlers = new Map(); // element -> eventType -> handlers[]
        this.globalHandlers = new Map(); // eventType -> handlers[]
        this.delegateHandlers = new Map(); // eventType -> { selector, handler }[]
        this.customEvents = new Map(); // eventName -> listeners[]

        this.init();
    }

    init() {
        // Set up global event delegation
        this.setupGlobalDelegation();
    }

    setupGlobalDelegation() {
        const eventTypes = ['click', 'dblclick', 'change', 'input', 'keydown', 'keyup', 'submit', 'focus', 'blur', 'mousedown', 'mouseup', 'mouseover', 'mouseout', 'mouseenter', 'mouseleave'];

        eventTypes.forEach(eventType => {
            document.addEventListener(eventType, (e) => {
                this.handleGlobalEvent(e, eventType);
            }, eventType === 'mouseenter' || eventType === 'mouseleave' ? true : false);
        });
    }

    handleGlobalEvent(event, eventType) {
        const target = event.target;

        // Handle direct element handlers
        this.handleDirectEvents(event, eventType, target);

        // Handle delegated events
        this.handleDelegatedEvents(event, eventType, target);
    }

    handleDirectEvents(event, eventType, target) {
        // Walk up the DOM tree to find elements with handlers
        let currentElement = target;
        while (currentElement && currentElement !== document) {
            const elementHandlers = this.eventHandlers.get(currentElement);
            if (elementHandlers && elementHandlers.has(eventType)) {
                const handlers = elementHandlers.get(eventType);
                handlers.forEach(handler => {
                    try {
                        handler.call(currentElement, event);
                    } catch (error) {
                        console.error('Event handler error:', error);
                    }
                });
            }
            currentElement = currentElement.parentElement;
        }
    }

    handleDelegatedEvents(event, eventType, target) {
        const delegateHandlers = this.delegateHandlers.get(eventType);
        if (!delegateHandlers) return;

        // Walk up the DOM tree to find matching selectors
        let currentElement = target;
        while (currentElement && currentElement !== document) {
            delegateHandlers.forEach(({ selector, handler, element }) => {
                if (this.elementMatches(currentElement, selector)) {
                    try {
                        handler.call(currentElement, event);
                    } catch (error) {
                        console.error('Delegated event handler error:', error);
                    }
                }
            });
            currentElement = currentElement.parentElement;
        }
    }

    elementMatches(element, selector) {
        if (typeof selector === 'string') {
            return element.matches && element.matches(selector);
        }
        if (typeof selector === 'function') {
            return selector(element);
        }
        return element === selector;
    }

    // Main API methods
    on(element, eventType, handler, options = {}) {
        if (typeof element === 'string') {
            // Global event listener or custom event
            return this.onGlobal(element, eventType, handler);
        }

        if (!this.eventHandlers.has(element)) {
            this.eventHandlers.set(element, new Map());
        }

        const elementHandlers = this.eventHandlers.get(element);
        if (!elementHandlers.has(eventType)) {
            elementHandlers.set(eventType, []);
        }

        const handlers = elementHandlers.get(eventType);

        // Prevent adding the same handler twice
        if (handlers.includes(handler)) {
            return () => this.off(element, eventType, handler);
        }

        handlers.push(handler);

        // Return unsubscribe function
        return () => this.off(element, eventType, handler);
    }

    off(element, eventType, handler) {
        if (typeof element === 'string') {
            return this.offGlobal(element, eventType, handler);
        }

        const elementHandlers = this.eventHandlers.get(element);
        if (!elementHandlers) return;

        if (eventType && handler) {
            const handlers = elementHandlers.get(eventType);
            if (handlers) {
                const index = handlers.indexOf(handler);
                if (index > -1) {
                    handlers.splice(index, 1);
                }

                // If no more handlers for this event type, clean up the map
                if (handlers.length === 0) {
                    elementHandlers.delete(eventType);
                }
            }
        } else if (eventType) {
            elementHandlers.delete(eventType);
        } else {
            // Remove all handlers for this element
            this.eventHandlers.delete(element);
        }
    }

    // Global/Custom event handling
    onGlobal(eventType, handler, options = {}) {
        if (!this.globalHandlers.has(eventType)) {
            this.globalHandlers.set(eventType, []);
        }

        const handlers = this.globalHandlers.get(eventType);
        handlers.push({ handler, options });

        return () => this.offGlobal(eventType, handler);
    }

    offGlobal(eventType, handler) {
        const handlers = this.globalHandlers.get(eventType);
        if (!handlers) return;

        const index = handlers.findIndex(h => h.handler === handler);
        if (index > -1) {
            handlers.splice(index, 1);
        }
    }

    // Event delegation for dynamic content
    delegate(eventType, selector, handler, container = document) {
        if (!this.delegateHandlers.has(eventType)) {
            this.delegateHandlers.set(eventType, []);
        }

        const delegateHandlers = this.delegateHandlers.get(eventType);
        const delegateHandler = { selector, handler, container };
        delegateHandlers.push(delegateHandler);

        // Return unsubscribe function
        return () => {
            const index = delegateHandlers.indexOf(delegateHandler);
            if (index > -1) {
                delegateHandlers.splice(index, 1);
            }
        };
    }

    // Custom event emission
    emit(eventType, data = {}, element = document) {
        // Handle custom framework events
        if (this.customEvents.has(eventType)) {
            const listeners = this.customEvents.get(eventType);
            listeners.forEach(listener => {
                try {
                    listener(data);
                } catch (error) {
                    console.error('Custom event listener error:', error);
                }
            });
        }

        // Handle global handlers
        if (this.globalHandlers.has(eventType)) {
            const handlers = this.globalHandlers.get(eventType);
            handlers.forEach(({ handler }) => {
                try {
                    handler(data);
                } catch (error) {
                    console.error('Global event handler error:', error);
                }
            });
        }

        // Create and dispatch native event
        const customEvent = new CustomEvent(eventType, {
            detail: data,
            bubbles: true,
            cancelable: true
        });

        element.dispatchEvent(customEvent);
    }

    // Subscribe to custom events
    subscribe(eventType, listener) {
        if (!this.customEvents.has(eventType)) {
            this.customEvents.set(eventType, []);
        }

        const listeners = this.customEvents.get(eventType);
        listeners.push(listener);

        return () => {
            const index = listeners.indexOf(listener);
            if (index > -1) {
                listeners.splice(index, 1);
            }
        };
    }

    // Batch event operations
    batch(operations) {
        operations.forEach(({ type, ...args }) => {
            if (type === 'on') {
                this.on(...Object.values(args));
            } else if (type === 'off') {
                this.off(...Object.values(args));
            } else if (type === 'emit') {
                this.emit(...Object.values(args));
            }
        });
    }

    // Cleanup method
    cleanup() {
        this.eventHandlers.clear();
        this.globalHandlers.clear();
        this.delegateHandlers.clear();
        this.customEvents.clear();
    }
}