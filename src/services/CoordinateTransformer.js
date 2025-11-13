/**
 * CoordinateTransformer Service
 *
 * Servicio centralizado para conversión de coordenadas entre espacios de coordenadas.
 * Consume el estado de Panning y Zoom de @panzoom/panzoom y proporciona transformaciones
 * bidireccionales entre coordenadas de pantalla y coordenadas SVG del usuario.
 *
 * Espacios de coordenadas:
 * - Screen Space: Coordenadas del navegador relativas a la ventana
 * - Client Space: Coordenadas relativas al contenedor SVG
 * - SVG User Space: Coordenadas del sistema de coordenadas del viewBox del SVG
 */

export class CoordinateTransformer {
  /**
   * @param {Object} config - Configuración inicial
   * @param {HTMLElement} config.svgElement - Elemento SVG para transformaciones
   */
  constructor(config = {}) {
    this.svgElement = config.svgElement || null;

    // Estado de transformación de panzoom
    this.panzoomState = {
      scale: 1,        // Factor de zoom actual
      x: 0,            // Traslación X en píxeles
      y: 0,            // Traslación Y en píxeles
    };

    // Dimensiones del contenedor y viewBox
    this.containerDimensions = {
      width: 0,
      height: 0,
    };

    this.viewBox = {
      x: 0,
      y: 0,
      width: 100,
      height: 100,
    };
  }

  /**
   * Actualiza el elemento SVG de referencia
   * @param {SVGSVGElement} svgElement - Elemento SVG
   */
  setSvgElement(svgElement) {
    this.svgElement = svgElement;

    if (svgElement) {
      this.updateViewBox();
      this.updateContainerDimensions();
    }
  }

  /**
   * Actualiza el estado de panzoom (debe ser llamado cuando cambia el zoom/pan)
   * @param {Object} state - Estado de panzoom { scale, x, y }
   */
  updatePanzoomState(state) {
    this.panzoomState = {
      scale: state.scale || 1,
      x: state.x || 0,
      y: state.y || 0,
    };
  }

  /**
   * Actualiza el viewBox desde el elemento SVG
   */
  updateViewBox() {
    if (!this.svgElement) return;

    const viewBoxAttr = this.svgElement.getAttribute('viewBox');
    if (viewBoxAttr) {
      const [x, y, width, height] = viewBoxAttr.split(' ').map(Number);
      this.viewBox = { x, y, width, height };
    } else {
      // Fallback a dimensiones del elemento
      const bbox = this.svgElement.getBBox();
      this.viewBox = {
        x: bbox.x,
        y: bbox.y,
        width: bbox.width || 100,
        height: bbox.height || 100,
      };
    }
  }

  /**
   * Actualiza las dimensiones del contenedor
   */
  updateContainerDimensions() {
    if (!this.svgElement) return;

    const rect = this.svgElement.getBoundingClientRect();
    this.containerDimensions = {
      width: rect.width,
      height: rect.height,
    };
  }

  /**
   * Convierte coordenadas de pantalla a coordenadas SVG del usuario
   * Esta es la función crítica que implementa la transformación inversa
   *
   * @param {number} screenX - Coordenada X de pantalla
   * @param {number} screenY - Coordenada Y de pantalla
   * @returns {Object} { x, y } - Coordenadas en el espacio del usuario SVG
   */
  screenToSvg(screenX, screenY) {
    if (!this.svgElement) {
      console.warn('CoordinateTransformer: SVG element not set');
      return { x: 0, y: 0 };
    }

    // 1. Convertir coordenadas de pantalla a coordenadas del cliente (relativas al contenedor)
    const rect = this.svgElement.getBoundingClientRect();
    const clientX = screenX - rect.left;
    const clientY = screenY - rect.top;

    // 2. Aplicar la transformación inversa de panzoom
    // Fórmula: svgCoord = (clientCoord - translation) / scale
    const { scale, x: panX, y: panY } = this.panzoomState;

    const transformedX = (clientX - panX) / scale;
    const transformedY = (clientY - panY) / scale;

    // 3. Convertir de coordenadas del contenedor a coordenadas del viewBox
    // Ratio entre el tamaño del contenedor y el viewBox
    const { width: containerWidth, height: containerHeight } = this.containerDimensions;
    const { x: vbX, y: vbY, width: vbWidth, height: vbHeight } = this.viewBox;

    const svgX = vbX + (transformedX / containerWidth) * vbWidth;
    const svgY = vbY + (transformedY / containerHeight) * vbHeight;

    return { x: svgX, y: svgY };
  }

  /**
   * Convierte coordenadas SVG del usuario a coordenadas de pantalla
   * Transformación directa (inversa de screenToSvg)
   *
   * @param {number} svgX - Coordenada X en el espacio del usuario SVG
   * @param {number} svgY - Coordenada Y en el espacio del usuario SVG
   * @returns {Object} { x, y } - Coordenadas de pantalla
   */
  svgToScreen(svgX, svgY) {
    if (!this.svgElement) {
      console.warn('CoordinateTransformer: SVG element not set');
      return { x: 0, y: 0 };
    }

    const rect = this.svgElement.getBoundingClientRect();
    const { scale, x: panX, y: panY } = this.panzoomState;
    const { width: containerWidth, height: containerHeight } = this.containerDimensions;
    const { x: vbX, y: vbY, width: vbWidth, height: vbHeight } = this.viewBox;

    // 1. Convertir de coordenadas viewBox a coordenadas del contenedor
    const containerX = ((svgX - vbX) / vbWidth) * containerWidth;
    const containerY = ((svgY - vbY) / vbHeight) * containerHeight;

    // 2. Aplicar transformación de panzoom
    const transformedX = containerX * scale + panX;
    const transformedY = containerY * scale + panY;

    // 3. Convertir a coordenadas de pantalla
    const screenX = transformedX + rect.left;
    const screenY = transformedY + rect.top;

    return { x: screenX, y: screenY };
  }

  /**
   * Convierte un delta (diferencia) de pantalla a delta SVG
   * Útil para operaciones de arrastre
   *
   * @param {number} deltaScreenX - Delta X de pantalla
   * @param {number} deltaScreenY - Delta Y de pantalla
   * @returns {Object} { dx, dy } - Delta en coordenadas SVG
   */
  screenDeltaToSvgDelta(deltaScreenX, deltaScreenY) {
    const { scale } = this.panzoomState;
    const { width: containerWidth, height: containerHeight } = this.containerDimensions;
    const { width: vbWidth, height: vbHeight } = this.viewBox;

    // Aplicar escala inversa y ratio viewBox/container
    const dx = (deltaScreenX / scale) * (vbWidth / containerWidth);
    const dy = (deltaScreenY / scale) * (vbHeight / containerHeight);

    return { dx, dy };
  }

  /**
   * Obtiene información de debug del estado actual
   * @returns {Object} Estado actual del transformador
   */
  getDebugInfo() {
    return {
      panzoomState: { ...this.panzoomState },
      containerDimensions: { ...this.containerDimensions },
      viewBox: { ...this.viewBox },
      hasSvgElement: !!this.svgElement,
    };
  }

  /**
   * Resetea el estado del transformador
   */
  reset() {
    this.panzoomState = { scale: 1, x: 0, y: 0 };
    this.updateViewBox();
    this.updateContainerDimensions();
  }
}

/**
 * Factory function para crear una instancia del transformador
 * @param {Object} config - Configuración inicial
 * @returns {CoordinateTransformer} Nueva instancia del transformador
 */
export function createCoordinateTransformer(config) {
  return new CoordinateTransformer(config);
}

export default CoordinateTransformer;
