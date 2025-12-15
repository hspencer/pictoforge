import React, { useState } from 'react';
import {
  parsePathNodes,
  findClosestPointOnPath,
  splitPathAtSegment,
  removeNodeFromPath
} from '../utils/svgManipulation';

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
  onNodeRemove, // Deprecated in favor of internal handling + onPathChange
  onPathChange,
  onNodeDragEnd,
  visible = true,
  viewBox, // ViewBox del SVG principal para calcular tamaños
  realZoom = 1, // Zoom real para mantener tamaño constante de handles
  screenDeltaToSVGDelta, // Para convertir movimientos del mouse
  screenToSVG // Para convertir clicks en el path
}) => {
  const [selectedNodes, setSelectedNodes] = useState(new Set());
  const [hoveredNode, setHoveredNode] = useState(null);

  if (!visible || !element) {
    return null;
  }
  if (tool !== 'node' && tool !== 'pen') {
    return null;
  }

  // Solo funciona con elementos path
  if (element.tagName !== 'path' && element.tagName !== 'PATH') {
    return null;
  }

  // Obtener nodos del elemento
  const rawNodes = parsePathNodes(element.getAttribute('d') || '');

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

  const handleNodeClick = (e, node) => {
    e.stopPropagation();

    if (tool === 'pen') {
      // Cambiar tipo de nodo o eliminar
      if (e.ctrlKey || e.metaKey || e.altKey) {
        // Eliminar nodo
        removeNodeFromPath(element, node.index);
        onPathChange?.();
      } else {
        // Ciclar entre tipos: line -> curve -> smooth -> line
        // TODO: Implementar cambio de tipo (podría requerir lógica compleja)
        // Por ahora solo log
        console.log('Click en nodo con Pen Tool (sin tecla modificadora)');
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
    e.preventDefault();

    console.log('🎯 handleNodeDrag iniciado', { tool, nodeIndex: node.index });

    // Capturar el punto de inicio en coordenadas locales
    // Necesitamos convertir el punto de pantalla -> SVG Global -> SVG Local (Elemento)
    let startLocalPoint = { x: node.x, y: node.y }; // Fallback

    // Helper para obtener punto local desde evento de mouse
    const getLocalPoint = (clientX, clientY) => {
      if (!screenToSVG || !element) return null;

      const globalSVGPoint = screenToSVG(clientX, clientY);

      try {
        const ctm = element.getCTM();
        if (ctm) {
          const inverse = ctm.inverse();
          const pt = element.ownerSVGElement.createSVGPoint();
          pt.x = globalSVGPoint.x;
          pt.y = globalSVGPoint.y;
          const transformed = pt.matrixTransform(inverse);
          return { x: transformed.x, y: transformed.y };
        }
      } catch (err) {
        console.warn('Error transforming point:', err);
      }
      return globalSVGPoint; // Fallback a global si falla (mejor que nada)
    };

    const initialMouseLocal = getLocalPoint(e.clientX, e.clientY);

    // Guardar offset inicial entre el mouse y el centro del nodo para evitar "saltos"
    // El nodo ya está en coordenadas locales (rawNodes -> transformPoint era solo para visualización???)
    // ESPERA: renderNodes usa `nodes` que son TRANSFORMADOS (Globales).
    // `node` que recibimos aquí viene de `nodes.map`. Por tanto `node.x` es GLOBAL.
    // 
    // PERO `onNodeChange` espera LOCAL (para actualizar 'd').
    // 
    // ESTRATEGIA:
    // 1. Calcular delta en espacio LOCAL.
    // 2. Aplicar delta a la posición original del nodo en el path (que necesitamos recuperar).
    // 
    // El objeto `node` recibido tiene coords globales. 
    // Sin embargo, `node.index` nos permite saber cuál es.
    // `rawNodes` (línea 46) tiene las coordenadas locales originales.
    const originalNodeLocal = rawNodes[node.index];

    // Punto de inicio del drag en pantalla
    const startScreenX = e.clientX;
    const startScreenY = e.clientY;

    const handleMouseMove = (e) => {
      // 1. Obtener posición actual del mouse en local
      const currentMouseLocal = getLocalPoint(e.clientX, e.clientY);
      if (!currentMouseLocal || !initialMouseLocal) return;

      // 2. Calcular delta en espacio LOCAL
      const dx = currentMouseLocal.x - initialMouseLocal.x;
      const dy = currentMouseLocal.y - initialMouseLocal.y;

      // 3. Aplicar delta a la posición original LOCAL del nodo
      const newNode = {
        ...originalNodeLocal, // Usar el nodo original (local)
        x: originalNodeLocal.x + dx,
        y: originalNodeLocal.y + dy
      };

      // Si tiene puntos de control, moverlos también (mantener relación relativa)
      if (originalNodeLocal.cp1) {
        newNode.cp1 = {
          x: originalNodeLocal.cp1.x + dx,
          y: originalNodeLocal.cp1.y + dy
        };
      }
      if (originalNodeLocal.cp2) {
        newNode.cp2 = {
          x: originalNodeLocal.cp2.x + dx,
          y: originalNodeLocal.cp2.y + dy
        };
      }
      if (originalNodeLocal.cp) {
        newNode.cp = {
          x: originalNodeLocal.cp.x + dx,
          y: originalNodeLocal.cp.y + dy
        };
      }

      onNodeChange?.(node, newNode);
    };
    const handleMouseUp = () => {
      console.log('✅ handleNodeDrag finalizado');
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
      onNodeDragEnd?.();
    };

    console.log('📝 Registrando listeners de mousemove y mouseup');
    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);
  };

  const handlePathClick = (e) => {
    if (tool !== 'pen') return;

    e.stopPropagation();

    // Convertir coordenadas de pantalla a SVG
    if (!screenToSVG) {
      console.warn('NodeEditor: screenToSVG no disponible');
      return;
    }

    const svgPoint = screenToSVG(e.clientX, e.clientY);

    // Transformar el punto inverso de la matriz del objeto
    // Porque 'd' está en el espacio local del objeto, pero svgPoint está en espacio global (viewport)
    // Sin embargo, si hemos aplicado transforms en el nivel de SVGWorld, 
    // y el path 'd' no tiene transforms APLICADOS (sino en atributo transform),
    // necesitamos transformar el svgPoint al espacio local del elemento.

    // IMPORTANTE: findClosestPointOnPath trabaja sobre los datos 'd' crudos (espacio local)
    // Así que necesitamos convertir el punto global SVG al espacio local del elemento
    let localPoint = svgPoint;
    try {
      const ctm = element.getCTM();
      if (ctm) {
        // Inversa de la matriz para ir de global a local
        const inverse = ctm.inverse();
        const pt = element.ownerSVGElement.createSVGPoint();
        pt.x = svgPoint.x;
        pt.y = svgPoint.y;
        const transformed = pt.matrixTransform(inverse);
        localPoint = { x: transformed.x, y: transformed.y };
      }
    } catch (err) {
      console.error('Error transformando punto a espacio local:', err);
    }

    // Buscar el punto más cercano en el path
    const closest = findClosestPointOnPath(element.getAttribute('d'), localPoint);

    console.log('🔍 Path Click Analysis:', {
      screen: { x: e.clientX, y: e.clientY },
      svgGlobal: svgPoint,
      svgLocal: localPoint,
      closestResult: closest,
      threshold: 10 / realZoom
    });

    // Umbral de distancia para considerar que se hizo click en el path
    // 10 pixeles de pantalla convertidos a escala local
    // Como realZoom es escala viewport, necesitamos ajustar por la escala del objeto también?
    // findClosestPointOnPath devuelve distancia en unidades locales.
    // 10px pantalla -> X unidades viewport -> Y unidades locales.

    // Aproximación simple: usar un unbral generoso en unidades locales
    // Mejor: calcular 10px proyectados al espacio local
    let localThreshold = 5; // fallback
    try {
      const ctm = element.getCTM();
      if (ctm && realZoom) {
        // Escala promedio del objeto
        const objectScale = Math.sqrt(ctm.a * ctm.a + ctm.b * ctm.b);
        // 10px / (viewportZoom * objectZoom)
        localThreshold = 10 / (realZoom * objectScale);
      }
    } catch (e) { }

    if (closest.distance < localThreshold) {
      console.log('✨ Adding node at index', closest.segmentIndex);
      splitPathAtSegment(element, closest.segmentIndex, closest.t);
      onPathChange?.();
    }
  };

  const renderNodes = () => {
    if (!element || element.tagName !== 'path') return null;

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
            onClick={(e) => handleNodeClick(e, node)}
          />
        </g>
      );
    });
  };

  // Calcular CTM string para el overlay path
  let overlayTransform = '';
  try {
    const ctm = element.getCTM();
    if (ctm) {
      overlayTransform = `matrix(${ctm.a}, ${ctm.b}, ${ctm.c}, ${ctm.d}, ${ctm.e}, ${ctm.f})`;
    }
  } catch (e) {
    console.error('Error calculating CTM for overlay:', e);
  }

  return (
    <g className="node-editor">
      {/* Overlay invisible para detectar clicks en el path */}
      {tool === 'pen' && (
        <path
          d={element.getAttribute('d')}
          transform={overlayTransform}
          className="svg-path-overlay"
          fill="none"
          stroke="transparent"
          strokeWidth={realZoom > 0 ? 10 / realZoom : 10}
          vectorEffect="non-scaling-stroke"
          onClick={handlePathClick}
          style={{ cursor: 'crosshair', pointerEvents: 'stroke' }}
        />
      )}

      {/* Renderizar nodos */}
      {renderNodes()}
    </g>
  );
};

export default NodeEditor;
