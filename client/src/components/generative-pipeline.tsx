import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Slider } from '@/components/ui/slider';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { ChevronDown, ChevronRight, Settings, Play, Pause, RotateCcw, Check } from 'lucide-react';

interface PipelineStep {
  id: string;
  name: string;
  description: string;
  status: 'pending' | 'running' | 'completed' | 'error';
  progress: number;
  input: string;
  output?: string;
  parameters: PipelineParameter[];
  model?: string;
}

interface PipelineParameter {
  id: string;
  name: string;
  type: 'select' | 'slider' | 'boolean' | 'text';
  value: any;
  options?: { label: string; value: any }[];
  min?: number;
  max?: number;
  step?: number;
  description?: string;
}

interface GenerativePipelineProps {
  input: string;
  onComplete: (result: string) => void;
  onStepUpdate?: (stepId: string, status: PipelineStep['status'], output?: string) => void;
}

const initialPipelineSteps: PipelineStep[] = [
  {
    id: 'intent-classification',
    name: 'Intent Classification',
    description: 'Clasifica la intención comunicativa del mensaje (deseo, pregunta, afirmación)',
    status: 'pending',
    progress: 0,
    input: 'Raw or tokenised text',
    model: 'RoBERTa-base',
    parameters: [
      {
        id: 'confidence-threshold',
        name: 'Umbral de confianza',
        type: 'slider',
        value: 0.7,
        min: 0.1,
        max: 1.0,
        step: 0.1,
        description: 'Mínima confianza requerida para clasificación'
      },
      {
        id: 'multilingual',
        name: 'Soporte multiidioma',
        type: 'boolean',
        value: true,
        description: 'Usar modelo BERT-Multilingual'
      }
    ]
  },
  {
    id: 'nsm-mapping',
    name: 'NSM Mapping',
    description: 'Convierte expresiones lingüísticas en primitivos semánticos NSM',
    status: 'pending',
    progress: 0,
    input: 'Raw or tokenised text',
    model: 'NSM Corpus',
    parameters: [
      {
        id: 'decomposition-level',
        name: 'Nivel de descomposición',
        type: 'select',
        value: 'medium',
        options: [
          { label: 'Básico', value: 'basic' },
          { label: 'Medio', value: 'medium' },
          { label: 'Avanzado', value: 'advanced' }
        ],
        description: 'Profundidad del análisis semántico'
      },
      {
        id: 'preserve-cultural-context',
        name: 'Preservar contexto cultural',
        type: 'boolean',
        value: true,
        description: 'Mantener matices culturales específicos'
      }
    ]
  },
  {
    id: 'conceptual-blending',
    name: 'Conceptual Blending',
    description: 'Fusiona agentes, acciones y modificadores en unidades visuales coherentes',
    status: 'pending',
    progress: 0,
    input: 'Tokenised text + semantic frames',
    model: 'ConceptNet + TARS',
    parameters: [
      {
        id: 'visual-priority',
        name: 'Prioridad visual',
        type: 'select',
        value: 'iconic',
        options: [
          { label: 'Icónico', value: 'iconic' },
          { label: 'Simbólico', value: 'symbolic' },
          { label: 'Mixto', value: 'mixed' }
        ],
        description: 'Tipo de representación visual preferida'
      },
      {
        id: 'complexity-score',
        name: 'Nivel de complejidad',
        type: 'slider',
        value: 5,
        min: 1,
        max: 10,
        step: 1,
        description: 'Complejidad visual del resultado (1=simple, 10=complejo)'
      }
    ]
  },
  {
    id: 'icon-selection',
    name: 'Icon Selection/Creation',
    description: 'Selecciona íconos existentes o propone creación considerando contexto',
    status: 'pending',
    progress: 0,
    input: 'Lista de conceptos',
    model: 'ARASAAC API + Búsqueda semántica',
    parameters: [
      {
        id: 'icon-source',
        name: 'Fuente de íconos',
        type: 'select',
        value: 'arasaac',
        options: [
          { label: 'ARASAAC', value: 'arasaac' },
          { label: 'Base propia', value: 'custom' },
          { label: 'Mixto', value: 'mixed' }
        ],
        description: 'Base de datos de íconos a utilizar'
      },
      {
        id: 'create-missing',
        name: 'Crear íconos faltantes',
        type: 'boolean',
        value: true,
        description: 'Generar nuevos íconos si no existen'
      },
      {
        id: 'cultural-adaptation',
        name: 'Adaptación cultural',
        type: 'slider',
        value: 7,
        min: 1,
        max: 10,
        step: 1,
        description: 'Nivel de adaptación al contexto cultural'
      }
    ]
  },
  {
    id: 'visual-layout',
    name: 'Visual Layout Planner',
    description: 'Determina disposición espacial, jerarquía visual y relaciones topológicas',
    status: 'pending',
    progress: 0,
    input: 'Lista de íconos + modificadores',
    model: 'FLAN-T5 + BART',
    parameters: [
      {
        id: 'layout-style',
        name: 'Estilo de layout',
        type: 'select',
        value: 'balanced',
        options: [
          { label: 'Centrado', value: 'centered' },
          { label: 'Balanceado', value: 'balanced' },
          { label: 'Jerárquico', value: 'hierarchical' },
          { label: 'Narrativo', value: 'narrative' }
        ],
        description: 'Disposición espacial de elementos'
      },
      {
        id: 'element-spacing',
        name: 'Espaciado entre elementos',
        type: 'slider',
        value: 15,
        min: 5,
        max: 50,
        step: 5,
        description: 'Distancia entre elementos visuales (px)'
      },
      {
        id: 'use-connections',
        name: 'Mostrar conexiones',
        type: 'boolean',
        value: false,
        description: 'Dibujar líneas de conexión entre elementos relacionados'
      }
    ]
  },
  {
    id: 'styling-metadata',
    name: 'Styling + Metadata',
    description: 'Aplica estilos personalizados y embebe metadata para trazabilidad',
    status: 'pending',
    progress: 0,
    input: 'SVG estructural con entidades y clases',
    model: 'CodeT5+ + SVG-VAE',
    parameters: [
      {
        id: 'color-scheme',
        name: 'Esquema de colores',
        type: 'select',
        value: 'high-contrast',
        options: [
          { label: 'Alto contraste', value: 'high-contrast' },
          { label: 'Colores suaves', value: 'soft' },
          { label: 'Monocromático', value: 'monochrome' },
          { label: 'Personalizado', value: 'custom' }
        ],
        description: 'Paleta de colores para accesibilidad'
      },
      {
        id: 'line-thickness',
        name: 'Grosor de líneas',
        type: 'slider',
        value: 3,
        min: 1,
        max: 8,
        step: 1,
        description: 'Grosor de contornos y líneas (px)'
      },
      {
        id: 'add-animations',
        name: 'Agregar animaciones',
        type: 'boolean',
        value: false,
        description: 'Incluir animaciones CSS para elementos interactivos'
      },
      {
        id: 'embed-metadata',
        name: 'Incluir metadata',
        type: 'boolean',
        value: true,
        description: 'Embeber información de trazabilidad y accesibilidad'
      }
    ]
  }
];

