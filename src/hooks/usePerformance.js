import { useState, useEffect, useCallback, useMemo } from 'react';

/**
 * Hook para optimización de rendimiento en SVGs complejos
 */
export const usePerformance = (svgContent, options = {}) => {
  const {
    enableVirtualization = true,
    maxElements = 1000,
    debounceMs = 100,
    enableLazyLoading = true
  } = options;

  const [isOptimized, setIsOptimized] = useState(false);
  const [elementCount, setElementCount] = useState(0);
  const [renderTime, setRenderTime] = useState(0);
  const [memoryUsage, setMemoryUsage] = useState(0);

  // Analizar complejidad del SVG
  const complexity = useMemo(() => {
    if (!svgContent) return { level: 'low', score: 0 };
    
    const parser = new DOMParser();
    const doc = parser.parseFromString(svgContent, 'image/svg+xml');
    const elements = doc.querySelectorAll('*');
    const pathElements = doc.querySelectorAll('path');
    const complexPaths = Array.from(pathElements).filter(path => {
      const d = path.getAttribute('d');
      return d && d.length > 200; // Paths complejos
    });

    const score = elements.length + (complexPaths.length * 2);
    
    let level = 'low';
    if (score > 500) level = 'high';
    else if (score > 100) level = 'medium';

    return { level, score, elementCount: elements.length };
  }, [svgContent]);

  // Debounce para operaciones costosas
  const debounce = useCallback((func, delay) => {
    let timeoutId;
    return (...args) => {
      clearTimeout(timeoutId);
      timeoutId = setTimeout(() => func.apply(null, args), delay);
    };
  }, []);

  // Optimizar SVG para renderizado
  const optimizeSVG = useCallback((content) => {
    if (!content || complexity.level === 'low') return content;

    const parser = new DOMParser();
    const doc = parser.parseFromString(content, 'image/svg+xml');
    
    // Remover elementos innecesarios
    const unnecessaryElements = doc.querySelectorAll('metadata, title, desc');
    unnecessaryElements.forEach(el => el.remove());

    // Simplificar paths complejos si es necesario
    if (complexity.level === 'high') {
      const paths = doc.querySelectorAll('path');
      paths.forEach(path => {
        const d = path.getAttribute('d');
        if (d && d.length > 500) {
          // Simplificar path muy complejo (implementación básica)
          const simplified = d.replace(/(\d+\.\d{3,})/g, (match) => {
            return parseFloat(match).toFixed(2);
          });
          path.setAttribute('d', simplified);
        }
      });
    }

    // Agregar optimizaciones de renderizado
    const svg = doc.querySelector('svg');
    if (svg) {
      svg.setAttribute('shape-rendering', 'optimizeSpeed');
      if (complexity.level === 'high') {
        svg.setAttribute('text-rendering', 'optimizeSpeed');
      }
    }

    return new XMLSerializer().serializeToString(doc);
  }, [complexity]);

  // Medir rendimiento de renderizado
  const measureRenderTime = useCallback(() => {
    const start = performance.now();
    
    // Simular operación de renderizado
    requestAnimationFrame(() => {
      const end = performance.now();
      setRenderTime(end - start);
    });
  }, []);

  // Estimar uso de memoria
  const estimateMemoryUsage = useCallback(() => {
    if (!svgContent) return 0;
    
    // Estimación básica basada en el tamaño del contenido
    const baseSize = new Blob([svgContent]).size;
    const domComplexity = complexity.score * 100; // Factor de complejidad DOM
    
    return baseSize + domComplexity;
  }, [svgContent, complexity]);

  // Configurar optimizaciones automáticas
  useEffect(() => {
    if (complexity.level === 'high' && enableVirtualization) {
      setIsOptimized(true);
    }
    
    setElementCount(complexity.elementCount);
    measureRenderTime();
    setMemoryUsage(estimateMemoryUsage());
  }, [complexity, enableVirtualization, measureRenderTime, estimateMemoryUsage]);

  // Función para renderizado lazy
  const shouldRenderElement = useCallback((elementIndex, viewportBounds) => {
    if (!enableLazyLoading) return true;
    
    // Implementar lógica de viewport culling
    // Por ahora, renderizar todos los elementos
    return elementIndex < maxElements;
  }, [enableLazyLoading, maxElements]);

  // Función para throttling de eventos
  const throttleEvent = useCallback((func, limit) => {
    let inThrottle;
    return function() {
      const args = arguments;
      const context = this;
      if (!inThrottle) {
        func.apply(context, args);
        inThrottle = true;
        setTimeout(() => inThrottle = false, limit);
      }
    };
  }, []);

  return {
    // Estado de rendimiento
    complexity,
    isOptimized,
    elementCount,
    renderTime,
    memoryUsage,
    
    // Funciones de optimización
    optimizeSVG,
    shouldRenderElement,
    debounce: (func) => debounce(func, debounceMs),
    throttle: throttleEvent,
    
    // Métricas
    metrics: {
      complexityLevel: complexity.level,
      complexityScore: complexity.score,
      elementCount,
      renderTime,
      memoryUsage: `${(memoryUsage / 1024).toFixed(2)} KB`,
      isOptimized
    }
  };
};

export default usePerformance;
