/**
 * TodoList Component - Renders the list of todos
 */

import { TodoItem } from './TodoItem.js';

export class TodoList {
    constructor(framework, store) {
        this.framework = framework;
        this.store = store;
        this.todoItems = new Map(); // Cache todo item components
    }

    render(filteredTodos, currentFilter) {
        const listElement = this.framework.createElement('ul', {
            className: 'todo-list'
        }, ...this.renderTodoItems(filteredTodos));

        return listElement;
    }

    renderTodoItems(todos) {
        return todos.map(todo => {
            // Reuse existing TodoItem component if possible
            if (!this.todoItems.has(todo.id)) {
                this.todoItems.set(todo.id, new TodoItem(this.framework, this.store));
            }

            const todoItem = this.todoItems.get(todo.id);
            const renderedItem = todoItem.render(todo);

            // Add key prop for efficient reconciliation
            if (renderedItem && renderedItem.props) {
                renderedItem.props.key = todo.id;
                renderedItem.key = todo.id;
            }

            return renderedItem;
        });
    }

    // Clean up unused todo items
    cleanup(currentTodoIds) {
        for (const [id, todoItem] of this.todoItems) {
            if (!currentTodoIds.includes(id)) {
                todoItem.destroy && todoItem.destroy();
                this.todoItems.delete(id);
            }
        }
    }

    destroy() {
        this.todoItems.forEach(todoItem => {
            todoItem.destroy && todoItem.destroy();
        });
        this.todoItems.clear();
    }
}