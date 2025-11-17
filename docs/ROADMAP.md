# PictoForge Implementation Roadmap

**From Basic SVG Editor to Semantic Round-Trip System**

Version: 1.0
Last Updated: 2025-11-18

---

## Executive Summary

PictoForge currently exists as a **functional SVG visual editor** with solid coordinate transformation infrastructure (SVGWorld), basic editing tools, and file I/O capabilities. The target vision positions it as a **semantic round-trip editor** within the MediaFranca ecosystem - bridging visual SVG editing with semantic NLU schemas, integrating with PictoNet generative models, maintaining a local database/tesauro, and supporting federated knowledge sharing.

### The Gap

**Missing Core Systems (0% complete):**
- Semantic Layer (NLU Schema parser, editor, visualizer)
- Model Integration Layer (PictoNet API client, partial regeneration)
- Storage Layer (local database, tesauro, versioning)
- Input Layer extensions (multimodal image processing)
- Identity Layer (self-sovereign identity, contribution tracking)
- Federation Layer (exchange bundles, merge mechanisms)

**Incomplete Visual Layer (30-50% complete):**
- Node editing tool (structure exists, logic missing)
- Pen tool (structure only)
- Element duplication/deletion (stubbed)
- Transform accumulation fixes needed

**Working Foundation (90% complete):**
- SVG parsing and hierarchy visualization
- Coordinate transformation system (SVGWorld)
- Pan/zoom/select infrastructure
- File loading and export
- Undo/redo history
- Theming and i18n

### Estimated Scope

- **6 major implementation phases**
- **17-21 months development** (single developer)
- **+20,000-30,000 lines of code** (2-3x current size)
- **New dependencies**: Database, NLU parser, API client, crypto libraries

---

## Dependency Graph

Understanding critical dependencies between systems:

```
LAYER 0 (Foundation - Exists)
└── SVGWorld + Coordinate System
└── SVG Parser + Hierarchy
└── Basic File I/O

LAYER 1 (Visual Tools - Partially exists)
├── Node Editor (depends on: SVGWorld, PathDataProcessor)
├── Pen Tool (depends on: Node Editor)
└── Transform System fixes (depends on: SVGWorld)

LAYER 2 (Semantic Layer - Missing) ⭐ CRITICAL PATH
├── NLU Schema Parser (depends on: nothing - standalone)
├── NLU Schema Editor UI (depends on: NLU Parser)
└── Semantic-Visual Mapping (depends on: NLU Parser, SVG Hierarchy)

LAYER 3 (Storage Layer - Missing) ⭐ CRITICAL PATH
├── Local Database (depends on: nothing - foundational)
├── Pictogram Versioning (depends on: Database, NLU Schema)
└── Tesauro/Thesaurus (depends on: Database, NLU Schema)

LAYER 4 (Model Integration - Missing) ⭐ CRITICAL PATH
├── PictoNet API Client (depends on: NLU Schema)
├── Full Generation (depends on: API Client, Storage)
├── Partial Regeneration (depends on: API Client, Semantic-Visual Mapping)
└── RLHF Dataset Export (depends on: Storage, NLU Schema)

LAYER 5 (Federation - Missing)
├── Identity System (depends on: nothing - standalone)
├── Exchange Bundles (depends on: Storage, Identity)
└── Merge/Conflict Resolution (depends on: Storage, NLU Schema, Identity)

LAYER 6 (Advanced Features - Missing)
├── Multimodal Input (depends on: Model Integration, NLU Schema)
├── Drawing Mode (depends on: Visual Tools, Semantic Mapping)
└── Apple Pencil Support (depends on: Drawing Mode)
```

### Critical Path

For achieving core "round-trip" vision:

1. **NLU Schema System** (Layer 2) - Cannot proceed without semantic representation
2. **Storage Layer** (Layer 3) - Essential for persistence and versioning
3. **Semantic-Visual Mapping** (Layer 2) - Enables bidirectional sync
4. **Model Integration** (Layer 4) - Completes the generative loop

---

## Phase 1: Complete Visual Editor Foundation

**Timeline**: 2-3 months
**Complexity**: Medium
**Dependencies**: None (builds on existing infrastructure)

### Goal

Finish the visual editing layer to production quality before tackling semantic features.

### Why This Phase

The visual editing tools are partially implemented and create a solid, usable product that can be tested and refined. Provides immediate value and establishes UX patterns.

### Core Features

