# ⚠️ DEPRECATED - See New Documentation

**This file has been replaced by comprehensive English documentation.**

**➡️ New Location:** [`docs/storage/README.md`](./storage/README.md)

The new storage documentation provides:
- Complete English documentation
- Detailed data structures and schemas
- Full API reference with examples
- Current (localStorage) and planned (IndexedDB) implementations
- Usage patterns and best practices

---

# PictoForge Storage System (Legacy - Spanish)

## Arquitectura

El sistema de almacenamiento de PictoForge usa **IndexedDB** como base de datos local en el navegador. La arquitectura está diseñada alrededor del concepto de **SVG self-contained**: cada SVG contiene toda su información semántica embebida.

### Principio fundamental: SVG como fuente de verdad

Los SVGs de PictoForge incluyen:
- `<metadata>` con NLU Schema JSON completo
- `<title>` y `<desc>` con descripción textual
- `<style>` con CSS embebido
- Atributos `data-*` con roles semánticos
- IDs semánticos en elementos (`id="g-bed"`, `id="pillow"`, etc.)

**No duplicamos datos**. El SVG es la única fuente de verdad, y solo extraemos campos para crear índices de búsqueda rápida.

## Capacidad

### Límites por browser (2025)

| Browser | Temporal Storage | Persistent Storage |
|---------|------------------|-------------------|
| Chrome/Edge | 60% del espacio libre en disco | Sin límite con permisos |
| Firefox | 10% del espacio libre (max 10GB) | Sin límite con permisos |
| Safari | ~1GB (con prompts progresivos) | N/A |

### Estimación para PictoForge

```
Pictograma promedio:  ~7.5KB (SVG 5KB + metadata 2.5KB)
Capacidad con 50MB:   ~6,600 pictogramas
Capacidad con 100MB:  ~13,300 pictogramas

Vocabulario objetivo: 10,000 elementos = ~77MB
Viabilidad: ✅ Totalmente viable en todos los browsers modernos
```

## Estructura de Datos

### 1. Store: `pictograms` (trabajo activo)

```javascript
{
  id: 'uuid-v4',
  svg: '<svg>...</svg>',              // ← TODO está aquí (self-contained)
  timestamp: 1732147200000,
  audit_status: 'pending' | 'approved' | 'rejected',

  // Campos extraídos para búsqueda (no son fuente de verdad)
  utterance: 'Make the bed',          // De <metadata>.utterance.text
  domain: 'home',                     // De svg[data-domain]
  intent: 'directive',                // De svg[data-intent]
  language: 'en-NZ',                  // De svg[lang]
  concepts: ['bed', 'person', 'make'] // De <metadata>.concepts[].id
}
```

**Índices**:
- `timestamp` - Para ordenar por recientes
- `audit_status` - Para filtrar pending/approved/rejected
- `utterance` - Para búsqueda por texto
- `domain` - Para filtrar por dominio (home, health, etc.)

### 2. Store: `canonical` (elementos verificados)

Vocabulario canónico de elementos reutilizables: objetos individuales, poses humanas asociadas a verbos, etc.

```javascript
{
  id: 'pillow-01',
  svg: '<path id="pillow" d="..."/>',  // ← Elemento SVG individual
  concept: 'pillow',
  role: 'object' | 'action' | 'agent',
  verified: true,
  usage_count: 42,                     // Cuántas veces se usó
  timestamp: 1732147200000
}
```

**Índices**:
- `concept` - Para búsqueda por concepto
- `role` - Para filtrar por tipo (object/action/agent)
- `verified` - Solo elementos verificados
- `usage_count` - Para popularidad

**Ejemplos**:
```javascript
// Objeto simple
{ id: 'pillow-01', concept: 'pillow', role: 'object', svg: '<path.../>' }

// Verbo con pose humana (define estilo y abstracción)
{ id: 'person-make-01', concept: 'make', role: 'action', svg: '<g person.../>' }
```

### 3. Store: `blends` (fórmulas conceptuales)

Conceptos compuestos con fórmula convencional establecida.

```javascript
{
  id: 'safe-house',
  concept: 'safety+house',
  formula: 'house + lock_inside',
  svg: '<g><path.../> <path.../></g>',
  description: 'Casa con candado dentro para representar seguridad',
  timestamp: 1732147200000
}
```

**Índices**:
- `concept` - Para búsqueda

