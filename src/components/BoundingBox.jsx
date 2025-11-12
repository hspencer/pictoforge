import React from 'react';
import { screenToSVGCoordinates, svgToScreenCoordinates, screenDeltaToSVGDelta } from '@/utils/coordinateTransform';

/**
 * Obtiene el bounding box de un elemento SVG en coordenadas del SVG
 * Calcula el bbox considerando las transformaciones aplicadas
 */
const getTransformedBBox = (element) => {
  if (!element?.getBBox) {
    return { x: 0, y: 0, width: 100, height: 100 };
  }

  try {
    const bbox = element.getBBox();
    const svg = element.ownerSVGElement;

    if (!svg?.createSVGPoint) {
      return bbox;
    }

    // Obtener la matriz de transformación del elemento (solo sus transformaciones, no las del viewport)
    const transform = element.transform?.baseVal;

    if (!transform || transform.numberOfItems === 0) {
      // Sin transformaciones, retornar bbox directo
      return bbox;
    }

    // Consolidar todas las transformaciones en una matriz
    const matrix = transform.consolidate()?.matrix;

    if (!matrix) {
      return bbox;
    }

    // Transformar las cuatro esquinas del bbox
    const corners = [
      { x: bbox.x, y: bbox.y },
      { x: bbox.x + bbox.width, y: bbox.y },
      { x: bbox.x + bbox.width, y: bbox.y + bbox.height },
      { x: bbox.x, y: bbox.y + bbox.height }
    ];

    const point = svg.createSVGPoint();
    const transformedCorners = corners.map(corner => {
      point.x = corner.x;
      point.y = corner.y;
      return point.matrixTransform(matrix);
    });

    // Calcular el bounding box que contiene todas las esquinas transformadas
    const xs = transformedCorners.map(p => p.x);
    const ys = transformedCorners.map(p => p.y);

    return {
      x: Math.min(...xs),
      y: Math.min(...ys),
      width: Math.max(...xs) - Math.min(...xs),
      height: Math.max(...ys) - Math.min(...ys)
    };
  } catch (error) {
    console.warn('Error getting transformed bbox:', error);
    return element.getBBox();
  }
};

/**
 * Componente BoundingBox para mostrar el rectángulo de selección
 * y los handles de redimensionamiento
 */
/**
 * Convierte coordenadas SVG a coordenadas de pantalla (para el overlay)
 */
const svgToScreenCoords = (element, svgX, svgY) => {
  const svg = element.ownerSVGElement;
  if (!svg || !svg.createSVGPoint) {
    return { x: svgX, y: svgY };
  }

  const point = svg.createSVGPoint();
  point.x = svgX;
  point.y = svgY;

  const ctm = svg.getScreenCTM();
  if (ctm) {
    const screenPoint = point.matrixTransform(ctm);
    // Obtener el bbox del SVG para convertir a coordenadas relativas del contenedor
    const svgRect = svg.getBoundingClientRect();
    return {
      x: screenPoint.x - svgRect.left,
      y: screenPoint.y - svgRect.top
    };
  }
  return { x: svgX, y: svgY };
};