#### Complete Node Editor
- Node drag logic for path editing
- Bézier control handle manipulation
- Visual feedback for node types (corner/smooth/bezier)

#### Complete Pen Tool
- Add nodes to paths (click on path segment)
- Remove nodes (click on existing node)
- Change node types (toggle between corner/smooth)

#### Fix Transform Accumulation
- Properly handle nested transforms
- Matrix decomposition for resize/rotate
- Clean up transform string serialization

#### Element Operations
- Duplicate elements (with unique IDs)
- Delete elements (update hierarchy)
- Group/ungroup elements

### New Components/Services

**Services:**
- `src/services/PathEditor.js` - Higher-level path manipulation
- `src/services/TransformManager.js` - Unified transform handling

**Components:**
- `src/components/PenToolOverlay.jsx` - Visual feedback for pen tool

**Hooks:**
- `src/hooks/usePathEditor.js` - React wrapper for PathEditor

### Deliverables

- ✅ Fully functional visual SVG editor
- ✅ Complete test coverage for editing tools
- ✅ User documentation for all tools

### Success Metrics

- All editing tools functional and stable
- Can edit complex SVG files without breaking structure
- Test coverage >80% for new code

---

## Phase 2: Semantic Layer Foundation ⭐

**Timeline**: 3-4 months
**Complexity**: High
**Dependencies**: Phase 1 recommended (but not required)
**Status**: 🔴 CRITICAL - Core value proposition

### Goal

Implement the NLU Schema system and create the semantic editing interface.

### Why This Phase

This is the foundational layer for the "semantic editor" vision. Must be in place before model integration or storage makes sense. Validates architecture early and enables parallel work.

### Core Features

#### NLU Schema Parser & Validator
- Parse NLU-schema JSON format (as defined in plan.md Section 3)
- Validate schema structure
- Extract: utterance, blends[], components[], bindings[], semantic_roles[]
- Type definitions for TypeScript/JSDoc

#### Semantic Tree Editor UI
- JSON editor with syntax highlighting
- Tree view with collapsible nodes
- Visual representation of blends and components
- Edit individual properties (pose, gesture, object, modifiers)
- Mark elements as canonical/experimental

#### Semantic-Visual Mapping System
- Map SVG element IDs to semantic roles
- Maintain bidirectional lookup (SVG ↔ NLU)
- Store mappings as metadata in SVG or separate structure
- Visual indicators showing semantic ownership

#### Round-Trip Sync (Basic)
- Detect changes in semantic tree → flag affected SVG elements
- Detect changes in SVG → update geometry fields in NLU schema
- Conflict detection (user edits both sides)

### New Components/Services

**Services:**
- `src/services/NLUSchemaParser.js` - Parse and validate NLU schemas
- `src/services/SemanticMapper.js` - Manage SVG ↔ NLU mappings
- `src/services/RoundTripSyncer.js` - Coordinate bidirectional updates

**Components:**
- `src/components/SemanticPanel.jsx` - Main semantic editor panel
- `src/components/NLUTreeView.jsx` - Tree visualization of schema
- `src/components/BlendEditor.jsx` - Edit individual blends
- `src/components/SemanticVisualLinks.jsx` - Visual lines showing SVG-NLU connections

**Hooks:**
- `src/hooks/useNLUSchema.js` - Manage NLU schema state
- `src/hooks/useSemanticMapping.js` - Manage mappings
- `src/hooks/useRoundTrip.js` - Coordinate sync logic

### External Dependencies

- JSONEditor library (for schema editing)
- JSON schema validation library (ajv or similar)

### Deliverables

- ✅ Working semantic editor panel
- ✅ Bidirectional selection (click SVG → highlights semantic tree, vice versa)
- ✅ Basic round-trip sync for simple transforms (position changes)
- ✅ Documentation of NLU schema format

### Success Metrics

- Can load NLU schema and display as editable tree
- Clicking SVG element highlights corresponding semantic node
- Editing position in SVG updates geometry in NLU schema
- No crashes with invalid schemas (validation works)

### Pre-Phase Requirements

**MUST be finalized before starting:**
1. NLU Schema format specification (JSON structure)
2. Example NLU schemas for common utterances
3. SVG ↔ NLU mapping format decision

---

## Phase 3: Local Storage & Persistence

**Timeline**: 2-3 months
**Complexity**: Medium
**Dependencies**: Phase 2 required (needs NLU schema for storage)

### Goal

Implement local database for pictograms, versioning, and tesauro.

### Why This Phase

