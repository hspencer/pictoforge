# Sistema de Transformación de Coordenadas

Este documento describe el sistema de transformación de coordenadas implementado en PictoForge para habilitar la manipulación visual de elementos SVG.

## Descripción General

El sistema proporciona tres capacidades principales:

1. **Transformación de coordenadas** entre pantalla y SVG (bidireccional)
2. **Codificación de coordenadas** a formato path SVG
3. **Manipulación visual** de elementos SVG con gestión automática de coordenadas

## Módulos

### 1. `coordinateTransform.js`

Maneja la conversión de coordenadas entre el espacio de pantalla y el espacio SVG, teniendo en cuenta:
- Zoom del visor
- Pan (desplazamiento)
- ViewBox del SVG
- Transformaciones CTM (Current Transformation Matrix)

#### Funciones Principales

##### `screenToSVGCoordinates(screenX, screenY, svgElement, viewport)`

Convierte coordenadas de pantalla (del evento de mouse) a coordenadas SVG absolutas.

```javascript
import { screenToSVGCoordinates } from '@/utils/coordinateTransform';

// En un handler de evento de mouse
const handleMouseClick = (event) => {
  const svgElement = svgRef.current.querySelector('svg');
  const viewport = { zoom: 1.5, pan: { x: 20, y: 30 } };

  const svgCoords = screenToSVGCoordinates(
    event.clientX,
    event.clientY,
    svgElement,
    viewport
  );

  console.log(`SVG coords: ${svgCoords.x}, ${svgCoords.y}`);
};
```

##### `svgToScreenCoordinates(svgX, svgY, svgElement, viewport)`

Convierte coordenadas SVG a coordenadas de pantalla (útil para posicionar overlays).

```javascript
import { svgToScreenCoordinates } from '@/utils/coordinateTransform';

const svgPoint = { x: 100, y: 200 };
const screenCoords = svgToScreenCoordinates(
  svgPoint.x,
  svgPoint.y,
  svgElement,
  viewport
);

// Usar screenCoords para posicionar un elemento HTML sobre el SVG
overlay.style.left = `${screenCoords.x}px`;
overlay.style.top = `${screenCoords.y}px`;
```

##### `screenDeltaToSVGDelta(deltaScreenX, deltaScreenY, svgElement, viewport)`

Convierte un delta de movimiento de pantalla a delta de SVG (útil para arrastrar).

```javascript
import { screenDeltaToSVGDelta } from '@/utils/coordinateTransform';

// Durante el arrastre
const deltaScreen = {
  x: event.clientX - startX,
  y: event.clientY - startY
};

const svgDelta = screenDeltaToSVGDelta(
  deltaScreen.x,
  deltaScreen.y,
  svgElement,
  viewport
);

// Mover el elemento por svgDelta.dx, svgDelta.dy
moveElement(element, svgDelta.dx, svgDelta.dy);
```

##### `getClosestPointOnPath(pathElement, point)`

Encuentra el punto más cercano en un path a unas coordenadas dadas.

```javascript
import { getClosestPointOnPath } from '@/utils/coordinateTransform';

const pathElement = document.getElementById('myPath');
const clickPoint = { x: 150, y: 250 };

const closest = getClosestPointOnPath(pathElement, clickPoint);
console.log(`Punto más cercano: ${closest.point.x}, ${closest.point.y}`);
console.log(`Distancia: ${closest.distance}`);
console.log(`Posición normalizada: ${closest.normalizedT}`);
```

##### `useCoordinateTransform(svgRef, viewport)` Hook

Hook de React para usar en componentes.

```javascript
import { useCoordinateTransform } from '@/utils/coordinateTransform';

function MyComponent() {
  const svgRef = useRef(null);
  const viewport = { zoom: 1, pan: { x: 0, y: 0 } };

  const { screenToSVG, svgToScreen, screenDeltaToSVG } =
    useCoordinateTransform(svgRef, viewport);

  const handleClick = (event) => {
    const svgCoords = screenToSVG(event.clientX, event.clientY);
    console.log('Clicked at SVG:', svgCoords);
  };

  return <div ref={svgRef} onClick={handleClick}>...</div>;
}
```

---

### 2. `pathEncoding.js`

Convierte pares ordenados de coordenadas numéricas a comandos de path SVG.

#### Funciones de Codificación

##### `pointToMoveTo(x, y, relative = false)`

Genera comando MoveTo (M o m).

```javascript
import { pointToMoveTo } from '@/utils/pathEncoding';

const cmd = pointToMoveTo(100, 200); // "M 100 200"
const cmdRel = pointToMoveTo(10, 20, true); // "m 10 20"
```

