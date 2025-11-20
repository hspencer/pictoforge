import { useCallback, useRef, useState } from 'react';

/**
 * Hook para integrar Moveable con transformaciones SVG
 * Maneja los eventos de drag, resize y rotate usando SVGWorld
 *
 * NOTA: Este hook actualmente no se usa en la interfaz principal.
 * Las transformaciones se manejan inline en SVGViewer para mayor simplicidad.
 * Se mantiene como utilidad para futuros usos.
 *
 * @param {Object} options - Opciones de configuración
 * @param {Object} options.coordinateTransformer - Instancia de SVGWorld (del hook useSVGWorld)
 * @param {Function} options.onTransformStart - Callback al iniciar transformación
 * @param {Function} options.onTransform - Callback durante transformación
 * @param {Function} options.onTransformEnd - Callback al finalizar transformación
 * @returns {Object} Handlers y estado para Moveable
 */
export function useMoveable({
  coordinateTransformer,
  onTransformStart,
  onTransform,
  onTransformEnd,
} = {}) {
  const [isDragging, setIsDragging] = useState(false);
  const [isResizing, setIsResizing] = useState(false);
  const [isRotating, setIsRotating] = useState(false);
  const initialTransformRef = useRef(null);

  /**
   * Extrae valores actuales de transform de un elemento
   */
  const getElementTransform = useCallback((element) => {
    const transform = element.getAttribute('transform') || '';
    const result = {
      translateX: 0,
      translateY: 0,
      scaleX: 1,
      scaleY: 1,
      rotation: 0,
      raw: transform,
    };

    // Parse translate
    const translateMatch = transform.match(/translate\(([^,]+),\s*([^)]+)\)/);
    if (translateMatch) {
      result.translateX = parseFloat(translateMatch[1]) || 0;
      result.translateY = parseFloat(translateMatch[2]) || 0;
    }

    // Parse scale
    const scaleMatch = transform.match(/scale\(([^,]+)(?:,\s*([^)]+))?\)/);
    if (scaleMatch) {
      result.scaleX = parseFloat(scaleMatch[1]) || 1;
      result.scaleY = parseFloat(scaleMatch[2] || scaleMatch[1]) || 1;
    }

    // Parse rotate
    const rotateMatch = transform.match(/rotate\(([^)]+)\)/);
    if (rotateMatch) {
      result.rotation = parseFloat(rotateMatch[1]) || 0;
    }

    return result;
  }, []);

  /**
   * Construye string de transform desde valores individuales
   */
  const buildTransformString = useCallback((transforms) => {
    const parts = [];

    if (transforms.translateX !== 0 || transforms.translateY !== 0) {
      parts.push(`translate(${transforms.translateX}, ${transforms.translateY})`);
    }

    if (transforms.rotation !== 0) {
      parts.push(`rotate(${transforms.rotation})`);
    }

    if (transforms.scaleX !== 1 || transforms.scaleY !== 1) {
      parts.push(`scale(${transforms.scaleX}, ${transforms.scaleY})`);
    }

    return parts.join(' ');
  }, []);

  /**
   * Handler de inicio de arrastre
   */
  const handleDragStart = useCallback((e) => {
    setIsDragging(true);
    const element = e.target;
    initialTransformRef.current = getElementTransform(element);

    if (onTransformStart) {
      onTransformStart({ type: 'drag', element, event: e });
    }

    console.log('🎯 Drag Start:', {
      element: element.id,
      initialTransform: initialTransformRef.current,
    });
  }, [getElementTransform, onTransformStart]);

  /**
   * Handler de arrastre
   */
  const handleDrag = useCallback((e) => {
    const element = e.target;
    const initial = initialTransformRef.current;

    if (!initial) return;

    // Convertir delta de pantalla a delta SVG
    let deltaX = e.beforeTranslate[0];
    let deltaY = e.beforeTranslate[1];

    // Si tenemos coordinateTransformer, convertir delta
    if (coordinateTransformer?.screenDeltaToSVGDelta) {
      const svgDelta = coordinateTransformer.screenDeltaToSVGDelta(deltaX, deltaY);
      deltaX = svgDelta.dx;
      deltaY = svgDelta.dy;
    } else if (coordinateTransformer?.screenDeltaToSvgDelta) {
      // Fallback para compatibilidad temporal (aunque vamos a borrar el otro servicio)
      const svgDelta = coordinateTransformer.screenDeltaToSvgDelta(deltaX, deltaY);
      deltaX = svgDelta.dx;
      deltaY = svgDelta.dy;
    }

    // Aplicar transformación
    const newTransform = {
      ...initial,
      translateX: initial.translateX + deltaX,
      translateY: initial.translateY + deltaY,
    };

    const transformString = buildTransformString(newTransform);
    element.setAttribute('transform', transformString);

    // Actualizar la traducción visual de Moveable
    e.target.style.transform = e.transform;

    if (onTransform) {
      onTransform({
        type: 'drag',
        element,
        transform: newTransform,
        event: e,
      });
    }

    console.log('🎯 Drag:', {
      screenDelta: e.beforeTranslate,
      svgDelta: { deltaX, deltaY },
      newTransform,
    });
  }, [coordinateTransformer, buildTransformString, onTransform]);

  /**
   * Handler de fin de arrastre
   */
  const handleDragEnd = useCallback((e) => {
    setIsDragging(false);
    const element = e.target;

    // Limpiar el style.transform que Moveable aplicó
    element.style.transform = '';

    if (onTransformEnd) {
      const finalTransform = getElementTransform(element);
      onTransformEnd({
        type: 'drag',
        element,
        transform: finalTransform,
        event: e,
      });
    }

    initialTransformRef.current = null;

    console.log('🎯 Drag End:', {
      element: element.id,
      finalTransform: getElementTransform(element),
    });
  }, [getElementTransform, onTransformEnd]);

  /**
   * Handler de inicio de resize
   */
  const handleResizeStart = useCallback((e) => {
    setIsResizing(true);
    const element = e.target;
    initialTransformRef.current = getElementTransform(element);

    if (onTransformStart) {
      onTransformStart({ type: 'resize', element, event: e });
    }

    console.log('📏 Resize Start:', {
      element: element.id,
      initialTransform: initialTransformRef.current,
    });
  }, [getElementTransform, onTransformStart]);

  /**
   * Handler de resize
   */
  const handleResize = useCallback((e) => {
    const element = e.target;
    const initial = initialTransformRef.current;

    if (!initial) return;

    // Calcular nueva escala
    const scaleX = e.width / e.startWidth;
    const scaleY = e.height / e.startHeight;

    // Aplicar transformación
    const newTransform = {
      ...initial,
      scaleX: initial.scaleX * scaleX,
      scaleY: initial.scaleY * scaleY,
      translateX: initial.translateX + e.drag.beforeTranslate[0],
      translateY: initial.translateY + e.drag.beforeTranslate[1],
    };

    const transformString = buildTransformString(newTransform);
    element.setAttribute('transform', transformString);

    // Actualizar la transformación visual
    e.target.style.transform = e.drag.transform;

    if (onTransform) {
      onTransform({
        type: 'resize',
        element,
        transform: newTransform,
        width: e.width,
        height: e.height,
        event: e,
      });
    }

    console.log('📏 Resize:', {
      scale: { scaleX, scaleY },
      newTransform,
    });
  }, [buildTransformString, onTransform]);

  /**
   * Handler de fin de resize
   */
  const handleResizeEnd = useCallback((e) => {
    setIsResizing(false);
    const element = e.target;

    // Limpiar el style.transform
    element.style.transform = '';

    if (onTransformEnd) {
      const finalTransform = getElementTransform(element);
      onTransformEnd({
        type: 'resize',
        element,
        transform: finalTransform,
        event: e,
      });
    }

    initialTransformRef.current = null;

    console.log('📏 Resize End:', {
      element: element.id,
      finalTransform: getElementTransform(element),
    });
  }, [getElementTransform, onTransformEnd]);

  /**
   * Handler de inicio de rotate
   */
  const handleRotateStart = useCallback((e) => {
    setIsRotating(true);
    const element = e.target;
    initialTransformRef.current = getElementTransform(element);

    if (onTransformStart) {
      onTransformStart({ type: 'rotate', element, event: e });
    }

    console.log('🔄 Rotate Start:', {
      element: element.id,
      initialTransform: initialTransformRef.current,
    });
  }, [getElementTransform, onTransformStart]);

  /**
   * Handler de rotate
   */
  const handleRotate = useCallback((e) => {
    const element = e.target;
    const initial = initialTransformRef.current;

    if (!initial) return;

    // Aplicar rotación
    const newTransform = {
      ...initial,
      rotation: e.rotate,
    };

    const transformString = buildTransformString(newTransform);
    element.setAttribute('transform', transformString);

    // Actualizar la transformación visual
    e.target.style.transform = e.drag.transform;

    if (onTransform) {
      onTransform({
        type: 'rotate',
        element,
        transform: newTransform,
        rotation: e.rotate,
        event: e,
      });
    }

    console.log('🔄 Rotate:', {
      rotation: e.rotate,
      newTransform,
    });
  }, [buildTransformString, onTransform]);

  /**
   * Handler de fin de rotate
   */
  const handleRotateEnd = useCallback((e) => {
    setIsRotating(false);
    const element = e.target;

    // Limpiar el style.transform
    element.style.transform = '';

    if (onTransformEnd) {
      const finalTransform = getElementTransform(element);
      onTransformEnd({
        type: 'rotate',
        element,
        transform: finalTransform,
        event: e,
      });
    }

    initialTransformRef.current = null;

    console.log('🔄 Rotate End:', {
      element: element.id,
      finalTransform: getElementTransform(element),
    });
  }, [getElementTransform, onTransformEnd]);

  return {
    // Estado
    isDragging,
    isResizing,
    isRotating,
    isTransforming: isDragging || isResizing || isRotating,

    // Drag handlers
    handleDragStart,
    handleDrag,
    handleDragEnd,

    // Resize handlers
    handleResizeStart,
    handleResize,
    handleResizeEnd,

    // Rotate handlers
    handleRotateStart,
    handleRotate,
    handleRotateEnd,

    // Utilidades
    getElementTransform,
    buildTransformString,
  };
}

export default useMoveable;