Storage enables persistent work sessions and provides foundation for RLHF dataset collection and knowledge management.

### Core Features

#### Database Layer
- **Implementation Choice**:
  - Option A: IndexedDB (pure web, browser storage, ~50MB-1GB limit)
  - Option B: SQLite + Prisma (Electron/Tauri, unlimited storage)
  - **Recommendation**: Start with IndexedDB

#### Schema Design (from plan.md Section 8)

**Table: pictograms**
```
id (uuid)
utterance (text)
language (text)
canonical (boolean)
svg (text)
nlu_schema (json)
created_at (timestamp)
updated_at (timestamp)
usage_count (integer)
tags (text[])
```

**Table: tesauro**
```
id (uuid)
lemma (text)
svg_reference (uuid → pictograms.id)
similarity_links (json[])
ratings (json[])
notes (text)
```

**Table: blends**
```
id (uuid)
type (text: agent, object, modifier...)
svg_fragment (text)
nlu_fragment (json)
```

**Table: versions**
```
id (uuid)
pictogram_id (uuid → pictograms.id)
version_number (integer)
svg (text)
nlu_schema (json)
timestamp (timestamp)
author_hash (text)
```

#### Versioning System
- Auto-save on significant changes
- Manual snapshot creation
- Version comparison (diff viewer)
- Restore previous versions

#### Search & Retrieval
- Search by utterance, tags, language
- Filter by canonical status
- Sort by usage_count, date
- Full-text search in notes

#### Tesauro Management
- Add new entries
- Link pictograms by semantic similarity
- Tag relationships (same_action, same_pose, cultural_variant)
- Community ratings (local scoring system)

### New Components/Services

**Services:**
- `src/services/Database.js` - Abstract database interface
- `src/services/IndexedDBAdapter.js` - IndexedDB implementation
- `src/services/VersionManager.js` - Handle versioning logic
- `src/services/TesauroService.js` - Tesauro operations

**Components:**
- `src/components/LibraryPanel.jsx` - Browse saved pictograms
- `src/components/VersionHistory.jsx` - View and compare versions
- `src/components/TesauroExplorer.jsx` - Browse semantic relationships
- `src/components/SearchBar.jsx` - Search interface

**Hooks:**
- `src/hooks/useDatabase.js` - Database operations
- `src/hooks/useVersioning.js` - Version management
- `src/hooks/useTesauro.js` - Tesauro queries

### External Dependencies

- Dexie.js (IndexedDB wrapper) OR better-sqlite3 + Prisma

### Deliverables

- ✅ Working local database
- ✅ Save/load pictograms with full NLU schemas
- ✅ Version history with diff viewer
- ✅ Basic tesauro with search

### Success Metrics

- Can save 1000+ pictograms without performance issues
- Version comparison shows visual and semantic diffs
- Search returns results in <100ms
- Data persists across browser sessions

---

## Phase 4: Model Integration (PictoNet API)

**Timeline**: 2-3 months
**Complexity**: Medium-High
**Dependencies**: Phases 2 & 3 required

### Goal

Connect to PictoNet generative model for full and partial pictogram generation.

### Why This Phase

Model integration completes the generative loop. This is what makes PictoForge unique - the ability to regenerate parts of pictograms semantically.

### Core Features

#### API Client
- HTTP client for PictoNet API
- Authentication handling
- Request/response serialization
- Error handling and retries

#### Full Generation
- Input: text utterance → NLU parser → PictoNet API → SVG + NLU schema
- Load result into editor
- Store in database with metadata

#### Partial Regeneration (Key Feature)
- Select specific blend (e.g., "agent.gesture")
- Send blend context to PictoNet
- Receive partial SVG
- Merge into existing SVG without disrupting other elements

#### Constraint System
- Preserve layout (maintain spatial relationships)
- Style transfer (apply existing style to new generation)
- Component reuse (keep certain objects, regenerate others)

#### RLHF Dataset Export
- Mark pictograms as "approved for dataset"
- Validate completeness (NLU schema, SVG, notes)
- Export as batch JSON
- Optional: direct upload to PictoNet-Trainer

### New Components/Services

**Services:**
- `src/services/PictoNetClient.js` - API client
- `src/services/GenerationService.js` - Orchestrate generation workflows
- `src/services/SVGMerger.js` - Merge partial SVG fragments
- `src/services/RLHFExporter.js` - Prepare dataset batches

