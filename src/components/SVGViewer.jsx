import React, { useRef, useState, useEffect, useMemo, useCallback } from 'react';
import {
  ZoomIn,
  ZoomOut,
  RotateCcw,
  Maximize2,
  Undo,
  Redo
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { SelectArrowIcon, MousePointerIcon, PenToolIcon, ShareIcon } from './CustomIcons';
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
  onSaveHistory
}) => {
  const svgRef = useRef(null);
  const containerRef = useRef(null);
  const svgContainerRef = useRef(null); // Ref para el contenedor panzoom
  const [tool, setToolInternal] = useState(initialTool);
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
  const panzoomOptions = useMemo(() => ({
    maxScale: 50,
    minScale: 0.001, // Permitir zoom out extremo
    step: 0.015, // Ultra-suave para trackpad (0.05 * 0.3)
    startScale: 1,
    // Sin restricciones de contain ni canvas
  }), []);

  // Sistema de zoom y pan con @panzoom/panzoom
  const {
    panzoomState,
    zoomIn: panzoomZoomIn,
    zoomOut: panzoomZoomOut,
    zoom,
    pan: panzoomPan,
    reset: panzoomReset,
  } = usePanzoom({
    elementRef: svgContainerRef,
    panzoomOptions,
  });

  // Estado para almacenar el zoom real (usado para tamaño constante de handles)
  const [realZoom, setRealZoom] = useState(1);

  // Función para calcular el zoom real considerando la escala inicial del SVG
  const calculateRealZoom = useCallback(() => {
    const svgElement = svgContainerRef.current?.querySelector('svg');
    if (!svgElement) {
      console.log('🔍 calculateRealZoom: No SVG element found, using panzoom scale');
      setZoomInputValue(`${Math.round(panzoomState.scale * 100)}%`);
      setRealZoom(panzoomState.scale);
      return panzoomState.scale;
    }

    // Obtener el viewBox del SVG (tamaño lógico original)
    const viewBox = svgElement.viewBox.baseVal;
    console.log('🔍 calculateRealZoom: viewBox', viewBox ? `${viewBox.width}x${viewBox.height}` : 'null');

    if (!viewBox || viewBox.width === 0) {
      console.log('🔍 calculateRealZoom: Invalid viewBox, using panzoom scale');
      setZoomInputValue(`${Math.round(panzoomState.scale * 100)}%`);
      setRealZoom(panzoomState.scale);
      return panzoomState.scale;
    }

    // Obtener el tamaño renderizado del SVG
    const bbox = svgElement.getBoundingClientRect();
    console.log('🔍 calculateRealZoom: bbox', `${bbox.width}x${bbox.height}`);

    // El zoom real es directamente: tamaño renderizado / tamaño lógico
    // bbox.width YA incluye la escala de panzoom, no multiplicar de nuevo
    const calculatedRealZoom = bbox.width / viewBox.width;
    console.log('🔍 calculateRealZoom: calculation', {
      bboxWidth: bbox.width,
      viewBoxWidth: viewBox.width,
      realZoom: calculatedRealZoom,
      panzoomScale: panzoomState.scale
    });

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

  // Sistema de historial
  const {
    pushState: saveToHistory,
    undo: undoChange,
    redo: redoChange,
    canUndo,
    canRedo
  } = useHistory(svgContent);

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
    const target = event.target;
    const elementId = target.id || target.getAttribute('id');

    // Debug: Probar transformación de coordenadas
    const screenCoords = { x: event.clientX, y: event.clientY };
    const svgCoords = screenToSVG(screenCoords.x, screenCoords.y);

    console.log('🖱️ Click en elemento:', {
      elementId,
      tagName: target.tagName,
      tool,
      screenCoords,
      svgCoords,
      panzoomState,
      svgWorldReady: isSVGWorldReady
    });

    if (tool === 'select') {
      // FLECHA NEGRA: Seleccionar elemento completo para mover/escalar/rotar

      // Si se hace click en el SVG raíz o sin elemento, iniciar marquee selection
      if (elementId === 'pictogram' || target.tagName === 'svg' || !elementId ||
          elementId === 'canvas-border' || elementId === 'pictoforge-main-svg') {
        console.log('🔲 Click en fondo, iniciando marquee selection');
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
          document.removeEventListener('mousemove', handleMarqueeMove);
          document.removeEventListener('mouseup', handleMarqueeEnd);

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
          }

          // Limpiar marquee
          setMarqueeRect(null);
        };

        document.addEventListener('mousemove', handleMarqueeMove);
        document.addEventListener('mouseup', handleMarqueeEnd);

        return;
      }

      event.stopPropagation();

      // Verificar que el elemento esté dentro del grupo pictogram-content
      // No seleccionar elementos de los grupos de controles o crop marks
      const pictogramGroup = document.getElementById('pictogram-content');
      const isInsidePictogram = pictogramGroup && pictogramGroup.contains(target);

      if (!isInsidePictogram) {
        console.log('🚫 Click en elemento fuera de pictogram-content, ignorando');
        return;
      }

      if (elementId && svgData) {
        const element = findElementInData(elementId, svgData.root);
        console.log('✅ Elemento encontrado en data:', element);
        if (element) {
          onElementSelect(element);
          setSelectedSVGElement(target);
          console.log('✅ Elemento seleccionado para edición:', elementId);
        }
      } else {
        console.warn('⚠️ No se pudo seleccionar:', { elementId, hasSvgData: !!svgData });
      }
    } else if (tool === 'node') {
      // FLECHA BLANCA: Seleccionar cualquier elemento para editar nodos
      // Comportamiento similar a Direct Selection Tool de Illustrator

      // Si se hace click en el fondo, deseleccionar
      if (elementId === 'pictogram' || target.tagName === 'svg' || !elementId) {
        console.log('🚫 Click en fondo con flecha blanca, deseleccionando');
        onElementSelect(null);
        setSelectedSVGElement(null);
        return;
      }

      // Verificar que esté dentro del grupo pictogram-content
      const pictogramGroup = document.getElementById('pictogram-content');
      const isInsidePictogram = pictogramGroup && pictogramGroup.contains(target);

      if (!isInsidePictogram) {
        console.log('🚫 Click fuera de pictogram-content con flecha blanca');
        return;
      }

      // Seleccionar elemento (paths, circles, rects, etc.)
      if (elementId && svgData) {
        const element = findElementInData(elementId, svgData.root);
        console.log('✅ Elemento encontrado con flecha blanca:', element);
        if (element) {
          onElementSelect(element);
          setSelectedSVGElement(target);
          console.log('✅ Elemento seleccionado para edición de nodos:', elementId);
        }
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
        console.log('🔄 Sincronización: Elemento DOM seleccionado desde prop:', selectedElement.id);
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
    <div className="h-full flex flex-col bg-background">
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

                    {/* Rectángulo de marquee selection */}
                    {marqueeRect && (
                      <g id="marquee-selection">
                        <rect
                          x={marqueeRect.x}
                          y={marqueeRect.y}
                          width={marqueeRect.width}
                          height={marqueeRect.height}
                          fill="rgba(59, 130, 246, 0.1)"
                          stroke="#3b82f6"
                          strokeWidth={realZoom > 0 ? 1 / realZoom : 1}
                          vectorEffect="non-scaling-stroke"
                          strokeDasharray="5,5"
                          pointerEvents="none"
                        />
                      </g>
                    )}

                    {/* Controles de edición - SIEMPRE visible cuando hay elemento seleccionado */}
                    {selectedSVGElement && selectedSVGElement.id && typeof selectedSVGElement.getBBox === 'function' && (() => {
                      const [vbX, vbY, vbWidth, vbHeight] = parsedSVG.viewBox.split(' ').map(Number);
                      const viewBox = { x: vbX, y: vbY, width: vbWidth, height: vbHeight };

                      // SIMPLIFICACIÓN: Siempre mostrar controles cuando hay selección
                      // No requerir cambio de herramienta para ver el elemento seleccionado

                      return (
                        <g
                          id="editing-controls"
                          style={{
                            pointerEvents: 'none'
                          }}
                        >
                          {/* BoundingBox - SIEMPRE visible para indicar selección */}
                          {(() => {
                            // Obtener bbox - Por ahora usamos getBBox() nativo
                            // TODO: Implementar transformación manual para elementos con transforms
                            const bbox = selectedSVGElement.getBBox();

                            console.log('🔍 BoundingBox Debug:', {
                              elementId: selectedSVGElement.id,
                              bbox: { x: bbox.x, y: bbox.y, width: bbox.width, height: bbox.height },
                              transform: selectedSVGElement.getAttribute('transform')
                            });

                            // Ahora trabajamos directamente en coordenadas SVG, sin conversión
                            const x = bbox.x;
                            const y = bbox.y;
                            const width = bbox.width;
                            const height = bbox.height;

                            // Calcular tamaño de handles en píxeles constantes (no escalan con zoom)
                            // Target: 10 píxeles de pantalla para handles, 25 píxeles para offset de rotación
                            const targetHandlePixels = 10;
                            const targetRotateOffsetPixels = 25;
                            const targetStrokePixels = 2.5; // Líneas más gruesas para mejor visibilidad
                            const handleSize = realZoom > 0 ? targetHandlePixels / realZoom : 3;
                            const rotateHandleOffset = realZoom > 0 ? targetRotateOffsetPixels / realZoom : 5;
                            const strokeWidth = realZoom > 0 ? targetStrokePixels / realZoom : 0.2;

                            return (
                              <>
                                {/* Bounding Box Outline - grosor constante en píxeles */}
                                <rect
                                  x={x}
                                  y={y}
                                  width={width}
                                  height={height}
                                  className="svg-bounding-box-simple"
                                  fill="none"
                                  stroke="#3b82f6"
                                  strokeWidth={strokeWidth}
                                  vectorEffect="non-scaling-stroke"
                                  pointerEvents="none"
                                />

                                {/* Área de arrastre transparente sobre el elemento */}
                                <rect
                                  x={x}
                                  y={y}
                                  width={width}
                                  height={height}
                                  fill="transparent"
                                  pointerEvents="all"
                                  style={{ cursor: 'move' }}
                                  onMouseDown={(e) => {
                                    e.stopPropagation();
                                    e.preventDefault();

                                    const startX = e.clientX;
                                    const startY = e.clientY;
                                    const shiftPressed = e.shiftKey;
                                    const altPressed = e.altKey || e.metaKey; // Alt/Option

                                    // Si Alt está presionado, duplicar el elemento
                                    let elementToTransform = selectedSVGElement;
                                    if (altPressed) {
                                      console.log('🔄 Alt presionado: Duplicando elemento');
                                      const clone = selectedSVGElement.cloneNode(true);
                                      // Generar nuevo ID único
                                      const originalId = selectedSVGElement.id;
                                      clone.id = `${originalId}-copy-${Date.now()}`;
                                      // Insertar después del original
                                      selectedSVGElement.parentNode.insertBefore(clone, selectedSVGElement.nextSibling);
                                      elementToTransform = clone;
                                      // Seleccionar la copia
                                      setSelectedSVGElement(clone);
                                    }

                                    // Obtener transform actual del elemento a transformar
                                    const currentTransform = elementToTransform.getAttribute('transform') || '';
                                    const translateMatch = currentTransform.match(/translate\(([^,]+),\s*([^)]+)\)/);
                                    let currentTx = translateMatch ? parseFloat(translateMatch[1]) : 0;
                                    let currentTy = translateMatch ? parseFloat(translateMatch[2]) : 0;

                                    const handleMouseMove = (e) => {
                                      const deltaX = e.clientX - startX;
                                      const deltaY = e.clientY - startY;

                                      // Convertir delta de píxeles a unidades SVG
                                      let svgDelta = screenDeltaToSVGDelta(deltaX, deltaY);

                                      // Si Shift está presionado, restringir a 45° o 90°
                                      if (shiftPressed || e.shiftKey) {
                                        const angle = Math.atan2(svgDelta.dy, svgDelta.dx);
                                        const distance = Math.sqrt(svgDelta.dx ** 2 + svgDelta.dy ** 2);

                                        // Snap a múltiplos de 45° (0°, 45°, 90°, 135°, 180°, etc.)
                                        const snapAngle = Math.round(angle / (Math.PI / 4)) * (Math.PI / 4);

                                        svgDelta = {
                                          dx: distance * Math.cos(snapAngle),
                                          dy: distance * Math.sin(snapAngle)
                                        };
                                      }

                                      // Aplicar nuevo transform
                                      const newTx = currentTx + svgDelta.dx;
                                      const newTy = currentTy + svgDelta.dy;

                                      elementToTransform.setAttribute('transform', `translate(${newTx}, ${newTy})`);
                                    };

                                    const handleMouseUp = () => {
                                      document.removeEventListener('mousemove', handleMouseMove);
                                      document.removeEventListener('mouseup', handleMouseUp);
                                      console.log('✅ Drag completado', {
                                        duplicated: altPressed,
                                        constrained: shiftPressed
                                      });
                                      if (svgRef.current) {
                                        const content = svgRef.current.innerHTML;
                                        saveToHistory(content);
                                        onSaveHistory?.(content);
                                      }
                                    };

                                    document.addEventListener('mousemove', handleMouseMove);
                                    document.addEventListener('mouseup', handleMouseUp);
                                  }}
                                />

                                {/* Handles en las esquinas - SOLO con herramienta SELECT */}
                                {tool === 'select' && [
                                  { x: x, y: y, cursor: 'nw-resize', id: 'nw' },
                                  { x: x + width, y: y, cursor: 'ne-resize', id: 'ne' },
                                  { x: x + width, y: y + height, cursor: 'se-resize', id: 'se' },
                                  { x: x, y: y + height, cursor: 'sw-resize', id: 'sw' }
                                ].map((pos, i) => (
                                  <rect
                                    key={i}
                                    x={pos.x - handleSize / 2}
                                    y={pos.y - handleSize / 2}
                                    width={handleSize}
                                    height={handleSize}
                                    fill="white"
                                    stroke="#3b82f6"
                                    strokeWidth={strokeWidth}
                                    vectorEffect="non-scaling-stroke"
                                    style={{ cursor: pos.cursor }}
                                    pointerEvents="all"
                                    onMouseDown={(e) => {
                                      e.stopPropagation();
                                      e.preventDefault();

                                      const corner = pos.id;
                                      const startX = e.clientX;
                                      const startY = e.clientY;
                                      const shiftPressed = e.shiftKey;
                                      const altPressed = e.altKey || e.metaKey;

                                      console.log('🔍 Inicio de escala desde', corner, {
                                        shiftPressed,
                                        altPressed,
                                        bbox: { x, y, width, height }
                                      });

                                      // Obtener transform actual
                                      const currentTransform = selectedSVGElement.getAttribute('transform') || '';
                                      const translateMatch = currentTransform.match(/translate\(([^,]+),\s*([^)]+)\)/);
                                      const scaleMatch = currentTransform.match(/scale\(([^,)]+)(?:,\s*([^)]+))?\)/);

                                      let currentTx = translateMatch ? parseFloat(translateMatch[1]) : 0;
                                      let currentTy = translateMatch ? parseFloat(translateMatch[2]) : 0;
                                      let currentScaleX = scaleMatch ? parseFloat(scaleMatch[1]) : 1;
                                      let currentScaleY = scaleMatch && scaleMatch[2] ? parseFloat(scaleMatch[2]) : currentScaleX;

                                      // Punto de origen para la escala (opuesto al corner arrastrado)
                                      const originMap = {
                                        'nw': { x: x + width, y: y + height },  // Escala desde SE
                                        'ne': { x: x, y: y + height },          // Escala desde SW
                                        'se': { x: x, y: y },                   // Escala desde NW
                                        'sw': { x: x + width, y: y }            // Escala desde NE
                                      };

                                      let origin = originMap[corner];
                                      const initialWidth = width;
                                      const initialHeight = height;

                                      // Si Alt está presionado, escalar desde el centro
                                      if (altPressed) {
                                        origin = { x: x + width / 2, y: y + height / 2 };
                                      }

                                      const handleMouseMove = (e) => {
                                        const deltaX = e.clientX - startX;
                                        const deltaY = e.clientY - startY;

                                        // Convertir delta a SVG
                                        const svgDelta = screenDeltaToSVGDelta(deltaX, deltaY);

                                        // Calcular nuevo tamaño basado en el corner
                                        let newWidth = initialWidth;
                                        let newHeight = initialHeight;

                                        switch (corner) {
                                          case 'se':
                                            newWidth = initialWidth + svgDelta.dx;
                                            newHeight = initialHeight + svgDelta.dy;
                                            break;
                                          case 'sw':
                                            newWidth = initialWidth - svgDelta.dx;
                                            newHeight = initialHeight + svgDelta.dy;
                                            break;
                                          case 'ne':
                                            newWidth = initialWidth + svgDelta.dx;
                                            newHeight = initialHeight - svgDelta.dy;
                                            break;
                                          case 'nw':
                                            newWidth = initialWidth - svgDelta.dx;
                                            newHeight = initialHeight - svgDelta.dy;
                                            break;
                                        }

                                        // Calcular factores de escala
                                        let scaleX = newWidth / initialWidth;
                                        let scaleY = newHeight / initialHeight;

                                        // Si Shift está presionado, mantener proporción (escala uniforme)
                                        if (shiftPressed || e.shiftKey) {
                                          const avgScale = (scaleX + scaleY) / 2;
                                          scaleX = avgScale;
                                          scaleY = avgScale;
                                        }

                                        // Si Alt está presionado, escalar desde centro (doble el efecto)
                                        if (altPressed || e.altKey || e.metaKey) {
                                          scaleX = 1 + (scaleX - 1) * 2;
                                          scaleY = 1 + (scaleY - 1) * 2;
                                        }

                                        // Aplicar escala acumulada
                                        const finalScaleX = currentScaleX * scaleX;
                                        const finalScaleY = currentScaleY * scaleY;

                                        // Construir transform completo
                                        // Orden: translate al origen, scale, translate de vuelta
                                        const tx = currentTx + origin.x - origin.x * finalScaleX / currentScaleX;
                                        const ty = currentTy + origin.y - origin.y * finalScaleY / currentScaleY;

                                        selectedSVGElement.setAttribute(
                                          'transform',
                                          `translate(${tx}, ${ty}) scale(${finalScaleX}, ${finalScaleY})`
                                        );
                                      };

                                      const handleMouseUp = () => {
                                        document.removeEventListener('mousemove', handleMouseMove);
                                        document.removeEventListener('mouseup', handleMouseUp);
                                        console.log('✅ Escala completada', {
                                          corner,
                                          proportional: shiftPressed,
                                          fromCenter: altPressed
                                        });
                                        if (svgRef.current) {
                                          saveToHistory(svgRef.current.innerHTML);
                                        }
                                      };

                                      document.addEventListener('mousemove', handleMouseMove);
                                      document.addEventListener('mouseup', handleMouseUp);
                                    }}
                                  />
                                ))}

                                {/* Manipulador de rotación - SOLO con herramienta SELECT */}
                                {tool === 'select' && (
                                  <>
                                    <line
                                      x1={x + width / 2}
                                      y1={y}
                                      x2={x + width / 2}
                                      y2={y - rotateHandleOffset}
                                      stroke="#3b82f6"
                                      strokeWidth={strokeWidth}
                                      vectorEffect="non-scaling-stroke"
                                      pointerEvents="none"
                                    />
                                    <circle
                                  cx={x + width / 2}
                                  cy={y - rotateHandleOffset}
                                  r={handleSize / 2}
                                  fill="white"
                                  stroke="#3b82f6"
                                  strokeWidth={strokeWidth}
                                  vectorEffect="non-scaling-stroke"
                                  style={{ cursor: 'grab' }}
                                  pointerEvents="all"
                                  onMouseDown={(e) => {
                                    e.stopPropagation();
                                    e.preventDefault();

                                    const shiftPressed = e.shiftKey;
                                    console.log('🔄 Inicio de rotación', { shiftPressed });

                                    // Centro de rotación (centro del bounding box)
                                    const centerX = x + width / 2;
                                    const centerY = y + height / 2;

                                    // Convertir centro a coordenadas de pantalla
                                    const centerScreen = svgToScreen(centerX, centerY);

                                    // Obtener transform actual
                                    const currentTransform = selectedSVGElement.getAttribute('transform') || '';
                                    const translateMatch = currentTransform.match(/translate\(([^,]+),\s*([^)]+)\)/);
                                    const scaleMatch = currentTransform.match(/scale\(([^,)]+)(?:,\s*([^)]+))?\)/);
                                    const rotateMatch = currentTransform.match(/rotate\(([^,)]+)(?:\s*,\s*([^,)]+)\s*,\s*([^)]+))?\)/);

                                    let currentTx = translateMatch ? parseFloat(translateMatch[1]) : 0;
                                    let currentTy = translateMatch ? parseFloat(translateMatch[2]) : 0;
                                    let currentScaleX = scaleMatch ? parseFloat(scaleMatch[1]) : 1;
                                    let currentScaleY = scaleMatch && scaleMatch[2] ? parseFloat(scaleMatch[2]) : currentScaleX;
                                    let currentRotation = rotateMatch ? parseFloat(rotateMatch[1]) : 0;

                                    // Calcular ángulo inicial
                                    const startAngle = Math.atan2(
                                      e.clientY - centerScreen.y,
                                      e.clientX - centerScreen.x
                                    ) * 180 / Math.PI;

                                    const handleMouseMove = (e) => {
                                      // Calcular ángulo actual
                                      const currentAngle = Math.atan2(
                                        e.clientY - centerScreen.y,
                                        e.clientX - centerScreen.x
                                      ) * 180 / Math.PI;

                                      // Delta de rotación
                                      let deltaAngle = currentAngle - startAngle;

                                      // Si Shift está presionado, snap a múltiplos de 15°
                                      if (shiftPressed || e.shiftKey) {
                                        const totalAngle = currentRotation + deltaAngle;
                                        const snappedAngle = Math.round(totalAngle / 15) * 15;
                                        deltaAngle = snappedAngle - currentRotation;
                                      }

                                      const newRotation = currentRotation + deltaAngle;

                                      // Construir transform completo
                                      // Orden: translate, rotate (alrededor del centro del bbox), scale
                                      let transform = '';
                                      if (currentTx !== 0 || currentTy !== 0) {
                                        transform += `translate(${currentTx}, ${currentTy}) `;
                                      }
                                      transform += `rotate(${newRotation}, ${centerX}, ${centerY}) `;
                                      if (currentScaleX !== 1 || currentScaleY !== 1) {
                                        transform += `scale(${currentScaleX}, ${currentScaleY})`;
                                      }

                                      selectedSVGElement.setAttribute('transform', transform.trim());
                                    };

                                    const handleMouseUp = () => {
                                      document.removeEventListener('mousemove', handleMouseMove);
                                      document.removeEventListener('mouseup', handleMouseUp);
                                      console.log('✅ Rotación completada', {
                                        snapped: shiftPressed
                                      });
                                      if (svgRef.current) {
                                        saveToHistory(svgRef.current.innerHTML);
                                      }
                                    };

                                    document.addEventListener('mousemove', handleMouseMove);
                                    document.addEventListener('mouseup', handleMouseUp);
                                  }}
                                />
                                  </>
                                )}
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
                              onNodeDragEnd={() => {
                                console.log('✅ Edición de nodos finalizada, guardando historial');
                                if (svgRef.current) {
                                  saveToHistory(svgRef.current.innerHTML);
                                }
                              }}
                              screenDeltaToSVGDelta={screenDeltaToSVGDelta}
                            />
                          )}
                        </g>
                      );
                    })()}
                  </svg>
                )}
              </div>
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
