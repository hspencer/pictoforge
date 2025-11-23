# PictoForge Architecture

## 1. Overview

PictoForge is an interactive SVG editor built with React. It enables direct manipulation of graphical elements with both visual and code-based precision. The architecture is designed to be modular, testable, and scalable, separating concerns between UI components, state management hooks, and core logic services.

## 2. Core Problem: Coordinate Transformation

The main challenge in any web-based graphical editor is managing the multiple coordinate systems involved:

1.  **Screen Coordinates**: The pixel-based coordinate system of the browser window, derived from mouse events (`clientX`, `clientY`).
2.  **Viewport Coordinates**: The transformed space after applying user-initiated pan and zoom.
3.  **SVG Coordinates**: The internal coordinate system of the SVG, defined by its `viewBox` attribute. All element data is stored in this space.

The core of PictoForge's architecture is a system that accurately and efficiently transforms points and deltas between these systems.

## 3. Core Services

The application's logic is built upon a foundation of independent, framework-agnostic services.

### 3.1. `SVGWorld` (The "World" Object)

-   **Location**: `src/services/SVGWorld.js`
-   **Purpose**: Acts as the central authority for all coordinate transformations and element manipulations. It maintains an in-memory representation of the SVG's state, including its dimensions, `viewBox`, and the current viewport pan/zoom state.
-   **Key Methods**:
    -   `screenToSVG(x, y)`: Converts screen coordinates to SVG user-space coordinates.
    -   `svgToScreen(x, y)`: Converts SVG user-space coordinates back to screen coordinates.
    -   `screenDeltaToSVGDelta(dx, dy)`: Converts a movement delta (e.g., from a mouse drag) from screen pixels to SVG units, which is crucial for accurate dragging and resizing regardless of zoom level.
-   **Implementation**: Internally, it uses the browser's native `getScreenCTM()` (Current Transformation Matrix) method, which provides a robust and mathematically precise way to handle all nested SVG and CSS transformations.

### 3.2. `PathDataProcessor`

-   **Location**: `src/services/PathDataProcessor.js`
-   **Purpose**: A specialized service for parsing and manipulating the `d` attribute of SVG `<path>` elements. It uses the `svg-pathdata` library to convert the path string into an Abstract Syntax Tree (AST).
-   **Key Features**:
    -   **Parsing & Normalization**: Converts path commands into a consistent, absolute-coordinate format.
    -   **Point Access**: Provides direct access to anchor points and Bézier control points (C1, C2, Q1).
    -   **Manipulation**: Allows for the precise updating of individual points.
    -   **Regeneration**: Rebuilds the `d` attribute string after modifications.

### 3.3. `SVGOptimizer`

-   **Location**: `src/services/SVGOptimizer.js`
-   **Purpose**: Uses the **SVGO** library to optimize SVG content for export.
-   **Key Features**:
    -   Reduces file size by 30-50% on average.
    -   Configurable `floatPrecision` to reduce decimal places.
    -   Removes redundant attributes and comments.
    -   Preserves critical information like IDs, `viewBox`, and accessibility tags (`<title>`, `<desc>`).
    -   Manages accessibility metadata, ensuring exported SVGs are compliant with WAI-ARIA standards.

## 4. React Hooks (State & Logic)

React Hooks adapt the core services for use in the component lifecycle, managing state and providing a clean API to the UI.

-   **`useSVGWorld`**: Provides a reactive interface to the `SVGWorld` service.
-   **`usePathDataProcessor`**: Manages an instance of `PathDataProcessor` for a given path element, exposing its segments and points as reactive state.
-   **`usePanzoom`**: A wrapper for the `@panzoom/panzoom` library, handling the state of the viewport (pan and zoom).
-   **`useMoveable`**: Integrates the `react-moveable` library with `SVGWorld` to handle drag, resize, and rotate events, ensuring transformations are correctly applied in SVG coordinate space.
-   **`useHistory`**: A generic hook for managing undo/redo state history.
-   **`useSVGStorage`**: Manages saving and loading SVGs and user configuration to/from `localStorage`.

