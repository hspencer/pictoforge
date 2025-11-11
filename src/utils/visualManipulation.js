/**
 * Utilidades de alto nivel para manipulación visual de elementos SVG
 * Integra transformación de coordenadas con manipulación de elementos
 */

import {
  screenToSVGCoordinates,
  screenDeltaToSVGDelta,
  getClosestPointOnPath
} from './coordinateTransform';

import {
  parsePathNodes,
  buildPathFromNodes,
  updateNodeInPath
} from './svgManipulation';

/**
 * Maneja el arrastre de un elemento SVG completo
 * Convierte movimientos de mouse a coordenadas SVG y actualiza el elemento
 *
 * @param {SVGElement} element - Elemento a mover
 * @param {Object} dragStart - Posición inicial de pantalla {screenX, screenY}
 * @param {Object} dragCurrent - Posición actual de pantalla {screenX, screenY}
 * @param {SVGSVGElement} svgElement - Elemento SVG raíz
 * @param {Object} viewport - Estado del viewport {zoom, pan}
 * @returns {Object} Delta aplicado en coordenadas SVG
 */
export const handleElementDrag = (element, dragStart, dragCurrent, svgElement, viewport) => {
  if (!element || !svgElement) return { dx: 0, dy: 0 };

  // Calcular delta en pantalla
  const deltaScreenX = dragCurrent.screenX - dragStart.screenX;
  const deltaScreenY = dragCurrent.screenY - dragStart.screenY;

  // Convertir delta a coordenadas SVG
  const { dx, dy } = screenDeltaToSVGDelta(deltaScreenX, deltaScreenY, svgElement, viewport);

  // Aplicar transformación según el tipo de elemento
  const tagName = element.tagName.toLowerCase();

  switch (tagName) {
    case 'circle':
    case 'ellipse':
      // Mover el centro
      moveCircleElement(element, dx, dy);
      break;

    case 'rect':
      // Mover la esquina superior izquierda
      moveRectElement(element, dx, dy);
      break;

    case 'path':
      // Mover usando transform
      movePathWithTransform(element, dx, dy);
      break;

    case 'line':
      // Mover ambos puntos
      moveLineElement(element, dx, dy);
      break;

    case 'polyline':
    case 'polygon':
      // Mover todos los puntos
      movePolygonElement(element, dx, dy);
      break;

    case 'text':
      // Mover posición del texto
      moveTextElement(element, dx, dy);
      break;

    case 'g':
      // Aplicar transform al grupo
      moveGroupElement(element, dx, dy);
      break;

    default:
      // Por defecto, usar transform
      movePathWithTransform(element, dx, dy);
  }

  return { dx, dy };
};

/**
 * Maneja el arrastre de un nodo específico en un path
 *
 * @param {SVGPathElement} pathElement - Elemento path
 * @param {number} nodeIndex - Índice del nodo a mover
 * @param {Object} dragCurrent - Posición actual de pantalla {screenX, screenY}
 * @param {SVGSVGElement} svgElement - Elemento SVG raíz
 * @param {Object} viewport - Estado del viewport
 * @returns {Object} Nueva posición del nodo en coordenadas SVG
 */
export const handleNodeDrag = (pathElement, nodeIndex, dragCurrent, svgElement, viewport) => {
  if (!pathElement || pathElement.tagName !== 'path') return null;

  // Convertir posición de pantalla a SVG
  const svgCoords = screenToSVGCoordinates(
    dragCurrent.screenX,
    dragCurrent.screenY,
    svgElement,
    viewport
  );

  // Obtener nodos actuales
  const pathData = pathElement.getAttribute('d');
  const nodes = parsePathNodes(pathData);

  if (nodeIndex < 0 || nodeIndex >= nodes.length) return null;

  // Actualizar el nodo
  const updatedNode = {
    ...nodes[nodeIndex],
    x: svgCoords.x,
    y: svgCoords.y
  };

  // Si es una curva, necesitamos actualizar también los puntos de control
  if (nodes[nodeIndex].type === 'curve' && nodes[nodeIndex].cp1 && nodes[nodeIndex].cp2) {
    // Mantener la relación de los puntos de control
    const deltaX = svgCoords.x - nodes[nodeIndex].x;
    const deltaY = svgCoords.y - nodes[nodeIndex].y;

    updatedNode.cp1 = {
      x: nodes[nodeIndex].cp1.x + deltaX,
      y: nodes[nodeIndex].cp1.y + deltaY
    };
    updatedNode.cp2 = {
      x: nodes[nodeIndex].cp2.x + deltaX,
      y: nodes[nodeIndex].cp2.y + deltaY
    };
  }

  // Actualizar el path
  updateNodeInPath(pathElement, nodeIndex, updatedNode);

  return svgCoords;
};

