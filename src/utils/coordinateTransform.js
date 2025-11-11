/**
 * Utilidades para transformación de coordenadas entre pantalla y SVG
 * Maneja zoom, pan y transformaciones del viewport
 */

/**
 * Obtiene la matriz de transformación CTM (Current Transformation Matrix) de un elemento SVG
 * @param {SVGElement} element - Elemento SVG
 * @returns {DOMMatrix} Matriz de transformación
 */
export const getCTM = (element) => {
  if (!element) return new DOMMatrix();

  try {
    // Para elementos SVG, usar getCTM() que devuelve la matriz acumulada
    if (element.getCTM) {
      return element.getCTM();
    }
    // Para el elemento raíz SVG, crear matriz identidad
    if (element.tagName === 'svg') {
      return element.createSVGMatrix ? element.createSVGMatrix() : new DOMMatrix();
    }
  } catch (error) {
    console.warn('Error obteniendo CTM:', error);
  }

  return new DOMMatrix();
};

/**
 * Convierte coordenadas de pantalla a coordenadas del SVG
 * Toma en cuenta zoom, pan y viewBox del SVG
 *
 * @param {number} screenX - Coordenada X de pantalla (clientX)
 * @param {number} screenY - Coordenada Y de pantalla (clientY)
 * @param {SVGSVGElement} svgElement - Elemento SVG raíz
 * @param {Object} viewport - Objeto con zoom y pan {zoom: number, pan: {x, y}}
 * @returns {Object} Coordenadas SVG {x, y}
 */
export const screenToSVGCoordinates = (screenX, screenY, svgElement, viewport = { zoom: 1, pan: { x: 0, y: 0 } }) => {
  if (!svgElement) {
    return { x: screenX, y: screenY };
  }

  try {
    // Crear un punto SVG
    let point;
    if (svgElement.createSVGPoint) {
      point = svgElement.createSVGPoint();
    } else {
      // Fallback para navegadores que no soportan createSVGPoint
      point = { x: 0, y: 0 };
    }

    // Obtener el bounding rect del SVG en la pantalla
    const rect = svgElement.getBoundingClientRect();

    // Ajustar por la posición del SVG en la pantalla
    const relativeX = screenX - rect.left;
    const relativeY = screenY - rect.top;

    // Ajustar por zoom y pan
    // Primero, revertir el pan
    const unPannedX = relativeX - viewport.pan.x;
    const unPannedY = relativeY - viewport.pan.y;

    // Luego, revertir el zoom (dividir por el zoom)
    const unZoomedX = unPannedX / viewport.zoom;
    const unZoomedY = unPannedY / viewport.zoom;

    // Ajustar por el centro del contenedor para el zoom
    const centerX = rect.width / 2;
    const centerY = rect.height / 2;

    const adjustedX = unZoomedX + centerX * (1 / viewport.zoom - 1);
    const adjustedY = unZoomedY + centerY * (1 / viewport.zoom - 1);

    // Si el SVG tiene un viewBox, necesitamos transformar adicionalmente
    const viewBox = svgElement.viewBox.baseVal;
    if (viewBox && viewBox.width && viewBox.height) {
      // Calcular la escala del viewBox
      const scaleX = viewBox.width / rect.width;
      const scaleY = viewBox.height / rect.height;

      return {
        x: adjustedX * scaleX + viewBox.x,
        y: adjustedY * scaleY + viewBox.y
      };
    }

    // Si no hay viewBox, usar las coordenadas ajustadas directamente
    return {
      x: adjustedX,
      y: adjustedY
    };

  } catch (error) {
    console.error('Error convirtiendo coordenadas pantalla a SVG:', error);
    return { x: screenX, y: screenY };
  }
};

/**
 * Convierte coordenadas del SVG a coordenadas de pantalla
 *
 * @param {number} svgX - Coordenada X del SVG
 * @param {number} svgY - Coordenada Y del SVG
 * @param {SVGSVGElement} svgElement - Elemento SVG raíz
 * @param {Object} viewport - Objeto con zoom y pan {zoom: number, pan: {x, y}}
 * @returns {Object} Coordenadas de pantalla {x, y}
 */
export const svgToScreenCoordinates = (svgX, svgY, svgElement, viewport = { zoom: 1, pan: { x: 0, y: 0 } }) => {
  if (!svgElement) {
    return { x: svgX, y: svgY };
  }

  try {
    const rect = svgElement.getBoundingClientRect();

    // Si hay viewBox, transformar primero
    const viewBox = svgElement.viewBox.baseVal;
    let adjustedX = svgX;
    let adjustedY = svgY;

    if (viewBox && viewBox.width && viewBox.height) {
      // Calcular la escala del viewBox
      const scaleX = rect.width / viewBox.width;
      const scaleY = rect.height / viewBox.height;

      adjustedX = (svgX - viewBox.x) * scaleX;
      adjustedY = (svgY - viewBox.y) * scaleY;
    }

    // Ajustar por el centro del contenedor para el zoom
    const centerX = rect.width / 2;
    const centerY = rect.height / 2;

    const centeredX = adjustedX - centerX * (1 / viewport.zoom - 1);
    const centeredY = adjustedY - centerY * (1 / viewport.zoom - 1);

    // Aplicar zoom
    const zoomedX = centeredX * viewport.zoom;
    const zoomedY = centeredY * viewport.zoom;

    // Aplicar pan
    const screenX = zoomedX + viewport.pan.x + rect.left;
    const screenY = zoomedY + viewport.pan.y + rect.top;

    return {
      x: screenX,
      y: screenY
    };

  } catch (error) {
    console.error('Error convirtiendo coordenadas SVG a pantalla:', error);
    return { x: svgX, y: svgY };
  }
};

