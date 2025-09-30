/**
 * TodoFooter Component - Shows todo count, filters, and clear completed button
 */

export class TodoFooter {
    constructor(framework, store) {
        this.framework = framework;
        this.store = store;
    }

    render(currentFilter = 'all') {
        const state = this.store.getState();
        const activeCount = this.store.selectors.getActiveCount(state);
        const hasCompletedTodos = this.store.selectors.hasCompletedTodos(state);

        const footer = this.framework.createElement('footer', { className: 'footer' },
            this.renderTodoCount(activeCount),
            this.renderFilterLinks(currentFilter),
            hasCompletedTodos ? this.renderClearCompleted() : null
        );

        return footer;
    }

    renderTodoCount(activeCount) {
        const itemText = activeCount === 1 ? 'item' : 'items';

        return this.framework.createElement('span', { className: 'todo-count' },
            this.framework.createElement('strong', {}, activeCount.toString()),
            ` ${itemText} left`
        );
    }

    renderFilterLinks(currentFilter) {
        const filters = [
            { name: 'All', value: 'all', href: '#/' },
            { name: 'Active', value: 'active', href: '#/active' },
            { name: 'Completed', value: 'completed', href: '#/completed' }
        ];

        const filterElements = filters.map(filter => {
            const isSelected = currentFilter === filter.value;

            const link = this.framework.createElement('a', {
                href: filter.href,
                className: isSelected ? 'selected' : '',
                onClick: (event) => {
                    event.preventDefault();
                    this.framework.navigate(filter.href);
                }
            }, filter.name);

            return this.framework.createElement('li', {}, link);
        });

        return this.framework.createElement('ul', { className: 'filters' }, ...filterElements);
    }

    renderClearCompleted() {
        const clearButton = this.framework.createElement('button', {
            className: 'clear-completed',
            onClick: () => {
                this.store.dispatch(this.store.actions.clearCompleted());
            }
        }, 'Clear completed');

        return clearButton;
    }
}