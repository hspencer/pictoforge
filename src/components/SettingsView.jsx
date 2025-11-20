import React, { useState, useRef, useEffect } from 'react';
import { Plus, Trash2, Palette, MapPin, User, Building2, MessageSquare, Globe, Download, Upload, Sparkles } from 'lucide-react';
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
import DraggableModal from './DraggableModal';
import LocationMapPicker from './LocationMapPicker';

/**
 * Vista de pantalla completa para configuración de opciones locales
 */
export const SettingsView = ({ isOpen, onClose, config, onSave }) => {
  const { t, availableLanguages } = useI18n();
  const fileInputRef = useRef(null);

  const [localConfig, setLocalConfig] = useState({
    instanceName: config?.instanceName || '',
    author: config?.author || '',
    location: config?.location || {
      address: 'Auckland, New Zealand',
      coordinates: { lat: -36.8485, lng: 174.7633 }
    },
    language: config?.language || 'es',
    swapPanels: config?.swapPanels || false,
    graphicStylePrompt: config?.graphicStylePrompt || '',
    customStyles: config?.customStyles || [],
    // PictoNet Template Settings
    pictogramWidth: config?.pictogramWidth || 100,
    pictogramHeight: config?.pictogramHeight || 100,
    pictogramViewBox: config?.pictogramViewBox || '0 0 100 100'
  });

  // Auto-calcular viewBox cuando cambien width o height
  useEffect(() => {
    const newViewBox = `0 0 ${localConfig.pictogramWidth} ${localConfig.pictogramHeight}`;
    if (localConfig.pictogramViewBox !== newViewBox) {
      setLocalConfig(prev => ({
        ...prev,
        pictogramViewBox: newViewBox
      }));
    }
  }, [localConfig.pictogramWidth, localConfig.pictogramHeight]);

  const [editingStyleIndex, setEditingStyleIndex] = useState(null);
  const [importError, setImportError] = useState(null);

  if (!isOpen) {
    console.log('❌ SettingsView: isOpen =', isOpen, '- NOT rendering');
    return null;
  }

  console.log('✅ SettingsView: isOpen =', isOpen, '- RENDERING');

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
      name: `${t('newStyle')} ${localConfig.customStyles.length + 1}`,
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
      alert(t('errorExportingConfig'));
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
          throw new Error(t('invalidFileFormat'));
        }

        // Validar campos requeridos
        const validConfig = {
          instanceName: importedData.config.instanceName || '',
          author: importedData.config.author || '',
          location: importedData.config.location || { address: '', coordinates: null },
          language: importedData.config.language || 'es',
          swapPanels: importedData.config.swapPanels || false,
          graphicStylePrompt: importedData.config.graphicStylePrompt || '',
          customStyles: Array.isArray(importedData.config.customStyles)
            ? importedData.config.customStyles
            : [],
          // PictoNet Template Settings
          pictogramWidth: importedData.config.pictogramWidth || 100,
          pictogramHeight: importedData.config.pictogramHeight || 100,
          pictogramViewBox: importedData.config.pictogramViewBox || '0 0 100 100'
        };

        // Validar cada estilo personalizado (SettingsView usa estructura diferente)
        validConfig.customStyles = validConfig.customStyles.map(style => {
          // Si tiene la estructura de SettingsModal (con properties)
          if (style.properties) {
            return {
              id: style.id || Date.now().toString(),
              name: style.name || t('styleWithoutName'),
              fill: style.properties.fill || '#000000',
              stroke: style.properties.stroke || '#000000',
              strokeWidth: style.properties['stroke-width'] || '1'
            };
          }
          // Si ya tiene la estructura de SettingsView
          return {
            id: style.id || Date.now().toString(),
            name: style.name || t('styleWithoutName'),
            fill: style.fill || '#000000',
            stroke: style.stroke || '#000000',
            strokeWidth: style.strokeWidth || '1'
          };
        });

        setLocalConfig(validConfig);
        setImportError(null);
        console.log('✓ Configuración importada exitosamente');
        alert(t('configImportedSuccess'));
      } catch (error) {
        console.error('✗ Error al importar configuración:', error);
        setImportError(t('errorImportingConfig'));
        alert(t('errorImportingConfig'));
      }
    };

    reader.onerror = () => {
      console.error('✗ Error al leer el archivo');
      setImportError(t('errorReadingFileShort'));
      alert(t('errorReadingFileShort'));
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
    <DraggableModal
      isOpen={isOpen}
      onClose={onClose}
      title={t('localSettings')}
      width={600}
      maxHeight={800}
      storageKey="settings-view"
      zIndex={50}
    >
      {/* Content */}
      <div className="p-6 overflow-auto" style={{ maxHeight: '700px' }}>
        <div className="max-w-4xl mx-auto space-y-8">
          {/* Información de Instancia */}
          <section className="space-y-4">
            <div className="grid gap-4">
              <div>
                <Label htmlFor="instanceName" className="flex items-center gap-2">
                  <Building2 size={16} />
                  {t('instanceName')}
                </Label>
                <Input
                  id="instanceName"
                  value={localConfig.instanceName}
                  onChange={(e) => handleFieldChange('instanceName', e.target.value)}
                  placeholder={t('instanceNamePlaceholder')}
                />
              </div>
            </div>
          </section>

          {/* Autor */}
          <section className="space-y-4">
            <div>
              <Label htmlFor="author" className="flex items-center gap-2">
                <User size={16} />
                {t('author')}
              </Label>
              <Input
                id="author"
                value={localConfig.author}
                onChange={(e) => handleFieldChange('author', e.target.value)}
                placeholder={t('authorPlaceholder')}
              />
            </div>
          </section>

          {/* Ubicación */}
          <section className="space-y-4">
            <Label className="flex items-center gap-2">
              <MapPin size={16} />
              {t('location')}
            </Label>
            <LocationMapPicker
              location={localConfig.location}
              onLocationChange={(newLocation) => {
                setLocalConfig(prev => ({
                  ...prev,
                  location: newLocation
                }));
              }}
            />
          </section>

          {/* Layout */}
          <section className="space-y-4">
            <div className="flex items-center space-x-2">
              <input
                type="checkbox"
                id="swapPanels"
                checked={localConfig.swapPanels}
                onChange={(e) => handleFieldChange('swapPanels', e.target.checked)}
                className="h-4 w-4 rounded border-border text-primary focus:ring-2 focus:ring-ring focus:ring-offset-2"
              />
              <Label htmlFor="swapPanels" className="cursor-pointer flex items-center gap-2">
                <Building2 size={16} />
                {t('swapPanels')}
              </Label>
            </div>
            <p className="text-sm text-muted-foreground">
              {t('swapPanelsHelper')}
            </p>
          </section>

          {/* Idioma */}
          <section className="space-y-4">
            <div>
              <Label htmlFor="language" className="flex items-center gap-2">
                <Globe size={16} />
                {t('selectLanguage')}
              </Label>
              <Select
                value={localConfig.language}
                onValueChange={(value) => handleFieldChange('language', value)}
              >
                <SelectTrigger id="language">
                  <SelectValue placeholder={t('selectLanguagePlaceholder')} />
                </SelectTrigger>
                <SelectContent>
                  {availableLanguages.map((lang) => (
                    <SelectItem key={lang.code} value={lang.code}>
                      {lang.nativeName}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </section>

          {/* Dimensiones del Pictograma (PictoNet Template) */}
          <section className="space-y-4">
            <Label className="flex items-center gap-2">
              <Sparkles size={16} />
              {t('pictogramDimensions')}
            </Label>
            <p className="text-sm text-muted-foreground">
              {t('pictogramDimensionsHelper')}
            </p>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="pictogramWidth">{t('pictogramWidthLabel')}</Label>
                <Input
                  id="pictogramWidth"
                  type="number"
                  value={localConfig.pictogramWidth}
                  onChange={(e) => handleFieldChange('pictogramWidth', parseInt(e.target.value) || 100)}
                  placeholder="100"
                  min="50"
                  max="500"
                />
                <p className="text-xs text-muted-foreground mt-1">
                  {t('pictogramWidthHelper')}
                </p>
              </div>
              <div>
                <Label htmlFor="pictogramHeight">{t('pictogramHeightLabel')}</Label>
                <Input
                  id="pictogramHeight"
                  type="number"
                  value={localConfig.pictogramHeight}
                  onChange={(e) => handleFieldChange('pictogramHeight', parseInt(e.target.value) || 100)}
                  placeholder="100"
                  min="50"
                  max="500"
                />
                <p className="text-xs text-muted-foreground mt-1">
                  {t('pictogramHeightHelper')}
                </p>
              </div>
            </div>
            <div className="bg-muted/20 rounded p-3">
              <p className="text-xs text-muted-foreground font-mono">
                ViewBox: {localConfig.pictogramViewBox}
              </p>
              <p className="text-xs text-muted-foreground mt-1">
                {t('pictogramViewBoxHelper')}
              </p>
            </div>
          </section>

          {/* Prompt de Estilo Gráfico */}
          <section className="space-y-4">
            <div>
              <Label htmlFor="graphicStylePrompt" className="flex items-center gap-2">
                <MessageSquare size={16} />
                {t('graphicStylePrompt')}
              </Label>
              <Textarea
                id="graphicStylePrompt"
                value={localConfig.graphicStylePrompt}
                onChange={(e) => handleFieldChange('graphicStylePrompt', e.target.value)}
                placeholder={t('styleDescriptionPlaceholder')}
                rows={4}
              />
            </div>
          </section>

          {/* Estilos Personalizados */}
          <section className="space-y-4">
            <div className="flex items-center justify-between">
              <Label className="flex items-center gap-2">
                <Palette size={16} />
                {t('customStyles')}
              </Label>
              <Button
                variant="outline"
                size="sm"
                onClick={handleCreateStyle}
              >
                <Plus size={16} className="mr-1" />
                {t('newStyle')}
              </Button>
            </div>

            {localConfig.customStyles.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground border rounded-lg">
                <Palette size={32} className="mx-auto mb-2 opacity-50" />
                <p className="text-sm">{t('noCustomStyles')}</p>
                <p className="text-xs mt-1">{t('createNewToStart')}</p>
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
                        <Label className="text-xs">{t('fillLabel')}</Label>
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
                        <Label className="text-xs">{t('strokeLabel')}</Label>
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
                        <Label className="text-xs">{t('strokeWidthLabel')}</Label>
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
            <Label className="flex items-center gap-2">
              💾 {t('exportImportConfig')}
            </Label>

            <div className="bg-muted/30 rounded-lg p-4 space-y-4">
              <p className="text-sm text-muted-foreground">
                {t('exportConfigHelper')}
              </p>

              <div className="flex gap-3">
                <Button
                  variant="outline"
                  onClick={handleExport}
                  className="flex-1"
                >
                  <Download size={16} className="mr-2" />
                  {t('exportConfig')}
                </Button>

                <Button
                  variant="outline"
                  onClick={handleImportClick}
                  className="flex-1"
                >
                  <Upload size={16} className="mr-2" />
                  {t('importConfig')}
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
                ⚠️ {t('importWarning')}
              </p>
            </div>
          </section>

          {/* Footer con botones */}
          <footer className="pt-6 border-t flex justify-end gap-2 sticky bottom-0 bg-popover">
            <Button
              variant="outline"
              onClick={onClose}
            >
              {t('cancel')}
            </Button>
            <Button
              onClick={handleSave}
            >
              {t('saveConfiguration')}
            </Button>
          </footer>
        </div>
      </div>
    </DraggableModal>
  );
};

export default SettingsView;
