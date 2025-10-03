# MiniFramework Documentation

A lightweight JavaScript framework built from scratch to demonstrate modern web development concepts without using high-level frameworks like React, Angular, or Vue.

**GitHub Repository:** https://github.com/nicgen/mini-framework

## Table of Contents

- [Overview](#overview)
- [Features](#features)
- [Getting Started](#getting-started)
- [API Reference](#api-reference)
  - [Creating Elements](#creating-elements)
  - [Rendering](#rendering)
  - [State Management](#state-management)
  - [Routing](#routing)
  - [Event System](#event-system)
- [How the Framework Works](#how-the-framework-works)
- [Examples](#examples)
- [TodoMVC Implementation](#todomvc-implementation)

---

## Overview

MiniFramework is a custom JavaScript framework implementation project for the 01-edu curriculum. The framework provides DOM abstraction, routing, state management, and event handling without using existing frameworks.

This framework serves as both a learning exercise and a functional alternative to modern frameworks, demonstrating the underlying principles of DOM manipulation, state management, and reactive programming.

---

## Features

- **Virtual DOM** with O(n) diffing algorithm
- **Key-based list reconciliation** for efficient dynamic list updates
- **Component-based architecture** with lifecycle hooks (onMount, onUnmount)
- **Redux-style state management** with middleware support
- **Client-side routing** with hash-based navigation and parameter extraction
- **Global event delegation system** for efficient event handling
- **LocalStorage persistence** for data across page reloads
- **Redux DevTools integration** for debugging

---

## Getting Started

### Installation

```bash
# Clone the repository
git clone https://github.com/nicgen/mini-framework.git
cd mini-framework

# Install dependencies (for TodoMVC styling)
npm install
```

### Development

```bash
# Start development server
npm run dev
# or
python -m http.server 8080

# Serve the application
npm run serve
```

### Basic Usage

```javascript
import framework from './src/core/framework.js';

// Create elements
const app = framework.createElement('div', { className: 'app' },
    framework.createElement('h1', {}, 'Hello, MiniFramework!'),
    framework.createElement('p', {}, 'A lightweight JavaScript framework')
);

// Render to DOM
const container = document.getElementById('app');
framework.render(app, container);
```

---

## API Reference

### Creating Elements

#### `h(type, props, children)`

Creates a virtual node (VNode) representing a DOM element.

**Parameters:**
- `type` (string) - HTML element tag name (e.g., 'div', 'button', 'input')
- `props` (object) - Element properties and attributes
- `children` (array|string) - Child vnodes or text content

**Returns:** VNode object

**Example:**

```javascript
const vnode = framework.createElement('div', { class: 'container' }, [
    framework.createElement('h1', {}, 'Hello World'),
    framework.createElement('button', { onclick: handleClick }, 'Click Me')
]);
```

**Nesting Elements:**

```javascript
const nestedStructure = framework.createElement('div', { className: 'parent' }, [
    framework.createElement('div', { className: 'child' }, [
        framework.createElement('span', {}, 'Nested content'),
        framework.createElement('p', {}, 'More nested content')
    ]),
    framework.createElement('div', { className: 'sibling' }, 'Sibling element')
]);
```

**Adding Attributes:**

```javascript
const elementWithAttributes = framework.createElement('input', {
    type: 'text',
    placeholder: 'Enter text...',
    className: 'form-control',
    id: 'myInput',
    value: '',
    disabled: false
});
```

**Creating Events:**

```javascript
const buttonWithEvent = framework.createElement('button', {
    onclick: (event) => {
        console.log('Button clicked!', event);
        alert('Hello!');
    },
    onmouseenter: (event) => {
        console.log('Mouse entered');
    },
    onmouseleave: (event) => {
        console.log('Mouse left');
    }
}, 'Interactive Button');
```

---

### Rendering

#### `render(vnode, container)`

Renders a virtual node tree to a real DOM container with automatic diffing and updates.

**Parameters:**
- `vnode` (VNode) - Virtual node to render
- `container` (HTMLElement) - DOM element to render into

**Example:**

```javascript
const app = framework.createElement('div', { className: 'app' },
    framework.createElement('h1', {}, 'My App')
);

const container = document.getElementById('app');
framework.render(app, container);

// Re-render with updated content - framework automatically diffs and patches
const updatedApp = framework.createElement('div', { className: 'app' },
    framework.createElement('h1', {}, 'My Updated App')
);
framework.render(updatedApp, container);
```

---

### State Management

#### `createStore(initialState, reducers, options)`

Creates a Redux-style state store with middleware support.

**Parameters:**
- `initialState` (object) - Initial state object
- `reducers` (object) - Object containing reducer functions
- `options` (object) - Optional configuration (middleware, enhancers)

**Returns:** Store object with methods:
- `getState()` - Get current state
- `dispatch(action)` - Dispatch an action to update state
- `subscribe(listener)` - Subscribe to state changes

**Example:**

```javascript
// Define initial state
const initialState = {
    count: 0,
    todos: []
};

// Define reducers
const reducers = {
    INCREMENT: (state) => ({ ...state, count: state.count + 1 }),
    DECREMENT: (state) => ({ ...state, count: state.count - 1 }),
    ADD_TODO: (state, action) => ({
        ...state,
        todos: [...state.todos, action.payload]
    })
};

// Create store
const store = framework.createStore(initialState, reducers);

// Subscribe to changes
store.subscribe(() => {
    const state = store.getState();
    console.log('State updated:', state);
    // Re-render your app
    framework.render(App(state), container);
});

// Dispatch actions
store.dispatch({ type: 'INCREMENT' });
store.dispatch({
    type: 'ADD_TODO',
    payload: { id: 1, text: 'Learn MiniFramework', completed: false }
});
```

**With Middleware:**

```javascript
const loggerMiddleware = (store) => (next) => (action) => {
    console.log('Dispatching:', action);
    const result = next(action);
    console.log('New state:', store.getState());
    return result;
};

const store = framework.createStore(initialState, reducers, {
    middleware: [loggerMiddleware]
});
```

---

### Routing

#### `route(path, handler)`

Sets up hash-based routing with parameter extraction.

**Parameters:**
- `path` (string) - Route pattern (e.g., '/', '/todos/:id')
- `handler` (function) - Function to call when route matches

**Example:**

```javascript
// Define routes
framework.route('/', () => {
    console.log('Home page');
    renderHomePage();
});

framework.route('/about', () => {
    console.log('About page');
    renderAboutPage();
});

// Route with parameters
framework.route('/todos/:filter', (context) => {
    const filter = context.params.filter; // 'active', 'completed', 'all'
    console.log('Filter:', filter);
    renderTodosWithFilter(filter);
});

// Navigate programmatically
framework.navigate('/todos/active');
```

**Advanced Routing:**

```javascript
// Multiple parameters
framework.route('/users/:userId/posts/:postId', (context) => {
    const { userId, postId } = context.params;
    renderUserPost(userId, postId);
});

// Before hooks
framework.route('/admin', (context) => {
    if (!isAuthenticated()) {
        framework.navigate('/login');
        return;
    }
    renderAdminPanel();
});

// 404 handling
framework.route('*', () => {
    render404Page();
});
```

---

### Event System

The framework uses **pure global event delegation** - all events are handled through event properties on vnodes. This provides better performance and prevents memory leaks.

**Supported Events:**
- `onclick` - Click events
- `ondblclick` - Double-click events
- `onchange` - Change events (for inputs, selects)
- `oninput` - Input events (real-time input changes)
- `onkeydown` - Keyboard key down events
- `onkeyup` - Keyboard key up events
- `onkeypress` - Keyboard key press events
- `onsubmit` - Form submission events
- `onblur` - Blur events (when element loses focus)
- `onfocus` - Focus events (when element receives focus)
- `onmouseenter` - Mouse enter events
- `onmouseleave` - Mouse leave events
- `onmouseover` - Mouse over events
- And more standard DOM events...

**Example:**

```javascript
const interactiveElement = framework.createElement('div', {
    onclick: (e) => console.log('Clicked!'),
    onmouseenter: (e) => e.target.style.background = 'lightblue',
    onmouseleave: (e) => e.target.style.background = 'white'
}, 'Hover and click me!');

// Input event handling
const inputField = framework.createElement('input', {
    type: 'text',
    oninput: (e) => console.log('Value:', e.target.value),
    onkeydown: (e) => {
        if (e.key === 'Enter') {
            console.log('Enter pressed');
        }
    },
    onblur: (e) => console.log('Input lost focus')
});

// Form handling
const form = framework.createElement('form', {
    onsubmit: (e) => {
        e.preventDefault();
        const formData = new FormData(e.target);
        console.log('Form submitted:', Object.fromEntries(formData));
    }
}, [
    framework.createElement('input', { name: 'username', type: 'text' }),
    framework.createElement('button', { type: 'submit' }, 'Submit')
]);
```

---

## How the Framework Works

### Virtual DOM Implementation

The framework uses a Virtual DOM (VDOM) to efficiently update the real DOM:

1. **VNode Creation**: When you call `createElement()`, it creates a lightweight JavaScript object (VNode) representing a DOM element
2. **Rendering**: The `render()` function converts VNodes into real DOM nodes
3. **Diffing**: On re-renders, the framework compares the new VNode tree with the previous one
4. **Patching**: Only the differences are applied to the real DOM, minimizing expensive DOM operations

**Key Features:**
- **O(n) Diffing Algorithm**: Linear time complexity for efficient updates
- **Key-based Reconciliation**: Uses `key` props to track list items across updates
- **Checks both old and new children**: Critical for filtering to empty lists
- **Property vs Attribute Handling**: Special handling for `checked`, `value`, `selected` (set as properties, not attributes)

```javascript
// Example: Efficient list updates with keys
const todoList = framework.createElement('ul', { className: 'todo-list' },
    todos.map(todo =>
        framework.createElement('li', { key: todo.id }, todo.text)
    )
);
// When todos change, only affected items are updated in the DOM
```

### Event System Architecture

The framework uses **pure global event delegation**:

1. **Single Listener**: One event listener per event type is attached to the document
2. **Event Bubbling**: Events bubble up from the target element to the document
3. **Handler Matching**: The framework checks if the target has a registered handler
4. **Execution**: The appropriate handler is called with the event

**Benefits:**
- Reduced memory footprint (fewer listeners)
- No need to clean up event listeners manually
- Supports dynamic content without re-attaching listeners

```javascript
// Framework handles this internally:
// document.addEventListener('click', (e) => {
//     const element = e.target;
//     if (element has onclick handler) {
//         execute handler
//     }
// });
```

### State Management Pattern

The framework implements a Redux-style state management pattern:

1. **Single Source of Truth**: All application state lives in one store
2. **Immutable Updates**: State is never mutated directly - always create new state objects
3. **Actions**: Plain objects describing what happened
4. **Reducers**: Pure functions that take previous state and action, return new state
5. **Subscriptions**: Components subscribe to state changes and re-render automatically

**Data Flow:**
```
User Action → dispatch(action) → Reducer → New State → Subscribers Notified → Re-render
```

### Router Implementation

Hash-based routing system:

1. **Hash Changes**: Listens to `hashchange` events (e.g., `#/todos/active`)
2. **Pattern Matching**: Matches current hash against registered route patterns
3. **Parameter Extraction**: Extracts parameters from route (e.g., `:id`)
4. **Handler Execution**: Calls the matching route handler with context
5. **State Sync**: Can integrate with state management for route-based rendering

---

## Examples

### Simple Counter App

```javascript
import framework from './src/core/framework.js';

// Create store
const store = framework.createStore(
    { count: 0 },
    {
        INCREMENT: (state) => ({ count: state.count + 1 }),
        DECREMENT: (state) => ({ count: state.count - 1 })
    }
);

// Render function
function render() {
    const state = store.getState();

    const app = framework.createElement('div', { className: 'counter' }, [
        framework.createElement('h1', {}, 'Counter App'),
        framework.createElement('p', {}, `Count: ${state.count}`),
        framework.createElement('button', {
            onclick: () => store.dispatch({ type: 'INCREMENT' })
        }, '+'),
        framework.createElement('button', {
            onclick: () => store.dispatch({ type: 'DECREMENT' })
        }, '-')
    ]);

    framework.render(app, document.getElementById('app'));
}

// Subscribe to changes
store.subscribe(render);

// Initial render
render();
```

### Todo List with Filtering

```javascript
import framework from './src/core/framework.js';

const initialState = {
    todos: [],
    filter: 'all'
};

const reducers = {
    ADD_TODO: (state, action) => ({
        ...state,
        todos: [...state.todos, action.payload]
    }),
    TOGGLE_TODO: (state, action) => ({
        ...state,
        todos: state.todos.map(todo =>
            todo.id === action.payload
                ? { ...todo, completed: !todo.completed }
                : todo
        )
    }),
    SET_FILTER: (state, action) => ({
        ...state,
        filter: action.payload
    })
};

const store = framework.createStore(initialState, reducers);

function getVisibleTodos(todos, filter) {
    switch (filter) {
        case 'active':
            return todos.filter(t => !t.completed);
        case 'completed':
            return todos.filter(t => t.completed);
        default:
            return todos;
    }
}

function renderApp() {
    const state = store.getState();
    const visibleTodos = getVisibleTodos(state.todos, state.filter);

    const app = framework.createElement('div', { className: 'todo-app' }, [
        framework.createElement('input', {
            type: 'text',
            placeholder: 'What needs to be done?',
            onkeydown: (e) => {
                if (e.key === 'Enter' && e.target.value.trim()) {
                    store.dispatch({
                        type: 'ADD_TODO',
                        payload: {
                            id: Date.now(),
                            text: e.target.value,
                            completed: false
                        }
                    });
                    e.target.value = '';
                }
            }
        }),
        framework.createElement('ul', {},
            visibleTodos.map(todo =>
                framework.createElement('li', { key: todo.id }, [
                    framework.createElement('input', {
                        type: 'checkbox',
                        checked: todo.completed,
                        onchange: () => store.dispatch({
                            type: 'TOGGLE_TODO',
                            payload: todo.id
                        })
                    }),
                    framework.createElement('span', {}, todo.text)
                ])
            )
        ),
        framework.createElement('div', { className: 'filters' }, [
            framework.createElement('button', {
                onclick: () => store.dispatch({ type: 'SET_FILTER', payload: 'all' })
            }, 'All'),
            framework.createElement('button', {
                onclick: () => store.dispatch({ type: 'SET_FILTER', payload: 'active' })
            }, 'Active'),
            framework.createElement('button', {
                onclick: () => store.dispatch({ type: 'SET_FILTER', payload: 'completed' })
            }, 'Completed')
        ])
    ]);

    framework.render(app, document.getElementById('app'));
}

store.subscribe(renderApp);
renderApp();

// Setup routing
framework.route('/', () => store.dispatch({ type: 'SET_FILTER', payload: 'all' }));
framework.route('/active', () => store.dispatch({ type: 'SET_FILTER', payload: 'active' }));
framework.route('/completed', () => store.dispatch({ type: 'SET_FILTER', payload: 'completed' }));
```

---

## TodoMVC Implementation

A complete TodoMVC implementation is available in `examples/todomvc/` demonstrating:

- Component-based architecture
- State management with actions and reducers
- LocalStorage persistence
- URL-based filtering
- All standard TodoMVC features:
  - Add, edit, delete todos
  - Toggle individual and all todos
  - Filter by All/Active/Completed
  - Clear completed todos
  - Items remaining counter
  - Double-click to edit

**Try it:** Open `examples/todomvc/index.html` in your browser

**Key Files:**
- `examples/todomvc/app.js` - Application entry point
- `examples/todomvc/store/todoStore.js` - State management
- `examples/todomvc/components/` - UI components (TodoApp, TodoList, TodoItem, TodoFooter, TodoHeader)

---

## Project Structure

```
mini-framework/
├── src/core/              # Framework implementation
│   ├── framework.js       # Main API and orchestration
│   ├── virtual-dom.js     # Virtual DOM with diffing
│   ├── event-system.js    # Event delegation system
│   ├── state-manager.js   # Redux-style state management
│   └── router.js          # Hash-based routing
├── examples/todomvc/      # TodoMVC demonstration
│   ├── index.html         # TodoMVC HTML
│   ├── app.js            # Application entry point
│   ├── components/        # UI components
│   └── store/            # State management
├── docs/                  # HTML documentation
├── test-framework.html    # Framework tests
├── DOCUMENTATION.md       # This file
└── README.md             # Project overview
```

---

## Testing

Run the test suite by opening `test-framework.html` in your browser. The tests cover:
- Element creation
- Basic rendering
- Event system functionality
- State management
- Routing setup

---

## Browser Support

The framework uses modern JavaScript features and is designed for:
- Chrome/Edge (latest)
- Firefox (latest)
- Safari (latest)

---

## License

This project is part of the 01-edu curriculum and is intended for educational purposes.

---

## Additional Resources

- [Quick Start Guide](docs/readme.html)
- [API Reference](docs/api-reference.html)
- [TodoMVC Example](examples/todomvc/)
- [Framework Tests](test-framework.html)
- [GitHub Repository](https://github.com/nicgen/mini-framework)

---

## Contributing

This is an educational project. For questions or issues, please visit the GitHub repository.
