import React, { useState, useEffect } from 'react';
import { Copy, Download, RefreshCw, Check } from 'lucide-react';
import { Button } from '@/components/ui/button';

/**
 * Componente para mostrar y editar el código SVG
 */
export const CodeView = ({ 
  svgContent, 
  onSVGUpdate,
  selectedElement 
}) => {
  const [code, setCode] = useState('');
  const [isEditing, setIsEditing] = useState(false);
  const [copied, setCopied] = useState(false);

  // Sincronizar el código con el contenido SVG
  useEffect(() => {
    if (svgContent) {
      setCode(formatSVG(svgContent));
    }
  }, [svgContent]);

  /**
   * Formatea el código SVG para mejor legibilidad
   */
  const formatSVG = (svg) => {
    try {
      // Crear un parser DOM temporal
      const parser = new DOMParser();
      const doc = parser.parseFromString(svg, 'image/svg+xml');
      const svgElement = doc.querySelector('svg');
      
      if (!svgElement) return svg;

      // Formatear con indentación
      return formatXML(svgElement.outerHTML);
    } catch (error) {
      return svg;
    }
  };

  /**
   * Formatea XML con indentación
   */
  const formatXML = (xml) => {
    const PADDING = '  '; // 2 espacios
    const reg = /(>)(<)(\/*)/g;
    let formatted = xml.replace(reg, '$1\r\n$2$3');
    let pad = 0;
    
    return formatted.split('\r\n').map(line => {
      let indent = 0;
      if (line.match(/.+<\/\w[^>]*>$/)) {
        indent = 0;
      } else if (line.match(/^<\/\w/) && pad !== 0) {
        pad -= 1;
      } else if (line.match(/^<\w[^>]*[^\/]>.*$/)) {
        indent = 1;
      } else {
        indent = 0;
      }
      
      const padding = PADDING.repeat(pad);
      pad += indent;
      
      return padding + line;
    }).join('\n');
  };

  /**
   * Maneja el cambio en el código
   */
  const handleCodeChange = (event) => {
    setCode(event.target.value);
    setIsEditing(true);
  };

  /**
   * Aplica los cambios del código al SVG
   */
  const applyChanges = () => {
    try {
      // Validar que el SVG sea válido
      const parser = new DOMParser();
      const doc = parser.parseFromString(code, 'image/svg+xml');
      const parseError = doc.querySelector('parsererror');
      
      if (parseError) {
        alert('Error en el código SVG. Por favor verifica la sintaxis.');
        return;
      }

      onSVGUpdate?.(code);
      setIsEditing(false);
    } catch (error) {
      alert('Error al procesar el código SVG: ' + error.message);
    }
  };

  /**
   * Copia el código al clipboard
   */
  const copyCode = async () => {
    try {
      await navigator.clipboard.writeText(code);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (error) {
      console.error('Error al copiar:', error);
    }
  };

  /**
   * Descarga el código como archivo SVG
   */
  const downloadCode = () => {
    const blob = new Blob([code], { type: 'image/svg+xml' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'pictogram_edited.svg';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  /**
   * Resalta la línea del elemento seleccionado
   */
  const highlightSelectedElement = () => {
    if (!selectedElement) return code;
    
    const lines = code.split('\n');
    const elementPattern = new RegExp(`id="${selectedElement.id}"`, 'g');
    
    return lines.map(line => {
      if (elementPattern.test(line)) {
        return `→ ${line}`;
      }
      return `  ${line}`;
    }).join('\n');
  };

  return (
    <div className="h-full flex flex-col bg-background">
      {/* Header */}
      <div className="flex items-center justify-between p-3 border-b bg-muted/20">
        <div className="flex items-center gap-2">
          <h3 className="font-semibold text-sm">Código SVG</h3>
          {isEditing && (
            <span className="text-xs text-orange-500 bg-orange-100 px-2 py-1 rounded">
              Modificado
            </span>
          )}
        </div>
        
        <div className="flex items-center gap-1">
          <Button
            variant="ghost"
            size="sm"
            onClick={copyCode}
            title="Copiar código"
          >
            {copied ? <Check size={14} /> : <Copy size={14} />}
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={downloadCode}
            title="Descargar SVG"
          >
            <Download size={14} />
          </Button>
          {isEditing && (
            <Button
              variant="default"
              size="sm"
              onClick={applyChanges}
              title="Aplicar cambios"
            >
              <RefreshCw size={14} />
            </Button>
          )}
        </div>
      </div>

      {/* Editor de código */}
      <div className="flex-1 relative">
        <textarea
          value={selectedElement ? highlightSelectedElement() : code}
          onChange={handleCodeChange}
          className="
            w-full h-full p-4 font-mono text-sm
            bg-muted/10 border-0 resize-none
            focus:outline-none focus:ring-2 focus:ring-ring
            leading-relaxed
          "
          placeholder="El código SVG aparecerá aquí..."
          spellCheck={false}
        />
        
        {/* Indicador de líneas */}
        <div className="absolute left-0 top-0 bottom-0 w-12 bg-muted/30 border-r pointer-events-none">
          <div className="p-4 font-mono text-xs text-muted-foreground leading-relaxed">
            {code.split('\n').map((_, index) => (
              <div key={index} className="text-right">
                {index + 1}
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Footer con información */}
      <div className="p-2 border-t bg-muted/20 text-xs text-muted-foreground">
        <div className="flex items-center justify-between">
          <div>
            {code.split('\n').length} líneas • {code.length} caracteres
          </div>
          {selectedElement && (
            <div>
              Elemento seleccionado: {selectedElement.id}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default CodeView;
