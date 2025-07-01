# PictoNet AI Model Integration Guide

## Overview

PictoNet is designed to support multiple SVG generation models through a unified API interface. This document outlines how to integrate various AI models for automatic pictogram generation.

## Supported Models Architecture

The platform is built to accommodate several state-of-the-art SVG generation models:

- **OmniSVG** - Multi-modal SVG generation
- **SVGDreamer** - Text-to-SVG with semantic understanding  
- **SVG Fusion** - Vector fusion techniques
- **StarVector** - Star-based vector generation
- **VectorFusion** - Advanced vector synthesis

## Server Integration Points

### 1. Model Endpoint Structure

Each model should expose a standardized REST API endpoint:

```typescript
POST /api/models/:modelName/generate
Content-Type: application/json

{
  "prompt": "string",           // Text description
  "instance": "string",         // Instance context (aotearoa, tea-chile, etc.)
  "style": "object",           // CSS style preferences
  "dimensions": {              // Canvas dimensions
    "width": 100,
    "height": 100
  },
  "constraints": {             // Generation constraints
    "maxPaths": 20,
    "colorPalette": ["#000", "#fff"],
    "semanticTags": ["person", "action"]
  }
}
```

### 2. Expected Response Format

```typescript
{
  "success": boolean,
  "svg": "string",             // Generated SVG code
  "metadata": {
    "model": "string",         // Model identifier
    "generationTime": number,  // Time in milliseconds
    "confidence": number,      // Model confidence (0-1)
    "semanticTags": string[],  // Detected semantic tags
    "styleClasses": string[]   // Applied CSS classes
  },
  "alternatives": [            // Optional alternative generations
    {
      "svg": "string",
      "confidence": number
    }
  ]
}
```

### 3. Server-Side Model Manager

Create a model registry in `server/models.ts`:

```typescript
interface ModelConfig {
  name: string;
  endpoint: string;
  apiKey?: string;
  timeout: number;
  supportedLanguages: string[];
  capabilities: {
    textToSvg: boolean;
    styleTransfer: boolean;
    semanticUnderstanding: boolean;
  };
}

export const models: Record<string, ModelConfig> = {
  omnisvg: {
    name: "OmniSVG",
    endpoint: "http://localhost:8001/generate",
    timeout: 30000,
    supportedLanguages: ["en", "es", "mi"],
    capabilities: {
      textToSvg: true,
      styleTransfer: true,
      semanticUnderstanding: true
    }
  },
  svgdreamer: {
    name: "SVGDreamer", 
    endpoint: "http://localhost:8002/generate",
    timeout: 45000,
    supportedLanguages: ["en", "es"],
    capabilities: {
      textToSvg: true,
      styleTransfer: false,
      semanticUnderstanding: true
    }
  }
  // Add other models...
};
```

### 4. Generation Handler

Implement the generation logic in `server/routes.ts`:

```typescript
app.post("/api/generate", async (req, res) => {
  const { prompt, instance, model = "omnisvg", style } = req.body;
  
  try {
    // Validate request
    if (!prompt || !instance) {
      return res.status(400).json({ error: "Missing required fields" });
    }
    
    // Get model configuration
    const modelConfig = models[model];
    if (!modelConfig) {
      return res.status(400).json({ error: "Unsupported model" });
    }
    
    // Prepare generation request
    const generationRequest = {
      prompt,
      instance,
      style: await getInstanceStyle(instance),
      dimensions: { width: 100, height: 100 },
      constraints: await getInstanceConstraints(instance)
    };
    
    // Call model API
    const response = await fetch(modelConfig.endpoint, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        ...(modelConfig.apiKey && { "Authorization": `Bearer ${modelConfig.apiKey}` })
      },
      body: JSON.stringify(generationRequest),
      signal: AbortSignal.timeout(modelConfig.timeout)
    });
    
    if (!response.ok) {
      throw new Error(`Model API error: ${response.status}`);
    }
    
    const result = await response.json();
    
    // Store generated pictogram
    const pictogram = await storage.createSvgProject({
      name: `Generated: ${prompt}`,
      svgCode: result.svg,
      instanceId: instance,
      metadata: result.metadata
    });
    
    res.json({
      success: true,
      pictogram,
      alternatives: result.alternatives || []
    });
    
  } catch (error) {
    console.error("Generation error:", error);
    res.status(500).json({ 
      error: "Generation failed",
      details: error.message 
    });
  }
});
```

## Frontend Integration

