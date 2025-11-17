# Semantic Layer - PictoForge

**Status**: Phase 2.1 - Infrastructure Setup (In Progress)
**Version**: 0.1.0
**Last Updated**: 2025-11-18

---

## Overview

The Semantic Layer is an **optional, non-invasive addition** to PictoForge that enables round-trip editing between SVG visual representation and NLU (Natural Language Understanding) semantic structure.

**Key Principle**: This layer does NOT modify or break existing SVG editor functionality. It adds semantic awareness as metadata that enriches the editing experience when available.

## Architecture

```
┌─────────────────────────────────────────┐
│  Existing Visual Layer (UNCHANGED)      │
│  src/components/SVGViewer.jsx           │
│  src/components/SVGHierarchy.jsx        │  ← Continues working independently
│  src/hooks/useSVGParser.js              │
│  src/services/SVGWorld.js               │
└─────────────────────────────────────────┘
                    ↕
         (Optional integration)
                    ↕
┌─────────────────────────────────────────┐
│  Semantic Layer (NEW, OPTIONAL)         │
│  src/semantic/                          │
│  ├── services/NLUSchemaParser.js        │  ← Parses NLU Schema
│  ├── services/SemanticMapper.js         │  ← Maps SVG ↔ NLU
│  ├── components/SemanticPanel.jsx       │  ← UI for semantic editing
│  └── hooks/useNLUSchema.js              │  ← React integration
└─────────────────────────────────────────┘
                    ↕
┌─────────────────────────────────────────┐
│  NLU Schema (EXTERNAL REFERENCE)        │
│  schemas/nlu-schema/ (git submodule)    │  ← Independently updatable
│  └── pictonet-nlu-1.0.1.schema.json     │
└─────────────────────────────────────────┘
```

## Integration Philosophy

### Feature Flag Pattern

The semantic layer is activated only when an NLU schema is present:

```javascript
// In App.jsx
const [nluSchema, setNLUSchema] = useState(null) // null = semantic layer disabled

return (
  <>
    {/* Existing editor - works with or without schema */}
    <SVGViewer svg={svgContent} />

    {/* Semantic panel - only renders when schema exists */}
    {nluSchema && (
      <SemanticPanel
        schema={nluSchema}
        svg={svgContent}
      />
    )}
  </>
)
```

### Non-Breaking Integration

1. **SVG Editor Works Independently**: All existing editing tools (Select, Node, Pen) function without any NLU schema
2. **Metadata Enrichment**: When schema is present, SVG elements gain `data-*` attributes for semantic mapping
3. **Bidirectional Sync**: Changes in either layer update the other, but never break existing functionality
4. **Graceful Degradation**: Missing or invalid schema falls back to pure visual editing

## Directory Structure

```
src/semantic/
├── README.md                    (this file)
├── services/
│   ├── NLUSchemaParser.js       Parser & validator for NLU schemas
│   ├── SemanticMapper.js        Maps SVG elements ↔ NLU frames/roles
│   └── RoundTripSyncer.js       Coordinates bidirectional updates
├── components/
│   ├── SemanticPanel.jsx        Main semantic editor UI
│   ├── NLUTreeView.jsx          Tree visualization of schema
│   ├── FrameEditor.jsx          Edit individual frames
│   └── VisualGuidelinesEditor.jsx  Edit visual_guidelines
├── hooks/
│   ├── useNLUSchema.js          Manage NLU schema state
│   ├── useSemanticMapping.js    Manage SVG ↔ NLU mappings
│   └── useRoundTrip.js          Coordinate sync operations
└── types/
    └── nlu-schema.d.ts          TypeScript definitions
```

## NLU Schema Reference

The NLU Schema format is maintained in a separate repository as a **git submodule**:

- **Repository**: https://github.com/mediafranca/nlu-schema
- **Local Path**: `schemas/nlu-schema/`
- **Schema File**: `schemas/nlu-schema/pictonet-nlu-1.0.1.schema.json`
- **Version**: 1.0.1 (stable)

### Key Schema Components

#### 1. Frames (Semantic Units)
```json
{
  "frames": [
    {
      "id": "f1",
      "frame_name": "Directed_action",
      "lexical_unit": "make",
      "roles": {
        "Agent": {...},    // Maps to SVG figure/actor
        "Theme": {...}     // Maps to SVG object
      }
    }
  ]
}
```

#### 2. Visual Guidelines (Layout Directives)
```json
{
  "visual_guidelines": {
    "focus_actor": "you",        // Primary visual subject
    "context": "bedroom",        // Environmental setting
    "temporal": "immediate",     // Timeline context
    "salience": {...}            // Importance weights [0-1]
  }
}
```

#### 3. Logical Form
```json
{
  "logical_form": {
    "event": "make(you, bed)",
    "modality": "want(I, event)"
  }
}
```

