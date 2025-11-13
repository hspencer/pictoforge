import { SVG } from '@svgdotjs/svg.js';

/**
 * SVGWorld - Objeto "mundo" centralizado para manejo de SVG
 *
 * Resuelve el problema de transformaciones entre múltiples sistemas de coordenadas:
 * 1. Coordenadas SVG (viewBox) - El espacio de coordenadas del SVG original
 * 2. Coordenadas del viewport (pan/zoom) - La transformación aplicada por el usuario
 * 3. Coordenadas de pantalla - Las coordenadas del navegador donde ocurren eventos
 *
 * Esta clase actúa como un objeto intermedio "en memoria" que mantiene
 * la representación del estado del SVG y proporciona métodos para conversión
 * de coordenadas y manipulación de elementos de forma unificada.
 */
export class SVGWorld {
  constructor() {
    this.svgInstance = null;
    this.svgElement = null;
    this.viewport = { scale: 1, x: 0, y: 0 };
    this.containerElement = null;
  }

  /**
   * Inicializa el mundo SVG con un elemento DOM
   * @param {HTMLElement} svgElement - Elemento SVG del DOM
   * @param {HTMLElement} containerElement - Contenedor para cálculos de offset
   */
  initialize(svgElement, containerElement = null) {
    if (!svgElement) {
      throw new Error('SVGWorld: Se requiere un elemento SVG válido');
    }

    this.svgElement = svgElement;
    this.containerElement = containerElement;

    // Adoptar el elemento SVG existente con SVG.js
    this.svgInstance = SVG(svgElement);

    console.log('🌍 SVGWorld inicializado correctamente');
    return this;
  }

  /**
   * Actualiza el estado del viewport (pan/zoom)
   * @param {Object} viewport - { scale, x, y }
   */
  updateViewport(viewport) {
    if (viewport) {
      this.viewport = { ...this.viewport, ...viewport };
    }
  }

  /**
   * Convierte coordenadas de pantalla a coordenadas SVG
   * Usa la matriz de transformación del SVG (getScreenCTM) para precisión
   *
   * @param {number} screenX - Coordenada X de pantalla
   * @param {number} screenY - Coordenada Y de pantalla
   * @returns {Object} { x, y } en coordenadas SVG
   */
  screenToSVG(screenX, screenY) {
    if (!this.svgElement) {
      console.warn('SVGWorld: SVG no inicializado');
      return { x: screenX, y: screenY };
    }

    try {
      // Crear un punto SVG
      const svgPoint = this.svgElement.createSVGPoint();
      svgPoint.x = screenX;
      svgPoint.y = screenY;

      // Obtener la matriz de transformación de pantalla a SVG
      const ctm = this.svgElement.getScreenCTM();
      if (!ctm) {
        console.warn('SVGWorld: No se pudo obtener CTM');
        return { x: screenX, y: screenY };
      }

      // Transformar el punto
      const transformedPoint = svgPoint.matrixTransform(ctm.inverse());

      return {
        x: transformedPoint.x,
        y: transformedPoint.y
      };
    } catch (error) {
      console.error('SVGWorld: Error en screenToSVG', error);
      return { x: screenX, y: screenY };
    }
  }

  /**
   * Convierte coordenadas SVG a coordenadas de pantalla
   *
   * @param {number} svgX - Coordenada X en SVG
   * @param {number} svgY - Coordenada Y en SVG
   * @returns {Object} { x, y } en coordenadas de pantalla
   */
  svgToScreen(svgX, svgY) {
    if (!this.svgElement) {
      console.warn('SVGWorld: SVG no inicializado');
      return { x: svgX, y: svgY };
    }

    try {
      const svgPoint = this.svgElement.createSVGPoint();
      svgPoint.x = svgX;
      svgPoint.y = svgY;

      const ctm = this.svgElement.getScreenCTM();
      if (!ctm) {
        console.warn('SVGWorld: No se pudo obtener CTM');
        return { x: svgX, y: svgY };
      }

      const transformedPoint = svgPoint.matrixTransform(ctm);

      return {
        x: transformedPoint.x,
        y: transformedPoint.y
      };
    } catch (error) {
      console.error('SVGWorld: Error en svgToScreen', error);
      return { x: svgX, y: svgY };
    }
  }

