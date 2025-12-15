# PictoForge - Semantic SVG Editor

**Version:** 0.0.2
**Status:** Active Development

PictoForge is a semantic SVG editor designed as a companion tool for generative AI models, specifically for [PictoNet](https://github.com/mediafranca/pictonet). It provides a precise workspace for inspecting, editing, and curating SVG pictograms for Augmentative and Alternative Communication (AAC) workflows.

## Table of Contents

- [Core Features](#core-features)
- [Quick Start](#quick-start)
- [Technology Stack](#technology-stack)
- [Documentation](#documentation)
- [Project Status](#project-status)
- [Contributing](#contributing)

## Core Features

### Round-Trip Editing
- **Bidirectional sync** between visual canvas and SVG code
- **Real-time updates** across hierarchy, canvas, and code views
- **Undo/redo history** for all modifications

### Visual Editing Tools
- **Select Tool** - Move, scale, rotate with bounding box
- **Node Tool** - Edit path nodes and Bézier handles
- **Pen Tool** - Add/remove nodes (in development)

### Internationalisation
- **4 languages**: English, Español, Māori, Mapuzugun
- **250+ translations** with auto-detection
- **Persistent language** preference

### Local Storage System
- **IndexedDB-based** persistent storage
- **Three data stores**: Pictograms, Vocabulary, Settings
- **Export/Import** workspace functionality
- **Storage quota** management

### Advanced Features
- **Coordinate system** reconciliation (screen → viewport → SVG)
- **Style management** with CSS class editor
- **Entity editing** with property modification
- **Draggable modals** with position persistence
- **Performance metrics** monitoring

## Quick Start

### Prerequisites

- Node.js 18+
- pnpm 10.4.1+ (recommended) or npm

### Installation

```bash
# Clone repository
git clone https://github.com/hspencer/pictoforge.git
cd pictoforge

# Install dependencies
pnpm install

# Start development server
pnpm run dev
```

Application runs at `http://localhost:5173`

### Available Commands

```bash
# Development
pnpm run dev              # Start dev server
pnpm run build            # Production build
pnpm run preview          # Preview production build
pnpm run lint             # Lint code

# Testing
pnpm test                 # Run tests (watch mode)
pnpm test:run             # Run tests once
pnpm test:ui              # Interactive test UI
pnpm test:coverage        # Generate coverage report
```

## Technology Stack

### Core
- **React 19.1.0** - UI framework
- **Vite 6.3.5** - Build tool
- **Tailwind CSS 4.1.7** - Styling

### SVG & Graphics
- **@svgdotjs/svg.js 3.2.5** - SVG manipulation
- **@panzoom/panzoom 4.6.0** - Viewport control
- **react-moveable 0.56.0** - Interactive transforms

### UI Components
- **Radix UI** - Accessible primitives
- **react-draggable 4.4.6** - Draggable modals
- **Lucide React 0.510.0** - Icons

### Storage & Data
- **IndexedDB** - Local persistence
- **ajv 8.17.1** - JSON Schema validation

## Documentation

### Architecture
- [System Overview](docs/architecture.md)
- [Coordinate System](docs/coordinate-system.md)
- [API Reference](docs/api-reference.md)

### Storage System
- **[Storage Overview](docs/storage/README.md)** - Start here
- [Data Structures](docs/storage/data-structures.md)
- [API Methods](docs/storage/api-methods.md)
- [Usage Examples](docs/storage/examples.md)

### Semantic Layer
- [NLU Schema Integration](src/semantic/README.md)

### Planning
- [Project Roadmap](docs/ROADMAP.md)
- [Development Plan](docs/plan.md)
- [UI Overlay System](docs/ui-overlay-system.md)

## Project Status

### Implemented Features

**Core Functionality**
- SVG file loading (drag & drop, file button)
- SVG hierarchy parsing and visualization
- Bidirectional selection (canvas ↔ hierarchy)
- CSS style panel with live editing
- Canvas pan/zoom with smooth trackpad support
- Light/dark theme
- History system (undo/redo)
- Entity editing (ID, CSS class)

**Editing Tools**
- Select tool (move, scale, rotate)
- Node tool (path node visualization)
- Bounding box with transformation handles
- Entity property modification

**User Interface**
- Three-panel layout (input, hierarchy, canvas)
- Draggable, responsive modals
- Code view with syntax highlighting
- Performance metrics display
- Storage quota management

### In Development

- Node editing (drag nodes, adjust Bézier handles)
- Pen tool (add/remove nodes)
- Transform accumulation system
- Element duplication/deletion
- Enhanced undo/redo integration

### Planned Features

- PictoNet API integration
- Vocabulary management UI
- Multi-language NLU schema support
- Collaborative editing
- Advanced export formats

## Contributing

### Development Setup

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Make your changes
4. Run tests (`pnpm test`)
5. Commit your changes (`git commit -m 'Add amazing feature'`)
6. Push to branch (`git push origin feature/amazing-feature`)
7. Open a Pull Request

### Code Style

- Follow existing patterns in the codebase
- Use ESLint configuration
- Write meaningful commit messages
- Add tests for new features
- Update documentation

### Areas for Contribution

1. **Editing Tools** - Implement visual editing features
2. **Storage System** - Enhance IndexedDB operations
3. **Testing** - Improve test coverage
4. **Documentation** - Expand guides and examples
5. **Internationalisation** - Add more languages

## Architecture Highlights

### Coordinate System

PictoForge uses a unified coordinate transformation system (`SVGWorld`) that reconciles:

1. **Screen coordinates** - Browser mouse events
2. **Viewport coordinates** - After pan/zoom transformations
3. **SVG coordinates** - Internal SVG space (viewBox)

All editing tools operate through this single source of truth, ensuring mathematical correctness.

### Storage Philosophy

**SVG as Source of Truth** - Each SVG contains complete metadata:
- NLU Schema in `<metadata>` tag
- Semantic roles in `data-*` attributes
- Embedded CSS in `<style>` tag
- Localized descriptions in `<title>` and `<desc>`

IndexedDB stores only **indexed fields** for fast querying, never duplicating data.

### Component Architecture

```
App.jsx (root)
├── TextInput (top panel)
├── SVGHierarchy (left panel)
│   └── StylePanel (modal)
└── SVGViewer (main canvas)
    ├── SVGWorld (coordinate system)
    ├── Panzoom (viewport control)
    ├── NodeEditor (path editing)
    └── EntityEditDialog (property editor)
```

## License

MIT License - See [LICENSE](LICENSE) file for details

## Version History

- **0.0.2** (Current) - Storage system, entity editing, improved UX
- **0.0.1** - Initial release with core editing features

---

**Built with ❤️ for AAC workflows**

[Report Issue](https://github.com/hspencer/pictoforge/issues) • [Request Feature](https://github.com/hspencer/pictoforge/issues)
