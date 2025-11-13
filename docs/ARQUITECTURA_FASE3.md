# Arquitectura Fase 3: Componentes de Interfaz de Usuario y Manipulación

## Resumen

Se ha implementado el sistema de **manipulación visual avanzada** utilizando **react-moveable**, reemplazando completamente la lógica manual de arrastre, escalado y rotación con un componente moderno y profesional.

## Componentes Implementados

### 1. MoveableWrapper Component (`src/components/MoveableWrapper.jsx`)

**Propósito**: Componente que envuelve elementos SVG con react-moveable para proporcionar capacidades de transformación visual profesionales.

**Características implementadas**:
- ✅ **Draggable**: Arrastrar elementos con el mouse
- ✅ **Resizable**: Redimensionar con handles visuales en 8 direcciones
- ✅ **Rotatable**: Rotar elementos con handle circular
- ✅ **Snappable**: Snap automático a:
  - Grid (cuadrícula configurable)
  - Guías horizontales y verticales
  - Otros elementos (alineación automática)
  - Centro del contenedor
- ✅ **Configuración visual**: Zoom-aware, padding, bounds

**API Principal**:

```jsx
<MoveableWrapper
  target={svgElement}           // Elemento DOM a manipular
  container={containerElement}   // Contenedor de referencia

  // Draggable
  draggable={true}
  onDragStart={handleDragStart}
  onDrag={handleDrag}
  onDragEnd={handleDragEnd}

  // Resizable
  resizable={true}
  keepRatio={false}
  onResizeStart={handleResizeStart}
  onResize={handleResize}
  onResizeEnd={handleResizeEnd}

  // Rotatable
  rotatable={true}
  onRotateStart={handleRotateStart}
  onRotate={handleRotate}
  onRotateEnd={handleRotateEnd}

  // Snapping
  snappable={true}
  snapThreshold={5}
  snapGap={50}
  isDisplaySnapDigit={true}
  isDisplayObjectSnapBound={true}

  // Visual
  zoom={panzoomState.scale}
  renderDirections={['nw', 'n', 'ne', 'w', 'e', 'sw', 's', 'se']}
/>
```

**Sistema de Snapping**:

El componente genera automáticamente guías para snapping:
- **Guías del contenedor**: Bordes y centro
- **Grid guides**: Cada 50px (configurable)
- **Guías de elementos**: Detecta automáticamente otros elementos visibles

```javascript
guidelines = {
  horizontal: [0, height/2, height, 50, 100, 150, ...],
  vertical: [0, width/2, width, 50, 100, 150, ...]
}
```

### 2. useMoveable Hook (`src/hooks/useMoveable.js`)

**Propósito**: Hook que integra Moveable con transformaciones SVG y el CoordinateTransformer.

**Funciones principales**:
- Extrae y parsea transformaciones SVG existentes
- Convierte deltas de pantalla a deltas SVG usando CoordinateTransformer
- Construye strings de transform válidos
- Maneja el ciclo completo: Start → Transform → End
- Integración con historial de cambios

**API**:

```javascript
const {
  // Estado
  isDragging,
  isResizing,
  isRotating,
  isTransforming,

  // Drag handlers
  handleDragStart,
  handleDrag,
  handleDragEnd,

  // Resize handlers
  handleResizeStart,
  handleResize,
  handleResizeEnd,

  // Rotate handlers
  handleRotateStart,
  handleRotate,
  handleRotateEnd,

  // Utilidades
  getElementTransform,
  buildTransformString
} = useMoveable({
  coordinateTransformer,
  onTransformStart,
  onTransform,
  onTransformEnd
});
```

**Estructura de Transform**:

```javascript
{
  translateX: 10,
  translateY: 20,
  scaleX: 1.5,
  scaleY: 1.5,
  rotation: 45,
  raw: 'translate(10, 20) rotate(45) scale(1.5, 1.5)'
}
```

### 3. Integración en SVGViewer

El sistema está completamente integrado en el [SVGViewer.jsx](src/components/SVGViewer.jsx):

**Importaciones**:
```javascript
import MoveableWrapper from './MoveableWrapper';
import useMoveable from '../hooks/useMoveable';
```

**Inicialización del hook**:
```javascript
const {
  handleDragStart,
  handleDrag,
  handleDragEnd,
  handleResizeStart,
  handleResize,
  handleResizeEnd,
  handleRotateStart,
  handleRotate,
  handleRotateEnd,
} = useMoveable({
  coordinateTransformer,
  onTransformStart: (data) => {
    console.log('🎯 Transform Start:', data.type);
  },
  onTransformEnd: (data) => {
    // Guardar en historial
    saveToHistory(svg.outerHTML);
  },
});
```

**Renderizado condicional**:
```javascript
{selectedSVGElement && tool === 'select' && (
  <MoveableWrapper
    target={selectedSVGElement}
    container={containerRef.current}
    zoom={panzoomState.scale}
    // ... handlers
  />
)}
```

