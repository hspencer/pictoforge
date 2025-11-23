# Storage Data Structures

Complete schema definitions for all PictoForge data stores.

## Table of Contents

- [Store 1: Pictograms](#store-1-pictograms)
- [Store 2: Vocabulary](#store-2-vocabulary)
- [Store 3: Settings](#store-3-settings)
- [Type Definitions](#type-definitions)
- [Schema Validation](#schema-validation)

---

## Store 1: Pictograms

**Purpose:** Active workspace for generated pictograms pending review

**Database:** `pictoforge-db`
**Store Name:** `pictograms`
**Key Path:** `id`

### Schema

```typescript
interface Pictogram {
  // Primary key
  id: string;                    // UUID v4 (auto-generated)

  // SVG content (source of truth)
  svg: string;                   // Complete SVG with embedded metadata

  // Timestamps
  timestamp: number;             // Unix timestamp (milliseconds)

  // Audit workflow
  audit_status: 'pending' | 'approved' | 'rejected';

  // === Indexed fields (extracted from SVG) ===

  // Natural language
  utterance: string;             // Original utterance (e.g., "Make the bed")

  // Categorization
  domain: string;                // Domain category (e.g., "home", "health")
  intent: string;                // Speech act (e.g., "directive", "question")
  language: string;              // ISO 639-1 + region (e.g., "en-NZ", "es-CL")

  // Semantic concepts
  concepts: string[];            // Extracted concept IDs (e.g., ["bed", "person", "make"])
}
```

### Indices

```javascript
// Primary index
keyPath: 'id'

// Secondary indices
indexes: [
  { name: 'timestamp', keyPath: 'timestamp', unique: false },
  { name: 'audit_status', keyPath: 'audit_status', unique: false },
  { name: 'utterance', keyPath: 'utterance', unique: false },
  { name: 'domain', keyPath: 'domain', unique: false }
]
```

### Field Extraction

Fields are extracted from SVG structure:

```xml
<svg lang="en-NZ" data-domain="home">
  <metadata>
    {
      "utterance": "Make the bed",
      "metadata": {
        "speech_act": "directive",
        "intent": "request"
      },
      "frames": [
        {
          "frame_name": "Directed_action",
          "lexical_unit": "make"
        }
      ]
    }
  </metadata>
  <g id="bed" data-concept="bed"/>
  <g id="person" data-concept="person"/>
</svg>
```

Extraction:
- `utterance`: From `<metadata>.utterance`
- `domain`: From `svg[data-domain]`
- `intent`: From `<metadata>.metadata.intent`
- `language`: From `svg[lang]`
- `concepts`: From elements with `data-concept` attribute

### Example Record

```javascript
{
  id: '550e8400-e29b-41d4-a716-446655440000',
  svg: '<svg xmlns="http://www.w3.org/2000/svg"...>...</svg>',
  timestamp: 1732147200000,
  audit_status: 'pending',
  utterance: 'Make the bed',
  domain: 'home',
  intent: 'directive',
  language: 'en-NZ',
  concepts: ['bed', 'person', 'make']
}
```

### Size Estimates

```plaintext
SVG content:        ~5KB (typical)
Metadata:           ~2.5KB
Total per record:   ~7.5KB
```

---

## Store 2: Vocabulary

**Purpose:** Curated, reusable vocabulary elements

**Database:** `pictoforge-db`
**Store Name:** `vocabulary`
**Key Path:** `id`

### Unified Schema

Vocabulary consolidates **canonical elements** and **blends** into a single store.

```typescript
interface VocabularyEntry {
  // Identity
  id: string;                    // Unique identifier (e.g., 'pillow-01', 'safe-house')
  concept: string;               // Core concept (simple or compound)

  // Type classification
  type: 'object' | 'action' | 'modifier' | 'operator';

  // Visual representation
  svg: string;                   // SVG element (can be single <path> or <g> group)
  formula: string | null;        // Composition formula for compounds (e.g., 'house + lock_inside')

  // Internationalization
  i18n: {
    en: string;                  // English label
    es: string;                  // Spanish label
    mi: string;                  // Māori label
    arn: string;                 // Mapuzugun label
  };

  // Metadata
  verified: boolean;             // Has been audited and approved
  usage_count: number;           // Times used in pictograms
  tags: string[];                // Semantic tags for search
  role: string | null;           // Semantic role (if applicable)
  timestamp: number;             // Unix timestamp
  source: 'pictonet' | 'arasaac' | 'manual' | 'extracted';
}
```

### Indices

```javascript
keyPath: 'id'

indexes: [
  { name: 'concept', keyPath: 'concept', unique: false },
  { name: 'type', keyPath: 'type', unique: false },
  { name: 'verified', keyPath: 'verified', unique: false },
  { name: 'usage_count', keyPath: 'usage_count', unique: false },
  { name: 'tags', keyPath: 'tags', unique: false, multiEntry: true }
]
```

Note: `tags` uses `multiEntry: true` for array indexing.

### Entry Types

#### 1. Simple Object

```javascript
{
  id: 'pillow-01',
  concept: 'pillow',
  type: 'object',
  svg: '<path id="pillow" d="M10,20 L90,20 L90,40 L10,40 Z"/>',
  formula: null,
  i18n: {
    en: 'pillow',
    es: 'almohada',
    mi: 'urunga',
    arn: 'alko'
  },
  verified: true,
  usage_count: 15,
  tags: ['bedroom', 'furniture', 'bed'],
  role: 'object',
  timestamp: 1732147200000,
  source: 'extracted'
}
```

#### 2. Action with Human Pose

```javascript
{
  id: 'person-make-01',
  concept: 'make',
  type: 'action',
  svg: '<g id="person"><path d="...arm..."/><path d="...body..."/></g>',
  formula: null,
  i18n: {
    en: 'make',
    es: 'hacer',
    mi: 'hanga',
    arn: 'küdawün'
  },
  verified: true,
  usage_count: 28,
  tags: ['action', 'human', 'verb', 'hands'],
  role: 'agent',
  timestamp: 1732147200000,
  source: 'pictonet'
}
```

#### 3. Compound Concept (Blend)

```javascript
{
  id: 'safe-house',
  concept: 'safety+house',
  type: 'object',
  svg: '<g><path id="house" d="..."/><path id="lock" d="..."/></g>',
  formula: 'house + lock_inside',  // Composition formula
  i18n: {
    en: 'safe house',
    es: 'casa segura',
    mi: 'whare haumaru',
    arn: 'ruka seguro'
  },
  verified: true,
  usage_count: 5,
  tags: ['safety', 'house', 'security', 'compound'],
  role: 'object',
  timestamp: 1732147200000,
  source: 'manual'
}
```

#### 4. Visual Operator

```javascript
{
  id: 'operator-plural',
  concept: 'plural',
  type: 'operator',
  svg: '<text font-size="24" font-weight="bold" fill="#000">+</text>',
  formula: null,
  i18n: {
    en: 'plural',
    es: 'plural',
    mi: 'maha',
    arn: 'feyentun'
  },
  verified: true,
  usage_count: 120,
  tags: ['operator', 'grammar', 'quantity'],
  role: null,
  timestamp: 1732147200000,
  source: 'arasaac'
}
```

#### 5. Visual Modifier (State)

```javascript
{
  id: 'modifier-clean',
  concept: 'cleanliness',
  type: 'modifier',
  svg: '<g><circle cx="10" cy="10" r="3"/><circle cx="20" cy="15" r="2"/><circle cx="30" cy="12" r="3"/></g>',
  formula: '3_sparkles',
  i18n: {
    en: 'clean',
    es: 'limpio',
    mi: 'ma',
    arn: 'küme'
  },
  verified: true,
  usage_count: 18,
  tags: ['modifier', 'state', 'quality', 'sparkle'],
  role: null,
  timestamp: 1732147200000,
  source: 'manual'
}
```

#### 6. Action Modifier

```javascript
{
  id: 'modifier-change',
  concept: 'change',
  type: 'modifier',
  svg: '<g><path d="M50,50 A20,20 0 1,1 50,10 L55,15"/><path d="M50,50 A20,20 0 1,0 50,90 L55,85"/></g>',
  formula: '2_circular_arrows',
  i18n: {
    en: 'change',
    es: 'cambiar',
    mi: 'whakarereke',
    arn: 'azkünoal'
  },
  verified: true,
  usage_count: 22,
  tags: ['modifier', 'action', 'transform', 'refresh'],
  role: null,
  timestamp: 1732147200000,
  source: 'manual'
}
```

### Size Estimates

```plaintext
Simple element:     ~2KB (SVG + metadata)
Compound element:   ~3KB (multiple paths + formula)
Operator:           ~1KB (simple shape + metadata)
```

---

## Store 3: Settings

**Purpose:** User preferences and application configuration

**Database:** `pictoforge-db`
**Store Name:** `settings`
**Key Path:** `key`

### Schema

```typescript
interface Setting {
  key: string;                   // Setting identifier
  value: any;                    // JSON-serializable value
}
```

### Categories

#### UI Preferences

```javascript
{ key: 'language', value: 'en' }              // Current UI language
{ key: 'theme', value: 'dark' }               // Theme mode
{ key: 'swapPanels', value: false }           // Swap hierarchy/viewer
{ key: 'showMetrics', value: false }          // Show performance metrics
```

#### Canvas Settings

```javascript
{ key: 'canvas_bg_color', value: '#f5f5f5' }  // Canvas background
{ key: 'grid_size', value: 40 }               // Grid pattern size
{ key: 'snap_to_grid', value: false }         // Snap guides
```

#### Generation Settings (for PictoNet)

```javascript
{ key: 'default_domain', value: 'home' }
{ key: 'default_language', value: 'en-NZ' }
{ key: 'style_prompt', value: 'AAC pictogram, high contrast, simple shapes...' }
```

#### Storage Settings

```javascript
{ key: 'auto_export_enabled', value: true }
{ key: 'auto_export_threshold', value: 100 }
{ key: 'persistent_storage_requested', value: false }
```

### Size Estimates

```plaintext
Total settings:     <1KB (all combined)
```

---

## Type Definitions

### TypeScript Definitions

```typescript
// Audit status for pictograms
type AuditStatus = 'pending' | 'approved' | 'rejected';

// Entry types in vocabulary
type EntryType = 'object' | 'action' | 'modifier' | 'operator';

// Semantic roles
type SemanticRole = 'agent' | 'theme' | 'object' | 'instrument' | null;

// Source of vocabulary entry
type VocabularySource = 'pictonet' | 'arasaac' | 'manual' | 'extracted';

// Internationalization labels
interface I18nLabels {
  en: string;
  es: string;
  mi: string;
  arn: string;
}

// Complete store interfaces
interface Pictogram {
  id: string;
  svg: string;
  timestamp: number;
  audit_status: AuditStatus;
  utterance: string;
  domain: string;
  intent: string;
  language: string;
  concepts: string[];
}

interface VocabularyEntry {
  id: string;
  concept: string;
  type: EntryType;
  svg: string;
  formula: string | null;
  i18n: I18nLabels;
  verified: boolean;
  usage_count: number;
  tags: string[];
  role: SemanticRole;
  timestamp: number;
  source: VocabularySource;
}

interface Setting {
  key: string;
  value: any;
}
```

---

## Schema Validation

### JSON Schema (ajv)

PictoForge uses `ajv` for validating NLU Schema within SVG metadata.

```javascript
import Ajv from 'ajv';
import addFormats from 'ajv-formats';

const ajv = new Ajv();
addFormats(ajv);

// Load NLU Schema from schemas/nlu-schema/
const nluSchema = await fetch('/schemas/nlu-schema/nlu-schema.json').then(r => r.json());
const validate = ajv.compile(nluSchema);

// Validate metadata
const valid = validate(metadata);
if (!valid) {
  console.error('Validation errors:', validate.errors);
}
```

---

## Migration Notes

### From Previous Structure

The current unified `vocabulary` store replaces the previous two-store system:

**Before:**
- `canonical` - Simple elements
- `blends` - Compound concepts

**After:**
- `vocabulary` - All vocabulary (distinguished by `type` and `formula`)

**Migration:**

```javascript
// Old canonical entry
{ id, svg, concept, role, verified }

// New vocabulary entry
{
  id,
  concept,
  type: 'object',  // inferred from role
  svg,
  formula: null,   // simple element
  i18n: {...},     // add translations
  verified,
  tags: []         // extract from concept
}

// Old blend entry
{ id, concept, formula, svg, description }

// New vocabulary entry
{
  id,
  concept,
  type: 'object',  // or inferred
  svg,
  formula,         // preserved
  i18n: {...},     // extract from description
  verified: true,
  tags: []         // extract from description
}
```

---

## Next Steps

- [API Methods](./api-methods.md) - Complete method reference
- [Examples](./examples.md) - Usage patterns
- [Storage Overview](./README.md) - Back to overview

---

[← Storage Overview](./README.md) | [API Methods →](./api-methods.md)
