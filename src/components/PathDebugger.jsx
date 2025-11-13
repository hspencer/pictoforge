import React, { useState } from 'react';
import { usePathDataProcessor } from '../hooks/usePathDataProcessor';
import { Button } from '@/components/ui/button';
import { Maximize2, RotateCcw, Code } from 'lucide-react';

/**
 * Componente de demostración para PathDataProcessor
 * Muestra información detallada sobre el path seleccionado
 */
export const PathDebugger = ({ pathElement, onClose }) => {
  const [showCommands, setShowCommands] = useState(false);

  // Extraer el atributo 'd' del elemento path
  const pathString = pathElement?.getAttribute('d') || '';

  // Usar el hook de PathDataProcessor
  const {
    isReady,
    segments,
    anchorPoints,
    controlPoints,
    pathString: processedPath,
    normalize,
    reverse,
    toCommandStrings,
    getDebugInfo,
  } = usePathDataProcessor({ pathString, autoNormalize: false });

  if (!pathElement || !isReady) {
    return (
      <div className="p-4 bg-muted/20 rounded-lg border">
        <p className="text-sm text-muted-foreground">
          Selecciona un elemento &lt;path&gt; para ver información detallada
        </p>
      </div>
    );
  }

  const debugInfo = getDebugInfo();
  const commands = toCommandStrings();

  return (
    <div className="p-4 bg-muted/20 rounded-lg border space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-semibold">Path Debugger</h3>
        <div className="flex gap-1">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setShowCommands(!showCommands)}
            title="Ver comandos"
            className="h-7 w-7 p-0"
          >
            <Code size={14} />
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={normalize}
            title="Normalizar a absolutos"
            className="h-7 w-7 p-0"
          >
            <Maximize2 size={14} />
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={reverse}
            title="Invertir dirección"
            className="h-7 w-7 p-0"
          >
            <RotateCcw size={14} />
          </Button>
        </div>
      </div>

      {/* Información general */}
      <div className="grid grid-cols-2 gap-2 text-xs">
        <div className="space-y-1">
          <div className="text-muted-foreground">ID:</div>
          <div className="font-mono">{pathElement.id || 'sin id'}</div>
        </div>
        <div className="space-y-1">
          <div className="text-muted-foreground">Comandos:</div>
          <div className="font-mono">{debugInfo.commandCount}</div>
        </div>
        <div className="space-y-1">
          <div className="text-muted-foreground">Segmentos:</div>
          <div className="font-mono">{segments.length}</div>
        </div>
        <div className="space-y-1">
          <div className="text-muted-foreground">Normalizado:</div>
          <div className="font-mono">{debugInfo.isNormalized ? 'Sí' : 'No'}</div>
        </div>
      </div>

      {/* Puntos */}
      <div className="space-y-2">
        <div className="text-xs font-semibold text-muted-foreground">Puntos</div>
        <div className="grid grid-cols-2 gap-2 text-xs">
          <div className="p-2 bg-background rounded border">
            <div className="text-muted-foreground mb-1">Anclaje</div>
            <div className="font-mono text-lg">{anchorPoints.length}</div>
          </div>
          <div className="p-2 bg-background rounded border">
            <div className="text-muted-foreground mb-1">Control</div>
            <div className="font-mono text-lg">{controlPoints.length}</div>
          </div>
        </div>
      </div>

      {/* Comandos detallados */}
      {showCommands && (
        <div className="space-y-2">
          <div className="text-xs font-semibold text-muted-foreground">Comandos SVG</div>
          <div className="max-h-40 overflow-y-auto space-y-1">
            {commands.map((cmd, index) => (
              <div
                key={index}
                className="text-xs font-mono p-2 bg-background rounded border"
              >
                {cmd}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Segmentos con puntos de control */}
      <div className="space-y-2">
        <div className="text-xs font-semibold text-muted-foreground">
          Segmentos con puntos de control
        </div>
        <div className="max-h-60 overflow-y-auto space-y-2">
          {segments.map((segment, index) => (
            <div
              key={index}
              className="p-2 bg-background rounded border text-xs space-y-1"
            >
              <div className="font-semibold text-primary">
                #{index} {segment.command}
              </div>

              {/* Puntos de anclaje */}
              {segment.points.length > 0 && (
                <div className="space-y-1">
                  <div className="text-muted-foreground">Puntos de anclaje:</div>
                  {segment.points.map((point, pIndex) => (
                    <div key={pIndex} className="font-mono text-xs pl-2">
                      ({point.x.toFixed(2)}, {point.y.toFixed(2)})
                    </div>
                  ))}
                </div>
              )}

              {/* Puntos de control */}
              {segment.controlPoints.length > 0 && (
                <div className="space-y-1">
                  <div className="text-muted-foreground">Puntos de control:</div>
                  {segment.controlPoints.map((control, cIndex) => (
                    <div key={cIndex} className="font-mono text-xs pl-2">
                      {control.label}:{' '}
                      {control.x !== undefined
                        ? `(${control.x.toFixed(2)}, ${control.y.toFixed(2)})`
                        : JSON.stringify(control).slice(0, 50)}
                    </div>
                  ))}
                </div>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Path string procesado */}
      <div className="space-y-2">
        <div className="text-xs font-semibold text-muted-foreground">Path String</div>
        <div className="p-2 bg-background rounded border text-xs font-mono break-all max-h-20 overflow-y-auto">
          {processedPath}
        </div>
      </div>
    </div>
  );
};

export default PathDebugger;
