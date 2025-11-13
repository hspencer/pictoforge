import { useState, useCallback, useEffect, useRef } from 'react';
import { createPathDataProcessor } from '../services/PathDataProcessor';

/**
 * Hook React para integrar el PathDataProcessor con el ciclo de vida de React
 * Proporciona acceso reactivo a la manipulación de paths SVG
 *
 * @param {Object} options - Opciones de configuración
 * @param {string} options.pathString - Cadena 'd' inicial del path
 * @param {boolean} options.autoNormalize - Normalizar automáticamente a comandos absolutos
 * @returns {Object} API del processor de paths
 */
export function usePathDataProcessor({ pathString = '', autoNormalize = true } = {}) {
  const processorRef = useRef(null);
  const [segments, setSegments] = useState([]);
  const [anchorPoints, setAnchorPoints] = useState([]);
  const [controlPoints, setControlPoints] = useState([]);
  const [isReady, setIsReady] = useState(false);
  const [currentPathString, setCurrentPathString] = useState(pathString);

  /**
   * Inicializa o actualiza el processor cuando cambia el pathString
   */
  useEffect(() => {
    if (!pathString) {
      processorRef.current = null;
      setSegments([]);
      setAnchorPoints([]);
      setControlPoints([]);
      setIsReady(false);
      return;
    }

    try {
      const processor = createPathDataProcessor(pathString);

      if (autoNormalize) {
        processor.normalize();
      }

      processorRef.current = processor;
      setCurrentPathString(pathString);
      updateState();
      setIsReady(true);
    } catch (error) {
      console.error('Error inicializando PathDataProcessor:', error);
      setIsReady(false);
    }
  }, [pathString, autoNormalize]);

  /**
   * Actualiza el estado reactivo desde el processor
   */
  const updateState = useCallback(() => {
    if (!processorRef.current) return;

    try {
      setSegments(processorRef.current.getSegments());
      setAnchorPoints(processorRef.current.getAnchorPoints());
      setControlPoints(processorRef.current.getControlPoints());
      setCurrentPathString(processorRef.current.toString());
    } catch (error) {
      console.error('Error actualizando estado del processor:', error);
    }
  }, []);

  /**
   * Normaliza el path a comandos absolutos
   */
  const normalize = useCallback(() => {
    if (!processorRef.current) {
      console.warn('usePathDataProcessor: Processor no inicializado');
      return;
    }

    processorRef.current.normalize();
    updateState();
  }, [updateState]);

  /**
   * Actualiza un punto de anclaje
   * @param {number} segmentIndex - Índice del segmento
   * @param {Object} newPosition - Nueva posición { x, y }
   */
  const updateAnchorPoint = useCallback((segmentIndex, newPosition) => {
    if (!processorRef.current) {
      console.warn('usePathDataProcessor: Processor no inicializado');
      return;
    }

    processorRef.current.updateAnchorPoint(segmentIndex, newPosition);
    updateState();
  }, [updateState]);

  /**
   * Actualiza un punto de control
   * @param {number} segmentIndex - Índice del segmento
   * @param {string} controlType - Tipo de control: 'C1', 'C2', 'Q1'
   * @param {Object} newPosition - Nueva posición { x, y }
   */
  const updateControlPoint = useCallback((segmentIndex, controlType, newPosition) => {
    if (!processorRef.current) {
      console.warn('usePathDataProcessor: Processor no inicializado');
      return;
    }

    processorRef.current.updateControlPoint(segmentIndex, controlType, newPosition);
    updateState();
  }, [updateState]);

  /**
   * Invierte la dirección del path
   */
  const reverse = useCallback(() => {
    if (!processorRef.current) {
      console.warn('usePathDataProcessor: Processor no inicializado');
      return;
    }

    processorRef.current.reverse();
    updateState();
  }, [updateState]);

  /**
   * Obtiene el path como string
   * @returns {string} Cadena 'd' del path
   */
  const toString = useCallback(() => {
    if (!processorRef.current) {
      return '';
    }
    return processorRef.current.toString();
  }, []);

  /**
   * Obtiene los comandos como strings legibles
   * @returns {Array<string>} Array de comandos
   */
  const toCommandStrings = useCallback(() => {
    if (!processorRef.current) {
      return [];
    }
    return processorRef.current.toCommandStrings();
  }, []);

  /**
   * Clona el processor actual
   * @returns {PathDataProcessor} Nuevo processor
   */
  const clone = useCallback(() => {
    if (!processorRef.current) {
      return null;
    }
    return processorRef.current.clone();
  }, []);

  /**
   * Obtiene información de debug
   * @returns {Object} Información de debug
   */
  const getDebugInfo = useCallback(() => {
    if (!processorRef.current) {
      return null;
    }
    return processorRef.current.getDebugInfo();
  }, []);

  /**
   * Limpia el processor
   */
  const clear = useCallback(() => {
    if (processorRef.current) {
      processorRef.current.clear();
    }
    setSegments([]);
    setAnchorPoints([]);
    setControlPoints([]);
    setIsReady(false);
    setCurrentPathString('');
  }, []);

  /**
   * Parsea un nuevo path string
   * @param {string} newPathString - Nueva cadena 'd'
   */
  const parse = useCallback((newPathString) => {
    if (!newPathString) {
      clear();
      return;
    }

    try {
      const processor = createPathDataProcessor(newPathString);

      if (autoNormalize) {
        processor.normalize();
      }

      processorRef.current = processor;
      updateState();
      setIsReady(true);
    } catch (error) {
      console.error('Error parseando path:', error);
      setIsReady(false);
    }
  }, [autoNormalize, clear, updateState]);

  return {
    // Estado
    isReady,
    processor: processorRef.current,
    segments,
    anchorPoints,
    controlPoints,
    pathString: currentPathString,

    // Métodos de transformación
    normalize,
    reverse,

    // Métodos de modificación
    updateAnchorPoint,
    updateControlPoint,

    // Métodos de conversión
    toString,
    toCommandStrings,

    // Utilidades
    parse,
    clone,
    clear,
    getDebugInfo,
  };
}

export default usePathDataProcessor;
