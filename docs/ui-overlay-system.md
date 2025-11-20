# Sistema de Overlay de UI

> **Nota (2025-01)**: Los componentes `BoundingBox.jsx`, `BezierHandleEditor.jsx` y `MoveableWrapper.jsx` mencionados en este documento fueron consolidados como implementaciones inline en `SVGViewer.jsx` para mantener consistencia en el uso de `SVGWorld`. Las funcionalidades descritas aquí siguen siendo válidas pero ahora se encuentran integradas directamente en el visor.

## Concepto: Dos Capas de Renderizado

PictoForge utiliza un sistema de **dos capas** para separar el contenido SVG del usuario de los controles de la interfaz:

```
┌────────────────────────────────────────┐
│  CAPA 1: SVG Content Layer            │
│  • Contenido del usuario               │
│  • Escala con zoom                     │
│  • Transform aplicado por panzoom      │
│  • Coordenadas: SVG viewBox            │
└────────────────────────────────────────┘
              ↓
┌────────────────────────────────────────┐
│  SVGWorld (Transformaciones)           │
│  screenToSVG() / svgToScreen()         │
└────────────────────────────────────────┘
              ↓
┌────────────────────────────────────────┐
│  CAPA 2: UI Overlay Layer              │
│  • Controles de edición                │
│  • NO escala con zoom                  │
│  • Tamaño constante en pantalla        │
│  • Coordenadas: Screen pixels          │
│  • Posición calculada desde SVG        │
└────────────────────────────────────────┘
```

## Elementos de UI que NO deben escalar

### 1. BoundingBox
**Componente**: `/src/components/BoundingBox.jsx`

```jsx
// Posición en coordenadas SVG
const bbox = element.getBBox(); // { x, y, width, height } en SVG

// Convertir esquinas a pantalla para renderizar
const topLeft = svgWorld.svgToScreen(bbox.x, bbox.y);
const bottomRight = svgWorld.svgToScreen(
  bbox.x + bbox.width,
  bbox.y + bbox.height
);

// Renderizar en capa de UI con tamaño constante
<div
  className="bounding-box"
  style={{
    left: topLeft.x,
    top: topLeft.y,
    width: bottomRight.x - topLeft.x,
    height: bottomRight.y - topLeft.y
  }}
>
  {/* Handles con tamaño constante */}
  <div className="bounding-box__handle bounding-box__handle--nw" />
  <div className="bounding-box__handle bounding-box__handle--ne" />
  {/* ... más handles */}
</div>
```

**Clases CSS**:
```scss
// src/styles/ui-overlay.scss

.bounding-box {
  position: absolute;
  border: 2px solid var(--color-primary);
  pointer-events: none;

  &__handle {
    position: absolute;
    width: 8px;        // ← Tamaño constante
    height: 8px;       // ← No escala con zoom
    background: white;
    border: 2px solid var(--color-primary);
    pointer-events: all;
    cursor: pointer;

    // Posiciones de handles
    &--nw { top: -4px; left: -4px; cursor: nw-resize; }
    &--ne { top: -4px; right: -4px; cursor: ne-resize; }
    &--sw { bottom: -4px; left: -4px; cursor: sw-resize; }
    &--se { bottom: -4px; right: -4px; cursor: se-resize; }
    // ... más posiciones
  }

  &__rotation-handle {
    width: 12px;
    height: 12px;
    border-radius: 50%;
    background: var(--color-primary);
    cursor: grab;
  }
}
```

### 2. NodeEditor (Nodos de Path)
**Componente**: `/src/components/NodeEditor.jsx`

