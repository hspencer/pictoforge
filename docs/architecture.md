# Arquitectura de PictoForge

## Visión General

PictoForge es un editor SVG interactivo construido con React que permite manipulación directa de elementos gráficos con precisión visual y código.

## Problema Fundamental: Transformación de Coordenadas

El desafío principal en cualquier editor gráfico SVG es manejar múltiples sistemas de coordenadas:

```
┌─────────────────────────────────────────────────────────────┐
│  1. Coordenadas de Pantalla (Screen)                       │
│     - Píxeles del navegador (clientX, clientY)             │
│     - Donde el usuario hace click                          │
└─────────────────────────────────────────────────────────────┘
                            ↕
┌─────────────────────────────────────────────────────────────┐
│  2. Coordenadas del Viewport (Pan/Zoom)                     │
│     - Transformación aplicada por el usuario               │
│     - scale, translateX, translateY                        │
└─────────────────────────────────────────────────────────────┘
                            ↕
┌─────────────────────────────────────────────────────────────┐
│  3. Coordenadas SVG (viewBox)                               │
│     - Sistema de coordenadas del SVG original              │
│     - Donde se almacenan los datos de los elementos        │
└─────────────────────────────────────────────────────────────┘
```

## Solución: SVGWorld

`SVGWorld` es un objeto "mundo" centralizado que actúa como intermediario entre todos los sistemas de coordenadas.

### Ubicación
- **Clase**: `/src/services/SVGWorld.js`
- **Hook React**: `/src/hooks/useSVGWorld.js`

### Responsabilidades

1. **Transformación de Coordenadas**
   - `screenToSVG(x, y)` - Convierte pantalla → SVG
   - `svgToScreen(x, y)` - Convierte SVG → pantalla
   - `screenDeltaToSVGDelta(dx, dy)` - Convierte deltas para drag & drop

2. **Manipulación de Elementos**
   - `getElementBBox(element)` - Obtiene bounding box
   - `moveElement(element, dx, dy)` - Mueve elementos
   - `applyTransform(element, transform)` - Aplica transformaciones

3. **Estado del Mundo**
   - Mantiene referencia al elemento SVG
   - Sincroniza con el estado de pan/zoom
   - Proporciona API unificada

### Uso

```javascript
// En un componente React
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

// Convertir click de pantalla a coordenadas SVG
const handleClick = (e) => {
  const svgCoords = screenToSVG(e.clientX, e.clientY);
  console.log('Clicked at SVG coordinates:', svgCoords);
};
```

## Stack Tecnológico

### Core
- **React 19** - UI framework
- **SVG.js** - Manipulación SVG y transformaciones
- **@panzoom/panzoom** - Pan y zoom del viewport

### Manipulación de Elementos
- **react-moveable** - Drag, resize, rotate interactivo
- **Pathfinding personalizado** - Editor de nodos y curvas Bézier

### UI
- **Radix UI** - Componentes accesibles
- **Tailwind CSS** - Estilos
- **Lucide React** - Iconos

## Estructura de Componentes

```
App
├── Container (Layout principal)
│   ├── SVGViewer (Editor visual)
│   │   ├── usePanzoom (Pan/Zoom)
│   │   ├── useSVGWorld (Coordenadas) ⭐
│   │   ├── useMoveable (Manipulación)
│   │   ├── MoveableWrapper (Drag/Resize/Rotate)
│   │   ├── NodeEditor (Editor de nodos de path)
│   │   └── BoundingBox (Bounding box visual)
│   │
│   ├── Hierarchy (Árbol de elementos)
│   └── Properties (Panel de propiedades)
│
└── TextInput (Upload de archivos)
```

## Flujo de Datos

### 1. Carga de SVG
```
Usuario → TextInput → useSVGParser → svgData → SVGViewer
```

### 2. Selección de Elemento
```
Click → SVGViewer → screenToSVG → Identificar elemento → Actualizar estado
```

### 3. Manipulación
```
Drag → MoveableWrapper → SVGWorld.screenDeltaToSVGDelta →
Actualizar transform → Guardar en historial
```

## Sistema de Coordenadas Interno

`SVGWorld` usa `getScreenCTM()` del API nativa de SVG para obtener la matriz de transformación completa:

```javascript
// Obtener la matriz que convierte SVG → Screen
const ctm = svgElement.getScreenCTM();

// Convertir punto de pantalla a SVG
const svgPoint = svgElement.createSVGPoint();
svgPoint.x = screenX;
svgPoint.y = screenY;
const transformed = svgPoint.matrixTransform(ctm.inverse());
```

Esto garantiza precisión matemática incluso con transformaciones complejas.

## Próximos Pasos

### Refactorizaciones Pendientes
1. Migrar `NodeEditor` para usar `useSVGWorld` directamente
2. Migrar `BoundingBox` para usar `useSVGWorld` directamente
3. Remover funciones auxiliares duplicadas
4. Unificar `useCoordinateTransformer` con `useSVGWorld`

### Nuevas Funcionalidades
1. Editor de gradientes
2. Manipulación de máscaras y clips
3. Animaciones SVG
4. Export a formatos adicionales

## Referencias

- [SVG.js Documentation](https://svgjs.dev/)
- [SVG Coordinate Systems (MDN)](https://developer.mozilla.org/en-US/docs/Web/SVG/Tutorial/Positions)
- [getScreenCTM()](https://developer.mozilla.org/en-US/docs/Web/API/SVGGraphicsElement/getScreenCTM)
