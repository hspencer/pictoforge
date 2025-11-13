# PictoForge Architecture

## Overview

PictoForge is an interactive SVG editor built with React that enables direct manipulation of graphical elements with visual and code precision.

## Fundamental Problem: Coordinate Transformation

The main challenge in any SVG graphical editor is handling multiple coordinate systems:

```
┌─────────────────────────────────────────────────────────────┐
│  1. Screen Coordinates                                      │
│     - Browser pixels (clientX, clientY)                    │
│     - Where the user clicks                                │
└─────────────────────────────────────────────────────────────┘
                            ↕
┌─────────────────────────────────────────────────────────────┐
│  2. Viewport Coordinates (Pan/Zoom)                         │
│     - Transformation applied by the user                   │
│     - scale, translateX, translateY                        │
└─────────────────────────────────────────────────────────────┘
                            ↕
┌─────────────────────────────────────────────────────────────┐
│  3. SVG Coordinates (viewBox)                               │
│     - Original SVG coordinate system                       │
│     - Where element data is stored                         │
└─────────────────────────────────────────────────────────────┘
```

## Solution: SVGWorld

`SVGWorld` is a centralised "world" object that acts as an intermediary between all coordinate systems.

### Location
- **Class**: `/src/services/SVGWorld.js`
- **React Hook**: `/src/hooks/useSVGWorld.js`

### Responsibilities

1. **Coordinate Transformation**
   - `screenToSVG(x, y)` - Converts screen → SVG
   - `svgToScreen(x, y)` - Converts SVG → screen
   - `screenDeltaToSVGDelta(dx, dy)` - Converts deltas for drag and drop

2. **Element Manipulation**
   - `getElementBBox(element)` - Gets bounding box
   - `moveElement(element, dx, dy)` - Moves elements
   - `applyTransform(element, transform)` - Applies transformations

3. **World State**
   - Maintains reference to SVG element
   - Synchronises with pan/zoom state
   - Provides unified API

### Usage

```javascript
// In a React component
const {
  screenToSVG,
  svgToScreen,
  moveElement,
  getElementBBox
} = useSVGWorld({
  svgRef: svgContainerRef,
  containerRef: containerRef,
  viewport: panzoomState
});

// Convert screen click to SVG coordinates
const handleClick = (e) => {
  const svgCoords = screenToSVG(e.clientX, e.clientY);
  console.log('Clicked at SVG coordinates:', svgCoords);
};
```

## Technology Stack

### Core
- **React 19** - UI framework
- **SVG.js** - SVG manipulation and transformations
- **@panzoom/panzoom** - Viewport pan and zoom

### Element Manipulation
- **react-moveable** - Interactive drag, resize, rotate
- **Custom pathfinding** - Node and Bézier curve editor

### UI
- **Radix UI** - Accessible components
- **Tailwind CSS** - Styling
- **Lucide React** - Icons

## Component Structure

```
App
├── Container (Main layout)
│   ├── SVGViewer (Visual editor)
│   │   ├── usePanzoom (Pan/Zoom)
│   │   ├── useSVGWorld (Coordinates) ⭐
│   │   ├── useMoveable (Manipulation)
│   │   ├── MoveableWrapper (Drag/Resize/Rotate)
│   │   ├── NodeEditor (Path node editor)
│   │   └── BoundingBox (Visual bounding box)
│   │
│   ├── Hierarchy (Element tree)
│   └── Properties (Properties panel)
│
└── TextInput (File upload)
```

## Data Flow

### 1. SVG Loading
```
User → TextInput → useSVGParser → svgData → SVGViewer
```

### 2. Element Selection
```
Click → SVGViewer → screenToSVG → Identify element → Update state
```

### 3. Manipulation
```
Drag → MoveableWrapper → SVGWorld.screenDeltaToSVGDelta →
Update transform → Save to history
```

## Internal Coordinate System

`SVGWorld` uses `getScreenCTM()` from the native SVG API to obtain the complete transformation matrix:

```javascript
// Get the matrix that converts SVG → Screen
const ctm = svgElement.getScreenCTM();

// Convert screen point to SVG
const svgPoint = svgElement.createSVGPoint();
svgPoint.x = screenX;
svgPoint.y = screenY;
const transformed = svgPoint.matrixTransform(ctm.inverse());
```

This guarantees mathematical precision even with complex transformations.

## Next Steps

### Pending Refactorings
1. Migrate `NodeEditor` to use `useSVGWorld` directly
2. Migrate `BoundingBox` to use `useSVGWorld` directly
3. Remove duplicate helper functions
4. Unify `useCoordinateTransformer` with `useSVGWorld`

### New Features
1. Gradient editor
2. Mask and clip manipulation
3. SVG animations
4. Export to additional formats

## References

- [SVG.js Documentation](https://svgjs.dev/)
- [SVG Coordinate Systems (MDN)](https://developer.mozilla.org/en-US/docs/Web/SVG/Tutorial/Positions)
- [getScreenCTM()](https://developer.mozilla.org/en-US/docs/Web/API/SVGGraphicsElement/getScreenCTM)
