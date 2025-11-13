# PictoForge API Reference

## Overview

This document provides comprehensive API documentation for PictoForge components, hooks, services, and utilities.

## Table of Contents

- [Core Services](#core-services)
  - [SVGWorld](#svgworld)
- [React Hooks](#react-hooks)
  - [useSVGWorld](#usesvgworld)
  - [useSVGParser](#usesvgparser)
  - [useHistory](#usehistory)
  - [usePerformance](#useperformance)
  - [useI18n](#usei18n)
- [Components](#components)
  - [SVGViewer](#svgviewer)
  - [SVGHierarchy](#svghierarchy)
  - [BoundingBox](#boundingbox)
  - [NodeEditor](#nodeeditor)
  - [StylePanel](#stylepanel)
  - [CodeView](#codeview)
- [Utilities](#utilities)
  - [svgManipulation](#svgmanipulation)

---

## Core Services

### SVGWorld

Location: [`src/services/SVGWorld.js`](../src/services/SVGWorld.js)

The centralised coordinate transformation service that handles conversions between screen, viewport, and SVG coordinate systems.

#### Constructor

```javascript
const svgWorld = new SVGWorld(svgElement, containerElement, viewport)
```

**Parameters:**
- `svgElement` (SVGSVGElement) - The root SVG element
- `containerElement` (HTMLElement) - The container element that holds the SVG
- `viewport` (Object) - Viewport state with `{ scale, x, y }`

#### Methods

##### `screenToSVG(screenX, screenY)`

Converts screen coordinates to SVG coordinates.

**Parameters:**
- `screenX` (Number) - X coordinate in screen space (pixels)
- `screenY` (Number) - Y coordinate in screen space (pixels)

**Returns:**
- `Object` - `{ x, y }` in SVG coordinate space

**Example:**
```javascript
const { x, y } = svgWorld.screenToSVG(e.clientX, e.clientY);
console.log(`SVG coordinates: ${x}, ${y}`);
```

##### `svgToScreen(svgX, svgY)`

Converts SVG coordinates to screen coordinates.

**Parameters:**
- `svgX` (Number) - X coordinate in SVG space
- `svgY` (Number) - Y coordinate in SVG space

**Returns:**
- `Object` - `{ x, y }` in screen coordinate space (pixels)

**Example:**
```javascript
const bbox = element.getBBox();
const screenPos = svgWorld.svgToScreen(bbox.x, bbox.y);
```

##### `screenDeltaToSVGDelta(dx, dy)`

Converts a delta (difference) in screen space to SVG space. Useful for drag and drop operations.

**Parameters:**
- `dx` (Number) - Change in X in screen space
- `dy` (Number) - Change in Y in screen space

**Returns:**
- `Object` - `{ dx, dy }` in SVG coordinate space

**Example:**
```javascript
const deltaScreen = { x: e.clientX - startX, y: e.clientY - startY };
const { dx, dy } = svgWorld.screenDeltaToSVGDelta(deltaScreen.x, deltaScreen.y);
```

##### `getElementBBox(element)`

Gets the bounding box of an element in SVG coordinates.

**Parameters:**
- `element` (SVGElement) - The SVG element

**Returns:**
- `Object` - `{ x, y, width, height }` in SVG coordinates

##### `moveElement(element, dx, dy)`

Moves an element by a delta in SVG coordinates.

**Parameters:**
- `element` (SVGElement) - The element to move
- `dx` (Number) - Change in X
- `dy` (Number) - Change in Y

##### `applyTransform(element, transform)`

Applies a transformation matrix to an element.

**Parameters:**
- `element` (SVGElement) - The element to transform
- `transform` (String | Object) - Transform specification

---

## React Hooks

### useSVGWorld

Location: [`src/hooks/useSVGWorld.js`](../src/hooks/useSVGWorld.js)

React hook that provides access to the SVGWorld service with automatic updates on viewport changes.

#### Usage

```javascript
const {
  screenToSVG,
  svgToScreen,
  screenDeltaToSVGDelta,
  getElementBBox,
  moveElement,
  applyTransform
} = useSVGWorld({
  svgRef,
  containerRef,
  viewport
});
```

**Parameters:**
- `svgRef` (React.RefObject) - Ref to SVG element
- `containerRef` (React.RefObject) - Ref to container element
- `viewport` (Object) - Current viewport state `{ scale, x, y }`

**Returns:**
- `Object` - All SVGWorld methods bound to current state

---

### useSVGParser

Location: [`src/hooks/useSVGParser.js`](../src/hooks/useSVGParser.js)

Hook for parsing and managing SVG content.

#### Usage

```javascript
const {
  svgData,
  svgContent,
  selectedElement,
  parseSVG,
  updateSVG,
  selectElement,
  findElementById
} = useSVGParser();
```

#### Return Values

**State:**
- `svgData` (Object | null) - Parsed SVG structure
  - `root` (Object) - Root SVG element info
  - `styles` (Array) - CSS style definitions
  - `elements` (Array) - Flattened element tree
- `svgContent` (String) - Raw SVG content
- `selectedElement` (Object | null) - Currently selected element

**Methods:**

##### `parseSVG(content)`

Parses SVG content into structured data.

**Parameters:**
- `content` (String) - SVG markup

**Returns:**
- `Object` - Parsed SVG data structure

##### `updateSVG(newContent)`

Updates the SVG content and re-parses.

**Parameters:**
- `newContent` (String) - New SVG markup

##### `selectElement(elementId)`

Selects an element by ID.

**Parameters:**
- `elementId` (String) - Element ID to select

##### `findElementById(id)`

Finds an element in the parsed tree by ID.

**Parameters:**
- `id` (String) - Element ID

**Returns:**
- `Object | null` - Element object or null if not found

---

### useHistory

Location: [`src/hooks/useHistory.js`](../src/hooks/useHistory.js)

Hook for managing undo/redo functionality.

#### Usage

```javascript
const {
  state,
  setState,
  undo,
  redo,
  canUndo,
  canRedo,
  clearHistory
} = useHistory(initialState);
```

**Parameters:**
- `initialState` (Any) - Initial state value

#### Return Values

- `state` (Any) - Current state
- `setState` (Function) - Function to update state (adds to history)
- `undo` (Function) - Undo last change
- `redo` (Function) - Redo previously undone change
- `canUndo` (Boolean) - Whether undo is available
- `canRedo` (Boolean) - Whether redo is available
- `clearHistory` (Function) - Clear all history

**Example:**
```javascript
const { state, setState, undo, redo, canUndo } = useHistory({ zoom: 1 });

// Update state (adds to history)
setState({ zoom: 2 });

// Undo
if (canUndo) {
  undo(); // Returns to { zoom: 1 }
}
```

---

### usePerformance

Location: [`src/hooks/usePerformance.js`](../src/hooks/usePerformance.js)

Hook for monitoring and optimising performance.

#### Usage

```javascript
const {
  metrics,
  startMeasure,
  endMeasure,
  getMetrics
} = usePerformance();
```

#### Return Values

- `metrics` (Object) - Current performance metrics
- `startMeasure` (Function) - Start measuring an operation
- `endMeasure` (Function) - End measuring an operation
- `getMetrics` (Function) - Get all recorded metrics

**Example:**
```javascript
const { startMeasure, endMeasure, metrics } = usePerformance();

startMeasure('render');
// ... expensive operation
endMeasure('render');

console.log(metrics.render); // { duration: 123, count: 1 }
```

---

### useI18n

Location: [`src/hooks/useI18n.jsx`](../src/hooks/useI18n.jsx)

Internationalisation hook for multi-language support.

#### Usage

```javascript
const { t, locale, setLocale, availableLocales } = useI18n();
```

#### Return Values

- `t` (Function) - Translation function
- `locale` (String) - Current locale code
- `setLocale` (Function) - Change current locale
- `availableLocales` (Array) - List of available locale codes

**Example:**
```javascript
const { t, locale, setLocale } = useI18n();

// Get translation
const title = t('app.title'); // "PictoForge"

// Change language
setLocale('es'); // Switch to Spanish
```

---

## Components

### SVGViewer

Location: [`src/components/SVGViewer.jsx`](../src/components/SVGViewer.jsx)

Main SVG viewer component with interactive editing tools.

#### Props

```javascript
<SVGViewer
  svgContent={string}
  selectedElement={object}
  onElementSelect={function}
  onSVGUpdate={function}
  tool={string}
  onToolChange={function}
/>
```

**Props:**
- `svgContent` (String, required) - SVG markup to display
- `selectedElement` (Object, optional) - Currently selected element
- `onElementSelect` (Function, optional) - Callback when element is selected
  - Signature: `(element: Object) => void`
- `onSVGUpdate` (Function, optional) - Callback when SVG is modified
  - Signature: `(newContent: String) => void`
- `tool` (String, optional) - Active tool: `'select'` | `'node'` | `'pen'`
- `onToolChange` (Function, optional) - Callback when tool changes
  - Signature: `(tool: String) => void`

#### Refs

Exposes refs for:
- `svgRef` - Reference to SVG element
- `containerRef` - Reference to container element
- `overlayRef` - Reference to overlay SVG

---

### SVGHierarchy

Location: [`src/components/SVGHierarchy.jsx`](../src/components/SVGHierarchy.jsx)

Tree view component for SVG element hierarchy.

#### Props

```javascript
<SVGHierarchy
  svgData={object}
  selectedElement={object}
  expandedElements={Set}
  onElementSelect={function}
  onToggleExpand={function}
/>
```

**Props:**
- `svgData` (Object, required) - Parsed SVG data structure
- `selectedElement` (Object, optional) - Currently selected element
- `expandedElements` (Set, optional) - Set of expanded element IDs
- `onElementSelect` (Function, required) - Element selection callback
  - Signature: `(element: Object) => void`
- `onToggleExpand` (Function, optional) - Toggle expansion callback
  - Signature: `(elementId: String) => void`

---

### BoundingBox

Location: [`src/components/BoundingBox.jsx`](../src/components/BoundingBox.jsx)

Interactive bounding box with resize and rotation handles.

#### Props

```javascript
<BoundingBox
  element={object}
  visible={boolean}
  onResize={function}
  onMove={function}
  onRotate={function}
/>
```

**Props:**
- `element` (Object, required) - Element to show bounding box for
- `visible` (Boolean, optional) - Whether to show the bounding box
- `onResize` (Function, optional) - Resize callback
  - Signature: `(width: Number, height: Number) => void`
- `onMove` (Function, optional) - Move callback
  - Signature: `(dx: Number, dy: Number) => void`
- `onRotate` (Function, optional) - Rotation callback
  - Signature: `(angle: Number) => void`

---

### NodeEditor

Location: [`src/components/NodeEditor.jsx`](../src/components/NodeEditor.jsx)

Path node editing component for manipulating Bézier curves.

#### Props

```javascript
<NodeEditor
  element={object}
  visible={boolean}
  tool={string}
  onNodeChange={function}
  onNodeAdd={function}
  onNodeRemove={function}
/>
```

**Props:**
- `element` (Object, required) - Path element to edit
- `visible` (Boolean, optional) - Whether to show node editor
- `tool` (String, optional) - Current tool: `'node'` | `'pen'`
- `onNodeChange` (Function, optional) - Node modification callback
  - Signature: `(nodeIndex: Number, x: Number, y: Number) => void`
- `onNodeAdd` (Function, optional) - Add node callback
  - Signature: `(x: Number, y: Number) => void`
- `onNodeRemove` (Function, optional) - Remove node callback
  - Signature: `(nodeIndex: Number) => void`

---

### StylePanel

Location: [`src/components/StylePanel.jsx`](../src/components/StylePanel.jsx)

CSS style management panel.

#### Props

```javascript
<StylePanel
  styles={array}
  selectedElement={object}
  onStyleChange={function}
/>
```

**Props:**
- `styles` (Array, required) - Available CSS style definitions
- `selectedElement` (Object, optional) - Currently selected element
- `onStyleChange` (Function, required) - Style change callback
  - Signature: `(element: Object, className: String, action: 'add' | 'remove') => void`

---

### CodeView

Location: [`src/components/CodeView.jsx`](../src/components/CodeView.jsx)

Editable code view with syntax highlighting.

#### Props

```javascript
<CodeView
  svgContent={string}
  selectedElement={object}
  onSVGUpdate={function}
/>
```

**Props:**
- `svgContent` (String, required) - SVG markup to display
- `selectedElement` (Object, optional) - Currently selected element (for highlighting)
- `onSVGUpdate` (Function, required) - Callback when code is modified
  - Signature: `(newContent: String) => void`

---

## Utilities

### svgManipulation

Location: [`src/utils/svgManipulation.js`](../src/utils/svgManipulation.js)

Utility functions for SVG manipulation.

#### Functions

##### `parseTransform(transformString)`

Parses an SVG transform string into an object.

**Parameters:**
- `transformString` (String) - Transform attribute value

**Returns:**
- `Object` - Parsed transform with properties like `translate`, `rotate`, `scale`

**Example:**
```javascript
const transform = parseTransform('translate(10, 20) rotate(45)');
// { translate: [10, 20], rotate: [45] }
```

##### `applyTransform(element, transform)`

Applies a transform object to an element.

**Parameters:**
- `element` (SVGElement) - Element to transform
- `transform` (Object) - Transform specification

##### `getElementPath(element)`

Gets the d attribute of a path element as parsed commands.

**Parameters:**
- `element` (SVGElement) - Path element

**Returns:**
- `Array` - Array of path commands

##### `setElementPath(element, commands)`

Sets the d attribute of a path element from commands.

**Parameters:**
- `element` (SVGElement) - Path element
- `commands` (Array) - Array of path commands

##### `duplicateElement(element)`

Creates a duplicate of an element.

**Parameters:**
- `element` (SVGElement) - Element to duplicate

**Returns:**
- `SVGElement` - Cloned element

##### `removeElement(element)`

Removes an element from the DOM.

**Parameters:**
- `element` (SVGElement) - Element to remove

---

## Type Definitions

### Element Object

```typescript
interface Element {
  id: string;
  tagName: string;
  attributes: { [key: string]: string };
  children: Element[];
  parent: Element | null;
  domNode: SVGElement;
}
```

### SVG Data Structure

```typescript
interface SVGData {
  root: {
    tagName: 'svg';
    attributes: { [key: string]: string };
  };
  styles: Array<{
    selector: string;
    properties: { [key: string]: string };
  }>;
  elements: Element[];
}
```

### Viewport State

```typescript
interface ViewportState {
  scale: number;  // Zoom level (1 = 100%)
  x: number;      // Pan X in pixels
  y: number;      // Pan Y in pixels
}
```

---

## Error Handling

All API functions should handle errors gracefully. Common error scenarios:

1. **Invalid SVG Content**: `parseSVG()` returns null for invalid content
2. **Element Not Found**: `findElementById()` returns null
3. **Invalid Coordinates**: Coordinate transformation functions return `{ x: 0, y: 0 }` on error
4. **Missing Refs**: Hooks check for ref validity before operations

**Example Error Handling:**

```javascript
try {
  const svgData = parseSVG(content);
  if (!svgData) {
    console.error('Failed to parse SVG');
    return;
  }
  // ... proceed with valid data
} catch (error) {
  console.error('SVG parsing error:', error);
}
```

---

## Best Practices

1. **Coordinate Transformations**: Always use SVGWorld for coordinate conversions, never manual calculations
2. **State Updates**: Use the history hook for all state changes that should be undoable
3. **Performance**: Use the performance hook to identify bottlenecks in development
4. **Element Selection**: Always update both the hierarchy and viewer when selection changes
5. **SVG Modifications**: Always update through the proper callbacks to maintain synchronisation

---

## Testing

API functions should be tested with:

```javascript
import { describe, it, expect } from 'vitest';
import { useSVGParser } from '../hooks/useSVGParser';

describe('useSVGParser', () => {
  it('should parse valid SVG content', () => {
    const { parseSVG } = useSVGParser();
    const content = '<svg><rect id="test" /></svg>';
    const result = parseSVG(content);

    expect(result).not.toBeNull();
    expect(result.root.tagName).toBe('svg');
  });
});
```

See [`src/tests/`](../src/tests/) for more examples.

---

## Further Reading

- [System Architecture](architecture.md)
- [Coordinate System Guide](coordinate-system.md)
- [ASCII Interface Map](ascii-divmap.md)
