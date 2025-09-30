/**
 * TodoHeader Component - Contains the input for adding new todos
 */

export class TodoHeader {
    constructor(framework, store) {
        this.framework = framework;
        this.store = store;
    }

    render() {
        const headerElement = this.framework.createElement('header', { className: 'header' },
            this.framework.createElement('h1', {}, 'todos'),
            this.renderNewTodoInput()
        );

        return headerElement;
    }

    renderNewTodoInput() {
        const input = this.framework.createElement('input', {
            className: 'new-todo',
            placeholder: 'What needs to be done?',
            autofocus: true,
            onKeydown: (event) => {
                if (event.key === 'Enter') {
                    this.handleAddTodo(event);
                }
            }
        });

        return input;
    }

    handleAddTodo(event) {
        const input = event.target;
        const text = input.value.trim();

        console.log('Adding todo:', text);

        if (text) {
            this.store.dispatch(this.store.actions.addTodo(text));
            input.value = '';
            console.log('Todo added, new state:', this.store.getState());
        }
    }
}