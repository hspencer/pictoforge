import { useRef, useEffect, useCallback, useState } from 'react';
import { createCoordinateTransformer } from '../services/CoordinateTransformer';

/**
 * Hook React para integrar el CoordinateTransformer con el ciclo de vida de React
 * Proporciona acceso reactivo a las transformaciones de coordenadas
 *
 * @param {Object} options - Opciones de configuración
 * @param {React.RefObject} options.svgRef - Ref al elemento SVG
 * @param {Object} options.panzoomState - Estado de panzoom { scale, x, y }
 * @returns {Object} API del transformador de coordenadas
 */
export function useCoordinateTransformer({ svgRef, panzoomState } = {}) {
  const transformerRef = useRef(null);
  const [isReady, setIsReady] = useState(false);

  // Inicializar el transformador
  useEffect(() => {
    if (!transformerRef.current) {
      transformerRef.current = createCoordinateTransformer();
    }
  }, []);

  // Actualizar el elemento SVG cuando la ref cambia
  useEffect(() => {
    if (transformerRef.current && svgRef?.current) {
      const svgElement = svgRef.current.querySelector('svg');
      if (svgElement) {
        transformerRef.current.setSvgElement(svgElement);
        transformerRef.current.updateViewBox();
        transformerRef.current.updateContainerDimensions();
        setIsReady(true);
      }
    }
  }, [svgRef]);

  // Actualizar el estado de panzoom cuando cambia
  useEffect(() => {
    if (transformerRef.current && panzoomState) {
      transformerRef.current.updatePanzoomState(panzoomState);
    }
  }, [panzoomState?.scale, panzoomState?.x, panzoomState?.y]);

  // Actualizar dimensiones en resize
  useEffect(() => {
    const handleResize = () => {
      if (transformerRef.current) {
        transformerRef.current.updateContainerDimensions();
      }
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  /**
   * Convierte coordenadas de pantalla a coordenadas SVG
   */
  const screenToSvg = useCallback((screenX, screenY) => {
    if (!transformerRef.current) {
      return { x: 0, y: 0 };
    }
    return transformerRef.current.screenToSvg(screenX, screenY);
  }, []);

  /**
   * Convierte coordenadas SVG a coordenadas de pantalla
   */
  const svgToScreen = useCallback((svgX, svgY) => {
    if (!transformerRef.current) {
      return { x: 0, y: 0 };
    }
    return transformerRef.current.svgToScreen(svgX, svgY);
  }, []);

  /**
   * Convierte un delta de pantalla a delta SVG
   */
  const screenDeltaToSvgDelta = useCallback((deltaX, deltaY) => {
    if (!transformerRef.current) {
      return { dx: 0, dy: 0 };
    }
    return transformerRef.current.screenDeltaToSvgDelta(deltaX, deltaY);
  }, []);

  /**
   * Actualiza manualmente el viewBox (útil cuando el SVG cambia)
   */
  const updateViewBox = useCallback(() => {
    if (transformerRef.current) {
      transformerRef.current.updateViewBox();
    }
  }, []);

  /**
   * Actualiza manualmente las dimensiones del contenedor
   */
  const updateDimensions = useCallback(() => {
    if (transformerRef.current) {
      transformerRef.current.updateContainerDimensions();
    }
  }, []);

  /**
   * Obtiene información de debug
   */
  const getDebugInfo = useCallback(() => {
    if (!transformerRef.current) {
      return null;
    }
    return transformerRef.current.getDebugInfo();
  }, []);

  /**
   * Resetea el transformador
   */
  const reset = useCallback(() => {
    if (transformerRef.current) {
      transformerRef.current.reset();
    }
  }, []);

  return {
    // Estado
    isReady,
    transformer: transformerRef.current,

    // Métodos de transformación
    screenToSvg,
    svgToScreen,
    screenDeltaToSvgDelta,

    // Métodos de actualización
    updateViewBox,
    updateDimensions,
    reset,

    // Debug
    getDebugInfo,
  };
}

export default useCoordinateTransformer;
