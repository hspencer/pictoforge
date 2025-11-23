# Storage System Documentation

**Status:** Implemented (v0.0.2)
**Database:** IndexedDB
**Implementation:** `src/hooks/useSVGStorage.js`

## Overview

PictoForge uses **IndexedDB** for local, persistent storage in the browser. The system is designed around the principle of **SVG as source of truth** - each SVG contains complete semantic metadata, and the database stores only indexed fields for fast querying.

## Quick Navigation

- **[Data Structures](./data-structures.md)** - Complete schema definitions
- **[API Methods](./api-methods.md)** - All available storage methods
- **[Usage Examples](./examples.md)** - Common patterns and recipes
- **[Storage Capacity](./capacity.md)** - Quota management and limits

## Core Principles

### 1. SVG as Source of Truth

Each SVG pictogram is **self-contained** with embedded metadata:

```xml
<svg xmlns="http://www.w3.org/2000/svg" lang="en-NZ" data-domain="home">
  <metadata>
    {
      "utterance": "Make the bed",
      "frames": [...],
      "visual_guidelines": {...}
    }
  </metadata>
  <title>Make the bed</title>
  <desc>Person making a bed with pillow and sheet</desc>
  <style>
    .figure { fill: #000; }
    .object { fill: #666; }
  </style>
  <g id="pictogram">
    <path id="bed" class="object" d="..."/>
    <g id="person" class="figure" data-role="agent">...</g>
  </g>
</svg>
```

**No data duplication** - The database stores only extracted fields for indexing.

### 2. Three-Store Architecture

| Store | Purpose | Size |
|-------|---------|------|
| **`pictograms`** | Active work (generated pictograms) | ~7.5KB each |
| **`vocabulary`** | Verified elements (reusable components) | ~2KB each |
| **`settings`** | User preferences | <1KB total |

### 3. Storage Capacity

```plaintext
Average pictogram:  ~7.5KB (SVG 5KB + metadata 2.5KB)
Target vocabulary:  10,000 elements = ~77MB
Browser capacity:   50MB-10GB (depending on browser)
Viability:          ✅ Fully viable on all modern browsers
```

## Database Schema

### Store: `pictograms`

**Purpose:** Workspace for newly generated pictograms

```typescript
interface Pictogram {
  id: string;                    // UUID v4
  svg: string;                   // Complete SVG content
  timestamp: number;             // Unix timestamp
  audit_status: 'pending' | 'approved' | 'rejected';

  // Indexed fields (extracted from SVG)
  utterance: string;             // From metadata
  domain: string;                // From svg[data-domain]
  intent: string;                // From metadata
  language: string;              // From svg[lang]
  concepts: string[];            // From metadata.concepts
}
```

**Indices:** `timestamp`, `audit_status`, `utterance`, `domain`

### Store: `vocabulary`

**Purpose:** Verified, reusable vocabulary elements

```typescript
interface VocabularyEntry {
  id: string;                    // Unique identifier
  concept: string;               // Core concept (e.g., 'pillow', 'make')
  type: 'object' | 'action' | 'modifier' | 'operator';

  // Visual representation
  svg: string;                   // SVG element
  formula?: string;              // For compound concepts

  // Internationalization
  i18n: {
    en: string;
    es: string;
    mi: string;
    arn: string;
  };

  // Metadata
  verified: boolean;
  usage_count: number;
  tags: string[];
  role?: 'agent' | 'theme' | 'object' | null;
  timestamp: number;
  source: 'pictonet' | 'arasaac' | 'manual' | 'extracted';
}
```

**Indices:** `concept`, `type`, `verified`, `usage_count`, `tags`

### Store: `settings`

**Purpose:** Application configuration (key-value pairs)

```typescript
interface Setting {
  key: string;                   // Setting name
  value: any;                    // Setting value (JSON-serializable)
}
```

**Example Settings:**
- `language`: `'en'` | `'es'` | `'mi'` | `'arn'`
- `theme`: `'light'` | `'dark'`
- `swapPanels`: `boolean`
- `persistentStorageRequested`: `boolean`

## Quick Start

### Import Hook

```javascript
import { useSVGStorage } from '@/hooks/useSVGStorage';

function MyComponent() {
  const {
    // State
    loading,
    error,

    // Pictograms
    savePictogram,
    getAllPictograms,

    // Vocabulary
    saveVocabulary,
    getAllVocabulary,

    // Settings
    saveSetting,
    getSetting,

    // Utilities
    getStorageQuota,
    exportWorkspace,
    importWorkspace
  } = useSVGStorage();

  // Use methods...
}
```

