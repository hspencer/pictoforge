import { useState } from "react";
import { Button } from "@/components/ui/button";
import { formatSvgCode } from "@/lib/svg-utils";
import { Copy, Check } from "lucide-react";

interface SvgCodeViewProps {
  svgCode: string;
  onCodeChange: (code: string) => void;
}

export default function SvgCodeView({ svgCode, onCodeChange }: SvgCodeViewProps) {
  const [copied, setCopied] = useState(false);
  
  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(svgCode);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error('Failed to copy code:', err);
    }
  };

  const formattedCode = formatSvgCode(svgCode);

  return (
    <div className="h-full flex flex-col">
      {/* Header */}
      <div className="bg-cream-300 border-b border-cream-400 px-4 py-3 flex items-center justify-between">
        <h3 className="text-sm font-semibold text-cream-800">SVG Source Code</h3>
        <Button
          variant="ghost"
          size="sm"
          onClick={handleCopy}
          className="text-cream-600 hover:text-cream-800 p-1"
        >
          {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
        </Button>
      </div>

      {/* Code Display */}
      <div className="flex-1 overflow-auto custom-scrollbar bg-white">
        <pre className="p-4 text-xs font-mono text-gray-800 whitespace-pre-wrap break-words">
          <code>{formattedCode}</code>
        </pre>
      </div>
    </div>
  );
}