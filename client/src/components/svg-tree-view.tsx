import { useState } from "react";
import { Button } from "@/components/ui/button";
import { ChevronDown, ChevronRight, Code, Circle, Square, Layers, Edit, Trash2, Settings, Palette, Type, Plus } from "lucide-react";
import { SvgElement, SvgStructure } from "@shared/schema";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

interface SvgTreeViewProps {
  structure: SvgStructure;
  selectedElementId: string | null;
  onSelectElement: (element: SvgElement) => void;
  onRemoveElement: (elementId: string) => void;
  onUpdateElement: (elementId: string, updates: Partial<SvgElement>) => void;
  editMode: boolean;
  onToggleEditMode: () => void;
}

interface TreeNodeProps {
  element: SvgElement;
  level: number;
  isSelected: boolean;
  onSelect: (element: SvgElement) => void;
  onRemove: (elementId: string) => void;
  onUpdateElement: (elementId: string, updates: Partial<SvgElement>) => void;
  expandedNodes: Set<string>;
  onToggleExpanded: (elementId: string) => void;
  editMode: boolean;
  onToggleEditMode: () => void;
}

interface StylePreset {
  id: string;
  name: string;
  fill: string;
  stroke: string;
  strokeWidth: string;
}

// Función para extraer estilos CSS del elemento <defs>
function extractStylesFromDefs(structure: SvgStructure): StylePreset[] {
  const styles: StylePreset[] = [];
  
  const findDefsElement = (element: SvgElement): SvgElement | null => {
    if (element.type === 'defs') return element;
    for (const child of element.children || []) {
      const found = findDefsElement(child);
      if (found) return found;
    }
    return null;
  };

  const defs = findDefsElement(structure.root);
  if (!defs) return styles;

  // Buscar elementos <style> dentro de <defs>
  const findStyleElements = (element: SvgElement): SvgElement[] => {
    const styleElements: SvgElement[] = [];
    if (element.type === 'style') styleElements.push(element);
    for (const child of element.children || []) {
      styleElements.push(...findStyleElements(child));
    }
    return styleElements;
  };

  const styleElements = findStyleElements(defs);
  
  for (const styleElement of styleElements) {
    const cssContent = styleElement.content || '';
    
    // Parsear CSS básico para extraer clases
    const classMatches = cssContent.match(/\.([a-zA-Z-]+)\s*\{([^}]+)\}/g);
    
    if (classMatches) {
      classMatches.forEach((match, index) => {
        const [, className] = match.match(/\.([a-zA-Z-]+)/) || [];
        const [, properties] = match.match(/\{([^}]+)\}/) || [];
        
        if (className && properties) {
          const fillMatch = properties.match(/fill:\s*([^;]+)/);
          const strokeMatch = properties.match(/stroke:\s*([^;]+)/);
          const strokeWidthMatch = properties.match(/stroke-width:\s*([^;]+)/);
          
          styles.push({
            id: className,
            name: className.replace('-', ' ').replace(/\b\w/g, l => l.toUpperCase()),
            fill: fillMatch ? fillMatch[1].trim() : '#000000',
            stroke: strokeMatch ? strokeMatch[1].trim() : '#000000',
            strokeWidth: strokeWidthMatch ? strokeWidthMatch[1].trim() : '1'
          });
        }
      });
    }
  }
  
  // Si no hay estilos en defs, proporcionar algunos por defecto
  if (styles.length === 0) {
    styles.push(
      { id: 'black-style', name: 'Black Style', fill: '#000000', stroke: '#FFFFFF', strokeWidth: '4' },
      { id: 'white-style', name: 'White Style', fill: '#FFFFFF', stroke: '#000000', strokeWidth: '4' }
    );
  }
  
  return styles;
}

