import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Separator } from "@/components/ui/separator";
import { Plus, Trash2, Palette } from "lucide-react";
import { Badge } from "@/components/ui/badge";

interface StyleClassEditorProps {
  isOpen: boolean;
  onClose: () => void;
  className: string;
  initialStyle: Record<string, string>;
  onSave: (className: string, style: Record<string, string>) => void;
  allowRemove?: boolean;
  onRemove?: () => void;
}

interface StyleAttribute {
  key: string;
  value: string;
}

const STROKE_TYPES = [
  "solid",
  "dashed", 
  "dotted",
  "none"
];

const STROKE_LINECAP = [
  "butt",
  "round", 
  "square"
];

const STROKE_LINEJOIN = [
  "miter",
  "round",
  "bevel"
];

const COMMON_SVG_ATTRIBUTES = [
  "fill",
  "stroke", 
  "stroke-width",
  "stroke-dasharray",
  "stroke-linecap",
  "stroke-linejoin",
  "opacity",
  "fill-opacity",
  "stroke-opacity",
  "transform",
  "filter",
  "clip-path",
  "mask"
];

export default function StyleClassEditor({ 
  isOpen, 
  onClose, 
  className, 
  initialStyle, 
  onSave,
  allowRemove = false,
  onRemove
}: StyleClassEditorProps) {
  const [editableClassName, setEditableClassName] = useState(className);
  const [attributes, setAttributes] = useState<StyleAttribute[]>([]);
  const [newAttributeKey, setNewAttributeKey] = useState("");
  const [newAttributeValue, setNewAttributeValue] = useState("");

  useEffect(() => {
    if (isOpen) {
      setEditableClassName(className);
      // Convert style object to attribute array
      const styleAttrs = Object.entries(initialStyle).map(([key, value]) => ({
        key,
        value
      }));
      setAttributes(styleAttrs);
    }
  }, [isOpen, className, initialStyle]);

  const updateAttribute = (index: number, key: string, value: string) => {
    const newAttributes = [...attributes];
    newAttributes[index] = { key, value };
    setAttributes(newAttributes);
  };

  const removeAttribute = (index: number) => {
    setAttributes(attributes.filter((_, i) => i !== index));
  };

  const addAttribute = () => {
    if (newAttributeKey && newAttributeValue) {
      setAttributes([...attributes, { key: newAttributeKey, value: newAttributeValue }]);
      setNewAttributeKey("");
      setNewAttributeValue("");
    }
  };

  const handleSave = () => {
    const styleObject = attributes.reduce((acc, attr) => {
      if (attr.key && attr.value) {
        acc[attr.key] = attr.value;
      }
      return acc;
    }, {} as Record<string, string>);

    onSave(editableClassName, styleObject);
    onClose();
  };

  const handleRemove = () => {
    if (onRemove) {
      onRemove();
    }
    onClose();
  };

  const getAttributeInput = (attr: StyleAttribute, index: number) => {
    const { key, value } = attr;
    
    // Color inputs for fill and stroke
    if (key === 'fill' || key === 'stroke') {
      return (
        <div className="flex items-center space-x-2">
          <input
            type="color"
            value={value.startsWith('#') ? value : '#000000'}
            onChange={(e) => updateAttribute(index, key, e.target.value)}
            className="w-8 h-8 rounded border border-cream-300"
          />
          <Input
            value={value}
            onChange={(e) => updateAttribute(index, key, e.target.value)}
            placeholder="Color value"
            className="flex-1"
          />
        </div>
      );
    }

    // Stroke width with number input
    if (key === 'stroke-width') {
      return (
        <Input
          type="number"
          min="0"
          step="0.1"
          value={value}
          onChange={(e) => updateAttribute(index, key, e.target.value)}
          placeholder="Width"
        />
      );
    }

    // Stroke type selector
    if (key === 'stroke-dasharray') {
      return (
        <Select value={value} onValueChange={(val) => updateAttribute(index, key, val)}>
          <SelectTrigger>
            <SelectValue placeholder="Stroke pattern" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="none">Solid</SelectItem>
            <SelectItem value="5,5">Dashed</SelectItem>
            <SelectItem value="2,2">Dotted</SelectItem>
            <SelectItem value="10,3,3,3">Dash-dot</SelectItem>
          </SelectContent>
        </Select>
      );
    }

    // Line cap selector
    if (key === 'stroke-linecap') {
      return (
        <Select value={value} onValueChange={(val) => updateAttribute(index, key, val)}>
          <SelectTrigger>
            <SelectValue placeholder="Line cap" />
          </SelectTrigger>
          <SelectContent>
            {STROKE_LINECAP.map(cap => (
              <SelectItem key={cap} value={cap}>{cap}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      );
    }

    // Line join selector
    if (key === 'stroke-linejoin') {
      return (
        <Select value={value} onValueChange={(val) => updateAttribute(index, key, val)}>
          <SelectTrigger>
            <SelectValue placeholder="Line join" />
          </SelectTrigger>
          <SelectContent>
            {STROKE_LINEJOIN.map(join => (
              <SelectItem key={join} value={join}>{join}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      );
    }

    // Opacity sliders
    if (key.includes('opacity')) {
      return (
        <div className="flex items-center space-x-2">
          <input
            type="range"
            min="0"
            max="1"
            step="0.1"
            value={value}
            onChange={(e) => updateAttribute(index, key, e.target.value)}
            className="flex-1"
          />
          <Input
            type="number"
            min="0"
            max="1"
            step="0.1"
            value={value}
            onChange={(e) => updateAttribute(index, key, e.target.value)}
            className="w-20"
          />
        </div>
      );
    }

    // Default text input
    return (
      <Input
        value={value}
        onChange={(e) => updateAttribute(index, key, e.target.value)}
        placeholder="Value"
      />
    );
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center space-x-2">
            <Palette className="w-5 h-5" />
            <span>Edit CSS Class</span>
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* Class Name */}
          <div>
            <Label htmlFor="className">Class Name</Label>
            <Input
              id="className"
              value={editableClassName}
              onChange={(e) => setEditableClassName(e.target.value)}
              placeholder="Enter class name"
              className="mt-1"
            />
          </div>

          <Separator />

          {/* Existing Attributes */}
          <div>
            <Label className="text-sm font-semibold">Style Attributes</Label>
            <div className="space-y-3 mt-2">
              {attributes.map((attr, index) => (
                <div key={index} className="flex items-center space-x-2 p-3 border border-cream-300 rounded-lg">
                  <div className="w-32">
                    <Select 
                      value={attr.key} 
                      onValueChange={(val) => updateAttribute(index, val, attr.value)}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Attribute" />
                      </SelectTrigger>
                      <SelectContent>
                        {COMMON_SVG_ATTRIBUTES.map(attrName => (
                          <SelectItem key={attrName} value={attrName}>
                            {attrName}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  
                  <div className="flex-1">
                    {getAttributeInput(attr, index)}
                  </div>
                  
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => removeAttribute(index)}
                    className="p-2 text-red-500 hover:text-red-700"
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              ))}
            </div>
          </div>

          {/* Add New Attribute */}
          <div className="border border-dashed border-cream-400 rounded-lg p-4">
            <Label className="text-sm font-semibold mb-2 block">Add New Attribute</Label>
            <div className="flex items-center space-x-2">
              <Select value={newAttributeKey} onValueChange={setNewAttributeKey}>
                <SelectTrigger className="w-40">
                  <SelectValue placeholder="Select attribute" />
                </SelectTrigger>
                <SelectContent>
                  {COMMON_SVG_ATTRIBUTES.filter(attr => 
                    !attributes.some(existing => existing.key === attr)
                  ).map(attrName => (
                    <SelectItem key={attrName} value={attrName}>
                      {attrName}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              
              <Input
                value={newAttributeValue}
                onChange={(e) => setNewAttributeValue(e.target.value)}
                placeholder="Value"
                className="flex-1"
              />
              
              <Button
                onClick={addAttribute}
                disabled={!newAttributeKey || !newAttributeValue}
                className="px-3"
              >
                <Plus className="w-4 h-4" />
              </Button>
            </div>
          </div>

          {/* Preview */}
          {attributes.length > 0 && (
            <div>
              <Label className="text-sm font-semibold">CSS Preview</Label>
              <div className="mt-2 p-3 bg-gray-100 rounded-lg text-xs font-mono">
                <span className="text-blue-600">.{editableClassName}</span> {'{'}
                <div className="ml-4">
                  {attributes.map((attr, index) => (
                    <div key={index} className="text-gray-800">
                      <span className="text-purple-600">{attr.key}</span>: <span className="text-green-600">{attr.value}</span>;
                    </div>
                  ))}
                </div>
                {'}'}
              </div>
            </div>
          )}
        </div>

        {/* Actions */}
        <div className="flex justify-between pt-4">
          <div>
            {allowRemove && (
              <Button 
                variant="destructive" 
                onClick={handleRemove}
                className="text-red-600 border-red-600 hover:bg-red-50"
              >
                <Trash2 className="w-4 h-4 mr-2" />
                Remove Style
              </Button>
            )}
          </div>
          <div className="flex space-x-2">
            <Button variant="outline" onClick={onClose}>
              Cancel
            </Button>
            <Button onClick={handleSave} className="bg-cream-500 hover:bg-cream-600">
              Save Changes
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}