/**
 * Encuentra el nodo más cercano a una posición de click
 *
 * @param {SVGPathElement} pathElement - Elemento path
 * @param {Object} clickPos - Posición del click en pantalla {screenX, screenY}
 * @param {SVGSVGElement} svgElement - Elemento SVG raíz
 * @param {Object} viewport - Estado del viewport
 * @param {number} threshold - Distancia máxima en píxeles SVG
 * @returns {Object|null} Información del nodo {index, node, distance}
 */
export const findClosestNode = (pathElement, clickPos, svgElement, viewport, threshold = 10) => {
  if (!pathElement || pathElement.tagName !== 'path') return null;

  // Convertir posición de click a SVG
  const svgCoords = screenToSVGCoordinates(
    clickPos.screenX,
    clickPos.screenY,
    svgElement,
    viewport
  );

  // Obtener todos los nodos
  const pathData = pathElement.getAttribute('d');
  const nodes = parsePathNodes(pathData);

  let closestNode = null;
  let minDistance = threshold;

  // Buscar el nodo más cercano
  nodes.forEach((node, index) => {
    const dx = node.x - svgCoords.x;
    const dy = node.y - svgCoords.y;
    const distance = Math.sqrt(dx * dx + dy * dy);

    if (distance < minDistance) {
      minDistance = distance;
      closestNode = {
        index,
        node,
        distance
      };
    }

    // También verificar puntos de control para curvas
    if (node.type === 'curve') {
      // Punto de control 1
      if (node.cp1) {
        const dx1 = node.cp1.x - svgCoords.x;
        const dy1 = node.cp1.y - svgCoords.y;
        const distance1 = Math.sqrt(dx1 * dx1 + dy1 * dy1);

        if (distance1 < minDistance) {
          minDistance = distance1;
          closestNode = {
            index,
            node,
            distance: distance1,
            controlPoint: 1
          };
        }
      }

      // Punto de control 2
      if (node.cp2) {
        const dx2 = node.cp2.x - svgCoords.x;
        const dy2 = node.cp2.y - svgCoords.y;
        const distance2 = Math.sqrt(dx2 * dx2 + dy2 * dy2);

        if (distance2 < minDistance) {
          minDistance = distance2;
          closestNode = {
            index,
            node,
            distance: distance2,
            controlPoint: 2
          };
        }
      }
    }
  });

  return closestNode;
};

/**
 * Inserta un nuevo nodo en un path en la posición de click
 *
 * @param {SVGPathElement} pathElement - Elemento path
 * @param {Object} clickPos - Posición del click en pantalla {screenX, screenY}
 * @param {SVGSVGElement} svgElement - Elemento SVG raíz
 * @param {Object} viewport - Estado del viewport
 * @returns {Object|null} Nuevo nodo insertado
 */
export const insertNodeAtPosition = (pathElement, clickPos, svgElement, viewport) => {
  if (!pathElement || pathElement.tagName !== 'path') return null;

  // Convertir posición a SVG
  const svgCoords = screenToSVGCoordinates(
    clickPos.screenX,
    clickPos.screenY,
    svgElement,
    viewport
  );

  // Encontrar el punto más cercano en el path
  const closestPoint = getClosestPointOnPath(pathElement, svgCoords);

  if (!closestPoint) return null;

  // Obtener nodos actuales
  const pathData = pathElement.getAttribute('d');
  const nodes = parsePathNodes(pathData);

  // Encontrar entre qué nodos insertar el nuevo nodo
  let insertIndex = Math.floor(closestPoint.normalizedT * nodes.length);
  insertIndex = Math.max(1, Math.min(insertIndex, nodes.length));

  // Crear nuevo nodo
  const newNode = {
    id: `node-${Date.now()}`,
    x: closestPoint.point.x,
    y: closestPoint.point.y,
    type: 'line',
    command: 'L',
    coords: [closestPoint.point.x, closestPoint.point.y],
    index: insertIndex
  };

  // Insertar el nodo
  nodes.splice(insertIndex, 0, newNode);

  // Reconstruir el path
  const newPathData = buildPathFromNodes(nodes);
  pathElement.setAttribute('d', newPathData);

  return {
    index: insertIndex,
    node: newNode
  };
};

