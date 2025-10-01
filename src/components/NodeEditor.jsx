import React, { useState } from 'react';

/**
 * Componente NodeEditor para la manipulación de nodos SVG
 */
export const NodeEditor = ({ 
  element, 
  tool, 
  onNodeChange,
  onNodeAdd,
  onNodeRemove,
  visible = true 
}) => {
  const [selectedNodes, setSelectedNodes] = useState(new Set());
  const [hoveredNode, setHoveredNode] = useState(null);

  if (!visible || !element || tool !== 'node' && tool !== 'pen') return null;

  // Extraer nodos del path
  const getNodesFromPath = (pathData) => {
    if (!pathData) return [];
    
    const nodes = [];
    const commands = pathData.match(/[MmLlHhVvCcSsQqTtAaZz][^MmLlHhVvCcSsQqTtAaZz]*/g) || [];
    
    let currentX = 0, currentY = 0;
    
    commands.forEach((command, index) => {
      const type = command[0];
      const coords = command.slice(1).trim().split(/[\s,]+/).map(Number).filter(n => !isNaN(n));
      
      switch (type.toLowerCase()) {
        case 'm': // moveto
        case 'l': // lineto
          if (coords.length >= 2) {
            currentX = type === type.toLowerCase() ? currentX + coords[0] : coords[0];
            currentY = type === type.toLowerCase() ? currentY + coords[1] : coords[1];
            nodes.push({
              id: `node-${index}`,
              x: currentX,
              y: currentY,
              type: type.toLowerCase() === 'm' ? 'move' : 'line',
              command: type,
              coords: coords
            });
          }
          break;
        case 'c': // curveto
          if (coords.length >= 6) {
            const endX = type === type.toLowerCase() ? currentX + coords[4] : coords[4];
            const endY = type === type.toLowerCase() ? currentY + coords[5] : coords[5];
            nodes.push({
              id: `node-${index}`,
              x: endX,
              y: endY,
              type: 'curve',
              command: type,
              coords: coords,
              cp1: { x: currentX + coords[0], y: currentY + coords[1] },
              cp2: { x: currentX + coords[2], y: currentY + coords[3] }
            });
            currentX = endX;
            currentY = endY;
          }
          break;
        case 'q': // quadratic curveto
          if (coords.length >= 4) {
            const endX = type === type.toLowerCase() ? currentX + coords[2] : coords[2];
            const endY = type === type.toLowerCase() ? currentY + coords[3] : coords[3];
            nodes.push({
              id: `node-${index}`,
              x: endX,
              y: endY,
              type: 'quadratic',
              command: type,
              coords: coords,
              cp: { x: currentX + coords[0], y: currentY + coords[1] }
            });
            currentX = endX;
            currentY = endY;
          }
          break;
      }
    });
    
    return nodes;
  };

  // Obtener nodos del elemento
  const nodes = element.tagName === 'path' ? 
    getNodesFromPath(element.getAttribute('d')) : [];

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
    const startX = e.clientX;
    const startY = e.clientY;
    const startNodeX = node.x;
    const startNodeY = node.y;
    
    const handleMouseMove = (e) => {
      const deltaX = e.clientX - startX;
      const deltaY = e.clientY - startY;
      
      const newNode = {
        ...node,
        x: startNodeX + deltaX,
        y: startNodeY + deltaY
      };
      
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
    const rect = e.currentTarget.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    
    // Agregar nuevo nodo en la posición del click
    onNodeAdd?.({ x, y, type: 'line' });
  };

  return (
    <g className="node-editor">
      {/* Overlay invisible para detectar clicks en el path */}
      {tool === 'pen' && (
        <path
          d={element.getAttribute('d')}
          fill="none"
          stroke="transparent"
          strokeWidth="10"
          style={{ cursor: 'crosshair' }}
          onClick={handlePathClick}
        />
      )}
      
      {/* Nodos */}
      {nodes.map(node => (
        <g key={node.id}>
          {/* Control points para curvas */}
          {node.type === 'curve' && node.cp1 && node.cp2 && (
            <>
              <line
                x1={node.x}
                y1={node.y}
                x2={node.cp2.x}
                y2={node.cp2.y}
                stroke="#00b9ff"
                strokeWidth="1"
                strokeDasharray="3,3"
                opacity="0.6"
              />
              <circle
                cx={node.cp2.x}
                cy={node.cp2.y}
                r="3"
                fill="#00b9ff"
                stroke="#ffffff"
                strokeWidth="1"
                style={{ cursor: 'move' }}
              />
            </>
          )}
          
          {/* Nodo principal */}
          <circle
            cx={node.x}
            cy={node.y}
            r={selectedNodes.has(node.id) ? 6 : 4}
            className={`svg-node ${selectedNodes.has(node.id) ? 'selected' : ''}`}
            style={{ 
              cursor: tool === 'node' ? 'move' : tool === 'pen' ? 'pointer' : 'default',
              fill: node.type === 'curve' ? '#ff6b35' : 
                    node.type === 'smooth' ? '#4ade80' : '#00b9ff'
            }}
            onClick={(e) => handleNodeClick(e, node)}
            onMouseDown={(e) => handleNodeDrag(e, node)}
            onMouseEnter={() => setHoveredNode(node.id)}
            onMouseLeave={() => setHoveredNode(null)}
          />
          
          {/* Tooltip para el nodo */}
          {hoveredNode === node.id && (
            <text
              x={node.x}
              y={node.y - 10}
              textAnchor="middle"
              fontSize="10"
              fill="#374151"
              style={{ pointerEvents: 'none' }}
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
