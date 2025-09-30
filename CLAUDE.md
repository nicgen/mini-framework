# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

This is a custom JavaScript framework implementation project for the 01-edu curriculum. The framework provides DOM abstraction, routing, state management, and event handling without using existing frameworks like React, Angular, or Vue.

## Development Commands

```bash
# Start development server
npm run dev
# or
python -m http.server 8080

# Serve the application
npm run serve

# Install dependencies (if using npm modules)
npm install
```

## Architecture

### Core Framework Structure
- `src/core/framework.js` - Main framework API and orchestration
- `src/core/virtual-dom.js` - Virtual DOM implementation with diffing algorithm
- `src/core/event-system.js` - Custom event handling without direct addEventListener()
- `src/core/state-manager.js` - Centralized state management with reactive updates
- `src/core/router.js` - URL-based routing with state synchronization

### TodoMVC Implementation
- `examples/todomvc/` - Complete TodoMVC implementation using the framework
- `examples/todomvc/app.js` - Main application entry point
- `examples/todomvc/components/` - Reusable UI components
- `examples/todomvc/store/` - Application state management

## Key Constraints

1. **No External Frameworks**: Cannot use React, Angular, Vue, or similar high-level frameworks
2. **Custom Event System**: Must not use `addEventListener()` directly - use framework's event system
3. **TodoMVC Compliance**: Implementation must match standard TodoMVC structure and functionality
4. **URL Routing**: Must change URLs during filtering operations
5. **State Persistence**: TodoMVC data should persist across page reloads

## Framework Design Principles

### Virtual DOM Implementation
- Uses VNode objects to represent DOM elements
- Implements diffing algorithm to minimize DOM updates
- Supports both elements and text nodes
- Handles props updates and children reconciliation

### Event System Architecture
- Global event delegation on document level
- Custom event bus for framework-level communication
- Event handler cleanup to prevent memory leaks
- Support for both native and custom events

### State Management Pattern
- Single source of truth with centralized store
- Immutable state updates through reducers
- Subscription-based reactive updates
- Middleware support for logging, persistence, etc.

## Testing the Framework

To verify the implementation works correctly:

1. Navigate to `examples/todomvc/` in browser
2. Test all TodoMVC functionality:
   - Add new todos
   - Toggle completion status
   - Edit todos (double-click)
   - Delete todos
   - Filter by All/Active/Completed
   - Clear completed todos
   - Verify URL changes during filtering

## Common Development Tasks

### Adding New Framework Features
1. Implement core functionality in appropriate `src/core/` file
2. Export new methods from main `framework.js`
3. Update TodoMVC example if needed
4. Test thoroughly with TodoMVC implementation

### Debugging Framework Issues
- Use browser dev tools to inspect virtual DOM structure
- Check state management with Redux DevTools (if available)
- Monitor event flow in custom event system
- Verify routing behavior with URL changes

### Performance Optimization
- Focus on Virtual DOM diffing efficiency
- Minimize DOM manipulations
- Use event delegation for dynamic content
- Implement proper component cleanup

## Project Validation

The framework is considered complete when:
- TodoMVC functions identically to reference implementations
- All standard TodoMVC interactions work correctly
- URL routing works with filtering
- Code demonstrates good programming practices
- Performance is comparable to other implementations
- No external framework dependencies are used

## File Organization

```
mini-framework/
├── src/core/           # Framework implementation
├── examples/todomvc/   # TodoMVC demonstration
├── docs/              # Framework documentation
├── tests/             # Test files (future)
└── PROJECT_GUIDELINE.md # Implementation guide
```

This framework serves as both a learning exercise and a functional alternative to modern frameworks, demonstrating the underlying principles of DOM manipulation, state management, and reactive programming.