### Basic Operations

```javascript
// Save a pictogram
const id = await savePictogram(svgContent, 'pending');

// Get all pictograms
const pictograms = await getAllPictograms();

// Save a vocabulary entry
await saveVocabulary({
  id: 'pillow-01',
  concept: 'pillow',
  type: 'object',
  svg: '<path id="pillow" d="..."/>',
  i18n: {
    en: 'pillow',
    es: 'almohada',
    mi: 'urunga',
    arn: 'alko'
  },
  verified: true,
  tags: ['bedroom', 'furniture']
});

// Save user preference
await saveSetting('language', 'es');
```

## Workflow Example

### 1. Generate Pictogram (PictoNet)

User generates a pictogram using AI model.

### 2. Save for Review

```javascript
const id = await savePictogram(svgContent, 'pending');
```

### 3. Audit & Edit

User reviews in PictoForge and makes edits.

### 4. Approve

```javascript
await updatePictogramStatus(id, 'approved');
```

### 5. Extract Vocabulary (Future)

Extract reusable elements from approved pictograms:

```javascript
// Extract individual element
const pillow = extractElement(svgContent, 'pillow');

// Save to vocabulary
await saveVocabulary({
  id: 'pillow-01',
  concept: 'pillow',
  type: 'object',
  svg: pillow,
  // ... other fields
});
```

## Advanced Features

### Storage Quota Management

```javascript
const { quota, loading } = useStorageQuota();

console.log(`Used: ${quota.usageMB} MB`);
console.log(`Available: ${quota.quotaGB} GB`);
console.log(`Persistent: ${quota.persisted}`);
```

### Request Persistent Storage

```javascript
const granted = await requestPersistentStorage();
if (granted) {
  console.log('✓ Data protected from automatic deletion');
}
```

### Export Workspace

```javascript
const workspace = await exportWorkspace();
// → { version, exported_at, pictograms, vocabulary, settings }

// Download as JSON
const json = JSON.stringify(workspace, null, 2);
const blob = new Blob([json], { type: 'application/json' });
downloadFile(blob, 'pictoforge-backup.json');
```

### Import Workspace

```javascript
// Merge with existing data
const stats = await importWorkspace(data, true);
console.log(`Imported ${stats.pictograms} pictograms`);

// Replace all data
const stats = await importWorkspace(data, false);
```

## Implementation Status

### ✅ Implemented

- Core database operations (CRUD)
- IndexedDB with three stores
- Storage quota checking
- Export/Import functionality
- User settings persistence
- Error handling

### 🚧 In Progress

- Vocabulary management UI
- Bulk operations
- Advanced search/filtering
- LRU cache layer

### 📅 Planned

- Cloud sync (federated identity)
- Automatic backup
- Vocabulary sharing
- Multi-device sync

## Troubleshooting

### Data disappears after closing browser

- Check if persistent storage is granted
- **Incognito mode** always clears data on close
- Request persistent storage explicitly

### Storage quota exceeded

```javascript
// Export backup first
const backup = await exportWorkspace();

// Delete old/rejected pictograms
const rejected = await getPictogramsByStatus('rejected');
for (const p of rejected) {
  await deletePictogram(p.id);
}
```

### Transaction inactive error

IndexedDB requires all async operations within a transaction to complete in the same event loop. Always use `await` correctly.

## Performance Considerations

### Indexing Strategy

- Only index fields used for queries
- Use compound indices sparingly
- Keep indexed fields small (<100 chars)

### Query Optimization

```javascript
// ✅ Good - Uses index
vocabulary.index('type').getAll('object');

// ❌ Bad - No index, scans all records
vocabulary.getAll().then(all => all.filter(v => v.type === 'object'));
```

### Memory Management

- Don't load all records at once
- Use cursors for large datasets
- Implement pagination for UI

## Next Steps

- [Data Structures](./data-structures.md) - Detailed schemas
- [API Methods](./api-methods.md) - Complete method reference
- [Examples](./examples.md) - Common usage patterns
- [Capacity](./capacity.md) - Browser limits and quotas

## References

- [IndexedDB API - MDN](https://developer.mozilla.org/en-US/docs/Web/API/IndexedDB_API)
- [Storage API - MDN](https://developer.mozilla.org/en-US/docs/Web/API/Storage_API)
- [Persistent Storage - web.dev](https://web.dev/persistent-storage/)

---

[← Back to Main Docs](../README.md) | [Data Structures →](./data-structures.md)
