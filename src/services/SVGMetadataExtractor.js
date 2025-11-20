/**
 * SVGMetadataExtractor
 *
 * Utilidad para extraer metadata de SVGs self-contained.
 * Los SVGs de PictoForge incluyen toda la información semántica:
 * - <metadata> con NLU Schema JSON completo
 * - <title> y <desc> con descripción
 * - <style> con CSS
 * - Atributos data-* con roles semánticos
 * - IDs semánticos en elementos
 *
 * Esta clase NO modifica el SVG, solo extrae información
 * para crear índices de búsqueda en IndexedDB.
 */

export class SVGMetadataExtractor {
  /**
   * Extrae toda la metadata de un SVG string
   * @param {string} svgString - SVG completo como string
   * @returns {Object} Metadata extraída
   */
  static parse(svgString) {
    if (!svgString || typeof svgString !== 'string') {
      return null;
    }

    try {
      const parser = new DOMParser();
      const doc = parser.parseFromString(svgString, 'image/svg+xml');

      // Verificar si hay errores de parsing
      const parserError = doc.querySelector('parsererror');
      if (parserError) {
        console.error('SVG parsing error:', parserError.textContent);
        return null;
      }

      const svg = doc.querySelector('svg');
      if (!svg) {
        console.error('No SVG element found');
        return null;
      }

      // Extraer metadata JSON embebido
      const metadataEl = svg.querySelector('metadata');
      let nluSchema = null;
      if (metadataEl) {
        try {
          const jsonText = metadataEl.textContent.trim();
          nluSchema = JSON.parse(jsonText);
        } catch (e) {
          console.warn('Could not parse <metadata> JSON:', e.message);
        }
      }

      // Extraer información básica
      const title = svg.querySelector('title')?.textContent?.trim();
      const desc = svg.querySelector('desc')?.textContent?.trim();
      const styles = svg.querySelector('style')?.textContent;

      // Extraer atributos del SVG root
      const svgId = svg.getAttribute('id');
      const viewBox = svg.getAttribute('viewBox');
      const domain = svg.getAttribute('data-domain');
      const intent = svg.getAttribute('data-intent');
      const utterance = svg.getAttribute('data-utterance');
      const lang = svg.getAttribute('lang');

      // Extraer conceptos del NLU Schema
      const concepts = nluSchema?.concepts?.map(c => c.id) || [];

      // Extraer elementos con IDs semánticos (groups y paths principales)
      const elements = Array.from(svg.querySelectorAll('[id]'))
        .filter(el => {
          const id = el.getAttribute('id');
          // Filtrar elementos técnicos
          return id && !['title', 'desc', 'defs'].includes(id);
        })
        .map(el => ({
          id: el.getAttribute('id'),
          tagName: el.tagName,
          role: el.getAttribute('data-role'),
          concept: el.getAttribute('data-concept'),
          ariaLabel: el.getAttribute('aria-label')
        }));

      return {
        // Información básica para índices
        utterance: nluSchema?.utterance?.text || utterance || title,
        domain: domain,
        intent: intent || nluSchema?.utterance?.speechAct,
        language: lang || nluSchema?.utterance?.language,
        concepts: concepts,

        // Metadata completa
        nluSchema: nluSchema,

        // Contenido textual
        title: title,
        description: desc,

        // Estilos
        styles: styles,

        // Estructura
        svgId: svgId,
        viewBox: viewBox,
        elements: elements,

        // Provenance (si existe en metadata)
        provenance: nluSchema?.provenance || null
      };
    } catch (error) {
      console.error('Error parsing SVG:', error);
      return null;
    }
  }

  /**
   * Extrae un elemento específico por ID del SVG
   * Útil para la store "canonical" de elementos individuales
   * @param {string} svgString - SVG completo
   * @param {string} elementId - ID del elemento a extraer
   * @returns {string|null} HTML del elemento o null
   */
  static extractElement(svgString, elementId) {
    if (!svgString || !elementId) return null;

    try {
      const parser = new DOMParser();
      const doc = parser.parseFromString(svgString, 'image/svg+xml');
      const element = doc.getElementById(elementId);

      return element ? element.outerHTML : null;
    } catch (error) {
      console.error('Error extracting element:', error);
      return null;
    }
  }

  /**
   * Valida que un SVG tenga la estructura mínima requerida
   * @param {string} svgString - SVG a validar
   * @returns {Object} { valid: boolean, errors: string[] }
   */
  static validate(svgString) {
    const errors = [];

    if (!svgString || typeof svgString !== 'string') {
      errors.push('SVG string is empty or invalid');
      return { valid: false, errors };
    }

    try {
      const parser = new DOMParser();
      const doc = parser.parseFromString(svgString, 'image/svg+xml');

      const parserError = doc.querySelector('parsererror');
      if (parserError) {
        errors.push('SVG parsing failed: ' + parserError.textContent);
      }

      const svg = doc.querySelector('svg');
      if (!svg) {
        errors.push('No <svg> root element found');
      } else {
        // Validaciones opcionales (warnings, no errors)
        if (!svg.getAttribute('viewBox')) {
          console.warn('SVG missing viewBox attribute');
        }
        if (!svg.querySelector('title')) {
          console.warn('SVG missing <title> for accessibility');
        }
      }

      return { valid: errors.length === 0, errors };
    } catch (error) {
      errors.push('Unexpected error: ' + error.message);
      return { valid: false, errors };
    }
  }

  /**
   * Crea un SVG wrapper mínimo para un elemento extraído
   * Útil para preview de elementos individuales
   * @param {string} elementHTML - HTML del elemento
   * @param {string} styles - CSS opcional
   * @returns {string} SVG completo wrapeando el elemento
   */
  static wrapElement(elementHTML, styles = '') {
    return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100">
  ${styles ? `<defs><style>${styles}</style></defs>` : ''}
  ${elementHTML}
</svg>`;
  }
}
