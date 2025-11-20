/**
 * Utilidad para parsear contenido SVG y extraer sus componentes.
 *
 * Este módulo proporciona funciones para parsear strings SVG y extraer información
 * estructural sin renderizar el SVG completo. Es útil para la arquitectura de
 * un solo SVG donde necesitamos separar el contenido interno de los atributos
 * del elemento raíz.
 *
 * @module utils/svgParser
 */

/**
 * Parsea un string SVG y extrae su viewBox, dimensiones, y contenido interno.
 *
 * Esta función utiliza DOMParser para analizar el SVG de forma robusta, con
 * múltiples estrategias de fallback y validación de errores. Extrae los atributos
 * principales del elemento <svg> raíz y retorna el innerHTML para ser inyectado
 * en un contenedor SVG controlado por React.
 *
 * **Estrategia de parseo:**
 * 1. Valida que el string no esté vacío
 * 2. Usa DOMParser para convertir string a DOM
 * 3. Detecta errores de parseo (parsererror element)
 * 4. Busca el elemento <svg> raíz
 * 5. Extrae atributos y contenido interno
 * 6. Provee valores por defecto para atributos faltantes
 *
 * **Casos de uso:**
 * - Arquitectura de un solo SVG (single-SVG architecture)
 * - Separar contenido SVG de sus atributos de presentación
 * - Validación de SVGs antes de renderizar
 * - Migración de SVGs externos a componentes React controlados
 *
 * @param {string} svgString - String HTML completo del SVG (debe incluir <svg>...</svg>)
 * @returns {Object|null} Objeto con estructura del SVG, o null si falla el parseo
 * @returns {string} returns.viewBox - ViewBox del SVG (default: "0 0 100 100")
 * @returns {string|null} returns.width - Ancho del SVG (si está definido)
 * @returns {string|null} returns.height - Alto del SVG (si está definido)
 * @returns {string} returns.preserveAspectRatio - Estrategia de aspecto (default: "xMidYMid meet")
 * @returns {string} returns.innerContent - HTML interno del SVG (sin el elemento raíz)
 * @returns {Object} returns.attributes - Otros atributos del SVG (id, class, style, xmlns)
 *
 * @example
 * // SVG simple
 * const svg = '<svg viewBox="0 0 100 100"><circle cx="50" cy="50" r="40"/></svg>';
 * const parsed = parseSVGContent(svg);
 * // {
 * //   viewBox: "0 0 100 100",
 * //   width: null,
 * //   height: null,
 * //   preserveAspectRatio: "xMidYMid meet",
 * //   innerContent: "<circle cx=\"50\" cy=\"50\" r=\"40\"/>",
 * //   attributes: { id: null, class: null, style: null, xmlns: null }
 * // }
 *
 * @example
 * // SVG con atributos completos
 * const svg = '<svg id="icon" viewBox="0 0 24 24" width="100" height="100"><path d="..."/></svg>';
 * const parsed = parseSVGContent(svg);
 * // { viewBox: "0 0 24 24", width: "100", height: "100", ... }
 *
 * @example
 * // Error de parseo
 * const invalid = '<svg><broken>';
 * const parsed = parseSVGContent(invalid);
 * // null (con console.error)
 */
export function parseSVGContent(svgString) {
  if (!svgString) {
    return null;
  }

  try {
    const parser = new DOMParser();
    const doc = parser.parseFromString(svgString, 'image/svg+xml');

    // Verificar si hubo errores de parseo
    const parserError = doc.querySelector('parsererror');
    if (parserError) {
      console.error('Error parseando SVG:', parserError.textContent);
      return null;
    }

    const svg = doc.querySelector('svg');
    if (!svg) {
      console.error('No se encontró elemento <svg> en el contenido');
      return null;
    }

    // Extraer atributos importantes
    const viewBox = svg.getAttribute('viewBox') || '0 0 100 100';
    const width = svg.getAttribute('width');
    const height = svg.getAttribute('height');
    const preserveAspectRatio = svg.getAttribute('preserveAspectRatio') || 'xMidYMid meet';

    // Extraer contenido interno (todos los elementos hijos del SVG)
    const innerContent = svg.innerHTML;

    // Extraer otros atributos útiles
    const attributes = {
      id: svg.getAttribute('id'),
      class: svg.getAttribute('class'),
      style: svg.getAttribute('style'),
      xmlns: svg.getAttribute('xmlns'),
    };

    console.log('✓ SVG parseado exitosamente:', {
      viewBox,
      contentLength: innerContent.length,
      hasWidth: !!width,
      hasHeight: !!height,
    });

    return {
      viewBox,
      width,
      height,
      preserveAspectRatio,
      innerContent,
      attributes,
    };
  } catch (error) {
    console.error('Error parseando SVG:', error);
    return null;
  }
}

