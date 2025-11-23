# DEPRECATED - See New Documentation

**This file has been replaced by comprehensive English documentation.**

**➡️ New Location:** [`docs/storage/data-structures.md`](./storage/data-structures.md)

The new documentation includes:
- Complete schema definitions in English
- Unified vocabulary structure (canonical + blends)
- TypeScript interfaces
- Detailed examples for all entry types
- Index specifications

---

# PictoForge Storage Structure (Legacy - Spanish)

## Cambio: Unificar `canonical` + `blends` → `vocabulary`

### Razonamiento

Ambos stores representan **vocabulario local verificado**:
- Elementos simples (`pillow`, `bed`)
- Conceptos compuestos (`safe house` = casa+candado)
- Operadores visuales (`+` para plural)
- Modificadores (`limpieza` = 3 brillos)

Todos necesitan:
- **i18n** (nombres localizados)
- **Verificación** (approved/rejected)
- **Índices** (concept, role, tags)
- **Conteo de uso** (usage_count)

## Nueva Estructura

### Store 1: `pictograms` (trabajo activo)

Sin cambios. Sigue siendo el workspace de generaciones recientes.

```javascript
{
  id: 'uuid-v4',
  svg: '<svg>...</svg>',              // Self-contained
  timestamp: 1732147200000,
  audit_status: 'pending' | 'approved' | 'rejected',

  // Índices extraídos
  utterance: 'Make the bed',
  domain: 'home',
  intent: 'directive',
  language: 'en-NZ',
  concepts: ['bed', 'person', 'make']
}
```

### Store 2: `vocabulary` (vocabulario local verificado)

**Unificación de canonical + blends**

```javascript
{
  // Identificación
  id: 'safe-house-01',
  concept: 'safety+house',            // Concepto (puede ser compuesto)

  // Tipo de entrada
  type: 'object' | 'action' | 'modifier' | 'operator',

  // Representación visual
  svg: '<g><path.../> <path.../></g>',

  // Fórmula (solo para compuestos)
  formula: 'house + lock_inside',     // null para elementos simples

  // Internacionalización
  i18n: {
    en: 'safe house',
    es: 'casa segura',
    mi: 'whare haumaru',
    arn: 'ruka seguro'
  },

  // Metadata
  verified: true,
  usage_count: 42,
  tags: ['safety', 'house', 'security'],

  // Roles semánticos (para elementos que son parte de frames)
  role: 'object' | 'agent' | 'theme' | 'instrument' | null,

  // Timestamp
  timestamp: 1732147200000,

  // Source (opcional: de dónde vino)
  source: 'pictonet' | 'arasaac' | 'manual' | 'extracted'
}
```

**Índices**:
- `concept` - Búsqueda por concepto
- `type` - Filtrar por tipo (object/action/modifier/operator)
- `verified` - Solo elementos verificados
- `usage_count` - Ordenar por popularidad
- `tags` - Búsqueda por tags (array index)

### Ejemplos de Entradas

#### 1. Elemento simple (objeto)

```javascript
{
  id: 'pillow-01',
  concept: 'pillow',
  type: 'object',
  svg: '<path id="pillow" d="..."/>',
  formula: null,
  i18n: {
    en: 'pillow',
    es: 'almohada',
    mi: 'urunga',
    arn: 'alko'
  },
  verified: true,
  usage_count: 15,
  tags: ['bed', 'furniture', 'bedroom'],
  role: 'object',
  timestamp: 1732147200000,
  source: 'extracted'
}
```

#### 2. Acción con pose humana

```javascript
{
  id: 'person-make-01',
  concept: 'make',
  type: 'action',
  svg: '<g id="person"><path arm.../><path body.../></g>',
  formula: null,
  i18n: {
    en: 'make',
    es: 'hacer',
    mi: 'hanga',
    arn: 'küdawün'
  },
  verified: true,
  usage_count: 28,
  tags: ['action', 'human', 'verb'],
  role: 'agent',
  timestamp: 1732147200000,
  source: 'pictonet'
}
```

#### 3. Concepto compuesto (blend)

