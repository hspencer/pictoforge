import React, { useState, useRef, useCallback, useEffect } from 'react';
import { DesignTokens, getTypography, getSpacing, getColor, getSvgColor, getBorderRadius, getElevation } from '@/lib/design-system';
import { ZoomIn, ZoomOut, Maximize2, MousePointer, Edit } from 'lucide-react';

interface SvgNode {
  id: string;
  type: 'svg' | 'g' | 'circle' | 'rect' | 'path' | 'line' | 'polygon' | 'ellipse' | 'text';
  attributes: Record<string, any>;
  children: SvgNode[];
  content?: string;
}

interface ReactSvgEditorProps {
  width?: number;
  height?: number;
  onNodeSelect?: (node: SvgNode | null) => void;
  onNodeUpdate?: (nodeId: string, updates: Partial<SvgNode>) => void;
  initialSvg?: string;
  editMode?: boolean;
  selectedElementId?: string | null;
  toolbarHeight?: number;
  showVertexHandles?: boolean;
}

const defaultSvgStructure: SvgNode = {
  id: 'root',
  type: 'svg',
  attributes: {
    viewBox: '0 0 400 300',
    width: 400,
    height: 300,
    xmlns: 'http://www.w3.org/2000/svg'
  },
  children: []
};

export default function ReactSvgEditor({ 
  width = 400, 
  height = 300, 
  onNodeSelect, 
  onNodeUpdate,
  initialSvg,
  editMode = false,
  selectedElementId = null,
  toolbarHeight = 56,
  showVertexHandles = false
}: ReactSvgEditorProps) {
  const [svgStructure, setSvgStructure] = useState<SvgNode>(defaultSvgStructure);
  const [selectedNodeId, setSelectedNodeId] = useState<string | null>(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [currentTool, setCurrentTool] = useState<'pan' | 'select' | 'circle' | 'rect' | 'path' | 'text'>('pan');
  const [dragStart, setDragStart] = useState<{ x: number; y: number } | null>(null);
  const [zoom, setZoom] = useState(1);
  const [panX, setPanX] = useState(0);
  const [panY, setPanY] = useState(0);
  const [showZoomSlider, setShowZoomSlider] = useState(false);
  const [initialZoomSet, setInitialZoomSet] = useState(false);
  const svgRef = useRef<SVGSVGElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  // Zoom functions
  const handleZoomIn = () => {
    setZoom(prevZoom => Math.min(prevZoom * 1.2, 10));
  };

  const handleZoomOut = () => {
    setZoom(prevZoom => Math.max(prevZoom / 1.2, 0.1));
  };

  const calculateSvgBounds = (node: SvgNode): { minX: number, minY: number, maxX: number, maxY: number } | null => {
    let bounds = { minX: Infinity, minY: Infinity, maxX: -Infinity, maxY: -Infinity };
    let hasElements = false;

    const extractBounds = (n: SvgNode) => {
      switch (n.type) {
        case 'circle':
          const cx = parseFloat(n.attributes.cx || '0');
          const cy = parseFloat(n.attributes.cy || '0');
          const r = parseFloat(n.attributes.r || '0');
          bounds.minX = Math.min(bounds.minX, cx - r);
          bounds.minY = Math.min(bounds.minY, cy - r);
          bounds.maxX = Math.max(bounds.maxX, cx + r);
          bounds.maxY = Math.max(bounds.maxY, cy + r);
          hasElements = true;
          break;
        case 'rect':
          const x = parseFloat(n.attributes.x || '0');
          const y = parseFloat(n.attributes.y || '0');
          const w = parseFloat(n.attributes.width || '0');
          const h = parseFloat(n.attributes.height || '0');
          bounds.minX = Math.min(bounds.minX, x);
          bounds.minY = Math.min(bounds.minY, y);
          bounds.maxX = Math.max(bounds.maxX, x + w);
          bounds.maxY = Math.max(bounds.maxY, y + h);
          hasElements = true;
          break;
        case 'path':
          // Simple approximation for path bounds
          const d = n.attributes.d || '';
          const numbers = d.match(/[-+]?[0-9]*\.?[0-9]+/g);
          if (numbers) {
            for (let i = 0; i < numbers.length; i += 2) {
              if (numbers[i + 1]) {
                const x = parseFloat(numbers[i]);
                const y = parseFloat(numbers[i + 1]);
                bounds.minX = Math.min(bounds.minX, x);
                bounds.minY = Math.min(bounds.minY, y);
                bounds.maxX = Math.max(bounds.maxX, x);
                bounds.maxY = Math.max(bounds.maxY, y);
                hasElements = true;
              }
            }
          }
          break;
      }
      
      n.children.forEach(extractBounds);
    };

    extractBounds(node);
    return hasElements ? bounds : null;
  };

  const handleZoomExtents = () => {
    const bounds = calculateSvgBounds(svgStructure);
    if (!bounds) return;

    const padding = 20;
    const boundsWidth = bounds.maxX - bounds.minX + padding * 2;
    const boundsHeight = bounds.maxY - bounds.minY + padding * 2;
    
    // Calculate zoom to fit content in visible area
    const scaleX = width / boundsWidth;
    const scaleY = height / boundsHeight;
    const newZoom = Math.min(scaleX, scaleY, 10);
    
    // Calculate the center point of the content bounds
    const contentCenterX = (bounds.minX + bounds.maxX) / 2;
    const contentCenterY = (bounds.minY + bounds.maxY) / 2;
    
    // Calculate pan to center the content in the visible area
    // The visible area center is at (width/2, height/2)
    // We want the content center to align with the visible area center
    const newPanX = (width / 2) - (contentCenterX * newZoom);
    const newPanY = (height / 2) - (contentCenterY * newZoom);
    
    setZoom(newZoom);
    setPanX(newPanX);
    setPanY(newPanY);
  };

  // Material Design 3 styled components
  const materialStyles = {
    container: {
      background: getColor('surface.main'),
      borderRadius: getBorderRadius('lg'),
      ...getElevation('level2'),
      border: `1px solid ${getColor('outline.variant')}`,
      overflow: 'hidden'
    },
    toolbar: {
      background: getColor('surface.variant'),
      padding: getSpacing('md'),
      borderBottom: `1px solid ${getColor('outline.variant')}`,
      display: 'flex',
      gap: getSpacing('sm'),
      alignItems: 'center'
    },
    toolButton: (isActive: boolean) => ({
      padding: `${getSpacing('sm')} ${getSpacing('md')}`,
      borderRadius: getBorderRadius('md'),
      border: 'none',
      background: isActive ? getColor('primary.container') : 'transparent',
      color: isActive ? getColor('primary.onContainer') : getColor('surface.onVariant'),
      cursor: 'pointer',
      ...getTypography('label', 'medium'),
      transition: `all ${DesignTokens.animation.duration.normal} ${DesignTokens.animation.easing.standard}`,
      ':hover': {
        background: isActive ? getColor('primary.container') : getColor('surface.variant')
      }
    }),
    svgCanvas: {
      width: '100%',
      height: '100%',
      background: getSvgColor('background.main'),
      cursor: currentTool === 'select' ? 'default' : 'crosshair'
    }
  };

  // Parse initial SVG if provided
  useEffect(() => {
    if (initialSvg) {
      try {
        const parser = new DOMParser();
        const doc = parser.parseFromString(initialSvg, 'image/svg+xml');
        const svgElement = doc.querySelector('svg');
        if (svgElement) {
          const structure = domNodeToSvgNode(svgElement);
          setSvgStructure(structure);
          setInitialZoomSet(false); // Reset flag to trigger zoom extents
        }
      } catch (error) {
        console.error('Error parsing initial SVG:', error);
      }
    }
  }, [initialSvg]);

  // Auto zoom to extents when SVG structure changes
  useEffect(() => {
    if (!initialZoomSet && svgStructure.children.length > 0) {
      setTimeout(() => {
        handleZoomExtents();
        setInitialZoomSet(true);
      }, 100); // Small delay to ensure DOM is ready
    }
  }, [svgStructure, initialZoomSet]);

  // Handle wheel zoom
  const handleWheel = useCallback((event: WheelEvent) => {
    if (event.ctrlKey || event.metaKey) {
      event.preventDefault();
      const delta = event.deltaY > 0 ? 0.9 : 1.1;
      setZoom(prevZoom => Math.max(0.1, Math.min(10, prevZoom * delta)));
    }
  }, []);

  // Add wheel event listener
  useEffect(() => {
    const container = containerRef.current;
    if (container) {
      container.addEventListener('wheel', handleWheel, { passive: false });
      return () => container.removeEventListener('wheel', handleWheel);
    }
  }, [handleWheel]);

  const domNodeToSvgNode = (element: Element): SvgNode => {
    const attributes: Record<string, any> = {};
    Array.from(element.attributes).forEach(attr => {
      attributes[attr.name] = attr.value;
    });

    const children: SvgNode[] = [];
    Array.from(element.children).forEach(child => {
      children.push(domNodeToSvgNode(child));
    });

    return {
      id: attributes.id || `node-${Math.random().toString(36).substr(2, 9)}`,
      type: element.tagName.toLowerCase() as SvgNode['type'],
      attributes,
      children,
      content: element.textContent || undefined
    };
  };

  const getSVGCoordinates = (event: React.MouseEvent<SVGSVGElement>) => {
    if (!svgRef.current) return { x: 0, y: 0 };
    
    const rect = svgRef.current.getBoundingClientRect();
    const viewBox = svgRef.current.viewBox.baseVal;
    
    const scaleX = viewBox.width / rect.width;
    const scaleY = viewBox.height / rect.height;
    
    return {
      x: (event.clientX - rect.left) * scaleX + viewBox.x,
      y: (event.clientY - rect.top) * scaleY + viewBox.y
    };
  };

  const handleMouseDown = (event: React.MouseEvent<SVGSVGElement>) => {
    const coords = getSVGCoordinates(event);
    setDragStart(coords);

    if (currentTool === 'pan') {
      setIsDrawing(true);
      // For pan, store screen coordinates instead of SVG coordinates
      setDragStart({ x: event.clientX - panX, y: event.clientY - panY });
    } else if (currentTool !== 'select') {
      setIsDrawing(true);
    }
  };

  const handleMouseMove = (event: React.MouseEvent<SVGSVGElement>) => {
    if (!isDrawing || !dragStart) return;
    
    if (currentTool === 'pan') {
      // Pan functionality
      setPanX(event.clientX - dragStart.x);
      setPanY(event.clientY - dragStart.y);
    } else {
      const coords = getSVGCoordinates(event);
      // Update preview of shape being drawn
    }
  };

  const handleMouseUp = (event: React.MouseEvent<SVGSVGElement>) => {
    if (!isDrawing || !dragStart) return;
    
    const coords = getSVGCoordinates(event);
    createShape(dragStart, coords);
    
    setIsDrawing(false);
    setDragStart(null);
  };

  const createShape = (start: { x: number; y: number }, end: { x: number; y: number }) => {
    const newNode: SvgNode = {
      id: `node-${Date.now()}`,
      type: currentTool as SvgNode['type'],
      attributes: {},
      children: []
    };

    switch (currentTool) {
      case 'circle':
        const radius = Math.sqrt(Math.pow(end.x - start.x, 2) + Math.pow(end.y - start.y, 2));
        newNode.attributes = {
          cx: start.x,
          cy: start.y,
          r: radius,
          fill: getSvgColor('primary.main'),
          stroke: getSvgColor('primary.onContainer'),
          strokeWidth: 2
        };
        break;
        
      case 'rect':
        newNode.attributes = {
          x: Math.min(start.x, end.x),
          y: Math.min(start.y, end.y),
          width: Math.abs(end.x - start.x),
          height: Math.abs(end.y - start.y),
          fill: getSvgColor('secondary.main'),
          stroke: getSvgColor('secondary.onContainer'),
          strokeWidth: 2,
          rx: getBorderRadius('sm')
        };
        break;
        
      case 'text':
        newNode.attributes = {
          x: start.x,
          y: start.y,
          fontSize: DesignTokens.typography.scale.body.large.size,
          fontFamily: DesignTokens.typography.fontFamily.primary,
          fill: getSvgColor('surface.onSurface')
        };
        newNode.content = 'Edit text';
        break;
    }

    // Add the new node to the SVG structure
    setSvgStructure(prev => ({
      ...prev,
      children: [...prev.children, newNode]
    }));

    // Select the newly created node
    setSelectedNodeId(newNode.id);
    onNodeSelect?.(newNode);
  };

  // Function to find a node by ID in the SVG structure
  const findNodeById = (node: SvgNode, id: string): SvgNode | null => {
    if (node.id === id) return node;
    for (const child of node.children) {
      const found = findNodeById(child, id);
      if (found) return found;
    }
    return null;
  };

  // Function to extract vertices from path data
  const extractVerticesFromPath = (pathData: string) => {
    const vertices: Array<{x: number, y: number, command: string}> = [];
    if (!pathData) return vertices;
    
    const commands = pathData.match(/[MmLlHhVvCcSsQqTtAaZz][^MmLlHhVvCcSsQqTtAaZz]*/g) || [];
    
    commands.forEach(command => {
      const cmd = command[0];
      const coords = command.slice(1).trim().split(/[\s,]+/).map(Number).filter(n => !isNaN(n));
      
      if (['M', 'm', 'L', 'l'].includes(cmd) && coords.length >= 2) {
        for (let i = 0; i < coords.length; i += 2) {
          vertices.push({
            x: coords[i],
            y: coords[i + 1],
            command: cmd
          });
        }
      }
    });
    
    return vertices;
  };

  const handleNodeClick = (event: React.MouseEvent, node: SvgNode) => {
    event.stopPropagation();
    if (currentTool === 'select') {
      setSelectedNodeId(node.id);
      onNodeSelect?.(node);
    }
  };

  const updateNode = (nodeId: string, updates: Partial<SvgNode>) => {
    const updateNodeRecursive = (node: SvgNode): SvgNode => {
      if (node.id === nodeId) {
        return { ...node, ...updates };
      }
      return {
        ...node,
        children: node.children.map(updateNodeRecursive)
      };
    };

    setSvgStructure(prev => updateNodeRecursive(prev));
    onNodeUpdate?.(nodeId, updates);
  };

  const renderSvgNode = (node: SvgNode): React.ReactElement => {
    const isSelected = selectedNodeId === node.id;
    
    // Separate key from other props and fix class -> className
    const { key, class: className, ...attributesWithoutKey } = node.attributes;
    
    // Preserve original styles and only overlay selection outline
    const svgProps = {
      onClick: (e: React.MouseEvent) => handleNodeClick(e, node),
      style: { cursor: currentTool === 'select' ? 'pointer' : 'crosshair' },
      className,
      ...attributesWithoutKey,
      // Only add selection stroke if selected, don't override original stroke
      ...(isSelected && {
        strokeDasharray: '4,2',
        // If there's no original stroke, add a selection stroke
        stroke: node.attributes.stroke || getSvgColor('error.main'),
        strokeWidth: (parseInt(node.attributes.strokeWidth) || 1) + 1
      })
    };

    switch (node.type) {
      case 'circle':
        return <circle key={node.id} {...svgProps} />;
      case 'rect':
        return <rect key={node.id} {...svgProps} />;
      case 'path':
        return <path key={node.id} {...svgProps} />;
      case 'line':
        return <line key={node.id} {...svgProps} />;
      case 'polygon':
        return <polygon key={node.id} {...svgProps} />;
      case 'ellipse':
        return <ellipse key={node.id} {...svgProps} />;
      case 'text':
        return <text key={node.id} {...svgProps}>{node.content}</text>;
      case 'g':
        return (
          <g key={node.id} {...svgProps}>
            {node.children.map(renderSvgNode)}
          </g>
        );
      default:
        return <g key={node.id} />;
    }
  };

  const tools = [
    { id: 'pan', label: 'Pan & Zoom', icon: '✋' },
    { id: 'select', label: 'Select', icon: '↖' },
    { id: 'circle', label: 'Circle', icon: '○' },
    { id: 'rect', label: 'Rectangle', icon: '□' },
    { id: 'path', label: 'Path', icon: '∿' },
    { id: 'text', label: 'Text', icon: 'T' }
  ];

  return (
    <div ref={containerRef} style={materialStyles.container}>
      {/* Toolbar - unified height with left panel */}
      <div style={{
        ...materialStyles.toolbar,
        height: `${toolbarHeight || 56}px`,
        backgroundColor: '#ffffff',
        borderBottom: '1px solid #e5e7eb',
        borderRadius: 0
      }}>
        <div style={{ display: 'flex', gap: getSpacing('xs'), alignItems: 'center' }}>
          {tools.map((tool) => (
            <button
              key={tool.id}
              style={{
                ...materialStyles.toolButton(currentTool === tool.id),
                minWidth: '40px',
                height: '40px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}
              onClick={() => setCurrentTool(tool.id as any)}
              title={tool.label}
            >
              <span style={{ fontSize: '18px' }}>{tool.icon}</span>
            </button>
          ))}
          
          {/* Zoom Controls */}
          <div style={{ height: '24px', width: '1px', background: getColor('outline.variant'), margin: `0 ${getSpacing('xs')}` }} />
          
          {/* Interactive Zoom Percentage */}
          <div 
            style={{ 
              position: 'relative',
              display: 'flex',
              alignItems: 'center'
            }}
            onMouseEnter={() => setShowZoomSlider(true)}
            onMouseLeave={() => setShowZoomSlider(false)}
          >
            <span style={{ 
              ...getTypography('body', 'small'), 
              color: getColor('surface.onVariant'),
              minWidth: '50px',
              textAlign: 'center',
              cursor: 'pointer',
              padding: `${getSpacing('xs')} ${getSpacing('sm')}`,
              borderRadius: getBorderRadius('sm'),
              background: showZoomSlider ? getColor('surface.variant') : 'transparent',
              transition: `background-color ${DesignTokens.animation.duration.fast} ${DesignTokens.animation.easing.standard}`
            }}>
              {Math.round(zoom * 100)}%
            </span>
            
            {/* Zoom Slider - appears on hover */}
            {showZoomSlider && (
              <div style={{
                position: 'absolute',
                top: '100%',
                left: '50%',
                transform: 'translateX(-50%)',
                background: getColor('surface.main'),
                border: `1px solid ${getColor('outline.variant')}`,
                borderRadius: getBorderRadius('md'),
                padding: getSpacing('sm'),
                zIndex: 10,
                ...getElevation('level3'),
                marginTop: getSpacing('xs'),
                minWidth: '120px'
              }}>
                <input
                  type="range"
                  min="10"
                  max="1000"
                  value={zoom * 100}
                  onChange={(e) => setZoom(parseFloat(e.target.value) / 100)}
                  style={{
                    width: '100%',
                    height: '4px',
                    borderRadius: '2px',
                    background: getColor('outline.variant'),
                    outline: 'none',
                    cursor: 'pointer'
                  }}
                />
                <div style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  marginTop: getSpacing('xs'),
                  ...getTypography('body', 'small'),
                  color: getColor('surface.onSurface'),
                  fontSize: '10px'
                }}>
                  <span>10%</span>
                  <span>1000%</span>
                </div>
              </div>
            )}
          </div>
          
          <button
            style={{
              ...materialStyles.toolButton(false),
              minWidth: '32px',
              height: '32px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}
            onClick={handleZoomExtents}
            title="Zoom Extents"
          >
            <Maximize2 size={16} />
          </button>
        </div>
      </div>

      {/* SVG Canvas */}
      <div className="svg-editor" style={{ padding: getSpacing('md'), height: `${height}px`, overflow: 'hidden' }}>
        <svg
          ref={svgRef}
          style={{ 
            ...materialStyles.svgCanvas,
            cursor: currentTool === 'pan' ? (isDrawing ? 'grabbing' : 'grab') : 
                   currentTool === 'select' ? 'default' : 'crosshair'
          }}
          viewBox={`0 0 ${width} ${height}`}
          onMouseDown={handleMouseDown}
          onMouseMove={handleMouseMove}
          onMouseUp={handleMouseUp}
          onClick={(e) => {
            if (currentTool === 'select' && e.target === e.currentTarget) {
              setSelectedNodeId(null);
              onNodeSelect?.(null);
            }
          }}
        >
          {/* Grid background */}
          <defs>
            <pattern
              id="grid"
              width="20"
              height="20"
              patternUnits="userSpaceOnUse"
            >
              <path
                d="M 20 0 L 0 0 0 20"
                fill="none"
                stroke={getSvgColor('outline.variant')}
                strokeWidth="0.5"
                opacity="0.3"
              />
            </pattern>
          </defs>
          <rect width="100%" height="100%" fill="url(#grid)" />
          
          {/* Zoom and Pan Container */}
          <g transform={`translate(${panX}, ${panY}) scale(${zoom})`}>
            {/* Render all SVG nodes */}
            {svgStructure.children.map(renderSvgNode)}
            
            {/* Render vertex editing controls when element is selected */}
            {showVertexHandles && selectedElementId && (() => {
              const selectedNode = findNodeById(svgStructure, selectedElementId);
              if (selectedNode) {
                // Show vertex handles for different element types
                if (selectedNode.type === 'rect') {
                  const x = parseFloat(selectedNode.attributes.x || '0');
                  const y = parseFloat(selectedNode.attributes.y || '0');
                  const w = parseFloat(selectedNode.attributes.width || '100');
                  const h = parseFloat(selectedNode.attributes.height || '100');
                  
                  return [
                    // Corner handles
                    <circle key="vertex-tl" cx={x} cy={y} r="4" fill="#ef4444" stroke="#dc2626" strokeWidth="2" style={{ cursor: 'nw-resize' }} className="vertex-handle" />,
                    <circle key="vertex-tr" cx={x + w} cy={y} r="4" fill="#ef4444" stroke="#dc2626" strokeWidth="2" style={{ cursor: 'ne-resize' }} className="vertex-handle" />,
                    <circle key="vertex-bl" cx={x} cy={y + h} r="4" fill="#ef4444" stroke="#dc2626" strokeWidth="2" style={{ cursor: 'sw-resize' }} className="vertex-handle" />,
                    <circle key="vertex-br" cx={x + w} cy={y + h} r="4" fill="#ef4444" stroke="#dc2626" strokeWidth="2" style={{ cursor: 'se-resize' }} className="vertex-handle" />
                  ];
                } else if (selectedNode.type === 'circle') {
                  const cx = parseFloat(selectedNode.attributes.cx || '50');
                  const cy = parseFloat(selectedNode.attributes.cy || '50');
                  const r = parseFloat(selectedNode.attributes.r || '25');
                  
                  return [
                    // Radius handles
                    <circle key="vertex-r" cx={cx + r} cy={cy} r="4" fill="#ef4444" stroke="#dc2626" strokeWidth="2" style={{ cursor: 'e-resize' }} className="vertex-handle" />,
                    <circle key="vertex-l" cx={cx - r} cy={cy} r="4" fill="#ef4444" stroke="#dc2626" strokeWidth="2" style={{ cursor: 'w-resize' }} className="vertex-handle" />,
                    <circle key="vertex-t" cx={cx} cy={cy - r} r="4" fill="#ef4444" stroke="#dc2626" strokeWidth="2" style={{ cursor: 'n-resize' }} className="vertex-handle" />,
                    <circle key="vertex-b" cx={cx} cy={cy + r} r="4" fill="#ef4444" stroke="#dc2626" strokeWidth="2" style={{ cursor: 's-resize' }} className="vertex-handle" />
                  ];
                } else if (selectedNode.type === 'path' && selectedNode.attributes.d) {
                  const vertices = extractVerticesFromPath(selectedNode.attributes.d);
                  return vertices.map((vertex, index) => (
                    <circle
                      key={`vertex-${index}`}
                      cx={vertex.x}
                      cy={vertex.y}
                      r="4"
                      fill="#ef4444"
                      stroke="#dc2626"
                      strokeWidth="2"
                      style={{ cursor: 'move' }}
                      className="vertex-handle"
                    />
                  ));
                }
              }
              return null;
            })()}
          </g>
          
          {/* Drawing preview */}
          {isDrawing && dragStart && (
            <circle
              cx={dragStart.x}
              cy={dragStart.y}
              r="5"
              fill={getSvgColor('primary.main')}
              opacity="0.5"
            />
          )}
        </svg>
      </div>
    </div>
  );
}