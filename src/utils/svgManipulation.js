/**
 * Utilidades para manipulación de elementos SVG
 *
 * NOTA IMPORTANTE:
 * Para transformaciones de coordenadas (screenToSVG, svgToScreen, etc.) y manipulación
 * de transformaciones (move, rotate, scale), usar SVGWorld en lugar de estas funciones.
 *
 * Este archivo mantiene solo utilidades específicas para:
 * - Parsing de paths (parsePathNodes, buildPathFromNodes)
 * - Manipulación de paths (updateNodeInPath, addNodeToPath, removeNodeFromPath)
 * - Parsing de transforms (parseTransform, serializeTransform)
 *
 * Ver: src/services/SVGWorld.js y src/hooks/useSVGWorld.js
 */

// Re-exportar funciones de codificación de paths para conveniencia
export {
  pointToMoveTo,
  pointToLineTo,
  pointsToCubicBezier,
  pointsToQuadraticBezier,
  pointsToPath,
  rectToPath,
  circleToPath,
  ellipseToPath,
  parsePathCommand,
  relativeToAbsolute,
  absoluteToRelative,
  buildPathString,
  formatNumber
} from './pathEncoding';

/**
 * Parsea el atributo transform de un elemento SVG y devuelve un objeto con las transformaciones
 */
export const parseTransform = (transformString) => {
  if (!transformString) return {};

  const transforms = {};
  const regex = /(translate|scale|rotate|skewX|skewY|matrix)\s*\(([^)]+)\)/g;
  let match;

  while ((match = regex.exec(transformString)) !== null) {
    const type = match[1];
    const values = match[2].split(/[\s,]+/).map(parseFloat);
    transforms[type] = values;
  }

  return transforms;
};

/**
 * Convierte un objeto de transformaciones a string
 */
export const serializeTransform = (transforms) => {
  return Object.entries(transforms)
    .filter(([_, values]) => values && values.length > 0)
    .map(([type, values]) => `${type}(${values.join(',')})`)
    .join(' ');
};

// ============================================================================
// FUNCIONES DE MANIPULACIÓN DE PATHS
// Para manipulación de transformaciones, usar SVGWorld en su lugar
// ============================================================================

/**
 * Parsea un path SVG y extrae los nodos
 */