##### `pointToLineTo(x, y, relative = false)`

Genera comando LineTo (L o l).

```javascript
import { pointToLineTo } from '@/utils/pathEncoding';

const cmd = pointToLineTo(150, 250); // "L 150 250"
```

##### `pointsToCubicBezier(cp1, cp2, end, relative = false)`

Genera comando de curva cúbica Bézier (C o c).

```javascript
import { pointsToCubicBezier } from '@/utils/pathEncoding';

const cmd = pointsToCubicBezier(
  { x: 100, y: 100 },  // primer punto de control
  { x: 200, y: 100 },  // segundo punto de control
  { x: 200, y: 200 }   // punto final
);
// "C 100 100, 200 100, 200 200"
```

##### `pointsToQuadraticBezier(cp, end, relative = false)`

Genera comando de curva cuadrática Bézier (Q o q).

```javascript
import { pointsToQuadraticBezier } from '@/utils/pathEncoding';

const cmd = pointsToQuadraticBezier(
  { x: 150, y: 100 },  // punto de control
  { x: 200, y: 200 }   // punto final
);
// "Q 150 100, 200 200"
```

##### `pointsToPath(points, closed = false, relative = false)`

Convierte un array de puntos a un path completo.

```javascript
import { pointsToPath } from '@/utils/pathEncoding';

const points = [
  { x: 10, y: 10 },
  { x: 100, y: 50 },
  { x: 50, y: 100 }
];

const pathData = pointsToPath(points, true); // cerrado
// "M 10 10 L 100 50 L 50 100 Z"

// Para crear un path con el mouse
const drawnPoints = [];
canvas.addEventListener('mousemove', (e) => {
  const svgCoords = screenToSVG(e.clientX, e.clientY);
  drawnPoints.push(svgCoords);

  const pathData = pointsToPath(drawnPoints);
  pathElement.setAttribute('d', pathData);
});
```

##### `rectToPath(x, y, width, height, rx = 0, ry = 0)`

Convierte un rectángulo a path (con esquinas opcionales redondeadas).

```javascript
import { rectToPath } from '@/utils/pathEncoding';

const pathData = rectToPath(10, 10, 100, 50);
// Rectángulo como path

const roundedPath = rectToPath(10, 10, 100, 50, 5);
// Rectángulo con esquinas redondeadas
```

##### `circleToPath(cx, cy, r)` y `ellipseToPath(cx, cy, rx, ry)`

Convierte círculos y elipses a paths.

```javascript
import { circleToPath, ellipseToPath } from '@/utils/pathEncoding';

const circlePath = circleToPath(100, 100, 50);
const ellipsePath = ellipseToPath(100, 100, 70, 40);
```

#### Funciones de Parseo

##### `parsePathCommand(command)`

Parsea un comando de path y extrae sus coordenadas.

```javascript
import { parsePathCommand } from '@/utils/pathEncoding';

const parsed = parsePathCommand("M 10 20");
// { type: 'M', coords: [10, 20], isRelative: false }

const parsed2 = parsePathCommand("l 5 10");
// { type: 'l', coords: [5, 10], isRelative: true }
```

##### `relativeToAbsolute(command, currentPos)` y `absoluteToRelative(command, currentPos)`

Convierte entre coordenadas relativas y absolutas.

```javascript
import { relativeToAbsolute, absoluteToRelative } from '@/utils/pathEncoding';

const relCmd = { type: 'l', coords: [10, 20], isRelative: true };
const currentPos = { x: 100, y: 100 };

const absCmd = relativeToAbsolute(relCmd, currentPos);
// { type: 'L', coords: [110, 120], isRelative: false }
```

---

### 3. `visualManipulation.js`

Funciones de alto nivel que integran transformación de coordenadas con manipulación de elementos.

#### Funciones Principales

##### `handleElementDrag(element, dragStart, dragCurrent, svgElement, viewport)`

Maneja el arrastre completo de un elemento SVG, con gestión automática según el tipo de elemento.

```javascript
import { handleElementDrag } from '@/utils/visualManipulation';

let dragStart = null;

element.addEventListener('mousedown', (e) => {
  dragStart = { screenX: e.clientX, screenY: e.clientY };
});

document.addEventListener('mousemove', (e) => {
  if (dragStart) {
    const dragCurrent = { screenX: e.clientX, screenY: e.clientY };
    const delta = handleElementDrag(
      element,
      dragStart,
      dragCurrent,
      svgElement,
      viewport
    );

    // Actualizar dragStart para próximo movimiento
    dragStart = dragCurrent;
  }
});
```

