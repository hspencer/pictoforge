import { optimize } from 'svgo';

/**
 * SVGOptimizer Service
 *
 * Servicio para optimizar SVG usando SVGO antes de la exportación.
 * Reduce el tamaño del archivo, mejora el rendimiento y asegura
 * estándares de calidad en la salida.
 *
 * Características:
 * - Reducción de precisión decimal (floatPrecision)
 * - Eliminación de atributos innecesarios
 * - Preservación de metadatos de accesibilidad (title, desc)
 * - Configuración personalizable
 */

/**
 * Configuración por defecto de SVGO
 */
const DEFAULT_CONFIG = {
  // Opciones globales
  floatPrecision: 4, // Reducir decimales a 4 dígitos
  multipass: true, // Múltiples pasadas de optimización

  // Plugins de optimización
  plugins: [
    // Preservar estructura básica
    {
      name: 'preset-default',
      params: {
        overrides: {
          // Preservar viewBox (crítico para responsive)
          removeViewBox: false,

          // Preservar IDs (necesarios para selección y manipulación)
          cleanupIds: false,

          // Preservar metadatos de accesibilidad
          removeTitle: false,
          removeDesc: false,

          // Preservar atributos de datos personalizados
          removeUnknownsAndDefaults: {
            keepDataAttrs: true,
            keepAriaAttrs: true,
            keepRoleAttr: true,
          },

          // Convertir colores a formato corto
          convertColors: {
            currentColor: true,
            names2hex: true,
            rgb2hex: true,
            shorthex: true,
            shortname: true,
          },

          // Reducir precisión de transformaciones
          convertTransform: {
            floatPrecision: 4,
          },

          // Reducir precisión de paths
          convertPathData: {
            floatPrecision: 4,
            transformPrecision: 5,
            removeUseless: true,
            convertToQ: true,
            convertToZ: true,
            straightCurves: true,
            lineShorthands: true,
            curveSmoothShorthands: true,
            utilizeAbsolute: true,
          },
        },
      },
    },

    // Limpiar atributos vacíos
    'removeEmptyAttrs',

    // Remover comentarios
    'removeComments',

    // Remover metadatos innecesarios (pero preservar title/desc)
    'removeMetadata',

    // Remover elementos ocultos
    'removeHiddenElems',

    // Simplificar estilos
    'minifyStyles',

    // Ordenar atributos para mejor compresión
    'sortAttrs',

    // Redondear números
    {
      name: 'cleanupNumericValues',
      params: {
        floatPrecision: 4,
      },
    },
  ],
};

/**
 * Clase SVGOptimizer
 */
export class SVGOptimizer {
  constructor(config = {}) {
    this.config = {
      ...DEFAULT_CONFIG,
      ...config,
      plugins: config.plugins || DEFAULT_CONFIG.plugins,
    };
  }

  /**
   * Optimiza un string SVG
   *
   * @param {string} svgString - Cadena SVG a optimizar
   * @param {Object} options - Opciones de optimización específicas
   * @returns {Promise<{data: string, info: Object}>}
   */
  async optimize(svgString, options = {}) {
    try {
      const config = {
        ...this.config,
        ...options,
      };

      const result = optimize(svgString, config);

      return {
        data: result.data,
        info: {
          originalSize: svgString.length,
          optimizedSize: result.data.length,
          reduction: svgString.length - result.data.length,
          reductionPercent: (
            ((svgString.length - result.data.length) / svgString.length) *
            100
          ).toFixed(2),
        },
      };
    } catch (error) {
      console.error('❌ SVGOptimizer Error:', error);
      throw new Error(`Failed to optimize SVG: ${error.message}`);
    }
  }

  /**
   * Optimiza con configuración personalizada
   *
   * @param {string} svgString
   * @param {Object} customConfig
   * @returns {Promise<{data: string, info: Object}>}
   */
  async optimizeWithConfig(svgString, customConfig) {
    return this.optimize(svgString, customConfig);
  }

  /**
   * Optimización agresiva (máxima reducción de tamaño)
   *
   * @param {string} svgString
   * @returns {Promise<{data: string, info: Object}>}
   */
  async optimizeAgressive(svgString) {
    const aggressiveConfig = {
      floatPrecision: 2,
      plugins: [
        {
          name: 'preset-default',
          params: {
            overrides: {
              cleanupIds: {
                remove: true,
                minify: true,
                preserve: [],
              },
              removeViewBox: false,
              convertPathData: {
                floatPrecision: 2,
                transformPrecision: 3,
              },
            },
          },
        },
      ],
    };

    return this.optimize(svgString, aggressiveConfig);
  }

