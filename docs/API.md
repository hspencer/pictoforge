# API Documentation

> **⚠️ UNDER DEVELOPMENT**  
> This API documentation is currently under active development. All interfaces, methods, and examples shown here are **planned features** and may change significantly before implementation. Do not use this as a reference for current functionality.

## Overview

PictoForge exposes a modular API through its core modules, allowing for extensibility and programmatic control of SVG editing operations. The API follows an event-driven architecture with clear separation between parsing, validation, UI state management, and user interactions.

## Core Modules API

### 🔄 EventBus

The central communication hub for all modules.

```javascript
import { EventBus } from '@core/EventBus.js'

// TODO: Implementation pending
const eventBus = new EventBus()

// Event subscription
eventBus.on(eventName, callback)
eventBus.off(eventName, callback)
eventBus.emit(eventName, payload)
```

#### Methods

| Method | Parameters | Returns | Description |
|--------|------------|---------|-------------|
| `on(eventName, callback)` | `string, function` | `void` | **TODO**: Subscribe to events |
| `off(eventName, callback)` | `string, function` | `void` | **TODO**: Unsubscribe from events |
| `emit(eventName, payload)` | `string, any` | `void` | **TODO**: Emit events to subscribers |

#### Events

| Event Name | Payload | Description |
|------------|---------|-------------|
| `svg:import` | `{svgString: string, source: string}` | **TODO**: Fired when SVG is imported |
| `svg:export` | `{filename: string, meta object}` | **TODO**: Fired when SVG is exported |
| `element:select` | `{elementId: string, source: 'tree'|'canvas'}` | **TODO**: Element selection event |
| `element:update` | `{elementId: string, changes: object}` | **TODO**: Element modification event |
| `style:apply` | `{elementId: string, styleClass: string}` | **TODO**: Style application event |
| `style:update` | `{styleId: string, properties: object}` | **TODO**: Style modification event |

### 🔍 SVGParser

Handles SVG document parsing and structure analysis.

```javascript
import { SVGParser } from '@core/SVGParser.js'

// TODO: Implementation pending
const parser = new SVGParser(options)
const result = await parser.parseSVG(svgString)
```

#### Constructor Options

```typescript
// TODO: Interface definitions pending
interface SVGParserOptions {
  validateStructure?: boolean    // Default: true
  extractInlineStyles?: boolean  // Default: true
  generateIds?: boolean         // Default: true
  preserveComments?: boolean    // Default: false
}
```

#### Methods

| Method | Parameters | Returns | Description |
|--------|------------|---------|-------------|
| `parseSVG(svgString)` | `string` | `Promise<ParseResult>` | **TODO**: Parse SVG string into structured data |
| `extractStyles(document)` | `Document` | `StyleMap` | **TODO**: Extract CSS styles from SVG |
| `buildElementTree(document)` | `Document` | `ElementNode[]` | **TODO**: Build hierarchical element structure |
| `generateUniqueId(element)` | `Element` | `string` | **TODO**: Generate unique ID for element |

#### Return Types

```typescript
// TODO: Type definitions pending
interface ParseResult {
  document: Document
  elements: ElementNode[]
  styles: StyleMap
  meta SVGMetadata
  issues: LintIssue[]
}

interface ElementNode {
  id: string
  tagName: string
  attributes: Record<string, string>
  children: ElementNode[]
  styles: string[]
  boundingBox?: DOMRect
}
```

### ✅ SVGLinter

Validates SVG structure and provides auto-correction capabilities.

```javascript
import { SVGLinter } from '@core/SVGLinter.js'

// TODO: Implementation pending
const linter = new SVGLinter(rules)
const report = await linter.lint(svgString)
```

#### Configuration

```typescript
// TODO: Rule definitions pending
interface LintRules {
  allowedElements?: string[]
  requiredAttributes?: Record<string, string[]>
  styleValidation?: boolean
  accessibilityChecks?: boolean
  performanceHints?: boolean
}
```

#### Methods

| Method | Parameters | Returns | Description |
|--------|------------|---------|-------------|
| `lint(svgString)` | `string` | `Promise<LintReport>` | **TODO**: Validate SVG and return issues |
| `autoFix(svgString, issues)` | `string, LintIssue[]` | `string` | **TODO**: Apply automatic fixes |
| `addRule(rule)` | `LintRule` | `void` | **TODO**: Add custom validation rule |
| `removeRule(ruleId)` | `string` | `void` | **TODO**: Remove validation rule |

### 🔄 VirtualDOM

Manages synchronization between UI state and SVG DOM.

```javascript
import { VirtualDOM } from '@core/VirtualDOM.js'

// TODO: Implementation pending
const virtualDOM = new VirtualDOM()
virtualDOM.initialize(svgElement)
```

#### Methods

| Method | Parameters | Returns | Description |
|--------|------------|---------|-------------|
| `initialize(svgElement)` | `SVGElement` | `void` | **TODO**: Initialize with real SVG element |
| `syncToCanvas(elementId)` | `string` | `void` | **TODO**: Apply UI changes to canvas |
| `syncToUI(elementId)` | `string` | `void` | **TODO**: Apply canvas changes to UI |
| `updateElement(elementId, changes)` | `string, object` | `void` | **TODO**: Update element properties |
| `onSync(callback)` | `function` | `void` | **TODO**: Subscribe to sync events |

## UI Modules API

### 📁 FileManager

Handles import and export operations.

```javascript
import { FileManager } from '@ui/FileManager.js'

// TODO: Implementation pending
const fileManager = new FileManager(eventBus)
```

#### Methods

