import { useRef, useEffect, useCallback, useState } from 'react';
import { createSVGWorld } from '../services/SVGWorld';

/**
 * Hook React para integrar SVGWorld con el ciclo de vida de React
 *
 * Este hook proporciona una interfaz reactiva al objeto SVGWorld,
 * que actúa como un objeto intermedio "en memoria" para manejar
 * todas las transformaciones de coordenadas y manipulación de elementos SVG.
 *
 * @param {Object} options - Opciones de configuración
 * @param {React.RefObject} options.svgRef - Ref al elemento SVG
 * @param {React.RefObject} options.containerRef - Ref al contenedor (opcional)
 * @param {Object} options.viewport - Estado del viewport { scale, x, y }
 * @returns {Object} API de SVGWorld
 */
export function useSVGWorld({ svgRef, containerRef = null, viewport = null } = {}) {
  const worldRef = useRef(null);
  const [isReady, setIsReady] = useState(false);

  // Inicializar SVGWorld
  useEffect(() => {
    if (!worldRef.current) {
      worldRef.current = createSVGWorld();
      console.log('🪝 useSVGWorld: Instancia creada');
    }

    return () => {
      if (worldRef.current) {
        worldRef.current.destroy();
        worldRef.current = null;
      }
    };
  }, []);

  // Inicializar con el elemento SVG cuando esté disponible
  useEffect(() => {
    if (worldRef.current && svgRef?.current) {
      const svgElement = svgRef.current.querySelector('svg');
      const container = containerRef?.current;

      if (svgElement) {
        worldRef.current.initialize(svgElement, container);
        setIsReady(true);
        console.log('🪝 useSVGWorld: Inicializado con elemento SVG');
      }
    }
  }, [svgRef, containerRef]);

  // Actualizar viewport cuando cambia
  useEffect(() => {
    if (worldRef.current && viewport) {
      worldRef.current.updateViewport(viewport);
    }
  }, [viewport?.scale, viewport?.x, viewport?.y]);

  /**
   * Convierte coordenadas de pantalla a coordenadas SVG
   */
  const screenToSVG = useCallback((screenX, screenY) => {
    if (!worldRef.current) {
      return { x: screenX, y: screenY };
    }
    return worldRef.current.screenToSVG(screenX, screenY);
  }, []);

  /**
   * Convierte coordenadas SVG a coordenadas de pantalla
   */
  const svgToScreen = useCallback((svgX, svgY) => {
    if (!worldRef.current) {
      return { x: svgX, y: svgY };
    }
    return worldRef.current.svgToScreen(svgX, svgY);
  }, []);

  /**
   * Convierte un delta de pantalla a delta SVG
   */
  const screenDeltaToSVGDelta = useCallback((deltaX, deltaY) => {
    if (!worldRef.current) {
      return { dx: deltaX, dy: deltaY };
    }
    return worldRef.current.screenDeltaToSVGDelta(deltaX, deltaY);
  }, []);

  /**
   * Encuentra un elemento por ID
   */
  const findElementById = useCallback((id) => {
    if (!worldRef.current) return null;
    return worldRef.current.findElementById(id);
  }, []);

  /**
   * Obtiene el elemento DOM por ID
   */
  const getElementByIdDOM = useCallback((id) => {
    if (!worldRef.current) return null;
    return worldRef.current.getElementByIdDOM(id);
  }, []);

  /**
   * Obtiene el bounding box de un elemento
   */
  const getElementBBox = useCallback((element) => {
    if (!worldRef.current) {
      return { x: 0, y: 0, width: 0, height: 0 };
    }
    return worldRef.current.getElementBBox(element);
  }, []);

  /**
   * Aplica una transformación a un elemento
   */
  const applyTransform = useCallback((element, transform) => {
    if (!worldRef.current) return;
    worldRef.current.applyTransform(element, transform);
  }, []);

  /**
   * Mueve un elemento por un delta
   */
  const moveElement = useCallback((element, deltaX, deltaY) => {
    if (!worldRef.current) return;
    worldRef.current.moveElement(element, deltaX, deltaY);
  }, []);

  return {
    // Estado
    isReady,
    world: worldRef.current,

    // Métodos de conversión de coordenadas
    screenToSVG,
    svgToScreen,
    screenDeltaToSVGDelta,

    // Métodos de manipulación
    findElementById,
    getElementByIdDOM,
    getElementBBox,
    applyTransform,
    moveElement,
  };
}

export default useSVGWorld;
