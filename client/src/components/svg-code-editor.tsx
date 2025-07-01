import { useEffect, useRef } from "react";
import { Button } from "@/components/ui/button";
import { AlignLeft, CheckCircle } from "lucide-react";
import { formatSvgCode, validateSvgCode } from "@/lib/svg-utils";

interface SvgCodeEditorProps {
  code: string;
  onChange: (code: string) => void;
  language?: 'xml' | 'css';
  selectedElementId?: string | null;
}

export default function SvgCodeEditor({ code, onChange, language = 'xml', selectedElementId }: SvgCodeEditorProps) {
  const editorRef = useRef<HTMLTextAreaElement>(null);

  const handleFormat = () => {
    const formatted = formatSvgCode(code);
    onChange(formatted);
  };

  const handleValidate = () => {
    const isValid = validateSvgCode(code);
    console.log('SVG validation:', isValid ? 'Valid' : 'Invalid');
  };

  const handleCodeChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    onChange(e.target.value);
  };

  useEffect(() => {
    if (editorRef.current) {
      const textarea = editorRef.current;
      const cursorPosition = textarea.selectionStart;
      textarea.value = code;
      textarea.setSelectionRange(cursorPosition, cursorPosition);
    }
  }, [code]);

  return (
    <div className="h-full flex flex-col">
      {/* Editor Header */}
      <div className="flex items-center justify-between bg-cream-100 border-b border-cream-300 px-4 py-2">
        <h3 className="text-sm font-semibold text-cream-800">
          {language === 'css' ? 'CSS Styles' : 'SVG Source'}
        </h3>
        <div className="flex space-x-2">
          <Button
            size="sm"
            variant="ghost"
            onClick={handleFormat}
            className="text-cream-600 hover:text-cream-800 text-xs h-6"
          >
            <AlignLeft className="w-3 h-3 mr-1" />
            Format
          </Button>
          <Button
            size="sm"
            variant="ghost"
            onClick={handleValidate}
            className="text-cream-600 hover:text-cream-800 text-xs h-6"
          >
            <CheckCircle className="w-3 h-3 mr-1" />
            Validate
          </Button>
        </div>
      </div>

      {/* Code Editor */}
      <div className="flex-1 relative">
        <textarea
          ref={editorRef}
          value={code}
          onChange={handleCodeChange}
          className="w-full h-full p-4 font-mono text-sm bg-white border-0 resize-none focus:outline-none custom-scrollbar"
          style={{
            fontFamily: 'JetBrains Mono, monospace',
            lineHeight: '1.5',
            tabSize: 2,
          }}
          spellCheck={false}
          placeholder={language === 'css' ? 'Enter CSS styles...' : 'Enter SVG code...'}
        />
        
        {/* Syntax highlighting overlay would go here in a real implementation */}
        <div className="absolute inset-0 pointer-events-none p-4 font-mono text-sm whitespace-pre-wrap opacity-0">
          {/* This would contain the syntax-highlighted version */}
        </div>
      </div>
    </div>
  );
}