```jsx
// Obtener nodos del path en coordenadas SVG
const nodes = parsePathNodes(pathData); // [{ x, y, type, ... }]

// Convertir cada nodo a pantalla
const screenNodes = nodes.map(node => {
  const screen = svgWorld.svgToScreen(node.x, node.y);
  return {
    ...node,
    screenX: screen.x,
    screenY: screen.y
  };
});

// Renderizar en overlay con tamaño constante
return (
  <svg className="node-editor-overlay" /* ... */>
    {screenNodes.map(node => (
      <g key={node.id}>
        {/* Líneas de control */}
        {node.cp1 && (
          <line
            className="node-editor__control-line"
            x1={node.screenX}
            y1={node.screenY}
            x2={node.cp1.screenX}
            y2={node.cp1.screenY}
          />
        )}

        {/* Nodo principal */}
        <circle
          className={`node-editor__node node-editor__node--${node.type}`}
          cx={node.screenX}
          cy={node.screenY}
          r={6}  // ← Tamaño constante en píxeles
        />

        {/* Handle de control Bézier */}
        {node.cp1 && (
          <circle
            className="node-editor__control-point"
            cx={node.cp1.screenX}
            cy={node.cp1.screenY}
            r={4}  // ← Tamaño constante
          />
        )}
      </g>
    ))}
  </svg>
);
```

**Clases CSS**:
```scss
// src/styles/node-editor.scss

.node-editor-overlay {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  pointer-events: none;
  z-index: 100;
}

.node-editor {
  &__control-line {
    stroke: var(--color-control-line);
    stroke-width: 1px;        // ← Grosor constante
    stroke-dasharray: 4, 4;
    pointer-events: none;
  }

  &__node {
    fill: white;
    stroke: var(--color-primary);
    stroke-width: 2px;        // ← Grosor constante
    cursor: move;
    pointer-events: all;

    &:hover {
      fill: var(--color-primary-light);
      stroke-width: 3px;
    }

    &--selected {
      fill: var(--color-primary);
      stroke: var(--color-primary-dark);
      stroke-width: 3px;
    }

    // Tipos de nodo
    &--line { /* nodo de línea */ }
    &--curve {
      fill: var(--color-curve);
    }
    &--smooth {
      fill: var(--color-smooth);
    }
  }

  &__control-point {
    fill: var(--color-bezier-handle);
    stroke: var(--color-primary);
    stroke-width: 2px;
    cursor: move;
    pointer-events: all;

    &:hover {
      fill: var(--color-bezier-handle-hover);
      r: 5px; // Puede crecer en hover
    }
  }
}
```

### 3. MoveableWrapper
**Componente**: `/src/components/MoveableWrapper.jsx`

Los controles de Moveable ya se renderizan correctamente en la capa de UI, pero podemos estilizarlos:

```scss
// src/styles/moveable.scss

.moveable-control-box {
  .moveable-line {
    stroke-width: 1px !important;  // ← Grosor constante
  }

  .moveable-control {
    width: 8px !important;         // ← Tamaño constante
    height: 8px !important;
    border-width: 2px !important;
  }

  .moveable-rotation {
    width: 12px !important;
    height: 12px !important;
  }
}
```

## Estructura de Archivos Recomendada

```
src/
├── styles/
│   ├── ui-overlay.scss          # Estilos base de overlay
│   ├── bounding-box.scss        # Estilos del BoundingBox
│   ├── node-editor.scss         # Estilos de NodeEditor
│   ├── moveable.scss            # Override de Moveable
│   └── variables.scss           # Variables de color/tamaño
├── components/
│   ├── BoundingBox.jsx          # ← Actualizar para usar clases
│   ├── NodeEditor.jsx           # ← Actualizar para usar clases
│   └── MoveableWrapper.jsx      # ← Verificar clases
```

## Sistema de Nombrado BEM

```scss
// Bloque
.bounding-box { }
.node-editor { }

// Elemento
.bounding-box__handle { }
.bounding-box__rotation-handle { }
.node-editor__node { }
.node-editor__control-point { }

// Modificador
.bounding-box__handle--nw { }
.bounding-box__handle--selected { }
.node-editor__node--line { }
.node-editor__node--curve { }
.node-editor__node--selected { }
```

