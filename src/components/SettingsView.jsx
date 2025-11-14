import React, { useState } from 'react';
import { X, Plus, Trash2, Palette, MapPin, User, Building2, MessageSquare, Globe } from 'lucide-react';
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

/**
 * Vista de pantalla completa para configuración de opciones locales
 */
export const SettingsView = ({ isOpen, onClose, config, onSave }) => {
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

  if (!isOpen) return null;

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
      name: `Estilo ${localConfig.customStyles.length + 1}`,
      fill: '#000000',
      stroke: '#000000',
      strokeWidth: '1'
    };

    setLocalConfig(prev => ({
      ...prev,
      customStyles: [...prev.customStyles, newStyle]
    }));
    setEditingStyleIndex(localConfig.customStyles.length);
  };

  /**
   * Actualiza un estilo existente
   */
  const handleUpdateStyle = (index, field, value) => {
    setLocalConfig(prev => ({
      ...prev,
      customStyles: prev.customStyles.map((style, i) =>
        i === index ? { ...style, [field]: value } : style
      )
    }));
  };

  /**
   * Elimina un estilo
   */
  const handleDeleteStyle = (index) => {
    setLocalConfig(prev => ({
      ...prev,
      customStyles: prev.customStyles.filter((_, i) => i !== index)
    }));
    if (editingStyleIndex === index) {
      setEditingStyleIndex(null);
    }
  };

  /**
   * Guarda la configuración
   */
  const handleSave = () => {
    onSave(localConfig);
  };

  return (
    <div className="fixed inset-0 z-50 bg-background flex flex-col">
      {/* Header */}
      <header className="flex items-center justify-between p-4 border-b bg-muted/20">
        <div className="flex items-center gap-3">
          <h1 className="text-xl font-bold tracking-tight">
            Opciones Locales de PictoForge
          </h1>
        </div>

        <Button
          variant="ghost"
          size="sm"
          onClick={onClose}
          title="Cerrar"
        >
          <X size={20} />
        </Button>
      </header>

      {/* Content */}
      <div className="flex-1 overflow-y-auto p-6">
        <div className="max-w-4xl mx-auto space-y-8">
          {/* Información de Instancia */}
          <section className="space-y-4">
            <h2 className="text-lg font-semibold flex items-center gap-2">
              <Building2 size={20} />
              Información de Instancia
            </h2>
            <div className="grid gap-4">
              <div>
                <Label htmlFor="instanceName">Nombre de la Instancia</Label>
                <Input
                  id="instanceName"
                  value={localConfig.instanceName}
                  onChange={(e) => handleFieldChange('instanceName', e.target.value)}
                  placeholder="Ej: PictoForge Chile"
                />
              </div>
            </div>
          </section>

          {/* Autor */}
          <section className="space-y-4">
            <h2 className="text-lg font-semibold flex items-center gap-2">
              <User size={20} />
              Autor
            </h2>
            <div>
              <Label htmlFor="author">Nombre del Autor (para créditos)</Label>
              <Input
                id="author"
                value={localConfig.author}
                onChange={(e) => handleFieldChange('author', e.target.value)}
                placeholder="Ej: Juan Pérez"
              />
            </div>
          </section>

          {/* Ubicación */}
          <section className="space-y-4">
            <h2 className="text-lg font-semibold flex items-center gap-2">
              <MapPin size={20} />
              Ubicación
            </h2>
            <div>
              <Label htmlFor="location">Dirección</Label>
              <Input
                id="location"
                value={localConfig.location.address}
                onChange={(e) => handleLocationChange(e.target.value)}
                placeholder="Ej: Santiago, Chile"
              />
              <p className="text-xs text-muted-foreground mt-1">
                Integración con mapa disponible en futuras versiones
              </p>
            </div>
          </section>

          {/* Idioma */}
          <section className="space-y-4">
            <h2 className="text-lg font-semibold flex items-center gap-2">
              <Globe size={20} />
              Idioma
            </h2>
            <div>
              <Label htmlFor="language">Seleccionar Idioma</Label>
              <Select
                value={localConfig.language}
                onValueChange={(value) => handleFieldChange('language', value)}
              >
                <SelectTrigger id="language">
                  <SelectValue placeholder="Seleccionar idioma" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="es">Español</SelectItem>
                  <SelectItem value="en">English</SelectItem>
                  <SelectItem value="pt">Português</SelectItem>
                  <SelectItem value="fr">Français</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </section>

          {/* Prompt de Estilo Gráfico */}
          <section className="space-y-4">
            <h2 className="text-lg font-semibold flex items-center gap-2">
              <MessageSquare size={20} />
              Prompt General del Estilo Gráfico
            </h2>
            <div>
              <Label htmlFor="graphicStylePrompt">Descripción del Estilo</Label>
              <Textarea
                id="graphicStylePrompt"
                value={localConfig.graphicStylePrompt}
                onChange={(e) => handleFieldChange('graphicStylePrompt', e.target.value)}
                placeholder="Describe el estilo gráfico general para esta instancia..."
                rows={4}
              />
            </div>
          </section>

          {/* Estilos Personalizados */}
          <section className="space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-semibold flex items-center gap-2">
                <Palette size={20} />
                Estilos Personalizados
              </h2>
              <Button
                variant="outline"
                size="sm"
                onClick={handleCreateStyle}
              >
                <Plus size={16} className="mr-1" />
                Nuevo Estilo
              </Button>
            </div>

            {localConfig.customStyles.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground border rounded-lg">
                <Palette size={32} className="mx-auto mb-2 opacity-50" />
                <p className="text-sm">No hay estilos personalizados</p>
                <p className="text-xs mt-1">Crea uno nuevo para comenzar</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {localConfig.customStyles.map((style, index) => (
                  <div
                    key={style.id}
                    className="border rounded-lg p-4 space-y-3"
                  >
                    <div className="flex items-center justify-between">
                      <Input
                        value={style.name}
                        onChange={(e) => handleUpdateStyle(index, 'name', e.target.value)}
                        className="font-medium h-8"
                      />
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleDeleteStyle(index)}
                        className="h-8 w-8 p-0 ml-2"
                      >
                        <Trash2 size={14} />
                      </Button>
                    </div>

                    {/* Preview Circle */}
                    <div className="flex justify-center">
                      <svg width="60" height="60" viewBox="0 0 60 60">
                        <circle
                          cx="30"
                          cy="30"
                          r="25"
                          fill={style.fill}
                          stroke={style.stroke}
                          strokeWidth={style.strokeWidth}
                        />
                      </svg>
                    </div>

                    {/* Color Pickers */}
                    <div className="space-y-2">
                      <div>
                        <Label className="text-xs">Fill</Label>
                        <div className="flex gap-2">
                          <input
                            type="color"
                            value={style.fill}
                            onChange={(e) => handleUpdateStyle(index, 'fill', e.target.value)}
                            className="h-8 w-12 cursor-pointer"
                          />
                          <Input
                            value={style.fill}
                            onChange={(e) => handleUpdateStyle(index, 'fill', e.target.value)}
                            className="h-8 text-xs font-mono"
                          />
                        </div>
                      </div>

                      <div>
                        <Label className="text-xs">Stroke</Label>
                        <div className="flex gap-2">
                          <input
                            type="color"
                            value={style.stroke}
                            onChange={(e) => handleUpdateStyle(index, 'stroke', e.target.value)}
                            className="h-8 w-12 cursor-pointer"
                          />
                          <Input
                            value={style.stroke}
                            onChange={(e) => handleUpdateStyle(index, 'stroke', e.target.value)}
                            className="h-8 text-xs font-mono"
                          />
                        </div>
                      </div>

                      <div>
                        <Label className="text-xs">Stroke Width</Label>
                        <Input
                          type="number"
                          value={style.strokeWidth}
                          onChange={(e) => handleUpdateStyle(index, 'strokeWidth', e.target.value)}
                          className="h-8 text-xs"
                          min="0"
                          step="0.5"
                        />
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </section>
        </div>
      </div>

      {/* Footer con botones */}
      <footer className="p-4 border-t bg-muted/20 flex justify-end gap-2">
        <Button
          variant="outline"
          onClick={onClose}
        >
          Cancelar
        </Button>
        <Button
          onClick={handleSave}
        >
          Guardar Configuración
        </Button>
      </footer>
    </div>
  );
};

export default SettingsView;
