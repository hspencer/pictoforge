# PictoForge API Reference

## 1. Overview

This document provides a comprehensive API reference for PictoForge's core services, React hooks, and UI components.

---

## 2. Core Services

Services encapsulate low-level business logic and are framework-agnostic.

### `CoordinateTransformer`

-   **Location:** `src/services/CoordinateTransformer.js`
-   **Description:** A centralized service for coordinate conversion between screen, client, and SVG user spaces.
-   **Key Methods:**
    -   `setSvgElement(svgElement)`: Updates the reference SVG element.
    -   `updatePanzoomState(state)`: Updates the current pan and zoom state.
    -   `screenToSvg(screenX, screenY)`: Converts screen coordinates to SVG coordinates.
    -   `svgToScreen(svgX, svgY)`: Converts SVG coordinates to screen coordinates.
    -   `screenDeltaToSvgDelta(deltaX, deltaY)`: Converts a screen-space delta to an SVG-space delta.

### `PathDataProcessor`

-   **Location:** `src/services/PathDataProcessor.js`
-   **Description:** A service for parsing and manipulating SVG path data (`d` attribute) using `svg-pathdata`. It allows for precise editing of curves by providing access to anchor and control points.
-   **Key Methods:**
    -   `parse(pathString)`: Parses a path `d` string into an AST.
    -   `normalize()`: Converts all path commands to absolute coordinates.
    -   `getSegments()`: Returns an array of path segments with detailed information.
    -   `getAnchorPoints()` / `getControlPoints()`: Returns arrays of all anchor or control points.
    -   `updateAnchorPoint(index, position)`: Modifies an anchor point.
    -   `updateControlPoint(index, type, position)`: Modifies a Bézier control point.
    -   `toString()`: Regenerates the path `d` string from the current AST.

### `SVGOptimizer`

-   **Location:** `src/services/SVGOptimizer.js`
-   **Description:** A service to optimize SVG content using **SVGO** before export, reducing file size and improving performance.
-   **Key Methods:**
    -   `optimize(svgString, options)`: Optimizes an SVG string with given options.
    -   `addAccessibilityMetadata(svgString, metadata)`: Adds or updates accessibility metadata (`<title>`, `<desc>`).
    -   `processForExport(svgString, metadata, options)`: A complete pipeline that adds metadata and then optimizes the SVG for export.

### `SVGWorld`

-   **Location:** `src/services/SVGWorld.js`
-   **Description:** The primary "world" object for SVG handling. It manages transformations between all coordinate systems (`viewBox`, viewport, screen) and serves as an in-memory object for element manipulation.
-   **Key Methods:**
    -   `initialize(svgElement, containerElement)`: Initializes the world with a DOM element.
    -   `updateViewport(viewport)`: Updates the current pan and zoom state.
    -   `screenToSVG(screenX, screenY)`: Converts screen coordinates to SVG coordinates.
    -   `svgToScreen(svgX, svgY)`: Converts SVG coordinates to screen coordinates.
    -   `screenDeltaToSVGDelta(deltaX, deltaY)`: Converts a screen-space delta to an SVG-space delta.
    -   `getElementBBox(element)`: Gets the bounding box of an element in SVG coordinates.
    -   `moveElement(element, dx, dy)`: Moves an element by a specified delta.

---

## 3. React Hooks

Hooks provide a reactive interface to the core services and manage component state.

### `useCoordinateTransformer`

-   **Location:** `src/hooks/useCoordinateTransformer.js`
-   **Description:** Integrates the `CoordinateTransformer` service into the React lifecycle, providing reactive access to coordinate transformations.
-   **Usage:** `const { screenToSvg, svgToScreen } = useCoordinateTransformer({ svgRef, panzoomState });`

### `useHistory`

-   **Location:** `src/hooks/useHistory.js`
-   **Description:** A generic hook to manage state history and provide undo/redo functionality.
-   **Usage:** `const { currentState, pushState, undo, redo, canUndo, canRedo } = useHistory(initialState);`

### `useI18n`

-   **Location:** `src/hooks/useI18n.jsx`
-   **Description:** Provides internationalization (i18n) context for translating UI text. Must be used within an `I18nProvider`.
-   **Usage:** `const { t, setLocale } = useI18n();`

### `useLocalStorage` & `useSessionStorage`

-   **Location:** `src/hooks/useLocalStorage.js`, `src/hooks/useSessionStorage.js`
-   **Description:** Hooks to manage data persistence in `localStorage` (persistent) and `sessionStorage` (session-only).
-   **Usage:** `const [value, setValue, removeValue] = useLocalStorage('myKey', initialValue);`