export const parsePathNodes = (pathData) => {
  if (!pathData) return [];

  const nodes = [];
  const commands = pathData.match(/[MmLlHhVvCcSsQqTtAaZz][^MmLlHhVvCcSsQqTtAaZz]*/g) || [];

  let currentX = 0, currentY = 0;
  let startX = 0, startY = 0;
  let nodeIndex = 0; // Índice secuencial para todos los nodos

  commands.forEach((command, cmdIndex) => {
    const type = command[0];
    // Usar regex más robusto que maneja números negativos consecutivos
    const coordString = command.slice(1).trim();
    const coords = (coordString.match(/-?\d*\.?\d+/g) || []).map(Number).filter(n => !isNaN(n));

    switch (type.toLowerCase()) {
      case 'm': // moveto
        if (coords.length >= 2) {
          currentX = type === type.toLowerCase() ? currentX + coords[0] : coords[0];
          currentY = type === type.toLowerCase() ? currentY + coords[1] : coords[1];
          startX = currentX;
          startY = currentY;
          nodes.push({
            id: `node-${nodeIndex}`,
            x: currentX,
            y: currentY,
            type: 'move',
            command: type,
            coords: coords,
            index: nodeIndex++
          });
        }
        break;

      case 'l': // lineto - puede tener múltiples pares de coordenadas
        for (let i = 0; i < coords.length; i += 2) {
          if (i + 1 < coords.length) {
            currentX = type === type.toLowerCase() ? currentX + coords[i] : coords[i];
            currentY = type === type.toLowerCase() ? currentY + coords[i + 1] : coords[i + 1];
            nodes.push({
              id: `node-${nodeIndex}`,
              x: currentX,
              y: currentY,
              type: 'line',
              command: type,
              coords: [coords[i], coords[i + 1]],
              index: nodeIndex++
            });
          }
        }
        break;

      case 'c': // curveto - puede tener múltiples curvas (6 coords cada una)
        for (let i = 0; i < coords.length; i += 6) {
          if (i + 5 < coords.length) {
            const cp1X = type === type.toLowerCase() ? currentX + coords[i] : coords[i];
            const cp1Y = type === type.toLowerCase() ? currentY + coords[i + 1] : coords[i + 1];
            const cp2X = type === type.toLowerCase() ? currentX + coords[i + 2] : coords[i + 2];
            const cp2Y = type === type.toLowerCase() ? currentY + coords[i + 3] : coords[i + 3];
            const endX = type === type.toLowerCase() ? currentX + coords[i + 4] : coords[i + 4];
            const endY = type === type.toLowerCase() ? currentY + coords[i + 5] : coords[i + 5];

            nodes.push({
              id: `node-${nodeIndex}`,
              x: endX,
              y: endY,
              type: 'curve',
              command: type,
              coords: coords.slice(i, i + 6),
              cp1: { x: cp1X, y: cp1Y },
              cp2: { x: cp2X, y: cp2Y },
              index: nodeIndex++
            });
            currentX = endX;
            currentY = endY;
          }
        }
        break;

      case 'q': // quadratic curveto
        if (coords.length >= 4) {
          const cpX = type === type.toLowerCase() ? currentX + coords[0] : coords[0];
          const cpY = type === type.toLowerCase() ? currentY + coords[1] : coords[1];
          const endX = type === type.toLowerCase() ? currentX + coords[2] : coords[2];
          const endY = type === type.toLowerCase() ? currentY + coords[3] : coords[3];

          nodes.push({
            id: `node-${nodeIndex}`,
            x: endX,
            y: endY,
            type: 'quadratic',
            command: type,
            coords: coords,
            cp: { x: cpX, y: cpY },
            index: nodeIndex++
          });
          currentX = endX;
          currentY = endY;
        }
        break;

      case 's': // smooth cubic curveto (shorthand)
        // 's' usa el reflejo del cp2 anterior como cp1, y toma 4 valores: x2,y2,x,y
        for (let i = 0; i < coords.length; i += 4) {
          if (i + 3 < coords.length) {
            // El cp1 se calcula reflejando el cp2 del comando anterior
            // Si no hay comando anterior o no es una curva, cp1 = punto actual
            const lastNode = nodes[nodes.length - 1];
            let cp1X = currentX;
            let cp1Y = currentY;
            if (lastNode && lastNode.type === 'curve' && lastNode.cp2) {
              cp1X = currentX + (currentX - lastNode.cp2.x);
              cp1Y = currentY + (currentY - lastNode.cp2.y);
            }

            const cp2X = type === type.toLowerCase() ? currentX + coords[i] : coords[i];
            const cp2Y = type === type.toLowerCase() ? currentY + coords[i + 1] : coords[i + 1];
            const endX = type === type.toLowerCase() ? currentX + coords[i + 2] : coords[i + 2];
            const endY = type === type.toLowerCase() ? currentY + coords[i + 3] : coords[i + 3];

            nodes.push({
              id: `node-${nodeIndex}`,
              x: endX,
              y: endY,
              type: 'curve',
              command: type,
              coords: coords.slice(i, i + 4),
              cp1: { x: cp1X, y: cp1Y },
              cp2: { x: cp2X, y: cp2Y },
              index: nodeIndex++
            });
            currentX = endX;
            currentY = endY;
          }
        }
        break;

      case 'h': // horizontal lineto
        for (let i = 0; i < coords.length; i++) {
          currentX = type === type.toLowerCase() ? currentX + coords[i] : coords[i];
          // Solo crear nodo si hay movimiento real
          if (coords[i] !== 0) {
            nodes.push({
              id: `node-${nodeIndex}`,
              x: currentX,
              y: currentY,
              type: 'line',
              command: type,
              coords: [coords[i]],
              index: nodeIndex++
            });
          }
        }
        break;

      case 'v': // vertical lineto
        for (let i = 0; i < coords.length; i++) {
          currentY = type === type.toLowerCase() ? currentY + coords[i] : coords[i];
          // Solo crear nodo si hay movimiento real
          if (coords[i] !== 0) {
            nodes.push({
              id: `node-${nodeIndex}`,
              x: currentX,
              y: currentY,
              type: 'line',
              command: type,
              coords: [coords[i]],
              index: nodeIndex++
            });
          }
        }
        break;

      case 'z': // closepath
        nodes.push({
          id: `node-${nodeIndex}`,
          x: startX,
          y: startY,
          type: 'close',
          command: type,
          coords: [],
          index: nodeIndex++
        });
        currentX = startX;
        currentY = startY;
        break;

      default:
        console.warn(`⚠️ Comando SVG no soportado: "${type}" en comando "${command}"`);
        break;
    }
  });

  return nodes;
};

/**
 * Reconstruye un path SVG desde los nodos
 */
export const buildPathFromNodes = (nodes) => {
  if (!nodes || nodes.length === 0) return '';

  return nodes.map(node => {
    switch (node.type) {
      case 'move':
        return `M ${node.x} ${node.y}`;
      case 'line':
        return `L ${node.x} ${node.y}`;
      case 'curve':
        return `C ${node.cp1.x} ${node.cp1.y} ${node.cp2.x} ${node.cp2.y} ${node.x} ${node.y}`;
      case 'quadratic':
        return `Q ${node.cp.x} ${node.cp.y} ${node.x} ${node.y}`;
      case 'close':
        return 'Z';
      default:
        return '';
    }
  }).join(' ');
};

