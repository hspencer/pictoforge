# PictoForge Coordinate System

## 1. The Core Problem

A fundamental challenge in any web-based vector editor is managing the multiple coordinate systems that must work together. An action performed by a user in their browser window (like a click) must be accurately translated into the SVG's internal coordinate space, accounting for any transformations like panning and zooming.

PictoForge handles three primary coordinate systems:

1.  **Screen Coordinates**: The pixel-based system of the browser window. The origin `(0,0)` is the top-left corner of the visible window. Mouse events like `e.clientX` and `e.clientY` provide values in this system.

2.  **Viewport Coordinates**: This is the transformed space of the container that holds the SVG. It is affected by user-initiated panning (translation) and zooming (scaling). For example, a 150% zoom and a 20px pan means this coordinate system is scaled by 1.5 and shifted.

3.  **SVG User Coordinates**: This is the SVG's internal coordinate system, defined by its `viewBox` attribute (e.g., `viewBox="0 0 800 600"`). All the actual vector data (`<path d="...">`, `<circle cx="...">`, etc.) is stored in these units. This system is independent of the SVG's rendered size on the screen.

```
User clicks → [1. Screen Coordinates]
                            ↓
         Apply viewport transformation (pan/zoom)
                            ↓
              [2. Viewport Coordinates]
                            ↓
        Apply SVG viewBox transformation
                            ↓
               [3. SVG User Coordinates]  ← This is where all data is stored and modified.
```

## 2. The Solution: `SVGWorld`

To manage these transformations, PictoForge uses a centralized service called `SVGWorld`. This service acts as the single source of truth for all coordinate conversions.

-   **Service**: `src/services/SVGWorld.js`
-   **Hook**: `src/hooks/useSVGWorld.js`

### Key Transformation Methods

The `useSVGWorld` hook provides three critical functions for converting between coordinate systems.

#### `screenToSVG(screenX, screenY)`

This is the most common transformation. It takes a point from a mouse event (in screen coordinates) and returns the corresponding point in the SVG's internal user coordinates.

**Use Case**: Determining where a user has clicked inside the SVG canvas.

```javascript
import { useSVGWorld } from '@/hooks/useSVGWorld';

const MyComponent = () => {
  const { screenToSVG } = useSVGWorld({ svgRef, viewport });

  const handleCanvasClick = (event) => {
    const svgCoords = screenToSVG(event.clientX, event.clientY);
    console.log(`User clicked at SVG coordinates: (${svgCoords.x}, ${svgCoords.y})`);
    // Now you can use svgCoords to select an element or draw a new shape.
  };

  return <div onClick={handleCanvasClick}>...</div>;
}
```

#### `svgToScreen(svgX, svgY)`

This performs the inverse transformation, converting a point from the SVG's internal coordinate system to its position on the screen.

**Use Case**: Positioning an HTML overlay (like a tooltip or a custom handle) over a specific point on the SVG canvas.

```javascript
import { useSVGWorld } from '@/hooks/useSVGWorld';

const Tooltip = ({ svgPoint }) => {
  const { svgToScreen } = useSVGWorld({ svgRef, viewport });
  const screenPos = svgToScreen(svgPoint.x, svgPoint.y);

  return (
    <div style={{ position: 'absolute', left: screenPos.x, top: screenPos.y }}>
      Tooltip for point ({svgPoint.x}, {svgPoint.y})
    </div>
  );
};
```

#### `screenDeltaToSVGDelta(deltaX, deltaY)`

This function is crucial for drag-and-drop functionality. It converts a *change* in screen position (a delta) into the corresponding *change* in SVG user coordinates. Simply dividing the screen delta by the zoom factor is incorrect because it doesn't account for the full transformation matrix (including `viewBox` scaling, non-uniform scaling, or rotation).

**Use Case**: Dragging an SVG element accurately, regardless of the current zoom level.

```javascript
import { useSVGWorld } from '@/hooks/useSVGWorld';

const DraggableElement = ({ element }) => {
  const { screenDeltaToSVGDelta } = useSVGWorld({ svgRef, viewport });
  let startDragPos = { x: 0, y: 0 };

  const onDragStart = (e) => {
    startDragPos = { x: e.clientX, y: e.clientY };
  };

  const onDrag = (e) => {
    const deltaScreenX = e.clientX - startDragPos.x;
    const deltaScreenY = e.clientY - startDragPos.y;

    // Convert the screen movement into an SVG movement
    const { dx, dy } = screenDeltaToSVGDelta(deltaScreenX, deltaScreenY);

    // Apply the movement to the element's transform
    // (This is a simplified example)
    element.transform({ translateX: dx, translateY: dy });

    // Update start position for the next move event
    startDragPos = { x: e.clientX, y: e.clientY };
  };

  // ... attach event handlers
};
```

