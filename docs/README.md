# MiniFramework Documentation

## Overview

MiniFramework is a lightweight JavaScript framework that provides DOM abstraction, routing, state management, and custom event handling without relying on existing frameworks like React, Angular, or Vue.

## Core Features

- **Virtual DOM**: Efficient DOM manipulation through a virtual DOM implementation
- **Custom Event System**: Event handling without direct `addEventListener()` usage
- **State Management**: Centralized state store with reactive updates
- **Routing System**: URL-based routing with state synchronization
- **Component Architecture**: Reusable component system

## Quick Start

### Basic Setup

```javascript
import framework from './src/core/framework.js';

// Create a simple element
const element = framework.createElement('div', { className: 'container' },
    'Hello World'
);

// Render to DOM
framework.render(element, document.getElementById('app'));
```

### Creating Elements

The framework provides a `createElement` function similar to React:

```javascript
// Simple element
const title = framework.createElement('h1', {}, 'My App');

// Element with props
const button = framework.createElement('button', {
    className: 'btn primary',
    id: 'submit-btn'
}, 'Submit');

// Nested elements
const container = framework.createElement('div', { className: 'container' },
    framework.createElement('h1', {}, 'Welcome'),
    framework.createElement('p', {}, 'This is a paragraph'),
    framework.createElement('button', { className: 'btn' }, 'Click me')
);
```

### Event Handling

MiniFramework uses a custom event system that doesn't rely on `addEventListener()` directly:

```javascript
const button = framework.createElement('button', {}, 'Click me');

// Add event listener using framework's event system
framework.events.on(button, 'click', (event) => {
    console.log('Button clicked!');
});

// Event delegation
framework.events.delegate('click', '.btn', (event) => {
    console.log('Any button with class "btn" was clicked');
});

// Custom events
framework.events.emit('custom-event', { data: 'hello' });
framework.events.subscribe('custom-event', (data) => {
    console.log('Custom event received:', data);
});
```

### State Management

Create and manage application state:

```javascript
// Create a store
const store = framework.createStore({
    count: 0,
    todos: []
}, {
    INCREMENT: (state, action) => ({ ...state, count: state.count + 1 }),
    ADD_TODO: (state, action) => ({
        ...state,
        todos: [...state.todos, action.payload]
    })
});

// Subscribe to changes
store.subscribe((state, prevState, action) => {
    console.log('State changed:', state);
});

// Dispatch actions
store.dispatch({ type: 'INCREMENT' });
store.dispatch({ type: 'ADD_TODO', payload: { id: 1, text: 'Learn MiniFramework' } });
```

### Routing

Set up URL-based routing:

```javascript
// Define routes
framework.route('/', () => {
    console.log('Home page');
});

framework.route('/about', () => {
    console.log('About page');
});

framework.route('/user/:id', (context) => {
    console.log('User page, ID:', context.params.id);
});

// Navigate programmatically
framework.navigate('/user/123');
```

## Component Architecture

### Basic Component

```javascript
class MyComponent {
    constructor(framework, props = {}) {
        this.framework = framework;
        this.props = props;
        this.state = { count: 0 };
    }

    render() {
        return this.framework.createElement('div', {},
            this.framework.createElement('h2', {}, `Count: ${this.state.count}`),
            this.framework.createElement('button', {
                onclick: () => this.setState({ count: this.state.count + 1 })
            }, 'Increment')
        );
    }

    setState(newState) {
        this.state = { ...this.state, ...newState };
        this.forceUpdate();
    }

    forceUpdate() {
        // Trigger re-render
        this.framework.events.emit('component:update', { component: this });
    }
}
```

### Lifecycle Hooks

```javascript
// Mount lifecycle
framework.onMount(() => {
    console.log('Framework mounted');
});

// Route-specific hooks
framework.route('/dashboard', {
    beforeEnter: (context) => {
        // Check authentication
        if (!isAuthenticated()) {
            framework.navigate('/login');
            return false; // Cancel navigation
        }
    },
    handler: () => {
        renderDashboard();
    }
});
```

## Advanced Features

### Middleware

Add middleware to enhance functionality:

```javascript
// Logger middleware
store.addMiddleware((action, getState, dispatch) => {
    console.log('Action:', action);
    console.log('State before:', getState());
    return action;
});

// Thunk middleware for async actions
store.addMiddleware((action, getState, dispatch) => {
    if (typeof action === 'function') {
        return action(dispatch, getState);
    }
    return action;
});
```

### Reactive State

Create reactive state objects:

```javascript
const reactiveState = framework.state.reactive({
    name: 'John',
    age: 30
});

// Watch for changes
reactiveState.$watch('name', (newValue, oldValue) => {
    console.log(`Name changed from ${oldValue} to ${newValue}`);
});

// Update will trigger watchers
reactiveState.name = 'Jane';
```

## Implementation Principles

### Virtual DOM

MiniFramework uses a Virtual DOM approach for efficient DOM updates:

1. **Virtual Nodes**: JavaScript objects representing DOM elements
2. **Diffing Algorithm**: Compares old and new virtual trees
3. **Reconciliation**: Updates only changed DOM elements
4. **Batching**: Groups DOM updates for better performance

### Event System Architecture

The custom event system works through:

1. **Global Event Delegation**: Single event listeners on document
2. **Event Mapping**: Maps events to element handlers
3. **Custom Event Bus**: Framework-level event communication
4. **Automatic Cleanup**: Prevents memory leaks

### State Management Pattern

The state management follows these principles:

1. **Single Source of Truth**: Centralized state store
2. **Immutable Updates**: State changes create new objects
3. **Predictable Updates**: Actions trigger state changes
4. **Reactive Subscriptions**: Components update automatically

### Routing Implementation

The routing system provides:

1. **Hash-based and History API routing**
2. **Parameter extraction** from URLs
3. **Route guards** for access control
4. **Nested routing** support

## Performance Considerations

### Optimizations Implemented

1. **Virtual DOM diffing** minimizes DOM manipulations
2. **Event delegation** reduces event listener overhead
3. **Component memoization** prevents unnecessary re-renders
4. **Batch updates** group DOM changes
5. **Lazy loading** for route-based code splitting

### Best Practices

1. Use keys for list items to help with diffing
2. Implement shouldUpdate methods for complex components
3. Avoid inline functions in render methods
4. Use event delegation for dynamic content
5. Implement proper cleanup in component destroy methods

## Examples

See the `examples/todomvc/` directory for a complete TodoMVC implementation that demonstrates:

- Component composition
- State management
- Event handling
- Routing
- Local storage persistence

## Browser Support

MiniFramework supports modern browsers with ES6+ features:
- Chrome 60+
- Firefox 60+
- Safari 12+
- Edge 79+

## Contributing

1. Follow the existing code style
2. Add tests for new features
3. Update documentation
4. Ensure TodoMVC example still works

## License

MIT License - see LICENSE file for details.