# Arquitectura Fase 2: Servicio PathDataProcessor

## Resumen

Se ha implementado el **PathDataProcessor**, un servicio centralizado para manipulación de paths SVG usando la librería `svg-pathdata`. Este servicio proporciona acceso directo a puntos de control Bézier (C1, C2, Q1) y puntos de anclaje, permitiendo edición precisa de curvas.

## Componentes Implementados

### 1. PathDataProcessor Service (`src/services/PathDataProcessor.js`)

**Propósito**: Centralizar toda la manipulación de paths SVG mediante parsing y transformación del atributo `d`.

**Características principales**:
- ✅ Parser de cadena 'd' a AST (Abstract Syntax Tree)
- ✅ Normalización a comandos absolutos (mayúsculas)
- ✅ Acceso directo a puntos de control y anclaje
- ✅ Modificación de segmentos Bézier
- ✅ Regeneración de comandos Path
- ✅ Utilidades geométricas (inversión, cálculos)

**API Principal**:

```javascript
class PathDataProcessor {
  // Parsing y configuración
  parse(pathString)          // Parsea cadena 'd' a AST
  normalize()                 // Convierte a comandos absolutos

  // Análisis estructural
  getSegments()              // Array de segmentos con info detallada
  getAnchorPoints()          // Array de puntos de anclaje
  getControlPoints()         // Array de puntos de control (C1, C2, Q1)

  // Modificación de puntos (FUNCIONES CRÍTICAS)
  updateAnchorPoint(index, { x, y })
  updateControlPoint(index, 'C1'|'C2'|'Q1', { x, y })

  // Utilidades geométricas
  reverse()                   // Invierte dirección del path

  // Conversión
  toString()                  // Regenera cadena 'd'
  toCommandStrings()         // Array de comandos legibles

  // Utilidades
  getDebugInfo()
  clone()
  clear()
}
```

#### Tipos de Comandos Soportados

El servicio reconoce y maneja todos los comandos SVG Path:

| Comando | Tipo | Puntos de Control |
|---------|------|-------------------|
| M | Move To | Punto de anclaje |
| L | Line To | Punto de anclaje |
| H | Horizontal Line | Punto de anclaje (x) |
| V | Vertical Line | Punto de anclaje (y) |
| **C** | **Cubic Bézier** | **C1, C2 + Anclaje** |
| **S** | **Smooth Cubic** | **C2 + Anclaje** |
| **Q** | **Quadratic Bézier** | **Q1 + Anclaje** |
| **T** | **Smooth Quadratic** | **Anclaje** |
| A | Arc | Radios, rotación, flags + Anclaje |
| Z | Close Path | Cierra al punto inicial |

#### Ejemplo de Uso del Servicio

```javascript
import { createPathDataProcessor } from './services/PathDataProcessor';

// Parsear un path
const processor = createPathDataProcessor('M 10,10 C 20,20 40,20 50,10');

// Normalizar a comandos absolutos
processor.normalize();

// Obtener segmentos con puntos de control
const segments = processor.getSegments();
/*
[
  { index: 0, type: 'M', command: 'M - Move To',
    points: [{ x: 10, y: 10, type: 'anchor' }],
    controlPoints: [] },
  { index: 1, type: 'C', command: 'C - Cubic Bézier',
    points: [{ x: 50, y: 10, type: 'anchor' }],
    controlPoints: [
      { x: 20, y: 20, type: 'C1', label: 'Control 1' },
      { x: 40, y: 20, type: 'C2', label: 'Control 2' }
    ]
  }
]
*/

// Modificar punto de control C1
processor.updateControlPoint(1, 'C1', { x: 25, y: 25 });

// Regenerar cadena 'd'
const newPathString = processor.toString();
// 'M10 10C25 25 40 20 50 10'
```

### 2. usePathDataProcessor Hook (`src/hooks/usePathDataProcessor.js`)

**Propósito**: Hook React que integra el PathDataProcessor con el ciclo de vida de React.

**API**:

```javascript
const {
  // Estado
  isReady,
  processor,
  segments,
  anchorPoints,
  controlPoints,
  pathString,

  // Transformaciones
  normalize,
  reverse,

  // Modificación
  updateAnchorPoint,
  updateControlPoint,

  // Conversión
  toString,
  toCommandStrings,

  // Utilidades
  parse,
  clone,
  clear,
  getDebugInfo
} = usePathDataProcessor({
  pathString,
  autoNormalize: true
});
```

