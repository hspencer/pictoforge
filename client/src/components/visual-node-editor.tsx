import { useState, useEffect, useRef, useCallback } from 'react';
import { SvgElement } from '@shared/schema';

interface NodeData {
  id: string;
  x: number;
  y: number;
  type: 'vertex' | 'control';
  pathIndex: number;
  commandIndex: number;
  controlIndex?: number;
}

interface VisualNodeEditorProps {
  svgCode: string;
  selectedElementId: string | null;
  onUpdateElement: (elementId: string, updates: Partial<SvgElement>) => void;
  scale: number;
}

export default function VisualNodeEditor({ 
  svgCode, 
  selectedElementId, 
  onUpdateElement,
  scale = 100 
}: VisualNodeEditorProps) {
  const svgRef = useRef<SVGSVGElement>(null);
  const [nodes, setNodes] = useState<NodeData[]>([]);
  const [dragging, setDragging] = useState<{ nodeId: string; startX: number; startY: number } | null>(null);
  const [svgBounds, setSvgBounds] = useState<DOMRect | null>(null);

  // Extract nodes from selected path element
  useEffect(() => {
    if (!selectedElementId || !svgCode) {
      setNodes([]);
      return;
    }

    const parser = new DOMParser();
    const doc = parser.parseFromString(svgCode, 'image/svg+xml');
    const selectedElement = doc.getElementById(selectedElementId);

    if (!selectedElement || selectedElement.tagName.toLowerCase() !== 'path') {
      setNodes([]);
      return;
    }

    const pathData = selectedElement.getAttribute('d');
    if (!pathData) {
      setNodes([]);
      return;
    }

    const extractedNodes = extractNodesFromPath(pathData);
    setNodes(extractedNodes);
  }, [selectedElementId, svgCode]);

  // Update SVG bounds when scale changes
  useEffect(() => {
    if (svgRef.current) {
      const bounds = svgRef.current.getBoundingClientRect();
      setSvgBounds(bounds);
    }
  }, [scale]);

  const extractNodesFromPath = (pathData: string): NodeData[] => {
    const nodes: NodeData[] = [];
    const commands = pathData.match(/[MLHVCSQTAZ][^MLHVCSQTAZ]*/gi) || [];
    
    commands.forEach((command, commandIndex) => {
      const type = command[0].toUpperCase();
      const params = command.slice(1).trim().split(/[\s,]+/).filter(p => p).map(Number);
      
      switch (type) {
        case 'M':
        case 'L':
          if (params.length >= 2) {
            nodes.push({
              id: `node-${commandIndex}-end`,
              x: params[0],
              y: params[1],
              type: 'vertex',
              pathIndex: 0,
              commandIndex
            });
          }
          break;
        case 'C':
          if (params.length >= 6) {
            // Control points
            nodes.push({
              id: `node-${commandIndex}-ctrl1`,
              x: params[0],
              y: params[1],
              type: 'control',
              pathIndex: 0,
              commandIndex,
              controlIndex: 0
            });
            nodes.push({
              id: `node-${commandIndex}-ctrl2`,
              x: params[2],
              y: params[3],
              type: 'control',
              pathIndex: 0,
              commandIndex,
              controlIndex: 1
            });
            // End point
            nodes.push({
              id: `node-${commandIndex}-end`,
              x: params[4],
              y: params[5],
              type: 'vertex',
              pathIndex: 0,
              commandIndex
            });
          }
          break;
        case 'Q':
          if (params.length >= 4) {
            // Control point
            nodes.push({
              id: `node-${commandIndex}-ctrl1`,
              x: params[0],
              y: params[1],
              type: 'control',
              pathIndex: 0,
              commandIndex,
              controlIndex: 0
            });
            // End point
            nodes.push({
              id: `node-${commandIndex}-end`,
              x: params[2],
              y: params[3],
              type: 'vertex',
              pathIndex: 0,
              commandIndex
            });
          }
          break;
      }
    });
    
    return nodes;
  };

  const getScreenPosition = useCallback((svgX: number, svgY: number) => {
    if (!svgBounds) return { x: svgX, y: svgY };
    
    const scaleRatio = scale / 100;
    return {
      x: svgX * scaleRatio,
      y: svgY * scaleRatio
    };
  }, [svgBounds, scale]);

  const getSvgPosition = useCallback((screenX: number, screenY: number) => {
    if (!svgBounds) return { x: screenX, y: screenY };
    
    const scaleRatio = scale / 100;
    const rect = svgRef.current?.getBoundingClientRect();
    if (!rect) return { x: screenX, y: screenY };

    // Calculate relative position within the SVG container
    const relativeX = screenX - rect.left;
    const relativeY = screenY - rect.top;
    
    // Convert back to SVG coordinates accounting for centering and scale
    const centerOffsetX = (rect.width - (100 * scaleRatio)) / 2;
    const centerOffsetY = (rect.height - (100 * scaleRatio)) / 2;
    
    return {
      x: (relativeX - centerOffsetX) / scaleRatio,
      y: (relativeY - centerOffsetY) / scaleRatio
    };
  }, [svgBounds, scale]);

  const handleMouseDown = (e: React.MouseEvent, nodeId: string) => {
    e.preventDefault();
    e.stopPropagation();
    
    setDragging({
      nodeId,
      startX: e.clientX,
      startY: e.clientY
    });
    
    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);
  };

  const handleMouseMove = useCallback((e: MouseEvent) => {
    if (!dragging) return;

    const svgPos = getSvgPosition(e.clientX, e.clientY);
    
    setNodes(prev => prev.map(node => 
      node.id === dragging.nodeId 
        ? { ...node, x: svgPos.x, y: svgPos.y }
        : node
    ));
  }, [dragging, getSvgPosition]);

  const handleMouseUp = useCallback(() => {
    if (dragging && selectedElementId) {
      // Update the path data
      updatePathData();
    }
    
    setDragging(null);
    document.removeEventListener('mousemove', handleMouseMove);
    document.removeEventListener('mouseup', handleMouseUp);
  }, [dragging, selectedElementId]);

  const updatePathData = () => {
    if (!selectedElementId) return;

    const parser = new DOMParser();
    const doc = parser.parseFromString(svgCode, 'image/svg+xml');
    const selectedElement = doc.getElementById(selectedElementId);
    
    if (!selectedElement || selectedElement.tagName.toLowerCase() !== 'path') return;

    const currentPathData = selectedElement.getAttribute('d');
    if (!currentPathData) return;

    const commands = currentPathData.match(/[MLHVCSQTAZ][^MLHVCSQTAZ]*/gi) || [];
    const updatedCommands = commands.map((command, commandIndex) => {
      const type = command[0].toUpperCase();
      const params = command.slice(1).trim().split(/[\s,]+/).filter(p => p).map(Number);
      
      switch (type) {
        case 'M':
        case 'L': {
          const endNode = nodes.find(n => n.commandIndex === commandIndex && n.type === 'vertex');
          if (endNode) {
            return `${type}${endNode.x},${endNode.y}`;
          }
          break;
        }
        case 'C': {
          const ctrl1 = nodes.find(n => n.commandIndex === commandIndex && n.controlIndex === 0);
          const ctrl2 = nodes.find(n => n.commandIndex === commandIndex && n.controlIndex === 1);
          const end = nodes.find(n => n.commandIndex === commandIndex && n.type === 'vertex');
          
          if (ctrl1 && ctrl2 && end) {
            return `${type}${ctrl1.x},${ctrl1.y} ${ctrl2.x},${ctrl2.y} ${end.x},${end.y}`;
          }
          break;
        }
        case 'Q': {
          const ctrl = nodes.find(n => n.commandIndex === commandIndex && n.controlIndex === 0);
          const end = nodes.find(n => n.commandIndex === commandIndex && n.type === 'vertex');
          
          if (ctrl && end) {
            return `${type}${ctrl.x},${ctrl.y} ${end.x},${end.y}`;
          }
          break;
        }
      }
      
      return command;
    });

    const newPathData = updatedCommands.join(' ');
    
    onUpdateElement(selectedElementId, {
      attributes: { d: newPathData }
    });
  };

  // Clean up event listeners
  useEffect(() => {
    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };
  }, [handleMouseMove, handleMouseUp]);

  if (!selectedElementId || nodes.length === 0) {
    return null;
  }

  return (
    <svg
      ref={svgRef}
      className="absolute inset-0 pointer-events-none"
      style={{ 
        width: '100%', 
        height: '100%',
        zIndex: 10
      }}
    >
      {nodes.map(node => {
        const screenPos = getScreenPosition(node.x, node.y);
        const isControl = node.type === 'control';
        
        return (
          <circle
            key={node.id}
            cx={screenPos.x}
            cy={screenPos.y}
            r={isControl ? 2 : 3}
            className={isControl ? 'svg-control-point' : 'svg-node'}
            style={{ 
              pointerEvents: 'all',
              cursor: dragging?.nodeId === node.id ? 'grabbing' : 'grab'
            }}
            onMouseDown={(e) => handleMouseDown(e, node.id)}
          />
        );
      })}
      
      {/* Draw control lines for bezier curves */}
      {nodes.filter(n => n.type === 'control').map(controlNode => {
        const endNode = nodes.find(n => 
          n.commandIndex === controlNode.commandIndex && 
          n.type === 'vertex'
        );
        
        if (!endNode) return null;
        
        const controlPos = getScreenPosition(controlNode.x, controlNode.y);
        const endPos = getScreenPosition(endNode.x, endNode.y);
        
        return (
          <line
            key={`line-${controlNode.id}`}
            x1={controlPos.x}
            y1={controlPos.y}
            x2={endPos.x}
            y2={endPos.y}
            stroke="#3b82f6"
            strokeWidth="1"
            strokeDasharray="2,2"
            opacity="0.5"
            style={{ pointerEvents: 'none' }}
          />
        );
      })}
    </svg>
  );
}