##### `handleNodeDrag(pathElement, nodeIndex, dragCurrent, svgElement, viewport)`

Maneja el arrastre de un nodo específico en un path.

```javascript
import { handleNodeDrag } from '@/utils/visualManipulation';

const newPosition = handleNodeDrag(
  pathElement,
  nodeIndex,
  { screenX: e.clientX, screenY: e.clientY },
  svgElement,
  viewport
);

console.log(`Nodo movido a: ${newPosition.x}, ${newPosition.y}`);
```

##### `findClosestNode(pathElement, clickPos, svgElement, viewport, threshold = 10)`

Encuentra el nodo más cercano a un click, útil para seleccionar nodos.

```javascript
import { findClosestNode } from '@/utils/visualManipulation';

pathElement.addEventListener('click', (e) => {
  const closest = findClosestNode(
    pathElement,
    { screenX: e.clientX, screenY: e.clientY },
    svgElement,
    viewport,
    15 // threshold en píxeles SVG
  );

  if (closest) {
    console.log(`Nodo ${closest.index} seleccionado`);
    console.log(`Distancia: ${closest.distance}`);

    if (closest.controlPoint) {
      console.log(`Es un punto de control ${closest.controlPoint}`);
    }
  }
});
```

##### `insertNodeAtPosition(pathElement, clickPos, svgElement, viewport)`

Inserta un nuevo nodo en la posición más cercana del path.

```javascript
import { insertNodeAtPosition } from '@/utils/visualManipulation';

// Con doble click, insertar nuevo nodo
pathElement.addEventListener('dblclick', (e) => {
  const newNode = insertNodeAtPosition(
    pathElement,
    { screenX: e.clientX, screenY: e.clientY },
    svgElement,
    viewport
  );

  if (newNode) {
    console.log(`Nodo insertado en índice ${newNode.index}`);
  }
});
```

##### `useVisualManipulation(svgRef, viewport)` Hook

Hook de React que proporciona todas las funciones de manipulación visual.

```javascript
import { useVisualManipulation } from '@/utils/visualManipulation';

function SVGEditor() {
  const svgRef = useRef(null);
  const [viewport, setViewport] = useState({ zoom: 1, pan: { x: 0, y: 0 } });
  const [selectedElement, setSelectedElement] = useState(null);
  const [dragStart, setDragStart] = useState(null);

  const {
    handleDrag,
    handleNodeDrag,
    findClosestNode,
    insertNode,
    screenToSVG
  } = useVisualManipulation(svgRef, viewport);

  const onMouseDown = (e) => {
    setDragStart({ screenX: e.clientX, screenY: e.clientY });
  };

  const onMouseMove = (e) => {
    if (dragStart && selectedElement) {
      const delta = handleDrag(
        selectedElement,
        dragStart,
        { screenX: e.clientX, screenY: e.clientY }
      );
      setDragStart({ screenX: e.clientX, screenY: e.clientY });
    }
  };

  const onMouseUp = () => {
    setDragStart(null);
  };

  return (
    <div
      ref={svgRef}
      onMouseDown={onMouseDown}
      onMouseMove={onMouseMove}
      onMouseUp={onMouseUp}
    >
      {/* SVG content */}
    </div>
  );
}
```

---

## Ejemplo Completo: Editor de Path Interactivo

