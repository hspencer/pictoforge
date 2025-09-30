import React from 'react';
import { Palette, Eye, EyeOff } from 'lucide-react';
import { Button } from '@/components/ui/button';

/**
 * Componente para el panel de estilos CSS
 */
export const StylePanel = ({ 
  svgData, 
  selectedElement,
  onStyleChange 
}) => {
  const [activeStyles, setActiveStyles] = React.useState(new Set());

  /**
   * Obtiene los estilos disponibles del SVG
   */
  const getAvailableStyles = () => {
    if (!svgData?.styles) return [];
    
    return Object.entries(svgData.styles).map(([className, properties]) => ({
      name: className,
      properties: properties,
      isActive: selectedElement?.className?.includes(className) || false
    }));
  };

  /**
   * Aplica o remueve un estilo del elemento seleccionado
   */
  const toggleStyle = (styleName) => {
    if (!selectedElement) return;

    const currentClasses = selectedElement.className.split(' ').filter(c => c.trim());
    const hasStyle = currentClasses.includes(styleName);

    let newClasses;
    if (hasStyle) {
      newClasses = currentClasses.filter(c => c !== styleName);
    } else {
      newClasses = [...currentClasses, styleName];
    }

    onStyleChange?.(selectedElement.id, newClasses.join(' '));
  };

  /**
   * Parsea las propiedades CSS para mostrarlas de forma legible
   */
  const parseStyleProperties = (properties) => {
    return properties
      .split(';')
      .filter(prop => prop.trim())
      .map(prop => {
        const [key, value] = prop.split(':').map(s => s.trim());
        return { key, value };
      });
  };

  const availableStyles = getAvailableStyles();

  return (
    <div className="h-full flex flex-col bg-background">
      <div className="p-4 border-b">
        <h3 className="font-semibold text-sm flex items-center gap-2">
          <Palette size={16} />
          STYLES
        </h3>
      </div>

      <div className="flex-1 overflow-auto p-4">
        {availableStyles.length === 0 ? (
          <div className="text-center text-muted-foreground py-8">
            <Palette size={32} className="mx-auto mb-2 opacity-50" />
            <p className="text-sm">No hay estilos definidos</p>
          </div>
        ) : (
          <div className="space-y-3">
            {availableStyles.map((style) => {
              const properties = parseStyleProperties(style.properties);
              
              return (
                <div 
                  key={style.name}
                  className={`
                    border rounded-lg p-3 transition-all duration-200
                    ${style.isActive 
                      ? 'border-primary bg-primary/5' 
                      : 'border-border hover:border-primary/50'
                    }
                  `}
                >
                  {/* Encabezado del estilo */}
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <div 
                        className={`
                          w-3 h-3 rounded-full border-2
                          ${style.isActive 
                            ? 'bg-primary border-primary' 
                            : 'border-muted-foreground'
                          }
                        `}
                      />
                      <span className="font-medium text-sm">
                        .{style.name}
                      </span>
                    </div>
                    
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => toggleStyle(style.name)}
                      disabled={!selectedElement}
                      className="h-6 w-6 p-0"
                      title={style.isActive ? 'Remover estilo' : 'Aplicar estilo'}
                    >
                      {style.isActive ? (
                        <EyeOff size={12} />
                      ) : (
                        <Eye size={12} />
                      )}
                    </Button>
                  </div>

                  {/* Propiedades del estilo */}
                  <div className="space-y-1">
                    {properties.map((prop, index) => (
                      <div 
                        key={index}
                        className="flex justify-between text-xs"
                      >
                        <span className="text-muted-foreground font-mono">
                          {prop.key}:
                        </span>
                        <span className="font-mono">
                          {prop.value}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* Información del elemento seleccionado */}
        {selectedElement && (
          <div className="mt-6 pt-4 border-t">
            <h4 className="font-medium text-sm mb-2">Elemento Seleccionado</h4>
            <div className="bg-muted/20 rounded p-3 text-xs space-y-1">
              <div className="flex justify-between">
                <span className="text-muted-foreground">ID:</span>
                <span className="font-mono">{selectedElement.id}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Tipo:</span>
                <span className="font-mono">{selectedElement.tagName}</span>
              </div>
              {selectedElement.className && (
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Clases:</span>
                  <span className="font-mono">{selectedElement.className}</span>
                </div>
              )}
            </div>
          </div>
        )}

        {!selectedElement && (
          <div className="mt-6 pt-4 border-t text-center text-muted-foreground">
            <p className="text-sm">
              Selecciona un elemento para aplicar estilos
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

export default StylePanel;