| Method | Parameters | Returns | Description |
|--------|------------|---------|-------------|
| `importFromFile()` | `void` | `Promise<string>` | **TODO**: Open file picker and import SVG |
| `importFromURL(url)` | `string` | `Promise<string>` | **TODO**: Import SVG from URL |
| `exportSVG(svgData, metadata)` | `string, object` | `void` | **TODO**: Download SVG file |
| `validateFile(file)` | `File` | `boolean` | **TODO**: Validate uploaded file |

### 🌳 ElementTree

Manages the hierarchical element tree UI.

```javascript
import { ElementTree } from '@ui/ElementTree.js'

// TODO: Implementation pending
const elementTree = new ElementTree(container, eventBus)
```

#### Methods

| Method | Parameters | Returns | Description |
|--------|------------|---------|-------------|
| `render(elements)` | `ElementNode[]` | `void` | **TODO**: Render element tree |
| `selectElement(elementId)` | `string` | `void` | **TODO**: Select element in tree |
| `expandNode(nodeId)` | `string` | `void` | **TODO**: Expand tree node |
| `collapseNode(nodeId)` | `string` | `void` | **TODO**: Collapse tree node |
| `reorderElements(fromId, toId)` | `string, string` | `void` | **TODO**: Reorder elements |

### 🎨 StylePanel

Manages the style library and editor.

```javascript
import { StylePanel } from '@ui/StylePanel.js'

// TODO: Implementation pending
const stylePanel = new StylePanel(container, eventBus)
```

#### Methods

| Method | Parameters | Returns | Description |
|--------|------------|---------|-------------|
| `renderStyles(styles)` | `StyleMap` | `void` | **TODO**: Render available styles |
| `openStyleEditor(styleId)` | `string` | `void` | **TODO**: Open style editor modal |
| `createStyle(properties)` | `StyleProperties` | `string` | **TODO**: Create new style |
| `deleteStyle(styleId)` | `string` | `void` | **TODO**: Delete existing style |
| `applyStyleToElement(styleId, elementId)` | `string, string` | `void` | **TODO**: Apply style to element |

### 🖼️ VisualEditor

Manages the visual SVG canvas and editing tools.

```javascript
import { VisualEditor } from '@ui/VisualEditor.js'

// TODO: Implementation pending
const visualEditor = new VisualEditor(container, eventBus)
```

#### Methods

| Method | Parameters | Returns | Description |
|--------|------------|---------|-------------|
| `loadSVG(svgElement)` | `SVGElement` | `void` | **TODO**: Load SVG into canvas |
| `selectElement(elementId)` | `string` | `void` | **TODO**: Select element on canvas |
| `zoomTo(scale)` | `number` | `void` | **TODO**: Set zoom level |
| `fitToView()` | `void` | `void` | **TODO**: Fit SVG to viewport |
| `enableEditMode(mode)` | `'select'|'edit'|'pan'` | `void` | **TODO**: Switch editing mode |

## Utility Functions API

### 🔧 SVG Utilities

```javascript
import { 
  generateUniqueId, 
  computeBoundingBox, 
  serializeElement 
} from '@utils/svgUtils.js'

// TODO: All utility functions pending implementation
```

### 🎯 Drag & Drop

```javascript
import { DragDropManager } from '@utils/dragDrop.js'

// TODO: Implementation pending
const dragDrop = new DragDropManager()
```

## Plugin System API

> **🔮 FUTURE FEATURE**  
> Plugin system is planned for v2.0.0

```javascript
// TODO: Plugin API design pending
import { PluginManager } from '@core/PluginManager.js'

const pluginManager = new PluginManager()
pluginManager.register(plugin)
```

## Usage Examples

### Basic SVG Import and Parse

```javascript
// TODO: Example pending implementation
import { SVGParser, EventBus } from '@core'

const eventBus = new EventBus()
const parser = new SVGParser()

eventBus.on('svg:import', async (data) => {
  const result = await parser.parseSVG(data.svgString)
  console.log('Parsed elements:', result.elements)
  console.log('Found styles:', result.styles)
})

// Trigger import
eventBus.emit('svg:import', { svgString: '<svg>...</svg>', source: 'file' })
```

### Element Selection Sync

```javascript
// TODO: Example pending implementation
import { ElementTree, VisualEditor, EventBus } from '@ui'

const eventBus = new EventBus()
const elementTree = new ElementTree(leftPanel, eventBus)
const visualEditor = new VisualEditor(rightPanel, eventBus)

// Bidirectional selection sync
eventBus.on('element:select', (data) => {
  if (data.source === 'tree') {
    visualEditor.selectElement(data.elementId)
  } else if (data.source === 'canvas') {
    elementTree.selectElement(data.elementId)
  }
})
```

## Error Handling

All API methods follow consistent error handling patterns:

```javascript
// TODO: Error handling patterns pending
try {
  const result = await parser.parseSVG(invalidSVG)
} catch (error) {
  if (error instanceof SVGParseError) {
    console.error('Parse error:', error.message)
    console.error('Line:', error.line, 'Column:', error.column)
  }
}
```

## TypeScript Support

> **📝 PLANNED FEATURE**  
> Full TypeScript definitions will be provided in v1.0.0

```typescript
// TODO: Type definitions pending
import type { 
  ParseResult, 
  ElementNode, 
  StyleMap, 
  LintReport 
} from '@types/api'
```

## Changelog

| Version | Status | Changes |
|---------|--------|---------|
| v0.1.0 | 🚧 Planned | Initial API design |
| v0.2.0 | 🚧 Planned | Core modules implementation |
| v0.3.0 | 🚧 Planned | UI modules and event system |
| v1.0.0 | 🚧 Planned | Complete API with TypeScript |


