import { Button } from "@/components/ui/button";
import { Circle, Square, Edit, Layers, Type, Minus } from "lucide-react";
import { SvgElement } from "@shared/schema";

interface FloatingToolbarProps {
  onAddElement: (type: SvgElement['type']) => void;
}

export default function FloatingToolbar({ onAddElement }: FloatingToolbarProps) {
  const tools = [
    { type: 'circle' as const, icon: Circle, title: 'Add Circle' },
    { type: 'rect' as const, icon: Square, title: 'Add Rectangle' },
    { type: 'path' as const, icon: Edit, title: 'Add Path' },
    { type: 'line' as const, icon: Minus, title: 'Add Line' },
    { type: 'text' as const, icon: Type, title: 'Add Text' },
    { type: 'g' as const, icon: Layers, title: 'Add Group' },
  ];

  return (
    <div className="fixed bottom-6 right-6 bg-white rounded-lg shadow-lg border border-cream-300 p-4">
      <div className="flex items-center space-x-3">
        <div className="text-xs text-cream-600 font-medium">Quick Tools:</div>
        {tools.map((tool) => {
          const Icon = tool.icon;
          return (
            <Button
              key={tool.type}
              size="sm"
              variant="outline"
              onClick={() => onAddElement(tool.type)}
              className="w-8 h-8 p-0 border-cream-300 text-cream-600 hover:text-cream-800 hover:bg-cream-200"
              title={tool.title}
            >
              <Icon className="w-4 h-4" />
            </Button>
          );
        })}
      </div>
    </div>
  );
}
