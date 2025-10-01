/**
 * State Management System
 * Centralized state store with reactive updates and cross-component accessibility
 */

class Store {
    constructor(initialState = {}, reducers = {}) {
        this.state = { ...initialState };
        this.reducers = reducers;
        this.subscribers = new Set();
        this.middleware = [];
        this.devTools = typeof window !== 'undefined' && window.__REDUX_DEVTOOLS_EXTENSION__;

        if (this.devTools) {
            this.devToolsConnection = this.devTools.connect();
            this.devToolsConnection.init(this.state);
        }
    }

    /**
     * Deep clone helper function
     * @param {*} obj - Object to clone
     * @returns {*} Deep cloned object
     */
    deepClone(obj) {
        if (obj === null || typeof obj !== 'object') {
            return obj;
        }

        if (obj instanceof Date) {
            return new Date(obj.getTime());
        }

        if (obj instanceof Array) {
            return obj.map(item => this.deepClone(item));
        }

        if (obj instanceof Object) {
            const clonedObj = {};
            for (const key in obj) {
                if (obj.hasOwnProperty(key)) {
                    clonedObj[key] = this.deepClone(obj[key]);
                }
            }
            return clonedObj;
        }
    }

    getState() {
        return this.deepClone(this.state);
    }

    setState(newState, action = { type: 'SET_STATE' }) {
        const prevState = { ...this.state };
        this.state = { ...this.state, ...newState };

        // Notify DevTools
        if (this.devToolsConnection) {
            this.devToolsConnection.send(action, this.state);
        }

        // Notify subscribers
        this.notifySubscribers(this.state, prevState, action);
    }

    dispatch(action) {
        if (typeof action === 'function') {
            // Thunk middleware
            return action(this.dispatch.bind(this), this.getState.bind(this));
        }

        const prevState = { ...this.state };

        // Apply middleware
        let processedAction = action;
        for (const middleware of this.middleware) {
            processedAction = middleware(processedAction, this.getState.bind(this), this.dispatch.bind(this));
        }

        // Apply reducers
        if (this.reducers[processedAction.type]) {
            this.state = this.reducers[processedAction.type](this.state, processedAction);
        } else if (processedAction.type.includes('/')) {
            // Handle namespaced actions (e.g., 'todos/ADD_TODO')
            const [namespace] = processedAction.type.split('/');
            if (this.reducers[namespace]) {
                this.state = {
                    ...this.state,
                    [namespace]: this.reducers[namespace](this.state[namespace], processedAction)
                };
            }
        }

        // Notify DevTools
        if (this.devToolsConnection) {
            this.devToolsConnection.send(processedAction, this.state);
        }

        // Notify subscribers
        this.notifySubscribers(this.state, prevState, processedAction);

        return processedAction;
    }

    subscribe(callback) {
        this.subscribers.add(callback);

        // Return unsubscribe function
        return () => {
            this.subscribers.delete(callback);
        };
    }

    notifySubscribers(currentState, prevState, action) {
        this.subscribers.forEach(callback => {
            try {
                callback(currentState, prevState, action);
            } catch (error) {
                console.error('State subscriber error:', error);
            }
        });
    }

    addMiddleware(middleware) {
        this.middleware.push(middleware);
    }

    // Computed values with caching
    computed(selector, dependencies = []) {
        let cachedResult;
        let cachedDeps;

        return () => {
            const currentDeps = dependencies.map(dep =>
                typeof dep === 'function' ? dep(this.state) : this.state[dep]
            );

            if (!cachedDeps || !this.shallowEqual(cachedDeps, currentDeps)) {
                cachedResult = selector(this.state);
                cachedDeps = currentDeps;
            }

            return cachedResult;
        };
    }

    shallowEqual(arr1, arr2) {
        if (arr1.length !== arr2.length) return false;
        return arr1.every((val, i) => val === arr2[i]);
    }
}

export class StateManager {
    constructor() {
        this.stores = new Map();
        this.globalStore = new Store();
    }

    createStore(initialState = {}, reducers = {}) {
        return new Store(initialState, reducers);
    }

    getGlobalStore() {
        return this.globalStore;
    }

    // Named stores for different contexts
    createNamedStore(name, initialState = {}, reducers = {}) {
        const store = new Store(initialState, reducers);
        this.stores.set(name, store);
        return store;
    }

    getStore(name) {
        return this.stores.get(name);
    }

    // React-like hooks for state management
    useState(initialValue) {
        let value = initialValue;
        const subscribers = new Set();

        const setState = (newValue) => {
            const prevValue = value;
            value = typeof newValue === 'function' ? newValue(prevValue) : newValue;

            subscribers.forEach(callback => callback(value, prevValue));
        };

        const subscribe = (callback) => {
            subscribers.add(callback);
            return () => subscribers.delete(callback);
        };

        return [() => value, setState, subscribe];
    }

    // Context-like provider
    createContext(defaultValue) {
        let value = defaultValue;
        const subscribers = new Set();

        return {
            provide(newValue) {
                value = newValue;
                subscribers.forEach(callback => callback(value));
            },

            consume() {
                return value;
            },

            subscribe(callback) {
                subscribers.add(callback);
                return () => subscribers.delete(callback);
            }
        };
    }

    // Reactive state binding
    reactive(initialState) {
        const state = { ...initialState };
        const subscribers = new Map(); // property -> Set of callbacks

        const handler = {
            get(target, property) {
                return target[property];
            },

            set(target, property, value) {
                const oldValue = target[property];
                target[property] = value;

                // Notify property-specific subscribers
                if (subscribers.has(property)) {
                    subscribers.get(property).forEach(callback => {
                        callback(value, oldValue, property);
                    });
                }

                // Notify global subscribers
                if (subscribers.has('*')) {
                    subscribers.get('*').forEach(callback => {
                        callback(target, property, value, oldValue);
                    });
                }

                return true;
            }
        };

        const proxy = new Proxy(state, handler);

        // Add subscription methods
        proxy.$watch = (property, callback) => {
            if (!subscribers.has(property)) {
                subscribers.set(property, new Set());
            }
            subscribers.get(property).add(callback);

            return () => {
                if (subscribers.has(property)) {
                    subscribers.get(property).delete(callback);
                }
            };
        };

        proxy.$watchAll = (callback) => {
            return proxy.$watch('*', callback);
        };

        return proxy;
    }

    // Middleware factory functions
    static createLoggerMiddleware(options = {}) {
        return (action, getState, dispatch) => {
            if (options.logActions !== false) {
                console.group(`Action: ${action.type}`);
                console.log('Payload:', action);
                console.log('State:', getState());
                console.groupEnd();
            }
            return action;
        };
    }

    static createThunkMiddleware() {
        return (action, getState, dispatch) => {
            if (typeof action === 'function') {
                return action(dispatch, getState);
            }
            return action;
        };
    }

    static createPersistenceMiddleware(storageKey = 'app-state') {
        return (action, getState, dispatch) => {
            // Save state to localStorage after action
            setTimeout(() => {
                try {
                    localStorage.setItem(storageKey, JSON.stringify(getState()));
                } catch (error) {
                    console.warn('Failed to persist state:', error);
                }
            }, 0);

            return action;
        };
    }

    // Load persisted state
    static loadPersistedState(storageKey = 'app-state', fallback = {}) {
        try {
            const persistedState = localStorage.getItem(storageKey);
            return persistedState ? JSON.parse(persistedState) : fallback;
        } catch (error) {
            console.warn('Failed to load persisted state:', error);
            return fallback;
        }
    }
}