**Components:**
- `src/components/GenerationPanel.jsx` - UI for generation controls
- `src/components/BlendRegenerator.jsx` - Select and regenerate specific blends
- `src/components/ConstraintEditor.jsx` - Set generation constraints
- `src/components/DatasetMarker.jsx` - Mark pictograms for RLHF

**Hooks:**
- `src/hooks/usePictoNet.js` - API interactions
- `src/hooks/useGeneration.js` - Generation workflows

### External Dependencies

- PictoNet API available and documented
- API endpoint configuration
- Authentication mechanism

### Deliverables

- ✅ Working text-to-pictogram generation
- ✅ Partial regeneration of blends
- ✅ RLHF dataset export functionality
- ✅ API documentation

### Success Metrics

- Can generate pictogram from text in <5 seconds
- Partial regeneration preserves unchanged elements
- Exported datasets validate against schema
- Error handling prevents data loss

### Pre-Phase Requirements

**MUST be available before starting:**
1. PictoNet API endpoint and documentation
2. API authentication method
3. Example request/response for full and partial generation

---

## Phase 5: Identity & Federation

**Timeline**: 3-4 months
**Complexity**: High
**Dependencies**: Phase 3 required (needs database)

### Goal

Implement decentralized identity and knowledge sharing mechanisms.

### Why This Phase

Builds on completed storage and enables multi-user, multi-institution workflows. Essential for MediaFranca's decentralized vision.

### Core Features

#### Identity System
- Local identity generation (keypair)
- Self-sovereign identity (DID) support (optional)
- Sign contributions with local identity
- Store author metadata in SVG and database

#### Exchange Bundles (from plan.md Section 12)
- Export pictogram collections as structured JSON
- Include: pictograms, tesauro entries, metadata, author signatures
- Import bundles from other users/institutions
- Validate bundle signatures

#### Merge & Conflict Resolution
- Detect duplicate pictograms (same utterance, different visual)
- Show side-by-side comparison
- User chooses: keep local, accept incoming, keep both as variants
- Tag variants with domain/cultural context

#### Federation Metadata
- Domain tags (region, institution, style)
- Cultural variant tracking
- Canonical designation (community consensus)
- Similarity matrices for space alignment

### New Components/Services

**Services:**
- `src/services/IdentityService.js` - Keypair management
- `src/services/BundleExporter.js` - Create exchange bundles
- `src/services/BundleImporter.js` - Parse and validate bundles
- `src/services/MergeResolver.js` - Conflict detection and resolution

**Components:**
- `src/components/IdentityManager.jsx` - View/create identity
- `src/components/ExportBundleDialog.jsx` - Select items for export
- `src/components/ImportBundleDialog.jsx` - Import and review bundles
- `src/components/ConflictResolver.jsx` - Side-by-side comparison UI

**Hooks:**
- `src/hooks/useIdentity.js` - Identity management
- `src/hooks/useBundles.js` - Import/export operations

### External Dependencies

- Web Crypto API OR libsodium.js
- Optional: DID libraries (did-jwt, did-resolver)

### Deliverables

- ✅ Local identity system
- ✅ Bundle import/export
- ✅ Conflict resolution UI
- ✅ Documentation for federation protocol

### Success Metrics

- Can create and sign contributions
- Export/import bundles preserve all data
- Conflict resolution handles 100+ pictograms
- No identity leakage without consent

---

## Phase 6: Advanced Features & Multimodal Input

**Timeline**: 3-4 months
**Complexity**: High
**Dependencies**: All previous phases

### Goal

Implement advanced input modes and drawing tools.

### Why This Phase

These are enhancement features that build on all previous layers. Provide advanced UX but not essential for core vision.

### Core Features

#### Drawing Mode
- Capture stylus/pencil strokes
- Apple Pencil support (pressure, tilt)
- Convert strokes to SVG paths
- Classify strokes (arm, leg, object, gesture)
- Assign semantic roles to drawn elements

#### Multimodal Image Input
- Upload image (PNG, JPG)
- Segmentation (SAM / YOLO integration)
- Send to PictoNet-Vision (multimodal model)
- Receive pictogram + annotated NLU schema
- Load into editor

#### Advanced Editing
- Gesture library (pre-defined poses)
- Object library (common AAC objects)
- Style transfer between pictograms
- Batch operations (apply style to multiple)

#### Keyboard Shortcuts
- Configurable shortcuts for all tools
- Accessibility (keyboard-only navigation)
- Vim-style command mode (optional)

### New Components/Services

