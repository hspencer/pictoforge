import React from 'react';
import ReactDOM from 'react-dom';
import { Palette, Eye, EyeOff, Edit2, Plus, Trash2, GripVertical } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useI18n } from '@/hooks/useI18n';
import PathDebugger from './PathDebugger';
import SVGMetadataEditor from './SVGMetadataEditor';
import Draggable from 'react-draggable';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogPortal,
  DialogOverlay,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Popover } from './ui/popover';

/**
 * Componente para el panel de estilos CSS
 */

export const StylePanel = ({
  svgData,
  selectedElement,
  svgContent,
  onStyleChange,
  onSVGUpdate
}) => {
  const { t } = useI18n();
  const [activeStyles, setActiveStyles] = React.useState(new Set());
  const [editingStyle, setEditingStyle] = React.useState(null);
  const [editModalOpen, setEditModalOpen] = React.useState(false);

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
   * Guarda los cambios del estilo editado
   */
  const handleSaveStyle = () => {
    // TODO: Implementar guardado de estilos
    console.log('Guardando estilo:', editingStyle);
    setEditModalOpen(false);
    setEditingStyle(null);
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

  const availableStyles = getAvailableStyles();

  return (
    <div className="h-full flex flex-col bg-muted/20">
      <div className="p-4 border-b bg-background flex items-center justify-between">
        <h3 className="font-semibold text-sm flex items-center gap-2">
          <Palette size={16} />
          {t('styles')}
        </h3>
        <Button
          variant="outline"
          size="sm"
          onClick={handleCreateNewStyle}
          className="h-7 w-7 p-0"
          title={t('createNewStyle')}
        >
          <Plus size={14} />
        </Button>
      </div>

      <div className="flex-1 overflow-auto p-4">
        {availableStyles.length === 0 ? (
          <div className="text-center text-muted-foreground py-8">
            <Palette size={32} className="mx-auto mb-2 opacity-50" />
            <p className="text-sm">{t('noStylesDefined')}</p>
          </div>
        ) : (
          <div className="flex flex-wrap gap-2">
            {availableStyles.map((style) => {
              const previewStyle = getStylePreview(style.properties);

              return (
                <div
                  key={style.name}
                  className={`
                    flex flex-col items-center gap-1 p-2 rounded-lg cursor-pointer
                    transition-all duration-200 relative
                    ${style.isActive
                      ? 'bg-background border border-primary'
                      : 'hover:bg-background/50 border border-transparent'
                    }
                  `}
                  onClick={() => toggleStyle(style.name)}
                  onDoubleClick={() => handleStyleDoubleClick(style)}
                  title={t('clickToApplyDoubleClickToEdit')}
                >
                  {/* Círculo de preview con el estilo aplicado */}
                  <div
                    className="w-10 h-10 rounded-full flex-shrink-0"
                    style={{
                      ...previewStyle,
                      borderStyle: 'solid',
                      opacity: style.isActive ? 1 : 0.7
                    }}
                  />

                  {/* Nombre del estilo (sin punto) */}
                  <span className={`
                    text-xs font-medium text-center max-w-[60px] truncate
                    ${style.isActive ? 'text-primary' : 'text-foreground'}
                  `}>
                    {style.name}
                  </span>

                  {/* Indicador de activo */}
                  {style.isActive && (
                    <div className="absolute top-1 right-1">
                      <Eye size={10} className="text-primary" />
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}

        {/* Información del elemento seleccionado */}
        {selectedElement && (
          <div className="mt-6 pt-4 border-t space-y-4">
            <div>
              <h4 className="font-medium text-sm mb-2">{t('selectedElement')}</h4>
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

            {/* PathDebugger - Solo para elementos <path> */}
            {selectedElement.tagName === 'path' && selectedElement.element && (
              <PathDebugger pathElement={selectedElement.element} />
            )}
          </div>
        )}

        {/* SVGMetadataEditor - Siempre visible cuando hay SVG */}
        {svgContent && onSVGUpdate && (
          <div className="border-t pt-4">
            <SVGMetadataEditor
              svgContent={svgContent}
              onUpdate={onSVGUpdate}
            />
          </div>
        )}

        {!selectedElement && !svgContent && (
          <div className="mt-6 pt-4 border-t text-center text-muted-foreground">
            <p className="text-sm">
              {t('selectElementToApplyStyles')}
            </p>
          </div>
        )}
      </div>

      {/* Modal de edición de estilos - Draggeable */}
      {editModalOpen && ReactDOM.createPortal(
        <>
          {/* Overlay */}
          <div
            className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm"
            onClick={() => setEditModalOpen(false)}
          />

          {/* Modal Draggeable */}
          <Draggable
            handle=".drag-handle"
            defaultPosition={{
              x: window.innerWidth / 2 - 250,
              y: window.innerHeight / 2 - 300
            }}
          >
            <div
              className="style-panel-modal fixed z-[60] w-[500px] rounded-lg shadow-2xl"
              style={{
                left: 0,
                top: 0,
                transform: 'translate(-50%, -50%)',
                background-color: 'var(--popover)',
              }}
            >
              {/* Header con drag handle */}
              <div className="drag-handle flex items-center gap-2 p-4 border-b cursor-move bg-muted/20">
                <GripVertical size={16} className="text-muted-foreground" />
                <div className="flex-1">
                  <h2 className="text-lg font-semibold">{t('editStyle')}</h2>
                  <p className="text-sm text-muted-foreground">{t('editStyleDescription')}</p>
                </div>
              </div>

              {editingStyle && (
                <div className="space-y-4 p-4 max-h-[600px] overflow-y-auto">
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
                          {/* Mostrar la propiedad actual si no está en la lista */}
                          {prop.key && !commonSVGProperties.includes(prop.key) && (
                            <SelectItem value={prop.key}>{prop.key}</SelectItem>
                          )}
                          {/* Mostrar propiedades disponibles */}
                          {commonSVGProperties.map((p) => (
                            <SelectItem key={p} value={p}>
                              {p}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      {/* Input tipo color para propiedades de color */}
                      {(prop.key === 'fill' || prop.key === 'stroke' || prop.key.includes('color')) ? (
                        <div className="flex gap-2 flex-1">
                          <Input
                            type="color"
                            value={prop.value.startsWith('#') ? prop.value : '#000000'}
                            onChange={(e) => {
                              const newProps = [...editingStyle.properties];
                              newProps[index].value = e.target.value;
                              setEditingStyle({ ...editingStyle, properties: newProps });
                            }}
                            className="w-16 h-9 p-1 cursor-pointer"
                          />
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
                        </div>
                      ) : (
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
                      )}
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
              )}
            </div>
          </Draggable>
        </>,
        document.body
      )}
    </div>
  );
};

export default StylePanel;
