/**
 * TodoMVC Application using MiniFramework
 */

import framework from '../../src/core/framework.js';
import { TodoApp } from './components/TodoApp.js';
import { createTodoStore } from './store/todoStore.js';

// Initialize the store
const store = createTodoStore();

// Create the main app component
const app = new TodoApp(framework, store);

// Set up routing
framework.route('/', () => app.setFilter('all'));
framework.route('/active', () => app.setFilter('active'));
framework.route('/completed', () => app.setFilter('completed'));

// Handle 404s - must come after specific routes
framework.route('*', () => app.setFilter('all'));

// Mount the application first
const container = document.getElementById('todoapp');
if (container) {
    // Render initial state
    framework.render(app.render(), container);
}

// Initialize the router (will handle initial route automatically)
framework.router.init();

// Export for debugging
window.app = app;
window.store = store;
window.framework = framework;