### How It Works: The Current Transformation Matrix (CTM)

The `SVGWorld` service relies on the native browser API `getScreenCTM()` on the SVG element. This method returns a single `SVGMatrix` that represents the complete, accumulated transformation required to map a point from the SVG's user space to the screen space.

-   **SVG to Screen**: `transformedPoint = originalPoint.matrixTransform(ctm)`
-   **Screen to SVG**: `transformedPoint = originalPoint.matrixTransform(ctm.inverse())`

By using the CTM, our system automatically accounts for all transformations in the chain: the SVG's `viewBox`, its `width` and `height`, any `<g transform="...">` groups, and the pan/zoom state of the viewport. This makes the calculations robust and precise.

## 3. Common Pitfalls and Best Practices

### DO: Use the `SVGWorld` hooks.

Always use `screenToSVG`, `svgToScreen`, and `screenDeltaToSVGDelta` for any coordinate calculations. Do not attempt to perform manual calculations.

### DON'T: Use `getBoundingClientRect()` for SVG positions.

`element.getBoundingClientRect()` returns the position and size of an element in *screen coordinates*. It is useful for positioning HTML overlays, but its values are not in the SVG's internal coordinate system and should not be used for modifying SVG attributes like `x`, `y`, or path data.

-   **Incorrect**: `const svgX = element.getBoundingClientRect().left;`
-   **Correct (without transforms)**: `const svgX = element.getBBox().x;` (for position within the SVG)
-   **Best (with transforms)**: `const bbox = SVG(element).rbox(svgElement);` (accounts for all transforms)

### DON'T: Manually calculate deltas.

-   **Incorrect**: `const svgDeltaX = screenDeltaX / viewport.zoom;`
-   **Correct**: `const { dx } = screenDeltaToSVGDelta(screenDeltaX, 0);`

### CRITICAL: Use `rbox()` instead of `getBBox()` for transformed elements

**The Problem**: `element.getBBox()` returns the *untransformed* bounding box, ignoring all `transform` attributes. If an element has been translated, rotated, or scaled, `getBBox()` will show its position *before* those transformations were applied.

**The Solution**: Use `SVG(element).rbox(containerElement)` from `@svgdotjs/svg.js` which returns the *transformed* bounding box in the specified coordinate system.

```javascript
import { SVG } from '@svgdotjs/svg.js';

// ❌ WRONG - Ignores transforms
const bbox = element.getBBox();
console.log(bbox.x, bbox.y); // Original position, not rendered position

// ✅ CORRECT - Considers transforms
const svgElement = SVG(element);
const mainSvg = document.querySelector('svg');
const bbox = svgElement.rbox(mainSvg);
console.log(bbox.x, bbox.y); // Actual rendered position
```

**When to use each**:
- `getBBox()`: When you need the *original* untransformed coordinates (rare)
- `rbox()`: When you need the *rendered* position with all transforms applied (most cases)

**Path nodes**: Similarly, path data (`d` attribute) contains untransformed coordinates. To get the actual rendered position of path nodes, you must apply the element's CTM (Current Transformation Matrix) to each node:

```javascript
// Get transform matrix
const ctm = element.getCTM();

// Transform each node
const transformedNode = {
  x: node.x * ctm.a + node.y * ctm.c + ctm.e,
  y: node.x * ctm.b + node.y * ctm.d + ctm.f
};
```

See `NodeEditor.jsx` for a complete implementation.

## 4. Related Utilities

The coordinate system is the foundation for higher-level utilities:

-   **`pathEncoding.js`**: Contains functions to convert arrays of SVG coordinate points into SVG path data strings (e.g., `M 10 10 L 100 100...`).
-   **`visualManipulation.js`**: Provides high-level functions like `handleElementDrag` and `findClosestNode` that use the coordinate transformation functions internally to provide easy-to-use manipulation logic.

By centralizing the core transformation logic in `SVGWorld`, all other parts of the application can operate reliably in the correct coordinate space.