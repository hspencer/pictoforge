import { useState, useRef, useEffect, useMemo } from "react";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Slider } from "@/components/ui/slider";
import { Crosshair, Download, Copy, Grid3X3, Code, Star, Maximize } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import VisualNodeEditor from "./visual-node-editor";
import { SvgElement } from "@shared/schema";

interface SvgPreviewProps {
  svgCode: string;
  selectedElementId: string | null;
  editMode?: 'select' | 'edit' | 'erase';
  onElementSelect?: (element: any) => void;
  onUpdateElement?: (elementId: string, updates: Partial<SvgElement>) => void;
}

export default function SvgPreview({ svgCode, selectedElementId, editMode = 'select', onElementSelect, onUpdateElement }: SvgPreviewProps) {
  const [scale, setScale] = useState([100]);

  const resetZoom = () => {
    setScale([100]);
  };

  // Apply selection highlighting to SVG code
  const highlightedSvgCode = useMemo(() => {
    if (!selectedElementId || !svgCode) return svgCode;
    
    // Add selected class to the selected element
    const parser = new DOMParser();
    const doc = parser.parseFromString(svgCode, 'image/svg+xml');
    const selectedElement = doc.getElementById(selectedElementId);
    
    if (selectedElement) {
      const currentClass = selectedElement.getAttribute('class') || '';
      const newClass = currentClass ? `${currentClass} selected` : 'selected';
      selectedElement.setAttribute('class', newClass);
    }
    
    const serializer = new XMLSerializer();
    return serializer.serializeToString(doc);
  }, [svgCode, selectedElementId]);
  const [showGrid, setShowGrid] = useState(false);
  const [rating, setRating] = useState(0);
  const [hoverRating, setHoverRating] = useState(0);
  const previewRef = useRef<HTMLDivElement>(null);
  const { toast } = useToast();

  const handleCenterView = () => {
    if (previewRef.current) {
      previewRef.current.scrollTo({
        left: (previewRef.current.scrollWidth - previewRef.current.clientWidth) / 2,
        top: (previewRef.current.scrollHeight - previewRef.current.clientHeight) / 2,
        behavior: 'smooth'
      });
    }
  };

  const handleCopyCode = async () => {
    try {
      await navigator.clipboard.writeText(svgCode);
      toast({
        title: "Code copied",
        description: "SVG code has been copied to clipboard",
      });
    } catch (error) {
      toast({
        title: "Copy failed",
        description: "Failed to copy SVG code to clipboard",
        variant: "destructive",
      });
    }
  };

  const handleDownload = () => {
    try {
      const blob = new Blob([svgCode], { type: 'image/svg+xml' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'pictogram.svg';
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      
      toast({
        title: "Download started",
        description: "SVG file is being downloaded",
      });
    } catch (error) {
      toast({
        title: "Download failed",
        description: "Failed to download SVG file",
        variant: "destructive",
      });
    }
  };

  const getSvgDimensions = () => {
    try {
      const parser = new DOMParser();
      const doc = parser.parseFromString(svgCode, 'image/svg+xml');
      const svg = doc.querySelector('svg');
      if (svg) {
        const width = svg.getAttribute('width') || '100';
        const height = svg.getAttribute('height') || '100';
        const viewBox = svg.getAttribute('viewBox');
        return { width, height, viewBox };
      }
    } catch (error) {
      console.error('Error parsing SVG:', error);
    }
    return { width: '100', height: '100', viewBox: null };
  };

  const handleRating = (value: number) => {
    setRating(value);
    toast({
      title: "Rating submitted",
      description: `You rated this pictogram ${value} out of 5 stars`,
    });
  };

  const dimensions = getSvgDimensions();
  const fileSize = new Blob([svgCode]).size;

  return (
    <div className="h-full flex flex-col">
      {/* Preview Header */}
      <div className="flex items-center justify-between bg-cream-100 border-b border-cream-300 px-4 py-2">
        <h3 className="text-sm font-semibold text-cream-800">Live Preview</h3>
        <div className="flex items-center space-x-2">
          <Select value={scale[0].toString()} onValueChange={(value) => setScale([parseInt(value)])}>
            <SelectTrigger className="w-24 h-6 text-xs border-cream-400">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="25">25%</SelectItem>
              <SelectItem value="50">50%</SelectItem>
              <SelectItem value="75">75%</SelectItem>
              <SelectItem value="100">100%</SelectItem>
              <SelectItem value="150">150%</SelectItem>
              <SelectItem value="200">200%</SelectItem>
            </SelectContent>
          </Select>
          <Button
            size="sm"
            variant="ghost"
            onClick={() => setShowGrid(!showGrid)}
            className={`h-6 w-6 p-0 ${showGrid ? 'text-cream-800' : 'text-cream-600'} hover:text-cream-800`}
            title="Toggle grid"
          >
            <Grid3X3 className="w-3 h-3" />
          </Button>
          <Button
            size="sm"
            variant="ghost"
            onClick={handleCenterView}
            className="h-6 w-6 p-0 text-cream-600 hover:text-cream-800"
            title="Center view"
          >
            <Crosshair className="w-3 h-3" />
          </Button>
          <Button
            size="sm"
            variant="ghost"
            onClick={() => {
              const input = document.createElement('input');
              input.type = 'file';
              input.accept = '.svg';
              input.onchange = (e) => {
                const file = (e.target as HTMLInputElement).files?.[0];
                if (file) {
                  const reader = new FileReader();
                  reader.onload = (e) => {
                    const content = e.target?.result as string;
                    // This would call an import function if available
                    console.log('Import SVG:', content);
                  };
                  reader.readAsText(file);
                }
              };
              input.click();
            }}
            className="h-6 w-6 p-0 text-cream-600 hover:text-cream-800"
            title="Import SVG"
          >
            <Download className="w-3 h-3 rotate-180" />
          </Button>
          <Button
            size="sm"
            variant="ghost"
            onClick={() => {
              const blob = new Blob([svgCode], { type: 'image/svg+xml' });
              const url = URL.createObjectURL(blob);
              const a = document.createElement('a');
              a.href = url;
              a.download = 'pictogram.svg';
              document.body.appendChild(a);
              a.click();
              document.body.removeChild(a);
              URL.revokeObjectURL(url);
            }}
            className="h-6 w-6 p-0 text-cream-600 hover:text-cream-800"
            title="Export SVG"
          >
            <Download className="w-3 h-3" />
          </Button>
        </div>
      </div>

      {/* Preview Area */}
      <div
        ref={previewRef}
        className="flex-1 overflow-auto custom-scrollbar"
        style={{
          backgroundImage: showGrid ? 
            'radial-gradient(circle, hsl(var(--cream-300)) 1px, transparent 1px)' : 'none',
          backgroundSize: showGrid ? '20px 20px' : 'auto',
          backgroundColor: 'white'
        }}
      >
        <div className="w-full h-full flex items-center justify-center p-4 relative">
          {highlightedSvgCode ? (
            <>
              <div
                style={{ 
                  transform: `scale(${scale[0] / 100})`,
                  transformOrigin: 'center center'
                }}
                className="transition-transform duration-200"
                dangerouslySetInnerHTML={{ __html: highlightedSvgCode }}
                onClick={(e) => {
                  if (editMode === 'select' && onElementSelect) {
                    const target = e.target as SVGElement;
                    if (target.id && target.id !== 'pictogram') {
                      onElementSelect({ id: target.id });
                    }
                  }
                  e.stopPropagation();
                }}
              />
              {/* Visual Node Editor Overlay */}
              {editMode === 'edit' && onUpdateElement && (
                <VisualNodeEditor
                  svgCode={svgCode}
                  selectedElementId={selectedElementId}
                  onUpdateElement={onUpdateElement}
                  scale={scale[0]}
                />
              )}
            </>
          ) : (
            <div className="w-64 h-64 flex items-center justify-center text-cream-500 border-2 border-dashed border-cream-300 rounded">
              <div className="text-center">
                <Code className="w-8 h-8 mx-auto mb-2" />
                <p className="text-sm">No SVG content</p>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Preview Controls */}
      <div className="border-t border-cream-300 p-4 bg-cream-100">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4 text-xs text-cream-600">
            <span>
              Dimensions: {dimensions.width}×{dimensions.height}
            </span>
            <span>
              Size: {(fileSize / 1024).toFixed(1)}KB
            </span>
            {dimensions.viewBox && (
              <span>
                ViewBox: {dimensions.viewBox}
              </span>
            )}
          </div>
          <div className="flex space-x-2">
            <Button
              size="sm"
              variant="outline"
              onClick={handleCopyCode}
              className="h-7 text-xs border-cream-400 text-cream-700 hover:bg-cream-200"
            >
              <Copy className="w-3 h-3 mr-1" />
              Copy Code
            </Button>
            <Button
              size="sm"
              onClick={handleDownload}
              className="h-7 text-xs bg-cream-500 hover:bg-cream-600 text-white"
            >
              <Download className="w-3 h-3 mr-1" />
              Download
            </Button>
          </div>
        </div>
        
        <div className="mt-3">
          <div className="flex items-center space-x-3">
            <span className="text-xs text-cream-600 min-w-12">Zoom:</span>
            <Slider
              value={scale}
              onValueChange={setScale}
              max={500}
              min={10}
              step={10}
              className="flex-1"
            />
            <span className="text-xs text-cream-700 font-medium min-w-12">
              {scale[0]}%
            </span>
            <Button
              size="sm"
              variant="outline"
              onClick={resetZoom}
              className="h-7 w-7 p-0 border-cream-400 text-cream-700 hover:bg-cream-200"
              title="Reset zoom to 100%"
            >
              <Maximize className="w-3 h-3" />
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
