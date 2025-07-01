import { useState, useRef, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { ChevronDown, ChevronRight, Send, Mic, Loader2, Settings, Brain, Tag, Layout, X, Palette, Plus } from 'lucide-react';
import GenerativePipeline from './generative-pipeline';

interface ChatMessage {
  id: string;
  type: 'user' | 'assistant';
  content: string;
  reasoning?: string[];
  svgResult?: string;
  showPipeline?: boolean;
  timestamp: Date;
}

interface PipelineConfig {
  intentClassification: string;
  nsmMappings: string;
  visualEmbeddings: string[];
  layoutTypology: string;
  styleSpecs: StyleSpec[];
}

interface StyleSpec {
  id: string;
  name: string;
  fill: string;
  stroke: string;
  strokeWidth: string;
}

interface ChatInterfaceProps {
  onSvgGenerated: (svgCode: string, prompt: string) => void;
}

// Tipologías estructurales de pictogramas
const LAYOUT_TYPOLOGIES = [
  { value: 'single-object', label: 'Objeto Simple', description: 'Un solo elemento central' },
  { value: 'scene-horizontal', label: 'Escena Horizontal', description: 'Elementos distribuidos horizontalmente' },
  { value: 'scene-vertical', label: 'Escena Vertical', description: 'Elementos apilados verticalmente' },
  { value: 'grid-2x2', label: 'Cuadrícula 2x2', description: 'Cuatro elementos en grid' },
  { value: 'radial', label: 'Radial', description: 'Elementos alrededor de un centro' },
  { value: 'sequential', label: 'Secuencial', description: 'Pasos o secuencia temporal' },
  { value: 'hierarchical', label: 'Jerárquico', description: 'Elementos con diferentes tamaños' },
  { value: 'comparative', label: 'Comparativo', description: 'Elementos contrastados' }
];

// Clasificaciones de intención
const INTENT_CLASSIFICATIONS = [
  { value: 'object', label: 'Objeto/Sustantivo' },
  { value: 'action', label: 'Acción/Verbo' },
  { value: 'emotion', label: 'Emoción/Estado' },
  { value: 'concept', label: 'Concepto Abstracto' },
  { value: 'place', label: 'Lugar/Ubicación' },
  { value: 'person', label: 'Persona/Rol' },
  { value: 'time', label: 'Tiempo/Temporal' },
  { value: 'quantity', label: 'Cantidad/Número' }
];

// Embeddings visuales comunes
const COMMON_VISUAL_EMBEDDINGS = [
  'persona', 'casa', 'corazón', 'sol', 'agua', 'fuego', 'tierra', 'aire',
  'mano', 'ojo', 'boca', 'flecha', 'círculo', 'cuadrado', 'línea', 'punto',
  'familia', 'comunidad', 'naturaleza', 'movimiento', 'tiempo', 'espacio'
];

export default function ChatInterface({ onSvgGenerated }: ChatInterfaceProps) {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [inputValue, setInputValue] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [expandedReasoning, setExpandedReasoning] = useState<Set<string>>(new Set());
  const [pipelineExpanded, setPipelineExpanded] = useState(false);
  const [pipelineConfig, setPipelineConfig] = useState<PipelineConfig>({
    intentClassification: 'object',
    nsmMappings: '',
    visualEmbeddings: [],
    layoutTypology: 'single-object',
    styleSpecs: [
      { id: '1', name: 'Black Style', fill: '#000000', stroke: '#FFFFFF', strokeWidth: '4' },
      { id: '2', name: 'White Style', fill: '#FFFFFF', stroke: '#000000', strokeWidth: '4' },
      { id: '3', name: 'Action', fill: '#50C878', stroke: '#2E7D4B', strokeWidth: '2' }
    ]
  });
  const [editingStyle, setEditingStyle] = useState<StyleSpec | null>(null);
  const [showStyleEditor, setShowStyleEditor] = useState(false);
  const [newEmbedding, setNewEmbedding] = useState('');
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // Funciones para manejar embeddings visuales
  const addEmbedding = (embedding: string) => {
    if (embedding && !pipelineConfig.visualEmbeddings.includes(embedding)) {
      setPipelineConfig(prev => ({
        ...prev,
        visualEmbeddings: [...prev.visualEmbeddings, embedding]
      }));
    }
  };

  const removeEmbedding = (embedding: string) => {
    setPipelineConfig(prev => ({
      ...prev,
      visualEmbeddings: prev.visualEmbeddings.filter(e => e !== embedding)
    }));
  };

  const handleAddCustomEmbedding = () => {
    if (newEmbedding.trim()) {
      addEmbedding(newEmbedding.trim());
      setNewEmbedding('');
    }
  };

  // Funciones para manejar estilos
  const addStyleSpec = () => {
    const newStyle: StyleSpec = {
      id: Date.now().toString(),
      name: `Estilo ${pipelineConfig.styleSpecs.length + 1}`,
      fill: '#64748B',
      stroke: '#374151',
      strokeWidth: '1'
    };
    setPipelineConfig(prev => ({
      ...prev,
      styleSpecs: [...prev.styleSpecs, newStyle]
    }));
  };

  const updateStyleSpec = (id: string, updates: Partial<StyleSpec>) => {
    setPipelineConfig(prev => ({
      ...prev,
      styleSpecs: prev.styleSpecs.map(style => 
        style.id === id ? { ...style, ...updates } : style
      )
    }));
  };

  const removeStyleSpec = (id: string) => {
    setPipelineConfig(prev => ({
      ...prev,
      styleSpecs: prev.styleSpecs.filter(style => style.id !== id)
    }));
  };

  const handleStyleClick = (style: StyleSpec) => {
    setEditingStyle(style);
    setShowStyleEditor(true);
  };

  const handleSubmit = async () => {
    if (!inputValue.trim() || isGenerating) return;

    const userMessage: ChatMessage = {
      id: Date.now().toString(),
      type: 'user',
      content: inputValue,
      timestamp: new Date()
    };

    setMessages(prev => [...prev, userMessage]);
    setInputValue('');
    setIsGenerating(true);

    try {
      // Create assistant message with reasoning summary
      const reasoning = [
        "Intent Classification: Identificado como comando directivo (confidence: 0.94)",
        "NSM Mapping: [SOMEONE][DO][MAKE][THING][GOOD] → estructurar cama",
        "Conceptual Blending: Persona + acción de organizar + objeto cama",
        "Icon Selection: Seleccionados íconos de ARASAAC - persona, cama, movimiento",
        "Visual Layout: Diseño secuencial horizontal mostrando antes/después",
        "Styling: Aplicado esquema alto contraste, líneas gruesas para AAC"
      ];

      const assistantMessage: ChatMessage = {
        id: (Date.now() + 1).toString(),
        type: 'assistant',
        content: `He analizado tu solicitud "${inputValue}" y ejecutado el pipeline de generación. El pictograma muestra una secuencia clara para hacer la cama, optimizada para comunicación AAC.`,
        reasoning,
        showPipeline: true,
        timestamp: new Date()
      };

      setMessages(prev => [...prev, assistantMessage]);

    } catch (error) {
      console.error('Generation failed:', error);
      const errorMessage: ChatMessage = {
        id: (Date.now() + 2).toString(),
        type: 'assistant',
        content: 'Lo siento, hubo un error al generar el pictograma. Por favor intenta nuevamente.',
        timestamp: new Date()
      };
      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setIsGenerating(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit();
    }
  };

  const toggleReasoning = (messageId: string) => {
    setExpandedReasoning(prev => {
      const newSet = new Set(prev);
      if (newSet.has(messageId)) {
        newSet.delete(messageId);
      } else {
        newSet.add(messageId);
      }
      return newSet;
    });
  };

  const adjustTextareaHeight = () => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = `${Math.min(textareaRef.current.scrollHeight, 120)}px`;
    }
  };

  useEffect(() => {
    adjustTextareaHeight();
  }, [inputValue]);

  return (
    <div className="flex flex-col h-full">
      {/* Messages Area */}
      <div className="flex-1 overflow-y-auto px-4 py-6 space-y-6">

        {messages.map((message) => (
          <div key={message.id} className={`flex ${message.type === 'user' ? 'justify-end' : 'justify-start'}`}>
            <div className={`max-w-[80%] ${message.type === 'user' ? 'bg-blue-500 text-white' : 'bg-gray-100'} rounded-lg p-4`}>
              {message.type === 'user' ? (
                <p className="whitespace-pre-wrap">{message.content}</p>
              ) : (
                <div className="space-y-3">
                  <p>{message.content}</p>
                  
                  {/* Reasoning Section */}
                  {message.reasoning && (
                    <Collapsible>
                      <CollapsibleTrigger 
                        onClick={() => toggleReasoning(message.id)}
                        className="flex items-center gap-2 text-sm text-gray-600 hover:text-gray-800 transition-colors"
                      >
                        {expandedReasoning.has(message.id) ? (
                          <ChevronDown className="w-4 h-4" />
                        ) : (
                          <ChevronRight className="w-4 h-4" />
                        )}
                        Ver proceso de razonamiento
                      </CollapsibleTrigger>
                      <CollapsibleContent className="mt-2">
                        <Card className="bg-gray-50">
                          <CardHeader className="pb-2">
                            <h4 className="text-sm font-medium text-gray-700">Proceso de generación:</h4>
                          </CardHeader>
                          <CardContent className="pt-0">
                            <ul className="space-y-1 text-sm text-gray-600">
                              {message.reasoning.map((step, index) => (
                                <li key={index} className="flex items-start gap-2">
                                  <span className="text-blue-500 font-medium">{index + 1}.</span>
                                  <span>{step}</span>
                                </li>
                              ))}
                            </ul>
                          </CardContent>
                        </Card>
                      </CollapsibleContent>
                    </Collapsible>
                  )}

                  {/* Pipeline Interface */}
                  {message.showPipeline && (
                    <div className="mt-4">
                      <GenerativePipeline
                        input={(() => {
                          // Find the user message that triggered this assistant response
                          const messageIndex = messages.findIndex(m => m.id === message.id);
                          const userMessage = messages[messageIndex - 1];
                          return userMessage?.content || '';
                        })()}
                        onComplete={(svgResult) => {
                          // Update message with SVG result
                          setMessages(prev => prev.map(msg => 
                            msg.id === message.id 
                              ? { ...msg, svgResult, showPipeline: false }
                              : msg
                          ));
                          // Pass result to parent component
                          const messageIndex = messages.findIndex(m => m.id === message.id);
                          const userMessage = messages[messageIndex - 1];
                          onSvgGenerated(svgResult, userMessage?.content || '');
                          setIsGenerating(false);
                        }}
                        onStepUpdate={(stepId, status, output) => {
                          // Optional: Handle step updates for real-time feedback
                        }}
                      />
                    </div>
                  )}

                  {/* SVG Result */}
                  {message.svgResult && (
                    <div className="mt-4 p-4 bg-white rounded-lg border">
                      <div className="flex justify-center">
                        <div 
                          dangerouslySetInnerHTML={{ __html: message.svgResult }}
                          className="max-w-[200px] max-h-[200px]"
                        />
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        ))}
        <div ref={messagesEndRef} />
      </div>

      {/* Input Area */}
      <div className="border-t border-gray-200 p-4">
        <div className="relative">
          <Textarea
            ref={textareaRef}
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Describe el pictograma que quieres generar... (ej: Make the bed)"
            className="min-h-[80px] max-h-[160px] resize-none pr-20 pl-4 pt-4 pb-4 rounded-xl border-gray-300 focus:border-blue-500 focus:ring-blue-500 w-full text-base"
            disabled={isGenerating}
          />
          <div className="absolute bottom-3 left-3 flex gap-1">
            <Button variant="ghost" size="sm" className="w-8 h-8 p-0 hover:bg-gray-100">
              <Mic className="w-4 h-4 text-gray-500" />
            </Button>
          </div>
          <Button 
            onClick={handleSubmit} 
            disabled={!inputValue.trim() || isGenerating}
            className="absolute bottom-3 right-3 h-8 px-4 rounded-lg bg-blue-500 hover:bg-blue-600 disabled:opacity-50 text-white font-medium"
            size="sm"
          >
            {isGenerating ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin mr-2" />
                Generando...
              </>
            ) : (
              <>
                <Send className="w-4 h-4 mr-2" />
                Generar
              </>
            )}
          </Button>
        </div>

        {/* Pipeline Generativo Colapsable */}
        <Collapsible open={pipelineExpanded} onOpenChange={setPipelineExpanded}>
          <CollapsibleTrigger asChild>
            <Button
              variant="ghost"
              className="w-full mt-3 p-3 rounded-lg border border-gray-200 hover:bg-gray-50 flex items-center justify-between text-sm font-medium text-gray-700"
            >
              <div className="flex items-center gap-2">
                <Brain className="w-4 h-4 text-blue-500" />
                <span>
                  {pipelineConfig.intentClassification === 'object' ? 'Objeto' : 
                   pipelineConfig.intentClassification === 'action' ? 'Acción' :
                   pipelineConfig.intentClassification === 'emotion' ? 'Emoción' :
                   pipelineConfig.intentClassification === 'concept' ? 'Concepto' :
                   pipelineConfig.intentClassification === 'place' ? 'Lugar' :
                   pipelineConfig.intentClassification === 'person' ? 'Persona' :
                   pipelineConfig.intentClassification === 'time' ? 'Tiempo' : 'Cantidad'} - 
                  {pipelineConfig.visualEmbeddings.length > 0 
                    ? pipelineConfig.visualEmbeddings.slice(0, 3).join(', ') + 
                      (pipelineConfig.visualEmbeddings.length > 3 ? '...' : '')
                    : 'Embeddings visuales'
                  }
                </span>
              </div>
              {pipelineExpanded ? <ChevronDown className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
            </Button>
          </CollapsibleTrigger>
          
          <CollapsibleContent className="mt-3">
            <Card className="border border-gray-200 shadow-sm">
              <CardContent className="p-4 space-y-4">
                
                {/* 1. Intent Classification */}
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <div className="w-6 h-6 bg-blue-500 text-white rounded-full flex items-center justify-center text-xs font-bold">1</div>
                    <Settings className="w-4 h-4 text-blue-500" />
                    <label className="text-sm font-medium text-gray-700">Clasificación de Intención</label>
                  </div>
                  <Select 
                    value={pipelineConfig.intentClassification} 
                    onValueChange={(value) => setPipelineConfig(prev => ({ ...prev, intentClassification: value }))}
                  >
                    <SelectTrigger className="w-full">
                      <SelectValue placeholder="Selecciona el tipo de concepto" />
                    </SelectTrigger>
                    <SelectContent>
                      {INTENT_CLASSIFICATIONS.map((intent) => (
                        <SelectItem key={intent.value} value={intent.value}>
                          {intent.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {/* 2. NSM Mappings */}
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <div className="w-6 h-6 bg-green-500 text-white rounded-full flex items-center justify-center text-xs font-bold">2</div>
                    <Brain className="w-4 h-4 text-green-500" />
                    <label className="text-sm font-medium text-gray-700">Explicación Semántica (NSM)</label>
                  </div>
                  <Textarea
                    value={pipelineConfig.nsmMappings}
                    onChange={(e) => setPipelineConfig(prev => ({ ...prev, nsmMappings: e.target.value }))}
                    placeholder="Describe el concepto en términos simples y universales..."
                    className="min-h-[80px] resize-none"
                    rows={3}
                  />
                </div>

                {/* 3. Visual Embeddings */}
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <div className="w-6 h-6 bg-purple-500 text-white rounded-full flex items-center justify-center text-xs font-bold">3</div>
                    <Tag className="w-4 h-4 text-purple-500" />
                    <label className="text-sm font-medium text-gray-700">Embeddings Visuales (Tags)</label>
                  </div>
                  
                  {/* Current Embeddings */}
                  <div className="flex flex-wrap gap-2 mb-2">
                    {pipelineConfig.visualEmbeddings.map((embedding) => (
                      <span
                        key={embedding}
                        className="inline-flex items-center gap-1 px-2 py-1 bg-purple-100 text-purple-800 rounded-full text-xs font-medium"
                      >
                        {embedding}
                        <Button
                          variant="ghost"
                          size="sm"
                          className="w-4 h-4 p-0 hover:bg-purple-200 rounded-full"
                          onClick={() => removeEmbedding(embedding)}
                        >
                          <X className="w-3 h-3" />
                        </Button>
                      </span>
                    ))}
                  </div>

                  {/* Add Custom Embedding */}
                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={newEmbedding}
                      onChange={(e) => setNewEmbedding(e.target.value)}
                      placeholder="Añadir embedding personalizado..."
                      className="flex-1 px-3 py-1 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500"
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') {
                          e.preventDefault();
                          handleAddCustomEmbedding();
                        }
                      }}
                    />
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={handleAddCustomEmbedding}
                      disabled={!newEmbedding.trim()}
                    >
                      Añadir
                    </Button>
                  </div>

                  {/* Common Embeddings */}
                  <div className="space-y-2">
                    <p className="text-xs text-gray-500">Embeddings comunes:</p>
                    <div className="flex flex-wrap gap-1">
                      {COMMON_VISUAL_EMBEDDINGS.filter(embedding => 
                        !pipelineConfig.visualEmbeddings.includes(embedding)
                      ).map((embedding) => (
                        <Button
                          key={embedding}
                          variant="outline"
                          size="sm"
                          className="h-6 px-2 text-xs"
                          onClick={() => addEmbedding(embedding)}
                        >
                          + {embedding}
                        </Button>
                      ))}
                    </div>
                  </div>
                </div>

                {/* 4. Layout Typology */}
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <div className="w-6 h-6 bg-orange-500 text-white rounded-full flex items-center justify-center text-xs font-bold">4</div>
                    <Layout className="w-4 h-4 text-orange-500" />
                    <label className="text-sm font-medium text-gray-700">Tipología de Layout</label>
                  </div>
                  <Select 
                    value={pipelineConfig.layoutTypology} 
                    onValueChange={(value) => setPipelineConfig(prev => ({ ...prev, layoutTypology: value }))}
                  >
                    <SelectTrigger className="w-full">
                      <SelectValue placeholder="Selecciona el tipo de estructura" />
                    </SelectTrigger>
                    <SelectContent>
                      {LAYOUT_TYPOLOGIES.map((layout) => (
                        <SelectItem key={layout.value} value={layout.value}>
                          <div className="flex flex-col">
                            <span className="font-medium">{layout.label}</span>
                            <span className="text-xs text-gray-500">{layout.description}</span>
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {/* Preview de Layout */}
                <div className="space-y-2">
                  <p className="text-xs text-gray-500">Vista previa del layout:</p>
                  <div className="w-full h-20 bg-gray-50 rounded-md border border-gray-200 flex items-center justify-center">
                    <div className="text-xs text-gray-400">
                      {LAYOUT_TYPOLOGIES.find(l => l.value === pipelineConfig.layoutTypology)?.description || 'Preview del layout'}
                    </div>
                  </div>
                </div>

                {/* 5. Style & Specs - Biblioteca de Estilos */}
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <div className="w-6 h-6 bg-indigo-500 text-white rounded-full flex items-center justify-center text-xs font-bold">5</div>
                    <Palette className="w-4 h-4 text-indigo-500" />
                    <label className="text-sm font-medium text-gray-700">Biblioteca de Estilos Gráficos</label>
                  </div>
                  
                  {/* Estilos Existentes */}
                  <div className="flex flex-wrap gap-2 mb-2">
                    {pipelineConfig.styleSpecs.map((style) => (
                      <div
                        key={style.id}
                        onClick={() => handleStyleClick(style)}
                        className="relative cursor-pointer group"
                        title={`${style.name} - Click para editar`}
                      >
                        <div className="flex items-center gap-1 p-1 border border-gray-200 rounded-md hover:border-indigo-300 bg-white">
                          {/* Círculo de muestra con fill y stroke */}
                          <div
                            className="w-6 h-6 rounded-full border-2"
                            style={{
                              backgroundColor: style.fill,
                              borderColor: style.stroke,
                              borderWidth: `${style.strokeWidth}px`
                            }}
                          />
                          <span className="text-xs text-gray-600 pr-1">{style.name}</span>
                          <Button
                            variant="ghost"
                            size="sm"
                            className="w-4 h-4 p-0 hover:bg-red-100 opacity-0 group-hover:opacity-100 transition-opacity"
                            onClick={(e) => {
                              e.stopPropagation();
                              removeStyleSpec(style.id);
                            }}
                          >
                            <X className="w-3 h-3 text-red-500" />
                          </Button>
                        </div>
                      </div>
                    ))}
                    
                    {/* Botón para agregar nuevo estilo */}
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={addStyleSpec}
                      className="h-8 px-2 border-dashed border-indigo-300 text-indigo-600 hover:bg-indigo-50"
                    >
                      <Plus className="w-3 h-3 mr-1" />
                      Agregar Estilo
                    </Button>
                  </div>

                  <p className="text-xs text-gray-500">
                    Click en cualquier círculo para editar los colores y propiedades de ese estilo
                  </p>
                </div>

              </CardContent>
            </Card>
          </CollapsibleContent>
        </Collapsible>

        {/* Modal de Edición de Estilos */}
        <Dialog open={showStyleEditor} onOpenChange={setShowStyleEditor}>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle>Editar Estilo: {editingStyle?.name}</DialogTitle>
            </DialogHeader>
            {editingStyle && (
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="style-name">Nombre del Estilo</Label>
                  <Input
                    id="style-name"
                    value={editingStyle.name}
                    onChange={(e) => setEditingStyle({ ...editingStyle, name: e.target.value })}
                    placeholder="Nombre del estilo"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="style-fill">Color de Relleno (Fill)</Label>
                  <div className="flex gap-2">
                    <Input
                      id="style-fill"
                      type="color"
                      value={editingStyle.fill}
                      onChange={(e) => setEditingStyle({ ...editingStyle, fill: e.target.value })}
                      className="w-16 h-10 p-1 border border-gray-300 rounded cursor-pointer"
                    />
                    <Input
                      value={editingStyle.fill}
                      onChange={(e) => setEditingStyle({ ...editingStyle, fill: e.target.value })}
                      placeholder="#3B82F6"
                      className="flex-1"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="style-stroke">Color de Borde (Stroke)</Label>
                  <div className="flex gap-2">
                    <Input
                      id="style-stroke"
                      type="color"
                      value={editingStyle.stroke}
                      onChange={(e) => setEditingStyle({ ...editingStyle, stroke: e.target.value })}
                      className="w-16 h-10 p-1 border border-gray-300 rounded cursor-pointer"
                    />
                    <Input
                      value={editingStyle.stroke}
                      onChange={(e) => setEditingStyle({ ...editingStyle, stroke: e.target.value })}
                      placeholder="#1E40AF"
                      className="flex-1"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="style-stroke-width">Grosor del Borde</Label>
                  <Input
                    id="style-stroke-width"
                    type="number"
                    min="0"
                    max="10"
                    step="0.5"
                    value={editingStyle.strokeWidth}
                    onChange={(e) => setEditingStyle({ ...editingStyle, strokeWidth: e.target.value })}
                    placeholder="2"
                  />
                </div>

                {/* Vista Previa */}
                <div className="space-y-2">
                  <Label>Vista Previa</Label>
                  <div className="flex items-center justify-center p-4 bg-gray-50 rounded-md">
                    <div
                      className="w-12 h-12 rounded-full"
                      style={{
                        backgroundColor: editingStyle.fill,
                        border: `${editingStyle.strokeWidth}px solid ${editingStyle.stroke}`
                      }}
                    />
                  </div>
                </div>

                <div className="flex gap-2 pt-4">
                  <Button
                    variant="outline"
                    onClick={() => setShowStyleEditor(false)}
                    className="flex-1"
                  >
                    Cancelar
                  </Button>
                  <Button
                    onClick={() => {
                      updateStyleSpec(editingStyle.id, editingStyle);
                      setShowStyleEditor(false);
                      setEditingStyle(null);
                    }}
                    className="flex-1"
                  >
                    Guardar Cambios
                  </Button>
                </div>
              </div>
            )}
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
}