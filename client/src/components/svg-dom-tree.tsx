import { useState } from "react";
import { Button } from "@/components/ui/button";
import { ChevronDown, ChevronRight, Layers, Box, Circle, Edit, Square } from "lucide-react";
import { SvgElement, SvgStructure } from "@shared/schema";
import StyleClassEditor from "./style-class-editor";

interface SvgDomTreeProps {
  structure: SvgStructure;
  selectedElementId: string | null;
  onSelectElement: (element: SvgElement) => void;
}

// Style circle button component
function StyleCircle({ className, hasStyle, onStyleUpdate }: { 
  className: string; 
  hasStyle: boolean;
  onStyleUpdate?: (className: string, style: Record<string, string>) => void 
}) {
  const [isEditorOpen, setIsEditorOpen] = useState(false);
  
  const getCircleStyle = () => {
    if (!hasStyle) {
      return 'bg-transparent border-2 border-dashed border-gray-400';
    }
    if (className === 'white-outline-black') return 'bg-white border-2 border-black';
    if (className === 'black-outline-white') return 'bg-black border-2 border-white';
    if (className === 'selected') return 'bg-sky-200 border-2 border-blue-600';
    // For custom classes, show gradient
    return 'bg-gradient-to-br from-blue-400 to-purple-500 border-2 border-blue-600';
  };

  // Parse current style from class name
  const getCurrentStyle = (): Record<string, string> => {
    if (className === 'white-outline-black') {
      return {
        fill: '#ffffff',
        stroke: '#000000',
        'stroke-linejoin': 'square'
      };
    }
    if (className === 'black-outline-white') {
      return {
        fill: '#000000',
        stroke: '#ffffff',
        'stroke-linejoin': 'square'
      };
    }
    if (className === 'selected') {
      return {
        fill: '#87CEEB',
        stroke: '#4682B4',
        'stroke-width': '2'
      };
    }
    return {};
  };

  const handleStyleSave = (newClassName: string, newStyle: Record<string, string>) => {
    if (onStyleUpdate) {
      onStyleUpdate(newClassName, newStyle);
    }
    setIsEditorOpen(false);
  };

  const getTitle = () => {
    if (!hasStyle) return 'Add style';
    return `Edit style: .${className}`;
  };

  return (
    <>
      <button 
        onClick={() => setIsEditorOpen(true)}
        className={`w-3 h-3 rounded-full ${getCircleStyle()} hover:scale-125 transition-transform flex-shrink-0`}
        title={getTitle()}
      />
      
      <StyleClassEditor
        isOpen={isEditorOpen}
        onClose={() => setIsEditorOpen(false)}
        className={className}
        initialStyle={getCurrentStyle()}
        onSave={handleStyleSave}
        allowRemove={hasStyle}
        onRemove={() => {
          if (onStyleUpdate) {
            onStyleUpdate('', {});
          }
          setIsEditorOpen(false);
        }}
      />
    </>
  );
}

// Get style class from element
function getElementStyleClass(element: SvgElement): string | null {
  return element.attributes.class || null;
}

// Render individual element row
function ElementRow({ 
  element, 
  level, 
  isSelected, 
  onSelect,
  isExpanded,
  onToggle,
  hasChildren 
}: {
  element: SvgElement;
  level: number;
  isSelected: boolean;
  onSelect: (element: SvgElement) => void;
  isExpanded: boolean;
  onToggle: () => void;
  hasChildren: boolean;
}) {
  const styleClass = getElementStyleClass(element);
  const paddingLeft = level * 16;
  
  // Icon based on element type
  const getElementIcon = () => {
    if (hasChildren) {
      return <Box className="w-4 h-4 text-cream-600" />;
    }
    
    switch (element.type) {
      case 'circle':
        return <Circle className="w-4 h-4 text-cream-600" />;
      case 'rect':
        return <Square className="w-4 h-4 text-cream-600" />;
      default:
        return <Square className="w-4 h-4 text-cream-600" />;
    }
  };
  
  return (
    <div 
      className={`flex items-center justify-between p-2 border border-cream-300 bg-cream-100 hover:bg-cream-200 ${
        isSelected ? 'bg-cream-300 border-cream-500' : ''
      } ${level > 0 ? 'mt-0' : 'mt-1'}`}
      style={{ paddingLeft: `${paddingLeft + 8}px` }}
    >
      <div className="flex items-center space-x-2 flex-1">
        {hasChildren ? (
          <button
            onClick={(e) => {
              e.stopPropagation();
              onToggle();
            }}
            className="w-4 h-4 flex items-center justify-center hover:bg-cream-300 rounded"
          >
            {isExpanded ? (
              <ChevronDown className="w-3 h-3 text-cream-600" />
            ) : (
              <ChevronRight className="w-3 h-3 text-cream-600" />
            )}
          </button>
        ) : (
          <div className="w-4 h-4" />
        )}
        
        {getElementIcon()}
        
        <span className="font-medium text-cream-800">
          {element.attributes.id || element.type}
        </span>
        
        <StyleCircle 
          className={styleClass || ''} 
          hasStyle={!!styleClass}
          onStyleUpdate={(newClassName, newStyle) => {
            console.log('Style updated:', newClassName, newStyle);
            // TODO: Implement style update functionality
          }} 
        />
      </div>
      
      <div className="flex items-center">
        <Button
          variant="ghost"
          size="sm"
          onClick={(e) => {
            e.stopPropagation();
            onSelect(element);
          }}
          className="p-1 h-6 w-6 hover:bg-cream-300"
        >
          <Edit className="w-3 h-3 text-cream-600" />
        </Button>
      </div>
    </div>
  );
}

export default function SvgDomTree({ structure, selectedElementId, onSelectElement }: SvgDomTreeProps) {
  const [expandedElements, setExpandedElements] = useState<Set<string>>(new Set());

  const toggleExpanded = (elementId: string) => {
    const newExpanded = new Set(expandedElements);
    if (newExpanded.has(elementId)) {
      newExpanded.delete(elementId);
    } else {
      newExpanded.add(elementId);
    }
    setExpandedElements(newExpanded);
  };

  const renderElement = (element: SvgElement, level: number = 0): React.ReactNode[] => {
    const hasChildren = element.children && element.children.length > 0;
    const isExpanded = expandedElements.has(element.id);
    const isSelected = selectedElementId === element.id;
    
    // Skip defs and style elements for the main tree view
    if (element.type === 'defs' || element.type === 'style') {
      return hasChildren ? element.children.flatMap(child => renderElement(child, level)) : [];
    }

    const elements: React.ReactNode[] = [
      <ElementRow
        key={element.id}
        element={element}
        level={level}
        isSelected={isSelected}
        onSelect={onSelectElement}
        isExpanded={isExpanded}
        onToggle={() => toggleExpanded(element.id)}
        hasChildren={hasChildren}
      />
    ];

    // Add children if expanded
    if (hasChildren && isExpanded) {
      element.children.forEach(child => {
        elements.push(...renderElement(child, level + 1));
      });
    }

    return elements;
  };

  // Filter out defs to show only drawing elements
  const drawingElements = structure.root.children.filter(child => child.type !== 'defs');

  return (
    <div className="p-4">
      <div className="text-xs font-semibold text-cream-700 mb-3 uppercase tracking-wide">
        Elements
      </div>
      
      <div className="space-y-0">
        {drawingElements.flatMap(element => renderElement(element, 0))}
      </div>
    </div>
  );
}