### `useMoveable`

-   **Location:** `src/hooks/useMoveable.js`
-   **Description:** Provides transformation handlers (drag, resize, rotate) that integrate with SVGWorld's coordinate transformation system.
-   **Usage:** Returns handlers and state for managing element transformations in SVG coordinate space. Currently not used in the main interface (inline implementations preferred for simplicity).

### `usePanzoom`

-   **Location:** `src/hooks/usePanzoom.js`
-   **Description:** A wrapper for the `@panzoom/panzoom` library that provides reactive state for the viewport's pan and zoom.
-   **Usage:** `const { panzoomState, zoomIn, zoomOut, reset } = usePanzoom({ elementRef, panzoomOptions });`

### `usePathDataProcessor`

-   **Location:** `src/hooks/usePathDataProcessor.js`
-   **Description:** Integrates the `PathDataProcessor` service, providing reactive access to a path's segments, anchor points, and control points.
-   **Usage:** `const { segments, updateAnchorPoint } = usePathDataProcessor({ pathString });`

### `usePerformance`

-   **Location:** `src/hooks/usePerformance.js`
-   **Description:** A hook for monitoring and optimizing the performance of complex SVGs.
-   **Usage:** Returns metrics and functions for performance measurement (`debounce`, `throttle`, etc.).

### `useSVGParser`

-   **Location:** `src/hooks/useSVGParser.js`
-   **Description:** Parses an SVG string into a structured data tree, extracting the element hierarchy, styles, and metadata.
-   **Usage:** `const { svgData, loadSVG, findElementById } = useSVGParser();`

### `useSVGStorage`

-   **Location:** `src/hooks/useSVGStorage.js`
-   **Description:** A specialized hook for managing the storage of SVGs and user settings in `localStorage`.
-   **Usage:** `const { saveSVG, loadLastSVG, userConfig } = useSVGStorage();`

### `useSVGWorld`

-   **Location:** `src/hooks/useSVGWorld.js`
-   **Description:** Provides a reactive interface to the `SVGWorld` service.
-   **Usage:** `const { screenToSVG, getElementBBox } = useSVGWorld({ svgRef, containerRef, viewport });`

---

## 4. UI Components

### `SVGViewer`

-   **Location:** `src/components/SVGViewer.jsx`
-   **Description:** The main component for visualizing and editing the SVG. It integrates pan/zoom, tool selection, and element manipulation.
-   **Key Props:** `svgContent`, `selectedElement`, `onElementSelect`, `onSVGUpdate`, `tool`.

### `SVGHierarchy`

-   **Location:** `src/components/SVGHierarchy.jsx`
-   **Description:** A tree view component that displays the hierarchy of SVG elements, allowing for selection and inspection.
-   **Key Props:** `svgData`, `selectedElement`, `onElementSelect`.

### `StylePanel`

-   **Location:** `src/components/StylePanel.jsx`
-   **Description:** A side panel for managing and applying CSS styles to SVG elements.
-   **Key Props:** `svgData`, `selectedElement`, `onStyleChange`.

### `CodeView`

-   **Location:** `src/components/CodeView.jsx`
-   **Description:** An editable code view with syntax highlighting that displays the raw SVG markup.
-   **Key Props:** `svgContent`, `onSVGUpdate`.

### `NodeEditor`

-   **Location:** `src/components/NodeEditor.jsx`
-   **Description:** A visual editor for directly manipulating path nodes and Bézier control points. Rendered inline within `SVGViewer` for Node and Pen tools.
-   **Key Props:** `element`, `tool`, `screenToSVG`, `svgToScreen`, `screenDeltaToSVGDelta`, `onNodeChange`, `onNodeDragEnd`.
-   **Note:** Bounding box controls for Select tool are implemented inline in SVGViewer.jsx (lines 708-846).

### `SVGMetadataEditor`

-   **Location:** `src/components/SVGMetadataEditor.jsx`
-   **Description:** A form for editing the accessibility metadata of the SVG, such as its `<title>`, `<desc>`, `lang`, and `role`.
-   **Key Props:** `svgContent`, `onUpdate`.

### `SVGHistory`

-   **Location:** `src/components/SVGHistory.jsx`
-   **Description:** A UI component that displays the list of recently saved SVGs from local storage, allowing the user to load, delete, or export them.
-   **Key Props:** `onLoadSVG`.