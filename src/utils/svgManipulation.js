/**
 * Utilidades para manipulación de elementos SVG
 */

// Re-exportar funciones de transformación de coordenadas para conveniencia
export {
  screenToSVGCoordinates,
  svgToScreenCoordinates,
  screenDeltaToSVGDelta,
  getClosestPointOnPath,
  useCoordinateTransform
} from './coordinateTransform';

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
 * Obtiene el bounding box de un elemento SVG en coordenadas SVG locales
 */
export const getElementBBox = (element) => {
  if (!element) return null;

  try {
    if (element.getBBox) {
      return element.getBBox();
    }

    // Fallback para elementos que no tienen getBBox
    const rect = element.getBoundingClientRect();
    return {
      x: rect.left,
      y: rect.top,
      width: rect.width,
      height: rect.height
    };
  } catch (error) {
    console.warn('Error getting bounding box:', error);
    return { x: 0, y: 0, width: 100, height: 100 };
  }
};

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

/**
 * Aplica una transformación a un elemento SVG
 */
export const applyTransform = (element, transform) => {
  if (!element) return;

  element.setAttribute('transform', transform);
};

/**
 * Mueve un elemento SVG
 */
export const moveElement = (element, deltaX, deltaY) => {
  if (!element) return;

  const currentTransform = element.getAttribute('transform') || '';
  const transforms = parseTransform(currentTransform);

  // Actualizar o agregar translate
  if (transforms.translate) {
    transforms.translate[0] += deltaX;
    transforms.translate[1] += deltaY;
  } else {
    transforms.translate = [deltaX, deltaY];
  }

  applyTransform(element, serializeTransform(transforms));
};

/**
 * Escala un elemento SVG
 */
export const scaleElement = (element, scaleX, scaleY, originX = 0, originY = 0) => {
  if (!element) return;

  const currentTransform = element.getAttribute('transform') || '';
  const transforms = parseTransform(currentTransform);

  // Actualizar o agregar scale
  if (transforms.scale) {
    transforms.scale[0] *= scaleX;
    transforms.scale[1] *= scaleY;
  } else {
    transforms.scale = [scaleX, scaleY];
  }

  applyTransform(element, serializeTransform(transforms));
};

/**
 * Rota un elemento SVG
 */
export const rotateElement = (element, angle, originX = 0, originY = 0) => {
  if (!element) return;

  const currentTransform = element.getAttribute('transform') || '';
  const transforms = parseTransform(currentTransform);

  // Actualizar o agregar rotate
  if (transforms.rotate) {
    transforms.rotate[0] += angle;
    // Mantener el origen de rotación
    if (transforms.rotate.length === 3) {
      transforms.rotate[1] = originX;
      transforms.rotate[2] = originY;
    } else {
      transforms.rotate = [transforms.rotate[0], originX, originY];
    }
  } else {
    transforms.rotate = [angle, originX, originY];
  }

  applyTransform(element, serializeTransform(transforms));
};

/**
 * Parsea un path SVG y extrae los nodos
 */
export const parsePathNodes = (pathData) => {
  if (!pathData) return [];
  
  const nodes = [];
  const commands = pathData.match(/[MmLlHhVvCcSsQqTtAaZz][^MmLlHhVvCcSsQqTtAaZz]*/g) || [];
  
  let currentX = 0, currentY = 0;
  let startX = 0, startY = 0;
  
  commands.forEach((command, index) => {
    const type = command[0];
    const coords = command.slice(1).trim().split(/[\s,]+/).map(Number).filter(n => !isNaN(n));
    
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
        
      case 'l': // lineto
        if (coords.length >= 2) {
          currentX = type === type.toLowerCase() ? currentX + coords[0] : coords[0];
          currentY = type === type.toLowerCase() ? currentY + coords[1] : coords[1];
          nodes.push({
            id: `node-${index}`,
            x: currentX,
            y: currentY,
            type: 'line',
            command: type,
            coords: coords,
            index
          });
        }
        break;
        
      case 'c': // curveto
        if (coords.length >= 6) {
          const cp1X = type === type.toLowerCase() ? currentX + coords[0] : coords[0];
          const cp1Y = type === type.toLowerCase() ? currentY + coords[1] : coords[1];
          const cp2X = type === type.toLowerCase() ? currentX + coords[2] : coords[2];
          const cp2Y = type === type.toLowerCase() ? currentY + coords[3] : coords[3];
          const endX = type === type.toLowerCase() ? currentX + coords[4] : coords[4];
          const endY = type === type.toLowerCase() ? currentY + coords[5] : coords[5];
          
          nodes.push({
            id: `node-${index}`,
            x: endX,
            y: endY,
            type: 'curve',
            command: type,
            coords: coords,
            cp1: { x: cp1X, y: cp1Y },
            cp2: { x: cp2X, y: cp2Y },
            index
          });
          currentX = endX;
          currentY = endY;
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
