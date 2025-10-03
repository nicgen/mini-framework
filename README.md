# MiniFramework

A lightweight JavaScript framework with DOM abstraction, routing, state management, and event handling.

**GitHub Repository:** [https://github.com/nicgen/mini-framework](https://github.com/nicgen/mini-framework)

## Quick Start

1. **Start the development server:**
   ```bash
   npm run dev
   # or
   python -m http.server 8080
   ```

2. **Open your browser and visit:**
   - `http://localhost:8080/examples/todomvc/` - TodoMVC implementation
   - `http://localhost:8080/test-framework.html` - Framework tests (30+ comprehensive tests)
   - `http://localhost:8080/benchmark.html` - Performance benchmarks
   - `http://localhost:8080/docs/` - Full documentation

## Features

- ✅ Virtual DOM with efficient diffing
- ✅ Custom event system (no direct `addEventListener`)
- ✅ Centralized state management with reactive updates
- ✅ URL-based routing with parameter support
- ✅ Component architecture
- ✅ Complete TodoMVC implementation

## Dependencies

This project uses **only CSS styling packages** for TodoMVC compliance:
- `todomvc-app-css` - Standard TodoMVC CSS styling
- `todomvc-common` - TodoMVC base styles and utilities

**Note:** These are CSS-only packages (no JavaScript frameworks). The framework itself is built entirely from scratch without React, Angular, Vue, or any other high-level JavaScript framework.

## Project Structure

```
mini-framework/
├── src/core/           # Framework core implementation
├── examples/todomvc/   # TodoMVC demonstration
├── docs/               # Documentation
└── tests/              # Test files
```

## Documentation

- **Online Documentation:** [http://localhost:8080/docs/](http://localhost:8080/docs/)
- **Quick Start Guide:** [docs/readme.html](docs/readme.html)
- **API Reference:** [docs/api-reference.html](docs/api-reference.html)

For comprehensive documentation, visit the docs directory or start the development server and navigate to `/docs/`.