import React, { useState, useEffect, useMemo } from 'react';
import { X, Sparkles, Type, Image, Code } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import DraggableModal from '@/components/DraggableModal';

/**
 * EntityEditDialog - Popup para editar entidades individuales
 *
 * Permite:
 * - Ver la entidad de forma aislada
 * - Cambiar su nombre/ID
 * - Escribir un prompt para regenerar el elemento
 * - Regenerar con IA (placeholder para Fase 2.4)
 */
export const EntityEditDialog = ({
  isOpen,
  onClose,
  entity,
  onUpdateEntity,
  onRegenerateEntity
}) => {
  const [localName, setLocalName] = useState('');
  const [localClass, setLocalClass] = useState('');
  const [regeneratePrompt, setRegeneratePrompt] = useState('');
  const [isRegenerating, setIsRegenerating] = useState(false);

  /**
   * Extrae las clases CSS disponibles del SVG padre
   */
  const availableClasses = useMemo(() => {
    if (!entity?.element) return [];

    const svgRoot = entity.element.closest('svg');
    const styleElement = svgRoot?.querySelector('style');

    if (!styleElement) return [];

    const styleContent = styleElement.textContent;
    // Extraer nombres de clases del CSS (buscar .nombre-clase)
    const classMatches = styleContent.match(/\.([a-zA-Z0-9_-]+)\s*\{/g);

    if (!classMatches) return [];

    // Limpiar y deduplicar
    const classes = classMatches
      .map(match => match.replace(/^\./, '').replace(/\s*\{$/, ''))
      .filter((value, index, self) => self.indexOf(value) === index);

    return classes;
  }, [entity]);

  /**
   * Genera el preview SVG del elemento con estilos embebidos
   */
  const svgPreview = useMemo(() => {
    if (!entity?.element) {
      console.warn('⚠️ Entity no tiene elemento DOM asociado');
      return null;
    }

    try {
      // Obtener el elemento DOM real
      const domElement = entity.element;

      // Obtener el bounding box del elemento
      const bbox = domElement.getBBox();

      // Si el bbox es inválido (width o height = 0), usar valores por defecto
      if (bbox.width === 0 || bbox.height === 0) {
        console.warn('⚠️ BBox tiene dimensiones 0, usando viewBox por defecto');
        return {
          viewBox: '0 0 100 100',
          innerHTML: domElement.outerHTML,
          styles: '',
          width: 100,
          height: 100
        };
      }

      // Agregar padding al viewBox (20% en cada lado para mejor visualización)
      const padding = Math.max(bbox.width, bbox.height) * 0.2;
      const viewBoxX = bbox.x - padding;
      const viewBoxY = bbox.y - padding;
      const viewBoxWidth = bbox.width + padding * 2;
      const viewBoxHeight = bbox.height + padding * 2;

      // Clonar el elemento para no modificar el original
      const clonedElement = domElement.cloneNode(true);

      // Obtener el HTML del elemento
      const elementHTML = clonedElement.outerHTML;

      // Obtener estilos del SVG padre (si existen)
      const svgRoot = domElement.closest('svg');
      const styleElement = svgRoot?.querySelector('style');
      const styles = styleElement ? styleElement.textContent : '';

      console.log('📐 Entity Preview:', {
        id: entity.id,
        bbox: `x:${bbox.x.toFixed(1)}, y:${bbox.y.toFixed(1)}, w:${bbox.width.toFixed(1)}, h:${bbox.height.toFixed(1)}`,
        viewBox: `${viewBoxX.toFixed(1)} ${viewBoxY.toFixed(1)} ${viewBoxWidth.toFixed(1)} ${viewBoxHeight.toFixed(1)}`,
        hasStyles: !!styles
      });

      return {
        viewBox: `${viewBoxX} ${viewBoxY} ${viewBoxWidth} ${viewBoxHeight}`,
        innerHTML: elementHTML,
        styles: styles,
        width: viewBoxWidth,
        height: viewBoxHeight
      };
    } catch (error) {
      console.error('❌ Error generando preview SVG:', error);
      return null;
    }
  }, [entity]);

  // Sincronizar nombre y clase cuando cambia la entidad
  useEffect(() => {
    if (entity) {
      setLocalName(entity.id || entity.tagName || 'unnamed');
      setLocalClass(entity.element?.getAttribute('class') || 'inherit');
      setRegeneratePrompt('');
    }
  }, [entity]);

  if (!isOpen || !entity) return null;

  const handleSaveName = () => {
    onUpdateEntity?.({
      ...entity,
      id: localName
    });
  };

  const handleClassChange = (newClass) => {
    setLocalClass(newClass);

    // Aplicar clase al elemento DOM inmediatamente
    if (entity.element) {
      if (newClass === 'inherit') {
        entity.element.removeAttribute('class');
      } else {
        entity.element.setAttribute('class', newClass);
      }
    }

    // Notificar actualización
    onUpdateEntity?.({
      ...entity,
      className: newClass === 'inherit' ? null : newClass
    });
  };

  const handleRegenerate = async () => {
    if (!regeneratePrompt.trim()) return;

    setIsRegenerating(true);
    try {
      await onRegenerateEntity?.({
        entity,
        prompt: regeneratePrompt
      });
      setRegeneratePrompt('');
    } catch (error) {
      console.error('Error regenerating entity:', error);
    } finally {
      setIsRegenerating(false);
    }
  };

  return (
    <DraggableModal
      isOpen={isOpen}
      onClose={onClose}
      title={`Edit: ${entity.tagName} (${entity.id})`}
      width={600}
      maxHeight={900}
      storageKey="entity-editor"
    >
      <div className="space-y-6 p-4">
        {/* Preview de la entidad con pestañas */}
        <section className="border rounded-lg p-4 bg-muted/10">
          <Tabs defaultValue="image" className="w-full">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="image" className="flex items-center gap-2">
                <Image size={16} />
                Image
              </TabsTrigger>
              <TabsTrigger value="code" className="flex items-center gap-2">
                <Code size={16} />
                Code
              </TabsTrigger>
            </TabsList>

            <TabsContent value="image" className="mt-2">
              <div
                className="border rounded p-4 flex items-center justify-center min-h-[400px]"
                style={{
                  backgroundColor: 'var(--canvas-bg)'
                }}
              >
            {svgPreview ? (
              <div
                className="flex items-center justify-center"
                dangerouslySetInnerHTML={{
                  __html: `
                    <svg
                      viewBox="${svgPreview.viewBox}"
                      xmlns="http://www.w3.org/2000/svg"
                      width="85%"
                      height="auto"
                      style="display: block;"
                    >
                      ${svgPreview.styles ? `<defs><style>${svgPreview.styles}</style></defs>` : ''}
                      ${svgPreview.innerHTML}
                    </svg>
                  `
                }}
              />
            ) : (
              <div className="text-muted-foreground text-sm text-center">
                <code className="text-xs block mb-1">
                  &lt;{entity.tagName} id="{entity.id}" /&gt;
                </code>
                <p className="text-xs">
                  {entity.element ? 'Error al generar preview' : 'No hay elemento DOM disponible'}
                </p>
              </div>
            )}
              </div>
              <p className="text-xs text-muted-foreground mt-2">
                Tag: <strong>{entity.tagName}</strong> |
                Children: <strong>{entity.children?.length || 0}</strong>
                {svgPreview && (
                  <>
                    {' | '}Size: <strong>{Math.round(svgPreview.width)}×{Math.round(svgPreview.height)}</strong>
                  </>
                )}
              </p>
            </TabsContent>

            <TabsContent value="code" className="mt-2">
              <div className="border rounded p-4 bg-muted/5">
                <pre className="text-xs font-mono overflow-auto max-h-[400px] whitespace-pre-wrap">
                  {(() => {
                    if (!entity.element) return '<No element available>';

                    // Obtener solo el elemento específico, formateado
                    const element = entity.element;
                    const tagName = element.tagName;
                    const attributes = Array.from(element.attributes)
                      .map(attr => `${attr.name}="${attr.value}"`)
                      .join(' ');

                    // Si el elemento tiene contenido de texto, incluirlo
                    const hasChildren = element.children.length > 0;
                    const textContent = !hasChildren && element.textContent ? element.textContent : '';

                    if (hasChildren) {
                      return `<${tagName} ${attributes}>\n  <!-- ${element.children.length} child elements -->\n</${tagName}>`;
                    } else if (textContent) {
                      return `<${tagName} ${attributes}>${textContent}</${tagName}>`;
                    } else {
                      return `<${tagName} ${attributes} />`;
                    }
                  })()}
                </pre>
              </div>
              <p className="text-xs text-muted-foreground mt-2">
                SVG code for this specific element only
              </p>
            </TabsContent>
          </Tabs>
        </section>

        {/* Cambiar nombre/ID */}
        <section className="space-y-2">
          <Label htmlFor="entityName">Element ID / Name</Label>
          <div className="flex gap-2">
            <Input
              id="entityName"
              value={localName}
              onChange={(e) => setLocalName(e.target.value)}
              placeholder="Enter new name..."
              className="flex-1"
            />
            <Button
              variant="outline"
              onClick={handleSaveName}
              disabled={localName === entity.id}
            >
              Update
            </Button>
          </div>
          <p className="text-xs text-muted-foreground">
            Change the ID of this element in the SVG.
          </p>
        </section>

        {/* Selector de clase CSS */}
        <section className="space-y-2">
          <Label htmlFor="entityClass">CSS Class</Label>
          <Select value={localClass} onValueChange={handleClassChange}>
            <SelectTrigger id="entityClass">
              <SelectValue placeholder="Select a class..." />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="inherit">inherit (no class)</SelectItem>
              {availableClasses.map((className) => (
                <SelectItem key={className} value={className}>
                  {className}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <p className="text-xs text-muted-foreground">
            Apply a CSS class to this element. Classes are defined in the SVG &lt;style&gt; tag.
          </p>
        </section>

        {/* Regenerar con prompt */}
        <section className="space-y-2">
          <Label htmlFor="regeneratePrompt" className="flex items-center gap-2">
            <Sparkles size={16} className="text-primary" />
            Regenerate with AI (Prompt)
          </Label>
          <Textarea
            id="regeneratePrompt"
            value={regeneratePrompt}
            onChange={(e) => setRegeneratePrompt(e.target.value)}
            placeholder="Describe how you want to regenerate this element...&#10;&#10;Example: 'Make this figure more dynamic, with arms raised'"
            rows={4}
            className="font-mono text-sm"
          />
          <div className="flex items-center justify-between">
            <p className="text-xs text-muted-foreground">
              This will send the prompt to PictoNet API to regenerate only this element.
            </p>
            <Button
              onClick={handleRegenerate}
              disabled={!regeneratePrompt.trim() || isRegenerating}
              className="gap-2"
            >
              {isRegenerating ? (
                <>
                  <span className="animate-spin">⟳</span>
                  Generating...
                </>
              ) : (
                <>
                  <Sparkles size={16} />
                  Regenerate
                </>
              )}
            </Button>
          </div>
        </section>

        {/* Info adicional */}
        <section className="border-t pt-4">
          <p className="text-xs text-muted-foreground">
            <strong>Note:</strong> Regeneration with AI requires PictoNet API integration (Phase 2.4).
            Currently, this is a placeholder interface.
          </p>
        </section>
      </div>
    </DraggableModal>
  );
};

export default EntityEditDialog;
