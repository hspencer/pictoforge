# Sistema de Coordenadas en PictoForge

## El Problema

Cuando trabajas con SVG en un navegador, existen múltiples sistemas de coordenadas que deben trabajar juntos:

```
Usuario hace click → [Coordenadas de Pantalla]
                            ↓
         Aplicar transformación de viewport (pan/zoom)
                            ↓
              [Coordenadas del Contenedor]
                            ↓
        Aplicar transformación del viewBox SVG
                            ↓
               [Coordenadas SVG internas]
                            ↓
         Aquí es donde viven los datos del SVG
```

## Sistemas de Coordenadas

### 1. Coordenadas de Pantalla (Screen Coordinates)

**Origen**: Esquina superior izquierda de la ventana del navegador
**Unidades**: Píxeles CSS
**Fuente**: `MouseEvent.clientX`, `MouseEvent.clientY`

```javascript
document.addEventListener('click', (e) => {
  console.log(e.clientX, e.clientY); // Coordenadas de pantalla
});
```

### 2. Coordenadas del Viewport

**Origen**: Depende del pan aplicado
**Unidades**: Píxeles CSS escalados
**Transformación**: `transform: translate(x, y) scale(s)`

Ejemplo con `@panzoom/panzoom`:
```javascript
const { scale, x, y } = panzoomState;
// scale: factor de zoom (1 = 100%, 2 = 200%, etc.)
// x, y: desplazamiento en píxeles
```

### 3. Coordenadas SVG (User Space)

**Origen**: Definido por el atributo `viewBox`
**Unidades**: Unidades SVG (arbitrarias)
**Ejemplo**: `viewBox="0 0 800 600"` → (0,0) a (800,600)

```svg
<svg viewBox="0 0 100 100" width="500" height="500">
  <!-- Este círculo está en (50, 50) en coordenadas SVG -->
  <!-- Pero se renderiza en (250, 250) en pantalla -->
  <circle cx="50" cy="50" r="10" />
</svg>
```

## Conversión con SVGWorld

### Screen → SVG

```javascript
// Usuario hace click en la pantalla
const handleClick = (e) => {
  const { x, y } = screenToSVG(e.clientX, e.clientY);

  // Ahora (x, y) está en coordenadas SVG
  // Listo para crear elementos o seleccionar
};
```

**¿Cómo funciona internamente?**

```javascript
screenToSVG(screenX, screenY) {
  // 1. Crear punto SVG
  const svgPoint = svg.createSVGPoint();
  svgPoint.x = screenX;
  svgPoint.y = screenY;

  // 2. Obtener matriz de transformación completa (Screen → SVG)
  const ctm = svg.getScreenCTM();

  // 3. Aplicar transformación inversa
  const transformed = svgPoint.matrixTransform(ctm.inverse());

  return { x: transformed.x, y: transformed.y };
}
```

La matriz CTM (Current Transformation Matrix) incluye:
- Transformación del viewBox
- Transformación del viewport (pan/zoom)
- Cualquier transform CSS aplicado

### SVG → Screen

```javascript
// Convertir posición de un elemento SVG a pantalla
const element = svg.getElementById('my-circle');
const bbox = element.getBBox(); // { x, y, width, height } en SVG

const screenPos = svgToScreen(bbox.x, bbox.y);
console.log(`El elemento aparece en (${screenPos.x}, ${screenPos.y}) en pantalla`);
```

### Screen Delta → SVG Delta

Para drag & drop, necesitamos convertir **diferencias**:

```javascript
const handleDrag = (e) => {
  // Delta en píxeles de pantalla
  const deltaScreenX = e.clientX - startX;
  const deltaScreenY = e.clientY - startY;

  // Convertir a delta SVG
  const { dx, dy } = screenDeltaToSVGDelta(deltaScreenX, deltaScreenY);

  // Aplicar movimiento en coordenadas SVG
  element.setAttribute('x', originalX + dx);
  element.setAttribute('y', originalY + dy);
};
```

**¿Por qué no simplemente dividir por scale?**

```javascript
// ❌ Incorrecto (no considera rotación, skew, etc.)
const dx = deltaScreenX / scale;

// ✅ Correcto (considera toda la transformación)
const { dx } = screenDeltaToSVGDelta(deltaScreenX, deltaScreenY);
```

