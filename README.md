# PictoForge

A modern, web-based SVG editor built with vanilla JavaScript and Sass. PictoForge provides a complete CRUD interface for editing SVG files directly in the browser, featuring a clean separation between structure and styles for accessible and maintainable vector graphics.

## Features

- **Browser-based**: Runs entirely in the browser with no server dependencies
- **Full CRUD**: Complete create, read, update, and delete operations for SVG elements
- **Style Management**: Visual style library with drag-and-drop assignment
- **Bidirectional Sync**: Real-time synchronization between tree view and visual canvas
- **Accessibility First**: Maintains clean SVG structure with proper metadata
- **Theme Support**: Light and dark mode interface
- **File Flexibility**: Import from file, URL, or drag-and-drop

## Tech Stack

- **JavaScript** (Vanilla ES6+)
- **Sass** (SCSS syntax)  
- **Vite** (Build tool and dev server)
- **Web APIs** (DOMParser, File API, Drag & Drop)

## 📁 Project Structure

```
pictoforge/
├── public/
│   ├── index.html
│   └── favicon.ico
├── src/
│   ├── core/
│   │   ├── SVGParser.js          # 📋 TODO: SVG parsing and analysis
│   │   ├── SVGLinter.js          # 🔍 TODO: SVG validation and auto-correction
│   │   ├── VirtualDOM.js         # 🔄 TODO: DOM synchronization system
│   │   └── EventBus.js           # 📡 TODO: Inter-module communication
│   ├── ui/
│   │   ├── FileManager.js        # 📁 TODO: Import/export operations
│   │   ├── ElementTree.js        # 🌳 TODO: Left panel DOM tree interface
│   │   ├── StylePanel.js         # 🎨 TODO: Style library and editor
│   │   ├── VisualEditor.js       # 🖼️ TODO: Canvas and editing tools
│   │   ├── ThemeManager.js       # 🌓 TODO: Light/dark mode handling
│   │   └── Toolbar.js            # 🛠️ TODO: Editor toolbar controls
│   ├── utils/
│   │   ├── svgUtils.js           # ⚙️ TODO: SVG manipulation utilities
│   │   ├── dragDrop.js           # 🖱️ TODO: Drag and drop functionality
│   │   └── validators.js         # ✅ TODO: Input validation helpers
│   ├── styles/
│   │   ├── main.scss             # 🎨 TODO: Main stylesheet entry point
│   │   ├── components/
│   │   │   ├── _header.scss      # 📋 TODO: Top panel styles
│   │   │   ├── _sidebar.scss     # 📋 TODO: Left panel styles
│   │   │   ├── _canvas.scss      # 📋 TODO: Visual editor styles
│   │   │   └── _modal.scss       # 📋 TODO: Modal dialog styles
│   │   ├── base/
│   │   │   ├── _reset.scss       # 📋 TODO: CSS reset/normalize
│   │   │   ├── _typography.scss  # 📋 TODO: Font and text styles
│   │   │   └── _variables.scss   # 📋 TODO: Sass variables and mixins
│   │   └── themes/
│   │       ├── _light.scss       # 📋 TODO: Light theme variables
│   │       └── _dark.scss        # 📋 TODO: Dark theme variables
│   └── app.js                    # 🚀 TODO: Application entry point
├── tests/                        
│   ├── core/                     # 🧪 TODO: Core module tests
│   ├── ui/                       # 🧪 TODO: UI component tests
│   └── utils/                    # 🧪 TODO: Utility function tests
├── docs/
│   ├── ARCHITECTURE.md           # 📖 TODO: Technical architecture guide
│   ├── API.md                    # 📖 TODO: API documentation
│   └── CONTRIBUTING.md           # 📖 TODO: Contribution guidelines
├── .gitignore                    # ✅ TODO: Git ignore patterns
├── package.json                  # 📦 TODO: Project dependencies and scripts
├── vite.config.js                # ⚙️ TODO: Vite configuration
└── README.md                     # 📖 This file
```

## Development Status

This project is currently in early development. All core features are marked as TODO and will be implemented incrementally.

