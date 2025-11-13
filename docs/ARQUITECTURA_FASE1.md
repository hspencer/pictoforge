# Arquitectura Fase 1: Servicios Centrales de Geometría y Coordenadas

## Resumen

Se ha implementado una arquitectura basada en servicios de geometría y coordenadas, utilizando las librerías especializadas:
- **@panzoom/panzoom**: Control de zoom y pan del canvas SVG
- **CoordinateTransformer**: Servicio centralizado de transformación de coordenadas
- **svg.js, svg-pathdata, react-moveable**: Preparados para las próximas fases

## Componentes Implementados

### 1. CoordinateTransformer Service (`src/services/CoordinateTransformer.js`)

**Propósito**: Encapsular toda la lógica de conversión de coordenadas entre espacios de coordenadas.

**Espacios de coordenadas soportados**:
- **Screen Space**: Coordenadas del navegador relativas a la ventana
- **Client Space**: Coordenadas relativas al contenedor SVG
- **SVG User Space**: Coordenadas del sistema de coordenadas del viewBox del SVG

**API Principal**:

```javascript
class CoordinateTransformer {
  // Configuración
  setSvgElement(svgElement)
  updatePanzoomState(state)
  updateViewBox()
  updateContainerDimensions()

  // Transformaciones (FUNCIÓN CRÍTICA)
  screenToSvg(screenX, screenY) → { x, y }
  svgToScreen(svgX, svgY) → { x, y }
  screenDeltaToSvgDelta(deltaX, deltaY) → { dx, dy }

  // Utilidades
  getDebugInfo()
  reset()
}
```

**Fórmula de transformación inversa** (screenToSvg):
```
1. clientCoords = screenCoords - containerRect
2. transformedCoords = (clientCoords - panTranslation) / scale
3. svgCoords = viewBoxOrigin + (transformedCoords / containerSize) * viewBoxSize
```

### 2. usePanzoom Hook (`src/hooks/usePanzoom.js`)

**Propósito**: Hook React para integrar @panzoom/panzoom con el ciclo de vida de React.

**API**:
```javascript
const {
  panzoomState,      // { scale, x, y }
  isReady,
  zoomIn,
  zoomOut,
  zoom,
  pan,
  reset,
  center,
  getScale,
  getPan
} = usePanzoom({ elementRef, panzoomOptions })
```

**Características**:
- Estado reactivo del zoom y pan
- Control programático del zoom/pan
- Soporte para zoom con rueda del mouse
- Limpieza automática en unmount

### 3. useCoordinateTransformer Hook (`src/hooks/useCoordinateTransformer.js`)

**Propósito**: Hook React para integrar el CoordinateTransformer con React.

**API**:
```javascript
const {
  isReady,
  transformer,
  screenToSvg,
  svgToScreen,
  screenDeltaToSvgDelta,
  updateViewBox,
  updateDimensions,
  reset,
  getDebugInfo
} = useCoordinateTransformer({ svgRef, panzoomState })
```

**Características**:
- Sincronización automática con el estado de panzoom
- Actualización reactiva del viewBox cuando cambia el SVG
- Actualización de dimensiones en resize
- Acceso directo a las transformaciones

### 4. Integración en SVGViewer (`src/components/SVGViewer.jsx`)

**Cambios realizados**:

1. **Importaciones**:
```javascript
import usePanzoom from '../hooks/usePanzoom';
import useCoordinateTransformer from '../hooks/useCoordinateTransformer';
```

2. **Inicialización**:
```javascript
// Sistema de zoom y pan
const { panzoomState, zoomIn, zoomOut, reset } = usePanzoom({
  elementRef: svgContainerRef,
  panzoomOptions: {
    maxScale: 10,
    minScale: 0.1,
    step: 0.3,
    startScale: 1,
    canvas: true,
  },
});

// Sistema de transformación de coordenadas
const {
  screenToSvg,
  svgToScreen,
  screenDeltaToSvgDelta,
  updateViewBox,
  isReady: isTransformerReady,
} = useCoordinateTransformer({
  svgRef: svgContainerRef,
  panzoomState,
});
```

