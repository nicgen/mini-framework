# MiniFramework

A lightweight JavaScript framework with DOM abstraction, routing, state management, and event handling.

## Quick Start

1. **Start the development server:**
   ```bash
   npm run dev
   # or
   python -m http.server 8080
   ```

2. **Open your browser and visit:**
   - `http://localhost:8080/examples/todomvc/` - TodoMVC implementation
   - `http://localhost:8080/test-framework.html` - Framework tests
   - `http://localhost:8080/docs/` - Full documentation

## Features

- ✅ Virtual DOM with efficient diffing
- ✅ Custom event system (no direct `addEventListener`)
- ✅ Centralized state management with reactive updates
- ✅ URL-based routing with parameter support
- ✅ Component architecture
- ✅ Complete TodoMVC implementation

## Project Structure

```
mini-framework/
├── src/core/           # Framework core implementation
├── examples/todomvc/   # TodoMVC demonstration
├── docs/               # Documentation
└── tests/              # Test files
```

## Documentation

See `docs/README.md` for comprehensive documentation, or visit the [project guideline](PROJECT_GUIDELINE.md) for implementation details.