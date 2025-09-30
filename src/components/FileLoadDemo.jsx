import React from 'react';
import { FileText, Download } from 'lucide-react';
import { Button } from '@/components/ui/button';

/**
 * Componente de demostración para cargar archivos SVG de ejemplo
 */
export const FileLoadDemo = ({ onLoadExample }) => {
  
  /**
   * SVG de ejemplo: Casa simple
   */
  const houseExample = `<?xml version="1.0" encoding="UTF-8"?>
<svg id="house_drawing" xmlns="http://www.w3.org/2000/svg" 
     version="1.1" viewBox="0 0 200 200" width="200" height="200">
  <!-- Casa simple para demostración -->
  <defs>
    <style>
      .wall { fill: #8B4513; stroke: #000; stroke-width: 2; }
      .roof { fill: #DC143C; stroke: #000; stroke-width: 2; }
      .door { fill: #654321; stroke: #000; stroke-width: 1; }
      .window { fill: #87CEEB; stroke: #000; stroke-width: 1; }
      .sun { fill: #FFD700; stroke: #FFA500; stroke-width: 2; }
      .grass { fill: #228B22; stroke: none; }
    </style>
  </defs>
  
  <g id="background">
    <rect id="sky" fill="#87CEEB" x="0" y="0" width="200" height="140"/>
    <rect id="ground" class="grass" x="0" y="140" width="200" height="60"/>
  </g>
  
  <g id="house">
    <rect id="house_base" class="wall" x="60" y="80" width="80" height="60"/>
    <polygon id="roof" class="roof" points="60,80 100,40 140,80"/>
    <rect id="door" class="door" x="85" y="110" width="20" height="30"/>
    <circle id="door_knob" fill="#FFD700" cx="100" cy="125" r="2"/>
    <rect id="window_left" class="window" x="70" y="95" width="12" height="12"/>
    <rect id="window_right" class="window" x="118" y="95" width="12" height="12"/>
  </g>
  
  <g id="environment">
    <circle id="sun" class="sun" cx="170" cy="30" r="15"/>
    <polygon id="tree" class="grass" points="20,140 25,120 30,140"/>
    <circle id="tree_top" fill="#228B22" cx="25" cy="115" r="8"/>
  </g>
</svg>`;

  /**
   * SVG de ejemplo: Figura geométrica
   */
  const geometryExample = `<?xml version="1.0" encoding="UTF-8"?>
<svg id="geometry_demo" xmlns="http://www.w3.org/2000/svg" 
     version="1.1" viewBox="0 0 300 200" width="300" height="200">
  <!-- Figuras geométricas para demostración -->
  <defs>
    <style>
      .shape1 { fill: #FF6B6B; stroke: #000; stroke-width: 2; }
      .shape2 { fill: #4ECDC4; stroke: #000; stroke-width: 2; }
      .shape3 { fill: #45B7D1; stroke: #000; stroke-width: 2; }
      .shape4 { fill: #96CEB4; stroke: #000; stroke-width: 2; }
      .shape5 { fill: #FFEAA7; stroke: #000; stroke-width: 2; }
    </style>
  </defs>
  
  <g id="shapes_group">
    <circle id="circle1" class="shape1" cx="60" cy="60" r="30"/>
    <rect id="rectangle1" class="shape2" x="120" y="30" width="60" height="40"/>
    <polygon id="triangle1" class="shape3" points="220,70 250,30 280,70"/>
    <ellipse id="ellipse1" class="shape4" cx="60" cy="140" rx="40" ry="25"/>
    <polygon id="hexagon1" class="shape5" points="150,120 170,110 190,120 190,140 170,150 150,140"/>
    <path id="star1" class="shape1" d="M250,120 L255,135 L270,135 L258,145 L263,160 L250,150 L237,160 L242,145 L230,135 L245,135 Z"/>
  </g>
</svg>`;

  /**
   * Carga un ejemplo específico
   */
  const loadExample = (svgContent, name) => {
    onLoadExample?.(svgContent, name);
  };

  return (
    <div className="p-4 bg-muted/20 border rounded-lg">
      <h4 className="font-semibold text-sm mb-3 flex items-center gap-2">
        <FileText size={16} />
        Ejemplos de SVG para Probar
      </h4>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        <Button
          variant="outline"
          size="sm"
          onClick={() => loadExample(houseExample, 'casa_ejemplo.svg')}
          className="justify-start h-auto p-3"
        >
          <div className="text-left">
            <div className="font-medium">🏠 Casa Simple</div>
            <div className="text-xs text-muted-foreground">
              Casa con techo, puerta, ventanas y sol
            </div>
          </div>
        </Button>
        
        <Button
          variant="outline"
          size="sm"
          onClick={() => loadExample(geometryExample, 'geometria_ejemplo.svg')}
          className="justify-start h-auto p-3"
        >
          <div className="text-left">
            <div className="font-medium">🔷 Figuras Geométricas</div>
            <div className="text-xs text-muted-foreground">
              Círculos, rectángulos, triángulos y más
            </div>
          </div>
        </Button>
      </div>
      
      <div className="mt-3 text-xs text-muted-foreground">
        💡 Haz clic en cualquier ejemplo para cargarlo y probar todas las funcionalidades del editor
      </div>
    </div>
  );
};

export default FileLoadDemo;