## Casos de Uso Comunes

### Click en un elemento

```javascript
const SVGViewer = () => {
  const { screenToSVG } = useSVGWorld({ ... });

  const handleElementClick = (e) => {
    // 1. Obtener coordenadas de pantalla
    const screenCoords = { x: e.clientX, y: e.clientY };

    // 2. Convertir a SVG
    const svgCoords = screenToSVG(screenCoords.x, screenCoords.y);

    // 3. Encontrar elemento en esas coordenadas
    const element = document.elementFromPoint(e.clientX, e.clientY);

    // 4. Usar svgCoords para operaciones en espacio SVG
    console.log('Clicked element at SVG position:', svgCoords);
  };

  return <div onClick={handleElementClick}>...</div>;
};
```

### Drag & Drop de elemento

```javascript
const handleDragStart = (e, element) => {
  const startScreenX = e.clientX;
  const startScreenY = e.clientY;

  // Posición inicial en SVG
  const startSVGPos = screenToSVG(startScreenX, startScreenY);

  const handleMouseMove = (e) => {
    // Delta en pantalla
    const deltaScreen = {
      x: e.clientX - startScreenX,
      y: e.clientY - startScreenY
    };

    // Convertir a delta SVG
    const { dx, dy } = screenDeltaToSVGDelta(deltaScreen.x, deltaScreen.y);

    // Mover elemento
    moveElement(element, dx, dy);
  };

  document.addEventListener('mousemove', handleMouseMove);
};
```

### Dibujar overlay en posición de elemento

```javascript
const NodeEditor = ({ element }) => {
  const { svgToScreen } = useSVGWorld({ ... });

  // Obtener posición del elemento en SVG
  const bbox = element.getBBox();

  // Convertir a pantalla para mostrar UI
  const screenPos = svgToScreen(bbox.x, bbox.y);

  return (
    <div
      style={{
        position: 'absolute',
        left: screenPos.x,
        top: screenPos.y
      }}
    >
      {/* UI de edición */}
    </div>
  );
};
```

## Debugging

Para debug de transformaciones:

```javascript
const debugCoordinates = (e) => {
  const screen = { x: e.clientX, y: e.clientY };
  const svg = screenToSVG(screen.x, screen.y);
  const backToScreen = svgToScreen(svg.x, svg.y);

  console.log({
    screen,
    svg,
    backToScreen,
    // Deberían ser iguales (con pequeño error de redondeo)
    roundTrip: {
      deltaX: Math.abs(screen.x - backToScreen.x),
      deltaY: Math.abs(screen.y - backToScreen.y)
    }
  });
};
```

## Errores Comunes

### ❌ Usar getBoundingClientRect() directamente

```javascript
// Incorrecto - no considera transformaciones SVG internas
const rect = element.getBoundingClientRect();
const x = rect.left; // Esto está en pantalla, no en SVG
```

```javascript
// Correcto
const bbox = element.getBBox(); // SVG coordinates
const { x, y } = bbox;
```

### ❌ Asumir que zoom = scale

```javascript
// Incorrecto - asume que solo hay zoom uniforme
const svgX = screenX / zoom;
```

```javascript
// Correcto - usa la matriz completa
const { x } = screenToSVG(screenX, screenY);
```

### ❌ No considerar el contenedor

```javascript
// Incorrecto - e.clientX es relativo a la ventana
const localX = e.clientX;
```

```javascript
// Correcto - restar offset del contenedor si es necesario
const container = containerRef.current;
const rect = container.getBoundingClientRect();
const localX = e.clientX - rect.left;
```

## Recursos

- [SVG Coordinate Systems Tutorial](https://developer.mozilla.org/en-US/docs/Web/SVG/Tutorial/Positions)
- [getScreenCTM() API](https://developer.mozilla.org/en-US/docs/Web/API/SVGGraphicsElement/getScreenCTM)
- [SVGPoint API](https://developer.mozilla.org/en-US/docs/Web/API/SVGPoint)
- [Understanding SVG Coordinate Systems](https://www.sarasoueidan.com/blog/svg-coordinate-systems/)
