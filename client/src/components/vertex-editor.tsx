import { useState, useEffect, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Trash2, Plus, Move } from "lucide-react";

interface Vertex {
  x: number;
  y: number;
  type: 'M' | 'L' | 'C' | 'Q' | 'S' | 'T' | 'A' | 'Z';
  controlPoints?: { x: number; y: number }[];
  index: number;
}

interface VertexEditorProps {
  pathData: string;
  onPathChange: (pathData: string) => void;
  selectedElementId: string | null;
}

export default function VertexEditor({ pathData, onPathChange, selectedElementId }: VertexEditorProps) {
  const [vertices, setVertices] = useState<Vertex[]>([]);
  const [selectedVertex, setSelectedVertex] = useState<number | null>(null);

  // Parse path data into vertices when pathData changes
  useEffect(() => {
    if (!pathData) {
      setVertices([]);
      return;
    }
    
    const parsedVertices = parsePathData(pathData);
    setVertices(parsedVertices);
  }, [pathData]);

  // Convert vertices back to path data when they change
  useEffect(() => {
    if (vertices.length === 0) return;
    
    const newPathData = verticesToPathData(vertices);
    if (newPathData !== pathData) {
      onPathChange(newPathData);
    }
  }, [vertices]);

  const updateVertex = (index: number, updates: Partial<Vertex>) => {
    setVertices(prev => prev.map((v, i) => 
      i === index ? { ...v, ...updates } : v
    ));
  };

  const addVertex = (afterIndex: number) => {
    const newVertex: Vertex = {
      x: 50,
      y: 50,
      type: 'L',
      index: afterIndex + 1
    };
    
    setVertices(prev => {
      const newVertices = [...prev];
      newVertices.splice(afterIndex + 1, 0, newVertex);
      return newVertices.map((v, i) => ({ ...v, index: i }));
    });
  };

  const removeVertex = (index: number) => {
    if (vertices.length <= 1) return; // Keep at least one vertex
    
    setVertices(prev => 
      prev.filter((_, i) => i !== index)
         .map((v, i) => ({ ...v, index: i }))
    );
    
    if (selectedVertex === index) {
      setSelectedVertex(null);
    }
  };

  if (!selectedElementId || !pathData) {
    return (
      <Card className="h-full">
        <CardHeader>
          <CardTitle className="text-sm">Editor de Vértices</CardTitle>
        </CardHeader>
        <CardContent className="text-sm text-muted-foreground">
          Selecciona un elemento <code>path</code> para editar sus vértices
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="h-full">
      <CardHeader>
        <CardTitle className="text-sm flex items-center justify-between">
          Editor de Vértices
          <Button
            size="sm"
            variant="outline"
            onClick={() => addVertex(vertices.length - 1)}
            className="h-7"
          >
            <Plus className="w-3 h-3 mr-1" />
            Agregar
          </Button>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        <div className="max-h-96 overflow-y-auto space-y-2">
          {vertices.map((vertex, index) => (
            <div
              key={index}
              className={`p-3 border rounded-lg ${
                selectedVertex === index ? 'border-blue-500 bg-blue-50' : 'border-gray-200'
              }`}
              onClick={() => setSelectedVertex(index)}
            >
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center space-x-2">
                  <Move className="w-3 h-3 text-gray-400" />
                  <span className="text-xs font-medium">Vértice {index + 1}</span>
                  <Select
                    value={vertex.type}
                    onValueChange={(value: any) => updateVertex(index, { type: value })}
                  >
                    <SelectTrigger className="h-6 w-16 text-xs">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="M">M</SelectItem>
                      <SelectItem value="L">L</SelectItem>
                      <SelectItem value="C">C</SelectItem>
                      <SelectItem value="Q">Q</SelectItem>
                      <SelectItem value="S">S</SelectItem>
                      <SelectItem value="T">T</SelectItem>
                      <SelectItem value="A">A</SelectItem>
                      <SelectItem value="Z">Z</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={(e) => {
                    e.stopPropagation();
                    removeVertex(index);
                  }}
                  className="h-6 w-6 p-0 text-red-500 hover:text-red-700"
                  disabled={vertices.length <= 1}
                >
                  <Trash2 className="w-3 h-3" />
                </Button>
              </div>
              
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="text-xs text-gray-500">X</label>
                  <Input
                    type="number"
                    value={vertex.x}
                    onChange={(e) => updateVertex(index, { x: parseFloat(e.target.value) || 0 })}
                    className="h-7 text-xs"
                  />
                </div>
                <div>
                  <label className="text-xs text-gray-500">Y</label>
                  <Input
                    type="number"
                    value={vertex.y}
                    onChange={(e) => updateVertex(index, { y: parseFloat(e.target.value) || 0 })}
                    className="h-7 text-xs"
                  />
                </div>
              </div>

              {vertex.controlPoints && vertex.controlPoints.length > 0 && (
                <div className="mt-2 space-y-2">
                  <div className="text-xs text-gray-500">Puntos de Control</div>
                  {vertex.controlPoints.map((cp, cpIndex) => (
                    <div key={cpIndex} className="grid grid-cols-2 gap-2">
                      <Input
                        type="number"
                        value={cp.x}
                        onChange={(e) => {
                          const newControlPoints = [...(vertex.controlPoints || [])];
                          newControlPoints[cpIndex] = { ...cp, x: parseFloat(e.target.value) || 0 };
                          updateVertex(index, { controlPoints: newControlPoints });
                        }}
                        className="h-6 text-xs"
                        placeholder="CX"
                      />
                      <Input
                        type="number"
                        value={cp.y}
                        onChange={(e) => {
                          const newControlPoints = [...(vertex.controlPoints || [])];
                          newControlPoints[cpIndex] = { ...cp, y: parseFloat(e.target.value) || 0 };
                          updateVertex(index, { controlPoints: newControlPoints });
                        }}
                        className="h-6 text-xs"
                        placeholder="CY"
                      />
                    </div>
                  ))}
                </div>
              )}
            </div>
          ))}
        </div>
        
        <div className="text-xs text-gray-500 bg-gray-50 p-2 rounded">
          <strong>Path Data:</strong> {pathData}
        </div>
      </CardContent>
    </Card>
  );
}

// Parse SVG path data into vertices
function parsePathData(pathData: string): Vertex[] {
  const vertices: Vertex[] = [];
  const commands = pathData.match(/[MLHVCSQTAZ][^MLHVCSQTAZ]*/gi) || [];
  
  commands.forEach((command, index) => {
    const type = command[0].toUpperCase() as Vertex['type'];
    const params = command.slice(1).trim().split(/[\s,]+/).filter(p => p).map(Number);
    
    switch (type) {
      case 'M':
      case 'L':
        if (params.length >= 2) {
          vertices.push({
            x: params[0],
            y: params[1],
            type,
            index
          });
        }
        break;
      case 'C':
        if (params.length >= 6) {
          vertices.push({
            x: params[4],
            y: params[5],
            type,
            controlPoints: [
              { x: params[0], y: params[1] },
              { x: params[2], y: params[3] }
            ],
            index
          });
        }
        break;
      case 'Q':
        if (params.length >= 4) {
          vertices.push({
            x: params[2],
            y: params[3],
            type,
            controlPoints: [
              { x: params[0], y: params[1] }
            ],
            index
          });
        }
        break;
      case 'Z':
        vertices.push({
          x: 0,
          y: 0,
          type,
          index
        });
        break;
      default:
        if (params.length >= 2) {
          vertices.push({
            x: params[0],
            y: params[1],
            type,
            index
          });
        }
    }
  });
  
  return vertices;
}

// Convert vertices back to SVG path data
function verticesToPathData(vertices: Vertex[]): string {
  if (vertices.length === 0) return '';
  
  return vertices.map(vertex => {
    switch (vertex.type) {
      case 'M':
      case 'L':
        return `${vertex.type}${vertex.x},${vertex.y}`;
      case 'C':
        if (vertex.controlPoints && vertex.controlPoints.length >= 2) {
          return `${vertex.type}${vertex.controlPoints[0].x},${vertex.controlPoints[0].y} ${vertex.controlPoints[1].x},${vertex.controlPoints[1].y} ${vertex.x},${vertex.y}`;
        }
        return `${vertex.type}${vertex.x},${vertex.y}`;
      case 'Q':
        if (vertex.controlPoints && vertex.controlPoints.length >= 1) {
          return `${vertex.type}${vertex.controlPoints[0].x},${vertex.controlPoints[0].y} ${vertex.x},${vertex.y}`;
        }
        return `${vertex.type}${vertex.x},${vertex.y}`;
      case 'Z':
        return 'Z';
      default:
        return `${vertex.type}${vertex.x},${vertex.y}`;
    }
  }).join(' ');
}