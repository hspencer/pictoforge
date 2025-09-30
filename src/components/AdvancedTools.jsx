import React, { useState } from 'react';
import { 
  Save, 
  Undo, 
  Redo, 
  Copy, 
  Trash2, 
  Plus,
  Settings,
  Code,
  Eye,
  EyeOff
} from 'lucide-react';
import { Button } from '@/components/ui/button';

/**
 * Componente de herramientas avanzadas para el editor
 */
export const AdvancedTools = ({ 
  svgData,
  selectedElement,
  onSave,
  onUndo,
  onRedo,
  onDuplicate,
  onDelete,
  onToggleCodeView,
  showCodeView = false
}) => {
  const [history, setHistory] = useState([]);
  const [historyIndex, setHistoryIndex] = useState(-1);

  /**
   * Guarda el estado actual en el historial
   */
  const saveToHistory = (action, data) => {
    const newEntry = {
      timestamp: Date.now(),
      action: action,
      data: data
    };

    const newHistory = history.slice(0, historyIndex + 1);
    newHistory.push(newEntry);
    
    setHistory(newHistory);
    setHistoryIndex(newHistory.length - 1);
  };

  /**
   * Duplica el elemento seleccionado
   */
  const handleDuplicate = () => {
    if (!selectedElement) return;
    
    const duplicatedElement = {
      ...selectedElement,
      id: `${selectedElement.id}_copy_${Date.now()}`
    };
    
    onDuplicate?.(duplicatedElement);
    saveToHistory('duplicate', duplicatedElement);
  };

  /**
   * Elimina el elemento seleccionado
   */
  const handleDelete = () => {
    if (!selectedElement) return;
    
    if (confirm(`¿Estás seguro de que quieres eliminar "${selectedElement.id}"?`)) {
      onDelete?.(selectedElement.id);
      saveToHistory('delete', selectedElement);
    }
  };

  /**
   * Copia el elemento seleccionado al clipboard
   */
  const handleCopy = async () => {
    if (!selectedElement) return;
    
    try {
      const elementData = JSON.stringify(selectedElement, null, 2);
      await navigator.clipboard.writeText(elementData);
      
      // Mostrar feedback visual (se podría implementar con toast)
      console.log('Elemento copiado al clipboard');
    } catch (error) {
      console.error('Error al copiar:', error);
    }
  };

  const canUndo = historyIndex > 0;
  const canRedo = historyIndex < history.length - 1;

  return (
    <div className="flex items-center gap-1 p-2 bg-muted/20 border-b">
      {/* Grupo de archivo */}
      <div className="flex items-center gap-1 pr-2 border-r">
        <Button
          variant="ghost"
          size="sm"
          onClick={onSave}
          title="Guardar SVG"
          disabled={!svgData}
        >
          <Save size={16} />
        </Button>
      </div>

      {/* Grupo de historial */}
      <div className="flex items-center gap-1 pr-2 border-r">
        <Button
          variant="ghost"
          size="sm"
          onClick={onUndo}
          title="Deshacer"
          disabled={!canUndo}
        >
          <Undo size={16} />
        </Button>
        <Button
          variant="ghost"
          size="sm"
          onClick={onRedo}
          title="Rehacer"
          disabled={!canRedo}
        >
          <Redo size={16} />
        </Button>
      </div>

      {/* Grupo de edición */}
      <div className="flex items-center gap-1 pr-2 border-r">
        <Button
          variant="ghost"
          size="sm"
          onClick={handleCopy}
          title="Copiar elemento"
          disabled={!selectedElement}
        >
          <Copy size={16} />
        </Button>
        <Button
          variant="ghost"
          size="sm"
          onClick={handleDuplicate}
          title="Duplicar elemento"
          disabled={!selectedElement}
        >
          <Plus size={16} />
        </Button>
        <Button
          variant="ghost"
          size="sm"
          onClick={handleDelete}
          title="Eliminar elemento"
          disabled={!selectedElement}
        >
          <Trash2 size={16} />
        </Button>
      </div>

      {/* Grupo de vista */}
      <div className="flex items-center gap-1 pr-2 border-r">
        <Button
          variant={showCodeView ? 'default' : 'ghost'}
          size="sm"
          onClick={onToggleCodeView}
          title="Ver código SVG"
        >
          <Code size={16} />
        </Button>
      </div>

      {/* Información del elemento seleccionado */}
      {selectedElement && (
        <div className="flex-1 text-xs text-muted-foreground ml-2">
          <span className="font-medium">{selectedElement.id}</span>
          <span className="mx-1">•</span>
          <span>{selectedElement.tagName}</span>
          {selectedElement.className && (
            <>
              <span className="mx-1">•</span>
              <span className="font-mono">.{selectedElement.className}</span>
            </>
          )}
        </div>
      )}

      {/* Estadísticas del SVG */}
      {svgData && (
        <div className="text-xs text-muted-foreground">
          <span>{Object.keys(svgData.styles || {}).length} estilos</span>
          <span className="mx-2">•</span>
          <span>{countElements(svgData.root)} elementos</span>
        </div>
      )}
    </div>
  );
};

/**
 * Cuenta el número total de elementos en el SVG
 */
const countElements = (element) => {
  let count = 1;
  element.children.forEach(child => {
    count += countElements(child);
  });
  return count;
};

export default AdvancedTools;