## Flujo de Transformación

```
Usuario inicia transformación (drag/resize/rotate)
         ↓
handleTransformStart() → onTransformStart callback
         ↓
getElementTransform() extrae estado actual
         ↓
┌──────────────────────────────────────────────┐
│ Loop de transformación (en tiempo real)      │
│                                               │
│ handleTransform() recibe evento Moveable     │
│         ↓                                     │
│ CoordinateTransformer.screenDeltaToSvgDelta()│
│         ↓                                     │
│ Calcula nuevos valores de transform          │
│         ↓                                     │
│ buildTransformString()                        │
│         ↓                                     │
│ element.setAttribute('transform', newValue)   │
│         ↓                                     │
│ element.style.transform = visual transform    │
└──────────────────────────────────────────────┘
         ↓
handleTransformEnd() → onTransformEnd callback
         ↓
Limpiar style.transform
         ↓
Guardar en historial
```

## Ventajas vs Sistema Manual Anterior

| Aspecto | Sistema Manual | react-moveable |
|---------|---------------|----------------|
| **Handles visuales** | Implementación custom | ✅ Built-in, profesionales |
| **Snapping** | No implementado | ✅ Snap a grid, guías, elementos |
| **Rotación** | Cálculos manuales | ✅ Integrado con rotateControl |
| **Resize proporcional** | No soportado | ✅ keepRatio option |
| **Multi-selección** | No soportado | ✅ Groupable (futuro) |
| **Guías visuales** | No implementadas | ✅ Guidelines automáticas |
| **Throttling** | Manual | ✅ throttleDrag/Resize/Rotate |
| **Bounds** | Implementación custom | ✅ bounds prop integrado |
| **Zoom awareness** | Cálculos manuales | ✅ zoom prop automático |
| **Performance** | Redibuja todo | ✅ Optimizado internamente |
| **Código** | ~200 líneas | ~50 líneas |

## Configuración de Snapping

### 1. Snap a Grid

```javascript
snapGap={50}           // Grid cada 50px
snapThreshold={5}      // Distancia de activación
isDisplaySnapDigit={true}  // Muestra coordenadas
```

### 2. Snap a Guías

```javascript
horizontalGuidelines={[0, containerHeight/2, containerHeight]}
verticalGuidelines={[0, containerWidth/2, containerWidth]}
```

### 3. Snap a Elementos

```javascript
elementGuidelines={getElementGuidelines()}
// Detecta automáticamente elementos vecinos
```

### 4. Visualización de Snapping

```javascript
isDisplaySnapDigit={true}           // Muestra coordenadas numéricas
isDisplayObjectSnapBound={true}     // Muestra bounds de elementos
snapDigit={0}                       // Decimales a mostrar
```

## Configuración de Handles

### Direcciones de Resize

```javascript
renderDirections={['nw', 'n', 'ne', 'w', 'e', 'sw', 's', 'se']}
```

Distribución de handles:
```
nw ---- n ---- ne
 |             |
 w      ⊕      e
 |             |
sw ---- s ---- se
```

### Edge Resize

```javascript
edge={true}  // Permite resize desde bordes, no solo handles
```

## Transformaciones SVG

### Parse de Transform Existente

```javascript
const transform = 'translate(10, 20) rotate(45) scale(1.5, 1.5)';

const result = {
  translateX: 10,
  translateY: 20,
  rotation: 45,
  scaleX: 1.5,
  scaleY: 1.5
};
```

### Build de Transform String

```javascript
buildTransformString({
  translateX: 10,
  translateY: 20,
  rotation: 45,
  scaleX: 1.5,
  scaleY: 1.5
})
// → 'translate(10, 20) rotate(45) scale(1.5, 1.5)'
```

### Orden de Transformaciones

**Importante**: El orden de las transformaciones SVG afecta el resultado:

```javascript
// Orden correcto (SVG estándar)
'translate(x, y) rotate(angle) scale(sx, sy)'

// ✅ 1. Translate (mover)
// ✅ 2. Rotate (rotar sobre el nuevo centro)
// ✅ 3. Scale (escalar desde el nuevo centro rotado)
```

## Integración con CoordinateTransformer

El sistema usa el CoordinateTransformer para convertir coordenadas correctamente:

```javascript
// Durante drag
const screenDelta = { x: event.deltaX, y: event.deltaY };
const svgDelta = coordinateTransformer.screenDeltaToSvgDelta(
  screenDelta.x,
  screenDelta.y
);

// Aplicar delta en coordenadas SVG
newTranslateX = currentTranslateX + svgDelta.dx;
newTranslateY = currentTranslateY + svgDelta.dy;
```

