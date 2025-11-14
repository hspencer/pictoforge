import React, { useState } from 'react';
import ReactDOM from 'react-dom';
import { Settings, X, Plus, Trash2, Palette, MapPin, User, Building2, MessageSquare } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useI18n } from '@/hooks/useI18n';
import Draggable from 'react-draggable';

/**
 * Componente modal para configuración de opciones locales
 */
export const SettingsModal = ({ isOpen, onClose, config, onSave }) => {
  const { t } = useI18n();

  const [localConfig, setLocalConfig] = useState({
    instanceName: config?.instanceName || '',
    author: config?.author || '',
    location: config?.location || { address: '', coordinates: null },
    language: config?.language || 'es',
    graphicStylePrompt: config?.graphicStylePrompt || '',
    customStyles: config?.customStyles || []
  });

  const [editingStyleIndex, setEditingStyleIndex] = useState(null);

  /**
   * Actualiza un campo de configuración
   */
  const handleFieldChange = (field, value) => {
    setLocalConfig(prev => ({
      ...prev,
      [field]: value
    }));
  };

  /**
   * Actualiza la ubicación
   */
  const handleLocationChange = (address) => {
    setLocalConfig(prev => ({
      ...prev,
      location: { ...prev.location, address }
    }));
  };

  /**
   * Crea un nuevo estilo personalizado
   */
  const handleCreateStyle = () => {
    const newStyle = {
      id: Date.now().toString(),
      name: `estilo-${localConfig.customStyles.length + 1}`,
      properties: {
        fill: '#000000',
        stroke: '#000000',
        'stroke-width': '2'
      }
    };

    setLocalConfig(prev => ({
      ...prev,
      customStyles: [...prev.customStyles, newStyle]
    }));
  };

  /**
   * Actualiza un estilo existente
   */
  const handleUpdateStyle = (index, field, value) => {
    setLocalConfig(prev => {
      const newStyles = [...prev.customStyles];

      if (field === 'name') {
        newStyles[index].name = value;
      } else {
        newStyles[index].properties[field] = value;
      }

      return {
        ...prev,
        customStyles: newStyles
      };
    });
  };

  /**
   * Elimina un estilo
   */
  const handleDeleteStyle = (index) => {
    if (confirm('¿Eliminar este estilo?')) {
      setLocalConfig(prev => ({
        ...prev,
        customStyles: prev.customStyles.filter((_, i) => i !== index)
      }));
    }
  };

  /**
   * Guarda la configuración
   */
  const handleSave = () => {
    onSave(localConfig);
    onClose();
  };

  /**
   * Obtiene el preview del estilo
   */
  const getStylePreview = (style) => {
    return {
      backgroundColor: style.properties.fill || '#000000',
      borderColor: style.properties.stroke || '#000000',
      borderWidth: style.properties['stroke-width'] || '2px',
      borderStyle: 'solid'
    };
  };

  if (!isOpen) return null;

  return ReactDOM.createPortal(
    <>
      {/* Overlay */}
      <div
        className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* Modal */}
      <Draggable handle=".settings-drag-handle" defaultPosition={{ x: 0, y: 0 }}>
        <div
          className="fixed left-[50%] top-[50%] z-[60] w-[700px] max-h-[85vh]
                     bg-popover rounded-lg shadow-2xl border overflow-hidden
                     -translate-x-1/2 -translate-y-1/2"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header */}
          <div className="settings-drag-handle flex items-center justify-between p-4 border-b cursor-move bg-muted/20">
            <div className="flex items-center gap-2">
              <Settings size={20} />
              <div>
                <h2 className="text-lg font-semibold">Opciones Locales de PictoForge</h2>
                <p className="text-xs text-muted-foreground">Configura tu instancia y estilos personalizados</p>
              </div>
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={onClose}
              className="h-8 w-8 p-0"
            >
              <X size={16} />
            </Button>
          </div>

          {/* Content */}
          <div className="overflow-y-auto max-h-[calc(85vh-140px)] p-6 space-y-6">
            {/* Información de Instancia */}
            <section className="space-y-4">
              <h3 className="text-sm font-semibold flex items-center gap-2 text-primary">
                <Building2 size={16} />
                Información de Instancia
              </h3>

              <div className="space-y-3">
                <div>
                  <Label htmlFor="instanceName">Nombre de la instancia</Label>
                  <Input
                    id="instanceName"
                    value={localConfig.instanceName}
                    onChange={(e) => handleFieldChange('instanceName', e.target.value)}
                    placeholder="Ej: PUCV Design Lab"
                  />
                </div>

                <div>
                  <Label htmlFor="author">Autor (para créditos)</Label>
                  <div className="flex gap-2">
                    <User size={16} className="mt-2 text-muted-foreground" />
                    <Input
                      id="author"
                      value={localConfig.author}
                      onChange={(e) => handleFieldChange('author', e.target.value)}
                      placeholder="Tu nombre"
                    />
                  </div>
                </div>

                <div>
                  <Label htmlFor="location">Lugar</Label>
                  <div className="flex gap-2">
                    <MapPin size={16} className="mt-2 text-muted-foreground" />
                    <Input
                      id="location"
                      value={localConfig.location.address}
                      onChange={(e) => handleLocationChange(e.target.value)}
                      placeholder="Dirección o ubicación"
                    />
                  </div>
                  <p className="text-xs text-muted-foreground mt-1">
                    Puedes ingresar una dirección completa
                  </p>
                </div>
              </div>
            </section>

            {/* Idioma */}
            <section className="space-y-4">
              <h3 className="text-sm font-semibold flex items-center gap-2 text-primary">
                🌐 Localización
              </h3>

              <div>
                <Label htmlFor="language">Idioma</Label>
                <Select
                  value={localConfig.language}
                  onValueChange={(value) => handleFieldChange('language', value)}
                >
                  <SelectTrigger id="language">
                    <SelectValue placeholder="Selecciona idioma" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="es">Español</SelectItem>
                    <SelectItem value="en">English</SelectItem>
                    <SelectItem value="pt">Português</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </section>

            {/* Prompt de Estilo Gráfico */}
            <section className="space-y-4">
              <h3 className="text-sm font-semibold flex items-center gap-2 text-primary">
                <MessageSquare size={16} />
                Estilo Gráfico General
              </h3>

              <div>
                <Label htmlFor="graphicPrompt">Prompt de estilo</Label>
                <Textarea
                  id="graphicPrompt"
                  value={localConfig.graphicStylePrompt}
                  onChange={(e) => handleFieldChange('graphicStylePrompt', e.target.value)}
                  placeholder="Describe el estilo visual que deseas aplicar a tus pictogramas (ej: 'Estilo minimalista con líneas limpias y colores pastel')"
                  rows={4}
                  className="resize-none"
                />
                <p className="text-xs text-muted-foreground mt-1">
                  Este texto se usará como guía para generar estilos consistentes
                </p>
              </div>
            </section>

            {/* Estilos Personalizados */}
            <section className="space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-semibold flex items-center gap-2 text-primary">
                  <Palette size={16} />
                  Estilos de la Localización
                </h3>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleCreateStyle}
                  className="h-7"
                >
                  <Plus size={14} className="mr-1" />
                  Nuevo Estilo
                </Button>
              </div>

              {localConfig.customStyles.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  <Palette size={32} className="mx-auto mb-2 opacity-50" />
                  <p className="text-sm">No hay estilos personalizados</p>
                  <p className="text-xs">Crea uno para comenzar</p>
                </div>
              ) : (
                <div className="grid grid-cols-2 gap-3">
                  {localConfig.customStyles.map((style, index) => (
                    <div
                      key={style.id}
                      className="p-3 border rounded-lg space-y-2 hover:bg-muted/50 transition-colors"
                    >
                      {/* Preview Circle */}
                      <div className="flex items-center gap-3">
                        <div
                          className="w-12 h-12 rounded-full flex-shrink-0"
                          style={getStylePreview(style)}
                        />
                        <Input
                          value={style.name}
                          onChange={(e) => handleUpdateStyle(index, 'name', e.target.value)}
                          className="text-xs font-mono"
                          placeholder="nombre-estilo"
                        />
                      </div>

                      {/* Color Inputs */}
                      <div className="space-y-2">
                        <div className="flex gap-2 items-center">
                          <Label className="text-xs w-14">Fill:</Label>
                          <Input
                            type="color"
                            value={style.properties.fill}
                            onChange={(e) => handleUpdateStyle(index, 'fill', e.target.value)}
                            className="w-12 h-7 p-1 cursor-pointer"
                          />
                          <Input
                            value={style.properties.fill}
                            onChange={(e) => handleUpdateStyle(index, 'fill', e.target.value)}
                            className="flex-1 h-7 text-xs font-mono"
                          />
                        </div>

                        <div className="flex gap-2 items-center">
                          <Label className="text-xs w-14">Stroke:</Label>
                          <Input
                            type="color"
                            value={style.properties.stroke}
                            onChange={(e) => handleUpdateStyle(index, 'stroke', e.target.value)}
                            className="w-12 h-7 p-1 cursor-pointer"
                          />
                          <Input
                            value={style.properties.stroke}
                            onChange={(e) => handleUpdateStyle(index, 'stroke', e.target.value)}
                            className="flex-1 h-7 text-xs font-mono"
                          />
                        </div>

                        <div className="flex gap-2 items-center">
                          <Label className="text-xs w-14">Width:</Label>
                          <Input
                            type="number"
                            value={parseInt(style.properties['stroke-width']) || 2}
                            onChange={(e) => handleUpdateStyle(index, 'stroke-width', e.target.value)}
                            className="flex-1 h-7 text-xs"
                            min="0"
                            max="20"
                          />
                        </div>
                      </div>

                      {/* Delete Button */}
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleDeleteStyle(index)}
                        className="w-full h-7 text-destructive hover:text-destructive"
                      >
                        <Trash2 size={12} className="mr-1" />
                        Eliminar
                      </Button>
                    </div>
                  ))}
                </div>
              )}
            </section>
          </div>

          {/* Footer */}
          <div className="flex justify-end gap-2 p-4 border-t bg-muted/10">
            <Button variant="outline" onClick={onClose}>
              Cancelar
            </Button>
            <Button onClick={handleSave}>
              Guardar Configuración
            </Button>
          </div>
        </div>
      </Draggable>
    </>,
    document.body
  );
};

export default SettingsModal;
