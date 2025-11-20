import React, { useState } from 'react';
import { parsePathNodes } from '../utils/svgManipulation';

/**
 * Componente NodeEditor para la manipulación de nodos SVG
 * Ahora renderiza en el mismo espacio de coordenadas SVG que el pictograma
 *
 * IMPORTANTE: Aplica las transformaciones del elemento a los nodos para mostrarlos
 * en sus posiciones reales renderizadas usando getCTM() de la API nativa del DOM.
 */
export const NodeEditor = ({
  element,
  tool,
  onNodeChange,
  onNodeAdd,
  onNodeRemove,
  onNodeDragEnd,
  visible = true,
  viewBox, // ViewBox del SVG principal para calcular tamaños
  realZoom = 1, // Zoom real para mantener tamaño constante de handles
  screenDeltaToSVGDelta // Para convertir movimientos del mouse
}) => {
  const [selectedNodes, setSelectedNodes] = useState(new Set());
  const [hoveredNode, setHoveredNode] = useState(null);

  if (!visible || !element) {
    console.log('🔍 NodeEditor: No visible o no element', { visible, element });
    return null;
  }
  if (tool !== 'node' && tool !== 'pen') {
    console.log('🔍 NodeEditor: Tool incorrecto', { tool });
    return null;
  }

  // Solo funciona con elementos path
  if (element.tagName !== 'path' && element.tagName !== 'PATH') {
    console.log('🔍 NodeEditor: Elemento no es path', { tagName: element.tagName });
    return null;
  }

  // Obtener nodos del elemento
  const rawNodes = parsePathNodes(element.getAttribute('d') || '');
  console.log('🔍 NodeEditor: Parseando nodos', {
    elementId: element.id,
    pathData: element.getAttribute('d'),
    rawNodesCount: rawNodes.length
  });

  // Función helper para transformar un punto usando la matriz de transformación del elemento
  const transformPoint = (x, y) => {
    if (!element.ownerSVGElement) return { x, y };
    const svg = element.ownerSVGElement;
    const point = svg.createSVGPoint();
    point.x = x;
    point.y = y;

    // Obtener la matriz de transformación del elemento
    try {
      const ctm = element.getCTM();
      if (ctm) {
        const transformed = point.matrixTransform(ctm);
        return { x: transformed.x, y: transformed.y };
      }
    } catch (e) {
      console.warn('⚠️ No se pudo aplicar transformación a nodo:', e);
    }
    return { x, y };
  };

  // Logging de la matriz de transformación del elemento
  console.log(`  🔍 Verificando transformación de "${element.id}"...`);
  console.log(`    - ownerSVGElement:`, element.ownerSVGElement ? 'OK' : 'NULL');

  try {
    const ctm = element.getCTM();
    if (ctm) {
      console.log(`  🔄 Matriz CTM de "${element.id}":`, {
        a: ctm.a.toFixed(3), b: ctm.b.toFixed(3),
        c: ctm.c.toFixed(3), d: ctm.d.toFixed(3),
        e: ctm.e.toFixed(3), f: ctm.f.toFixed(3)
      });
      console.log(`    Interpretación: scale(${ctm.a.toFixed(2)}, ${ctm.d.toFixed(2)}) translate(${ctm.e.toFixed(1)}, ${ctm.f.toFixed(1)}) rotate(${(Math.atan2(ctm.b, ctm.a) * 180 / Math.PI).toFixed(1)}°)`);
    } else {
      console.log(`  ℹ️ getCTM() retornó null para "${element.id}"`);
    }
  } catch (e) {
    console.error(`  ❌ Error obteniendo CTM de "${element.id}":`, e);
  }

  // Transformar todos los nodos y sus puntos de control
  const nodes = rawNodes.map(node => {
    const transformedNode = { ...node };

    // Transformar posición principal
    const mainPos = transformPoint(node.x, node.y);
    transformedNode.x = mainPos.x;
    transformedNode.y = mainPos.y;

    // Transformar puntos de control si existen
    if (node.cp1) {
      const cp1Pos = transformPoint(node.cp1.x, node.cp1.y);
      transformedNode.cp1 = { x: cp1Pos.x, y: cp1Pos.y };
    }
    if (node.cp2) {
      const cp2Pos = transformPoint(node.cp2.x, node.cp2.y);
      transformedNode.cp2 = { x: cp2Pos.x, y: cp2Pos.y };
    }
    if (node.cp) {
      const cpPos = transformPoint(node.cp.x, node.cp.y);
      transformedNode.cp = { x: cpPos.x, y: cpPos.y };
    }

    return transformedNode;
  });

  // Calcular tamaño de handles en píxeles constantes (no escalan con zoom)
  // Target: 8 píxeles de pantalla para nodos principales
  const targetNodePixels = 8;
  const targetStrokePixels = 2.5; // Grosor de línea en píxeles (más visible)
  const handleSize = realZoom > 0 ? targetNodePixels / realZoom : 3;
  const handleStroke = realZoom > 0 ? targetStrokePixels / realZoom : 0.2;

  console.log(`  📏 Tamaño de handles: realZoom=${realZoom.toFixed(2)}, handleSize=${handleSize.toFixed(3)} unidades SVG, stroke=${handleStroke.toFixed(3)} unidades SVG`);

  const handleNodeClick = (e, node) => {
    e.stopPropagation();

    if (tool === 'pen') {
      // Cambiar tipo de nodo o eliminar
      if (e.ctrlKey || e.metaKey) {
        onNodeRemove?.(node);
      } else {
        // Ciclar entre tipos: line -> curve -> smooth -> line
        const nextType = node.type === 'line' ? 'curve' :
          node.type === 'curve' ? 'smooth' : 'line';
        onNodeChange?.(node, { ...node, type: nextType });
      }
    } else if (tool === 'node') {
      // Seleccionar nodo para mover
      const newSelected = new Set(selectedNodes);
      if (newSelected.has(node.id)) {
        newSelected.delete(node.id);
      } else {
        if (!e.shiftKey) newSelected.clear();
        newSelected.add(node.id);
      }
      setSelectedNodes(newSelected);
    }
  };

  const handleNodeDrag = (e, node) => {
    if (tool !== 'node') return;

    e.stopPropagation();
    const startScreenX = e.clientX;
    const startScreenY = e.clientY;
    const startNodeX = node.x;
    const startNodeY = node.y;

    const handleMouseMove = (e) => {
      // Calcular delta en pantalla
      const deltaScreenX = e.clientX - startScreenX;
      const deltaScreenY = e.clientY - startScreenY;

      // Convertir delta a coordenadas SVG usando la función inyectada
      const { dx, dy } = screenDeltaToSVGDelta
        ? screenDeltaToSVGDelta(deltaScreenX, deltaScreenY)
        : { dx: deltaScreenX, dy: deltaScreenY };

      const newNode = {
        ...node,
        x: startNodeX + dx,
        y: startNodeY + dy
      };

      // Si el nodo tiene puntos de control (curva Bézier), moverlos también
      if (node.cp1) {
        newNode.cp1 = {
          x: node.cp1.x + dx,
          y: node.cp1.y + dy
        };
      }
      if (node.cp2) {
        newNode.cp2 = {
          x: node.cp2.x + dx,
          y: node.cp2.y + dy
        };
      }

      onNodeChange?.(node, newNode);
    };

    const handleMouseUp = () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
      onNodeDragEnd?.();
    };

    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);
  };

  const handlePathClick = (e) => {
    if (tool !== 'pen') return;

    e.stopPropagation();

    // NOTA: Para agregar nodos en la posición del click,
    // necesitaríamos convertir coordenadas de pantalla a SVG.
    // Por ahora, esta funcionalidad queda pendiente.
    console.log('⚠️ Pen tool click - funcionalidad pendiente');
  };

  const renderNodes = () => {
    if (!element || element.tagName !== 'path') return null;

    if (nodes.length > 0) {
      console.log('🔍 NodeEditor Debug (SVG coords):', {
        elementId: element.id,
        totalNodes: nodes.length,
        firstNode: nodes[0] ? { x: nodes[0].x, y: nodes[0].y } : null,
        viewBox: viewBox ? { width: viewBox.width, height: viewBox.height } : null,
        handleSize
      });
    }

    return nodes.map((node, index) => {
      // Ahora usamos coordenadas SVG directamente, sin conversión
      return (
        <g key={node.id}>
          {/* Líneas auxiliares a los handles de control Bézier */}
          {node.cp1 && (
            <line
              x1={node.x}
              y1={node.y}
              x2={node.cp1.x}
              y2={node.cp1.y}
              stroke="#3b82f6"
              strokeWidth={handleStroke}
              strokeDasharray="3,3"
              vectorEffect="non-scaling-stroke"
              opacity={0.7}
            />
          )}
          {node.cp2 && (
            <line
              x1={node.x}
              y1={node.y}
              x2={node.cp2.x}
              y2={node.cp2.y}
              stroke="#3b82f6"
              strokeWidth={handleStroke}
              strokeDasharray="3,3"
              vectorEffect="non-scaling-stroke"
              opacity={0.7}
            />
          )}
          {node.cp && ( // Quadratic
            <line
              x1={node.x}
              y1={node.y}
              x2={node.cp.x}
              y2={node.cp.y}
              stroke="#3b82f6"
              strokeWidth={handleStroke}
              strokeDasharray="3,3"
              vectorEffect="non-scaling-stroke"
              opacity={0.7}
            />
          )}

          {/* Handles de control (Bezier) */}
          {node.cp1 && (
            <circle
              cx={node.cp1.x}
              cy={node.cp1.y}
              r={handleSize * 0.4}
              fill="white"
              stroke="#3b82f6"
              strokeWidth={handleStroke}
              vectorEffect="non-scaling-stroke"
              className="cursor-pointer hover:fill-blue-100"
              style={{ pointerEvents: 'all' }}
            />
          )}
          {node.cp2 && (
            <circle
              cx={node.cp2.x}
              cy={node.cp2.y}
              r={handleSize * 0.4}
              fill="white"
              stroke="#3b82f6"
              strokeWidth={handleStroke}
              vectorEffect="non-scaling-stroke"
              className="cursor-pointer hover:fill-blue-100"
              style={{ pointerEvents: 'all' }}
            />
          )}
          {node.cp && ( // Quadratic
            <circle
              cx={node.cp.x}
              cy={node.cp.y}
              r={handleSize * 0.4}
              fill="white"
              stroke="#3b82f6"
              strokeWidth={handleStroke}
              vectorEffect="non-scaling-stroke"
              className="cursor-pointer hover:fill-blue-100"
              style={{ pointerEvents: 'all' }}
            />
          )}

          {/* Nodo principal */}
          <circle
            cx={node.x}
            cy={node.y}
            r={handleSize * 0.5}
            fill="white"
            stroke="#3b82f6"
            strokeWidth={handleStroke * 1.5}
            vectorEffect="non-scaling-stroke"
            className="cursor-move"
            style={{ pointerEvents: 'all' }}
            onMouseDown={(e) => handleNodeDrag(e, node)}
          />
        </g>
      );
    });
  };

  return (
    <g className="node-editor">
      {/* Overlay invisible para detectar clicks en el path */}
      {tool === 'pen' && (
        <path
          d={element.getAttribute('d')}
          className="svg-path-overlay"
          fill="none"
          stroke="transparent"
          strokeWidth="10"
          onClick={handlePathClick}
          style={{ cursor: 'crosshair' }}
        />
      )}

      {/* Renderizar nodos */}
      {renderNodes()}
    </g>
  );
};

export default NodeEditor;
