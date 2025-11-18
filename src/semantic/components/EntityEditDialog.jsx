import React, { useState, useEffect } from 'react';
import { X, Sparkles, Type } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
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
  const [regeneratePrompt, setRegeneratePrompt] = useState('');
  const [isRegenerating, setIsRegenerating] = useState(false);

  // Sincronizar nombre cuando cambia la entidad
  useEffect(() => {
    if (entity) {
      setLocalName(entity.id || entity.tagName || 'unnamed');
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
      maxWidth="600px"
    >
      <div className="space-y-6 p-4">
        {/* Preview de la entidad */}
        <section className="border rounded-lg p-4 bg-muted/10">
          <h3 className="text-sm font-semibold mb-2 flex items-center gap-2">
            <Type size={16} />
            Entity Preview
          </h3>
          <div className="bg-background border rounded p-4 flex items-center justify-center min-h-[120px]">
            {/* TODO: Renderizar preview del elemento SVG aislado */}
            <div className="text-muted-foreground text-sm">
              <code className="text-xs">
                &lt;{entity.tagName} id="{entity.id}" /&gt;
              </code>
            </div>
          </div>
          <p className="text-xs text-muted-foreground mt-2">
            Tag: <strong>{entity.tagName}</strong> |
            Children: <strong>{entity.children?.length || 0}</strong>
          </p>
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
