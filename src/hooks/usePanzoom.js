import { useEffect, useRef, useState, useCallback } from 'react';
import Panzoom from '@panzoom/panzoom';

/**
 * Hook React para integrar @panzoom/panzoom
 * Proporciona control de zoom y pan con estado reactivo
 *
 * @param {Object} options - Opciones de configuración
 * @param {React.RefObject} options.elementRef - Ref al elemento que será pan/zoom
 * @param {Object} options.panzoomOptions - Opciones adicionales para panzoom
 * @returns {Object} API de panzoom y estado reactivo
 */
export function usePanzoom({ elementRef, panzoomOptions = {} } = {}) {
  const panzoomInstanceRef = useRef(null);
  const [panzoomState, setPanzoomState] = useState({
    scale: 1,
    x: 0,
    y: 0,
  });
  const [isReady, setIsReady] = useState(false);

  /**
   * Inicializa panzoom en el elemento
   */
  useEffect(() => {
    if (!elementRef?.current || panzoomInstanceRef.current) {
      return;
    }

    const element = elementRef.current;

    // Configuración por defecto de panzoom
    const defaultOptions = {
      maxScale: 10,
      minScale: 0.1,
      step: 0.1,
      startScale: 1,
      startX: 0,
      startY: 0,
      cursor: 'grab',
      canvas: true, // Permite pan fuera de los límites
      ...panzoomOptions,
    };

    try {
      // Crear instancia de panzoom
      const panzoom = Panzoom(element, defaultOptions);
      panzoomInstanceRef.current = panzoom;

      // Habilitar zoom con la rueda del mouse
      const parent = element.parentElement;
      if (parent) {
        parent.addEventListener('wheel', panzoom.zoomWithWheel);
      }

      // Actualizar estado cuando cambia la transformación
      const updateState = (event) => {
        const { scale, x, y } = event.detail;
        setPanzoomState({ scale, x, y });
      };

      element.addEventListener('panzoomchange', updateState);

      // Estado inicial
      setPanzoomState({
        scale: panzoom.getScale(),
        x: panzoom.getPan().x,
        y: panzoom.getPan().y,
      });

      setIsReady(true);

      // Cleanup
      return () => {
        if (parent) {
          parent.removeEventListener('wheel', panzoom.zoomWithWheel);
        }
        element.removeEventListener('panzoomchange', updateState);
        panzoom.destroy();
        panzoomInstanceRef.current = null;
        setIsReady(false);
      };
    } catch (error) {
      console.error('Error inicializando panzoom:', error);
      return undefined;
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [elementRef]);

  /**
   * Hace zoom in
   */
  const zoomIn = useCallback((options) => {
    if (panzoomInstanceRef.current) {
      panzoomInstanceRef.current.zoomIn(options);
    }
  }, []);

  /**
   * Hace zoom out
   */
  const zoomOut = useCallback((options) => {
    if (panzoomInstanceRef.current) {
      panzoomInstanceRef.current.zoomOut(options);
    }
  }, []);

  /**
   * Establece el zoom a un valor específico
   */
  const zoom = useCallback((scale, options) => {
    if (panzoomInstanceRef.current) {
      panzoomInstanceRef.current.zoom(scale, options);
    }
  }, []);

  /**
   * Hace pan a una posición específica
   */
  const pan = useCallback((x, y, options) => {
    if (panzoomInstanceRef.current) {
      panzoomInstanceRef.current.pan(x, y, options);
    }
  }, []);

  /**
   * Resetea el zoom y pan al estado inicial
   */
  const reset = useCallback((options) => {
    if (panzoomInstanceRef.current) {
      panzoomInstanceRef.current.reset(options);
    }
  }, []);

  /**
   * Obtiene la escala actual
   */
  const getScale = useCallback(() => {
    if (panzoomInstanceRef.current) {
      return panzoomInstanceRef.current.getScale();
    }
    return 1;
  }, []);

  /**
   * Obtiene el pan actual
   */
  const getPan = useCallback(() => {
    if (panzoomInstanceRef.current) {
      return panzoomInstanceRef.current.getPan();
    }
    return { x: 0, y: 0 };
  }, []);

  /**
   * Centra el contenido en el viewport
   */
  const center = useCallback((options) => {
    if (panzoomInstanceRef.current && elementRef?.current) {
      const element = elementRef.current;
      const parent = element.parentElement;

      if (parent) {
        const parentRect = parent.getBoundingClientRect();
        const elementRect = element.getBoundingClientRect();

        const x = (parentRect.width - elementRect.width) / 2;
        const y = (parentRect.height - elementRect.height) / 2;

        panzoomInstanceRef.current.pan(x, y, options);
      }
    }
  }, [elementRef]);

  return {
    // Estado
    panzoomState,
    isReady,
    instance: panzoomInstanceRef.current,

    // Métodos de control
    zoomIn,
    zoomOut,
    zoom,
    pan,
    reset,
    center,
    getScale,
    getPan,
  };
}

export default usePanzoom;
