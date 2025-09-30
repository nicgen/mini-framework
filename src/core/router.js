/**
 * Router System
 * Handles URL-based routing with state synchronization
 */

export class Router {
    constructor() {
        this.routes = new Map();
        this.currentRoute = null;
        this.currentPath = '';
        this.beforeHooks = [];
        this.afterHooks = [];
        this.errorHandlers = [];
        this.basePath = '';
        this.mode = 'hash'; // 'hash' or 'history'

        this.isInitialized = false;
    }

    init() {
        if (this.isInitialized) return;

        this.setupEventListeners();
        this.handleInitialRoute();
        this.isInitialized = true;
    }

    setupEventListeners() {
        // Handle browser back/forward buttons
        window.addEventListener('popstate', (event) => {
            this.handleRouteChange(event.state);
        });

        // Handle hash changes
        if (this.mode === 'hash') {
            window.addEventListener('hashchange', () => {
                this.handleRouteChange();
            });
        }

        // Handle link clicks for SPA navigation
        document.addEventListener('click', (event) => {
            this.handleLinkClick(event);
        });
    }

    handleLinkClick(event) {
        const link = event.target.closest('a[href]');
        if (!link) return;

        const href = link.getAttribute('href');

        // Only handle internal links
        if (href.startsWith('http') || href.startsWith('//')) return;

        // Skip if it's a hash link to the same page
        if (href.startsWith('#') && this.mode !== 'hash') return;

        event.preventDefault();
        this.navigate(href);
    }

    handleInitialRoute() {
        const initialPath = this.getCurrentPath();
        this.handleRouteChange(null, initialPath);
    }

    getCurrentPath() {
        if (this.mode === 'hash') {
            return window.location.hash.slice(1) || '/';
        } else {
            return window.location.pathname + window.location.search;
        }
    }

    route(path, handler, options = {}) {
        const routeConfig = {
            handler,
            name: options.name,
            meta: options.meta || {},
            beforeEnter: options.beforeEnter,
            children: options.children || []
        };

        this.routes.set(path, routeConfig);

        // Handle nested routes
        if (options.children) {
            options.children.forEach(child => {
                const childPath = this.joinPaths(path, child.path);
                this.route(childPath, child.handler, child);
            });
        }

        return this;
    }

    navigate(path, options = {}) {
        const { replace = false, state = null } = options;

        if (path === this.currentPath) return;

        const fullPath = this.resolvePath(path);

        if (this.mode === 'hash') {
            if (replace) {
                window.location.replace(`${window.location.pathname}#${fullPath}`);
            } else {
                window.location.hash = fullPath;
            }
        } else {
            if (replace) {
                window.history.replaceState(state, '', fullPath);
            } else {
                window.history.pushState(state, '', fullPath);
            }
        }

        this.handleRouteChange(state, fullPath);
    }

    back() {
        window.history.back();
    }

    forward() {
        window.history.forward();
    }

    resolvePath(path) {
        if (path.startsWith('/')) return path;
        return this.joinPaths(this.basePath, path);
    }

    joinPaths(...paths) {
        return paths
            .map(path => path.replace(/^\/+|\/+$/g, ''))
            .filter(Boolean)
            .join('/') || '/';
    }

    async handleRouteChange(state = null, path = null) {
        const targetPath = path || this.getCurrentPath();
        const matchedRoute = this.matchRoute(targetPath);

        if (!matchedRoute) {
            this.handleNotFound(targetPath);
            return;
        }

        const { route, params, query } = matchedRoute;

        // Create route context
        const routeContext = {
            path: targetPath,
            params,
            query,
            state,
            meta: route.meta,
            from: this.currentRoute
        };

        try {
            // Run before hooks
            for (const hook of this.beforeHooks) {
                const result = await this.runHook(hook, routeContext);
                if (result === false) return; // Navigation cancelled
            }

            // Run route-specific beforeEnter guard
            if (route.beforeEnter) {
                const result = await this.runHook(route.beforeEnter, routeContext);
                if (result === false) return;
            }

            // Execute route handler
            await this.executeRoute(route, routeContext);

            // Update current route
            this.currentRoute = routeContext;
            this.currentPath = targetPath;

            // Run after hooks
            for (const hook of this.afterHooks) {
                await this.runHook(hook, routeContext);
            }

        } catch (error) {
            this.handleRouteError(error, routeContext);
        }
    }

