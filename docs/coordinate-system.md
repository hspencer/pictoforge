# Coordinate System in PictoForge

## The Problem

When working with SVG in a browser, there are multiple coordinate systems that must work together:

```
User clicks → [Screen Coordinates]
                            ↓
         Apply viewport transformation (pan/zoom)
                            ↓
              [Container Coordinates]
                            ↓
        Apply SVG viewBox transformation
                            ↓
               [Internal SVG Coordinates]
                            ↓
         This is where SVG data lives
```

## Coordinate Systems

### 1. Screen Coordinates

**Origin**: Top-left corner of the browser window
**Units**: CSS pixels
**Source**: `MouseEvent.clientX`, `MouseEvent.clientY`

```javascript
document.addEventListener('click', (e) => {
  console.log(e.clientX, e.clientY); // Screen coordinates
});
```

### 2. Viewport Coordinates

**Origin**: Depends on applied pan
**Units**: Scaled CSS pixels
**Transformation**: `transform: translate(x, y) scale(s)`

Example with `@panzoom/panzoom`:
```javascript
const { scale, x, y } = panzoomState;
// scale: zoom factor (1 = 100%, 2 = 200%, etc.)
// x, y: displacement in pixels
```

### 3. SVG Coordinates (User Space)

**Origin**: Defined by the `viewBox` attribute
**Units**: SVG units (arbitrary)
**Example**: `viewBox="0 0 800 600"` → (0,0) to (800,600)

```svg
<svg viewBox="0 0 100 100" width="500" height="500">
  <!-- This circle is at (50, 50) in SVG coordinates -->
  <!-- But renders at (250, 250) on screen -->
  <circle cx="50" cy="50" r="10" />
</svg>
```

## Conversion with SVGWorld

### Screen → SVG

```javascript
// User clicks on screen
const handleClick = (e) => {
  const { x, y } = screenToSVG(e.clientX, e.clientY);

  // Now (x, y) is in SVG coordinates
  // Ready to create elements or select
};
```

**How does it work internally?**

```javascript
screenToSVG(screenX, screenY) {
  // 1. Create SVG point
  const svgPoint = svg.createSVGPoint();
  svgPoint.x = screenX;
  svgPoint.y = screenY;

  // 2. Get complete transformation matrix (Screen → SVG)
  const ctm = svg.getScreenCTM();

  // 3. Apply inverse transformation
  const transformed = svgPoint.matrixTransform(ctm.inverse());

  return { x: transformed.x, y: transformed.y };
}
```

The CTM (Current Transformation Matrix) includes:
- viewBox transformation
- Viewport transformation (pan/zoom)
- Any applied CSS transform

### SVG → Screen

```javascript
// Convert SVG element position to screen
const element = svg.getElementById('my-circle');
const bbox = element.getBBox(); // { x, y, width, height } in SVG

const screenPos = svgToScreen(bbox.x, bbox.y);
console.log(`Element appears at (${screenPos.x}, ${screenPos.y}) on screen`);
```

### Screen Delta → SVG Delta

For drag and drop, we need to convert **differences**:

```javascript
const handleDrag = (e) => {
  // Delta in screen pixels
  const deltaScreenX = e.clientX - startX;
  const deltaScreenY = e.clientY - startY;

  // Convert to SVG delta
  const { dx, dy } = screenDeltaToSVGDelta(deltaScreenX, deltaScreenY);

  // Apply movement in SVG coordinates
  element.setAttribute('x', originalX + dx);
  element.setAttribute('y', originalY + dy);
};
```

**Why not simply divide by scale?**

```javascript
// ❌ Incorrect (doesn't consider rotation, skew, etc.)
const dx = deltaScreenX / scale;

// ✅ Correct (considers entire transformation)
const { dx } = screenDeltaToSVGDelta(deltaScreenX, deltaScreenY);
```

## Common Use Cases

### Clicking on an element

```javascript
const SVGViewer = () => {
  const { screenToSVG } = useSVGWorld({ ... });

  const handleElementClick = (e) => {
    // 1. Get screen coordinates
    const screenCoords = { x: e.clientX, y: e.clientY };

    // 2. Convert to SVG
    const svgCoords = screenToSVG(screenCoords.x, screenCoords.y);

    // 3. Find element at those coordinates
    const element = document.elementFromPoint(e.clientX, e.clientY);

    // 4. Use svgCoords for operations in SVG space
    console.log('Clicked element at SVG position:', svgCoords);
  };

  return <div onClick={handleElementClick}>...</div>;
};
```

### Element Drag and Drop

```javascript
const handleDragStart = (e, element) => {
  const startScreenX = e.clientX;
  const startScreenY = e.clientY;

  // Initial position in SVG
  const startSVGPos = screenToSVG(startScreenX, startScreenY);

  const handleMouseMove = (e) => {
    // Delta on screen
    const deltaScreen = {
      x: e.clientX - startScreenX,
      y: e.clientY - startScreenY
    };

    // Convert to SVG delta
    const { dx, dy } = screenDeltaToSVGDelta(deltaScreen.x, deltaScreen.y);

    // Move element
    moveElement(element, dx, dy);
  };

  document.addEventListener('mousemove', handleMouseMove);
};
```

### Drawing overlay at element position

```javascript
const NodeEditor = ({ element }) => {
  const { svgToScreen } = useSVGWorld({ ... });

  // Get element position in SVG
  const bbox = element.getBBox();

  // Convert to screen to display UI
  const screenPos = svgToScreen(bbox.x, bbox.y);

  return (
    <div
      style={{
        position: 'absolute',
        left: screenPos.x,
        top: screenPos.y
      }}
    >
      {/* Editing UI */}
    </div>
  );
};
```

## Debugging

For debugging transformations:

```javascript
const debugCoordinates = (e) => {
  const screen = { x: e.clientX, y: e.clientY };
  const svg = screenToSVG(screen.x, screen.y);
  const backToScreen = svgToScreen(svg.x, svg.y);

  console.log({
    screen,
    svg,
    backToScreen,
    // Should be equal (with small rounding error)
    roundTrip: {
      deltaX: Math.abs(screen.x - backToScreen.x),
      deltaY: Math.abs(screen.y - backToScreen.y)
    }
  });
};
```

## Common Errors

### ❌ Using getBoundingClientRect() directly

```javascript
// Incorrect - doesn't consider internal SVG transformations
const rect = element.getBoundingClientRect();
const x = rect.left; // This is in screen space, not SVG
```

```javascript
// Correct
const bbox = element.getBBox(); // SVG coordinates
const { x, y } = bbox;
```

### ❌ Assuming zoom = scale

```javascript
// Incorrect - assumes only uniform zoom
const svgX = screenX / zoom;
```

```javascript
// Correct - uses complete matrix
const { x } = screenToSVG(screenX, screenY);
```

### ❌ Not considering the container

```javascript
// Incorrect - e.clientX is relative to window
const localX = e.clientX;
```

```javascript
// Correct - subtract container offset if necessary
const container = containerRef.current;
const rect = container.getBoundingClientRect();
const localX = e.clientX - rect.left;
```

## Resources

- [SVG Coordinate Systems Tutorial](https://developer.mozilla.org/en-US/docs/Web/SVG/Tutorial/Positions)
- [getScreenCTM() API](https://developer.mozilla.org/en-US/docs/Web/API/SVGGraphicsElement/getScreenCTM)
- [SVGPoint API](https://developer.mozilla.org/en-US/docs/Web/API/SVGPoint)
- [Understanding SVG Coordinate Systems](https://www.sarasoueidan.com/blog/svg-coordinate-systems/)