export default function GenerativePipeline({ input, onComplete, onStepUpdate }: GenerativePipelineProps) {
  const [steps, setSteps] = useState<PipelineStep[]>(initialPipelineSteps);
  const [isRunning, setIsRunning] = useState(false);
  const [currentStepIndex, setCurrentStepIndex] = useState(0);
  const [expandedSteps, setExpandedSteps] = useState<Set<string>>(new Set());

  const updateStepParameter = (stepId: string, parameterId: string, value: any) => {
    setSteps(prevSteps => 
      prevSteps.map(step => 
        step.id === stepId 
          ? {
              ...step,
              parameters: step.parameters.map(param =>
                param.id === parameterId ? { ...param, value } : param
              )
            }
          : step
      )
    );
  };

  const toggleStepExpanded = (stepId: string) => {
    setExpandedSteps(prev => {
      const newSet = new Set(prev);
      if (newSet.has(stepId)) {
        newSet.delete(stepId);
      } else {
        newSet.add(stepId);
      }
      return newSet;
    });
  };

  const runPipeline = async () => {
    setIsRunning(true);
    setCurrentStepIndex(0);

    for (let i = 0; i < steps.length; i++) {
      const step = steps[i];
      setCurrentStepIndex(i);
      
      // Update step to running
      setSteps(prevSteps => 
        prevSteps.map((s, index) => 
          index === i ? { ...s, status: 'running', progress: 0 } : s
        )
      );

      // Simulate step execution with progress
      for (let progress = 0; progress <= 100; progress += 20) {
        await new Promise(resolve => setTimeout(resolve, 200));
        setSteps(prevSteps => 
          prevSteps.map((s, index) => 
            index === i ? { ...s, progress } : s
          )
        );
      }

      // Generate mock output based on step
      const mockOutput = generateMockOutput(step, input);
      
      // Complete step
      setSteps(prevSteps => 
        prevSteps.map((s, index) => 
          index === i ? { ...s, status: 'completed', progress: 100, output: mockOutput } : s
        )
      );

      onStepUpdate?.(step.id, 'completed', mockOutput);
    }

    // Generate final SVG result
    const finalSvg = generateFinalSvg(input, steps);
    onComplete(finalSvg);
    setIsRunning(false);
  };

  const resetPipeline = () => {
    setSteps(prevSteps => 
      prevSteps.map(step => ({ 
        ...step, 
        status: 'pending', 
        progress: 0, 
        output: undefined 
      }))
    );
    setCurrentStepIndex(0);
    setIsRunning(false);
  };

  const generateMockOutput = (step: PipelineStep, input: string): string => {
    switch (step.id) {
      case 'intent-classification':
        return 'Intent: assertive (confidence: 0.89)';
      case 'nsm-mapping':
        return 'NSM: [WANT][DO][SOMETHING][GOOD]';
      case 'conceptual-blending':
        return 'Concepts: persona+acción+objeto, prioridad: icónico';
      case 'icon-selection':
        return 'Icons: persona.svg, acción_hacer.svg, objeto_positivo.svg';
      case 'visual-layout':
        return 'Layout: centrado, jerarquía horizontal, espaciado 15px';
      case 'styling-metadata':
        return 'Estilos aplicados, metadata embebido, accesibilidad optimizada';
      default:
        return `Procesado: ${step.name}`;
    }
  };

  const generateFinalSvg = (input: string, steps: PipelineStep[]): string => {
    return `<svg viewBox="0 0 400 300" xmlns="http://www.w3.org/2000/svg">
      <!-- Generated with PictoNet Pipeline -->
      <metadata>
        <title>${input}</title>
        <description>Pictogram generated through AI pipeline</description>
      </metadata>
      
      <defs>
        <style>
          .black-style { fill: black; stroke: white; stroke-width: 4; }
          .white-style { fill: white; stroke: black; stroke-width: 4; }
          .action { fill: #50C878; stroke: #2E7D4B; stroke-width: 2; }
        </style>
      </defs>
      
      <!-- Person body (black with white outline) -->
      <circle cx="100" cy="100" r="30" class="black-style"/>
      <rect x="85" y="130" width="30" height="60" rx="15" class="black-style"/>
      
      <!-- Action indicator -->
      <path d="M 140 120 Q 180 100 220 120" stroke="#50C878" stroke-width="4" fill="none" marker-end="url(#arrow)"/>
      
      <!-- Bed (white with black outline) -->
      <rect x="240" y="90" width="80" height="50" rx="10" class="white-style"/>
      <rect x="250" y="85" width="60" height="10" rx="5" class="white-style"/>
      <text x="280" y="120" text-anchor="middle" font-family="Arial" font-size="12" fill="black">BED</text>
      
      <!-- Input text -->
      <text x="200" y="250" text-anchor="middle" font-family="Arial" font-size="14" fill="#333">${input}</text>
      
      <defs>
        <marker id="arrow" markerWidth="10" markerHeight="10" refX="8" refY="3" orient="auto" markerUnits="strokeWidth">
          <path d="M0,0 L0,6 L9,3 z" fill="#50C878"/>
        </marker>
      </defs>
    </svg>`;
  };

  const renderParameter = (stepId: string, param: PipelineParameter) => {
    switch (param.type) {
      case 'select':
        return (
          <Select
            value={param.value}
            onValueChange={(value) => updateStepParameter(stepId, param.id, value)}
          >
            <SelectTrigger className="w-full">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {param.options?.map((option) => (
                <SelectItem key={option.value} value={option.value}>
                  {option.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        );
        
      case 'slider':
        return (
          <div className="space-y-2">
            <Slider
              value={[param.value]}
              onValueChange={([value]) => updateStepParameter(stepId, param.id, value)}
              min={param.min}
              max={param.max}
              step={param.step}
              className="w-full"
            />
            <div className="text-sm text-gray-500 text-center">{param.value}</div>
          </div>
        );
        
      case 'boolean':
        return (
          <Switch
            checked={param.value}
            onCheckedChange={(checked) => updateStepParameter(stepId, param.id, checked)}
          />
        );
        
      default:
        return null;
    }
  };

  return (
    <div className="space-y-4">
      {/* Pipeline Controls */}
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold">Pipeline Generativo</h3>
        <div className="flex gap-2">
          <Button 
            onClick={runPipeline} 
            disabled={isRunning}
            className="flex items-center gap-2"
          >
            <Play className="w-4 h-4" />
            {isRunning ? 'Ejecutando...' : 'Ejecutar Pipeline'}
          </Button>
          <Button 
            variant="outline" 
            onClick={resetPipeline}
            disabled={isRunning}
          >
            <RotateCcw className="w-4 h-4" />
          </Button>
        </div>
      </div>

      {/* Pipeline Steps */}
      <div className="space-y-3">
        {steps.map((step, index) => (
          <Card key={step.id} className={`transition-all ${
            step.status === 'running' ? 'ring-2 ring-blue-500' : 
            step.status === 'completed' ? 'ring-2 ring-green-500' : ''
          }`}>
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium ${
                    step.status === 'completed' ? 'bg-green-500 text-white' :
                    step.status === 'running' ? 'bg-blue-500 text-white' :
                    'bg-gray-200 text-gray-600'
                  }`}>
                    {step.status === 'completed' ? <Check className="w-4 h-4" /> : index + 1}
                  </div>
                  <div>
                    <CardTitle className="text-sm">{step.name}</CardTitle>
                    <p className="text-xs text-gray-600">{step.description}</p>
                    {step.model && (
                      <Badge variant="outline" className="text-xs mt-1">
                        {step.model}
                      </Badge>
                    )}
                  </div>
                </div>
                
                <Collapsible>
                  <CollapsibleTrigger 
                    onClick={() => toggleStepExpanded(step.id)}
                    className="flex items-center gap-1 text-sm text-gray-600 hover:text-gray-800"
                  >
                    <Settings className="w-4 h-4" />
                    {expandedSteps.has(step.id) ? (
                      <ChevronDown className="w-4 h-4" />
                    ) : (
                      <ChevronRight className="w-4 h-4" />
                    )}
                  </CollapsibleTrigger>
                </Collapsible>
              </div>
              
              {step.status === 'running' && (
                <div className="mt-2">
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div 
                      className="bg-blue-500 h-2 rounded-full transition-all duration-300"
                      style={{ width: `${step.progress}%` }}
                    />
                  </div>
                </div>
              )}
              
              {step.output && (
                <div className="mt-2 p-2 bg-gray-50 rounded text-sm">
                  <strong>Output:</strong> {step.output}
                </div>
              )}
            </CardHeader>
            
            <Collapsible open={expandedSteps.has(step.id)}>
              <CollapsibleContent>
                <CardContent className="pt-0">
                  <div className="space-y-4">
                    {step.parameters.map((param) => (
                      <div key={param.id} className="space-y-2">
                        <label className="text-sm font-medium">{param.name}</label>
                        {renderParameter(step.id, param)}
                        {param.description && (
                          <p className="text-xs text-gray-500">{param.description}</p>
                        )}
                      </div>
                    ))}
                  </div>
                </CardContent>
              </CollapsibleContent>
            </Collapsible>
          </Card>
        ))}
      </div>
    </div>
  );
}