    async runHook(hook, context) {
        if (typeof hook === 'function') {
            return await hook(context);
        }
        return true;
    }

    matchRoute(path) {
        const [pathname, search] = path.split('?');
        const query = this.parseQuery(search);

        for (const [routePath, route] of this.routes) {
            const params = this.matchPath(routePath, pathname);
            if (params !== null) {
                return { route, params, query };
            }
        }

        return null;
    }

    matchPath(routePath, actualPath) {
        // Convert route pattern to regex
        const paramNames = [];
        const regexPattern = routePath
            .replace(/\/:([^\/]+)/g, (match, paramName) => {
                paramNames.push(paramName);
                return '/([^/]+)';
            })
            .replace(/\*/g, '(.*)');

        const regex = new RegExp(`^${regexPattern}$`);
        const match = actualPath.match(regex);

        if (!match) return null;

        // Extract parameters
        const params = {};
        paramNames.forEach((name, index) => {
            params[name] = decodeURIComponent(match[index + 1]);
        });

        return params;
    }

    parseQuery(queryString = '') {
        const params = {};
        if (!queryString) return params;

        queryString.split('&').forEach(pair => {
            const [key, value] = pair.split('=');
            if (key) {
                params[decodeURIComponent(key)] = decodeURIComponent(value || '');
            }
        });

        return params;
    }

    async executeRoute(route, context) {
        if (typeof route.handler === 'function') {
            await route.handler(context);
        } else if (typeof route.handler === 'object' && route.handler.render) {
            await route.handler.render(context);
        }
    }

    handleNotFound(path) {
        const notFoundRoute = this.routes.get('*') || this.routes.get('/404');

        if (notFoundRoute) {
            this.executeRoute(notFoundRoute, { path, params: {}, query: {}, meta: {} });
        } else {
            console.warn(`No route found for path: ${path}`);
        }
    }

    handleRouteError(error, context) {
        console.error('Route error:', error);

        for (const handler of this.errorHandlers) {
            try {
                handler(error, context);
            } catch (handlerError) {
                console.error('Error handler failed:', handlerError);
            }
        }
    }

    // Hook registration
    beforeEach(hook) {
        this.beforeHooks.push(hook);
    }

    afterEach(hook) {
        this.afterHooks.push(hook);
    }

    onError(handler) {
        this.errorHandlers.push(handler);
    }

    // Route building helpers
    buildPath(name, params = {}, query = {}) {
        // Find route by name
        for (const [path, route] of this.routes) {
            if (route.name === name) {
                let builtPath = path;

                // Replace parameters
                Object.entries(params).forEach(([key, value]) => {
                    builtPath = builtPath.replace(`:${key}`, encodeURIComponent(value));
                });

                // Add query parameters
                const queryString = Object.entries(query)
                    .map(([key, value]) => `${encodeURIComponent(key)}=${encodeURIComponent(value)}`)
                    .join('&');

                return queryString ? `${builtPath}?${queryString}` : builtPath;
            }
        }

        throw new Error(`Route with name "${name}" not found`);
    }

    // Utility methods
    setMode(mode) {
        if (mode !== 'hash' && mode !== 'history') {
            throw new Error('Router mode must be "hash" or "history"');
        }
        this.mode = mode;
    }

    setBasePath(path) {
        this.basePath = path.replace(/\/$/, '');
    }

    getCurrentRoute() {
        return this.currentRoute;
    }

    getCurrentPathName() {
        return this.currentPath;
    }

    // Cleanup
    destroy() {
        window.removeEventListener('popstate', this.handleRouteChange);
        window.removeEventListener('hashchange', this.handleRouteChange);
        this.routes.clear();
        this.beforeHooks = [];
        this.afterHooks = [];
        this.errorHandlers = [];
        this.isInitialized = false;
    }
}