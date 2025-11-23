# Storage Usage Examples

Common patterns and recipes for PictoForge storage operations.

## Table of Contents

- [Basic Workflows](#basic-workflows)
- [Vocabulary Management](#vocabulary-management)
- [Search & Query](#search--query)
- [Import/Export](#importexport)
- [Storage Management](#storage-management)
- [Error Handling](#error-handling)
- [Advanced Patterns](#advanced-patterns)

---

## Basic Workflows

### Save and Load SVG

**Current Implementation (localStorage):**

```javascript
import { useSVGStorage } from '@/hooks/useSVGStorage';

function SVGEditor() {
  const { saveSVG, loadLastSVG } = useSVGStorage();

  // Save current work
  const handleSave = () => {
    const success = saveSVG(svgContent, {
      name: 'My Pictogram',
      author: 'John Doe'
    });

    if (success) {
      console.log('✓ Saved successfully');
    }
  };

  // Load on mount
  useEffect(() => {
    const lastSVG = loadLastSVG();
    if (lastSVG) {
      loadSVG(lastSVG.content);
      console.log('Loaded:', lastSVG.metadata.name);
    }
  }, []);

  return <button onClick={handleSave}>Save</button>;
}
```

---

### Complete Audit Workflow

**Planned Implementation (IndexedDB):**

```javascript
import { useIndexedDB } from '@/hooks/useIndexedDB';

function PictogramReview() {
  const {
    getAllPictograms,
    updatePictogramStatus,
    saveVocabulary
  } = useIndexedDB();

  const [pending, setPending] = useState([]);
  const [current, setCurrent] = useState(null);

  // 1. Load pending pictograms
  useEffect(() => {
    loadPending();
  }, []);

  const loadPending = async () => {
    const pictograms = await getAllPictograms();
    const pendingOnly = pictograms.filter(p => p.audit_status === 'pending');
    setPending(pendingOnly);
    if (pendingOnly.length > 0) {
      setCurrent(pendingOnly[0]);
    }
  };

  // 2. Approve pictogram
  const handleApprove = async () => {
    await updatePictogramStatus(current.id, 'approved');
    console.log('✓ Approved');
    loadPending();
  };

  // 3. Reject pictogram
  const handleReject = async () => {
    await updatePictogramStatus(current.id, 'rejected');
    console.log('✓ Rejected');
    loadPending();
  };

  // 4. Extract vocabulary element
  const handleExtractElement = async (elementId) => {
    const svg = extractElementSVG(current.svg, elementId);

    await saveVocabulary({
      id: `${elementId}-01`,
      concept: elementId,
      type: 'object',
      svg,
      i18n: {
        en: elementId,
        es: elementId, // TODO: Add translations
        mi: elementId,
        arn: elementId
      },
      verified: true,
      usage_count: 0,
      tags: [current.domain],
      role: 'object',
      timestamp: Date.now(),
      source: 'extracted'
    });

    console.log('✓ Element saved to vocabulary');
  };

  return (
    <div>
      <h2>Review Pictograms ({pending.length} pending)</h2>
      {current && (
        <div>
          <SVGPreview svg={current.svg} />
          <p>{current.utterance}</p>
          <button onClick={handleApprove}>Approve</button>
          <button onClick={handleReject}>Reject</button>
          <button onClick={() => handleExtractElement('bed')}>
            Extract "bed" to vocabulary
          </button>
        </div>
      )}
    </div>
  );
}
```

---

## Vocabulary Management

### Save Simple Object

```javascript
const savePillow = async () => {
  await saveVocabulary({
    id: 'pillow-01',
    concept: 'pillow',
    type: 'object',
    svg: '<path id="pillow" d="M10,20 L90,20 L90,40 L10,40 Z" fill="#ccc"/>',
    formula: null,
    i18n: {
      en: 'pillow',
      es: 'almohada',
      mi: 'urunga',
      arn: 'alko'
    },
    verified: true,
    usage_count: 0,
    tags: ['bedroom', 'furniture', 'bed', 'sleep'],
    role: 'object',
    timestamp: Date.now(),
    source: 'extracted'
  });
};
```

---

### Save Compound Concept (Blend)

```javascript
const saveSafeHouse = async () => {
  await saveVocabulary({
    id: 'safe-house',
    concept: 'safety+house',
    type: 'object',
    svg: `
      <g id="safe-house">
        <path id="house" d="M20,50 L50,20 L80,50 L80,90 L20,90 Z"/>
        <path id="lock" d="M45,60 L55,60 L55,70 L45,70 Z"/>
      </g>
    `,
    formula: 'house + lock_inside',
    i18n: {
      en: 'safe house',
      es: 'casa segura',
      mi: 'whare haumaru',
      arn: 'ruka seguro'
    },
    verified: true,
    usage_count: 0,
    tags: ['safety', 'house', 'security', 'compound'],
    role: 'object',
    timestamp: Date.now(),
    source: 'manual'
  });
};
```

---

### Save Action with Human Pose

```javascript
const savePersonMaking = async () => {
  await saveVocabulary({
    id: 'person-make-01',
    concept: 'make',
    type: 'action',
    svg: `
      <g id="person" class="figure">
        <circle cx="50" cy="20" r="8"/>
        <path d="M50,28 L50,60"/>
        <path d="M50,35 L30,50"/>
        <path d="M50,35 L70,50"/>
        <path d="M50,60 L35,85"/>
        <path d="M50,60 L65,85"/>
      </g>
    `,
    formula: null,
    i18n: {
      en: 'make',
      es: 'hacer',
      mi: 'hanga',
      arn: 'küdawün'
    },
    verified: true,
    usage_count: 0,
    tags: ['action', 'verb', 'human', 'hands', 'create'],
    role: 'agent',
    timestamp: Date.now(),
    source: 'pictonet'
  });
};
```

---

### Bulk Import Vocabulary

```javascript
const importVocabularyBatch = async (entries) => {
  console.log(`Importing ${entries.length} vocabulary entries...`);

  let success = 0;
  let failed = 0;

  for (const entry of entries) {
    try {
      await saveVocabulary(entry);
      success++;
    } catch (error) {
      console.error(`Failed to import ${entry.id}:`, error);
      failed++;
    }
  }

  console.log(`✓ Imported ${success} entries`);
  if (failed > 0) {
    console.warn(`⚠️ Failed: ${failed} entries`);
  }
};

// Usage
const arasaacOperators = [
  {
    id: 'operator-plural',
    concept: 'plural',
    type: 'operator',
    svg: '<text>+</text>',
    i18n: { en: 'plural', es: 'plural', mi: 'maha', arn: 'feyentun' },
    verified: true,
    tags: ['operator', 'grammar'],
    source: 'arasaac'
  },
  // ... more entries
];

await importVocabularyBatch(arasaacOperators);
```

---

## Search & Query

### Find by Concept

```javascript
const findPillows = async () => {
  const results = await getVocabularyByConcept('pillow');
  console.log(`Found ${results.length} pillow variants`);
  return results;
};
```

---

### Filter by Type

```javascript
const loadObjects = async () => {
  const objects = await getVocabularyByType('object');
  console.log(`${objects.length} objects in vocabulary`);
  return objects;
};

const loadActions = async () => {
  const actions = await getVocabularyByType('action');
  console.log(`${actions.length} actions in vocabulary`);
  return actions;
};
```

---

### Search by Tags

```javascript
const findBedroomItems = async () => {
  const items = await searchVocabularyByTag('bedroom');
  console.log('Bedroom items:', items.map(i => i.concept));
  return items;
};

// Find all items with specific tag
const findByMultipleTags = async (tags) => {
  const results = await Promise.all(
    tags.map(tag => searchVocabularyByTag(tag))
  );

  // Flatten and deduplicate
  const unique = [...new Set(results.flat().map(r => r.id))]
    .map(id => results.flat().find(r => r.id === id));

  return unique;
};

// Usage
const homeItems = await findByMultipleTags(['bedroom', 'kitchen', 'bathroom']);
```

---

### Most Used Elements

```javascript
const getMostUsed = async (limit = 10) => {
  const all = await getAllVocabulary();

  // Sort by usage_count descending
  const sorted = all.sort((a, b) => b.usage_count - a.usage_count);

  return sorted.slice(0, limit);
};

// Display top 10
const topElements = await getMostUsed(10);
topElements.forEach((el, i) => {
  console.log(`${i + 1}. ${el.concept} (used ${el.usage_count} times)`);
});
```

---

### Fuzzy Search by i18n Labels

```javascript
const searchByLabel = async (query, lang = 'en') => {
  const all = await getAllVocabulary();
  const lowerQuery = query.toLowerCase();

  return all.filter(entry => {
    const label = entry.i18n[lang]?.toLowerCase() || '';
    return label.includes(lowerQuery);
  });
};

// Usage
const results = await searchByLabel('casa', 'es');
console.log('Spanish matches:', results.map(r => r.i18n.es));
```

---

## Import/Export

### Export Complete Workspace

**Current (localStorage):**

```javascript
const { exportHistory } = useSVGStorage();

const handleExport = () => {
  exportHistory();
  // Downloads: pictoforge_backup_[timestamp].json
};
```

---

**Planned (IndexedDB):**

```javascript
const { exportWorkspace } = useIndexedDB();

const handleExport = async () => {
  const workspace = await exportWorkspace();

  // Create download
  const json = JSON.stringify(workspace, null, 2);
  const blob = new Blob([json], { type: 'application/json' });
  const url = URL.createObjectURL(blob);

  const a = document.createElement('a');
  a.href = url;
  a.download = `pictoforge-workspace-${Date.now()}.json`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);

  console.log('✓ Exported workspace');
};
```

---

### Import from File

```javascript
const { importWorkspace } = useIndexedDB();

const handleImport = (event) => {
  const file = event.target.files[0];
  if (!file) return;

  const reader = new FileReader();
  reader.onload = async (e) => {
    try {
      const data = JSON.parse(e.target.result);

      // Merge with existing data
      const stats = await importWorkspace(data, true);

      console.log(`✓ Import complete:`);
      console.log(`  - ${stats.pictograms} pictograms`);
      console.log(`  - ${stats.vocabulary} vocabulary entries`);
      console.log(`  - ${stats.settings} settings`);

      if (stats.errors.length > 0) {
        console.warn(`⚠️ ${stats.errors.length} errors occurred`);
      }
    } catch (error) {
      console.error('✗ Import failed:', error);
      alert('Failed to import workspace. Check file format.');
    }
  };
  reader.readAsText(file);
};

// In component
<input
  type="file"
  accept=".json"
  onChange={handleImport}
  style={{ display: 'none' }}
  ref={fileInputRef}
/>
<button onClick={() => fileInputRef.current.click()}>
  Import Workspace
</button>
```

---

### Selective Export (Only Vocabulary)

```javascript
const exportVocabularyOnly = async () => {
  const vocabulary = await getAllVocabulary();

  const exportData = {
    version: '1.0',
    exported_at: new Date().toISOString(),
    type: 'vocabulary',
    entries: vocabulary
  };

  const json = JSON.stringify(exportData, null, 2);
  const blob = new Blob([json], { type: 'application/json' });

  // Download
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `vocabulary-${Date.now()}.json`;
  a.click();
  URL.revokeObjectURL(url);
};
```

---

## Storage Management

### Check Storage Quota

```javascript
const StorageStatus = () => {
  const [quota, setQuota] = useState(null);
  const { getStorageQuota } = useIndexedDB();

  useEffect(() => {
    checkQuota();
  }, []);

  const checkQuota = async () => {
    const info = await getStorageQuota();
    setQuota(info);
  };

  if (!quota) return <div>Loading...</div>;

  const warningThreshold = 80; // 80%
  const isHighUsage = quota.percentage > warningThreshold;

  return (
    <div>
      <h3>Storage Usage</h3>
      <p>Used: {quota.usageMB} MB</p>
      <p>Available: {quota.quotaGB} GB</p>
      <p>
        Percentage: {quota.percentage}%
        {isHighUsage && <span style={{ color: 'red' }}> ⚠️ High</span>}
      </p>
      <p>Persistent: {quota.persisted ? '✓ Yes' : '✗ No'}</p>
    </div>
  );
};
```

---

### Request Persistent Storage

```javascript
const RequestPersistence = () => {
  const { requestPersistentStorage, getStorageQuota } = useIndexedDB();
  const [persisted, setPersisted] = useState(false);

  useEffect(() => {
    checkPersistence();
  }, []);

  const checkPersistence = async () => {
    const quota = await getStorageQuota();
    setPersisted(quota.persisted);
  };

  const handleRequest = async () => {
    const granted = await requestPersistentStorage();
    if (granted) {
      alert('✓ Data is now protected from automatic deletion');
      setPersisted(true);
    } else {
      alert('⚠️ Persistent storage was denied');
    }
  };

  return (
    <div>
      {persisted ? (
        <p>✓ Storage is persistent</p>
      ) : (
        <div>
          <p>⚠️ Storage is not persistent</p>
          <p>Your data may be deleted if space is needed.</p>
          <button onClick={handleRequest}>
            Request Persistent Storage
          </button>
        </div>
      )}
    </div>
  );
};
```

---

### Auto-Cleanup Old Data

```javascript
const cleanupOldRejected = async () => {
  const pictograms = await getAllPictograms();

  // Find rejected older than 30 days
  const thirtyDaysAgo = Date.now() - (30 * 24 * 60 * 60 * 1000);
  const oldRejected = pictograms.filter(p =>
    p.audit_status === 'rejected' && p.timestamp < thirtyDaysAgo
  );

  console.log(`Found ${oldRejected.length} old rejected pictograms`);

  // Delete them
  let deleted = 0;
  for (const p of oldRejected) {
    await deletePictogram(p.id);
    deleted++;
  }

  console.log(`✓ Cleaned up ${deleted} old pictograms`);
  return deleted;
};
```

---

## Error Handling

### Graceful Degradation

```javascript
const { savePictogram, error, loading } = useIndexedDB();

const handleSave = async () => {
  // Check for errors
  if (error) {
    console.error('Database error:', error);
    // Fall back to localStorage
    localStorage.setItem('backup_svg', svgContent);
    alert('⚠️ Database unavailable. Saved to temporary storage.');
    return;
  }

  // Check if loading
  if (loading) {
    console.log('Waiting for database...');
    return;
  }

  // Save normally
  try {
    await savePictogram(svgContent);
    console.log('✓ Saved to database');
  } catch (err) {
    console.error('Save failed:', err);
    // Fall back
    localStorage.setItem('backup_svg', svgContent);
    alert('⚠️ Save failed. Saved to temporary storage.');
  }
};
```

---

### Retry Logic

```javascript
const saveWithRetry = async (data, maxRetries = 3) => {
  let attempt = 0;

  while (attempt < maxRetries) {
    try {
      const id = await savePictogram(data);
      console.log(`✓ Saved on attempt ${attempt + 1}`);
      return id;
    } catch (error) {
      attempt++;
      console.warn(`Attempt ${attempt} failed:`, error);

      if (attempt < maxRetries) {
        // Wait before retry (exponential backoff)
        await new Promise(resolve =>
          setTimeout(resolve, Math.pow(2, attempt) * 1000)
        );
      } else {
        throw new Error(`Failed after ${maxRetries} attempts`);
      }
    }
  }
};
```

---

## Advanced Patterns

### Lazy Loading with Pagination

```javascript
const VocabularyList = () => {
  const [entries, setEntries] = useState([]);
  const [page, setPage] = useState(0);
  const pageSize = 50;

  const { getAllVocabulary } = useIndexedDB();

  const loadPage = async (pageNum) => {
    const all = await getAllVocabulary();
    const start = pageNum * pageSize;
    const end = start + pageSize;
    const slice = all.slice(start, end);
    setEntries(slice);
  };

  useEffect(() => {
    loadPage(page);
  }, [page]);

  return (
    <div>
      <ul>
        {entries.map(entry => (
          <li key={entry.id}>{entry.i18n.en}</li>
        ))}
      </ul>
      <button onClick={() => setPage(p => Math.max(0, p - 1))}>
        Previous
      </button>
      <button onClick={() => setPage(p => p + 1)}>
        Next
      </button>
    </div>
  );
};
```

---

### Debounced Auto-Save

```javascript
import { useDebounce } from '@/hooks/useDebounce';

const SVGEditor = () => {
  const [svgContent, setSvgContent] = useState('');
  const { savePictogram } = useIndexedDB();

  // Debounce content changes
  const debouncedContent = useDebounce(svgContent, 2000);

  // Auto-save when debounced content changes
  useEffect(() => {
    if (debouncedContent) {
      savePictogram(debouncedContent, 'pending');
      console.log('✓ Auto-saved');
    }
  }, [debouncedContent]);

  return (
    <textarea
      value={svgContent}
      onChange={(e) => setSvgContent(e.target.value)}
      placeholder="Edit SVG..."
    />
  );
};
```

---

### Transaction-like Batch Operations

```javascript
const performBatchUpdate = async (pictogramIds, newStatus) => {
  const results = {
    success: [],
    failed: []
  };

  for (const id of pictogramIds) {
    try {
      await updatePictogramStatus(id, newStatus);
      results.success.push(id);
    } catch (error) {
      console.error(`Failed to update ${id}:`, error);
      results.failed.push({ id, error: error.message });
    }
  }

  console.log(`✓ Updated ${results.success.length} pictograms`);
  if (results.failed.length > 0) {
    console.warn(`⚠️ Failed: ${results.failed.length}`);
  }

  return results;
};

// Usage: Approve multiple pictograms
const approveAll = await performBatchUpdate(
  ['id-1', 'id-2', 'id-3'],
  'approved'
);
```

---

## Next Steps

- [Storage Overview](./README.md) - System overview
- [Data Structures](./data-structures.md) - Complete schemas
- [API Methods](./api-methods.md) - Method reference

---

[← API Methods](./api-methods.md) | [Storage Overview](./README.md)
