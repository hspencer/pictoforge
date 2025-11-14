import React from 'react';
import { History, Trash2, Download, Upload, HardDrive } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useSVGStorage } from '@/hooks/useSVGStorage';

/**
 * Componente para mostrar y gestionar el historial de SVGs
 */
export const SVGHistory = ({ onLoadSVG }) => {
  const {
    recentSVGs,
    deleteSVG,
    clearHistory,
    getStorageStats,
    exportHistory,
    importHistory
  } = useSVGStorage();

  const stats = getStorageStats();

  /**
   * Maneja la importación de historial
   */
  const handleImport = () => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = '.json';

    input.onchange = (e) => {
      const file = e.target.files[0];
      if (!file) return;

      const reader = new FileReader();
      reader.onload = (event) => {
        try {
          const success = importHistory(event.target.result);
          if (success) {
            alert('✓ Historial importado correctamente');
          } else {
            alert('✗ Error al importar historial');
          }
        } catch (error) {
          alert('✗ Archivo JSON inválido');
        }
      };
      reader.readAsText(file);
    };

    input.click();
  };

  /**
   * Carga un SVG del historial
   */
  const handleLoadSVG = (svgEntry) => {
    if (onLoadSVG) {
      onLoadSVG(svgEntry.content, svgEntry.metadata.name);
    }
  };

  /**
   * Formatea fecha para mostrar
   */
  const formatDate = (isoString) => {
    const date = new Date(isoString);
    const now = new Date();
    const diffMs = now - date;
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return 'Hace un momento';
    if (diffMins < 60) return `Hace ${diffMins} min`;
    if (diffHours < 24) return `Hace ${diffHours}h`;
    if (diffDays < 7) return `Hace ${diffDays}d`;
    return date.toLocaleDateString();
  };

  return (
    <div className="p-4 space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h3 className="font-semibold text-sm flex items-center gap-2">
          <History size={16} />
          Historial Reciente
        </h3>

        {recentSVGs && recentSVGs.length > 0 && (
          <Button
            variant="ghost"
            size="sm"
            onClick={clearHistory}
            className="h-7 text-xs text-destructive"
            title="Limpiar historial"
          >
            <Trash2 size={12} className="mr-1" />
            Limpiar
          </Button>
        )}
      </div>

      {/* Lista de SVGs recientes */}
      {recentSVGs && recentSVGs.length > 0 ? (
        <div className="space-y-2">
          {recentSVGs.map((svg) => (
            <div
              key={svg.id}
              className="p-3 border rounded-lg hover:bg-muted/50 cursor-pointer transition-colors"
              onClick={() => handleLoadSVG(svg)}
            >
              <div className="flex items-start justify-between gap-2">
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-sm truncate">
                    {svg.metadata.name || 'Sin título'}
                  </p>
                  <div className="flex gap-2 mt-1 text-xs text-muted-foreground">
                    <span>{svg.metadata.elementCount || 0} elementos</span>
                    <span>•</span>
                    <span>{formatDate(svg.metadata.dateModified)}</span>
                  </div>
                </div>

                <Button
                  variant="ghost"
                  size="sm"
                  onClick={(e) => {
                    e.stopPropagation();
                    if (confirm('¿Eliminar este SVG del historial?')) {
                      deleteSVG(svg.id);
                    }
                  }}
                  className="h-7 w-7 p-0 flex-shrink-0"
                  title="Eliminar del historial"
                >
                  <Trash2 size={14} />
                </Button>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="text-center py-8 text-muted-foreground">
          <History size={32} className="mx-auto mb-2 opacity-50" />
          <p className="text-sm">No hay SVGs en el historial</p>
        </div>
      )}

      {/* Estadísticas y acciones */}
      <div className="pt-4 border-t space-y-3">
        <div className="flex items-center justify-between text-xs text-muted-foreground">
          <span className="flex items-center gap-1">
            <HardDrive size={12} />
            Almacenamiento usado
          </span>
          <span className="font-mono">{stats.totalSizeKB} KB</span>
        </div>

        <div className="grid grid-cols-2 gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={exportHistory}
            className="h-8 text-xs"
          >
            <Download size={12} className="mr-1" />
            Exportar
          </Button>

          <Button
            variant="outline"
            size="sm"
            onClick={handleImport}
            className="h-8 text-xs"
          >
            <Upload size={12} className="mr-1" />
            Importar
          </Button>
        </div>
      </div>
    </div>
  );
};

export default SVGHistory;
