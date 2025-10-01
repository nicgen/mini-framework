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

- **Online Documentation:** [http://localhost:8080/docs/](http://localhost:8080/docs/)
- **Quick Start Guide:** [docs/readme.html](docs/readme.html)
- **API Reference:** [docs/api-reference.html](docs/api-reference.html)

For comprehensive documentation, visit the docs directory or start the development server and navigate to `/docs/`.