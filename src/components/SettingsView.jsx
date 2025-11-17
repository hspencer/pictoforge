import React, { useState, useRef } from 'react';
import { X, Plus, Trash2, Palette, MapPin, User, Building2, MessageSquare, Globe, Download, Upload } from 'lucide-react';
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
  const fileInputRef = useRef(null);

  const [localConfig, setLocalConfig] = useState({
    instanceName: config?.instanceName || '',
    author: config?.author || '',
    location: config?.location || { address: '', coordinates: null },
    language: config?.language || 'es',
    graphicStylePrompt: config?.graphicStylePrompt || '',
    customStyles: config?.customStyles || []
  });

  const [editingStyleIndex, setEditingStyleIndex] = useState(null);
  const [importError, setImportError] = useState(null);

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
   * Exporta la configuración a un archivo JSON
   */
  const handleExport = () => {
    try {
      const exportData = {
        version: '1.0',
        exportDate: new Date().toISOString(),
        config: localConfig
      };

      const blob = new Blob([JSON.stringify(exportData, null, 2)], {
        type: 'application/json'
      });

      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `pictoforge-config-${Date.now()}.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);

      console.log('✓ Configuración exportada exitosamente');
    } catch (error) {
      console.error('✗ Error al exportar configuración:', error);
      alert('Error al exportar la configuración');
    }
  };

  /**
   * Importa la configuración desde un archivo JSON
   */
  const handleImport = (event) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const content = e.target.result;
        const importedData = JSON.parse(content);

        // Validar estructura del archivo
        if (!importedData.config) {
          throw new Error('Formato de archivo inválido');
        }

        // Validar campos requeridos
        const validConfig = {
          instanceName: importedData.config.instanceName || '',
          author: importedData.config.author || '',
          location: importedData.config.location || { address: '', coordinates: null },
          language: importedData.config.language || 'es',
          graphicStylePrompt: importedData.config.graphicStylePrompt || '',
          customStyles: Array.isArray(importedData.config.customStyles)
            ? importedData.config.customStyles
            : []
        };

        // Validar cada estilo personalizado (SettingsView usa estructura diferente)
        validConfig.customStyles = validConfig.customStyles.map(style => {
          // Si tiene la estructura de SettingsModal (con properties)
          if (style.properties) {
            return {
              id: style.id || Date.now().toString(),
              name: style.name || 'Estilo sin nombre',
              fill: style.properties.fill || '#000000',
              stroke: style.properties.stroke || '#000000',
              strokeWidth: style.properties['stroke-width'] || '1'
            };
          }
          // Si ya tiene la estructura de SettingsView
          return {
            id: style.id || Date.now().toString(),
            name: style.name || 'Estilo sin nombre',
            fill: style.fill || '#000000',
            stroke: style.stroke || '#000000',
            strokeWidth: style.strokeWidth || '1'
          };
        });

        setLocalConfig(validConfig);
        setImportError(null);
        console.log('✓ Configuración importada exitosamente');
        alert('Configuración importada exitosamente. No olvides guardar los cambios.');
      } catch (error) {
        console.error('✗ Error al importar configuración:', error);
        setImportError('Error al importar el archivo. Verifica que sea un archivo válido.');
        alert('Error al importar la configuración. Verifica que el archivo sea válido.');
      }
    };

    reader.onerror = () => {
      console.error('✗ Error al leer el archivo');
      setImportError('Error al leer el archivo');
      alert('Error al leer el archivo');
    };

    reader.readAsText(file);

    // Limpiar el input para permitir seleccionar el mismo archivo nuevamente
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  /**
   * Abre el selector de archivos
   */
  const handleImportClick = () => {
    fileInputRef.current?.click();
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

          {/* Exportar/Importar Configuración */}
          <section className="space-y-4 pt-4 border-t">
            <h2 className="text-lg font-semibold flex items-center gap-2">
              💾 Exportar/Importar Configuración
            </h2>

            <div className="bg-muted/30 rounded-lg p-4 space-y-4">
              <p className="text-sm text-muted-foreground">
                Guarda tu configuración en un archivo JSON para respaldo o para compartirla con otros.
              </p>

              <div className="flex gap-3">
                <Button
                  variant="outline"
                  onClick={handleExport}
                  className="flex-1"
                >
                  <Download size={16} className="mr-2" />
                  Exportar Configuración
                </Button>

                <Button
                  variant="outline"
                  onClick={handleImportClick}
                  className="flex-1"
                >
                  <Upload size={16} className="mr-2" />
                  Importar Configuración
                </Button>
              </div>

              {/* Input oculto para seleccionar archivos */}
              <input
                ref={fileInputRef}
                type="file"
                accept=".json,application/json"
                onChange={handleImport}
                className="hidden"
              />

              {importError && (
                <div className="text-sm text-destructive bg-destructive/10 p-3 rounded">
                  {importError}
                </div>
              )}

              <p className="text-sm text-muted-foreground">
                ⚠️ Al importar, la configuración actual será reemplazada. Asegúrate de exportar tu configuración actual antes de importar otra.
              </p>
            </div>
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