## Variables CSS Recomendadas

```scss
// src/styles/variables.scss

:root {
  // Colores primarios
  --color-primary: #3b82f6;
  --color-primary-light: #60a5fa;
  --color-primary-dark: #2563eb;

  // Colores de UI
  --color-control-line: #94a3b8;
  --color-curve: #10b981;
  --color-smooth: #f59e0b;
  --color-bezier-handle: #ec4899;
  --color-bezier-handle-hover: #f472b6;

  // Tamaños (constantes en pantalla)
  --ui-handle-size: 8px;
  --ui-handle-border: 2px;
  --ui-node-size: 6px;
  --ui-node-border: 2px;
  --ui-control-point-size: 4px;
  --ui-line-width: 1px;

  // Z-index layers
  --z-svg-content: 1;
  --z-ui-overlay: 100;
  --z-moveable: 200;
}
```

## Ejemplo Completo: Actualización de NodeEditor

```jsx
// src/components/NodeEditor.jsx
import React from 'react';
import { parsePathNodes } from '../utils/svgManipulation';
import '../styles/node-editor.scss';

export const NodeEditor = ({
  element,
  tool,
  visible,
  svgWorld, // ← Recibe svgWorld como prop
  onNodeChange,
  onNodeAdd,
  onNodeRemove
}) => {
  if (!visible || !element) return null;
  if (tool !== 'node' && tool !== 'pen') return null;

  // Parsear nodos del path
  const pathData = element.getAttribute('d');
  const nodes = parsePathNodes(pathData);

  // Convertir nodos a coordenadas de pantalla
  const screenNodes = nodes.map(node => {
    const screen = svgWorld.svgToScreen(node.x, node.y);
    const screenNode = {
      ...node,
      screenX: screen.x,
      screenY: screen.y
    };

    // Convertir puntos de control si existen
    if (node.cp1) {
      const cp1Screen = svgWorld.svgToScreen(node.cp1.x, node.cp1.y);
      screenNode.cp1Screen = cp1Screen;
    }
    if (node.cp2) {
      const cp2Screen = svgWorld.svgToScreen(node.cp2.x, node.cp2.y);
      screenNode.cp2Screen = cp2Screen;
    }

    return screenNode;
  });

  const handleNodeDrag = (e, node) => {
    // Implementar drag con screenDeltaToSVGDelta
  };

  return (
    <svg className="node-editor-overlay">
      <g className="node-editor">
        {screenNodes.map(node => (
          <g key={node.id}>
            {/* Línea de control */}
            {node.cp1Screen && (
              <line
                className="node-editor__control-line"
                x1={node.screenX}
                y1={node.screenY}
                x2={node.cp1Screen.x}
                y2={node.cp1Screen.y}
              />
            )}

            {/* Punto de control Bézier */}
            {node.cp1Screen && (
              <circle
                className="node-editor__control-point"
                cx={node.cp1Screen.x}
                cy={node.cp1Screen.y}
                r="4"
              />
            )}

            {/* Nodo principal */}
            <circle
              className={`node-editor__node node-editor__node--${node.type}`}
              cx={node.screenX}
              cy={node.screenY}
              r="6"
              onMouseDown={(e) => handleNodeDrag(e, node)}
            />
          </g>
        ))}
      </g>
    </svg>
  );
};
```

## Próximos Pasos

1. ✅ Crear archivos SCSS para cada componente de UI
2. ✅ Actualizar BoundingBox para usar clases CSS
3. ✅ Actualizar NodeEditor para usar svgWorld y clases CSS
4. ✅ Agregar variables CSS para colores y tamaños
5. ✅ Actualizar ascii-divmap.md con IDs y clases definitivas
6. ✅ Documentar convenciones de nombrado

Usa el `ascii-divmap.md` como mapa para pedirme cambios específicos en cada componente.
