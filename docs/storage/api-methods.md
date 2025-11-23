# Storage API Methods

Complete reference for PictoForge storage operations.

## Implementation Status

**Current:** localStorage-based (v0.0.2)
**Planned:** IndexedDB-based (v0.1.0+)

This document covers both implementations:
- **Currently Implemented** - Available now
- **Planned** - Documented but not yet implemented

---

## Table of Contents

- [Current Implementation (localStorage)](#current-implementation-localstorage)
  - [useSVGStorage Hook](#usesvgstorage-hook)
  - [SVG Operations](#svg-operations)
  - [Configuration](#configuration)
  - [Utilities](#utilities)
- [Planned Implementation (IndexedDB)](#planned-implementation-indexeddb)
  - [Pictogram Operations](#pictogram-operations)
  - [Vocabulary Operations](#vocabulary-operations)
  - [Settings Operations](#settings-operations)
  - [Storage Management](#storage-management)

---

## Current Implementation (localStorage)

### useSVGStorage Hook

**Import:**

```javascript
import { useSVGStorage } from '@/hooks/useSVGStorage';
```

**Usage:**

```javascript
function MyComponent() {
  const {
    // State
    lastSVG,
    recentSVGs,
    userConfig,
    sessionConfig,

    // SVG Operations
    saveSVG,
    loadLastSVG,
    getRecentSVGs,
    deleteSVG,
    clearHistory,

    // Configuration
    updateConfig,

    // Utilities
    getStorageStats,
    exportHistory,
    importHistory
  } = useSVGStorage();
}
```

---

### SVG Operations

#### `saveSVG(svgData, metadata)`

Saves SVG to localStorage and adds to recent history.

**Parameters:**
- `svgData` (string | object) - SVG content or parsed object
- `metadata` (object, optional) - Additional metadata

**Returns:** `boolean` - Success status

**Example:**

```javascript
const success = saveSVG(svgContent, {
  name: 'My Pictogram',
  author: 'John Doe',
  tags: ['home', 'bedroom']
});
```

**Storage Structure:**

```javascript
{
  id: '1732147200000',
  content: '<svg>...</svg>',
  metadata: {
    name: 'My Pictogram',
    dateModified: '2024-11-21T00:00:00.000Z',
    viewBox: '0 0 100 100',
    width: 100,
    height: 100,
    elementCount: 5
  }
}
```

---

#### `loadLastSVG()`

Loads the most recently saved SVG.

**Returns:** `object | null` - SVG entry or null

**Example:**

```javascript
const lastSVG = loadLastSVG();
if (lastSVG) {
  console.log('Last SVG:', lastSVG.metadata.name);
  loadSVG(lastSVG.content);
}
```

---

#### `getRecentSVGs()`

Gets array of recent SVGs (max 5).

**Returns:** `array` - Recent SVG entries

**Example:**

```javascript
const recent = getRecentSVGs();
recent.forEach(svg => {
  console.log(`${svg.metadata.name} - ${svg.metadata.dateModified}`);
});
```

---

#### `deleteSVG(id)`

Deletes an SVG from recent history.

**Parameters:**
- `id` (string) - SVG entry ID

**Example:**

```javascript
deleteSVG('1732147200000');
```

---

#### `clearHistory()`

Clears all SVG history (keeps configuration).

**Example:**

```javascript
clearHistory();
```

---

### Configuration

#### `updateConfig(newConfig)`

Updates user configuration (both persistent and session).

**Parameters:**
- `newConfig` (object) - Configuration fields to update

**Configuration Fields:**

```javascript
{
  // Basic settings
  darkMode: boolean,
  language: 'en' | 'es' | 'mi' | 'arn',
  showGrid: boolean,
  autoSave: boolean,

  // Layout
  swapPanels: boolean,

  // Instance metadata
  instanceName: string,
  author: string,
  location: {
    address: string,
    coordinates: [number, number] | null,
    placeId: string | null
  },

  // Styling
  graphicStylePrompt: string,
  customStyles: array
}
```

**Example:**

```javascript
updateConfig({
  language: 'en',
  darkMode: true,
  author: 'Jane Smith'
});
```

---

### Utilities

#### `getStorageStats()`

Gets storage usage statistics.

**Returns:** `object` - Storage statistics

**Example:**

```javascript
const stats = getStorageStats();
console.log(`Total size: ${stats.totalSizeKB} KB`);
console.log(`Recent SVGs: ${stats.recentCount}`);
```

**Return Structure:**

```javascript
{
  lastSVGSize: number,      // Bytes
  recentCount: number,      // Count of recent SVGs
  totalSize: number,        // Total bytes
  totalSizeKB: string       // Formatted KB
}
```

---

#### `exportHistory()`

Exports complete history as JSON file.

**Example:**

```javascript
exportHistory();
// Downloads: pictoforge_backup_[timestamp].json
```

**Export Structure:**

```javascript
{
  lastSVG: object,
  recentSVGs: array,
  config: object,
  exportDate: string,
  version: string
}
```

---

#### `importHistory(jsonData)`

Imports history from JSON.

**Parameters:**
- `jsonData` (string | object) - Exported data

**Returns:** `boolean` - Success status

**Example:**

```javascript
// From file input
const handleImport = (event) => {
  const file = event.target.files[0];
  const reader = new FileReader();
  reader.onload = (e) => {
    const success = importHistory(e.target.result);
    if (success) console.log('Import successful');
  };
  reader.readAsText(file);
};
```

---

## Planned Implementation (IndexedDB)

**Coming in v0.1.0+**

### Database Initialization

```javascript
import { useIndexedDB } from '@/hooks/useIndexedDB';

function App() {
  const {
    initialized,
    loading,
    error,

    // Pictograms
    savePictogram,
    getPictogram,
    getAllPictograms,
    updatePictogramStatus,
    deletePictogram,

    // Vocabulary
    saveVocabulary,
    getVocabulary,
    getAllVocabulary,
    searchVocabulary,

    // Settings
    saveSetting,
    getSetting,
    getAllSettings,

    // Management
    getStorageQuota,
    requestPersistentStorage,
    exportWorkspace,
    importWorkspace,
    clearAllData
  } = useIndexedDB();
}
```

---

### Pictogram Operations

#### `savePictogram(svgContent, auditStatus)`

Saves pictogram to IndexedDB.

**Parameters:**
- `svgContent` (string) - Complete SVG with metadata
- `auditStatus` ('pending' | 'approved' | 'rejected', optional)

**Returns:** `Promise<string>` - Generated ID

**Example:**

```javascript
const id = await savePictogram(svgContent, 'pending');
console.log('Pictogram saved:', id);
```

---

#### `getPictogram(id)`

Gets pictogram by ID.

**Parameters:**
- `id` (string) - Pictogram ID

**Returns:** `Promise<object | null>`

**Example:**

```javascript
const pictogram = await getPictogram(id);
if (pictogram) {
  console.log(pictogram.utterance);
  loadSVG(pictogram.svg);
}
```

---

#### `getAllPictograms()`

Gets all pictograms.

**Returns:** `Promise<array>`

**Example:**

```javascript
const pictograms = await getAllPictograms();
console.log(`Found ${pictograms.length} pictograms`);
```

---

#### `getPictogramsByStatus(status)`

Gets pictograms filtered by audit status.

**Parameters:**
- `status` ('pending' | 'approved' | 'rejected')

**Returns:** `Promise<array>`

**Example:**

```javascript
const pending = await getPictogramsByStatus('pending');
console.log(`${pending.length} pending review`);
```

---

#### `updatePictogramStatus(id, newStatus)`

Updates audit status of pictogram.

**Parameters:**
- `id` (string) - Pictogram ID
- `newStatus` ('pending' | 'approved' | 'rejected')

**Returns:** `Promise<boolean>`

**Example:**

```javascript
await updatePictogramStatus(id, 'approved');
```

---

#### `deletePictogram(id)`

Deletes pictogram.

**Parameters:**
- `id` (string) - Pictogram ID

**Returns:** `Promise<boolean>`

**Example:**

```javascript
await deletePictogram(id);
```

---

### Vocabulary Operations

#### `saveVocabulary(entry)`

Saves vocabulary entry.

**Parameters:**
- `entry` (object) - Vocabulary entry (see [Data Structures](./data-structures.md))

**Returns:** `Promise<string>` - Entry ID

**Example:**

```javascript
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
  usage_count: 0,
  tags: ['bedroom', 'furniture'],
  role: 'object',
  timestamp: Date.now(),
  source: 'extracted'
});
```

---

#### `getVocabulary(id)`

Gets vocabulary entry by ID.

**Parameters:**
- `id` (string) - Entry ID

**Returns:** `Promise<object | null>`

---

#### `getAllVocabulary()`

Gets all vocabulary entries.

**Returns:** `Promise<array>`

---

#### `getVocabularyByConcept(concept)`

Gets vocabulary entries by concept.

**Parameters:**
- `concept` (string) - Concept name

**Returns:** `Promise<array>`

**Example:**

```javascript
const entries = await getVocabularyByConcept('pillow');
```

---

#### `getVocabularyByType(type)`

Gets vocabulary entries by type.

**Parameters:**
- `type` ('object' | 'action' | 'modifier' | 'operator')

**Returns:** `Promise<array>`

**Example:**

```javascript
const objects = await getVocabularyByType('object');
```

---

#### `searchVocabularyByTag(tag)`

Searches vocabulary by tag.

**Parameters:**
- `tag` (string) - Tag to search

**Returns:** `Promise<array>`

**Example:**

```javascript
const bedItems = await searchVocabularyByTag('bedroom');
```

---

#### `incrementVocabularyUsage(id)`

Increments usage count for vocabulary entry.

**Parameters:**
- `id` (string) - Entry ID

**Returns:** `Promise<boolean>`

**Example:**

```javascript
await incrementVocabularyUsage('pillow-01');
```

---

### Settings Operations

#### `saveSetting(key, value)`

Saves a setting.

**Parameters:**
- `key` (string) - Setting key
- `value` (any) - Setting value (JSON-serializable)

**Returns:** `Promise<boolean>`

**Example:**

```javascript
await saveSetting('language', 'es');
await saveSetting('theme', 'dark');
await saveSetting('auto_export_threshold', 100);
```

---

#### `getSetting(key, defaultValue)`

Gets a setting value.

**Parameters:**
- `key` (string) - Setting key
- `defaultValue` (any, optional) - Default if not found

**Returns:** `Promise<any>`

**Example:**

```javascript
const lang = await getSetting('language', 'en');
const threshold = await getSetting('auto_export_threshold', 50);
```

---

#### `getAllSettings()`

Gets all settings.

**Returns:** `Promise<object>` - Key-value pairs

**Example:**

```javascript
const settings = await getAllSettings();
console.log(`Language: ${settings.language}`);
```

---

### Storage Management

#### `getStorageQuota()`

Gets storage quota information.

**Returns:** `Promise<object>`

**Example:**

```javascript
const quota = await getStorageQuota();
console.log(`Used: ${quota.usageMB} MB`);
console.log(`Available: ${quota.quotaGB} GB`);
console.log(`Percentage: ${quota.percentage}%`);
console.log(`Persistent: ${quota.persisted}`);
```

**Return Structure:**

```javascript
{
  usage: number,           // Bytes used
  quota: number,           // Total bytes available
  usageMB: number,        // MB used
  quotaGB: number,        // GB available
  percentage: number,      // Usage percentage
  persisted: boolean       // Persistent storage granted
}
```

---

#### `requestPersistentStorage()`

Requests persistent storage permission.

**Returns:** `Promise<boolean>` - Whether granted

**Example:**

```javascript
const granted = await requestPersistentStorage();
if (granted) {
  console.log('Data protected from auto-deletion');
} else {
  console.warn('User denied persistent storage');
}
```

---

#### `exportWorkspace()`

Exports complete workspace.

**Returns:** `Promise<object>` - Workspace data

**Example:**

```javascript
const workspace = await exportWorkspace();
const json = JSON.stringify(workspace, null, 2);
downloadFile(json, 'pictoforge-workspace.json');
```

**Export Structure:**

```javascript
{
  version: '1.0',
  exported_at: string,
  pictograms: array,
  vocabulary: array,
  settings: object
}
```

---

#### `importWorkspace(data, merge)`

Imports workspace data.

**Parameters:**
- `data` (object) - Workspace export data
- `merge` (boolean) - Merge with existing data?

**Returns:** `Promise<object>` - Import statistics

**Example:**

```javascript
// Replace all data
const stats = await importWorkspace(data, false);

// Merge with existing
const stats = await importWorkspace(data, true);

console.log(`Imported ${stats.pictograms} pictograms`);
console.log(`Imported ${stats.vocabulary} vocabulary entries`);
```

**Return Structure:**

```javascript
{
  pictograms: number,      // Count imported
  vocabulary: number,      // Count imported
  settings: number,        // Count imported
  errors: array           // Any errors encountered
}
```

---

#### `clearAllData()`

Clears all database data.

**Returns:** `Promise<boolean>`

**Example:**

```javascript
if (confirm('Delete all data?')) {
  await clearAllData();
  console.log('All data cleared');
}
```

---

## Hook Patterns

### Error Handling

```javascript
const { savePictogram, error } = useIndexedDB();

const handleSave = async () => {
  try {
    const id = await savePictogram(svgContent);
    console.log('Saved:', id);
  } catch (err) {
    console.error('Save failed:', err);
  }
};

// Or check error state
if (error) {
  console.error('Database error:', error);
}
```

### Loading State

```javascript
const { loading, getAllPictograms } = useIndexedDB();

if (loading) {
  return <div>Loading database...</div>;
}
```

### Initialization Check

```javascript
const { initialized, getAllPictograms } = useIndexedDB();

useEffect(() => {
  if (initialized) {
    loadPictograms();
  }
}, [initialized]);
```

---

## Migration Path

### From localStorage to IndexedDB

```javascript
// 1. Export from localStorage
const { exportHistory } = useSVGStorage();
const localData = exportHistory();

// 2. Import to IndexedDB
const { importWorkspace } = useIndexedDB();
await importWorkspace(localData, false);
```

---

## Performance Best Practices

### Batch Operations

```javascript
// Bad - Multiple transactions
for (const entry of entries) {
  await saveVocabulary(entry);
}

// Good - Single transaction (future)
await saveVocabularyBatch(entries);
```

### Query Optimization

```javascript
// Use indices
await getVocabularyByType('object');

// Avoid filtering all records
const all = await getAllVocabulary();
const objects = all.filter(v => v.type === 'object');
```

### Memory Management

```javascript
// Paginate large datasets
const page1 = await getPictogramsPaginated(0, 50);
const page2 = await getPictogramsPaginated(50, 50);

// Don't load everything
const all = await getAllPictograms(); // Could be 1000s
```

---

## Next Steps

- [Data Structures](./data-structures.md) - Complete schemas
- [Examples](./examples.md) - Usage patterns
- [Storage Overview](./README.md) - Back to overview

---

[← Data Structures](./data-structures.md) | [Examples →](./examples.md)