### Phase 1: Core Infrastructure
- [ ] **Project Setup**
  - [ ] Initialize Vite project with Sass support
  - [ ] Set up development and build scripts
  - [ ] Configure linting and formatting tools
- [ ] **Event System**
  - [ ] Implement EventBus for module communication
  - [ ] Define event contracts between modules
- [ ] **SVG Processing**
  - [ ] Create SVGParser for document analysis
  - [ ] Implement SVGLinter with validation rules
  - [ ] Build VirtualDOM synchronization system

### Phase 2: User Interface
- [ ] **Layout Structure**
  - [ ] Create responsive three-panel layout
  - [ ] Implement theme switching functionality
  - [ ] Add keyboard navigation support
- [ ] **File Operations**
  - [ ] Build file import system (file picker, URL, drag-drop)
  - [ ] Implement SVG export with metadata
  - [ ] Add clipboard paste functionality
- [ ] **Element Management**
  - [ ] Create collapsible DOM tree view
  - [ ] Implement element selection and highlighting
  - [ ] Add drag-and-drop reordering

### Phase 3: Visual Editor
- [ ] **Canvas Implementation**
  - [ ] SVG viewport with zoom and pan
  - [ ] Element selection and transformation
  - [ ] Visual feedback for hover and selection states
- [ ] **Editing Tools**
  - [ ] Selection tool with multi-select support
  - [ ] Node editing for path manipulation
  - [ ] Undo/redo system with history management
- [ ] **Style Management**
  - [ ] Visual style library interface
  - [ ] Drag-and-drop style assignment
  - [ ] Style editor modal with color pickers

### Phase 4: Advanced Features
- [ ] **Accessibility**
  - [ ] Screen reader support
  - [ ] Keyboard-only navigation
  - [ ] High contrast mode
- [ ] **Performance**
  - [ ] Virtual scrolling for large SVGs
  - [ ] Debounced validation
  - [ ] Optimized rendering pipeline
- [ ] **Extensions**
  - [ ] Plugin system architecture
  - [ ] Export format options (PNG, PDF)
  - [ ] SVG optimization tools

## 🚀 Quick Start

### Prerequisites
- Node.js 18+ 
- npm or yarn

### Installation

```bash
# Clone the repository
git clone https://github.com/yourusername/pictoforge.git
cd pictoforge

# Install dependencies
npm install

# Start development server
npm run dev
```

### Available Scripts

```bash
npm run dev      # 🚧 TODO: Start development server
npm run build    # 🚧 TODO: Build for production
npm run preview  # 🚧 TODO: Preview production build
npm run test     # 🚧 TODO: Run test suite
npm run lint     # 🚧 TODO: Lint code
```

## Contributing

This project is in early development and contributions are welcome! Please see [CONTRIBUTING.md](docs/CONTRIBUTING.md) for guidelines.

### Development Workflow
1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## Documentation

- [Architecture Guide](docs/ARCHITECTURE.md) - Technical architecture and design decisions
- [API Documentation](docs/API.md) - Module APIs and interfaces
- [Contributing Guide](docs/CONTRIBUTING.md) - How to contribute to the project

## Goals

- **Accessibility**: Create SVGs that work for everyone
- **Performance**: Fast, responsive editing experience
- **Maintainability**: Clean, modular codebase
- **Standards Compliance**: Valid, semantic SVG output
- **User Experience**: Intuitive interface for all skill levels

## Roadmap

- **v0.1.0**: Basic SVG import/export with structure view
- **v0.2.0**: Visual editor with selection and basic editing
- **v0.3.0**: Style management and drag-and-drop assignment
- **v1.0.0**: Full feature set with accessibility compliance

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## Acknowledgments

- [SVG-Edit](https://github.com/SVG-Edit/svgedit) - Inspiration for web-based SVG editing
- [simple-icons/svglint](https://github.com/simple-icons/svglint) - SVG validation reference
- [Method Draw](https://editor.method.ac/) - UI/UX inspiration

**Note**: This project is currently in development. Features marked as TODO are planned but not yet implemented. Check the [project board](https://github.com/yourusername/pictoforge/projects) for current development status.
