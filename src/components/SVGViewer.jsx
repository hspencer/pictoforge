import React, { useRef, useEffect, useState } from 'react';
import { 
  MousePointer, 
  Move, 
  Edit3, 
  ZoomIn, 
  ZoomOut, 
  RotateCcw, 
  Download,
  Maximize2 
} from 'lucide-react';
import { Button } from '@/components/ui/button';

/**
 * Componente para visualizar y editar SVG
 */
export const SVGViewer = ({ 
  svgContent, 
  selectedElement, 
  onElementSelect,
  svgData 
}) => {
  const svgRef = useRef(null);
  const containerRef = useRef(null);
  const [tool, setTool] = useState('select'); // select, move, edit
  const [zoom, setZoom] = useState(1);
  const [pan, setPan] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });

  /**
   * Maneja la selección de elementos en el SVG
   */
  const handleElementClick = (event) => {
    event.stopPropagation();
    
    if (tool !== 'select') return;

    const target = event.target;
    const elementId = target.id || target.getAttribute('id');
    
    if (elementId && svgData) {
      const element = findElementInData(elementId, svgData.root);
      if (element) {
        onElementSelect(element);
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
   * Resalta el elemento seleccionado
   */
  const highlightElement = (element) => {
    // Remover highlight anterior
    const prevHighlighted = svgRef.current?.querySelector('.highlighted');
    if (prevHighlighted) {
      prevHighlighted.classList.remove('highlighted');
    }

    // Agregar highlight al nuevo elemento
    if (element) {
      element.classList.add('highlighted');
    }
  };

  /**
   * Maneja el zoom del SVG
   */
  const handleZoom = (direction) => {
    const factor = direction === 'in' ? 1.2 : 0.8;
    setZoom(prev => Math.max(0.1, Math.min(5, prev * factor)));
  };

  /**
   * Resetea la vista del SVG
   */
  const resetView = () => {
    setZoom(1);
    setPan({ x: 0, y: 0 });
  };

  /**
   * Maneja el inicio del arrastre para pan
   */
  const handleMouseDown = (event) => {
    if (tool === 'move' || event.button === 1) { // Middle mouse button
      setIsDragging(true);
      setDragStart({ x: event.clientX - pan.x, y: event.clientY - pan.y });
      event.preventDefault();
    }
  };

  /**
   * Maneja el movimiento del mouse para pan
   */
  const handleMouseMove = (event) => {
    if (isDragging) {
      setPan({
        x: event.clientX - dragStart.x,
        y: event.clientY - dragStart.y
      });
    }
  };

  /**
   * Maneja el fin del arrastre
   */
  const handleMouseUp = () => {
    setIsDragging(false);
  };

  /**
   * Descarga el SVG actual
   */
  const downloadSVG = () => {
    if (!svgContent) return;

    const blob = new Blob([svgContent], { type: 'image/svg+xml' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'pictogram.svg';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  // Efectos para manejar eventos globales
  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    container.addEventListener('mousemove', handleMouseMove);
    container.addEventListener('mouseup', handleMouseUp);
    container.addEventListener('mouseleave', handleMouseUp);

    return () => {
      container.removeEventListener('mousemove', handleMouseMove);
      container.removeEventListener('mouseup', handleMouseUp);
      container.removeEventListener('mouseleave', handleMouseUp);
    };
  }, [isDragging, dragStart, pan]);

  // Efecto para resaltar elemento seleccionado
  useEffect(() => {
    if (!svgRef.current) return;

    // Remover highlight anterior
    const prevHighlighted = svgRef.current.querySelector('.highlighted');
    if (prevHighlighted) {
      prevHighlighted.classList.remove('highlighted');
    }

    // Agregar highlight al nuevo elemento
    if (selectedElement) {
      const element = svgRef.current.querySelector(`#${selectedElement.id}`);
      if (element) {
        highlightElement(element);
      }
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
            title="Seleccionar (Flecha negra)"
          >
            <MousePointer size={16} />
          </Button>
          <Button
            variant={tool === 'move' ? 'default' : 'ghost'}
            size="sm"
            onClick={() => setTool('move')}
            title="Mover vista (Flecha blanca)"
          >
            <Move size={16} />
          </Button>
          <Button
            variant={tool === 'edit' ? 'default' : 'ghost'}
            size="sm"
            onClick={() => setTool('edit')}
            title="Editar (Pluma)"
          >
            <Edit3 size={16} />
          </Button>
        </div>

        <div className="flex items-center gap-1">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => handleZoom('out')}
            title="Alejar"
          >
            <ZoomOut size={16} />
          </Button>
          <span className="text-sm text-muted-foreground min-w-[4rem] text-center">
            {Math.round(zoom * 100)}%
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
            title="Descargar SVG"
          >
            <Download size={16} />
          </Button>
        </div>
      </div>

      {/* Área de visualización */}
      <div 
        ref={containerRef}
        className="flex-1 overflow-hidden relative bg-gradient-to-br from-muted/10 to-muted/30"
        onMouseDown={handleMouseDown}
        style={{ cursor: tool === 'move' || isDragging ? 'move' : 'default' }}
      >
        <div 
          className="absolute inset-0 flex items-center justify-center"
          style={{
            transform: `translate(${pan.x}px, ${pan.y}px) scale(${zoom})`,
            transformOrigin: 'center'
          }}
        >
          <div 
            ref={svgRef}
            className="svg-container"
            dangerouslySetInnerHTML={{ __html: svgContent }}
            onClick={handleElementClick}
          />
        </div>

        {/* Información de coordenadas */}
        {svgData && (
          <div className="absolute bottom-4 right-4 bg-background/80 backdrop-blur-sm border rounded px-2 py-1 text-xs text-muted-foreground">
            {svgData.width} × {svgData.height}
          </div>
        )}
      </div>
    </div>
  );
};

export default SVGViewer;