**Services:**
- `src/services/StrokeRecognizer.js` - Classify drawn strokes
- `src/services/ImageSegmenter.js` - Wrapper for segmentation models
- `src/services/MultimodalClient.js` - API client for PictoNet-Vision
- `src/services/GestureLibrary.js` - Manage pre-defined gestures

**Components:**
- `src/components/DrawingCanvas.jsx` - Stylus input canvas
- `src/components/ImageImporter.jsx` - Image upload and segmentation
- `src/components/GestureLibraryPanel.jsx` - Browse and insert gestures
- `src/components/ShortcutEditor.jsx` - Configure keyboard shortcuts

**Hooks:**
- `src/hooks/useStylus.js` - Pointer events for stylus
- `src/hooks/useImageInput.js` - Image processing workflows

### External Dependencies

- Segmentation model API or WASM module
- PictoNet-Vision API
- Gesture/object libraries (SVG collections)

### Deliverables

- ✅ Working drawing mode with Apple Pencil support
- ✅ Image-to-pictogram workflow
- ✅ Gesture and object libraries
- ✅ Keyboard shortcut system

### Success Metrics

- Drawing feels responsive (<16ms latency)
- Image segmentation completes in <2 seconds
- Gesture library has 50+ poses
- All features accessible via keyboard

---

## Recommendations

### Starting Point: Phase 2 (Semantic Layer) ⭐

**Rationale:**

1. **Aligns with Core Vision**: The semantic round-trip interface is PictoForge's unique value proposition

2. **Validates Architecture Early**: Building semantic layer early reveals integration challenges before investing in all visual tools

3. **Enables Parallel Work**: Once semantic schema is defined, storage and model integration can proceed in parallel

4. **Research Value**: Even without model integration, semantic editor with SVG mapping provides immediate research value

**Alternative**: Start with Phase 1 if goal is to ship production SVG editor quickly (delays unique vision by 2-3 months)

### Critical Decisions Before Phase 2

1. **NLU Schema Format**: Finalize JSON structure from plan.md Section 3
2. **PictoNet API**: Document request/response formats
3. **Mapping Storage**: Decide how to store SVG ↔ NLU mappings (in SVG metadata or external)

### Timeline Summary

| Phase | Duration | Cumulative | Critical Path |
|-------|----------|------------|---------------|
| Phase 1 | 2-3 months | 3 months | ❌ |
| Phase 2 | 3-4 months | 7 months | ✅ |
| Phase 3 | 2-3 months | 10 months | ✅ |
| Phase 4 | 2-3 months | 13 months | ✅ |
| Phase 5 | 3-4 months | 17 months | ❌ |
| Phase 6 | 3-4 months | 21 months | ❌ |

**Total: 17-21 months for full implementation**

### Risk Factors

**High Risk:**
- NLU Schema format changes during development
- PictoNet API not available when Phase 4 starts
- Performance at scale (1000+ pictograms in tesauro)

**Medium Risk:**
- Coordinate system complexity in semantic-visual mapping
- Merge conflict resolution UX
- Browser storage limits (IndexedDB quotas)

**Low Risk:**
- Visual editor completion (refinement of existing)
- Identity system (well-understood crypto)
- Drawing mode (established patterns)

---

## Immediate Next Steps

1. **Finalize NLU Schema Specification**
   - Document exact JSON structure
   - Create 10+ example files for testing
   - Define all blend types and semantic roles

2. **Set Up Phase 2 Infrastructure**
   - Create feature branch: `feature/semantic-layer`
   - Set up test fixtures with example schemas
   - Install JSON schema validation library

3. **Begin Development**
   - Start with `NLUSchemaParser.js` service
   - Create example NLU schemas in `src/examples/`
   - Build basic tree view component

4. **Documentation**
   - Create API contract for PictoNet (even if not ready yet)
   - Document SVG ↔ NLU mapping format
   - Write integration tests for round-trip sync

---

## Success Criteria

The implementation will be considered successful when:

- ✅ User can load text → generate pictogram (with PictoNet)
- ✅ User can edit SVG visually → semantic schema updates
- ✅ User can edit semantic schema → SVG updates
- ✅ User can regenerate specific blends without affecting others
- ✅ Work persists in local database with full history
- ✅ User can export/import knowledge bundles
- ✅ System performs well with 1000+ pictograms
- ✅ All features have >80% test coverage

---

**Document Status**: Living document, updated as phases complete
**Next Review**: After Phase 2 completion