**Características**:
- Estado reactivo de segmentos, puntos de anclaje y control
- Normalización automática opcional
- Actualización automática cuando cambia el pathString
- Sincronización con el DOM

### 3. PathDebugger Component (`src/components/PathDebugger.jsx`)

**Propósito**: Componente de demostración que visualiza información detallada del path seleccionado.

**Características**:
- 📊 Muestra estadísticas del path (comandos, segmentos, puntos)
- 🔍 Lista todos los segmentos con sus puntos de control
- 🔄 Botones de acción: Normalizar, Invertir, Ver comandos
- 📝 Muestra la cadena 'd' procesada
- 🎨 Integrado en el StylePanel para elementos `<path>`

**Interfaz visual**:

```
┌─────────────────────────────────┐
│ Path Debugger          [🔧][↻][<>] │
├─────────────────────────────────┤
│ ID: path-123     Comandos: 8    │
│ Segmentos: 7     Normalizado: Sí│
├─────────────────────────────────┤
│ Puntos                          │
│ ┌──────────┬──────────┐        │
│ │ Anclaje  │ Control  │        │
│ │    12    │    8     │        │
│ └──────────┴──────────┘        │
├─────────────────────────────────┤
│ Segmentos con puntos de control│
│ ┌─────────────────────────────┐│
│ │ #1 C - Cubic Bézier        ││
│ │ Puntos de anclaje:         ││
│ │   (50.00, 10.00)           ││
│ │ Puntos de control:         ││
│ │   Control 1: (20.00, 20.00)││
│ │   Control 2: (40.00, 20.00)││
│ └─────────────────────────────┘│
└─────────────────────────────────┘
```

### 4. Integración en StylePanel

El `PathDebugger` se muestra automáticamente en el StylePanel cuando:
1. Se selecciona un elemento
2. El elemento es de tipo `<path>`
3. El elemento tiene el atributo `d`

**Código de integración**:

```jsx
{/* PathDebugger - Solo para elementos <path> */}
{selectedElement.tagName === 'path' && selectedElement.element && (
  <PathDebugger pathElement={selectedElement.element} />
)}
```

## Flujo de Datos

```
Usuario selecciona elemento <path>
         ↓
selectedElement.element se pasa a PathDebugger
         ↓
PathDebugger extrae atributo 'd'
         ↓
usePathDataProcessor parsea y normaliza
         ↓
PathDataProcessor genera AST
         ↓
Estado reactivo actualizado: segments, anchorPoints, controlPoints
         ↓
UI muestra información detallada y permite modificaciones
         ↓
Modificaciones actualizan el AST
         ↓
toString() regenera cadena 'd'
         ↓
SVG actualizado en el DOM
```

## Estructura de Datos

### Segmento (Segment)

```javascript
{
  index: 1,
  type: SVGPathData.CURVE_TO,
  command: 'C - Cubic Bézier',
  startPoint: { x: 10, y: 10 },
  endPoint: { x: 50, y: 10 },
  points: [
    { x: 50, y: 10, type: 'anchor' }
  ],
  controlPoints: [
    { x: 20, y: 20, type: 'C1', label: 'Control 1' },
    { x: 40, y: 20, type: 'C2', label: 'Control 2' }
  ]
}
```

### Punto de Anclaje (Anchor Point)

```javascript
{
  x: 50,
  y: 10,
  segmentIndex: 1,
  segmentType: 'C - Cubic Bézier'
}
```

### Punto de Control (Control Point)

```javascript
{
  x: 20,
  y: 20,
  type: 'C1',
  label: 'Control 1',
  segmentIndex: 1,
  segmentType: 'C - Cubic Bézier'
}
```

## Casos de Uso

### 1. Inspeccionar un Path Complejo

```javascript
const processor = createPathDataProcessor(complexPathString);
processor.normalize();

const debugInfo = processor.getDebugInfo();
console.log(`Path tiene ${debugInfo.commandCount} comandos`);
console.log(`Tipos: ${debugInfo.commands.join(', ')}`);
```

### 2. Modificar una Curva Bézier

