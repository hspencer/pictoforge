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

  // Logging diagnóstico para debug
  console.log('🔍 parsePathNodes: Iniciando parseo', {
    pathData,
    totalCommands: commands.length,
    commands: commands
  });

  let currentX = 0, currentY = 0;
  let startX = 0, startY = 0;

  commands.forEach((command, index) => {
    const type = command[0];
    // Usar regex más robusto que maneja números negativos consecutivos
    const coordString = command.slice(1).trim();
    const coords = (coordString.match(/-?\d*\.?\d+/g) || []).map(Number).filter(n => !isNaN(n));

    console.log(`  📌 Comando ${index}: "${command}" → type="${type}", coords=[${coords.join(', ')}]`);
    console.log(`     Estado actual: currentX=${currentX.toFixed(2)}, currentY=${currentY.toFixed(2)}`);
    
    switch (type.toLowerCase()) {
      case 'm': // moveto
        if (coords.length >= 2) {
          currentX = type === type.toLowerCase() ? currentX + coords[0] : coords[0];
          currentY = type === type.toLowerCase() ? currentY + coords[1] : coords[1];
          startX = currentX;
          startY = currentY;
          nodes.push({
            id: `node-${index}`,
            x: currentX,
            y: currentY,
            type: 'move',
            command: type,
            coords: coords,
            index
          });
        }
        break;
        
      case 'l': // lineto - puede tener múltiples pares de coordenadas
        for (let i = 0; i < coords.length; i += 2) {
          if (i + 1 < coords.length) {
            currentX = type === type.toLowerCase() ? currentX + coords[i] : coords[i];
            currentY = type === type.toLowerCase() ? currentY + coords[i + 1] : coords[i + 1];
            nodes.push({
              id: `node-${index}-${i/2}`,
              x: currentX,
              y: currentY,
              type: 'line',
              command: type,
              coords: [coords[i], coords[i + 1]],
              index: index + i/2
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
              id: `node-${index}-${i/6}`,
              x: endX,
              y: endY,
              type: 'curve',
              command: type,
              coords: coords.slice(i, i + 6),
              cp1: { x: cp1X, y: cp1Y },
              cp2: { x: cp2X, y: cp2Y },
              index: index + i/6
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
            id: `node-${index}`,
            x: endX,
            y: endY,
            type: 'quadratic',
            command: type,
            coords: coords,
            cp: { x: cpX, y: cpY },
            index
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
              id: `node-${index}-${i/4}`,
              x: endX,
              y: endY,
              type: 'curve',
              command: type,
              coords: coords.slice(i, i + 4),
              cp1: { x: cp1X, y: cp1Y },
              cp2: { x: cp2X, y: cp2Y },
              index: index + i/4
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
              id: `node-${index}-${i}`,
              x: currentX,
              y: currentY,
              type: 'line',
              command: type,
              coords: [coords[i]],
              index: index + i
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
              id: `node-${index}-${i}`,
              x: currentX,
              y: currentY,
              type: 'line',
              command: type,
              coords: [coords[i]],
              index: index + i
            });
          }
        }
        break;

      case 'z': // closepath
        nodes.push({
          id: `node-${index}`,
          x: startX,
          y: startY,
          type: 'close',
          command: type,
          coords: [],
          index
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
    nodes[nodeIndex] = { ...nodes[nodeIndex], ...newNode };
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