  /**
   * Optimización conservadora (preserva más información)
   *
   * @param {string} svgString
   * @returns {Promise<{data: string, info: Object}>}
   */
  async optimizeConservative(svgString) {
    const conservativeConfig = {
      floatPrecision: 6,
      plugins: [
        {
          name: 'preset-default',
          params: {
            overrides: {
              cleanupIds: false,
              removeViewBox: false,
              removeTitle: false,
              removeDesc: false,
              convertPathData: {
                floatPrecision: 6,
                transformPrecision: 7,
              },
            },
          },
        },
      ],
    };

    return this.optimize(svgString, conservativeConfig);
  }

  /**
   * Añadir o actualizar metadatos de accesibilidad
   *
   * @param {string} svgString
   * @param {Object} metadata - { title: string, desc: string, lang: string }
   * @returns {string}
   */
  addAccessibilityMetadata(svgString, metadata = {}) {
    const parser = new DOMParser();
    const doc = parser.parseFromString(svgString, 'image/svg+xml');
    const svg = doc.documentElement;

    // Añadir o actualizar role="img" para accesibilidad
    if (!svg.hasAttribute('role')) {
      svg.setAttribute('role', 'img');
    }

    // Añadir o actualizar lang
    if (metadata.lang && !svg.hasAttribute('lang')) {
      svg.setAttribute('lang', metadata.lang);
    }

    // Generar ID único para aria-labelledby y aria-describedby
    const titleId = `svg-title-${Date.now()}`;
    const descId = `svg-desc-${Date.now()}`;

    // Manejar <title>
    if (metadata.title) {
      let titleElement = svg.querySelector('title');
      if (!titleElement) {
        titleElement = doc.createElementNS('http://www.w3.org/2000/svg', 'title');
        svg.insertBefore(titleElement, svg.firstChild);
      }
      titleElement.textContent = metadata.title;
      titleElement.setAttribute('id', titleId);
      svg.setAttribute('aria-labelledby', titleId);
    }

    // Manejar <desc>
    if (metadata.desc) {
      let descElement = svg.querySelector('desc');
      if (!descElement) {
        descElement = doc.createElementNS('http://www.w3.org/2000/svg', 'desc');
        // Insertar después de <title> si existe
        const titleElement = svg.querySelector('title');
        if (titleElement) {
          titleElement.after(descElement);
        } else {
          svg.insertBefore(descElement, svg.firstChild);
        }
      }
      descElement.textContent = metadata.desc;
      descElement.setAttribute('id', descId);

      // Combinar aria-labelledby y aria-describedby
      if (metadata.title) {
        svg.setAttribute('aria-labelledby', `${titleId} ${descId}`);
      } else {
        svg.setAttribute('aria-describedby', descId);
      }
    }

    // Serializar de vuelta a string
    const serializer = new XMLSerializer();
    return serializer.serializeToString(svg);
  }

  /**
   * Pipeline completo: añadir metadatos + optimizar
   *
   * @param {string} svgString
   * @param {Object} metadata
   * @param {Object} optimizeOptions
   * @returns {Promise<{data: string, info: Object}>}
   */
  async processForExport(svgString, metadata = {}, optimizeOptions = {}) {
    try {
      // 1. Añadir metadatos de accesibilidad
      let processedSvg = svgString;
      if (metadata.title || metadata.desc || metadata.lang) {
        processedSvg = this.addAccessibilityMetadata(svgString, metadata);
        console.log('✅ Metadata de accesibilidad añadidos');
      }

      // 2. Optimizar con SVGO
      const result = await this.optimize(processedSvg, optimizeOptions);

      console.log('✅ SVG Optimizado:', {
        originalSize: `${result.info.originalSize} bytes`,
        optimizedSize: `${result.info.optimizedSize} bytes`,
        reduction: `${result.info.reduction} bytes (${result.info.reductionPercent}%)`,
      });

      return result;
    } catch (error) {
      console.error('❌ Error en processForExport:', error);
      throw error;
    }
  }

  /**
   * Obtener configuración actual
   */
  getConfig() {
    return { ...this.config };
  }

  /**
   * Actualizar configuración
   */
  updateConfig(newConfig) {
    this.config = {
      ...this.config,
      ...newConfig,
    };
  }
}

/**
 * Factory function para crear instancia de SVGOptimizer
 *
 * @param {Object} config - Configuración personalizada
 * @returns {SVGOptimizer}
 */
export function createSVGOptimizer(config = {}) {
  return new SVGOptimizer(config);
}

/**
 * Función de conveniencia para optimización rápida
 *
 * @param {string} svgString
 * @param {Object} options
 * @returns {Promise<string>}
 */
export async function optimizeSVG(svgString, options = {}) {
  const optimizer = createSVGOptimizer();
  const result = await optimizer.optimize(svgString, options);
  return result.data;
}

export default SVGOptimizer;