/**
 * Actualiza un nodo específico en un path
 */
export const updateNodeInPath = (element, nodeIndex, newNode) => {
  if (!element || element.tagName !== 'path') return;

  const pathData = element.getAttribute('d');
  const nodes = parsePathNodes(pathData);

  if (nodeIndex >= 0 && nodeIndex < nodes.length) {
    // Preservar el tipo y comando del nodo original
    const oldNode = nodes[nodeIndex];
    nodes[nodeIndex] = {
      ...oldNode,  // Mantener todas las propiedades del nodo original
      ...newNode,  // Sobrescribir solo con las propiedades nuevas
      type: oldNode.type,  // Preservar el tipo
      command: oldNode.command,  // Preservar el comando
      index: oldNode.index  // Preservar el índice
    };
    const newPathData = buildPathFromNodes(nodes);
    element.setAttribute('d', newPathData);
  }
};

/**
 * Agrega un nuevo nodo a un path
 */
export const addNodeToPath = (element, position, nodeType = 'line') => {
  if (!element || element.tagName !== 'path') return;

  const pathData = element.getAttribute('d');
  const nodes = parsePathNodes(pathData);

  // Encontrar la posición más cercana para insertar el nodo
  let insertIndex = nodes.length;

  const newNode = {
    id: `node-${Date.now()}`,
    x: position.x,
    y: position.y,
    type: nodeType,
    command: nodeType === 'move' ? 'M' : 'L',
    coords: [position.x, position.y],
    index: insertIndex
  };

  nodes.splice(insertIndex, 0, newNode);

  const newPathData = buildPathFromNodes(nodes);
  element.setAttribute('d', newPathData);
};


/**
 * Elimina un nodo de un path
 */
export const removeNodeFromPath = (element, nodeIndex) => {
  if (!element || element.tagName !== 'path') return;

  const pathData = element.getAttribute('d');
  const nodes = parsePathNodes(pathData);

  if (nodeIndex >= 0 && nodeIndex < nodes.length && nodes.length > 2) {
    nodes.splice(nodeIndex, 1);
    const newPathData = buildPathFromNodes(nodes);
    element.setAttribute('d', newPathData);
  }
};

// ============================================================================
// MATH HELPERS FOR PATH MANIPULATION
// ============================================================================

const distanceSq = (p1, p2) => (p1.x - p2.x) ** 2 + (p1.y - p2.y) ** 2;
const distance = (p1, p2) => Math.sqrt(distanceSq(p1, p2));
const lerp = (a, b, t) => a + (b - a) * t;

/**
 * Calculates a point on a cubic Bezier curve at parameter t
 */
const getPointOnCubicBezier = (p0, cp1, cp2, p3, t) => {
  const t2 = t * t;
  const t3 = t2 * t;
  const mt = 1 - t;
  const mt2 = mt * mt;
  const mt3 = mt2 * mt;

  return {
    x: mt3 * p0.x + 3 * mt2 * t * cp1.x + 3 * mt * t2 * cp2.x + t3 * p3.x,
    y: mt3 * p0.y + 3 * mt2 * t * cp1.y + 3 * mt * t2 * cp2.y + t3 * p3.y
  };
};

/**
 * Splits a cubic Bezier curve at parameter t into two curves
 * Uses De Casteljau's algorithm
 */
const splitCubicBezier = (p0, cp1, cp2, p3, t) => {
  const x01 = lerp(p0.x, cp1.x, t);
  const y01 = lerp(p0.y, cp1.y, t);
  const x12 = lerp(cp1.x, cp2.x, t);
  const y12 = lerp(cp1.y, cp2.y, t);
  const x23 = lerp(cp2.x, p3.x, t);
  const y23 = lerp(cp2.y, p3.y, t);

  const x012 = lerp(x01, x12, t);
  const y012 = lerp(y01, y12, t);
  const x123 = lerp(x12, x23, t);
  const y123 = lerp(y12, y23, t);

  const x0123 = lerp(x012, x123, t);
  const y0123 = lerp(y012, y123, t);

  return [
    {
      cp1: { x: x01, y: y01 },
      cp2: { x: x012, y: y012 },
      end: { x: x0123, y: y0123 }
    },
    {
      cp1: { x: x123, y: y123 },
      cp2: { x: x23, y: y23 },
      end: { x: p3.x, y: p3.y }
    }
  ];
};

