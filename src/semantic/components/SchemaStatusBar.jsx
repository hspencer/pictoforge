import React, { useState, useEffect } from 'react';
import { ChevronDown, ChevronUp, AlertCircle, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useI18n } from '@/hooks/useI18n.jsx';

/**
 * SchemaStatusBar - Barra de estado multipropósito debajo del TextInput
 *
 * Estados:
 * - idle: Info básica (drag/drop, caracteres)
 * - loading: Progress bar mientras genera pictograma
 * - ready: Schema cargado, muestra en textarea expansible
 * - editing: Usuario modificó schema, botón Generate aparece
 * - error: Muestra mensajes de error/validación
 */
export const SchemaStatusBar = ({
  status = 'idle', // 'idle' | 'loading' | 'ready' | 'editing' | 'error'
  nluSchema = null,
  onSchemaChange,
  onGenerate,
  errorMessage = null,
  loadingMessage = 'Generating pictogram...',
  characterCount = 0,
  dragDropText = 'Supports .svg files | Drag / drop enabled'
}) => {
  const { t } = useI18n();
  const [isExpanded, setIsExpanded] = useState(false);
  const [editedSchema, setEditedSchema] = useState('');
  const [hasChanges, setHasChanges] = useState(false);

  // Sincronizar editedSchema cuando cambia nluSchema
  useEffect(() => {
    if (nluSchema) {
      const formatted = JSON.stringify(nluSchema, null, 2);
      setEditedSchema(formatted);
      setHasChanges(false);
    }
  }, [nluSchema]);

  const handleSchemaEdit = (e) => {
    const newValue = e.target.value;
    setEditedSchema(newValue);

    // Comparar con schema original
    const originalFormatted = JSON.stringify(nluSchema, null, 2);
    setHasChanges(newValue !== originalFormatted);

    // Callback si existe
    onSchemaChange?.(newValue);
  };

  const handleGenerate = () => {
    try {
      const parsed = JSON.parse(editedSchema);
      onGenerate?.(parsed);
      setHasChanges(false);
    } catch (error) {
      console.error('Invalid JSON in schema:', error);
      // Mantener hasChanges=true para que el usuario vea que hay error
    }
  };

  const toggleExpand = () => {
    setIsExpanded(!isExpanded);
  };

  // Estado: idle - Info básica
  if (status === 'idle') {
    return (
      <div className="flex items-center justify-between text-xs text-muted-foreground">
        <div className="flex items-center gap-4">
          <span>{dragDropText}</span>
        </div>
        <div className="flex items-center gap-2">
          {characterCount > 0 && (
            <span>{characterCount} {t('charactersCount')}</span>
          )}
        </div>
      </div>
    );
  }

  // Estado: loading - Progress bar
  if (status === 'loading') {
    return (
      <div className="space-y-2">
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <Loader2 size={14} className="animate-spin" />
          <span>{loadingMessage}</span>
        </div>
        <div className="w-full h-2 bg-muted rounded-full overflow-hidden">
          <div className="h-full bg-primary animate-pulse-progress"
               style={{ animation: 'pulse-progress 2s ease-in-out infinite' }} />
        </div>
      </div>
    );
  }

  // Estado: error - Mensaje de error
  if (status === 'error') {
    return (
      <div className="p-3 bg-destructive/10 border border-destructive/20 rounded-md flex items-start gap-2">
        <AlertCircle size={16} className="text-destructive flex-shrink-0 mt-0.5" />
        <div className="text-sm text-destructive flex-1">{errorMessage}</div>
      </div>
    );
  }

  // Estados: ready / editing - Schema viewer/editor
  const isEditing = status === 'editing' || hasChanges;

  return (
    <div className={`
      border rounded-lg transition-all duration-200
      ${isEditing
        ? 'bg-amber-50 dark:bg-amber-950/20 border-amber-300 dark:border-amber-700'
        : 'bg-muted/20 border-border'
      }
    `}>
      {/* Header colapsable */}
      <button
        onClick={toggleExpand}
        className="w-full px-3 py-2 flex items-center justify-between text-sm hover:bg-muted/20 transition-colors"
      >
        <div className="flex items-center gap-2">
          <span className="font-medium">
            {isEditing ? t('nluSchemaModified') : t('schemaStatusBar')}
          </span>
          {nluSchema?.utterance && (
            <span className="text-muted-foreground text-xs">
              "{nluSchema.utterance}"
            </span>
          )}
        </div>
        <div className="flex items-center gap-2">
          {isEditing && (
            <Button
              size="sm"
              variant="default"
              onClick={(e) => {
                e.stopPropagation();
                handleGenerate();
              }}
              className="h-7 px-3 text-xs"
            >
              {t('generate')}
            </Button>
          )}
          {isExpanded ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
        </div>
      </button>

      {/* Contenido expansible */}
      {isExpanded && (
        <div className="px-3 pb-3 space-y-2">
          <textarea
            value={editedSchema}
            onChange={handleSchemaEdit}
            className={`
              w-full min-h-[200px] p-3 text-xs font-mono
              bg-background border rounded
              resize-vertical focus:outline-none focus:ring-2 focus:ring-ring
              transition-all duration-200
              ${isEditing
                ? 'border-amber-400 dark:border-amber-600'
                : 'border-border'
              }
            `}
            placeholder={t('nluSchemaPlaceholder')}
            spellCheck={false}
          />

          {isEditing && (
            <div className="flex items-start gap-2 text-xs text-amber-700 dark:text-amber-400">
              <AlertCircle size={14} className="flex-shrink-0 mt-0.5" />
              <span>
                {t('schemaModifiedWarning')}
              </span>
            </div>
          )}

          {nluSchema && (
            <div className="flex items-center gap-4 text-xs text-muted-foreground">
              <span>
                {t('lang')}: <strong>{nluSchema.lang || 'unknown'}</strong>
              </span>
              {nluSchema.frames && (
                <span>
                  {t('frames')}: <strong>{nluSchema.frames.length}</strong>
                </span>
              )}
              {nluSchema.visual_guidelines && (
                <span>
                  {t('focus')}: <strong>{nluSchema.visual_guidelines.focus_actor || 'none'}</strong>
                </span>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default SchemaStatusBar;