const getElementIcon = (type: string) => {
  switch (type) {
    case 'svg':
      return <Code className="w-4 h-4 text-blue-500" />;
    case 'g':
      return <Layers className="w-4 h-4 text-orange-500" />;
    case 'circle':
      return <Circle className="w-4 h-4 text-red-500" />;
    case 'rect':
      return <Square className="w-4 h-4 text-blue-500" />;
    case 'path':
      return <Edit className="w-4 h-4 text-indigo-500" />;
    case 'defs':
      return <Settings className="w-4 h-4 text-purple-500" />;
    case 'style':
      return <Palette className="w-4 h-4 text-green-500" />;
    case 'text':
      return <Type className="w-4 h-4 text-gray-500" />;
    default:
      return <Code className="w-4 h-4 text-cream-600" />;
  }
};

// Componente para previsualizar estilos como círculos
function StylePreviewCircle({ fill, stroke, strokeWidth, size = 16, onClick }: { 
  fill: string; 
  stroke: string; 
  strokeWidth: string; 
  size?: number;
  onClick?: () => void;
}) {
  return (
    <svg 
      width={size} 
      height={size} 
      viewBox={`0 0 ${size} ${size}`}
      className="cursor-pointer hover:scale-110 transition-transform"
      onClick={onClick}
    >
      <circle
        cx={size/2}
        cy={size/2}
        r={(size-2)/2}
        fill={fill}
        stroke={stroke}
        strokeWidth={strokeWidth}
      />
    </svg>
  );
}

// Función para extraer estilos de un elemento SVG
function getElementStyles(element: SvgElement) {
  return {
    fill: element.attributes.fill || '#000000',
    stroke: element.attributes.stroke || '#000000',
    strokeWidth: element.attributes.strokeWidth || element.attributes['stroke-width'] || '1'
  };
}

const getElementName = (element: SvgElement) => {
  // Prioritize id or class attributes for naming
  if (element.attributes.id) {
    return element.attributes.id;
  }
  
  if (element.attributes.class) {
    return element.attributes.class;
  }
  
  // Generate semantic names based on element type and properties
  const attrs = element.attributes;
  switch (element.type) {
    case 'svg':
      return 'Canvas Principal';
    case 'g':
      if (element.children.length > 0) {
        const childTypes = element.children.map(c => c.type);
        if (childTypes.every(t => t === 'path')) return 'Grupo de Trazos';
        if (childTypes.includes('circle') && childTypes.includes('rect')) return 'Forma Compuesta';
        return `Grupo (${element.children.length})`;
      }
      return 'Grupo Vacío';
    case 'circle':
      const radius = parseFloat(attrs.r || '0');
      if (radius > 50) return 'Círculo Grande';
      if (radius < 10) return 'Punto';
      return 'Círculo';
    case 'rect':
      const width = parseFloat(attrs.width || '0');
      const height = parseFloat(attrs.height || '0');
      if (Math.abs(width - height) < 5) return 'Cuadrado';
      if (width > height * 3) return 'Barra Horizontal';
      if (height > width * 3) return 'Barra Vertical';
      return 'Rectángulo';
    case 'path':
      const d = attrs.d || '';
      if (d.includes('C') || d.includes('Q')) return 'Trazo Curvo';
      if (d.includes('Z') || d.toLowerCase().includes('z')) return 'Forma Cerrada';
      return 'Trazo Libre';
    case 'line':
      return 'Línea Recta';
    case 'polygon':
      const pointCount = (attrs.points || '').split(' ').filter(p => p.trim()).length / 2;
      if (pointCount === 3) return 'Triángulo';
      if (pointCount === 4) return 'Cuadrilátero';
      return `Polígono (${pointCount})`;
    case 'ellipse':
      const rx = parseFloat(attrs.rx || '0');
      const ry = parseFloat(attrs.ry || '0');
      if (Math.abs(rx - ry) < 2) return 'Círculo';
      return rx > ry ? 'Óvalo Horizontal' : 'Óvalo Vertical';
    case 'text':
      const content = element.content || '';
      if (content.length > 15) return `"${content.substring(0, 15)}..."`;
      return content ? `"${content}"` : 'Texto Vacío';
    case 'defs':
      return 'Style Presets';
    case 'style':
      return 'Estilos CSS';
    default:
      return (element.type as string).toUpperCase();
  }
};