```javascript
// Obtener el punto de control C1 del segundo segmento
const controlPoints = processor.getControlPoints();
const c1 = controlPoints.find(p => p.segmentIndex === 1 && p.type === 'C1');

// Modificar posición
processor.updateControlPoint(1, 'C1', { x: c1.x + 10, y: c1.y - 5 });

// Regenerar path
const newPathString = processor.toString();
pathElement.setAttribute('d', newPathString);
```

### 3. Invertir Dirección de un Path

```javascript
processor.reverse();
const reversedPath = processor.toString();
// El path ahora dibuja en dirección contraria
```

### 4. Extraer Todos los Puntos de un Path

```javascript
const anchors = processor.getAnchorPoints();
const controls = processor.getControlPoints();

// Dibujar handles visuales para cada punto
anchors.forEach(point => {
  drawCircle(point.x, point.y, 3, 'blue');
});
controls.forEach(point => {
  drawCircle(point.x, point.y, 2, 'red');
});
```

## Ventajas de la Arquitectura

### 1. Abstracción Completa
- El código de UI no necesita conocer la sintaxis de comandos SVG
- Acceso uniforme a puntos sin importar el tipo de comando

### 2. Seguridad de Tipos
- Estructuras de datos bien definidas
- Validación automática en el parser

### 3. Edición Precisa
- Acceso directo a puntos de control individuales
- Modificación granular sin regenerar todo el path

### 4. Performance
- AST se genera una vez
- Modificaciones son operaciones en memoria
- Regeneración solo cuando se necesita

### 5. Extensible
- Fácil agregar nuevos tipos de transformaciones
- Plugins para análisis geométrico avanzado

## Testing y Debugging

Para verificar el funcionamiento:

1. **Cargar un SVG con paths**
2. **Seleccionar un elemento `<path>`**
3. **Observar el PathDebugger** en el panel derecho
4. **Hacer click en "Normalizar"** - Los comandos se convierten a absolutos
5. **Hacer click en "Invertir"** - El path se dibuja al revés
6. **Inspeccionar segmentos** - Ver puntos de control detallados

**Logs de consola**:
```javascript
📊 PathDebugger Info: {
  commandCount: 12,
  isNormalized: true,
  segments: 11,
  anchorPoints: 12,
  controlPoints: 8,
  commands: ['M - Move To', 'C - Cubic Bézier', ...]
}
```

## Próximos Pasos (Futuras Fases)

### Fase 3: Componentes de Interacción Visual
- **Edición visual de puntos**: Arrastrar puntos de control directamente en el canvas
- **Integrar react-moveable**: Para manipulación visual avanzada
- **Handles visuales**: Círculos arrastrables para C1, C2, Q1
- **Líneas de control**: Conectar anclajes con controles

### Fase 4: Operaciones Geométricas Avanzadas
- **Interpolación de paths**: Morphing entre dos paths
- **Simplificación**: Reducir número de puntos manteniendo forma
- **Suavizado**: Optimizar curvas Bézier
- **Conversión**: Arcos a Bézier, líneas a curvas, etc.

## Archivos Creados/Modificados

### Nuevos archivos:
- `src/services/PathDataProcessor.js` - Servicio principal
- `src/hooks/usePathDataProcessor.js` - Hook React
- `src/components/PathDebugger.jsx` - Componente de debug
- `ARQUITECTURA_FASE2.md` (este archivo)

### Modificados:
- `src/components/StylePanel.jsx` - Integración de PathDebugger

## Estado del Sistema

✅ **Completado - Fase 2**:
- [x] Servicio PathDataProcessor base
- [x] Normalización a comandos absolutos
- [x] Acceso a puntos de control Bézier (C1, C2, Q1)
- [x] Modificación de puntos
- [x] Inversión de paths
- [x] Hook React usePathDataProcessor
- [x] Componente PathDebugger
- [x] Integración en StylePanel

✅ **Completado - Fase 1** (Prerequisito):
- [x] CoordinateTransformer
- [x] @panzoom/panzoom integration
- [x] Estado reactivo de transformaciones

🔄 **En progreso**:
- Testing con paths complejos del mundo real
- Validación de edge cases

📋 **Pendiente**:
- Fase 3: Edición visual interactiva de puntos
- Fase 4: Operaciones geométricas avanzadas

## Referencias

- **svg-pathdata**: https://github.com/nfroidure/SVGPathData
- **SVG Path Spec**: https://www.w3.org/TR/SVG/paths.html
- **Bézier Curves**: https://pomax.github.io/bezierinfo/
