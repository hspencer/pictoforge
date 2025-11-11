import React, { useRef, useState } from 'react';
import { useVisualManipulation } from '@/utils/visualManipulation';
import { pointsToPath } from '@/utils/pathEncoding';
import { Button } from '@/components/ui/button';

/**
 * Componente de demostración del sistema de transformación de coordenadas
 * Muestra cómo usar las utilidades para manipular SVG con zoom y pan
 */
export const CoordinateDemo = () => {
  const svgRef = useRef(null);
  const [zoom, setZoom] = useState(1);
  const [pan, setPan] = useState({ x: 0, y: 0 });
  const [mode, setMode] = useState('select'); // 'select', 'draw', 'node'
  const [drawPoints, setDrawPoints] = useState([]);
  const [selectedNode, setSelectedNode] = useState(null);
  const [pathId] = useState('demo-path');
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState(null);

  // Usar el hook de manipulación visual
  const {
    handleNodeDrag,
    findClosestNode,
    insertNode,
    screenToSVG
  } = useVisualManipulation(svgRef, { zoom, pan });

  // Handlers de zoom
  const handleZoomIn = () => setZoom(z => Math.min(z * 1.2, 5));
  const handleZoomOut = () => setZoom(z => Math.max(z / 1.2, 0.1));
  const handleResetView = () => {
    setZoom(1);
    setPan({ x: 0, y: 0 });
  };

  // Handler de pan
  const handlePan = (e) => {
    if (mode !== 'select' || !isDragging || !dragStart) return;

    setPan({
      x: e.clientX - dragStart.x,
      y: e.clientY - dragStart.y
    });
  };

  // Modo dibujo: agregar puntos al hacer click
  const handleDrawClick = (e) => {
    if (mode !== 'draw') return;

    const rect = svgRef.current.getBoundingClientRect();
    const svgCoords = screenToSVG(e.clientX, e.clientY);

    const newPoints = [...drawPoints, svgCoords];
    setDrawPoints(newPoints);

    // Actualizar el path
    const pathElement = document.getElementById(pathId);
    if (pathElement) {
      const pathData = pointsToPath(newPoints, false);
      pathElement.setAttribute('d', pathData);
    }
  };

  // Modo nodo: seleccionar nodo al hacer click
  const handleNodeClick = (e) => {
    if (mode !== 'node') return;

    const pathElement = document.getElementById(pathId);
    if (!pathElement) return;

    const closest = findClosestNode(
      pathElement,
      { screenX: e.clientX, screenY: e.clientY },
      15 // threshold
    );

    setSelectedNode(closest);
  };

  // Arrastrar nodo seleccionado
  const handleMouseMove = (e) => {
    if (mode === 'select' && isDragging) {
      handlePan(e);
    } else if (mode === 'node' && selectedNode && isDragging) {
      const pathElement = document.getElementById(pathId);
      if (pathElement) {
        handleNodeDrag(
          pathElement,
          selectedNode.index,
          { screenX: e.clientX, screenY: e.clientY }
        );
      }
    }
  };

  // Doble click: insertar nodo en path
  const handleDoubleClick = (e) => {
    if (mode !== 'node') return;

    const pathElement = document.getElementById(pathId);
    if (pathElement && drawPoints.length > 0) {
      const newNode = insertNode(
        pathElement,
        { screenX: e.clientX, screenY: e.clientY }
      );

      if (newNode) {
        // Actualizar drawPoints para mantener sincronía
        const pathData = pathElement.getAttribute('d');
        // Re-parsear puntos desde el path actualizado
        console.log('Nodo insertado:', newNode);
      }
    }
  };

  const handleMouseDown = (e) => {
    setIsDragging(true);
    if (mode === 'select') {
      setDragStart({ x: e.clientX - pan.x, y: e.clientY - pan.y });
    }
  };

  const handleMouseUp = () => {
    setIsDragging(false);
    setDragStart(null);
  };

  // Limpiar canvas
  const handleClear = () => {
    setDrawPoints([]);
    setSelectedNode(null);
    const pathElement = document.getElementById(pathId);
    if (pathElement) {
      pathElement.setAttribute('d', '');
    }
  };

  // Finalizar path (cerrar)
  const handleFinishPath = () => {
    if (drawPoints.length < 2) return;

    const pathElement = document.getElementById(pathId);
    if (pathElement) {
      const pathData = pointsToPath(drawPoints, true); // closed = true
      pathElement.setAttribute('d', pathData);
    }
    setMode('node'); // Cambiar a modo edición
  };

  return (
    <div className="flex flex-col h-screen bg-background">
      {/* Barra de herramientas */}
      <div className="flex items-center justify-between p-4 border-b bg-muted/20">
        <div className="flex items-center gap-2">
          <h2 className="text-lg font-semibold mr-4">Demo: Transformación de Coordenadas</h2>

          <div className="flex gap-1 border-r pr-2 mr-2">
            <Button
              variant={mode === 'select' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setMode('select')}
            >
              Pan
            </Button>
            <Button
              variant={mode === 'draw' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setMode('draw')}
            >
              Dibujar
            </Button>
            <Button
              variant={mode === 'node' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setMode('node')}
              disabled={drawPoints.length === 0}
            >
              Editar Nodos
            </Button>
          </div>

          {mode === 'draw' && drawPoints.length >= 2 && (
            <Button
              size="sm"
              onClick={handleFinishPath}
              variant="secondary"
            >
              Finalizar Path
            </Button>
          )}

          <Button
            size="sm"
            onClick={handleClear}
            variant="destructive"
          >
            Limpiar
          </Button>
        </div>

        <div className="flex items-center gap-2">
          <Button size="sm" variant="outline" onClick={handleZoomOut}>
            Zoom -
          </Button>
          <span className="text-sm font-mono min-w-[4rem] text-center">
            {Math.round(zoom * 100)}%
          </span>
          <Button size="sm" variant="outline" onClick={handleZoomIn}>
            Zoom +
          </Button>
          <Button size="sm" variant="outline" onClick={handleResetView}>
            Reset
          </Button>
        </div>
      </div>

      {/* Info panel */}
      <div className="px-4 py-2 bg-blue-50 border-b text-sm">
        <p>
          <strong>Modo actual:</strong>{' '}
          {mode === 'select' && '📋 Pan - Arrastra para mover la vista'}
          {mode === 'draw' && '✏️ Dibujar - Click para agregar puntos'}
          {mode === 'node' && '🎯 Editar Nodos - Click para seleccionar, arrastra para mover, doble-click para insertar'}
        </p>
        <p className="text-xs mt-1 text-muted-foreground">
          Pan: ({pan.x.toFixed(0)}, {pan.y.toFixed(0)}) | Zoom: {zoom.toFixed(2)}x |
          Puntos: {drawPoints.length}
          {selectedNode && ` | Nodo seleccionado: ${selectedNode.index}`}
        </p>
      </div>

      {/* Canvas SVG */}
      <div
        ref={svgRef}
        className="flex-1 overflow-hidden relative bg-gradient-to-br from-muted/10 to-muted/30"
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseUp}
        onClick={mode === 'draw' ? handleDrawClick : mode === 'node' ? handleNodeClick : undefined}
        onDoubleClick={handleDoubleClick}
        style={{
          cursor: mode === 'select' ? (isDragging ? 'grabbing' : 'grab') :
                  mode === 'draw' ? 'crosshair' :
                  'pointer'
        }}
      >
        <div
          style={{
            transform: `translate(${pan.x}px, ${pan.y}px) scale(${zoom})`,
            transformOrigin: 'center',
            width: '100%',
            height: '100%',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center'
          }}
        >
          <svg
            width="600"
            height="400"
            viewBox="0 0 600 400"
            style={{ border: '2px solid #ccc', background: 'white' }}
          >
            {/* Grid de referencia */}
            <defs>
              <pattern id="grid" width="50" height="50" patternUnits="userSpaceOnUse">
                <path
                  d="M 50 0 L 0 0 0 50"
                  fill="none"
                  stroke="#e0e0e0"
                  strokeWidth="1"
                />
              </pattern>
            </defs>
            <rect width="600" height="400" fill="url(#grid)" />

            {/* Ejes de coordenadas */}
            <line x1="0" y1="200" x2="600" y2="200" stroke="#ccc" strokeWidth="2" />
            <line x1="300" y1="0" x2="300" y2="400" stroke="#ccc" strokeWidth="2" />

            {/* Path dibujado */}
            <path
              id={pathId}
              d=""
              stroke="#2563eb"
              strokeWidth="3"
              fill="none"
              strokeLinecap="round"
              strokeLinejoin="round"
            />

            {/* Visualizar nodos */}
            {mode === 'node' && drawPoints.map((point, index) => (
              <g key={index}>
                <circle
                  cx={point.x}
                  cy={point.y}
                  r="5"
                  fill={selectedNode?.index === index ? '#ef4444' : '#2563eb'}
                  stroke="white"
                  strokeWidth="2"
                  style={{ cursor: 'pointer' }}
                />
                <text
                  x={point.x + 10}
                  y={point.y - 10}
                  fontSize="12"
                  fill="#666"
                >
                  {index}
                </text>
              </g>
            ))}

            {/* Punto de preview al dibujar */}
            {mode === 'draw' && drawPoints.length > 0 && (
              <circle
                cx={drawPoints[drawPoints.length - 1].x}
                cy={drawPoints[drawPoints.length - 1].y}
                r="5"
                fill="#10b981"
                opacity="0.5"
              />
            )}
          </svg>
        </div>
      </div>

      {/* Panel de coordenadas en tiempo real */}
      <div className="p-4 border-t bg-muted/10">
        <div className="grid grid-cols-2 gap-4 text-sm font-mono">
          <div>
            <strong>Últimas coordenadas SVG:</strong>
            {drawPoints.length > 0 && (
              <div className="mt-1">
                x: {drawPoints[drawPoints.length - 1].x.toFixed(2)},
                y: {drawPoints[drawPoints.length - 1].y.toFixed(2)}
              </div>
            )}
          </div>
          <div>
            <strong>Path data:</strong>
            <div className="mt-1 text-xs overflow-x-auto max-w-md">
              {drawPoints.length > 0 ? pointsToPath(drawPoints, false).substring(0, 100) + '...' : 'Sin path'}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CoordinateDemo;