export const BoundingBox = ({
  element,
  onResize,
  onMove,
  onRotate,
  visible = true,
  viewport = { zoom: 1, pan: { x: 0, y: 0 } }, // Agregar viewport como prop
  containerRef // Referencia al contenedor para calcular coordenadas relativas
}) => {
  if (!visible || !element) {
    console.log('🚫 BoundingBox no visible:', { visible, hasElement: !!element });
    return null;
  }

  console.log('✨ BoundingBox renderizando para:', element.id || element.tagName);

  // Obtener las dimensiones del elemento con transformaciones aplicadas (en espacio SVG)
  const bbox = getTransformedBBox(element);
  const svg = element.ownerSVGElement;

  if (!svg || !containerRef?.current) {
    console.warn('⚠️ No hay SVG o containerRef');
    return null;
  }

  // Obtener los rects para calcular las coordenadas
  const svgRect = svg.getBoundingClientRect();
  const containerRect = containerRef.current.getBoundingClientRect();

  // Crear punto SVG para transformaciones
  const point = svg.createSVGPoint();

  // Esquina superior izquierda en coordenadas SVG
  point.x = bbox.x;
  point.y = bbox.y;
  const screenTopLeft = point.matrixTransform(svg.getScreenCTM());

  // Esquina inferior derecha en coordenadas SVG
  point.x = bbox.x + bbox.width;
  point.y = bbox.y + bbox.height;
  const screenBottomRight = point.matrixTransform(svg.getScreenCTM());

  // Convertir a coordenadas relativas al contenedor
  const x = (screenTopLeft.x - containerRect.left);
  const y = (screenTopLeft.y - containerRect.top);
  const width = screenBottomRight.x - screenTopLeft.x;
  const height = screenBottomRight.y - screenTopLeft.y;

  console.log('📐 BoundingBox coords:', {
    bboxSVG: bbox,
    screenTopLeft: { x: screenTopLeft.x, y: screenTopLeft.y },
    screenBottomRight: { x: screenBottomRight.x, y: screenBottomRight.y },
    final: { x, y, width, height },
    svgRect: { left: svgRect.left, top: svgRect.top },
    containerRect: { left: containerRect.left, top: containerRect.top }
  });
  
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

  /**
   * Convierte coordenadas de pantalla (clientX, clientY) a coordenadas SVG del elemento original
   */
  const screenToSVGCoords = (clientX, clientY) => {
    const svg = element.ownerSVGElement;
    if (!svg || !svg.createSVGPoint) {
      return { x: clientX, y: clientY };
    }

    // Usar el SVG original para la conversión, no el overlay
    const point = svg.createSVGPoint();
    point.x = clientX;
    point.y = clientY;

    // Transformar del espacio de pantalla al espacio SVG original
    const ctm = svg.getScreenCTM();
    if (ctm) {
      return point.matrixTransform(ctm.inverse());
    }
    return point;
  };

  const handleMouseDown = (e, handleId) => {
    e.stopPropagation();

    // Guardar posición inicial en pantalla
    const startScreenX = e.clientX;
    const startScreenY = e.clientY;

    const handleMouseMove = (e) => {
      // Calcular delta en pantalla
      const deltaScreenX = e.clientX - startScreenX;
      const deltaScreenY = e.clientY - startScreenY;

      // Convertir delta a coordenadas SVG usando el viewport
      const svg = element.ownerSVGElement;
      const { dx, dy } = screenDeltaToSVGDelta(deltaScreenX, deltaScreenY, svg, viewport);

      onResize?.(handleId, dx, dy);
    };

    const handleMouseUp = () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };

    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);
  };

  // Handler para arrastrar todo el elemento
  const handleElementDrag = (e) => {
    e.stopPropagation();

    const startScreenX = e.clientX;
    const startScreenY = e.clientY;
    let lastDx = 0;
    let lastDy = 0;

    const handleMouseMove = (e) => {
      const deltaScreenX = e.clientX - startScreenX;
      const deltaScreenY = e.clientY - startScreenY;

      const svg = element.ownerSVGElement;
      const { dx, dy } = screenDeltaToSVGDelta(deltaScreenX, deltaScreenY, svg, viewport);

      // Solo enviar el delta incremental desde la última posición
      const incrementalDx = dx - lastDx;
      const incrementalDy = dy - lastDy;

      onMove?.(incrementalDx, incrementalDy);

      lastDx = dx;
      lastDy = dy;
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
      {/* Rectángulo del bounding box - DRAGGABLE para mover el elemento */}
      <rect
        x={x}
        y={y}
        width={width}
        height={height}
        className="svg-bounding-box"
        style={{ cursor: 'move' }}
        pointerEvents="all"
        onMouseDown={handleElementDrag}
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

          const centerX = x + width / 2;
          const centerY = y + height / 2;

          // Convertir posición inicial a coordenadas SVG
          const svg = element.ownerSVGElement;
          const startSVG = screenToSVGCoordinates(e.clientX, e.clientY, svg, viewport);

          // Calcular ángulo inicial
          const startAngle = Math.atan2(startSVG.y - centerY, startSVG.x - centerX) * 180 / Math.PI;

          const handleMouseMove = (e) => {
            // Convertir posición actual a coordenadas SVG
            const currentSVG = screenToSVGCoordinates(e.clientX, e.clientY, svg, viewport);
            const currentAngle = Math.atan2(currentSVG.y - centerY, currentSVG.x - centerX) * 180 / Math.PI;
            const deltaAngle = currentAngle - startAngle;

            onRotate?.(deltaAngle, centerX, centerY);
          };

          const handleMouseUp = () => {
            document.removeEventListener('mousemove', handleMouseMove);
            document.removeEventListener('mouseup', handleMouseUp);
          };

          document.addEventListener('mousemove', handleMouseMove);
          document.addEventListener('mouseup', handleMouseUp);
        }}
      />
      
      {/* Línea conectora para rotación */}
      <line
        x1={x + width/2}
        y1={y}
        x2={x + width/2}
        y2={y - 20}
        stroke="var(--col-select)"
        strokeWidth="1"
        pointerEvents="none"
      />
    </g>
  );
};

export default BoundingBox;