3. **Estructura HTML actualizada**:
```jsx
{/* Panzoom aplica transformación automáticamente */}
<div
  ref={svgContainerRef}
  className="svg-panzoom-container"
  style={{
    transformOrigin: '0 0',
    touchAction: 'none',
  }}
>
  <div ref={svgRef} className="svg-container" onClick={handleElementClick}>
    <div dangerouslySetInnerHTML={{ __html: svgContent }} />
  </div>
</div>
```

4. **Debug de transformación**:
```javascript
const handleElementClick = (event) => {
  const screenCoords = { x: event.clientX, y: event.clientY };
  const svgCoords = screenToSvg(screenCoords.x, screenCoords.y);
  console.log('🖱️ Click:', { screenCoords, svgCoords, panzoomState });
};
```

## Flujo de Datos

```
Usuario interactúa con el canvas
         ↓
@panzoom/panzoom actualiza transformación
         ↓
panzoomState se actualiza reactivamente
         ↓
useCoordinateTransformer recibe nuevo estado
         ↓
CoordinateTransformer tiene estado actualizado
         ↓
Conversiones screenToSvg/svgToScreen están listas
```

## Ventajas de la Arquitectura

### 1. Separación de Responsabilidades
- **Panzoom**: Solo maneja zoom y pan
- **CoordinateTransformer**: Solo maneja conversiones de coordenadas
- **Hooks**: Solo adaptan servicios al ciclo de vida de React

### 2. Testeable
- Servicios son clases JavaScript puras sin dependencias de React
- Fácil de probar unitariamente
- Mock de dependencias simplificado

### 3. Reutilizable
- CoordinateTransformer puede usarse fuera de React
- Hooks pueden compartirse entre componentes
- Configuración flexible

### 4. Escalable
- Fácil agregar nuevas transformaciones
- Fácil agregar soporte para otros espacios de coordenadas
- Preparado para integrar más servicios de geometría

## Próximos Pasos (Futuras Fases)

### Fase 2: Servicios de Geometría SVG
- Integrar **svg.js** para manipulación de elementos
- Servicio de operaciones geométricas (intersección, unión, diferencia)
- Servicio de path manipulation con **svg-pathdata**

### Fase 3: Componentes de Interacción
- Integrar **react-moveable** para manipulación visual
- Handles de transformación (move, scale, rotate)
- Snap to grid y guías inteligentes

### Fase 4: Gestos y Selección Avanzada
- Multi-selección
- Lasso selection
- Gestos táctiles

## Debugging

Para verificar que el sistema funciona correctamente, abrir la consola del navegador y:

1. Hacer zoom in/out con la rueda del mouse
2. Hacer pan arrastrando el canvas
3. Hacer click en elementos del SVG
4. Observar los logs en consola:

```
🖱️ Click en elemento: {
  screenCoords: { x: 500, y: 300 },
  svgCoords: { x: 45.2, y: 23.8 },
  panzoomState: { scale: 1.5, x: 100, y: 50 },
  transformerReady: true
}
```

## Archivos Creados/Modificados

### Nuevos archivos:
- `src/services/CoordinateTransformer.js`
- `src/hooks/usePanzoom.js`
- `src/hooks/useCoordinateTransformer.js`
- `ARQUITECTURA_FASE1.md` (este archivo)

### Modificados:
- `src/components/SVGViewer.jsx`
- `package.json` (nuevas dependencias)

## Dependencias Instaladas

```json
{
  "@panzoom/panzoom": "^4.5.1",
  "svg.js": "^3.2.4",
  "svg-pathdata": "^6.0.3",
  "react-moveable": "^0.56.0"
}
```

## Estado del Sistema

✅ **Completado - Fase 1**:
- [x] Instalación de dependencias
- [x] Servicio CoordinateTransformer
- [x] Hook usePanzoom
- [x] Hook useCoordinateTransformer
- [x] Integración en SVGViewer
- [x] Estado reactivo panzoom ↔ transformer
- [x] Debug logs de transformación

🔄 **En progreso**:
- Validación con diferentes SVGs
- Ajustes finos de performance

📋 **Pendiente**:
- Fase 2: Servicios de geometría SVG
- Fase 3: Componentes de interacción
- Fase 4: Gestos avanzados