### 1. Generation Hook

Update `hooks/use-svg-editor.ts` to support AI generation:

```typescript
export function useSvgEditor() {
  // ... existing code ...
  
  const generateWithAI = async (prompt: string, model: string = "omnisvg") => {
    setIsGenerating(true);
    
    try {
      const response = await apiRequest(`/api/generate`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          prompt,
          instance: getCurrentInstance(),
          model,
          style: getCurrentInstanceStyle()
        })
      });
      
      if (response.success) {
        setSvgCode(response.pictogram.svgCode);
        setStructure(parseSvgToStructure(response.pictogram.svgCode));
      }
      
      return response;
    } catch (error) {
      throw new Error(`Generation failed: ${error.message}`);
    } finally {
      setIsGenerating(false);
    }
  };
  
  return {
    // ... existing exports ...
    generateWithAI,
    isGenerating
  };
}
```

### 2. Model Selection UI

Add model selection to the editor interface:

```typescript
// In svg-editor.tsx
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

const [selectedModel, setSelectedModel] = useState("omnisvg");

// In the header section:
<div className="flex items-center space-x-3">
  <Select value={selectedModel} onValueChange={setSelectedModel}>
    <SelectTrigger className="w-32">
      <SelectValue />
    </SelectTrigger>
    <SelectContent>
      <SelectItem value="omnisvg">OmniSVG</SelectItem>
      <SelectItem value="svgdreamer">SVGDreamer</SelectItem>
      <SelectItem value="svgfusion">SVG Fusion</SelectItem>
      <SelectItem value="starvector">StarVector</SelectItem>
      <SelectItem value="vectorfusion">VectorFusion</SelectItem>
    </SelectContent>
  </Select>
  
  <Input
    value={prompt}
    onChange={(e) => setPrompt(e.target.value)}
    placeholder="Describe el pictograma que quieres generar..."
    className="flex-1"
  />
  
  <Button
    onClick={() => generateWithAI(prompt, selectedModel)}
    disabled={isGenerating}
  >
    {isGenerating ? "Generando..." : "Generar"}
  </Button>
</div>
```

## Instance-Specific Configuration

### 1. Cultural Context Integration

Each instance can provide specific context to the AI models:

```typescript
// In shared/schema.ts
export interface InstanceConfig {
  id: string;
  name: string;
  culturalContext: {
    language: string;
    region: string;
    culturalKeywords: string[];
    prohibitedConcepts: string[];
  };
  stylePreferences: {
    colorPalette: string[];
    strokeStyle: "bold" | "thin" | "variable";
    semanticStyle: "realistic" | "abstract" | "symbolic";
  };
  aiModels: {
    preferred: string[];
    fallback: string;
    customPrompts: Record<string, string>;
  };
}
```

### 2. Instance-Aware Generation

```typescript
async function getInstanceConstraints(instanceId: string) {
  const instance = await getInstanceConfig(instanceId);
  
  return {
    culturalContext: instance.culturalContext,
    stylePreferences: instance.stylePreferences,
    language: instance.culturalContext.language,
    customPromptPrefix: instance.aiModels.customPrompts.prefix || "",
    customPromptSuffix: instance.aiModels.customPrompts.suffix || ""
  };
}
```

## Model Deployment Options

### 1. Docker Containers

Each model can be deployed as a separate Docker container:

```yaml
# docker-compose.yml
version: '3.8'
services:
  omnisvg:
    image: pictonet/omnisvg:latest
    ports:
      - "8001:8000"
    environment:
      - MODEL_PATH=/models/omnisvg
      - GPU_MEMORY=4GB
    volumes:
      - ./models/omnisvg:/models/omnisvg
    
  svgdreamer:
    image: pictonet/svgdreamer:latest
    ports:
      - "8002:8000"
    environment:
      - MODEL_PATH=/models/svgdreamer
      - GPU_MEMORY=6GB
    volumes:
      - ./models/svgdreamer:/models/svgdreamer
```

### 2. Environment Configuration

```bash
# .env file
OMNISVG_ENDPOINT=http://localhost:8001
SVGDREAMER_ENDPOINT=http://localhost:8002
SVGFUSION_ENDPOINT=http://localhost:8003
STARVECTOR_ENDPOINT=http://localhost:8004
VECTORFUSION_ENDPOINT=http://localhost:8005

# Optional API keys for cloud models
OMNISVG_API_KEY=your_api_key_here
OPENAI_API_KEY=your_openai_key_here
```