  /**
   * Convierte un delta (diferencia) de pantalla a delta SVG
   * Útil para drag & drop y manipulación de elementos
   *
   * @param {number} deltaX - Delta X en pantalla
   * @param {number} deltaY - Delta Y en pantalla
   * @returns {Object} { dx, dy } en unidades SVG
   */
  screenDeltaToSVGDelta(deltaX, deltaY) {
    if (!this.svgElement) {
      return { dx: deltaX, dy: deltaY };
    }

    try {
      const ctm = this.svgElement.getScreenCTM();
      if (!ctm) {
        return { dx: deltaX, dy: deltaY };
      }

      // Para deltas, solo necesitamos la escala de la matriz
      // No necesitamos la traslación
      const scale = Math.sqrt(ctm.a * ctm.a + ctm.b * ctm.b);

      return {
        dx: deltaX / scale,
        dy: deltaY / scale
      };
    } catch (error) {
      console.error('SVGWorld: Error en screenDeltaToSVGDelta', error);
      return { dx: deltaX, dy: deltaY };
    }
  }

  /**
   * Encuentra un elemento por ID usando SVG.js
   * @param {string} id - ID del elemento
   * @returns {Object|null} Elemento SVG.js o null
   */
  findElementById(id) {
    if (!this.svgInstance) return null;
    return this.svgInstance.findOne(`#${id}`);
  }

  /**
   * Obtiene el elemento DOM nativo por ID
   * @param {string} id - ID del elemento
   * @returns {Element|null} Elemento DOM o null
   */
  getElementByIdDOM(id) {
    if (!this.svgElement) return null;
    return this.svgElement.querySelector(`#${id}`);
  }

  /**
   * Obtiene el bounding box de un elemento en coordenadas SVG
   * @param {Element|string} element - Elemento DOM o ID
   * @returns {Object} { x, y, width, height }
   */
  getElementBBox(element) {
    try {
      const el = typeof element === 'string'
        ? this.getElementByIdDOM(element)
        : element;

      if (!el || !el.getBBox) {
        return { x: 0, y: 0, width: 0, height: 0 };
      }

      return el.getBBox();
    } catch (error) {
      console.error('SVGWorld: Error obteniendo bbox', error);
      return { x: 0, y: 0, width: 0, height: 0 };
    }
  }

  /**
   * Aplica una transformación a un elemento usando SVG.js
   * @param {string|Element} element - ID o elemento DOM
   * @param {Object} transform - { x, y, scaleX, scaleY, rotation }
   */
  applyTransform(element, transform) {
    const el = typeof element === 'string'
      ? this.findElementById(element)
      : SVG(element);

    if (!el) return;

    try {
      const { x = 0, y = 0, scaleX = 1, scaleY = 1, rotation = 0 } = transform;

      // Usar el sistema de transformaciones de SVG.js
      el.transform({
        translateX: x,
        translateY: y,
        scaleX,
        scaleY,
        rotate: rotation
      });
    } catch (error) {
      console.error('SVGWorld: Error aplicando transformación', error);
    }
  }

  /**
   * Mueve un elemento por un delta específico
   * @param {Element} element - Elemento DOM
   * @param {number} deltaX - Delta X en unidades SVG
   * @param {number} deltaY - Delta Y en unidades SVG
   */
  moveElement(element, deltaX, deltaY) {
    if (!element) return;

    try {
      const currentTransform = element.getAttribute('transform') || '';
      const translateMatch = currentTransform.match(/translate\(([^,]+),\s*([^)]+)\)/);

      let currentX = 0;
      let currentY = 0;

      if (translateMatch) {
        currentX = parseFloat(translateMatch[1]) || 0;
        currentY = parseFloat(translateMatch[2]) || 0;
      }

      const newX = currentX + deltaX;
      const newY = currentY + deltaY;

      // Actualizar o agregar translate
      let newTransform = currentTransform;
      if (translateMatch) {
        newTransform = currentTransform.replace(
          /translate\([^)]+\)/,
          `translate(${newX}, ${newY})`
        );
      } else {
        newTransform = `translate(${newX}, ${newY}) ${currentTransform}`.trim();
      }

      element.setAttribute('transform', newTransform);
    } catch (error) {
      console.error('SVGWorld: Error moviendo elemento', error);
    }
  }

  /**
   * Limpia los recursos
   */
  destroy() {
    this.svgInstance = null;
    this.svgElement = null;
    this.containerElement = null;
    console.log('🌍 SVGWorld destruido');
  }
}

/**
 * Factory function para crear instancias de SVGWorld
 */
export function createSVGWorld() {
  return new SVGWorld();
}

export default SVGWorld;
