/**
 * Main TodoApp Component
 */

import { TodoHeader } from './TodoHeader.js';
import { TodoList } from './TodoList.js';
import { TodoFooter } from './TodoFooter.js';

export class TodoApp {
    constructor(framework, store) {
        this.framework = framework;
        this.store = store;

        // Create child components
        this.header = new TodoHeader(framework, store);
        this.list = new TodoList(framework, store);
        this.footer = new TodoFooter(framework, store);

        // Subscribe to store changes
        this.unsubscribe = store.subscribe(() => {
            this.update();
        });
    }

    setFilter(filter) {
        this.store.dispatch(this.store.actions.setFilter(filter));
    }

    update() {
        // Re-render the app when store changes
        const container = document.getElementById('todoapp');
        if (container) {
            // Use proper Virtual DOM diffing instead of forcing full re-render
            this.framework.render(this.render(), container);
        }
    }

    render() {
        const state = this.store.getState();
        const filteredTodos = this.store.selectors.getFilteredTodos(state);
        const hasTodos = state.todos.length > 0;

        const children = [this.header.render()];

        // Main section - only show if there are todos
        if (hasTodos) {
            const toggleAllElements = this.renderToggleAll();
            children.push(
                this.framework.createElement('section', { className: 'main', key: 'main' },
                    ...(Array.isArray(toggleAllElements) ? toggleAllElements : [toggleAllElements]),
                    this.list.render(filteredTodos, state.filter)
                )
            );

            // Footer - only show if there are todos
            children.push(this.footer.render(state.filter));
        }

        return this.framework.createElement('div', {}, ...children.filter(Boolean));
    }

    renderToggleAll() {
        const state = this.store.getState();
        const areAllCompleted = this.store.selectors.areAllCompleted(state);

        const toggleAllInput = this.framework.createElement('input', {
            id: 'toggle-all',
            className: 'toggle-all',
            type: 'checkbox',
            checked: areAllCompleted,
            onChange: (e) => {
                console.log('[TodoApp] onChange fired, checked:', e.target.checked, 'timestamp:', Date.now());
                this.store.dispatch(this.store.actions.toggleAll());
            }
        });

        const toggleAllLabel = this.framework.createElement('label', {
            htmlFor: 'toggle-all'
        }, 'Mark all as complete');

        return [toggleAllInput, toggleAllLabel];
    }

    destroy() {
        if (this.unsubscribe) {
            this.unsubscribe();
        }
        this.header.destroy && this.header.destroy();
        this.list.destroy && this.list.destroy();
        this.footer.destroy && this.footer.destroy();
    }
}