import React from 'react';
import { ChevronRight, ChevronDown, Circle, Square, Triangle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useI18n } from '@/hooks/useI18n.jsx';

/**
 * Componente para mostrar la jerarquía de elementos SVG
 */
export const SVGHierarchy = ({ 
  svgData, 
  selectedElement, 
  onElementSelect,
  expandedElements = new Set(),
  onToggleExpand 
}) => {
  const { t } = useI18n();
  
  if (!svgData) {
    return (
      <div className="p-4 text-muted-foreground">
        <p>{t('noSVGLoaded')}</p>
      </div>
    );
  }

  /**
   * Obtiene el icono apropiado para cada tipo de elemento
   */
  const getElementIcon = (tagName) => {
    const iconProps = { size: 16, className: "text-muted-foreground" };
    
    switch (tagName) {
      case 'circle':
        return <Circle {...iconProps} />;
      case 'rect':
      case 'g':
        return <Square {...iconProps} />;
      case 'path':
      case 'polygon':
        return <Triangle {...iconProps} />;
      default:
        return <Circle {...iconProps} />;
    }
  };

  /**
   * Renderiza un elemento individual de la jerarquía
   */
  const renderElement = (element, depth = 0) => {
    const hasChildren = element.children && element.children.length > 0;
    const isExpanded = expandedElements.has(element.id);
    const isSelected = selectedElement?.id === element.id;

    return (
      <div key={element.id} className="select-none">
        <div 
          className={`
            flex items-center gap-2 py-1 px-2 rounded-md cursor-pointer transition-all duration-200
            hover:bg-accent hover:text-accent-foreground
            ${isSelected ? 'bg-primary text-primary-foreground shadow-sm' : ''}
          `}
          style={{ paddingLeft: `${depth * 16 + 8}px` }}
          onClick={() => onElementSelect(element)}
        >
          {/* Botón de expansión */}
          {hasChildren && (
            <Button
              variant="ghost"
              size="sm"
              className="h-4 w-4 p-0 hover:bg-transparent"
              onClick={(e) => {
                e.stopPropagation();
                onToggleExpand(element.id);
              }}
            >
              {isExpanded ? (
                <ChevronDown size={12} />
              ) : (
                <ChevronRight size={12} />
              )}
            </Button>
          )}
          
          {/* Espaciador si no tiene hijos */}
          {!hasChildren && <div className="w-4" />}
          
          {/* Icono del elemento */}
          {getElementIcon(element.tagName)}
          
          {/* Información del elemento */}
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2">
              <span className="font-medium text-sm truncate">
                {element.id || element.tagName}
              </span>
              {element.className && (
                <span className="text-xs text-muted-foreground bg-muted px-1 rounded">
                  .{element.className}
                </span>
              )}
            </div>
            <div className="text-xs text-muted-foreground">
              {element.tagName}
              {element.children.length > 0 && (
                <span className="ml-1">({element.children.length})</span>
              )}
            </div>
          </div>
        </div>

        {/* Elementos hijos */}
        {hasChildren && isExpanded && (
          <div>
            {element.children.map(child => 
              renderElement(child, depth + 1)
            )}
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="h-full overflow-auto">
      <div className="p-4 border-b">
        <h3 className="font-semibold text-sm">{t('svgElements')}</h3>
      </div>
      <div className="p-2">
        {renderElement(svgData.root)}
      </div>
    </div>
  );
};

export default SVGHierarchy;
