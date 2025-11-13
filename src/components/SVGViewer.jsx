import React, { useRef, useState, useEffect } from 'react';
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
import MoveableWrapper from './MoveableWrapper';
import BezierHandleEditor from './BezierHandleEditor';
import NodeEditor from './NodeEditor';
import BoundingBox from './BoundingBox';
import useHistory from '../hooks/useHistory';
import usePerformance from '../hooks/usePerformance';
import usePanzoom from '../hooks/usePanzoom';
import useSVGWorld from '../hooks/useSVGWorld';
import useMoveable from '../hooks/useMoveable';
import PerformanceMetrics from './PerformanceMetrics';
import { rotateElement, scaleElement } from '../utils/svgManipulation';
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
  onToolChange
}) => {
  const svgRef = useRef(null);
  const containerRef = useRef(null);
  const svgContainerRef = useRef(null); // Ref para el contenedor panzoom
  const overlayRef = useRef(null); // Ref para el SVG overlay
  const [tool, setToolInternal] = useState(initialTool);
  const [selectedSVGElement, setSelectedSVGElement] = useState(null);
  const [containerDimensions, setContainerDimensions] = useState({ width: 0, height: 0 });

  // Wrapper para setTool que también llama al callback
  const setTool = (newTool) => {
    setToolInternal(newTool);
    onToolChange?.(newTool);
  };

  // Actualizar tool cuando cambia initialTool desde fuera
  useEffect(() => {
    setToolInternal(initialTool);
  }, [initialTool]);

  // Sincronizar selectedSVGElement cuando cambia selectedElement desde fuera (jerarquía)
  useEffect(() => {
    if (selectedElement && svgRef.current) {
      const domElement = svgRef.current.querySelector(`#${selectedElement.id}`);
      if (domElement) {
        setSelectedSVGElement(domElement);
        console.log('🔄 Sincronizando selección desde jerarquía:', selectedElement.id);
      }
    } else if (!selectedElement) {
      setSelectedSVGElement(null);
    }
  }, [selectedElement]);

  // Sistema de zoom y pan con @panzoom/panzoom
  const {
    panzoomState,
    isReady: isPanzoomReady,
    zoomIn: panzoomZoomIn,
    zoomOut: panzoomZoomOut,
    reset: panzoomReset,
    center: panzoomCenter,
  } = usePanzoom({
    elementRef: svgContainerRef,
    panzoomOptions: {
      maxScale: 10,
      minScale: 0.1,
      step: 0.3,
      startScale: 1,
      canvas: true,
    },
  });

  // Sistema unificado de coordenadas y manipulación con SVGWorld
  const {
    isReady: isSVGWorldReady,
    screenToSVG,
    svgToScreen,
    screenDeltaToSVGDelta,
    getElementBBox,
    moveElement,
    world: svgWorld,
  } = useSVGWorld({
    svgRef: svgContainerRef,
    containerRef: containerRef,
    viewport: panzoomState,
  });

  // Sistema de manipulación con Moveable
  const {
    isDragging: isMoveableDragging,
    isResizing,
    isRotating,
    handleDragStart,
    handleDrag,
    handleDragEnd,
    handleResizeStart,
    handleResize,
    handleResizeEnd,
    handleRotateStart,
    handleRotate,
    handleRotateEnd,
  } = useMoveable({
    coordinateTransformer: svgWorld,
    onTransformStart: (data) => {
      console.log('🎯 Transform Start:', data.type);
    },
    onTransform: (data) => {
      // Actualizar en tiempo real si es necesario
    },
    onTransformEnd: (data) => {
      console.log('🎯 Transform End:', data.type, data.transform);
      // Guardar en historial
      if (svgContent) {
        const svg = svgContainerRef.current?.querySelector('svg');
        if (svg) {
          saveToHistory(svg.outerHTML);
        }
      }
    },
  });

  // Sistema de historial
  const {
    currentState: svgHistory,
    pushState: saveToHistory,
    undo: undoChange,
    redo: redoChange,
    canUndo,
    canRedo
  } = useHistory(svgContent);

  // Sistema de rendimiento
  const {
    complexity,
    optimizeSVG,
    debounce,
    throttle,
    metrics
  } = usePerformance(svgContent, {
    enableVirtualization: true,
    maxElements: 1000,
    debounceMs: 100
  });

  const [showMetrics, setShowMetrics] = useState(false);

  /**
   * Actualiza las dimensiones del contenedor para el overlay
   */
  useEffect(() => {
    const updateDimensions = () => {
      if (containerRef.current) {
        const rect = containerRef.current.getBoundingClientRect();
        setContainerDimensions({
          width: rect.width,
          height: rect.height
        });
      }
    };

    updateDimensions();
    window.addEventListener('resize', updateDimensions);
    return () => window.removeEventListener('resize', updateDimensions);
  }, []);

  // Auto-selección eliminada - el usuario debe seleccionar manualmente

  /**
   * Maneja la selección de elementos en el SVG
   */
  const handleElementClick = (event) => {
    event.stopPropagation();

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

      // Bloquear selección del elemento raíz "pictogram"
      if (elementId === 'pictogram' || target.tagName === 'svg') {
        console.log('🚫 No se puede seleccionar el elemento raíz');
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
      // FLECHA BLANCA: Seleccionar path para editar nodos
      if (target.tagName === 'path') {
        const element = findElementInData(elementId, svgData.root);
        if (element) {
          onElementSelect(element);
          setSelectedSVGElement(target);
        }
      }
    } else if (tool === 'pen') {
      // HERRAMIENTA PLUMA: Similar a node pero para agregar/eliminar
      if (target.tagName === 'path') {
        setSelectedSVGElement(target);
      }
    }
  };

  /**
   * Maneja la manipulación de nodos individuales
   */
  const handleNodeManipulation = (event) => {
    const target = event.target;
    
    // Solo funciona en elementos path
    if (target.tagName === 'path') {
      const rect = target.getBoundingClientRect();
      const x = event.clientX - rect.left;
      const y = event.clientY - rect.top;
      
      console.log(`Manipulando nodo en: ${x}, ${y}`);
      // TODO: Implementar lógica de manipulación de nodos
      // - Detectar nodo más cercano
      // - Permitir arrastrar nodos
      // - Actualizar path data
    }
  };

  /**
   * Maneja la herramienta pluma para edición de nodos
   */
  const handlePenTool = (event) => {
    const target = event.target;
    
    if (target.tagName === 'path') {
      console.log('Herramienta pluma activada en path:', target.id);
      // TODO: Implementar herramienta pluma
      // - Agregar/eliminar nodos
      // - Cambiar tipo de nodo (smooth, corner, bezier)
      // - Mostrar handles de control
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
   * Resalta el elemento seleccionado
   */
  const highlightElement = (elementId) => {
    // Remover highlight anterior
    const prevHighlighted = svgRef.current?.querySelector('.highlighted');
    if (prevHighlighted) {
      prevHighlighted.classList.remove('highlighted');
    }

    // Agregar highlight al nuevo elemento por ID
    if (elementId && svgRef.current) {
      const element = svgRef.current.querySelector(`#${elementId}`);
      if (element) {
        element.classList.add('highlighted');
      }
    }
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

  // Efecto para resaltar elemento seleccionado
  useEffect(() => {
    if (!svgRef.current) return;

    // Remover highlight anterior
    const prevHighlighted = svgRef.current.querySelector('.highlighted');
    if (prevHighlighted) {
      prevHighlighted.classList.remove('highlighted');
    }

    // Agregar highlight al nuevo elemento
    if (selectedElement?.id) {
      highlightElement(selectedElement.id);
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
          <span className="text-sm text-muted-foreground min-w-[4rem] text-center">
            {Math.round(panzoomState.scale * 100)}%
          </span>
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
          ${tool === 'node' || isMoveableDragging ? 'cursor-move' :
            tool === 'pen' ? 'cursor-crosshair' :
            'cursor-default'}`}
      >
        {svgContent ? (
          <>
            {/* SVG Content - Panzoom aplica transformación automáticamente */}
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
              <div
                ref={svgRef}
                className="svg-container"
                onClick={handleElementClick}
              >
                <div dangerouslySetInnerHTML={{ __html: svgContent }} />
              </div>
            </div>

            {/* Overlay SVG - MISMO sistema de coordenadas que el SVG original */}
            {selectedSVGElement && (() => {
              const svg = svgRef.current?.querySelector('svg');
              if (!svg) return null;

              const viewBox = svg.viewBox.baseVal;
              const bbox = selectedSVGElement.getBBox();

              console.log('📦 BoundingBox en SVG coords:', { bbox, viewBox: `${viewBox.x} ${viewBox.y} ${viewBox.width} ${viewBox.height}` });

              return (
                <div
                  className="absolute inset-0 flex items-center justify-center pointer-events-none"
                  style={{
                    transform: `translate(${panzoomState.x}px, ${panzoomState.y}px) scale(${panzoomState.scale})`,
                    transformOrigin: 'center'
                  }}
                >
                  <svg
                    style={{
                      width: svg.clientWidth,
                      height: svg.clientHeight,
                      pointerEvents: 'none'
                    }}
                    viewBox={`${viewBox.x} ${viewBox.y} ${viewBox.width} ${viewBox.height}`}
                  >
                    {/* BoundingBox simple en coordenadas SVG */}
                    <rect
                      x={bbox.x}
                      y={bbox.y}
                      width={bbox.width}
                      height={bbox.height}
                      className="svg-bounding-box-simple"
                      pointerEvents="all"
                      onMouseDown={(e) => {
                        e.stopPropagation();
                        e.preventDefault();

                        const startX = e.clientX;
                        const startY = e.clientY;

                        // Obtener transform actual
                        const currentTransform = selectedSVGElement.getAttribute('transform') || '';
                        const translateMatch = currentTransform.match(/translate\(([^,]+),\s*([^)]+)\)/);
                        let currentTx = translateMatch ? parseFloat(translateMatch[1]) : 0;
                        let currentTy = translateMatch ? parseFloat(translateMatch[2]) : 0;

                        const handleMouseMove = (e) => {
                          const deltaX = e.clientX - startX;
                          const deltaY = e.clientY - startY;

                          // Convertir delta de píxeles a unidades SVG
                          const svgDeltaX = deltaX / panzoomState.scale;
                          const svgDeltaY = deltaY / panzoomState.scale;

                          // Aplicar nuevo transform
                          const newTx = currentTx + svgDeltaX;
                          const newTy = currentTy + svgDeltaY;

                          selectedSVGElement.setAttribute('transform', `translate(${newTx}, ${newTy})`);

                          // Forzar re-render del BoundingBox
                          setSelectedSVGElement(selectedSVGElement);
                        };

                        const handleMouseUp = () => {
                          document.removeEventListener('mousemove', handleMouseMove);
                          document.removeEventListener('mouseup', handleMouseUp);
                          console.log('✅ Drag completado');
                        };

                        document.addEventListener('mousemove', handleMouseMove);
                        document.addEventListener('mouseup', handleMouseUp);
                      }}
                    />

                    {/* Handles en las esquinas - TAMAÑO FIJO EN PÍXELES */}
                    {[
                      { x: bbox.x, y: bbox.y, cursorClass: 'cursor-nw-resize' },
                      { x: bbox.x + bbox.width, y: bbox.y, cursorClass: 'cursor-ne-resize' },
                      { x: bbox.x + bbox.width, y: bbox.y + bbox.height, cursorClass: 'cursor-se-resize' },
                      { x: bbox.x, y: bbox.y + bbox.height, cursorClass: 'cursor-sw-resize' }
                    ].map((pos, i) => (
                      <rect
                        key={i}
                        x={pos.x - 0.8}
                        y={pos.y - 0.8}
                        width={1.6}
                        height={1.6}
                        className={`svg-resize-handle-simple ${pos.cursorClass}`}
                        pointerEvents="all"
                        onMouseDown={(e) => {
                          console.log('🖱️ MouseDown en handle', i);
                          e.stopPropagation();
                        }}
                      />
                    ))}

                    {/* Manipulador de rotación - círculo arriba del centro */}
                    <line
                      x1={bbox.x + bbox.width / 2}
                      y1={bbox.y}
                      x2={bbox.x + bbox.width / 2}
                      y2={bbox.y - 5}
                      className="svg-rotation-line"
                      pointerEvents="none"
                    />
                    <circle
                      cx={bbox.x + bbox.width / 2}
                      cy={bbox.y - 5}
                      r={1}
                      className="svg-rotation-handle"
                      pointerEvents="all"
                      onMouseDown={(e) => {
                        console.log('🔄 MouseDown en rotación');
                        e.stopPropagation();
                      }}
                    />
                  </svg>
                </div>
              );
            })()}

            {/* Overlay SVG viejo - mantener para NodeEditor */}
            <svg
              ref={overlayRef}
              className="absolute inset-0 w-full h-full pointer-events-none"
              viewBox={`0 0 ${containerDimensions.width || 800} ${containerDimensions.height || 600}`}
              style={{ zIndex: 10, display: 'none' }}
            >
              <BoundingBox
                  element={null}
                  onResize={(handleId, deltaX, deltaY) => {
                    if (!selectedSVGElement) return;
                    
                    // Guardar estado antes del cambio
                    saveToHistory(svgRef.current?.innerHTML);
                    
                    const bbox = getElementBBox(selectedSVGElement);
                    if (!bbox) return;
                    
                    // Calcular nueva escala basada en el handle
                    let scaleX = 1, scaleY = 1;
                    
                    switch (handleId) {
                      case 'se': // esquina inferior derecha
                        scaleX = (bbox.width + deltaX) / bbox.width;
                        scaleY = (bbox.height + deltaY) / bbox.height;
                        break;
                      case 'e': // lado derecho
                        scaleX = (bbox.width + deltaX) / bbox.width;
                        break;
                      case 's': // lado inferior
                        scaleY = (bbox.height + deltaY) / bbox.height;
                        break;
                      case 'nw': // esquina superior izquierda
                        scaleX = (bbox.width - deltaX) / bbox.width;
                        scaleY = (bbox.height - deltaY) / bbox.height;
                        break;
                    }
                    
                    scaleElement(selectedSVGElement, scaleX, scaleY, bbox.x, bbox.y);
                  }}
                  onMove={(deltaX, deltaY) => {
                    if (!selectedSVGElement) return;
                    moveElement(selectedSVGElement, deltaX, deltaY);
                  }}
                  onRotate={(angle, centerX, centerY) => {
                    if (!selectedSVGElement) return;

                    // Guardar estado antes del cambio (solo la primera vez)
                    if (!isMoveableDragging) {
                      saveToHistory(svgRef.current?.innerHTML);
                    }

                    rotateElement(selectedSVGElement, angle, centerX, centerY);
                  }}
                />
                
                <NodeEditor
                  element={selectedSVGElement}
                  tool={tool}
                  visible={(tool === 'node' || tool === 'pen') && selectedSVGElement}
                  viewport={{ zoom: panzoomState.scale, pan: { x: panzoomState.x, y: panzoomState.y } }}
                  containerRef={containerRef}
                  onNodeChange={(oldNode, newNode) => {
                    if (!selectedSVGElement) return;
                    
                    // Guardar estado antes del cambio
                    saveToHistory(svgRef.current?.innerHTML);
                    
                    // Actualizar el nodo en el path
                    updateNodeInPath(selectedSVGElement, oldNode.index, newNode);
                  }}
                  onNodeAdd={(position) => {
                    if (!selectedSVGElement) return;
                    
                    // Guardar estado antes del cambio
                    saveToHistory(svgRef.current?.innerHTML);
                    
                    // Agregar nuevo nodo al path
                    addNodeToPath(selectedSVGElement, position);
                  }}
                  onNodeRemove={(node) => {
                    if (!selectedSVGElement) return;
                    
                    // Guardar estado antes del cambio
                    saveToHistory(svgRef.current?.innerHTML);
                    
                    // Eliminar nodo del path
                    removeNodeFromPath(selectedSVGElement, node.index);
                  }}
                />
              </svg>

            {/* Métricas de rendimiento */}
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
    </div>
  );
};

export default SVGViewer;
