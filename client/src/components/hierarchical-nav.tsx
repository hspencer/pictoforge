import { useState } from "react";
import { Button } from "@/components/ui/button";
import { ChevronDown, ChevronRight, Layers, Circle, Square, Edit, Type, Code, Settings, Palette } from "lucide-react";
import { SvgElement, SvgStructure } from "@shared/schema";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

interface HierarchicalNavProps {
  structure: SvgStructure;
  selectedElementId: string | null;
  onSelectElement: (element: SvgElement) => void;
  onRemoveElement: (elementId: string) => void;
  navigationPath: string[];
  onNavigate: (path: string[]) => void;
}

// Style button component for class styling
function StyleButton({ className, isGroup = false }: { className: string; isGroup?: boolean }) {
  const getStyleColor = () => {
    if (className === 'f') return 'bg-white border-2 border-black';
    if (className === 'k') return 'bg-black border-2 border-white';
    return 'bg-gray-400 border border-gray-600';
  };

  return (
    <Dialog>
      <DialogTrigger asChild>
        <button 
          className={`w-4 h-4 rounded-full ${getStyleColor()} ml-2 hover:scale-110 transition-transform`}
          title={`Edit style: .${className}`}
        />
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Edit Style: .{className}</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <div>
            <Label>CSS Rules</Label>
            <Textarea
              defaultValue={className === 'f' ? 
                'fill: #fff;\nstroke: #000;\nstroke-linejoin: square;' :
                'fill: #000;\nstroke: #FFF;\nstroke-linejoin: square;'
              }
              className="font-mono text-sm mt-2"
              rows={8}
              placeholder="Enter CSS rules..."
            />
          </div>
          <div>
            <Label>Custom Code</Label>
            <Textarea
              placeholder="Additional custom CSS..."
              className="font-mono text-sm mt-2"
              rows={3}
            />
          </div>
          <div className="flex justify-end space-x-2">
            <Button variant="outline" size="sm">Cancel</Button>
            <Button size="sm" className="bg-cream-500 hover:bg-cream-600">
              Save Changes
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

const getElementIcon = (type: string) => {
  switch (type) {
    case 'svg':
      return <Settings className="w-4 h-4 text-blue-500" />;
    case 'defs':
      return <Settings className="w-4 h-4 text-purple-500" />;
    case 'style':
      return <Palette className="w-4 h-4 text-green-500" />;
    case 'g':
      return <Layers className="w-4 h-4 text-orange-500" />;
    case 'circle':
      return <Circle className="w-4 h-4 text-red-500" />;
    case 'rect':
      return <Square className="w-4 h-4 text-blue-500" />;
    case 'path':
      return <Edit className="w-4 h-4 text-indigo-500" />;
    case 'text':
      return <Type className="w-4 h-4 text-gray-500" />;
    default:
      return <Settings className="w-4 h-4 text-cream-600" />;
  }
};

const extractStyleClasses = (styleContent: string): string[] => {
  const classMatches = styleContent.match(/\.([a-zA-Z][a-zA-Z0-9_-]*)/g);
  return classMatches ? classMatches.map(cls => cls.substring(1)) : [];
};

export default function HierarchicalNav({ 
  structure, 
  selectedElementId, 
  onSelectElement, 
  onRemoveElement,
  navigationPath,
  onNavigate 
}: HierarchicalNavProps) {
  const [expandedSections, setExpandedSections] = useState<Set<string>>(new Set(['defs', 'elements']));

  const toggleSection = (section: string) => {
    const newExpanded = new Set(expandedSections);
    if (newExpanded.has(section)) {
      newExpanded.delete(section);
    } else {
      newExpanded.add(section);
    }
    setExpandedSections(newExpanded);
  };

  const renderDefsSection = () => {
    const defsElement = structure.root.children.find(child => child.type === 'defs');
    if (!defsElement) return null;

    const styleElement = defsElement.children.find(child => child.type === 'style');
    const styleClasses = styleElement ? extractStyleClasses(styleElement.content || '') : [];

    return (
      <div className="border-b border-cream-300">
        <Button
          variant="ghost"
          onClick={() => toggleSection('defs')}
          className="w-full flex items-center justify-between p-3 hover:bg-cream-300"
        >
          <div className="flex items-center space-x-2">
            <Settings className="w-4 h-4 text-purple-500" />
            <span className="font-medium">Definitions</span>
          </div>
          {expandedSections.has('defs') ? 
            <ChevronDown className="w-4 h-4" /> : 
            <ChevronRight className="w-4 h-4" />
          }
        </Button>
        
        {expandedSections.has('defs') && (
          <div className="pl-6 pb-2">
            <div className="text-xs text-cream-600 font-medium mb-2 px-2">Size & Styles</div>
            
            {/* SVG Dimensions */}
            <Button
              variant="ghost"
              size="sm"
              onClick={() => onSelectElement(structure.root)}
              className={`flex items-center space-x-2 p-2 hover:bg-cream-300 w-full justify-start mb-1 ${
                selectedElementId === structure.root.id ? 'bg-cream-300' : ''
              }`}
            >
              <Settings className="w-4 h-4 text-blue-500" />
              <span>Canvas Size</span>
              <span className="text-xs text-cream-500 ml-auto">
                {structure.root.attributes.viewBox || '100x100'}
              </span>
            </Button>

            {/* Style Classes */}
            {styleClasses.map((className) => (
              <div
                key={className}
                className="flex items-center space-x-2 p-2 bg-yellow-50 border border-yellow-200 text-sm"
              >
                <div className="w-3 h-3 bg-yellow-500"></div>
                <span className="font-mono text-yellow-700">.{className}</span>
                <span className="text-yellow-600 text-xs ml-auto">
                  {className === 'bed-group' ? 'Brown style' : 'Orange style'}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>
    );
  };

  const renderElementsSection = () => {
    const groupElements = structure.root.children.filter(child => child.type === 'g');

    return (
      <div className="border-b border-cream-300">
        <Button
          variant="ghost"
          onClick={() => toggleSection('elements')}
          className="w-full flex items-center justify-between p-3 hover:bg-cream-300"
        >
          <div className="flex items-center space-x-2">
            <Layers className="w-4 h-4 text-orange-500" />
            <span className="font-medium">Drawing Elements</span>
          </div>
          {expandedSections.has('elements') ? 
            <ChevronDown className="w-4 h-4" /> : 
            <ChevronRight className="w-4 h-4" />
          }
        </Button>
        
        {expandedSections.has('elements') && (
          <div className="pl-6 pb-2">
            {groupElements.map((group) => (
              <div key={group.id} className="mb-2">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => onSelectElement(group)}
                  className={`flex items-center space-x-2 p-2 hover:bg-cream-300 w-full justify-start ${
                    selectedElementId === group.id ? 'bg-cream-300' : ''
                  }`}
                >
                  <Layers className="w-4 h-4 text-orange-500" />
                  <span className="font-medium">{group.attributes.id || group.id}</span>
                  <span className="text-xs text-cream-500 ml-auto">
                    {group.children.length} elements
                  </span>
                </Button>
                
                {/* Show child elements if this group is selected */}
                {selectedElementId === group.id && (
                  <div className="pl-6 mt-1 space-y-1">
                    {group.children.map((child) => (
                      <Button
                        key={child.id}
                        variant="ghost"
                        size="sm"
                        onClick={() => onSelectElement(child)}
                        className={`flex items-center space-x-2 p-1 hover:bg-cream-300 w-full justify-start text-xs ${
                          selectedElementId === child.id ? 'bg-cream-300' : ''
                        }`}
                      >
                        {getElementIcon(child.type)}
                        <span>{child.attributes.id || child.type}</span>
                      </Button>
                    ))}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="flex flex-col h-full">
      {renderDefsSection()}
      {renderElementsSection()}
    </div>
  );
}