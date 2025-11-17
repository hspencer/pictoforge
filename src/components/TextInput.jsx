import React, { useState, useRef } from 'react';
import { Upload, FileText, Download, AlertCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useI18n } from '@/hooks/useI18n.jsx';
import { SchemaStatusBar } from '@/semantic/components/SchemaStatusBar';

// Tamaño máximo de archivo: 5MB
const MAX_FILE_SIZE = 5 * 1024 * 1024;

/**
 * Componente para la entrada de texto y carga de archivos
 */
export const TextInput = ({
  onTextChange,
  onFileLoad,
  currentText = '',
  placeholder,
  // Schema status bar props
  schemaStatus = 'idle', // 'idle' | 'loading' | 'ready' | 'editing' | 'error'
  nluSchema = null,
  onSchemaChange,
  onSchemaGenerate,
  schemaError = null
}) => {
  const { t } = useI18n();
  const [text, setText] = useState(currentText);
  const [isDragging, setIsDragging] = useState(false);
  const [uploadError, setUploadError] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const fileInputRef = useRef(null);

  /**
   * Maneja el cambio de texto
   */
  const handleTextChange = (event) => {
    const newText = event.target.value;
    setText(newText);
    onTextChange?.(newText);
  };

  /**
   * Valida un archivo SVG
   */
  const validateFile = (file) => {
    // Validar tipo de archivo
    if (!file.type.includes('svg') && !file.name.endsWith('.svg')) {
      return { valid: false, error: 'Por favor selecciona un archivo SVG válido (.svg)' };
    }

    // Validar tamaño de archivo
    if (file.size > MAX_FILE_SIZE) {
      const sizeMB = (file.size / (1024 * 1024)).toFixed(2);
      return { valid: false, error: `El archivo es demasiado grande (${sizeMB}MB). Máximo: 5MB` };
    }

    return { valid: true };
  };

  /**
   * Procesa un archivo SVG
   */
  const processFile = (file) => {
    setUploadError(null);
    setIsLoading(true);

    const validation = validateFile(file);
    if (!validation.valid) {
      setUploadError(validation.error);
      setIsLoading(false);
      return;
    }

    const reader = new FileReader();

    reader.onload = async (e) => {
      try {
        const svgContent = e.target.result;

        // Validar que el contenido sea SVG válido básico
        if (!svgContent.trim().startsWith('<svg') && !svgContent.includes('<svg')) {
          throw new Error('El archivo no contiene un SVG válido');
        }

        // Llamar al callback (ahora es async) y esperar el resultado
        const success = await onFileLoad?.(svgContent, file.name);

        // Si onFileLoad retorna false, significa que hubo un error en el parseo
        if (success === false) {
          setUploadError('Error al parsear el archivo SVG. Verifica que el archivo sea válido.');
        } else {
          setUploadError(null);
          // No actualizamos el texto aquí, lo hace handleFileLoad en App.jsx
        }
      } catch (error) {
        console.error('Error en TextInput.processFile:', error);
        setUploadError(`Error al procesar el archivo: ${error.message}`);
      } finally {
        setIsLoading(false);
      }
    };

    reader.onerror = () => {
      setUploadError('Error al leer el archivo. Por favor intenta nuevamente.');
      setIsLoading(false);
    };

    reader.onabort = () => {
      setUploadError('Lectura del archivo cancelada');
      setIsLoading(false);
    };

    reader.readAsText(file);
  };

  /**
   * Maneja la carga de archivos
   */
  const handleFileUpload = (event) => {
    const file = event.target.files[0];
    if (!file) return;

    processFile(file);

    // Limpiar el input para permitir cargar el mismo archivo nuevamente
    event.target.value = '';
  };

  /**
   * Abre el selector de archivos
   */
  const openFileSelector = () => {
    fileInputRef.current?.click();
  };

  /**
   * Maneja el inicio del arrastre
   */
  const handleDragEnter = (event) => {
    event.preventDefault();
    setIsDragging(true);
  };

  /**
   * Maneja la salida del arrastre
   */
  const handleDragLeave = (event) => {
    event.preventDefault();
    // Solo ocultar si realmente salimos del contenedor
    if (event.currentTarget === event.target) {
      setIsDragging(false);
    }
  };

  /**
   * Maneja el arrastre de archivos
   */
  const handleDragOver = (event) => {
    event.preventDefault();
    event.dataTransfer.dropEffect = 'copy';
    setIsDragging(true);
  };

  /**
   * Maneja la suelta de archivos
   */
  const handleDrop = (event) => {
    event.preventDefault();
    setIsDragging(false);

    const files = event.dataTransfer.files;

    if (files.length === 0) {
      setUploadError('No se detectó ningún archivo');
      return;
    }

    const file = files[0];
    processFile(file);
  };

  /**
   * Exporta el texto actual como archivo
   */
  const exportText = () => {
    if (!text.trim()) return;

    const blob = new Blob([text], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'descripcion.txt';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  return (
    <div className="w-full bg-background border-b">
      <div className="p-4">
        <div
          className="relative"
          onDragEnter={handleDragEnter}
          onDragLeave={handleDragLeave}
          onDragOver={handleDragOver}
          onDrop={handleDrop}
        >
          {/* Área de texto principal */}
          <div className="relative">
            <textarea
              value={text}
              onChange={handleTextChange}
              placeholder={placeholder}
              disabled={isLoading}
              className={`
                w-full min-h-[80px] p-4 pr-32 text-base leading-6
                bg-muted/20 border rounded-lg
                resize-none focus:outline-none focus:ring-2 focus:ring-ring
                placeholder:text-muted-foreground
                transition-all duration-200
                ${isDragging ? 'border-primary border-2 bg-primary/5' : 'border-border'}
                ${isLoading ? 'opacity-50 cursor-not-allowed' : ''}
                ${uploadError ? 'border-destructive' : ''}
              `}
            />

            {/* Botones de acción */}
            <div className="absolute top-2 right-2 flex gap-1">
              <Button
                variant="ghost"
                size="sm"
                onClick={openFileSelector}
                title={t('loadSVGFile')}
                className="h-8 w-8 p-0"
                disabled={isLoading}
              >
                <Upload size={16} className={isLoading ? 'animate-pulse' : ''} />
              </Button>

              {text.trim() && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={exportText}
                  title={t('exportText')}
                  className="h-8 w-8 p-0"
                  disabled={isLoading}
                >
                  <Download size={16} />
                </Button>
              )}
            </div>
          </div>

          {/* Input de archivo oculto */}
          <input
            ref={fileInputRef}
            type="file"
            accept=".svg,image/svg+xml"
            onChange={handleFileUpload}
            className="hidden"
            disabled={isLoading}
          />

          {/* Overlay de drag & drop */}
          {isDragging && (
            <div className="absolute inset-0 pointer-events-none z-10">
              <div className="
                w-full h-full border-2 border-dashed border-primary
                rounded-lg bg-primary/10
                flex items-center justify-center
              ">
                <div className="text-primary text-sm font-medium flex flex-col items-center gap-2">
                  <FileText size={24} />
                  <span>Suelta el archivo SVG aquí</span>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Mensajes de error */}
        {uploadError && (
          <div className="mt-2 p-3 bg-destructive/10 border border-destructive/20 rounded-md flex items-start gap-2">
            <AlertCircle size={16} className="text-destructive flex-shrink-0 mt-0.5" />
            <div className="text-sm text-destructive">{uploadError}</div>
          </div>
        )}

        {/* Schema Status Bar - Reemplaza info adicional */}
        <div className="mt-2">
          <SchemaStatusBar
            status={isLoading ? 'loading' : (schemaError ? 'error' : schemaStatus)}
            nluSchema={nluSchema}
            onSchemaChange={onSchemaChange}
            onGenerate={onSchemaGenerate}
            errorMessage={schemaError || uploadError}
            loadingMessage={isLoading ? 'Cargando archivo...' : 'Generando pictograma...'}
            characterCount={text.length}
            dragDropText={t('dragDropText')}
          />
        </div>
      </div>
    </div>
  );
};

export default TextInput;