### SVG ↔ NLU Mapping Strategy

| NLU Schema Field | SVG Representation | Mapping Attribute |
|------------------|-------------------|-------------------|
| `frames[].id` | `<g>` group | `data-frame-id="f1"` |
| `frames[].roles.Agent` | Figure/actor element | `data-role="Agent"` |
| `frames[].roles.Theme` | Object element | `data-role="Theme"` |
| `visual_guidelines.focus_actor` | Element attribute | `data-focus="true"` |
| `visual_guidelines.context` | Background group | `data-context="bedroom"` |

## Development Phases

### Phase 2.1: Infrastructure Setup ✅ (Current)
- [x] Add nlu-schema as git submodule
- [x] Create `src/semantic/` folder structure
- [x] Install dependencies (ajv, ajv-formats)
- [x] Document architecture

### Phase 2.2: Parser Service (Next)
- [ ] Implement `NLUSchemaParser.js`
- [ ] Load and validate schemas
- [ ] Extract frames, visual_guidelines
- [ ] Write unit tests

### Phase 2.3: Semantic Panel UI
- [ ] Create basic `SemanticPanel.jsx` component
- [ ] Display schema as JSON viewer (read-only)
- [ ] Integrate into App.jsx (conditional render)

### Phase 2.4: Bidirectional Mapping
- [ ] Implement `SemanticMapper.js`
- [ ] Add `data-*` attributes to SVG elements
- [ ] Click SVG → highlight in semantic panel
- [ ] Edit semantic panel → update SVG metadata

### Phase 2.5: Round-Trip Sync
- [ ] Implement `RoundTripSyncer.js`
- [ ] Visual edits → update geometry in schema
- [ ] Semantic edits → flag affected SVG elements
- [ ] Conflict detection and resolution

## Usage Example (Future)

```javascript
// Load SVG with NLU Schema
import { useNLUSchema } from '@/semantic/hooks/useNLUSchema'
import { SemanticPanel } from '@/semantic/components/SemanticPanel'

function App() {
  const [svgContent, setSvgContent] = useState(null)
  const { nluSchema, loadSchema, updateSchema } = useNLUSchema()

  const handleLoadWithSchema = async (svgFile, schemaFile) => {
    const svg = await loadSVG(svgFile)
    const schema = await loadSchema(schemaFile)

    setSvgContent(svg)
    // Semantic panel will automatically activate
  }

  return (
    <div className="app">
      <SVGViewer svg={svgContent} />

      {/* Only renders when schema is loaded */}
      {nluSchema && (
        <SemanticPanel
          schema={nluSchema}
          onSchemaChange={updateSchema}
        />
      )}
    </div>
  )
}
```

## Dependencies

### External Libraries
- **ajv** (^8.17.1): JSON Schema validator
- **ajv-formats** (^3.0.1): Extended format support for ajv

### Internal Dependencies
- None from existing codebase (intentionally isolated)

### External Schema Reference
- **nlu-schema** (git submodule): Schema definition and validation

## Testing Strategy

### Unit Tests
- `NLUSchemaParser.test.js`: Schema parsing and validation
- `SemanticMapper.test.js`: SVG ↔ NLU mapping logic
- `RoundTripSyncer.test.js`: Bidirectional synchronization

### Integration Tests
- Load SVG with schema and verify mapping
- Edit SVG element and verify schema update
- Edit schema and verify SVG update
- Handle invalid schemas gracefully

### Test Fixtures
Located in `schemas/nlu-schema/tests/`:
- Valid schemas with various frame structures
- Invalid schemas for error handling
- Edge cases (missing fields, malformed data)

## Contributing Guidelines

When working on the semantic layer:

1. **Never modify existing SVG editor code** unless absolutely necessary
2. **Use feature flags** for all new semantic functionality
3. **Graceful degradation** - system must work without schema
4. **Test without schema** - ensure existing features still work
5. **Document mappings** - clearly explain SVG ↔ NLU relationships

## References

- **Project Plan**: `docs/plan.md` (full vision)
- **Implementation Roadmap**: `docs/ROADMAP.md` (6-phase plan)
- **NLU Schema Repo**: https://github.com/mediafranca/nlu-schema
- **NLU Schema Docs**: `schemas/nlu-schema/README.md`

## Updating NLU Schema Reference

The nlu-schema is a git submodule. To update to the latest version:

```bash
# Update submodule to latest commit
cd schemas/nlu-schema
git pull origin main
cd ../..

# Commit the submodule update
git add schemas/nlu-schema
git commit -m "Update nlu-schema to latest version"
```

To check current submodule version:
```bash
git submodule status
```

---

**Next Steps**: Implement `NLUSchemaParser.js` service (Phase 2.2)