Esto asegura que:
- El movimiento respeta el zoom actual
- El movimiento respeta el pan actual
- El movimiento respeta el viewBox del SVG
- Las coordenadas son precisas sin importar la transformación del canvas

## Casos de Uso

### 1. Mover un Elemento

```javascript
// Usuario arrastra elemento
handleDrag(event) {
  // Coordenadas de pantalla → SVG
  const svgDelta = coordinateTransformer.screenDeltaToSvgDelta(
    event.beforeTranslate[0],
    event.beforeTranslate[1]
  );

  // Aplicar
  element.setAttribute('transform',
    `translate(${x + svgDelta.dx}, ${y + svgDelta.dy})`
  );
}
```

### 2. Redimensionar con Proporción

```javascript
<MoveableWrapper
  resizable={true}
  keepRatio={true}  // Mantiene aspecto ratio
  // ...
/>
```

### 3. Rotar con Snap

```javascript
<MoveableWrapper
  rotatable={true}
  rotationPosition="top"  // Handle en la parte superior
  onRotate={(e) => {
    // e.rotate contiene el ángulo en grados
    // Snap automático cada 15°
  }}
/>
```

### 4. Snap a Otros Elementos

```javascript
const getElementGuidelines = () => {
  // Encuentra todos los elementos SVG visibles
  const elements = container.querySelectorAll('*');
  return Array.from(elements).filter(el => {
    // Excluye el elemento actual
    return el !== target && rect.width > 0;
  });
};

<MoveableWrapper
  elementGuidelines={getElementGuidelines()}
  // Snap automático a bordes de otros elementos
/>
```

## Logs de Debug

El sistema genera logs detallados en consola:

```javascript
🎯 Drag Start: { element: 'path-1', initialTransform: {...} }
🎯 Drag: {
  screenDelta: [10, 5],
  svgDelta: { dx: 2.5, dy: 1.25 },
  newTransform: { translateX: 12.5, translateY: 21.25 }
}
🎯 Drag End: { element: 'path-1', finalTransform: {...} }

📏 Resize Start: { element: 'path-1', ... }
📏 Resize: { scale: { scaleX: 1.2, scaleY: 1.2 }, ... }
📏 Resize End: { ... }

🔄 Rotate Start: { element: 'path-1', ... }
🔄 Rotate: { rotation: 45, ... }
🔄 Rotate End: { ... }
```

## Próximos Pasos (Futuras Mejoras)

### Fase 3.5: Funcionalidades Avanzadas
- **Groupable**: Selección múltiple y transformación de grupos
- **Warpable**: Deformación de elementos (skew)
- **Cloneable**: Duplicar elementos con drag + tecla modificadora
- **Pinchable**: Soporte para gestos táctiles multi-touch

### Fase 4: Integración Completa
- **Atajos de teclado**: Arrow keys para mover, Shift para proporción
- **Cuadrícula visual**: Grid overlay configurable
- **Reglas**: Rulers con medidas en px o unidades SVG
- **Historial visual**: Timeline con previews de cambios

## Testing

Para verificar el funcionamiento:

1. **Cargar un SVG** con elementos
2. **Seleccionar un elemento** (click)
3. **Arrastrar**: Mover el elemento
4. **Resize**: Arrastrar handles en las esquinas/bordes
5. **Rotar**: Arrastrar el handle circular superior
6. **Snap**: Mover cerca de otros elementos o la cuadrícula

**Observar en consola**:
- Logs de transformación
- Coordenadas convertidas
- Estado del historial

## Archivos Creados/Modificados

### Nuevos archivos:
- `src/components/MoveableWrapper.jsx` - Componente Moveable
- `src/hooks/useMoveable.js` - Hook de integración
- `ARQUITECTURA_FASE3.md` (este archivo)

### Modificados:
- `src/components/SVGViewer.jsx` - Integración de MoveableWrapper

## Estado Completo del Sistema

**✅ Fase 1 - Geometría y Coordenadas** (Completada):
- CoordinateTransformer service
- @panzoom/panzoom integration
- useCoordinateTransformer hook

**✅ Fase 2 - PathDataProcessor** (Completada):
- PathDataProcessor service
- usePathDataProcessor hook
- PathDebugger component

**✅ Fase 3 - Manipulación Visual** (Completada):
- MoveableWrapper component
- useMoveable hook
- Integración con CoordinateTransformer
- Snapping a grid, guías y elementos
- Drag, Resize, Rotate profesionales

**📋 Próximas Fases**:
- **Fase 3.5**: Funcionalidades avanzadas (Groupable, Warpable)
- **Fase 4**: Atajos, grid visual, reglas, timeline

## Referencias

- **react-moveable**: https://github.com/daybrush/moveable
- **Moveable Docs**: https://daybrush.com/moveable/
- **SVG Transforms**: https://developer.mozilla.org/en-US/docs/Web/SVG/Attribute/transform