// Funciones auxiliares para mover diferentes tipos de elementos

const moveCircleElement = (element, dx, dy) => {
  const cx = parseFloat(element.getAttribute('cx') || 0);
  const cy = parseFloat(element.getAttribute('cy') || 0);
  element.setAttribute('cx', cx + dx);
  element.setAttribute('cy', cy + dy);
};

const moveRectElement = (element, dx, dy) => {
  const x = parseFloat(element.getAttribute('x') || 0);
  const y = parseFloat(element.getAttribute('y') || 0);
  element.setAttribute('x', x + dx);
  element.setAttribute('y', y + dy);
};

const moveLineElement = (element, dx, dy) => {
  const x1 = parseFloat(element.getAttribute('x1') || 0);
  const y1 = parseFloat(element.getAttribute('y1') || 0);
  const x2 = parseFloat(element.getAttribute('x2') || 0);
  const y2 = parseFloat(element.getAttribute('y2') || 0);
  element.setAttribute('x1', x1 + dx);
  element.setAttribute('y1', y1 + dy);
  element.setAttribute('x2', x2 + dx);
  element.setAttribute('y2', y2 + dy);
};

const movePolygonElement = (element, dx, dy) => {
  const points = element.getAttribute('points') || '';
  const coords = points.trim().split(/[\s,]+/).map(parseFloat);
  const newCoords = coords.map((coord, index) => {
    return index % 2 === 0 ? coord + dx : coord + dy;
  });
  element.setAttribute('points', newCoords.join(' '));
};

const moveTextElement = (element, dx, dy) => {
  const x = parseFloat(element.getAttribute('x') || 0);
  const y = parseFloat(element.getAttribute('y') || 0);
  element.setAttribute('x', x + dx);
  element.setAttribute('y', y + dy);
};

const movePathWithTransform = (element, dx, dy) => {
  const currentTransform = element.getAttribute('transform') || '';
  const translateMatch = currentTransform.match(/translate\(([^,]+),([^)]+)\)/);

  let currentX = 0;
  let currentY = 0;

  if (translateMatch) {
    currentX = parseFloat(translateMatch[1]);
    currentY = parseFloat(translateMatch[2]);
  }

  const newTransform = currentTransform.replace(
    /translate\([^)]+\)/,
    ''
  ).trim();

  const translate = `translate(${currentX + dx},${currentY + dy})`;
  element.setAttribute('transform', `${translate} ${newTransform}`.trim());
};

const moveGroupElement = (element, dx, dy) => {
  // Similar a movePathWithTransform
  movePathWithTransform(element, dx, dy);
};

/**
 * Hook para integrar en componentes React
 * Proporciona funciones listas para usar con eventos de mouse
 */
export const useVisualManipulation = (svgRef, viewport) => {
  const getSVGElement = () => {
    return svgRef.current?.querySelector('svg');
  };

  return {
    /**
     * Maneja el arrastre de un elemento
     */
    handleDrag: (element, dragStart, dragCurrent) => {
      return handleElementDrag(element, dragStart, dragCurrent, getSVGElement(), viewport);
    },

    /**
     * Maneja el arrastre de un nodo
     */
    handleNodeDrag: (pathElement, nodeIndex, dragCurrent) => {
      return handleNodeDrag(pathElement, nodeIndex, dragCurrent, getSVGElement(), viewport);
    },

    /**
     * Encuentra el nodo más cercano a un click
     */
    findClosestNode: (pathElement, clickPos, threshold) => {
      return findClosestNode(pathElement, clickPos, getSVGElement(), viewport, threshold);
    },

    /**
     * Inserta un nodo en la posición del click
     */
    insertNode: (pathElement, clickPos) => {
      return insertNodeAtPosition(pathElement, clickPos, getSVGElement(), viewport);
    },

    /**
     * Convierte coordenadas de pantalla a SVG
     */
    screenToSVG: (screenX, screenY) => {
      return screenToSVGCoordinates(screenX, screenY, getSVGElement(), viewport);
    }
  };
};