## Quality Assurance

### 1. Generation Validation

```typescript
function validateGeneratedSvg(svg: string): boolean {
  try {
    // Parse SVG
    const parser = new DOMParser();
    const doc = parser.parseFromString(svg, 'image/svg+xml');
    
    // Check for parsing errors
    const parserError = doc.querySelector('parsererror');
    if (parserError) return false;
    
    // Validate SVG structure
    const svgElement = doc.querySelector('svg');
    if (!svgElement) return false;
    
    // Check dimensions
    const width = svgElement.getAttribute('width');
    const height = svgElement.getAttribute('height');
    if (!width || !height) return false;
    
    return true;
  } catch {
    return false;
  }
}
```

### 2. Feedback Loop Integration

The platform's existing RLHF feedback system can be used to improve model performance:

```typescript
// Store generation feedback
app.post("/api/feedback", async (req, res) => {
  const { pictogramId, rating, feedback, modelUsed } = req.body;
  
  await storage.storeFeedback({
    pictogramId,
    rating,
    feedback,
    modelUsed,
    timestamp: new Date()
  });
  
  // Optional: Send feedback to model API for training
  if (models[modelUsed]?.feedbackEndpoint) {
    await sendModelFeedback(modelUsed, {
      pictogramId,
      rating,
      feedback
    });
  }
});
```

## Performance Optimization

### 1. Caching Strategy

```typescript
// Implement Redis caching for frequent prompts
import Redis from 'ioredis';

const redis = new Redis(process.env.REDIS_URL);

async function getCachedGeneration(prompt: string, instance: string, model: string) {
  const cacheKey = `generation:${model}:${instance}:${hashPrompt(prompt)}`;
  const cached = await redis.get(cacheKey);
  
  if (cached) {
    return JSON.parse(cached);
  }
  
  return null;
}

async function cacheGeneration(prompt: string, instance: string, model: string, result: any) {
  const cacheKey = `generation:${model}:${instance}:${hashPrompt(prompt)}`;
  await redis.setex(cacheKey, 3600, JSON.stringify(result)); // Cache for 1 hour
}
```

### 2. Load Balancing

```typescript
// Round-robin load balancing for multiple model instances
class ModelLoadBalancer {
  private instances: Map<string, string[]> = new Map();
  private currentIndex: Map<string, number> = new Map();
  
  addInstance(modelName: string, endpoint: string) {
    if (!this.instances.has(modelName)) {
      this.instances.set(modelName, []);
      this.currentIndex.set(modelName, 0);
    }
    this.instances.get(modelName)!.push(endpoint);
  }
  
  getNextEndpoint(modelName: string): string {
    const instances = this.instances.get(modelName);
    if (!instances || instances.length === 0) {
      throw new Error(`No instances available for model: ${modelName}`);
    }
    
    const currentIdx = this.currentIndex.get(modelName)!;
    const endpoint = instances[currentIdx];
    
    this.currentIndex.set(modelName, (currentIdx + 1) % instances.length);
    
    return endpoint;
  }
}
```

## Security Considerations

### 1. Input Sanitization

```typescript
function sanitizePrompt(prompt: string): string {
  // Remove potentially harmful content
  const cleaned = prompt
    .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
    .replace(/javascript:/gi, '')
    .replace(/on\w+=/gi, '');
    
  // Limit length
  return cleaned.substring(0, 500);
}
```

### 2. Rate Limiting

```typescript
import rateLimit from 'express-rate-limit';

const generateLimit = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 10, // limit each IP to 10 requests per windowMs
  message: "Too many generation requests, please try again later."
});

app.use('/api/generate', generateLimit);
```

## Testing

### 1. Model Integration Tests

```typescript
// tests/model-integration.test.ts
describe('Model Integration', () => {
  test('should generate valid SVG from OmniSVG', async () => {
    const result = await generateWithModel('omnisvg', {
      prompt: 'a simple house',
      instance: 'test'
    });
    
    expect(result.success).toBe(true);
    expect(validateGeneratedSvg(result.svg)).toBe(true);
  });
  
  test('should handle model timeout gracefully', async () => {
    // Mock slow model response
    const result = await generateWithModel('slow-model', {
      prompt: 'complex scene',
      instance: 'test'
    });
    
    expect(result.error).toContain('timeout');
  });
});
```

This architecture provides a flexible, scalable foundation for integrating multiple AI models while maintaining the platform's cultural sensitivity and instance-specific customization capabilities.