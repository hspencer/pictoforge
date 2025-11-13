import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Info, Save } from 'lucide-react';

/**
 * SVGMetadataEditor Component
 *
 * Componente para editar metadatos de accesibilidad del SVG:
 * - <title>: Título descriptivo del SVG
 * - <desc>: Descripción detallada del contenido
 * - lang: Atributo de idioma
 * - role: Rol ARIA
 *
 * Sigue estándares WAI-ARIA para mejorar la accesibilidad
 */
export const SVGMetadataEditor = ({ svgContent, onUpdate }) => {
  const [metadata, setMetadata] = useState({
    title: '',
    desc: '',
    lang: 'en',
    role: 'img',
  });

  const [hasChanges, setHasChanges] = useState(false);

  /**
   * Extraer metadatos existentes del SVG
   */
  useEffect(() => {
    if (!svgContent) return;

    try {
      const parser = new DOMParser();
      const doc = parser.parseFromString(svgContent, 'image/svg+xml');
      const svg = doc.documentElement;

      const title = svg.querySelector('title')?.textContent || '';
      const desc = svg.querySelector('desc')?.textContent || '';
      const lang = svg.getAttribute('lang') || 'en';
      const role = svg.getAttribute('role') || 'img';

      setMetadata({ title, desc, lang, role });
      setHasChanges(false);
    } catch (error) {
      console.error('❌ Error al parsear SVG:', error);
    }
  }, [svgContent]);

  /**
   * Actualizar metadatos en el SVG
   */
  const handleSave = () => {
    if (!svgContent || !onUpdate) return;

    try {
      const parser = new DOMParser();
      const doc = parser.parseFromString(svgContent, 'image/svg+xml');
      const svg = doc.documentElement;

      // Actualizar o crear <title>
      let titleElement = svg.querySelector('title');
      if (metadata.title) {
        if (!titleElement) {
          titleElement = doc.createElementNS('http://www.w3.org/2000/svg', 'title');
          svg.insertBefore(titleElement, svg.firstChild);
        }
        titleElement.textContent = metadata.title;

        // Añadir ID y aria-labelledby
        const titleId = titleElement.getAttribute('id') || `svg-title-${Date.now()}`;
        titleElement.setAttribute('id', titleId);
        svg.setAttribute('aria-labelledby', titleId);
      } else if (titleElement) {
        // Remover si está vacío
        titleElement.remove();
        svg.removeAttribute('aria-labelledby');
      }

      // Actualizar o crear <desc>
      let descElement = svg.querySelector('desc');
      if (metadata.desc) {
        if (!descElement) {
          descElement = doc.createElementNS('http://www.w3.org/2000/svg', 'desc');
          const titleElement = svg.querySelector('title');
          if (titleElement) {
            titleElement.after(descElement);
          } else {
            svg.insertBefore(descElement, svg.firstChild);
          }
        }
        descElement.textContent = metadata.desc;

        // Añadir ID y aria-describedby
        const descId = descElement.getAttribute('id') || `svg-desc-${Date.now()}`;
        descElement.setAttribute('id', descId);

        // Combinar con aria-labelledby si existe
        const labelledBy = svg.getAttribute('aria-labelledby');
        if (labelledBy) {
          svg.setAttribute('aria-labelledby', `${labelledBy} ${descId}`);
        } else {
          svg.setAttribute('aria-describedby', descId);
        }
      } else if (descElement) {
        // Remover si está vacío
        descElement.remove();
        svg.removeAttribute('aria-describedby');
      }

      // Actualizar atributos
      svg.setAttribute('lang', metadata.lang);
      svg.setAttribute('role', metadata.role);

      // Serializar y notificar
      const serializer = new XMLSerializer();
      const newSvgContent = serializer.serializeToString(svg);

      onUpdate(newSvgContent);
      setHasChanges(false);

      console.log('✅ Metadatos de accesibilidad actualizados:', metadata);
    } catch (error) {
      console.error('❌ Error al actualizar metadatos:', error);
    }
  };

  /**
   * Manejar cambios en inputs
   */
  const handleChange = (field, value) => {
    setMetadata((prev) => ({ ...prev, [field]: value }));
    setHasChanges(true);
  };

  return (
    <div className="p-4 bg-muted/20 rounded-lg border space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Info size={16} className="text-primary" />
          <h3 className="text-sm font-semibold">Metadatos de Accesibilidad</h3>
        </div>
        {hasChanges && (
          <Button
            variant="default"
            size="sm"
            onClick={handleSave}
            className="h-7 gap-1"
          >
            <Save size={14} />
            Guardar
          </Button>
        )}
      </div>

      {/* Info */}
      <div className="text-xs text-muted-foreground bg-muted/30 p-2 rounded">
        Los metadatos mejoran la accesibilidad del SVG para lectores de pantalla
        y herramientas de asistencia siguiendo estándares WAI-ARIA.
      </div>

      {/* Title */}
      <div className="space-y-2">
        <Label htmlFor="svg-title" className="text-xs">
          Título (title)
        </Label>
        <Input
          id="svg-title"
          placeholder="Ej: Icono de usuario"
          value={metadata.title}
          onChange={(e) => handleChange('title', e.target.value)}
          className="h-8 text-xs"
        />
        <p className="text-xs text-muted-foreground">
          Título descriptivo corto del SVG
        </p>
      </div>

      {/* Description */}
      <div className="space-y-2">
        <Label htmlFor="svg-desc" className="text-xs">
          Descripción (desc)
        </Label>
        <Textarea
          id="svg-desc"
          placeholder="Ej: Ilustración de una persona haciendo la cama con sábanas azules"
          value={metadata.desc}
          onChange={(e) => handleChange('desc', e.target.value)}
          className="min-h-[60px] text-xs resize-none"
        />
        <p className="text-xs text-muted-foreground">
          Descripción detallada del contenido visual
        </p>
      </div>

      {/* Language */}
      <div className="space-y-2">
        <Label htmlFor="svg-lang" className="text-xs">
          Idioma (lang)
        </Label>
        <Input
          id="svg-lang"
          placeholder="en, es, fr..."
          value={metadata.lang}
          onChange={(e) => handleChange('lang', e.target.value)}
          className="h-8 text-xs"
          maxLength={5}
        />
        <p className="text-xs text-muted-foreground">
          Código de idioma ISO 639-1 (ej: en, es, fr)
        </p>
      </div>

      {/* Role */}
      <div className="space-y-2">
        <Label htmlFor="svg-role" className="text-xs">
          Rol ARIA (role)
        </Label>
        <select
          id="svg-role"
          value={metadata.role}
          onChange={(e) => handleChange('role', e.target.value)}
          className="w-full h-8 text-xs border rounded-md px-2 bg-background"
        >
          <option value="img">img (imagen)</option>
          <option value="presentation">presentation (decorativo)</option>
          <option value="graphics-document">graphics-document</option>
          <option value="graphics-symbol">graphics-symbol</option>
        </select>
        <p className="text-xs text-muted-foreground">
          Define cómo los lectores de pantalla interpretan el SVG
        </p>
      </div>

      {/* Estándares WAI-ARIA */}
      <div className="space-y-2">
        <div className="text-xs font-semibold text-muted-foreground">
          Cumplimiento WAI-ARIA
        </div>
        <div className="space-y-1 text-xs">
          <div className="flex items-center gap-2">
            <span className={metadata.title ? 'text-green-600' : 'text-yellow-600'}>
              {metadata.title ? '✓' : '⚠'}
            </span>
            <span>
              {metadata.title
                ? 'Título definido (aria-labelledby)'
                : 'Sin título (recomendado)'}
            </span>
          </div>
          <div className="flex items-center gap-2">
            <span className={metadata.desc ? 'text-green-600' : 'text-gray-500'}>
              {metadata.desc ? '✓' : '○'}
            </span>
            <span>
              {metadata.desc
                ? 'Descripción definida (aria-describedby)'
                : 'Sin descripción (opcional)'}
            </span>
          </div>
          <div className="flex items-center gap-2">
            <span className={metadata.lang ? 'text-green-600' : 'text-yellow-600'}>
              {metadata.lang ? '✓' : '⚠'}
            </span>
            <span>
              {metadata.lang ? `Idioma: ${metadata.lang}` : 'Sin idioma definido'}
            </span>
          </div>
          <div className="flex items-center gap-2">
            <span className={metadata.role ? 'text-green-600' : 'text-yellow-600'}>
              {metadata.role ? '✓' : '⚠'}
            </span>
            <span>
              {metadata.role ? `Rol: ${metadata.role}` : 'Sin rol definido'}
            </span>
          </div>
        </div>
      </div>

      {/* Ejemplo de output */}
      {(metadata.title || metadata.desc) && (
        <div className="space-y-2">
          <div className="text-xs font-semibold text-muted-foreground">
            Código generado
          </div>
          <div className="p-2 bg-background rounded border text-xs font-mono overflow-x-auto">
            <pre className="whitespace-pre-wrap">
              {`<svg role="${metadata.role}" lang="${metadata.lang}"${
                metadata.title ? ` aria-labelledby="svg-title-..."` : ''
              }${metadata.desc ? ` aria-describedby="svg-desc-..."` : ''}>\n`}
              {metadata.title && `  <title id="svg-title-...">${metadata.title}</title>\n`}
              {metadata.desc && `  <desc id="svg-desc-...">${metadata.desc}</desc>\n`}
              {'  <!-- contenido SVG -->\n</svg>'}
            </pre>
          </div>
        </div>
      )}
    </div>
  );
};

export default SVGMetadataEditor;
