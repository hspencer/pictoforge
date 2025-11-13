import React, { useState } from 'react';
import { parsePathNodes } from '../utils/svgManipulation';
import { screenToSVGCoordinates, svgToScreenCoordinates, screenDeltaToSVGDelta } from '@/utils/coordinateTransform';

/**
 * Componente NodeEditor para la manipulación de nodos SVG
 */
export const NodeEditor = ({
  element,
  tool,
  onNodeChange,
  onNodeAdd,
  onNodeRemove,
  visible = true,
  viewport = { zoom: 1, pan: { x: 0, y: 0 } }, // Agregar viewport como prop
  containerRef // Referencia al contenedor para calcular coordenadas relativas
}) => {
  const [selectedNodes, setSelectedNodes] = useState(new Set());
  const [hoveredNode, setHoveredNode] = useState(null);

  if (!visible || !element) return null;
  if (tool !== 'node' && tool !== 'pen') return null;

  // Solo funciona con elementos path
  if (element.tagName !== 'path' && element.tagName !== 'PATH') return null;

  // Usar la utilidad importada para extraer nodos

  // Obtener nodos del elemento
  const nodes = parsePathNodes(element.getAttribute('d') || '');
  const svg = element.ownerSVGElement;

  // Convertir posiciones de nodos a coordenadas de pantalla
  const screenNodes = nodes.map(node => {
    const screenPos = svgToScreenCoordinates(node.x, node.y, svg, viewport);

    // Ajustar coordenadas relativas al contenedor si está disponible
    let finalX = screenPos.x;
    let finalY = screenPos.y;

    if (containerRef?.current) {
      const containerRect = containerRef.current.getBoundingClientRect();
      finalX = screenPos.x - containerRect.left;
      finalY = screenPos.y - containerRect.top;
    }

    const screenNode = {
      ...node,
      screenX: finalX,
      screenY: finalY
    };

    // Convertir puntos de control también
    if (node.cp1) {
      const cp1Screen = svgToScreenCoordinates(node.cp1.x, node.cp1.y, svg, viewport);
      let cp1X = cp1Screen.x;
      let cp1Y = cp1Screen.y;
      if (containerRef?.current) {
        const containerRect = containerRef.current.getBoundingClientRect();
        cp1X = cp1Screen.x - containerRect.left;
        cp1Y = cp1Screen.y - containerRect.top;
      }
      screenNode.cp1Screen = { x: cp1X, y: cp1Y };
    }
    if (node.cp2) {
      const cp2Screen = svgToScreenCoordinates(node.cp2.x, node.cp2.y, svg, viewport);
      let cp2X = cp2Screen.x;
      let cp2Y = cp2Screen.y;
      if (containerRef?.current) {
        const containerRect = containerRef.current.getBoundingClientRect();
        cp2X = cp2Screen.x - containerRect.left;
        cp2Y = cp2Screen.y - containerRect.top;
      }
      screenNode.cp2Screen = { x: cp2X, y: cp2Y };
    }

    return screenNode;
  });

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

      // Convertir delta a coordenadas SVG
      const svg = element.ownerSVGElement;
      const { dx, dy } = screenDeltaToSVGDelta(deltaScreenX, deltaScreenY, svg, viewport);

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
    };

    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);
  };

  const handlePathClick = (e) => {
    if (tool !== 'pen') return;

    e.stopPropagation();

    // Convertir posición del click a coordenadas SVG
    const svg = element.ownerSVGElement;
    const svgCoords = screenToSVGCoordinates(e.clientX, e.clientY, svg, viewport);

    // Agregar nuevo nodo en la posición del click
    onNodeAdd?.({ x: svgCoords.x, y: svgCoords.y, type: 'line' });
  };

  return (
    <g className="node-editor">
      {/* Overlay invisible para detectar clicks en el path */}
      {tool === 'pen' && (
        <path
          d={element.getAttribute('d')}
          className="svg-path-overlay"
          onClick={handlePathClick}
        />
      )}
      
      {/* Nodos - Renderizados en coordenadas de pantalla */}
      {screenNodes.map(node => (
        <g key={node.id}>
          {/* Control points para curvas */}
          {node.type === 'curve' && node.cp2Screen && (
            <>
              <line
                x1={node.screenX}
                y1={node.screenY}
                x2={node.cp2Screen.x}
                y2={node.cp2Screen.y}
                className="svg-control-line"
              />
              <circle
                cx={node.cp2Screen.x}
                cy={node.cp2Screen.y}
                r="3"
                className="svg-control-point"
              />
            </>
          )}

          {/* Nodo principal */}
          <circle
            cx={node.screenX}
            cy={node.screenY}
            r={selectedNodes.has(node.id) ? 6 : 4}
            className={`svg-node ${selectedNodes.has(node.id) ? 'selected' : ''}
              ${node.type === 'curve' ? 'svg-node-curve' :
                node.type === 'smooth' ? 'svg-node-smooth' : 'svg-node-default'}
              ${tool === 'node' ? 'cursor-move' : tool === 'pen' ? 'cursor-pointer' : 'cursor-default'}`}
            onClick={(e) => handleNodeClick(e, node)}
            onMouseDown={(e) => handleNodeDrag(e, node)}
            onMouseEnter={() => setHoveredNode(node.id)}
            onMouseLeave={() => setHoveredNode(null)}
          />

          {/* Tooltip para el nodo */}
          {hoveredNode === node.id && (
            <text
              x={node.screenX}
              y={node.screenY - 10}
              textAnchor="middle"
              className="svg-tooltip"
            >
              {node.type}
            </text>
          )}
        </g>
      ))}
    </g>
  );
};

export default NodeEditor;