const getElementDescription = (element: SvgElement) => {
  const attrs = element.attributes;
  switch (element.type) {
    case 'circle':
      return `r=${attrs.r || '0'}`;
    case 'rect':
      return `${attrs.width || '0'}×${attrs.height || '0'}`;
    case 'path':
      const d = attrs.d || '';
      return d.length > 30 ? `${d.substring(0, 30)}...` : d;
    case 'text':
      return element.content || '';
    default:
      return '';
  }
};

function TreeNode({ element, level, isSelected, onSelect, onRemove, onUpdateElement, expandedNodes, onToggleExpanded, editMode, onToggleEditMode }: TreeNodeProps) {
  const hasChildren = element.children && element.children.length > 0;
  const isExpanded = expandedNodes.has(element.id);
  const paddingLeft = level * 24;

  return (
    <div className="mb-0.5">
      <div
        className={`flex items-center space-x-2 p-1.5 rounded cursor-pointer group tree-node ${
          isSelected ? 'bg-cream-300' : 'hover:bg-cream-300'
        }`}
        style={{ paddingLeft: `${paddingLeft + 8}px` }}
        onClick={() => onSelect(element)}
      >
        {hasChildren ? (
          <button
            onClick={(e) => {
              e.stopPropagation();
              onToggleExpanded(element.id);
            }}
            className="w-3 h-3 flex items-center justify-center"
          >
            {isExpanded ? (
              <ChevronDown className="w-3 h-3 text-cream-500" />
            ) : (
              <ChevronRight className="w-3 h-3 text-cream-500" />
            )}
          </button>
        ) : (
          <div className="w-3 h-3" />
        )}
        
        {getElementIcon(element.type)}
        
        <span className="font-medium text-cream-800">{getElementName(element)}</span>
        
        {/* Style preview for non-defs elements */}
        {element.type === 'style' && element.content ? (
          <div className="flex space-x-1 ml-2">
            {(() => {
              const cssContent = element.content;
              const classMatches = cssContent.match(/\.([a-zA-Z-]+)\s*\{([^}]+)\}/g) || [];
              
              return classMatches.slice(0, 3).map((match, index) => {
                const [, properties] = match.match(/\{([^}]+)\}/) || [];
                if (properties) {
                  const fillMatch = properties.match(/fill:\s*([^;]+)/);
                  const strokeMatch = properties.match(/stroke:\s*([^;]+)/);
                  const strokeWidthMatch = properties.match(/stroke-width:\s*([^;]+)/);
                  
                  return (
                    <StylePreviewCircle 
                      key={index}
                      fill={fillMatch ? fillMatch[1].trim() : '#000000'}
                      stroke={strokeMatch ? strokeMatch[1].trim() : '#000000'}
                      strokeWidth={strokeWidthMatch ? strokeWidthMatch[1].trim() : '1'}
                      size={12}
                    />
                  );
                }
                return null;
              }).filter(Boolean);
            })()}
            {(() => {
              const cssContent = element.content;
              const classMatches = cssContent.match(/\.([a-zA-Z-]+)\s*\{([^}]+)\}/g) || [];
              return classMatches.length > 3 && (
                <span className="text-xs text-cream-500">+{classMatches.length - 3}</span>
              );
            })()}
          </div>
        ) : (
          /* Style preview circle for visual elements */
          (element.attributes.fill || element.attributes.stroke) && (
            <StylePreviewCircle 
              {...getElementStyles(element)}
              size={14}
            />
          )
        )}
        
        {getElementDescription(element) && (
          <span className="text-xs text-cream-500 bg-cream-400 px-2 py-1 rounded">
            {getElementDescription(element)}
          </span>
        )}
        
        <div className="ml-auto opacity-0 group-hover:opacity-100 flex space-x-1">
          <Button
            size="sm"
            variant="ghost"
            className="h-6 w-6 p-0 text-cream-500 hover:text-cream-700"
            onClick={(e) => {
              e.stopPropagation();
              onSelect(element);
            }}
          >
            <Edit className="w-3 h-3" />
          </Button>
          {element.type !== 'svg' && (
            <Button
              size="sm"
              variant="ghost"
              className="h-6 w-6 p-0 text-cream-500 hover:text-red-600"
              onClick={(e) => {
                e.stopPropagation();
                onRemove(element.id);
              }}
            >
              <Trash2 className="w-3 h-3" />
            </Button>
          )}
        </div>
      </div>
      
      {/* Special expanded view for defs elements - show style presets */}
      {element.type === 'defs' && isExpanded && (
        <div className="ml-8 mt-2 mb-2 space-y-1">
          {(() => {
            const styles = extractStylesFromDefs({ root: element, selectedElementId: null });
            return styles.map((style, index) => (
              <div 
                key={style.id}
                className="flex items-center space-x-2 p-2 rounded hover:bg-cream-200 cursor-pointer group transition-colors"
                onClick={(e) => {
                  e.stopPropagation();
                  console.log('Edit style:', style.id);
                }}
              >
                <StylePreviewCircle 
                  fill={style.fill}
                  stroke={style.stroke}
                  strokeWidth={style.strokeWidth}
                  size={20}
                />
                <div className="flex flex-col">
                  <span className="text-sm font-medium text-cream-800">{style.name}</span>
                  <span className="text-xs text-cream-600">
                    Fill: {style.fill} • Stroke: {style.stroke}
                  </span>
                </div>
                <span className="text-xs text-cream-500 opacity-0 group-hover:opacity-100 ml-auto">
                  Click to edit
                </span>
              </div>
            ));
          })()}
        </div>
      )}

      {hasChildren && isExpanded && element.type !== 'defs' && (
        <div className="border-l-2 border-cream-300" style={{ marginLeft: `${paddingLeft + 16}px` }}>
          {element.children.map((child) => (
            <TreeNode
              key={child.id}
              element={child}
              level={level + 1}
              isSelected={child.id === (isSelected ? element.id : '')}
              onSelect={onSelect}
              onRemove={onRemove}
              onUpdateElement={onUpdateElement}
              expandedNodes={expandedNodes}
              onToggleExpanded={onToggleExpanded}
              editMode={editMode}
              onToggleEditMode={onToggleEditMode}
            />
          ))}
        </div>
      )}
    </div>
  );
}