## 5. Component Structure & Data Flow

The application follows a clear data flow, from user interaction down to service-level updates.

```
App.jsx (Top-level state management)
├── useSVGParser (Loads and parses SVG file)
├── useSVGStorage (Handles local storage)
│
└─── SVGViewer (Main visual editor)
     ├── usePanzoom (Manages viewport state)
     ├── useSVGWorld (Provides coordinate transformation context)
     │
     ├─── Inline BoundingBox (Select tool - drag/resize/rotate controls)
     │    └── Uses svgToScreen() and screenDeltaToSVGDelta() from useSVGWorld
     │
     └─── NodeEditor Component (Node/Pen tools - path manipulation)
          ├── parsePathNodes() from svgManipulation utils
          └── Renders node handles using svgToScreen() from useSVGWorld
```

### Example Flow: Dragging a Node

1.  **User Action**: The user clicks and drags a node handle in the `NodeEditor` component.
2.  **Event Handler**: A `mousedown` event is captured. On `mousemove`, the new screen coordinates (`clientX`, `clientY`) are read.
3.  **Coordinate Transformation**: `SVGWorld.screenToSVG()` is called to convert the new screen coordinates into the SVG's internal coordinate space.
4.  **Path Manipulation**: The node's position is updated in the parsed path data structure using `updateNodeInPath()` from svgManipulation utils.
5.  **DOM Update**: The updated path data is rebuilt into a `d` attribute string using `buildPathFromNodes()` and applied to the `<path>` element, causing the visual update.
6.  **History**: On `mouseup`, the final state of the SVG content is pushed to the `useHistory` stack.

## 6. UI Rendering: The Two-Layer System

To ensure editing controls (like bounding boxes and Bézier handles) remain a constant size regardless of the SVG's zoom level, the UI is rendered in two conceptual layers:

1.  **SVG Content Layer**: This contains the user's SVG content. It is directly transformed by the pan and zoom operations.
2.  **UI Overlay Layer**: This layer sits on top of the content. Editing controls are rendered here. Their *positions* are calculated by converting SVG coordinates to screen coordinates (`svgToScreen`), but their *size* is defined in fixed CSS pixels (e.g., `width: 8px`). This prevents the handles from shrinking or growing as the user zooms.

## 7. Accessibility (WAI-ARIA)

Accessibility is a key architectural consideration.

-   **SVG Export**: The `SVGOptimizer` service ensures that exported SVGs contain proper accessibility metadata, including a `<title>`, `<desc>`, `lang` attribute, and `role="img"`.
-   **Component Interaction**: Interactive editing components like `NodeEditor` are designed to be fully keyboard-accessible. Handles are treated as interactive elements and are manipulable with mouse drag operations.
-   **Screen Reader Support**: `aria-label` attributes and hidden instruction blocks provide context for users of screen readers.

## 8. Storage System

**Status**: v0.0.2 - Implemented (localStorage-based)

PictoForge uses a persistent storage system following the **SVG-as-source-of-truth** principle. Each SVG contains complete semantic metadata, and the database stores only indexed fields for fast querying.

### 8.1. Storage Architecture

-   **Database**: Currently localStorage, planned migration to IndexedDB
-   **Three-Store Design**:
    -   **`pictograms`**: Active workspace for generated pictograms pending review (~7.5KB each)
    -   **`vocabulary`**: Verified, reusable elements (simple objects, actions, compounds) (~2KB each)
    -   **`settings`**: User preferences and configuration (<1KB total)

### 8.2. Core Principles

-   **No Data Duplication**: SVG contains all metadata; storage only indexes for queries
-   **Self-Contained SVGs**: Each SVG includes `<metadata>`, `<title>`, `<desc>`, semantic `data-*` attributes
-   **Capacity**: 10,000 vocabulary elements = ~77MB (fully viable on modern browsers)
-   **Persistence**: Supports browser persistent storage API to protect from auto-deletion

### 8.3. Hook Interface

