import { useState, useCallback } from 'react';

/**
 * Hook personalizado para parsear SVG y manejar la estructura de datos
 * Extrae la jerarquía de elementos, estilos y metadatos del SVG
 */
export const useSVGParser = () => {
  const [svgData, setSvgData] = useState(null);
  const [selectedElement, setSelectedElement] = useState(null);
  const [svgContent, setSvgContent] = useState('');

  /**
   * Parsea un elemento SVG y extrae su información
   */
  const parseElement = useCallback((element, parent = null) => {
    const elementData = {
      id: element.id || `element_${Math.random().toString(36).substr(2, 9)}`,
      tagName: element.tagName.toLowerCase(),
      className: element.className.baseVal || element.getAttribute('class') || '',
      attributes: {},
      children: [],
      parent: parent,
      element: element // Referencia al elemento DOM real
    };

    // Extraer todos los atributos
    Array.from(element.attributes).forEach(attr => {
      if (attr.name !== 'id' && attr.name !== 'class') {
        elementData.attributes[attr.name] = attr.value;
      }
    });

    // Parsear elementos hijos recursivamente
    Array.from(element.children).forEach(child => {
      if (child.tagName) {
        const childData = parseElement(child, elementData);
        elementData.children.push(childData);
      }
    });

    return elementData;
  }, []);

  /**
   * Extrae los estilos CSS definidos en el SVG
   */
  const extractStyles = useCallback((svgElement) => {
    const styles = {};
    const styleElements = svgElement.querySelectorAll('style');
    
    styleElements.forEach(styleEl => {
      const cssText = styleEl.textContent;
      // Parsear reglas CSS básicas
      const rules = cssText.match(/\.[^{]+\{[^}]+\}/g) || [];
      
      rules.forEach(rule => {
        const match = rule.match(/\.([^{]+)\{([^}]+)\}/);
        if (match) {
          const className = match[1].trim();
          const properties = match[2].trim();
          styles[className] = properties;
        }
      });
    });

    return styles;
  }, []);

  /**
   * Parsea el contenido SVG completo
   */
  const parseSVG = useCallback((svgString) => {
    try {
      // Crear un parser DOM temporal
      const parser = new DOMParser();
      const doc = parser.parseFromString(svgString, 'image/svg+xml');
      const svgElement = doc.querySelector('svg');

      if (!svgElement) {
        throw new Error('No se encontró elemento SVG válido');
      }

      // Extraer información del SVG raíz
      const rootData = parseElement(svgElement);
      
      // Extraer estilos
      const styles = extractStyles(svgElement);

      // Extraer viewBox y dimensiones
      const viewBox = svgElement.getAttribute('viewBox') || '0 0 100 100';
      const width = svgElement.getAttribute('width') || '100';
      const height = svgElement.getAttribute('height') || '100';

      const parsedData = {
        root: rootData,
        styles: styles,
        viewBox: viewBox,
        width: width,
        height: height,
        originalSVG: svgString
      };

      setSvgData(parsedData);
      setSvgContent(svgString);
      return parsedData;

    } catch (error) {
      console.error('Error al parsear SVG:', error);
      return null;
    }
  }, [parseElement, extractStyles]);

  /**
   * Carga un archivo SVG desde una URL o string
   */
  const loadSVG = useCallback(async (source) => {
    try {
      let svgString;
      
      if (typeof source === 'string' && source.startsWith('<svg')) {
        // Es contenido SVG directo
        svgString = source;
      } else if (typeof source === 'string') {
        // Es una URL, cargar el archivo
        const response = await fetch(source);
        svgString = await response.text();
      } else if (source instanceof File) {
        // Es un archivo subido
        svgString = await source.text();
      } else {
        throw new Error('Tipo de fuente no soportado');
      }

      return parseSVG(svgString);
    } catch (error) {
      console.error('Error al cargar SVG:', error);
      return null;
    }
  }, [parseSVG]);

  /**
   * Busca un elemento por ID en la estructura parseada
   */
  const findElementById = useCallback((id, element = null) => {
    if (!svgData) return null;
    
    const searchElement = element || svgData.root;
    
    if (searchElement.id === id) {
      return searchElement;
    }

    for (const child of searchElement.children) {
      const found = findElementById(id, child);
      if (found) return found;
    }

    return null;
  }, [svgData]);

  /**
   * Obtiene todos los elementos de un tipo específico
   */
  const getElementsByType = useCallback((tagName) => {
    if (!svgData) return [];
    
    const elements = [];
    
    const traverse = (element) => {
      if (element.tagName === tagName) {
        elements.push(element);
      }
      element.children.forEach(traverse);
    };

    traverse(svgData.root);
    return elements;
  }, [svgData]);

  /**
   * Obtiene la ruta completa de un elemento (breadcrumb)
   */
  const getElementPath = useCallback((elementId) => {
    const element = findElementById(elementId);
    if (!element) return [];

    const path = [];
    let current = element;
    
    while (current) {
      path.unshift({
        id: current.id,
        tagName: current.tagName,
        className: current.className
      });
      current = current.parent;
    }

    return path;
  }, [findElementById]);

  return {
    // Estado
    svgData,
    selectedElement,
    svgContent,
    
    // Acciones
    parseSVG,
    loadSVG,
    setSelectedElement,
    
    // Utilidades
    findElementById,
    getElementsByType,
    getElementPath
  };
};
