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
     ├─── MoveableWrapper (Handles drag/resize/rotate via react-moveable)
     │    └── useMoveable (Connects Moveable events to SVGWorld)
     │
     └─── BezierHandleEditor (Visual node editor)
          ├── usePathDataProcessor (Parses and manipulates path data)
          └── Renders handles using svgToScreen() from useSVGWorld
```

### Example Flow: Dragging a Node

1.  **User Action**: The user clicks and drags a handle in the `BezierHandleEditor`.
2.  **Event Handler**: A `mousedown` event is captured. On `mousemove`, the new screen coordinates (`clientX`, `clientY`) are read.
3.  **Coordinate Transformation**: `SVGWorld.screenToSVG()` is called to convert the new screen coordinates into the SVG's internal coordinate space.
4.  **Path Manipulation**: `PathDataProcessor.updateControlPoint()` is called with the new SVG coordinates. This updates the path's AST in memory.
5.  **DOM Update**: `PathDataProcessor.toString()` regenerates the `d` attribute string, which is then applied to the `<path>` element in the DOM, causing the visual update.
6.  **History**: On `mouseup`, the final state of the SVG content is pushed to the `useHistory` stack.

## 6. UI Rendering: The Two-Layer System

To ensure editing controls (like bounding boxes and Bézier handles) remain a constant size regardless of the SVG's zoom level, the UI is rendered in two conceptual layers:

1.  **SVG Content Layer**: This contains the user's SVG content. It is directly transformed by the pan and zoom operations.
2.  **UI Overlay Layer**: This layer sits on top of the content. Editing controls are rendered here. Their *positions* are calculated by converting SVG coordinates to screen coordinates (`svgToScreen`), but their *size* is defined in fixed CSS pixels (e.g., `width: 8px`). This prevents the handles from shrinking or growing as the user zooms.

## 7. Accessibility (WAI-ARIA)

Accessibility is a key architectural consideration.

-   **SVG Export**: The `SVGOptimizer` service ensures that exported SVGs contain proper accessibility metadata, including a `<title>`, `<desc>`, `lang` attribute, and `role="img"`.
-   **Component Interaction**: Interactive editing components like `BezierHandleEditor` are designed to be fully keyboard-accessible. Handles are treated as buttons (`role="button"`) and are navigable with the `Tab` key and manipulable with arrow keys.
-   **Screen Reader Support**: `aria-label` attributes and hidden instruction blocks provide context for users of screen readers.

## 8. Technology Stack

-   **UI Framework**: React 19
-   **Build Tool**: Vite
-   **Styling**: Tailwind CSS
-   **Pan & Zoom**: `@panzoom/panzoom`
-   **Visual Manipulation**: `react-moveable`
-   **SVG Parsing**: `svg-pathdata`
-   **SVG Optimization**: `svgo`
-   **UI Components**: Radix UI
-   **Icons**: Lucide React
-   **Testing**: Vitest