/**
 * Convierte un delta de pantalla a delta de SVG (para arrastrar elementos)
 *
 * @param {number} deltaScreenX - Delta X en pantalla
 * @param {number} deltaScreenY - Delta Y en pantalla
 * @param {SVGSVGElement} svgElement - Elemento SVG raíz
 * @param {Object} viewport - Objeto con zoom y pan
 * @returns {Object} Delta en coordenadas SVG {dx, dy}
 */
export const screenDeltaToSVGDelta = (deltaScreenX, deltaScreenY, svgElement, viewport = { zoom: 1, pan: { x: 0, y: 0 } }) => {
  if (!svgElement) {
    return { dx: deltaScreenX, dy: deltaScreenY };
  }

  try {
    const rect = svgElement.getBoundingClientRect();
    const viewBox = svgElement.viewBox.baseVal;

    // Ajustar por zoom
    let dx = deltaScreenX / viewport.zoom;
    let dy = deltaScreenY / viewport.zoom;

    // Si hay viewBox, ajustar por la escala
    if (viewBox && viewBox.width && viewBox.height) {
      const scaleX = viewBox.width / rect.width;
      const scaleY = viewBox.height / rect.height;

      dx *= scaleX;
      dy *= scaleY;
    }

    return { dx, dy };

  } catch (error) {
    console.error('Error convirtiendo delta:', error);
    return { dx: deltaScreenX, dy: deltaScreenY };
  }
};

/**
 * Obtiene las coordenadas locales de un elemento SVG
 * Útil para obtener la posición de un elemento en su sistema de coordenadas
 *
 * @param {SVGElement} element - Elemento SVG
 * @returns {Object} Coordenadas locales {x, y, width, height}
 */
export const getLocalCoordinates = (element) => {
  if (!element) return { x: 0, y: 0, width: 0, height: 0 };

  try {
    // Para elementos con getBBox
    if (element.getBBox) {
      const bbox = element.getBBox();
      return {
        x: bbox.x,
        y: bbox.y,
        width: bbox.width,
        height: bbox.height
      };
    }

    // Fallback para elementos sin getBBox
    const x = parseFloat(element.getAttribute('x') || '0');
    const y = parseFloat(element.getAttribute('y') || '0');
    const width = parseFloat(element.getAttribute('width') || '0');
    const height = parseFloat(element.getAttribute('height') || '0');

    return { x, y, width, height };

  } catch (error) {
    console.warn('Error obteniendo coordenadas locales:', error);
    return { x: 0, y: 0, width: 0, height: 0 };
  }
};

/**
 * Transforma un punto usando la matriz CTM de un elemento
 *
 * @param {Object} point - Punto {x, y}
 * @param {SVGElement} element - Elemento SVG
 * @returns {Object} Punto transformado {x, y}
 */
export const transformPoint = (point, element) => {
  if (!element || !point) return point;

  try {
    const ctm = getCTM(element);

    // Transformar el punto usando la matriz
    const transformed = {
      x: ctm.a * point.x + ctm.c * point.y + ctm.e,
      y: ctm.b * point.x + ctm.d * point.y + ctm.f
    };

    return transformed;

  } catch (error) {
    console.warn('Error transformando punto:', error);
    return point;
  }
};

/**
 * Obtiene el punto más cercano en un path a unas coordenadas dadas
 *
 * @param {SVGPathElement} pathElement - Elemento path
 * @param {Object} point - Coordenadas {x, y}
 * @returns {Object} Información del punto más cercano {point: {x, y}, distance: number, t: number}
 */
export const getClosestPointOnPath = (pathElement, point) => {
  if (!pathElement || pathElement.tagName !== 'path') {
    return null;
  }

  try {
    const pathLength = pathElement.getTotalLength();
    let closestPoint = null;
    let minDistance = Infinity;
    let closestT = 0;

    // Muestrear el path en múltiples puntos
    const samples = Math.min(Math.ceil(pathLength), 100);

    for (let i = 0; i <= samples; i++) {
      const t = (i / samples) * pathLength;
      const pathPoint = pathElement.getPointAtLength(t);

      const dx = pathPoint.x - point.x;
      const dy = pathPoint.y - point.y;
      const distance = Math.sqrt(dx * dx + dy * dy);

      if (distance < minDistance) {
        minDistance = distance;
        closestPoint = { x: pathPoint.x, y: pathPoint.y };
        closestT = t;
      }
    }

    return {
      point: closestPoint,
      distance: minDistance,
      t: closestT,
      normalizedT: closestT / pathLength
    };

  } catch (error) {
    console.warn('Error encontrando punto más cercano en path:', error);
    return null;
  }
};

/**
 * Hook de utilidad para usar transformaciones de coordenadas en componentes React
 *
 * @param {RefObject} svgRef - Referencia al elemento SVG
 * @param {Object} viewport - Estado del viewport {zoom, pan}
 * @returns {Object} Funciones de transformación
 */
export const useCoordinateTransform = (svgRef, viewport) => {
  const screenToSVG = (screenX, screenY) => {
    const svgElement = svgRef.current?.querySelector('svg');
    return screenToSVGCoordinates(screenX, screenY, svgElement, viewport);
  };

  const svgToScreen = (svgX, svgY) => {
    const svgElement = svgRef.current?.querySelector('svg');
    return svgToScreenCoordinates(svgX, svgY, svgElement, viewport);
  };

  const screenDeltaToSVG = (deltaX, deltaY) => {
    const svgElement = svgRef.current?.querySelector('svg');
    return screenDeltaToSVGDelta(deltaX, deltaY, svgElement, viewport);
  };

  return {
    screenToSVG,
    svgToScreen,
    screenDeltaToSVG
  };
};