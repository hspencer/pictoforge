import React, { useState, useRef } from 'react';
import { Upload, FileText, Download } from 'lucide-react';
import { Button } from '@/components/ui/button';

/**
 * Componente para la entrada de texto y carga de archivos
 */
export const TextInput = ({ 
  onTextChange, 
  onFileLoad, 
  currentText = '',
  placeholder = "Ingresa una descripción o carga un archivo SVG..." 
}) => {
  const [text, setText] = useState(currentText);
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
   * Maneja la carga de archivos
   */
  const handleFileUpload = (event) => {
    const file = event.target.files[0];
    if (!file) return;

    if (file.type === 'image/svg+xml' || file.name.endsWith('.svg')) {
      const reader = new FileReader();
      reader.onload = (e) => {
        const svgContent = e.target.result;
        onFileLoad?.(svgContent, file.name);
      };
      reader.readAsText(file);
    } else {
      alert('Por favor selecciona un archivo SVG válido');
    }

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
   * Maneja el arrastre de archivos
   */
  const handleDragOver = (event) => {
    event.preventDefault();
    event.dataTransfer.dropEffect = 'copy';
  };

  /**
   * Maneja la suelta de archivos
   */
  const handleDrop = (event) => {
    event.preventDefault();
    const files = event.dataTransfer.files;
    
    if (files.length > 0) {
      const file = files[0];
      if (file.type === 'image/svg+xml' || file.name.endsWith('.svg')) {
        const reader = new FileReader();
        reader.onload = (e) => {
          const svgContent = e.target.result;
          onFileLoad?.(svgContent, file.name);
        };
        reader.readAsText(file);
      } else {
        alert('Por favor arrastra un archivo SVG válido');
      }
    }
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
          onDragOver={handleDragOver}
          onDrop={handleDrop}
        >
          {/* Área de texto principal */}
          <div className="relative">
            <textarea
              value={text}
              onChange={handleTextChange}
              placeholder={placeholder}
              className="
                w-full min-h-[80px] p-4 pr-32 
                bg-muted/20 border border-border rounded-lg
                resize-none focus:outline-none focus:ring-2 focus:ring-ring
                placeholder:text-muted-foreground
                transition-all duration-200
              "
              style={{ fontSize: '16px', lineHeight: '1.5' }}
            />

            {/* Botones de acción */}
            <div className="absolute top-2 right-2 flex gap-1">
              <Button
                variant="ghost"
                size="sm"
                onClick={openFileSelector}
                title="Cargar archivo SVG"
                className="h-8 w-8 p-0"
              >
                <Upload size={16} />
              </Button>
              
              {text.trim() && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={exportText}
                  title="Exportar texto"
                  className="h-8 w-8 p-0"
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
          />

          {/* Indicador de drag & drop */}
          <div className="absolute inset-0 pointer-events-none">
            <div className="
              w-full h-full border-2 border-dashed border-transparent
              rounded-lg transition-colors duration-200
              flex items-center justify-center
            ">
              <div className="text-muted-foreground/50 text-sm hidden">
                <FileText size={20} className="mx-auto mb-1" />
                Arrastra un archivo SVG aquí
              </div>
            </div>
          </div>
        </div>

        {/* Información adicional */}
        <div className="flex items-center justify-between mt-2 text-xs text-muted-foreground">
          <div className="flex items-center gap-4">
            <span>Soporta archivos .svg</span>
            <span>Drag & drop habilitado</span>
          </div>
          <div className="flex items-center gap-2">
            {text.length > 0 && (
              <span>{text.length} caracteres</span>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default TextInput;
