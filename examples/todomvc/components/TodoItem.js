/**
 * TodoItem Component - Individual todo item with editing capabilities
 */

export class TodoItem {
    constructor(framework, store) {
        this.framework = framework;
        this.store = store;
        this.isEditing = false;
        this.editingId = null;
    }

    render(todo) {
        const itemClasses = [];
        if (todo.completed) itemClasses.push('completed');
        if (this.isEditing && this.editingId === todo.id) itemClasses.push('editing');

        const listItem = this.framework.createElement('li', {
            className: itemClasses.join(' '),
            'data-id': todo.id
        });

        if (this.isEditing && this.editingId === todo.id) {
            // Render edit mode
            return this.framework.createElement('li', {
                className: itemClasses.join(' '),
                'data-id': todo.id
            }, this.renderEditInput(todo));
        } else {
            // Render view mode
            return this.framework.createElement('li', {
                className: itemClasses.join(' '),
                'data-id': todo.id
            }, this.renderViewMode(todo));
        }
    }

    renderViewMode(todo) {
        // Toggle checkbox
        const toggleInput = this.framework.createElement('input', {
            className: 'toggle',
            type: 'checkbox',
            checked: todo.completed,
            onChange: () => {
                this.store.dispatch(this.store.actions.toggleTodo(todo.id));
            }
        });

        // Todo label
        const label = this.framework.createElement('label', {
            onDblClick: () => {
                this.startEditing(todo.id);
            }
        }, todo.text);

        // Delete button
        const deleteButton = this.framework.createElement('button', {
            className: 'destroy',
            onClick: () => {
                this.store.dispatch(this.store.actions.deleteTodo(todo.id));
            }
        });

        const viewDiv = this.framework.createElement('div', { className: 'view' },
            toggleInput, label, deleteButton
        );

        return viewDiv;
    }

    renderEditInput(todo) {
        const editInput = this.framework.createElement('input', {
            className: 'edit',
            value: todo.text,
            autofocus: true,
            onBlur: (event) => {
                this.finishEditing(todo.id, event.target.value);
            },
            onKeydown: (event) => {
                if (event.key === 'Enter') {
                    this.finishEditing(todo.id, event.target.value);
                } else if (event.key === 'Escape') {
                    this.cancelEditing();
                }
            }
        });

        return editInput;
    }

    startEditing(todoId) {
        this.isEditing = true;
        this.editingId = todoId;
        // Trigger re-render
        this.forceUpdate();
    }

    finishEditing(todoId, newText) {
        if (!this.isEditing || this.editingId !== todoId) return;

        this.isEditing = false;
        this.editingId = null;

        const trimmedText = newText.trim();

        if (trimmedText) {
            this.store.dispatch(this.store.actions.editTodo(todoId, trimmedText));
        } else {
            // Delete todo if text is empty
            this.store.dispatch(this.store.actions.deleteTodo(todoId));
        }
    }

    cancelEditing() {
        this.isEditing = false;
        this.editingId = null;
        // Trigger re-render by dispatching an action that will cause the component to re-render
        // We use setFilter with the current filter to trigger a harmless re-render
        const currentFilter = this.store.selectors.getCurrentFilter(this.store.getState());
        this.store.dispatch(this.store.actions.setFilter(currentFilter));
    }

    forceUpdate() {
        // Trigger a re-render through the store by dispatching the current filter again
        const currentFilter = this.store.selectors.getCurrentFilter(this.store.getState());
        this.store.dispatch(this.store.actions.setFilter(currentFilter));
    }
}