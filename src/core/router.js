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
        this.isNavigating = false; // Guard against concurrent navigation
    }

    init() {
        if (this.isInitialized) {
            return;
        }

        this.setupEventListeners();
        this.handleInitialRoute();
        this.isInitialized = true;
    }

    setupEventListeners() {
        // Handle hash changes (hash mode only)
        if (this.mode === 'hash') {
            this.hashchangeHandler = () => {
                this.handleRouteChange();
            };
            window.addEventListener('hashchange', this.hashchangeHandler);
        } else {
            // Handle browser back/forward buttons (history mode only)
            this.popstateHandler = (event) => {
                this.handleRouteChange(event.state);
            };
            window.addEventListener('popstate', this.popstateHandler);
        }

        // Handle link clicks for SPA navigation
        this.clickHandler = (event) => {
            this.handleLinkClick(event);
        };
        document.addEventListener('click', this.clickHandler);
    }

    handleLinkClick(event) {
        const link = event.target.closest('a[href]');
        if (!link) return;

        const href = link.getAttribute('href');

        // Only handle internal links
        if (href.startsWith('http') || href.startsWith('//')) {
            return;
        }

        // In hash mode, handle all hash links
        // In history mode, skip hash links (they're for same-page anchors)
        if (this.mode === 'history' && href.startsWith('#')) {
            return;
        }

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

        // Strip hash prefix if present (in hash mode, paths should not include the #)
        let normalizedPath = path;
        if (this.mode === 'hash' && path.startsWith('#')) {
            normalizedPath = path.slice(1);
        }

        if (normalizedPath === this.currentPath) {
            return;
        }

        const fullPath = this.resolvePath(normalizedPath);

        if (this.mode === 'hash') {
            if (replace) {
                window.location.replace(`${window.location.pathname}#${fullPath}`);
            } else {
                window.location.hash = fullPath;
            }
            // Don't call handleRouteChange here - hashchange event will trigger it
        } else {
            if (replace) {
                window.history.replaceState(state, '', fullPath);
            } else {
                window.history.pushState(state, '', fullPath);
            }
            // For history mode, we need to manually call handleRouteChange
            this.handleRouteChange(state, fullPath);
        }
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

        // Prevent concurrent route changes
        if (this.isNavigating) {
            return;
        }

        this.isNavigating = true;

        const matchedRoute = this.matchRoute(targetPath);

        if (!matchedRoute) {
            this.isNavigating = false;
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
                if (result === false) {
                    this.isNavigating = false;
                    return; // Navigation cancelled
                }
            }

            // Run route-specific beforeEnter guard
            if (route.beforeEnter) {
                const result = await this.runHook(route.beforeEnter, routeContext);
                if (result === false) {
                    this.isNavigating = false;
                    return;
                }
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

            this.isNavigating = false;

        } catch (error) {
            this.isNavigating = false;
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

        // Sort routes to prioritize specific routes over wildcards
        const sortedRoutes = Array.from(this.routes.entries()).sort((a, b) => {
            const [pathA] = a;
            const [pathB] = b;
            // Wildcard routes go last
            if (pathA === '*') return 1;
            if (pathB === '*') return -1;
            // More specific routes (with more segments) go first
            return pathB.split('/').length - pathA.split('/').length;
        });

        for (const [routePath, route] of sortedRoutes) {
            const params = this.matchPath(routePath, pathname);
            if (params !== null) {
                return { route, params, query, routePath };
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