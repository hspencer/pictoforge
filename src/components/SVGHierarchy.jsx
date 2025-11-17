import React, { useState } from 'react';
import { ChevronRight, ChevronDown, Circle, Square, Triangle, Plus, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useI18n } from '@/hooks/useI18n.jsx';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import DraggableModal from './DraggableModal';

/**
 * Componente para mostrar la jerarquía de elementos SVG
 */
export const SVGHierarchy = ({
  svgData,
  selectedElement,
  onElementSelect,
  expandedElements = new Set(),
  onToggleExpand,
  onStyleChange,
  onSVGUpdate,
  svgContent
}) => {
  const { t } = useI18n();
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [editingStyle, setEditingStyle] = useState(null);

  // Lista de propiedades CSS comunes para SVG
  const commonSVGProperties = [
    'fill', 'stroke', 'stroke-width', 'stroke-linecap', 'stroke-linejoin',
    'stroke-dasharray', 'stroke-dashoffset', 'opacity', 'fill-opacity',
    'stroke-opacity', 'transform', 'filter', 'clip-path', 'mask'
  ];
  
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

  /**
   * Obtiene los estilos CSS inline para el preview (fill, stroke, etc.)
   */
  const getStylePreview = (properties) => {
    const props = parseStyleProperties(properties);
    const style = {};

    props.forEach(prop => {
      if (prop.key === 'fill') style.backgroundColor = prop.value;
      if (prop.key === 'stroke') style.borderColor = prop.value;
      if (prop.key === 'stroke-width') style.borderWidth = prop.value;
      if (prop.key === 'opacity') style.opacity = prop.value;
    });

    // Si no hay fill, usar transparente
    if (!style.backgroundColor) style.backgroundColor = 'transparent';
    // Si no hay stroke, usar border por defecto
    if (!style.borderColor) style.borderColor = '#e5e7eb';
    if (!style.borderWidth) style.borderWidth = '2px';

    return style;
  };

  /**
   * Abre el modal de edición de un estilo
   */
  const handleStyleDoubleClick = (style) => {
    setEditingStyle({
      name: style.name,
      properties: parseStyleProperties(style.properties)
    });
    setEditModalOpen(true);
  };

  /**
   * Crea un nuevo estilo vacío
   */
  const handleCreateNewStyle = () => {
    setEditingStyle({
      name: 'nuevo-estilo',
      properties: [
        { key: 'fill', value: '#000000' },
        { key: 'stroke', value: '#000000' }
      ]
    });
    setEditModalOpen(true);
  };

  /**
   * Guarda los cambios del estilo editado
   */
  const handleSaveStyle = () => {
    // TODO: Implementar guardado de estilos
    console.log('Guardando estilo:', editingStyle);
    setEditModalOpen(false);
    setEditingStyle(null);
  };

  /**
   * Elimina el estilo actual
   */
  const handleDeleteStyle = () => {
    // TODO: Implementar eliminación de estilos
    console.log('Eliminando estilo:', editingStyle?.name);
    setEditModalOpen(false);
    setEditingStyle(null);
  };

  /**
   * Obtiene las propiedades disponibles (no utilizadas)
   */
  const getAvailableProperties = () => {
    if (!editingStyle) return commonSVGProperties;
    const usedKeys = editingStyle.properties.map(p => p.key);
    return commonSVGProperties.filter(prop => !usedKeys.includes(prop));
  };

  if (!svgData) {
    return (
      <div className="p-4 text-muted-foreground">
        <p>{t('noSVGLoaded')}</p>
      </div>
    );
  }

  /**
   * Filtra nodos innecesarios (root svg, defs)
   */
  const getDrawingElements = () => {
    if (!svgData?.root?.children) return [];

    // Filtrar elementos que no son de dibujo
    return svgData.root.children.filter(child =>
      child.tagName !== 'defs' &&
      child.tagName !== 'style' &&
      child.tagName !== 'title' &&
      child.tagName !== 'desc' &&
      child.tagName !== 'metadata'
    );
  };

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
          onClick={() => onElementSelect(element, true)}
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

  const availableStyles = getAvailableStyles();
  const drawingElements = getDrawingElements();

  return (
    <div className="h-full flex flex-col overflow-hidden">
      {/* Header con estilos */}
      <div className="p-3 border-b bg-background flex items-center justify-between gap-2">
        <h3 className="font-semibold text-sm">{t('svgElements')}</h3>

        {/* Círculos de estilos */}
        <TooltipProvider>
          <div className="flex items-center gap-1">
            {availableStyles.map((style) => {
              const previewStyle = getStylePreview(style.properties);

              return (
                <Tooltip key={style.name}>
                  <TooltipTrigger asChild>
                    <button
                      className="w-6 h-6 rounded-full flex-shrink-0 hover:scale-110 transition-transform cursor-pointer"
                      style={{
                        ...previewStyle,
                        borderStyle: 'solid',
                      }}
                      onDoubleClick={() => handleStyleDoubleClick(style)}
                      onClick={(e) => e.stopPropagation()}
                    />
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>{style.name}</p>
                  </TooltipContent>
                </Tooltip>
              );
            })}

            {/* Botón para agregar nuevo estilo */}
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleCreateNewStyle}
                  className="h-6 w-6 p-0 rounded-full"
                >
                  <Plus size={12} />
                </Button>
              </TooltipTrigger>
              <TooltipContent>
                <p>{t('createNewStyle')}</p>
              </TooltipContent>
            </Tooltip>
          </div>
        </TooltipProvider>
      </div>

      {/* Lista de elementos de dibujo */}
      <div className="flex-1 overflow-auto p-2">
        {drawingElements.length === 0 ? (
          <div className="text-center text-muted-foreground py-8">
            <p className="text-sm">{t('noDrawingElements')}</p>
          </div>
        ) : (
          drawingElements.map(element => renderElement(element, 0))
        )}
      </div>

      {/* Modal de edición de estilos */}
      <DraggableModal
        isOpen={editModalOpen}
        onClose={() => {
          setEditModalOpen(false);
          setEditingStyle(null);
        }}
        title={t('editStyle')}
        width={550}
        maxHeight={600}
        storageKey="style-editor"
        zIndex={60}
      >
        {editingStyle && (
          <div className="p-6">
            <p className="text-sm text-muted-foreground mb-4">
              {t('editStyleDescription')}
            </p>
            <div className="space-y-4 py-4">
              {/* Nombre del estilo */}
              <div className="space-y-2">
                <Label htmlFor="style-name">{t('styleName')}</Label>
                <Input
                  id="style-name"
                  value={editingStyle.name}
                  onChange={(e) =>
                    setEditingStyle({ ...editingStyle, name: e.target.value })
                  }
                  placeholder={t('styleNamePlaceholder')}
                />
              </div>

              {/* Propiedades CSS */}
              <div className="space-y-3">
                <Label>{t('cssProperties')}</Label>
                <div className="space-y-2 max-h-[300px] overflow-y-auto">
                  {editingStyle.properties.map((prop, index) => (
                    <div key={index} className="flex gap-2">
                      <Select
                        value={prop.key}
                        onValueChange={(value) => {
                          const newProps = [...editingStyle.properties];
                          newProps[index].key = value;
                          setEditingStyle({ ...editingStyle, properties: newProps });
                        }}
                      >
                        <SelectTrigger className="w-[140px] text-xs font-mono">
                          <SelectValue placeholder={t('propertyPlaceholder')} />
                        </SelectTrigger>
                        <SelectContent>
                          {prop.key && !commonSVGProperties.includes(prop.key) && (
                            <SelectItem value={prop.key}>{prop.key}</SelectItem>
                          )}
                          {commonSVGProperties.map((p) => (
                            <SelectItem key={p} value={p}>
                              {p}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <Input
                        value={prop.value}
                        onChange={(e) => {
                          const newProps = [...editingStyle.properties];
                          newProps[index].value = e.target.value;
                          setEditingStyle({ ...editingStyle, properties: newProps });
                        }}
                        placeholder={t('valuePlaceholder')}
                        className="flex-1 text-xs font-mono"
                      />
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => {
                          const newProps = editingStyle.properties.filter((_, i) => i !== index);
                          setEditingStyle({ ...editingStyle, properties: newProps });
                        }}
                        className="h-9 w-9 p-0"
                        title={t('deleteProperty')}
                      >
                        <Trash2 size={14} />
                      </Button>
                    </div>
                  ))}
                </div>

                {/* Botón para agregar nueva propiedad */}
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    const availableProps = getAvailableProperties();
                    const newKey = availableProps.length > 0 ? availableProps[0] : '';
                    setEditingStyle({
                      ...editingStyle,
                      properties: [...editingStyle.properties, { key: newKey, value: '' }]
                    });
                  }}
                  className="w-full"
                  disabled={getAvailableProperties().length === 0}
                >
                  <Plus size={14} className="mr-1" />
                  {t('addProperty')}
                </Button>
              </div>

              {/* Botones de acción */}
              <div className="flex justify-between gap-2 pt-4 border-t">
                <Button
                  variant="destructive"
                  size="sm"
                  onClick={handleDeleteStyle}
                >
                  <Trash2 size={14} className="mr-1" />
                  {t('deleteStyle')}
                </Button>
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    onClick={() => {
                      setEditModalOpen(false);
                      setEditingStyle(null);
                    }}
                  >
                    {t('cancel')}
                  </Button>
                  <Button onClick={handleSaveStyle}>
                    {t('saveChanges')}
                  </Button>
                </div>
              </div>
            </div>
          </div>
        )}
      </DraggableModal>
    </div>
  );
};

export default SVGHierarchy;