export default function SvgTreeView({ structure, selectedElementId, onSelectElement, onRemoveElement, onUpdateElement, editMode, onToggleEditMode }: SvgTreeViewProps) {
  const [expandedNodes, setExpandedNodes] = useState<Set<string>>(new Set(['svg']));
  const [showStylePresets, setShowStylePresets] = useState(false);
  const [editingStyle, setEditingStyle] = useState<StylePreset | null>(null);
  
  // Extraer estilos dinámicamente del SVG
  const dynamicStyles = extractStylesFromDefs(structure);

  const handleToggleExpanded = (elementId: string) => {
    const newExpanded = new Set(expandedNodes);
    if (newExpanded.has(elementId)) {
      newExpanded.delete(elementId);
    } else {
      newExpanded.add(elementId);
    }
    setExpandedNodes(newExpanded);
  };

  const handleExpandAll = () => {
    const allIds = new Set<string>();
    const collectIds = (element: SvgElement) => {
      allIds.add(element.id);
      element.children?.forEach(collectIds);
    };
    // Start from root children instead of root itself
    structure.root.children?.forEach(collectIds);
    setExpandedNodes(allIds);
  };

  const handleCollapseAll = () => {
    setExpandedNodes(new Set(['svg']));
  };

  return (
    <div className="p-2">
      <div className="flex items-center justify-end mb-1">
        <div className="flex space-x-2">
          <Button
            size="sm"
            variant="ghost"
            onClick={handleCollapseAll}
            className="h-6 w-6 p-0 text-cream-600 hover:text-cream-800"
          >
            <ChevronRight className="w-4 h-4" />
          </Button>
          <Button
            size="sm"
            variant="ghost"
            onClick={handleExpandAll}
            className="h-6 w-6 p-0 text-cream-600 hover:text-cream-800"
          >
            <ChevronDown className="w-4 h-4" />
          </Button>
        </div>
      </div>
      
      {/* Render children of root directly, skipping the root "pictogram" node */}
      {structure.root.children?.map((child) => (
        <TreeNode
          key={child.id}
          element={child}
          level={0}
          isSelected={child.id === selectedElementId}
          onSelect={onSelectElement}
          onRemove={onRemoveElement}
          onUpdateElement={onUpdateElement}
          expandedNodes={expandedNodes}
          onToggleExpanded={handleToggleExpanded}
          editMode={editMode}
          onToggleEditMode={onToggleEditMode}
        />
      ))}
      
      {/* Style Presets Section */}
      <div className="mt-4 pt-3 border-t border-cream-300">
        <div className="flex items-center justify-between mb-2">
          <h4 className="font-medium text-cream-800 text-sm">Style Presets</h4>
          <Button
            size="sm"
            variant="ghost"
            onClick={() => setShowStylePresets(!showStylePresets)}
            className="h-6 w-6 p-0 text-cream-600 hover:text-cream-800"
          >
            {showStylePresets ? <ChevronDown className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
          </Button>
        </div>
        
        {showStylePresets && (
          <div className="grid grid-cols-2 gap-2">
            {dynamicStyles.map((preset) => (
              <div
                key={preset.id}
                className="flex flex-col items-center p-2 rounded hover:bg-cream-200 cursor-pointer"
                onClick={() => setEditingStyle(preset)}
              >
                <StylePreviewCircle 
                  fill={preset.fill}
                  stroke={preset.stroke}
                  strokeWidth={preset.strokeWidth}
                  size={20}
                />
                <span className="text-xs text-cream-600 mt-1 text-center">{preset.name}</span>
              </div>
            ))}
          </div>
        )}
      </div>
      
      {/* Style Editor Dialog */}
      <Dialog open={!!editingStyle} onOpenChange={() => setEditingStyle(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Style: {editingStyle?.name}</DialogTitle>
          </DialogHeader>
          {editingStyle && (
            <div className="space-y-4">
              <div className="flex items-center space-x-4">
                <StylePreviewCircle 
                  fill={editingStyle.fill}
                  stroke={editingStyle.stroke}
                  strokeWidth={editingStyle.strokeWidth}
                  size={40}
                />
                <div className="text-sm text-gray-600">
                  Preview of current style
                </div>
              </div>
              
              <div className="grid grid-cols-3 gap-4">
                <div>
                  <Label htmlFor="fill">Fill Color</Label>
                  <Input
                    id="fill"
                    type="color"
                    value={editingStyle.fill}
                    onChange={(e) => setEditingStyle({...editingStyle, fill: e.target.value})}
                  />
                </div>
                <div>
                  <Label htmlFor="stroke">Stroke Color</Label>
                  <Input
                    id="stroke"
                    type="color"
                    value={editingStyle.stroke}
                    onChange={(e) => setEditingStyle({...editingStyle, stroke: e.target.value})}
                  />
                </div>
                <div>
                  <Label htmlFor="strokeWidth">Stroke Width</Label>
                  <Input
                    id="strokeWidth"
                    type="number"
                    min="0"
                    max="10"
                    value={editingStyle.strokeWidth}
                    onChange={(e) => setEditingStyle({...editingStyle, strokeWidth: e.target.value})}
                  />
                </div>
              </div>
              
              <div className="flex justify-end space-x-2">
                <Button variant="outline" onClick={() => setEditingStyle(null)}>
                  Cancel
                </Button>
                <Button onClick={() => {
                  // Apply style logic would go here
                  setEditingStyle(null);
                }}>
                  Apply Style
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