```javascript
const {
  // Current: localStorage operations
  saveSVG, loadLastSVG, getRecentSVGs,
  updateConfig, getStorageStats,
  exportHistory, importHistory,

  // Planned: IndexedDB operations
  savePictogram, getAllPictograms,
  saveVocabulary, searchVocabulary,
  getStorageQuota, requestPersistentStorage
} = useSVGStorage();
```

### 8.4. Documentation

**Complete storage documentation**: [docs/storage/README.md](./storage/README.md)

-   [Data Structures](./storage/data-structures.md) - Schema definitions and TypeScript interfaces
-   [API Methods](./storage/api-methods.md) - Complete method reference with examples
-   [Usage Examples](./storage/examples.md) - Common patterns and workflows

---

## 9. Semantic Layer (Phase 2 - In Progress)

**Status**: Phase 2.1 Complete (Infrastructure setup)

The Semantic Layer is an **optional, non-invasive addition** that enables round-trip editing between SVG visual representation and NLU (Natural Language Understanding) semantic structure.

### 9.1. Architecture Philosophy

-   **Feature-Flagged**: Only active when NLU schema is present
-   **Non-Breaking**: Visual editor works independently without schema
-   **Metadata Enrichment**: Adds semantic meaning without modifying rendering
-   **External Reference**: NLU Schema maintained as git submodule (independently updatable)

### 9.2. NLU Schema Integration

-   **Location**: `schemas/nlu-schema/` (git submodule)
-   **Repository**: https://github.com/mediafranca/nlu-schema
-   **Version**: 1.0.1 (stable)
-   **Format**: JSON Schema with frames, visual_guidelines, logical_form, pragmatics

### 9.3. Semantic Layer Structure

```
src/semantic/
├── services/
│   ├── NLUSchemaParser.js      (Phase 2.2 - Next)
│   ├── SemanticMapper.js       (Phase 2.4)
│   └── RoundTripSyncer.js      (Phase 2.5)
├── components/
│   ├── SemanticPanel.jsx       (Phase 2.3)
│   └── NLUTreeView.jsx         (Phase 2.3)
├── hooks/
│   ├── useNLUSchema.js         (Phase 2.2)
│   └── useSemanticMapping.js   (Phase 2.4)
└── types/
    └── nlu-schema.d.ts         (Phase 2.2)
```

### 9.4. SVG ↔ NLU Mapping

Semantic elements are mapped to SVG via `data-*` attributes:

| NLU Schema Field | SVG Attribute | Example |
|------------------|---------------|---------|
| `frames[].id` | `data-frame-id` | `data-frame-id="f1"` |
| `frames[].roles.Agent` | `data-role` | `data-role="Agent"` |
| `visual_guidelines.focus_actor` | `data-focus` | `data-focus="true"` |

This allows bidirectional selection: clicking an SVG element highlights its semantic node, and vice versa.

### 8.5. Future Integration

**Phase 2.4**: Round-trip synchronization
-   Visual edits → update geometry in NLU schema
-   Semantic edits → flag affected SVG elements

**Phase 4**: PictoNet model integration
-   Full generation from text
-   Partial regeneration of specific blends

See [ROADMAP.md](./ROADMAP.md) for complete implementation plan.

## 9. Technology Stack

### Core Visual Editor
-   **UI Framework**: React 19
-   **Build Tool**: Vite
-   **Styling**: Tailwind CSS v4 (pure CSS, no SCSS)
-   **Pan & Zoom**: `@panzoom/panzoom`
-   **Visual Manipulation**: `react-moveable`
-   **SVG Parsing**: `svg-pathdata`
-   **SVG Optimization**: `svgo`
-   **UI Components**: Radix UI
-   **Icons**: Lucide React
-   **Testing**: Vitest

### Semantic Layer (Phase 2+)
-   **Schema Validation**: `ajv` + `ajv-formats`
-   **NLU Schema**: git submodule (v1.0.1)
-   **Future**: PictoNet API client (Phase 2.4)