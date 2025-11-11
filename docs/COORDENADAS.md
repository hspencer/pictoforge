# Sistema de Transformación de Coordenadas - Resumen

## ¿Qué se ha implementado?

Se ha creado un sistema completo para habilitar la **manipulación visual de elementos SVG** en PictoForge. Este sistema resuelve el problema fundamental de convertir entre coordenadas de pantalla (del mouse) y coordenadas SVG, teniendo en cuenta zoom, pan y viewBox.

## Archivos Creados

### 1. **`src/utils/coordinateTransform.js`**
Transformación bidireccional de coordenadas:
- **Pantalla → SVG**: `screenToSVGCoordinates(screenX, screenY, svgElement, viewport)`
- **SVG → Pantalla**: `svgToScreenCoordinates(svgX, svgY, svgElement, viewport)`
- **Delta pantalla → Delta SVG**: `screenDeltaToSVGDelta(deltaX, deltaY, svgElement, viewport)`

### 2. **`src/utils/pathEncoding.js`**
Codificación de coordenadas a formato path SVG:
- Conversión de pares ordenados (x, y) a comandos SVG (M, L, C, Q, A, etc.)
- Funciones para crear paths desde arrays de puntos
- Conversión entre coordenadas relativas y absolutas
- Conversión de formas básicas (círculo, rectángulo, elipse) a paths

### 3. **`src/utils/visualManipulation.js`**
Funciones de alto nivel para manipulación visual:
- Arrastre de elementos completos con gestión automática por tipo
- Arrastre de nodos individuales en paths
- Búsqueda del nodo más cercano a un click
- Inserción de nodos en paths
- Hook de React listo para usar

### 4. **`docs/coordinate-transformation.md`**
Documentación completa en inglés con:
- Explicación de cada función
- Ejemplos de código
- Casos de uso reales
- Ejemplo completo de editor de paths interactivo

### 5. **Actualizaciones en `src/utils/svgManipulation.js`**
Re-exportación de funciones para acceso conveniente desde un solo módulo.

## Caso de Uso Principal

### Problema Original
Cuando el usuario hace click en (500px, 300px) en la pantalla, pero el visor tiene:
- Zoom de 150%
- Pan de (20px, 30px)
- ViewBox de "0 0 100 100" en un SVG de 500x500px

¿Qué coordenadas SVG reales corresponden a ese click?

### Solución
```javascript
import { screenToSVGCoordinates } from '@/utils/coordinateTransform';

const viewport = { zoom: 1.5, pan: { x: 20, y: 30 } };
const svgCoords = screenToSVGCoordinates(500, 300, svgElement, viewport);
// Devuelve las coordenadas SVG correctas considerando todas las transformaciones
```

## Flujo de Trabajo Típico

### 1. Arrastrar un elemento completo
```javascript
import { useVisualManipulation } from '@/utils/visualManipulation';

const { handleDrag } = useVisualManipulation(svgRef, viewport);

// En el handler de mouse move
const delta = handleDrag(element, dragStart, dragCurrent);
// El elemento se mueve correctamente independiente del zoom/pan
```

### 2. Editar nodos de un path
```javascript
const { findClosestNode, handleNodeDrag } = useVisualManipulation(svgRef, viewport);

// Al hacer click, encontrar el nodo más cercano
const onClick = (e) => {
  const node = findClosestNode(
    pathElement,
    { screenX: e.clientX, screenY: e.clientY }
  );
  if (node) {
    setSelectedNode(node);
  }
};

// Al arrastrar, mover el nodo
const onMove = (e) => {
  if (selectedNode) {
    handleNodeDrag(
      pathElement,
      selectedNode.index,
      { screenX: e.clientX, screenY: e.clientY }
    );
  }
};
```

### 3. Dibujar un nuevo path
```javascript
import { pointsToPath } from '@/utils/pathEncoding';

const points = [];
const onMouseMove = (e) => {
  const svgCoords = screenToSVG(e.clientX, e.clientY);
  points.push(svgCoords);

  const pathData = pointsToPath(points);
  pathElement.setAttribute('d', pathData);
};
```

## Integración con SVGViewer

El sistema está diseñado para integrarse fácilmente con el componente SVGViewer existente:

```javascript
// En SVGViewer.jsx
import { useVisualManipulation } from '@/utils/visualManipulation';

export const SVGViewer = ({ svgContent, ... }) => {
  const svgRef = useRef(null);
  const [zoom, setZoom] = useState(1);
  const [pan, setPan] = useState({ x: 0, y: 0 });

  const manipulation = useVisualManipulation(svgRef, { zoom, pan });

  // Usar manipulation.handleDrag, manipulation.findClosestNode, etc.
  // en los event handlers existentes
};
```

## Características Clave

✅ **Bidireccional**: Pantalla ↔ SVG
✅ **Considera zoom y pan**: Las transformaciones son precisas independiente del estado del visor
✅ **Maneja viewBox**: Funciona correctamente con SVGs que tienen viewBox
✅ **Gestión automática por tipo**: `handleElementDrag` sabe cómo mover círculos, rectángulos, paths, etc.
✅ **Edición de nodos**: Soporte completo para manipular nodos individuales en paths
✅ **Puntos de control Bézier**: Maneja curvas cúbicas y cuadráticas
✅ **Hooks de React**: Listo para usar en componentes React
✅ **Bien documentado**: Documentación completa con ejemplos

## Próximos Pasos Sugeridos

1. **Integrar en BoundingBox.jsx**:
   - Usar `screenDeltaToSVGDelta` para arrastre preciso de handles
   - Aplicar transformaciones correctas al redimensionar

2. **Integrar en NodeEditor.jsx**:
   - Usar `findClosestNode` para selección de nodos
   - Usar `handleNodeDrag` para mover nodos

3. **Actualizar SVGViewer.jsx**:
   - Reemplazar lógica de arrastre existente con `useVisualManipulation`
   - Agregar soporte para dibujar nuevos paths

4. **Añadir tests**:
   - Tests unitarios para funciones de transformación
   - Tests de integración para manipulación visual

5. **Mejoras UX**:
   - Visualizar puntos de control Bézier cuando se editan curvas
   - Snap to grid con coordenadas SVG
   - Guías de alineación usando coordenadas transformadas

## Referencias Técnicas

- **CTM (Current Transformation Matrix)**: Matriz acumulada de todas las transformaciones de un elemento
- **ViewBox**: Sistema de coordenadas del SVG independiente del tamaño de renderizado
- **Transform Origin**: Punto de origen para transformaciones (escala, rotación)

## Soporte

Para documentación detallada en inglés con todos los ejemplos:
- Ver [`docs/coordinate-transformation.md`](./coordinate-transformation.md)

Para el código fuente:
- [`src/utils/coordinateTransform.js`](../src/utils/coordinateTransform.js)
- [`src/utils/pathEncoding.js`](../src/utils/pathEncoding.js)
- [`src/utils/visualManipulation.js`](../src/utils/visualManipulation.js)