/**
 * Extrae el viewBox de un string SVG de forma rápida sin parsear el DOM completo.
 *
 * Esta función usa una expresión regular para buscar el atributo viewBox
 * directamente en el string, sin necesidad de crear un árbol DOM. Es mucho
 * más rápida que `parseSVGContent()` pero menos robusta.
 *
 * **Ventajas:**
 * - Muy rápido (no crea DOM)
 * - Bajo consumo de memoria
 * - Útil cuando solo necesitas el viewBox
 *
 * **Limitaciones:**
 * - No valida que el SVG sea sintácticamente correcto
 * - Solo busca el primer atributo viewBox en el string
 * - Sensible a comillas simples o dobles
 *
 * **Cuándo usar:**
 * - Pre-validación rápida antes de parsear
 * - Cuando solo necesitas las dimensiones lógicas
 * - En bucles que procesan muchos SVGs
 *
 * @param {string} svgString - String HTML que contiene un SVG
 * @returns {string|null} ViewBox encontrado (ej: "0 0 100 100"), o null si no existe
 *
 * @example
 * const svg = '<svg viewBox="0 0 24 24"><path d="..."/></svg>';
 * const vb = extractViewBox(svg);
 * // "0 0 24 24"
 *
 * @example
 * const svg = '<svg width="100" height="100"><rect/></svg>';
 * const vb = extractViewBox(svg);
 * // null (no hay viewBox)
 *
 * @see {@link parseSVGContent} Para parseo completo y robusto
 */
export function extractViewBox(svgString) {
  if (!svgString) return null;

  const match = svgString.match(/viewBox=["']([^"']+)["']/);
  return match ? match[1] : null;
}

/**
 * Verifica si un string contiene un elemento SVG de forma heurística.
 *
 * Esta es una validación superficial que solo verifica la presencia de la
 * etiqueta `<svg` en el string. **No valida** que el SVG sea sintácticamente
 * correcto ni que esté bien formado.
 *
 * **Qué valida:**
 * - ✓ El string no es null/undefined
 * - ✓ El string es de tipo string
 * - ✓ Contiene la etiqueta `<svg` (al inicio o en cualquier posición)
 *
 * **Qué NO valida:**
 * - ✗ Sintaxis correcta del SVG
 * - ✗ Etiquetas cerradas correctamente
 * - ✗ Atributos válidos
 * - ✗ Estructura DOM correcta
 *
 * **Casos de uso:**
 * - Validación rápida antes de procesamiento costoso
 * - Filtrado de archivos en drag & drop
 * - Detección de tipo de contenido en clipboard
 * - Pre-validación en APIs que aceptan múltiples formatos
 *
 * **Para validación robusta**, usa `parseSVGContent()` y verifica que
 * no retorne `null`.
 *
 * @param {string} svgString - String a verificar
 * @returns {boolean} `true` si parece contener un SVG, `false` en caso contrario
 *
 * @example
 * // Casos válidos (retorna true)
 * isValidSVG('<svg><rect/></svg>'); // true
 * isValidSVG('<svg viewBox="0 0 100 100">'); // true
 * isValidSVG('  <svg>'); // true (con espacios)
 * isValidSVG('<div><svg></svg></div>'); // true (SVG embebido)
 *
 * @example
 * // Casos inválidos (retorna false)
 * isValidSVG(''); // false (string vacío)
 * isValidSVG(null); // false
 * isValidSVG(undefined); // false
 * isValidSVG('<div>No SVG</div>'); // false
 * isValidSVG(123); // false (no es string)
 *
 * @see {@link parseSVGContent} Para validación completa y robusta
 */
export function isValidSVG(svgString) {
  if (!svgString || typeof svgString !== 'string') {
    return false;
  }

  return svgString.trim().startsWith('<svg') || svgString.includes('<svg');
}
