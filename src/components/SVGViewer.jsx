import React, { useRef, useState, useEffect, useMemo, useCallback } from 'react';
import {
  ZoomIn,
  ZoomOut,
  RotateCcw,
  Maximize2,
  Undo,
  Redo,
  Hand
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { SelectArrowIcon, MousePointerIcon, PenToolIcon, ShareIcon, HandIcon } from './CustomIcons';
import NodeEditor from './NodeEditor';
import useHistory from '../hooks/useHistory';
import usePerformance from '../hooks/usePerformance';
import usePanzoom from '../hooks/usePanzoom';
import useSVGWorld from '../hooks/useSVGWorld';
import PerformanceMetrics from './PerformanceMetrics';
import { updateNodeInPath } from '../utils/svgManipulation';
import { parseSVGContent } from '../utils/svgParser';
// SVGWorld proporciona un sistema unificado de coordenadas y manipulación SVG

/**
 * Componente para visualizar y editar SVG
 */
export const SVGViewer = ({
  svgContent,
  selectedElement,
  onElementSelect,
  svgData,
  initialTool = 'select',
  onToolChange,
  onSVGUpdate,
  onSaveHistory
}) => {
  const svgRef = useRef(null);
  const containerRef = useRef(null);
  const svgContainerRef = useRef(null); // Ref para el contenedor panzoom
  const [tool, setToolInternal] = useState(initialTool);
  // Estado para saber si estamos en modo panning temporal (espacio presionado)
  const [isSpacePanning, setIsSpacePanning] = useState(false);
  const [lastTool, setLastTool] = useState(initialTool);

  const [selectedSVGElement, setSelectedSVGElement] = useState(null);
  const [zoomInputValue, setZoomInputValue] = useState('100%');
  const [marqueeRect, setMarqueeRect] = useState(null); // Rectángulo de selección marquee
  const [elementVersion, setElementVersion] = useState(0); // Para forzar re-render cuando cambia el elemento

  // Wrapper para setTool que también llama al callback
  const setTool = (newTool) => {
    setToolInternal(newTool);
    onToolChange?.(newTool);
  };

  // Actualizar tool cuando cambia initialTool desde fuera
  useEffect(() => {
    setToolInternal(initialTool);
  }, [initialTool]);

  // Ref para trackear si el mouse está sobre el canvas sin provocar re-renders
  const isHoveringRef = useRef(false);

  // Manejo de barra espaciadora para panning temporal
  useEffect(() => {
    const handleKeyDown = (e) => {
      // Solo si la barra espaciadora es presionada y no estamos editando texto
      if (e.code === 'Space' && !e.repeat && document.activeElement.tagName !== 'INPUT') {
        // Verificar si estamos sobre el canvas o si el contenedor tiene el foco
        const isFocused = document.activeElement === containerRef.current || containerRef.current?.contains(document.activeElement);
        const shouldActivate = isHoveringRef.current || isFocused;

        if (shouldActivate) {
          e.preventDefault(); // Evitar scroll
          if (tool !== 'hand') {
            setLastTool(tool);
            setTool('hand');
            setIsSpacePanning(true);
          }
        }
      }
    };

    const handleKeyUp = (e) => {
      if (e.code === 'Space' && isSpacePanning) {
        e.preventDefault();
        setTool(lastTool);
        setIsSpacePanning(false);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);

    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
    };
  }, [tool, isSpacePanning, lastTool]);


  /**
   * Parsear SVG content para extraer viewBox y contenido interno.
   *
   * ARQUITECTURA: Single-SVG System (Sistema de un solo SVG)
   * ==========================================================
   *
   * **Problema que resuelve:**
   * Anteriormente usábamos DOS elementos <svg> separados:
   * 1. Un <svg> para el contenido del pictograma (inyectado con dangerouslySetInnerHTML)
   * 2. Un <svg> overlay para los controles de edición (bounding box, nodos, etc.)
   *
   * Esto causaba problemas de alineamiento:
   * - Cada SVG calculaba su mapeo viewBox→viewport independientemente
   * - Al redimensionar la ventana, ambos SVGs recalculaban con sutiles diferencias
   * - Los controles aparecían desplazados respecto al pictograma (descalce)
   * - El descalce variaba según el nivel de zoom y posición del pan
   *
   * **Solución:**
   * Ahora usamos UN SOLO <svg> con dos grupos <g> hijos:
   * 1. <g id="pictogram-content"> - Contenido del pictograma original
   * 2. <g id="editing-controls"> - Controles interactivos (bounding box, nodos)
   *
   * **Beneficios:**
   * ✓ Un solo sistema de coordenadas compartido
   * ✓ Alineamiento perfecto garantizado matemáticamente
   * ✓ Sin descalce al redimensionar ventana
   * ✓ Consistencia visual absoluta
   * ✓ Mejor rendimiento (un solo árbol DOM)
   * ✓ Transformaciones CSS coherentes
   *
   * **Implementación:**
   * - parseSVGContent() extrae el innerHTML del SVG original
   * - Inyectamos ese HTML en <g id="pictogram-content">
   * - Los controles se renderizan como hermanos en el mismo <svg>
   * - Todos comparten el mismo viewBox y preserveAspectRatio
   *
   * @see {@link module:utils/svgParser.parseSVGContent} Parser del SVG
   * @see docs/coordinate-system.md Para detalles del sistema de coordenadas
   */
  const parsedSVG = useMemo(() => {
    if (!svgContent) return null;
    return parseSVGContent(svgContent);
  }, [svgContent]);

  // Opciones para Panzoom, memoizadas para evitar recreación
  // DEPENDEN DEL TOOL: Si no es 'hand', deshabilitar pan
  const panzoomOptions = useMemo(() => ({
    maxScale: 50,
    minScale: 0.001, // Permitir zoom out extremo
    step: 0.015, // Ultra-suave para trackpad (0.05 * 0.3)
    startScale: 1,
    // Deshabilitar pan si no estamos en herramienta mano
    disablePan: tool !== 'hand',
    cursor: tool === 'hand' ? 'grab' : 'default',
    // Sin restricciones de contain ni canvas
  }), [tool]);

  // Sistema de zoom y pan con @panzoom/panzoom
  const {
    panzoomState,
    zoomIn: panzoomZoomIn,
    zoomOut: panzoomZoomOut,
    zoom,
    pan: panzoomPan,
    reset: panzoomReset,
    enablePan,
    disablePan,
  } = usePanzoom({
    elementRef: svgContainerRef,
    panzoomOptions,
  });

  // Estado para almacenar el zoom real (usado para tamaño constante de handles)
  const [realZoom, setRealZoom] = useState(1);

  // Limpiar marquee al cambiar de herramienta
  useEffect(() => {
    setMarqueeRect(null);
  }, [tool]);

  // Controlar pan según herramienta activa
  useEffect(() => {
    if (tool === 'hand') {
      enablePan();
      console.log('✋ Hand tool - Pan habilitado');
    } else {
      disablePan();
      console.log('🔒 Tool:', tool, '- Pan deshabilitado');
    }
  }, [tool, enablePan, disablePan]);

  // Limpiar marquee con tecla Escape
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') {
        console.log('⌨️ Escape presionado - limpiando marquee y deseleccionando');
        setMarqueeRect(null);
        onElementSelect(null);
        setSelectedSVGElement(null);
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [onElementSelect]);

  // Función para calcular el zoom real considerando la escala inicial del SVG
  const calculateRealZoom = useCallback(() => {
    const svgElement = svgContainerRef.current?.querySelector('svg');
    if (!svgElement) {
      // console.log('🔍 calculateRealZoom: No SVG element found, using panzoom scale');
      setZoomInputValue(`${Math.round(panzoomState.scale * 100)}%`);
      setRealZoom(panzoomState.scale);
      return panzoomState.scale;
    }

    // Obtener el viewBox del SVG (tamaño lógico original)
    const viewBox = svgElement.viewBox.baseVal;
    // console.log('🔍 calculateRealZoom: viewBox', viewBox ? `${viewBox.width}x${viewBox.height}` : 'null');

    if (!viewBox || viewBox.width === 0) {
      // console.log('🔍 calculateRealZoom: Invalid viewBox, using panzoom scale');
      setZoomInputValue(`${Math.round(panzoomState.scale * 100)}%`);
      setRealZoom(panzoomState.scale);
      return panzoomState.scale;
    }

    // Obtener el tamaño renderizado del SVG
    const bbox = svgElement.getBoundingClientRect();
    // console.log('🔍 calculateRealZoom: bbox', `${bbox.width}x${bbox.height}`);

    // El zoom real es directamente: tamaño renderizado / tamaño lógico
    // bbox.width YA incluye la escala de panzoom, no multiplicar de nuevo
    const calculatedRealZoom = bbox.width / viewBox.width;
    /*
    console.log('🔍 calculateRealZoom: calculation', {
      bboxWidth: bbox.width,
      viewBoxWidth: viewBox.width,
      realZoom: calculatedRealZoom,
      panzoomScale: panzoomState.scale
    });
    */

    setZoomInputValue(`${Math.round(calculatedRealZoom * 100)}%`);
    setRealZoom(calculatedRealZoom);
    return calculatedRealZoom;
  }, [panzoomState.scale]);

  // Recalcular zoom cuando cambia la escala de panzoom o el contenido SVG
  useEffect(() => {
    calculateRealZoom();
  }, [calculateRealZoom, svgContent]);

  // Recalcular zoom cuando cambia el tamaño de la ventana
  useEffect(() => {
    const handleResize = () => {
      calculateRealZoom();
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, [calculateRealZoom]);

  // Establecer tamaño inicial del SVG para que llene el contenedor
  useEffect(() => {
    if (!svgContent) return;

    const svgElement = svgContainerRef.current?.querySelector('svg');
    const container = svgContainerRef.current;

    if (!svgElement || !container) return;

    // Obtener el viewBox del SVG
    const viewBox = svgElement.viewBox.baseVal;
    if (!viewBox || viewBox.width === 0 || viewBox.height === 0) return;

    // Obtener dimensiones del contenedor
    const containerRect = container.getBoundingClientRect();
    const containerWidth = containerRect.width;
    const containerHeight = containerRect.height;

    // Calcular el aspecto del viewBox y del contenedor
    const viewBoxAspect = viewBox.width / viewBox.height;
    const containerAspect = containerWidth / containerHeight;

    // Calcular el tamaño que hace que el SVG llene el contenedor manteniendo proporción
    let svgWidth, svgHeight;
    if (viewBoxAspect > containerAspect) {
      // SVG es más ancho - ajustar por ancho
      svgWidth = containerWidth * 0.8; // 80% del contenedor para dejar margen
      svgHeight = svgWidth / viewBoxAspect;
    } else {
      // SVG es más alto - ajustar por alto
      svgHeight = containerHeight * 0.8; // 80% del contenedor para dejar margen
      svgWidth = svgHeight * viewBoxAspect;
    }

    // Establecer tamaño inicial del SVG
    svgElement.setAttribute('width', svgWidth);
    svgElement.setAttribute('height', svgHeight);

    console.log('📐 Tamaño inicial del SVG establecido:', {
      viewBox: `${viewBox.width}x${viewBox.height}`,
      container: `${containerWidth}x${containerHeight}`,
      svg: `${svgWidth}x${svgHeight}`,
      scale: svgWidth / viewBox.width
    });

    // Centrar el SVG en el viewport
    setTimeout(() => {
      const svgRect = svgElement.getBoundingClientRect();
      const panX = (containerWidth - svgRect.width) / 2;
      const panY = (containerHeight - svgRect.height) / 2;

      // Usar panzoom para posicionar
      panzoomPan(panX, panY, { animate: false });

      calculateRealZoom();
      console.log('🎯 SVG centrado en viewport:', { panX, panY });
    }, 100);
  }, [svgContent, calculateRealZoom, panzoomPan]);

  // Sistema de historial
  const {
    pushState: saveToHistory,
    undo: undoChange,
    redo: redoChange,
    canUndo,
    canRedo
  } = useHistory(svgContent);

  // Sistema unificado de coordenadas y manipulación con SVGWorld
  const {
    isReady: isSVGWorldReady,
    screenToSVG,
    svgToScreen,
    screenDeltaToSVGDelta,
  } = useSVGWorld({
    svgRef: svgContainerRef,
    containerRef: containerRef,
    viewport: panzoomState,
  });

  // Estado para tracking de transformaciones manuales
  const [isDragging, setIsDragging] = useState(false);
  const [isResizing, setIsResizing] = useState(false);
  const dragStartRef = useRef(null);
  const resizeStartRef = useRef(null);

  // Handlers globales de mouse para drag y resize
  useEffect(() => {
    const handleMouseMove = (e) => {
      // Handler de drag
      if (isDragging && dragStartRef.current && selectedSVGElement) {
        const svgCoords = screenToSVG(e.clientX, e.clientY);
        const deltaX = svgCoords.x - dragStartRef.current.startX;
        const deltaY = svgCoords.y - dragStartRef.current.startY;

        const newTx = dragStartRef.current.initialTx + deltaX;
        const newTy = dragStartRef.current.initialTy + deltaY;

        selectedSVGElement.setAttribute('transform', `translate(${newTx}, ${newTy})`);
      }

      // Handler de resize
      if (isResizing && resizeStartRef.current && selectedSVGElement) {
        const svgCoords = screenToSVG(e.clientX, e.clientY);
        const { startX, startY, corner, bbox, initialScale, initialTx, initialTy } = resizeStartRef.current;

        // Calcular delta desde el punto de inicio
        const deltaX = svgCoords.x - startX;
        const deltaY = svgCoords.y - startY;

        // Calcular nueva escala según la esquina
        let scaleFactorX = 1;
        let scaleFactorY = 1;

        if (corner.includes('e')) {
          scaleFactorX = 1 + deltaX / bbox.width;
        } else if (corner.includes('w')) {
          scaleFactorX = 1 - deltaX / bbox.width;
        }

        if (corner.includes('s')) {
          scaleFactorY = 1 + deltaY / bbox.height;
        } else if (corner.includes('n')) {
          scaleFactorY = 1 - deltaY / bbox.height;
        }

        // Escala proporcional (tomar el promedio)
        const scaleFactor = (scaleFactorX + scaleFactorY) / 2;
        const newScale = Math.max(0.1, initialScale * scaleFactor);

        // Calcular ajuste de posición para mantener la esquina opuesta fija
        let pivotX = corner.includes('w') ? bbox.x + bbox.width : bbox.x;
        let pivotY = corner.includes('n') ? bbox.y + bbox.height : bbox.y;

        const newTx = pivotX - (pivotX - initialTx) * (newScale / initialScale);
        const newTy = pivotY - (pivotY - initialTy) * (newScale / initialScale);

        selectedSVGElement.setAttribute('transform', `translate(${newTx}, ${newTy}) scale(${newScale})`);
      }
    };

    const handleMouseUp = () => {
      if (isDragging || isResizing) {
        console.log('✅ Transformación finalizada');

        // Guardar en historial
        if (svgRef.current) {
          saveToHistory(svgRef.current.innerHTML);
        }

        // Reset estados
        setIsDragging(false);
        setIsResizing(false);
        dragStartRef.current = null;
        resizeStartRef.current = null;
      }
    };

    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);

    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };
  }, [isDragging, isResizing, selectedSVGElement, screenToSVG, saveToHistory]);

  // Registrar callback de historial con el padre
  useEffect(() => {
    if (onSaveHistory) {
      onSaveHistory(saveToHistory);
    }
  }, [onSaveHistory, saveToHistory]);


  // Sistema de rendimiento
  const {
    metrics
  } = usePerformance(svgContent, {
    enableVirtualization: true,
    maxElements: 1000,
    debounceMs: 100
  });

  const [showMetrics, setShowMetrics] = useState(false);

  /**
   * Maneja la selección de elementos en el SVG
   */
  const handleElementClick = (event) => {
    // Si la herramienta es HAND, no hacemos selección
    if (tool === 'hand') return;

    const target = event.target;
    const elementId = target.id || target.getAttribute('id');

    // Debug: Probar transformación de coordenadas
    const screenCoords = { x: event.clientX, y: event.clientY };
    const svgCoords = screenToSVG(screenCoords.x, screenCoords.y);

    /*
    console.log('🖱️ Click en elemento:', {
      elementId,
      tagName: target.tagName,
      tool,
      screenCoords,
      svgCoords,
      panzoomState,
      svgWorldReady: isSVGWorldReady
    });
    */

    if (tool === 'select') {
      // FLECHA NEGRA: Seleccionar elemento completo para mover/escalar/rotar

      // Si se hace click en el SVG raíz o sin elemento, iniciar marquee selection
      if (elementId === 'pictogram' || target.tagName === 'svg' || !elementId ||
        elementId === 'canvas-border' || elementId === 'pictoforge-main-svg') {
        // console.log('🔲 Click en fondo, iniciando marquee selection');
        event.stopPropagation();

        // Deseleccionar si no hay Shift presionado
        if (!event.shiftKey) {
          onElementSelect(null);
          setSelectedSVGElement(null);
        }

        // Iniciar marquee drag
        const startSVG = screenToSVG(event.clientX, event.clientY);
        let currentMarqueeRect = null;

        const handleMarqueeMove = (e) => {
          const currentSVG = screenToSVG(e.clientX, e.clientY);

          // Calcular rectángulo en coordenadas SVG
          const x = Math.min(startSVG.x, currentSVG.x);
          const y = Math.min(startSVG.y, currentSVG.y);
          const width = Math.abs(currentSVG.x - startSVG.x);
          const height = Math.abs(currentSVG.y - startSVG.y);

          currentMarqueeRect = { x, y, width, height };
          setMarqueeRect(currentMarqueeRect);
        };

        const handleMarqueeEnd = (e) => {
          console.log('🔲 Finalizando marquee selection');

          // IMPORTANTE: Remover event listeners primero
          document.removeEventListener('mousemove', handleMarqueeMove);
          document.removeEventListener('mouseup', handleMarqueeEnd);
          document.removeEventListener('mouseleave', handleMarqueeEnd);

          // Buscar elementos que intersecten con el marquee
          if (currentMarqueeRect && currentMarqueeRect.width > 5 && currentMarqueeRect.height > 5) {
            console.log('🔍 Buscando elementos en marquee:', currentMarqueeRect);
            const pictogramGroup = document.getElementById('pictogram-content');

            if (pictogramGroup) {
              // Obtener todos los elementos con id dentro del grupo
              const elements = pictogramGroup.querySelectorAll('[id]');
              const intersectingElements = [];

              elements.forEach(el => {
                try {
                  const bbox = el.getBBox();

                  // Verificar intersección con marquee
                  const intersects = !(
                    bbox.x + bbox.width < currentMarqueeRect.x ||
                    bbox.x > currentMarqueeRect.x + currentMarqueeRect.width ||
                    bbox.y + bbox.height < currentMarqueeRect.y ||
                    bbox.y > currentMarqueeRect.y + currentMarqueeRect.height
                  );

                  if (intersects) {
                    intersectingElements.push(el);
                  }
                } catch (err) {
                  // Ignorar elementos sin bbox
                }
              });

              console.log('✅ Elementos encontrados:', intersectingElements.length);

              // Por ahora, seleccionar el primer elemento (single selection)
              // TODO: Implementar selección múltiple
              if (intersectingElements.length > 0) {
                const firstElement = intersectingElements[0];
                const element = findElementInData(firstElement.id, svgData.root);
                if (element) {
                  onElementSelect(element);
                  setSelectedSVGElement(firstElement);
                  console.log('✅ Elemento seleccionado por marquee:', firstElement.id);
                }
              }
            }
          } else {
            console.log('🔲 Marquee muy pequeño o vacío, no se buscan elementos');
          }

          // IMPORTANTE: Limpiar marquee SIEMPRE
          console.log('🧹 Limpiando marquee');
          setMarqueeRect(null);
        };

        document.addEventListener('mousemove', handleMarqueeMove);
        document.addEventListener('mouseup', handleMarqueeEnd);
        // También escuchar mouseleave por si el usuario suelta fuera de la ventana
        document.addEventListener('mouseleave', handleMarqueeEnd);

        return;
      }

      event.stopPropagation();

      // Verificar que el elemento esté dentro del grupo pictogram-content
      // No seleccionar elementos de los grupos de controles o crop marks
      const pictogramGroup = document.getElementById('pictogram-content');
      const isInsidePictogram = pictogramGroup && pictogramGroup.contains(target);

      if (!isInsidePictogram) {
        // console.log('🚫 Click en elemento fuera de pictogram-content, ignorando');
        return;
      }

      if (elementId && svgData) {
        const element = findElementInData(elementId, svgData.root);
        // console.log('✅ Elemento encontrado en data:', element);
        if (element) {
          onElementSelect(element);
          setSelectedSVGElement(target);
          // console.log('✅ Elemento seleccionado para edición:', elementId);
        }
      } else {
        console.warn('⚠️ No se pudo seleccionar:', { elementId, hasSvgData: !!svgData });
      }
    } else if (tool === 'node') {
      // FLECHA BLANCA: Seleccionar cualquier elemento para editar nodos
      // Comportamiento de Selección Directa (Direct Selection) estándar

      const isSelectableTag = ['path', 'rect', 'circle', 'ellipse', 'line', 'polyline', 'polygon'].includes(target.tagName.toLowerCase());

      // Si se hace click en el fondo (no es un tag seleccionable y no tiene ID), deseleccionar
      if (!isSelectableTag && (elementId === 'pictogram' || target.tagName === 'svg' || !elementId || elementId === 'canvas-border')) {
        // Solo deseleccionar si realmente clickeamos el fondo
        // console.log('🚫 Click en fondo con flecha blanca, deseleccionando');
        onElementSelect(null);
        setSelectedSVGElement(null);
        return;
      }

      // Verificar que esté dentro del grupo pictogram-content
      const pictogramGroup = document.getElementById('pictogram-content');
      const isInsidePictogram = pictogramGroup && pictogramGroup.contains(target);

      if (!isInsidePictogram) {
        // console.log('🚫 Click fuera de pictogram-content con flecha blanca');
        return;
      }

      // Si es un elemento seleccionable, seleccionarlo!
      if (elementId && svgData) {
        const element = findElementInData(elementId, svgData.root);
        // console.log('✅ Elemento encontrado con flecha blanca:', element);
        if (element) {
          onElementSelect(element);
          setSelectedSVGElement(target);
          // console.log('✅ Elemento seleccionado para edición de nodos:', elementId);
        }
      } else if (isSelectableTag) {
        // Caso borde: Elemento seleccionable pero sin ID o no encontrado en data
        // Intentar seleccionarlo visualmente al menos
        console.warn('⚠️ Elemento seleccionable sin ID en data, seleccionando visualmente:', target);
        setSelectedSVGElement(target);
        onElementSelect({ id: elementId || 'temp-id', type: target.tagName, attributes: {} }); // Mock data
      }
    } else if (tool === 'pen') {
      // HERRAMIENTA PLUMA: Similar a node pero para agregar/eliminar nodos
      if (target.tagName === 'path' || target.tagName === 'PATH') {
        const element = findElementInData(elementId, svgData.root);
        if (element) {
          onElementSelect(element);
          setSelectedSVGElement(target);
        }
      }
    }
  };

  const handleDoubleClick = (event) => {
    const target = event.target;
    // Lista de tags que se pueden editar
    // Para path es directo, para otros quizás queramos permitir seleccionar
    if (['path', 'rect', 'circle', 'ellipse', 'line', 'polyline', 'polygon'].includes(target.tagName.toLowerCase())) {
      event.stopPropagation();
      console.log('⚡ Double Click detected on', target.tagName);

      // 1. Cambiar a herramienta 'node'
      setTool('node');

      // 2. Seleccionar el elemento
      const elementId = target.id || target.getAttribute('id');
      if (elementId && svgData) {
        const element = findElementInData(elementId, svgData.root);
        if (element) {
          onElementSelect(element);
          setSelectedSVGElement(target);
        }
      } else {
        // Fallback visual select
        setSelectedSVGElement(target);
        onElementSelect({ id: elementId || 'temp-doubleclick', type: target.tagName, attributes: {} });
      }
    }
  };

  /**
   * Busca un elemento en la estructura de datos por ID
   */
  const findElementInData = (id, element) => {
    if (element.id === id) return element;

    for (const child of element.children) {
      const found = findElementInData(id, child);
      if (found) return found;
    }

    return null;
  };

  /**
   * Maneja el zoom del SVG
   */
  const handleZoom = (direction) => {
    if (direction === 'in') {
      panzoomZoomIn();
    } else {
      panzoomZoomOut();
    }
  };

  const handleZoomInputChange = (e) => {
    setZoomInputValue(e.target.value);
  };

  const handleZoomInputCommit = () => {
    const value = parseFloat(zoomInputValue.replace('%', ''));
    if (!isNaN(value)) {
      const newScale = value / 100;
      zoom(newScale, { animate: true });
    } else {
      // Si el valor no es válido, volver al valor actual
      setZoomInputValue(`${Math.round(panzoomState.scale * 100)}%`);
    }
  };

  const handleZoomInputKeyDown = (e) => {
    if (e.key === 'Enter') {
      handleZoomInputCommit();
      e.target.blur(); // Quitar foco del input
    }
  };

  /**
   * Resetea la vista del SVG
   */
  const resetView = () => {
    panzoomReset();
  };

  // Pan manual eliminado - ahora lo maneja @panzoom/panzoom automáticamente

  /**
   * Genera un nombre único con timestamp
   */
  const generateUniqueFilename = (prefix = 'pictogram', extension = 'svg') => {
    const now = new Date();
    const timestamp = now.toISOString()
      .replace(/[:.]/g, '-')
      .replace('T', '_')
      .slice(0, -5); // Remover milisegundos y Z
    return `${prefix}_${timestamp}.${extension}`;
  };

  /**
   * Descarga el SVG actual con nombre único
   */
  const downloadSVG = () => {
    if (!svgContent) return;

    const blob = new Blob([svgContent], { type: 'image/svg+xml' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = generateUniqueFilename('pictoforge');
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  // Auto-focus al cargar contenido para que los atajos funcionen inmediatamente
  useEffect(() => {
    if (svgContent && containerRef.current) {
      containerRef.current.focus();
    }
  }, [svgContent]);

  // Efecto para resaltar elemento seleccionado y actualizar referencia DOM
  useEffect(() => {
    if (!svgRef.current) return;

    // Remover highlight anterior
    const prevHighlighted = svgRef.current.querySelector('.highlighted');
    if (prevHighlighted) {
      prevHighlighted.classList.remove('highlighted');
    }

    // Si hay un elemento seleccionado, buscarlo en el DOM y actualizar estado
    if (selectedElement?.id) {
      const element = svgRef.current.querySelector(`#${selectedElement.id}`);
      if (element) {
        element.classList.add('highlighted');
        setSelectedSVGElement(element);
        // console.log('🔄 Sincronización: Elemento DOM seleccionado desde prop:', selectedElement.id);
      } else {
        console.warn('⚠️ Sincronización: Elemento no encontrado en DOM:', selectedElement.id);
        setSelectedSVGElement(null);
      }
    } else {
      setSelectedSVGElement(null);
    }
  }, [selectedElement]);

  if (!svgContent) {
    return (
      <div className="h-full flex items-center justify-center bg-muted/20">
        <div className="text-center text-muted-foreground">
          <Maximize2 size={48} className="mx-auto mb-4 opacity-50" />
          <p>No hay SVG cargado</p>
          <p className="text-sm">Carga un archivo SVG para comenzar</p>
        </div>
      </div>
    );
  }

  return (
    <div
      className="h-full flex flex-col bg-background outline-none ring-offset-background focus-visible:ring-2 focus-visible:ring-ring"
      tabIndex="0"
      ref={containerRef}
      onMouseEnter={() => { isHoveringRef.current = true; }}
      onMouseLeave={() => { isHoveringRef.current = false; }}
    >
      {/* Barra de herramientas */}
      <div className="flex items-center justify-between p-2 border-b bg-muted/20">
        <div className="flex items-center gap-1">
          <Button
            variant={tool === 'select' ? 'default' : 'ghost'}
            size="sm"
            onClick={() => setTool('select')}
            title="Seleccionar y mover entidades (Flecha negra)"
          >
            <SelectArrowIcon size={16} />
          </Button>
          <Button
            variant={tool === 'hand' ? 'default' : 'ghost'}
            size="sm"
            onClick={() => setTool('hand')}
            title="Mano - Pan del canvas (H)"
          >
            <Hand size={16} />
          </Button>
          <Button
            variant={tool === 'node' ? 'default' : 'ghost'}
            size="sm"
            onClick={() => setTool('node')}
            title="Mover nodos (Flecha blanca)"
          >
            <MousePointerIcon size={16} />
          </Button>
          <Button
            variant={tool === 'pen' ? 'default' : 'ghost'}
            size="sm"
            onClick={() => setTool('pen')}
            title="Herramienta pluma - Editar nodos"
          >
            <PenToolIcon size={16} />
          </Button>
          <div className="w-px h-4 bg-border mx-1" />
          <Button
            variant={tool === 'hand' ? 'default' : 'ghost'}
            size="sm"
            onClick={() => setTool('hand')}
            title="Herramienta mano - Mover lienzo (Espacio)"
          >
            <HandIcon size={16} />
          </Button>
        </div>

        <div className="flex items-center gap-1">
          <Button
            variant="ghost"
            size="sm"
            onClick={undoChange}
            disabled={!canUndo}
            title="Deshacer"
          >
            <Undo size={16} />
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={redoChange}
            disabled={!canRedo}
            title="Rehacer"
          >
            <Redo size={16} />
          </Button>
          <div className="w-px h-4 bg-border mx-1" />
          <Button
            variant="ghost"
            size="sm"
            onClick={() => handleZoom('out')}
            title="Alejar"
          >
            <ZoomOut size={16} />
          </Button>
          <input
            type="text"
            value={zoomInputValue}
            onChange={handleZoomInputChange}
            onBlur={handleZoomInputCommit}
            onKeyDown={handleZoomInputKeyDown}
            className="w-16 text-sm text-center bg-transparent border border-border rounded-sm focus:ring-1 focus:ring-ring focus:outline-none"
            title="Establecer porcentaje de zoom"
          />
          <Button
            variant="ghost"
            size="sm"
            onClick={() => handleZoom('in')}
            title="Acercar"
          >
            <ZoomIn size={16} />
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={resetView}
            title="Resetear vista"
          >
            <RotateCcw size={16} />
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={downloadSVG}
            title="Exportar SVG"
          >
            <ShareIcon size={16} />
          </Button>
          <div className="w-px h-4 bg-border mx-1" />
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setShowMetrics(!showMetrics)}
            title="Mostrar métricas de rendimiento"
            className={showMetrics ? 'bg-blue-100' : ''}
          >
            📊
          </Button>
        </div>
      </div>

      {/* Área de visualización */}
      <div
        ref={containerRef}
        className={`flex-1 overflow-hidden relative bg-gradient-to-br from-muted/10 to-muted/30
          ${tool === 'node' ? 'cursor-move' :
            tool === 'pen' ? 'cursor-crosshair' :
              'cursor-default'}`}
      >
        {svgContent ? (
          <>
            {/* SVG Container with Panzoom */}
            <div
              ref={svgContainerRef}
              className="svg-panzoom-container"
              style={{
                position: 'relative',
                transformOrigin: '0 0',
                width: '100%',
                height: '100%',
              }}
            >
              {/* ARQUITECTURA NUEVA: Un solo SVG con todos los elementos */}
              <div
                ref={svgRef}
                className="svg-container"
                onClick={handleElementClick}
              >
                {parsedSVG && (
                  <svg
                    viewBox={parsedSVG.viewBox}
                    width="100%"
                    height="100%"
                    preserveAspectRatio={parsedSVG.preserveAspectRatio}
                    style={{
                      display: 'block',
                      background: 'var(--canvas-bg)'
                    }}
                    id="pictoforge-main-svg"
                  >
                    {/* Marco del pictograma (viewBox border) - NO seleccionable */}
                    <rect
                      x={parsedSVG.viewBox.split(' ')[0]}
                      y={parsedSVG.viewBox.split(' ')[1]}
                      width={parsedSVG.viewBox.split(' ')[2]}
                      height={parsedSVG.viewBox.split(' ')[3]}
                      fill="none"
                      stroke="var(--border)"
                      strokeWidth={realZoom > 0 ? 2 / realZoom : 2}
                      vectorEffect="non-scaling-stroke"
                      opacity={0.6}
                      pointerEvents="none"
                      id="canvas-border"
                    />

                    {/* Contenido del pictograma original */}
                    <g
                      id="pictogram-content"
                      dangerouslySetInnerHTML={{ __html: parsedSVG.innerContent }}
                    />

                    {/* Controles de edición interactivos */}
                    {selectedSVGElement && selectedSVGElement.id && typeof selectedSVGElement.getBBox === 'function' && (() => {
                      const [vbX, vbY, vbWidth, vbHeight] = parsedSVG.viewBox.split(' ').map(Number);
                      const viewBox = { x: vbX, y: vbY, width: vbWidth, height: vbHeight };

                      return (
                        <g id="editing-controls">
                          {/* Bounding Box Interactivo con handlers manuales */}
                          {tool === 'select' && (() => {
                            const bbox = selectedSVGElement.getBBox();
                            const targetStrokePixels = 2.5;
                            const strokeWidth = realZoom > 0 ? targetStrokePixels / realZoom : 0.2;
                            const handleSize = realZoom > 0 ? 8 / realZoom : 8;

                            // Handler de inicio de drag del elemento
                            const handleDragStart = (e) => {
                              e.stopPropagation(); // Prevenir eventos de pan
                              setIsDragging(true);

                              const svgCoords = screenToSVG(e.clientX, e.clientY);
                              const transform = selectedSVGElement.getAttribute('transform') || '';
                              const translateMatch = transform.match(/translate\(([^,]+),\s*([^)]+)\)/);
                              const currentTx = translateMatch ? parseFloat(translateMatch[1]) : 0;
                              const currentTy = translateMatch ? parseFloat(translateMatch[2]) : 0;

                              dragStartRef.current = {
                                startX: svgCoords.x,
                                startY: svgCoords.y,
                                initialTx: currentTx,
                                initialTy: currentTy,
                              };

                              console.log('🎯 Drag iniciado');
                            };

                            // Handler de inicio de resize
                            const handleResizeStart = (corner) => (e) => {
                              e.stopPropagation(); // Prevenir eventos de pan
                              setIsResizing(true);

                              const svgCoords = screenToSVG(e.clientX, e.clientY);
                              const transform = selectedSVGElement.getAttribute('transform') || '';
                              const scaleMatch = transform.match(/scale\(([^,)]+)(?:,\s*([^)]+))?\)/);
                              const translateMatch = transform.match(/translate\(([^,]+),\s*([^)]+)\)/);

                              const currentScale = scaleMatch ? parseFloat(scaleMatch[1]) : 1;
                              const currentTx = translateMatch ? parseFloat(translateMatch[1]) : 0;
                              const currentTy = translateMatch ? parseFloat(translateMatch[2]) : 0;

                              resizeStartRef.current = {
                                startX: svgCoords.x,
                                startY: svgCoords.y,
                                corner,
                                bbox,
                                initialScale: currentScale,
                                initialTx: currentTx,
                                initialTy: currentTy,
                              };

                              console.log('📏 Resize iniciado desde esquina:', corner);
                            };

                            return (
                              <>
                                {/* Rectángulo del bounding box - Draggable */}
                                <rect
                                  x={bbox.x}
                                  y={bbox.y}
                                  width={bbox.width}
                                  height={bbox.height}
                                  className="svg-bounding-box-simple"
                                  fill="rgba(59, 130, 246, 0.05)"
                                  stroke="#3b82f6"
                                  strokeWidth={strokeWidth}
                                  vectorEffect="non-scaling-stroke"
                                  style={{ cursor: 'move' }}
                                  pointerEvents="all"
                                  onMouseDown={handleDragStart}
                                />

                                {/* Handles de resize en las esquinas */}
                                {['nw', 'ne', 'sw', 'se'].map((corner) => {
                                  const x = corner.includes('w') ? bbox.x : bbox.x + bbox.width;
                                  const y = corner.includes('n') ? bbox.y : bbox.y + bbox.height;
                                  const cursor = corner === 'nw' || corner === 'se' ? 'nwse-resize' : 'nesw-resize';

                                  return (
                                    <rect
                                      key={corner}
                                      x={x - handleSize / 2}
                                      y={y - handleSize / 2}
                                      width={handleSize}
                                      height={handleSize}
                                      fill="white"
                                      stroke="#3b82f6"
                                      strokeWidth={strokeWidth}
                                      vectorEffect="non-scaling-stroke"
                                      style={{ cursor }}
                                      pointerEvents="all"
                                      onMouseDown={handleResizeStart(corner)}
                                    />
                                  );
                                })}
                              </>
                            );
                          })()}

                          {/* NodeEditor - Solo para herramientas NODE y PEN */}
                          {(tool === 'node' || tool === 'pen') && (
                            <NodeEditor
                              key={`node-editor-${selectedSVGElement?.id}-${elementVersion}`}
                              element={selectedSVGElement}
                              tool={tool}
                              visible={true}
                              viewBox={viewBox}
                              realZoom={realZoom}
                              onNodeChange={(oldNode, newNode) => {
                                // Actualizar el path en tiempo real
                                updateNodeInPath(selectedSVGElement, oldNode.index, newNode);
                                // Incrementar versión para forzar re-render del NodeEditor
                                setElementVersion(v => v + 1);
                              }}
                              onPathChange={() => {
                                // Llamado cuando cambia la topología del path (add/remove nodes)
                                setElementVersion(v => v + 1);

                                // Guardar historial immediatamente
                                if (svgRef.current) {
                                  const svgElement = svgRef.current.querySelector('svg');
                                  if (svgElement) {
                                    saveToHistory(svgElement.outerHTML);
                                    if (onSVGUpdate) {
                                      onSVGUpdate(svgElement.outerHTML);
                                    }
                                  }
                                }
                              }}
                              onNodeDragEnd={() => {
                                console.log('✅ Edición de nodos finalizada, guardando historial');
                                if (svgRef.current) {
                                  // Obtener el SVG completo serializado
                                  const svgElement = svgRef.current.querySelector('svg');
                                  if (svgElement) {
                                    const serializedSVG = svgElement.outerHTML;
                                    console.log('📦 SVG serializado:', serializedSVG.substring(0, 200) + '...');

                                    // Guardar en el historial
                                    saveToHistory(serializedSVG);

                                    // Actualizar el padre (App.jsx) con el nuevo SVG
                                    if (onSVGUpdate) {
                                      onSVGUpdate(serializedSVG);
                                    }
                                  }
                                }
                              }}
                              screenDeltaToSVGDelta={screenDeltaToSVGDelta}
                              screenToSVG={screenToSVG}
                            />
                          )}
                        </g>
                      );
                    })()}
                  </svg>
                )}
              </div>

              {/* Transformaciones manuales - Sin react-moveable, implementación directa */}
            </div>

            {/* Métricas de rendimiento (FUERA del panzoom container) */}
            <PerformanceMetrics
              metrics={metrics}
              visible={showMetrics}
            />
          </>
        ) : (
          <div className="flex-1 flex items-center justify-center text-gray-500">
            <div className="text-center">
              <div className="text-lg mb-2">No hay SVG cargado</div>
              <div className="text-sm">Carga un archivo SVG para comenzar</div>
            </div>
          </div>
        )}
      </div>
    </div >
  );
};

export default SVGViewer;
