# Architecture Guide

This document describes the high-level architecture and module organization of **PictoForge**, the web-based SVG editor. It outlines core modules, data flow, and component interactions to ensure maintainability, extensibility, and clear separation of concerns.

## 1. Overview

PictoForge follows a **modular, event-driven** architecture with three primary layers:

1. **Core Layer**  
   - Responsible for SVG parsing, validation, and state management.
2. **UI Layer**  
   - Manages user interface components: panels, dialogs, and canvas.
3. **Utility Layer**  
   - Provides shared helpers: drag & drop, theming, and common SVG operations.

An **EventBus** mediates communication between modules, decoupling producers and consumers and enabling a clean “round-trip” interface between the DOM tree and the visual canvas.

## 2. Core Layer

### 2.1 SVGParser

- **Responsibility**: Parse an SVG string into a Document object, extract metadata, styles, and build a hierarchical model of elements.
- **Key Functions**:
  - `parseSVG(svgString): ParsedResult`
  - `extractStyles(doc): StyleMap`
  - `buildElementTree(doc): ElementNode[]`

### 2.2 SVGLinter

- **Responsibility**: Validate SVG structure, enforce rules, and optionally auto-fix common issues.
- **Key Functions**:
  - `lint(svgString): LintReport`
  - `applyFixes(svgString, issues): string`
  - Configurable rule set: allowed tags, required attributes, style consistency.

### 2.3 VirtualDOM

- **Responsibility**: Maintain an in-memory mirror of the SVG DOM for two-way synchronization between UI state and rendered SVG.
- **Key Functions**:
  - `initialize(realSvgElement): void`
  - `updateVirtual(elementId, changes): void`
  - `syncToReal(elementId): void`
  - `syncToVirtual(elementId): void`
- **Implementation**:
  - Uses a lightweight clone of each node with tracked properties.
  - Observes changes in real DOM via `MutationObserver` and emits events.

### 2.4 EventBus

- **Responsibility**: Publish/subscribe mechanism for inter-module events.
- **Key Functions**:
  - `on(eventName, callback): void`
  - `emit(eventName, payload): void`
  - `off(eventName, callback): void`
- **Usage**:
  - UI components emit events like `element:select`, `style:apply`.
  - Core modules subscribe to react (e.g., parser listens to `svg:import`).

## 3. UI Layer

### 3.1 FileManager

- **Responsibility**: Handle import/export workflows.
- **Features**:
  - File picker, URL loading, drag–drop ingestion.
  - Generate downloadable SVG blob with metadata.
- **Events**:
  - Emits `svg:import` with raw SVG text.
  - Emits `svg:export` when user triggers save.

### 3.2 ElementTree

- **Responsibility**: Render and manage the collapsible tree view of SVG elements.
- **Features**:
  - Editable node labels (mapped to `id` attributes).
  - Drag handles for reordering z-index.
  - Style preview icons and tooltips.
- **Events**:
  - Emits `element:select`, `element:rename`, `element:reorder`.

### 3.3 StylePanel

- **Responsibility**: Display and edit CSS classes defined in `<style>` blocks.
- **Features**:
  - Drag–drop style assignment onto tree nodes.
  - “No Style” option to clear inline or class-based styling.
  - Modal editor for style properties (color, stroke, line-type).
- **Events**:
  - Emits `style:apply`, `style:update`, `style:delete`.

### 3.4 VisualEditor

- **Responsibility**: Render SVG in a canvas area and support direct manipulation.
- **Features**:
  - Zoom, pan, grid snapping.
  - Selection handles, transform controls.
  - Undo/redo stack.
- **Events**:
  - Emits `element:select` on click.
  - Listens for `element:update` to apply changes from UI.

### 3.5 Toolbar & ThemeManager

- **Toolbar**: Provides buttons for undo, redo, node-edit, fit-view.
- **ThemeManager**: Toggles CSS variables for light/dark mode and persists preference in `localStorage`.

## 4. Utility Layer

### 4.1 svgUtils

- Common SVG operations: generate unique IDs, compute bounding boxes, serialize nodes.

### 4.2 dragDrop

- Facilitate drag–drop interactions for files, elements, and styles.
- Manages drag events, drop targets, and data transfer.

### 4.3 validators

- Small helpers for input validation (e.g., unique ID checks, color format verification).

## 5. Data Flow

1. **Import**  
   - FileManager reads SVG → emits `svg:import`.
2. **Parse & Validate**  
   - SVGParser listens → parses and builds tree + style map.  
   - SVGLinter validates → emits warnings or fixes.
3. **Render UI**  
   - ElementTree and StylePanel render based on parsed model.
   - VirtualDOM initialized with real SVG element.
4. **User Interaction**  
   - Selecting tree node → EventBus `element:select` → VisualEditor highlights.
   - Dragging style onto node → EventBus `style:apply` → updates VirtualDOM & real SVG.
5. **Export**  
   - FileManager listens for `svg:export` → serializes VirtualDOM → downloads SVG.

## 6. Extensibility & Plugins

- Core modules expose plugin hooks via EventBus:
  - `beforeParse`, `afterParse`, `beforeRender`, `afterRender`.
- Future features (e.g., custom export formats, AI-powered enhancements) can subscribe to these hooks without modifying core code.

## 7. Conclusion

PictoForge’s architecture emphasizes:

- **Separation of Concerns**: Clear boundaries between parsing, validation, UI, and utilities.
- **Modularity**: Self-contained modules with well-defined interfaces.
- **Scalability**: Event-driven design allows easy feature additions.
- **Accessibility & Maintainability**: Core focus on producing valid, accessible SVG output and a clean, testable codebase.

Sources