```javascript
import React, { useRef, useState } from 'react';
import { useVisualManipulation } from '@/utils/visualManipulation';
import { pointsToPath } from '@/utils/pathEncoding';

function PathEditor() {
  const svgRef = useRef(null);
  const [viewport] = useState({ zoom: 1, pan: { x: 0, y: 0 } });
  const [pathElement, setPathElement] = useState(null);
  const [selectedNode, setSelectedNode] = useState(null);
  const [mode, setMode] = useState('select'); // 'select', 'draw', 'edit'
  const [drawPoints, setDrawPoints] = useState([]);

  const {
    handleNodeDrag,
    findClosestNode,
    insertNode,
    screenToSVG
  } = useVisualManipulation(svgRef, viewport);

  // Modo dibujo: crear nuevo path
  const onDrawClick = (e) => {
    if (mode !== 'draw') return;

    const svgCoords = screenToSVG(e.clientX, e.clientY);
    const newPoints = [...drawPoints, svgCoords];
    setDrawPoints(newPoints);

    if (pathElement) {
      const pathData = pointsToPath(newPoints, false);
      pathElement.setAttribute('d', pathData);
    }
  };

  // Modo edición: seleccionar y arrastrar nodos
  const onEditClick = (e) => {
    if (mode !== 'edit' || !pathElement) return;

    const closest = findClosestNode(
      pathElement,
      { screenX: e.clientX, screenY: e.clientY }
    );

    if (closest) {
      setSelectedNode(closest);
    }
  };

  const onMouseMove = (e) => {
    if (mode === 'edit' && selectedNode && pathElement) {
      handleNodeDrag(
        pathElement,
        selectedNode.index,
        { screenX: e.clientX, screenY: e.clientY }
      );
    }
  };

  const onDoubleClick = (e) => {
    if (mode === 'edit' && pathElement) {
      // Insertar nuevo nodo
      insertNode(
        pathElement,
        { screenX: e.clientX, screenY: e.clientY }
      );
    }
  };

  return (
    <div>
      <div>
        <button onClick={() => setMode('select')}>Seleccionar</button>
        <button onClick={() => setMode('draw')}>Dibujar</button>
        <button onClick={() => setMode('edit')}>Editar Nodos</button>
      </div>

      <div
        ref={svgRef}
        onClick={mode === 'draw' ? onDrawClick : onEditClick}
        onMouseMove={onMouseMove}
        onDoubleClick={onDoubleClick}
        style={{ width: '100%', height: '500px', border: '1px solid black' }}
      >
        <svg width="100%" height="100%" viewBox="0 0 500 500">
          {/* SVG content */}
        </svg>
      </div>
    </div>
  );
}
```

---

## Integración con SVGViewer

Para integrar el sistema en el componente SVGViewer existente:

```javascript
// En SVGViewer.jsx
import { useVisualManipulation } from '@/utils/visualManipulation';

export const SVGViewer = ({ svgContent, selectedElement, onElementSelect, svgData }) => {
  const svgRef = useRef(null);
  const [zoom, setZoom] = useState(1);
  const [pan, setPan] = useState({ x: 0, y: 0 });
  const [tool, setTool] = useState('select');

  // Usar el hook de manipulación visual
  const {
    handleDrag,
    handleNodeDrag,
    findClosestNode,
    screenToSVG
  } = useVisualManipulation(svgRef, { zoom, pan });

  // El resto del componente permanece igual, pero ahora puedes usar
  // las funciones de manipulación en los event handlers

  const handleElementClick = (event) => {
    if (tool === 'node') {
      const target = event.target;
      if (target.tagName === 'path') {
        const closest = findClosestNode(
          target,
          { screenX: event.clientX, screenY: event.clientY }
        );
        if (closest) {
          // Seleccionar el nodo
          setSelectedNode(closest);
        }
      }
    }
  };

  // ... resto del componente
};
```

---

## Consideraciones Importantes

### Viewport State

El objeto `viewport` debe contener:
```javascript
{
  zoom: 1.5,        // Factor de zoom (1 = sin zoom)
  pan: { x: 20, y: 30 }  // Offset de pan en píxeles de pantalla
}
```

### ViewBox

Si tu SVG tiene un `viewBox`, las transformaciones se ajustan automáticamente. Ejemplo:
```html
<svg viewBox="0 0 100 100" width="500" height="500">
  <!-- El sistema convierte correctamente entre el espacio 100x100 y 500x500 -->
</svg>
```

### Performance

- Las funciones están optimizadas para uso en tiempo real (arrastre)
- `formatNumber()` redondea a 3 decimales para reducir tamaño de paths
- `getClosestPointOnPath()` usa muestreo inteligente basado en la longitud del path

### Precisión

- Todas las coordenadas usan `parseFloat` para máxima precisión
- Los deltas se calculan en el espacio correcto antes de aplicar transformaciones
- Se mantiene la precisión decimal en las transformaciones

---

## Testing

Ver archivos de test en:
- `src/utils/__tests__/coordinateTransform.test.js`
- `src/utils/__tests__/pathEncoding.test.js`
- `src/utils/__tests__/visualManipulation.test.js`

Ejecutar tests:
```bash
npm run test
```

---

## Referencias

- [SVG Coordinate Systems](https://developer.mozilla.org/en-US/docs/Web/SVG/Tutorial/Positions)
- [SVG Path Commands](https://developer.mozilla.org/en-US/docs/Web/SVG/Tutorial/Paths)
- [SVG Transforms](https://developer.mozilla.org/en-US/docs/Web/SVG/Attribute/transform)
- [getBBox()](https://developer.mozilla.org/en-US/docs/Web/API/SVGGraphicsElement/getBBox)
- [getCTM()](https://developer.mozilla.org/en-US/docs/Web/API/SVGGraphicsElement/getCTM)
