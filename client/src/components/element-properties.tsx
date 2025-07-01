import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { X, ArrowLeft } from "lucide-react";
import { SvgElement } from "@shared/schema";

interface ElementPropertiesProps {
  element: SvgElement | null;
  onUpdateElement: (elementId: string, updates: Partial<SvgElement>) => void;
  onClose: () => void;
}

export default function ElementProperties({ element, onUpdateElement, onClose }: ElementPropertiesProps) {
  const [localAttributes, setLocalAttributes] = useState<Record<string, string>>({});

  useEffect(() => {
    if (element) {
      setLocalAttributes(element.attributes);
    }
  }, [element]);

  const handleAttributeChange = (key: string, value: string) => {
    const newAttributes = { ...localAttributes, [key]: value };
    setLocalAttributes(newAttributes);
    
    if (element) {
      onUpdateElement(element.id, {
        attributes: newAttributes
      });
    }
  };

  const handleContentChange = (content: string) => {
    if (element) {
      onUpdateElement(element.id, { content });
    }
  };

  const getCommonAttributes = (type: string) => {
    const common = ['id', 'class', 'style'];
    
    switch (type) {
      case 'svg':
        return [...common, 'width', 'height', 'viewBox', 'xmlns'];
      case 'g':
        return [...common, 'transform'];
      case 'circle':
        return [...common, 'cx', 'cy', 'r', 'fill', 'stroke', 'stroke-width'];
      case 'rect':
        return [...common, 'x', 'y', 'width', 'height', 'fill', 'stroke', 'stroke-width'];
      case 'path':
        return [...common, 'd', 'fill', 'stroke', 'stroke-width'];
      case 'line':
        return [...common, 'x1', 'y1', 'x2', 'y2', 'stroke', 'stroke-width'];
      case 'text':
        return [...common, 'x', 'y', 'font-family', 'font-size', 'fill'];
      default:
        return common;
    }
  };

  if (!element) {
    return (
      <div className="border-t border-cream-300 p-4 bg-cream-100">
        <div className="text-center text-cream-500 py-8">
          <p className="text-sm">Select an element to edit properties</p>
        </div>
      </div>
    );
  }

  const commonAttributes = getCommonAttributes(element.type);

  return (
    <div className="border-t border-cream-300 p-4 bg-cream-100 custom-scrollbar">
      <div className="mb-3">
        <h3 className="text-sm font-semibold text-cream-800">Element Properties</h3>
      </div>
      
      <div className="space-y-3">
        {/* Element Type (Read-only) */}
        <div>
          <Label className="text-xs text-cream-600 mb-1">Element Type</Label>
          <div className="text-sm text-cream-800 bg-cream-200 px-2 py-1 rounded">
            {element.type}
          </div>
        </div>

        {/* Common Attributes */}
        {commonAttributes.map((attr) => (
          <div key={attr}>
            <Label className="text-xs text-cream-600 mb-1 capitalize">
              {attr.replace(/([A-Z])/g, ' $1').replace(/^./, (str) => str.toUpperCase())}
            </Label>
            <Input
              type="text"
              value={localAttributes[attr] || ''}
              onChange={(e) => handleAttributeChange(attr, e.target.value)}
              placeholder={`Enter ${attr}`}
              className="text-sm border-cream-400 focus:border-cream-500 bg-white"
            />
          </div>
        ))}

        {/* Content for text elements or style elements */}
        {(element.type === 'text' || element.type === 'style') && (
          <div>
            <Label className="text-xs text-cream-600 mb-1">
              {element.type === 'style' ? 'CSS Content' : 'Text Content'}
            </Label>
            <Textarea
              value={element.content || ''}
              onChange={(e) => handleContentChange(e.target.value)}
              placeholder={element.type === 'style' ? 'Enter CSS rules' : 'Enter text content'}
              className="text-sm border-cream-400 focus:border-cream-500 bg-white font-mono"
              rows={4}
            />
          </div>
        )}

        {/* Custom Attributes */}
        <div>
          <Label className="text-xs text-cream-600 mb-1">Custom Attributes</Label>
          <div className="space-y-2">
            {Object.entries(localAttributes)
              .filter(([key]) => !commonAttributes.includes(key))
              .map(([key, value]) => (
                <div key={key} className="flex space-x-2">
                  <Input
                    type="text"
                    value={key}
                    onChange={(e) => {
                      const newAttributes = { ...localAttributes };
                      delete newAttributes[key];
                      newAttributes[e.target.value] = value;
                      setLocalAttributes(newAttributes);
                    }}
                    placeholder="Attribute name"
                    className="text-xs border-cream-400 focus:border-cream-500 bg-white flex-1"
                  />
                  <Input
                    type="text"
                    value={value}
                    onChange={(e) => handleAttributeChange(key, e.target.value)}
                    placeholder="Value"
                    className="text-xs border-cream-400 focus:border-cream-500 bg-white flex-1"
                  />
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => {
                      const newAttributes = { ...localAttributes };
                      delete newAttributes[key];
                      setLocalAttributes(newAttributes);
                      if (element) {
                        onUpdateElement(element.id, { attributes: newAttributes });
                      }
                    }}
                    className="h-8 w-8 p-0 text-cream-500 hover:text-red-600"
                  >
                    ×
                  </Button>
                </div>
              ))}
            <Button
              size="sm"
              variant="outline"
              onClick={() => {
                const newKey = `attr${Object.keys(localAttributes).length + 1}`;
                handleAttributeChange(newKey, '');
              }}
              className="w-full text-xs border-cream-400 text-cream-700 hover:bg-cream-200"
            >
              Add Attribute
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