**Ejemplos**:
- `safe house` → casa + candado dentro
- `care` → mano sosteniendo un corazón
- `limpieza` → 3 brillos (sparkles)
- `cambiar` → 2 flechas circulares (refresh icon)

### 4. Store: `settings` (configuración local)

Preferencias de la aplicación. Key-value store simple.

```javascript
// UI preferences
{ key: 'language', value: 'es' }
{ key: 'theme', value: 'dark' }
{ key: 'canvas_bg_color', value: '#1a1a1a' }

// Generation settings (para PictoNet)
{ key: 'style_prompt', value: 'AAC pictogram, high contrast...' }
{ key: 'default_domain', value: 'home' }
{ key: 'default_language', value: 'en-NZ' }

// CSS Templates
{ key: 'css_template_hc', value: 'svg.hc .f { ... }' }
{ key: 'css_template_color', value: '/* Future: color styles */' }

// Storage preferences
{ key: 'auto_export_enabled', value: true }
{ key: 'auto_export_threshold', value: 100 }
{ key: 'persistent_storage_requested', value: false }
```

## API de Uso

### Importar el hook

```javascript
import { useStorage } from '@/hooks/useStorage';

function MyComponent() {
  const {
    // Estado
    loading,
    error,
    initialized,

    // Pictograms
    savePictogram,
    getPictogram,
    getAllPictograms,
    getPictogramsByStatus,
    updatePictogramStatus,
    deletePictogram,

    // Canonical
    saveCanonical,
    getAllCanonical,
    getCanonicalByConcept,
    incrementCanonicalUsage,

    // Blends
    saveBlend,
    getAllBlends,

    // Settings
    saveSetting,
    getSetting,
    getAllSettings,

    // Storage quota
    getStorageQuota,
    requestPersistentStorage,

    // Export/Import
    exportWorkspace,
    importWorkspace,
    clearAllData
  } = useStorage();

  // ... usar los métodos
}
```

### Ejemplos de uso

#### Guardar un pictograma

```javascript
const handleSave = async () => {
  try {
    const id = await savePictogram(svgContent, 'pending');
    console.log('Pictogram saved with ID:', id);
  } catch (error) {
    console.error('Error saving:', error);
  }
};
```

#### Buscar pictogramas pendientes de auditoría

```javascript
const loadPending = async () => {
  const pending = await getPictogramsByStatus('pending');
  console.log(`Found ${pending.length} pending pictograms`);
};
```

#### Guardar un elemento canónico

```javascript
// Después de auditar un pictograma, extraer elemento individual
const saveAsCanonical = async (elementId) => {
  const svgString = svgData.content; // SVG completo
  const elementSVG = SVGMetadataExtractor.extractElement(svgString, elementId);

  await saveCanonical({
    id: `${elementId}-01`,
    svg: elementSVG,
    concept: elementId, // 'pillow', 'bed', etc.
    role: 'object',
    verified: true
  });
};
```

#### Exportar workspace completo

```javascript
const handleExport = async () => {
  const workspace = await exportWorkspace();

  const json = JSON.stringify(workspace, null, 2);
  const blob = new Blob([json], { type: 'application/json' });
  const url = URL.createObjectURL(blob);

  const a = document.createElement('a');
  a.href = url;
  a.download = `pictoforge-workspace-${Date.now()}.json`;
  a.click();
};
```

#### Verificar cuota de almacenamiento

```javascript
import { useStorageQuota } from '@/hooks/useStorage';

function StorageInfo() {
  const { quota, loading, refresh } = useStorageQuota();

  if (loading) return <p>Loading...</p>;

  return (
    <div>
      <p>Used: {quota.usageMB} MB</p>
      <p>Available: {quota.quotaGB} GB</p>
      <p>Usage: {quota.percentage}%</p>
      <p>Persistent: {quota.persisted ? 'Yes' : 'No'}</p>
    </div>
  );
}
```

## Flujo de Trabajo Recomendado

### Fase 1: Generación y Auditoría

1. **Usuario genera pictograma** con PictoNet
2. **Guardar en `pictograms`** con `audit_status: 'pending'`
3. **Usuario revisa y edita** en PictoForge
4. **Aprobar/Rechazar**:
   - Aprobado → `audit_status: 'approved'`
   - Rechazado → `audit_status: 'rejected'`

