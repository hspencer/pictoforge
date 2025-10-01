import React from 'react';

/**
 * Componente BoundingBox para mostrar el rectángulo de selección
 * y los handles de redimensionamiento
 */
export const BoundingBox = ({ 
  element, 
  onResize, 
  onMove, 
  onRotate,
  visible = true 
}) => {
  if (!visible || !element) return null;

  // Obtener las dimensiones del elemento
  const bbox = element.getBBox ? element.getBBox() : {
    x: 0, y: 0, width: 100, height: 100
  };

  const { x, y, width, height } = bbox;
  
  // Posiciones de los handles
  const handles = [
    { id: 'nw', x: x, y: y, cursor: 'nw-resize' },
    { id: 'n', x: x + width/2, y: y, cursor: 'n-resize' },
    { id: 'ne', x: x + width, y: y, cursor: 'ne-resize' },
    { id: 'e', x: x + width, y: y + height/2, cursor: 'e-resize' },
    { id: 'se', x: x + width, y: y + height, cursor: 'se-resize' },
    { id: 's', x: x + width/2, y: y + height, cursor: 's-resize' },
    { id: 'sw', x: x, y: y + height, cursor: 'sw-resize' },
    { id: 'w', x: x, y: y + height/2, cursor: 'w-resize' }
  ];

  const handleMouseDown = (e, handleId) => {
    e.stopPropagation();
    const startX = e.clientX;
    const startY = e.clientY;
    
    const handleMouseMove = (e) => {
      const deltaX = e.clientX - startX;
      const deltaY = e.clientY - startY;
      onResize?.(handleId, deltaX, deltaY);
    };

    const handleMouseUp = () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };

    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);
  };

  return (
    <g className="bounding-box" pointerEvents="none">
      {/* Rectángulo del bounding box */}
      <rect
        x={x}
        y={y}
        width={width}
        height={height}
        className="svg-bounding-box"
      />
      
      {/* Handles de redimensionamiento */}
      {handles.map(handle => (
        <rect
          key={handle.id}
          x={handle.x - 4}
          y={handle.y - 4}
          width={8}
          height={8}
          className="svg-resize-handle"
          style={{ cursor: handle.cursor }}
          pointerEvents="all"
          onMouseDown={(e) => handleMouseDown(e, handle.id)}
        />
      ))}
      
      {/* Handle de rotación */}
      <circle
        cx={x + width/2}
        cy={y - 20}
        r={4}
        className="svg-resize-handle"
        style={{ cursor: 'grab' }}
        pointerEvents="all"
        onMouseDown={(e) => {
          e.stopPropagation();
          onRotate?.(e);
        }}
      />
      
      {/* Línea conectora para rotación */}
      <line
        x1={x + width/2}
        y1={y}
        x2={x + width/2}
        y2={y - 20}
        stroke="#00b9ff"
        strokeWidth="1"
        pointerEvents="none"
      />
    </g>
  );
};

export default BoundingBox;