/**
 * Finds the closest point on a path segment to a target point
 * Returns { t, distance, x, y, segmentIndex }
 */
export const findClosestPointOnPath = (pathData, targetPoint) => {
  const nodes = parsePathNodes(pathData);
  let closest = { distance: Infinity, t: 0, segmentIndex: -1, x: 0, y: 0 };

  // Iterate through all segments
  for (let i = 1; i < nodes.length; i++) {
    const startNode = nodes[i - 1];
    const endNode = nodes[i];

    // Skip move commands (they don't draw lines)
    if (endNode.type === 'move') continue;

    let localClosest = { distance: Infinity, t: 0, x: 0, y: 0 };

    if (endNode.type === 'line' || endNode.type === 'close') {
      // Line segment projection
      const dx = endNode.x - startNode.x;
      const dy = endNode.y - startNode.y;
      const lengthSq = dx * dx + dy * dy;

      let t = 0;
      if (lengthSq > 0) {
        t = ((targetPoint.x - startNode.x) * dx + (targetPoint.y - startNode.y) * dy) / lengthSq;
        t = Math.max(0, Math.min(1, t));
      }

      const x = startNode.x + t * dx;
      const y = startNode.y + t * dy;
      localClosest = { distance: distance({ x, y }, targetPoint), t, x, y };

    } else if (endNode.type === 'curve') {
      // Cubic Bezier - approximate by sampling
      // TODO: Implement more precise algorithm?
      const steps = 20;
      for (let j = 0; j <= steps; j++) {
        const t = j / steps;
        const p = getPointOnCubicBezier(
          startNode,
          endNode.cp1 || startNode, // Fallback for shorthand if needed (though parser should handle it)
          endNode.cp2,
          endNode,
          t
        );
        const dist = distance(p, targetPoint);
        if (dist < localClosest.distance) {
          localClosest = { distance: dist, t, x: p.x, y: p.y };
        }
      }

      // Refine search around closest sample
      const refineSteps = 10;
      const range = 1 / steps;
      const startT = Math.max(0, localClosest.t - range);
      const endT = Math.min(1, localClosest.t + range);

      for (let j = 0; j <= refineSteps; j++) {
        const t = startT + (endT - startT) * (j / refineSteps);
        const p = getPointOnCubicBezier(
          startNode,
          endNode.cp1 || startNode,
          endNode.cp2,
          endNode,
          t
        );
        const dist = distance(p, targetPoint);
        if (dist < localClosest.distance) {
          localClosest = { distance: dist, t, x: p.x, y: p.y };
        }
      }
    }

    if (localClosest.distance < closest.distance) {
      closest = { ...localClosest, segmentIndex: i };
    }
  }

  return closest;
};

/**
 * Splits the path at the specified segment and parameter t
 * Inserts a new node at that position
 */
export const splitPathAtSegment = (element, segmentIndex, t) => {
  if (!element || element.tagName !== 'path') return null;

  const pathData = element.getAttribute('d');
  const nodes = parsePathNodes(pathData);

  if (segmentIndex < 1 || segmentIndex >= nodes.length) return null;

  const startNode = nodes[segmentIndex - 1];
  const targetNode = nodes[segmentIndex];

  const newNode = {
    id: `node-split-${Date.now()}`,
    type: targetNode.type,
    command: targetNode.command,
    index: segmentIndex
  };

  if (targetNode.type === 'line' || targetNode.type === 'close') {
    // Split line: straightforward
    newNode.type = 'line';
    newNode.command = 'L'; // Ensure it's a line
    newNode.x = lerp(startNode.x, targetNode.x, t);
    newNode.y = lerp(startNode.y, targetNode.y, t);

    // The original node remains as it was (endpoint)
    // We insert the new node BEFORE it
    nodes.splice(segmentIndex, 0, newNode);

  } else if (targetNode.type === 'curve') {
    // Split Bezier
    const [curve1, curve2] = splitCubicBezier(
      startNode,
      targetNode.cp1,
      targetNode.cp2,
      targetNode,
      t
    );

    // New node becomes the endpoint of the first split curve
    newNode.type = 'curve';
    newNode.command = 'C';
    newNode.x = curve1.end.x;
    newNode.y = curve1.end.y;
    newNode.cp1 = curve1.cp1;
    newNode.cp2 = curve1.cp2;

    // Modify the original target node to be the endpoint of the second split curve
    targetNode.cp1 = curve2.cp1;
    targetNode.cp2 = curve2.cp2;
    // targetNode ends at same x,y

    nodes.splice(segmentIndex, 0, newNode);
  } else {
    // Not supported split
    return null;
  }

  const newPathData = buildPathFromNodes(nodes);
  element.setAttribute('d', newPathData);
  return newNode;
};