```javascript
{
  id: 'safe-house',
  concept: 'safety+house',
  type: 'object',
  svg: '<g><path house.../><path lock.../></g>',
  formula: 'house + lock_inside',
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

#### 4. Operador visual (como ARASAAC)

```javascript
{
  id: 'operator-plural',
  concept: 'plural',
  type: 'operator',
  svg: '<text font-size="24" fill="#000">+</text>',
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

#### 5. Modificador visual

```javascript
{
  id: 'modifier-clean',
  concept: 'cleanliness',
  type: 'modifier',
  svg: '<g><circle sparkle.../><circle.../><circle.../></g>',
  formula: '3_sparkles',
  i18n: {
    en: 'clean',
    es: 'limpio',
    mi: 'ma',
    arn: 'küme'
  },
  verified: true,
  usage_count: 18,
  tags: ['modifier', 'state', 'quality'],
  role: null,
  timestamp: 1732147200000,
  source: 'manual'
}
```

#### 6. Modificador de acción (cambiar/refresh)

```javascript
{
  id: 'modifier-change',
  concept: 'change',
  type: 'modifier',
  svg: '<g><path arrow-circle-1.../><path arrow-circle-2.../></g>',
  formula: '2_circular_arrows',
  i18n: {
    en: 'change',
    es: 'cambiar',
    mi: 'whakarereke',
    arn: 'azkünoal'
  },
  verified: true,
  usage_count: 22,
  tags: ['modifier', 'action', 'transform'],
  role: null,
  timestamp: 1732147200000,
  source: 'manual'
}
```

### Store 3: `settings` (sin cambios)

Configuración local de la app.

## Ventajas de la Unificación

1. **Simplificación**: Un solo lugar para todo el vocabulario
2. **i18n nativo**: Cada entrada tiene traducciones embebidas
3. **Flexibilidad**: `type` y `formula` permiten distinguir sin separar stores
4. **Escalabilidad**: Fácil agregar nuevos tipos (animales, emociones, etc.)
5. **Tesauros**: Los `tags` permiten relaciones semánticas
6. **Source tracking**: Saber de dónde vino cada elemento (ARASAAC, PictoNet, manual)

## Queries Comunes

```javascript
// Todos los objetos
vocabulary.index('type').getAll('object')

// Elementos más usados
vocabulary.index('usage_count').openCursor(null, 'prev')

// Buscar por tag
vocabulary.index('tags').getAll('safety')

// Solo operadores verificados
vocabulary.index('type').getAll('operator')
  .then(ops => ops.filter(o => o.verified))
```

## Migración de Código Existente

### Antes (2 stores)

```javascript
await saveCanonical({ id, svg, concept, role, verified })
await saveBlend({ id, concept, formula, svg, description })
```

### Después (1 store)

```javascript
await saveVocabulary({
  id,
  concept,
  type: 'object', // o 'action', 'modifier', 'operator'
  svg,
  formula: null, // o 'house + lock_inside'
  i18n: { en: '...', es: '...', mi: '...', arn: '...' },
  verified: true,
  tags: ['...']
})
```

## Tesauros y Relaciones Semánticas

Los `tags` permiten crear relaciones entre conceptos:

```javascript
// Todos los conceptos relacionados con "bed"
const bedRelated = await vocabulary.index('tags').getAll('bed');
// → ['pillow', 'mattress', 'sheet', 'make_bed', ...]

// Crear tesauro de sinónimos
const synonyms = {
  'house': ['home', 'dwelling', 'residence'],
  'clean': ['tidy', 'neat', 'organized']
};

// Buscar por sinónimos
function findBySynonym(word) {
  const concepts = [word, ...(synonyms[word] || [])];
  return Promise.all(concepts.map(c =>
    vocabulary.index('concept').getAll(c)
  ));
}
```

## Conclusión

Estructura simplificada:
- `pictograms` - Trabajo activo
- `vocabulary` - Todo el vocabulario local (unificado)
- `settings` - Configuración de la app

Esto refleja mejor la realidad: todo es **vocabulario** que el usuario va construyendo y auditando, con diferentes tipos y características, pero fundamentalmente lo mismo.