### Fase 2: Extracción de Vocabulario

5. **De pictogramas aprobados**, extraer elementos útiles:
   - Objetos simples → `canonical` store
   - Poses/acciones → `canonical` store con role='action'
6. **Identificar blends** útiles → `blends` store

### Fase 3: Reutilización (Future)

7. **PictoNet consulta** `canonical` y `blends` como ejemplos
8. **Incrementar** `usage_count` de elementos usados
9. **Mostrar sugerencias** basadas en popularidad

## Storage Persistente

### ¿Por qué solicitarlo?

Sin storage persistente, el browser puede eliminar datos si:
- Queda poco espacio en disco
- El sitio no se usa por mucho tiempo
- El browser necesita liberar memoria

### Cómo solicitarlo

```javascript
const { requestPersistentStorage } = useStorage();

const handleRequest = async () => {
  const granted = await requestPersistentStorage();
  if (granted) {
    console.log('✓ Data is now protected from automatic deletion');
  } else {
    console.warn('⚠️ User denied persistent storage');
  }
};
```

### UI Component

El componente `StorageStatus` (en `SettingsView`) muestra:
- Espacio usado/disponible
- Porcentaje de uso
- Estado de persistencia
- Botón para solicitar persistencia

## Export/Import

### Export

Permite backup manual del workspace completo:

```javascript
const workspace = await exportWorkspace();
// → { version, exported_at, pictograms, canonical, blends, settings }
```

Formato JSON portable que puede compartirse entre usuarios.

### Import

Dos modos:

```javascript
// Modo 1: Reemplazar todo (merge=false)
await importWorkspace(data, false);

// Modo 2: Merge con datos existentes (merge=true)
await importWorkspace(data, true);
```

Retorna estadísticas:
```javascript
{
  pictograms: 42,  // importados
  canonical: 15,
  blends: 8,
  settings: 12,
  errors: []       // array de errores si hubo
}
```

## Utilidades

### SVGMetadataExtractor

Extrae metadata de SVGs sin modificarlos:

```javascript
import { SVGMetadataExtractor } from '@/services/SVGMetadataExtractor';

// Parsear SVG completo
const metadata = SVGMetadataExtractor.parse(svgString);
// → { utterance, domain, intent, language, concepts, nluSchema, ... }

// Extraer elemento individual
const elementSVG = SVGMetadataExtractor.extractElement(svgString, 'pillow');
// → '<path id="pillow" d="..."/>'

// Validar SVG
const { valid, errors } = SVGMetadataExtractor.validate(svgString);

// Crear wrapper para preview
const wrappedSVG = SVGMetadataExtractor.wrapElement(elementHTML, styles);
// → '<svg>...<defs><style>...</style></defs>...</svg>'
```

## Troubleshooting

### Browser devuelve quota muy baja

Safari puede mostrar ~50MB inicialmente y pedir permisos progresivamente. Esto es normal.

### Datos desaparecen después de cerrar browser

- Verificar que persistent storage esté habilitado
- En modo incógnito, los datos SIEMPRE se eliminan al cerrar

### Error: "Transaction inactive"

IndexedDB requiere que todas las operaciones asíncronas dentro de una transacción se completen en el mismo event loop. Usar `await` correctamente.

### Storage quota exceeded

Exportar workspace y limpiar datos antiguos:

```javascript
// Export primero (backup)
const backup = await exportWorkspace();

// Eliminar pictogramas rechazados
const rejected = await getPictogramsByStatus('rejected');
for (const p of rejected) {
  await deletePictogram(p.id);
}
```

## Próximos Pasos

### Auto-export periódico (TODO)

```javascript
// Configurar en settings
await saveSetting('auto_export_enabled', true);
await saveSetting('auto_export_threshold', 100);

// Trigger automático cada N pictogramas aprobados
```

### Sync con backend (Phase 3+)

Federated identity + cloud sync para compartir vocabulario entre usuarios.

### LRU Cache en memoria (Optimización)

Para mejorar performance, cachear últimos 50-100 pictogramas en RAM.

## Referencias

- [IndexedDB API - MDN](https://developer.mozilla.org/en-US/docs/Web/API/IndexedDB_API)
- [Storage API - MDN](https://developer.mozilla.org/en-US/docs/Web/API/Storage_API)
- [Persistent Storage - web.dev](https://web.dev/persistent-storage/)
