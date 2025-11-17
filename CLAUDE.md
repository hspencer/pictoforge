# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

PictoForge is a semantic SVG editor designed as a companion tool for generative models, specifically for [PictoNet](https://github.com/mediafranca/pictonet). It provides round-trip editing between visual canvas and code, enabling precise inspection and editing of machine-generated SVG pictograms for AAC (Augmentative and Alternative Communication) workflows.

**Core Philosophy**: Mathematical correctness in coordinate transformations and direct visual manipulation with stable mappings between hierarchy, attributes, and visual feedback.

### Current State vs Full Vision

**Current Implementation (v0.0.1)**: PictoForge currently functions as a **visual SVG editor** with:
- ✅ Coordinate transformation system (SVGWorld)
- ✅ Basic editing tools (Select tool working, Node/Pen tools incomplete)
- ✅ SVG hierarchy visualization
- ✅ Pan/zoom functionality
- ✅ File I/O (load/save SVG)
- ✅ Undo/redo history
- ✅ Style panel

**Full Vision**: The complete system (documented in `docs/plan.md`) will be a **semantic round-trip editor** with:
- ❌ NLU Schema layer (semantic representation)
- ❌ Bidirectional sync (visual ↔ semantic)
- ❌ PictoNet model integration (generative AI)
- ❌ Local database + tesauro (knowledge management)
- ❌ Partial regeneration of pictogram components
- ❌ Federated identity and knowledge sharing
- ❌ Multimodal input (text, SVG, images)
- ❌ Drawing mode with Apple Pencil support

**Implementation Roadmap**: See `docs/ROADMAP.md` for the complete 6-phase implementation plan (17-21 months estimated).

**When Contributing**: Focus on the current visual editor layer unless specifically implementing semantic layer features. The semantic layer (Phase 2 in roadmap) is the next major architectural addition.

## Development Commands

### Basic Commands
```bash
# Install dependencies (uses pnpm by default)
pnpm install

# Start development server (http://localhost:5173)
pnpm run dev

# Build for production
pnpm run build

# Preview production build (http://localhost:4173)
pnpm run preview

# Lint code
pnpm run lint
```

### Testing Commands
```bash
# Run tests in watch mode
pnpm test

# Run tests once
pnpm test:run

# Run tests with interactive UI
pnpm test:ui

# Generate coverage report
pnpm test:coverage
```

**Note**: Testing infrastructure uses Vitest with jsdom environment. Coverage thresholds are set to 80% for all metrics (lines, functions, branches, statements).

## Critical Architecture Concepts

### The Coordinate System Problem

PictoForge's central challenge is reconciling three coordinate systems:

1. **Screen Coordinates** - Browser pixels from mouse events (`clientX`, `clientY`)
2. **Viewport Coordinates** - After pan/zoom transformations (managed by `@panzoom/panzoom`)
3. **SVG Coordinates** - The internal coordinate space defined by SVG `viewBox`

### SVGWorld: The Central Abstraction

**Location**: `src/services/SVGWorld.js` (class) and `src/hooks/useSVGWorld.js` (React hook)

SVGWorld is an in-memory "world object" that acts as a single source of truth for coordinate transformations and element manipulation. This is the **most important architectural component** to understand.

**Key Methods**:
- `screenToSVG(screenX, screenY)` - Converts screen clicks to SVG coordinates using `getScreenCTM()` matrix
- `svgToScreen(svgX, svgY)` - Inverse transformation
- `screenDeltaToSVGDelta(dx, dy)` - Converts movement deltas for drag operations
- `getElementBBox(element)` - Gets element bounding box in SVG space
- `moveElement(element, dx, dy)` - Applies movement transformations
- `applyTransform(element, transform)` - Applies any SVG transformation

**Why it matters**: All visual editing tools (Select, Node, Pen) must go through SVGWorld to maintain coordinate coherence. Direct DOM manipulation will break the coordinate system.

**Usage Pattern**:
```javascript
const { screenToSVG, moveElement, getElementBBox } = useSVGWorld({
  svgRef: svgContainerRef,
  containerRef: containerRef,
  viewport: panzoomState  // Auto-syncs with pan/zoom state
});

// In click handler
const handleClick = (e) => {
  const svgCoords = screenToSVG(e.clientX, e.clientY);
  // Now use svgCoords to manipulate SVG elements
};
```

### Component Architecture

**Main App Flow** (`src/App.jsx`):
- Uses `useSVGParser` to parse and maintain SVG structure
- Uses `useSVGStorage` for user configuration persistence
- Manages global state: `darkMode`, `currentTool`, `selectedElement`, `expandedElements`
- Coordinates between three main panels: TextInput (top), SVGHierarchy (left), SVGViewer (center)

**SVGViewer** (`src/components/SVGViewer.jsx` - 569 lines):
The central editing canvas that integrates:
- `usePanzoom` - Viewport pan/zoom controls
- `useSVGWorld` - Coordinate transformation layer
- `useMoveable` - Drag/resize/rotate interactions (react-moveable)
- `useHistory` - Undo/redo stack
- Tool system: Select (black arrow), Node (white arrow), Pen tools

**SVGHierarchy** (`src/components/SVGHierarchy.jsx`):
- Displays collapsible tree of SVG elements
- Implements bidirectional selection (round-trip interface)
- Filters out technical elements (`defs`, `style`, `clipPath`, etc.)
- Auto-expands path to selected elements

**StylePanel** (`src/components/StylePanel.jsx`):
- Shows CSS classes defined in `<style>` tags within SVG
- Allows dynamic application/removal of styles to elements
- Parses and visualizes CSS properties

### Critical Hooks

**useSVGParser** (`src/hooks/useSVGParser.js`):
- Main parser for SVG structure
- Extracts hierarchy, styles, metadata
- Filters technical elements from visual hierarchy
- Returns: `svgData`, `selectedElement`, `svgContent`, `loadSVG`, `setSelectedElement`, `findElementById`

**useSVGWorld** (`src/hooks/useSVGWorld.js`):
- React wrapper around SVGWorld service
- Auto-initializes when SVG ref is available
- Synchronizes with viewport changes
- Must be used for all coordinate conversions

**usePanzoom** (`src/hooks/usePanzoom.js`):
- Wraps `@panzoom/panzoom` library
- Returns: `panzoomState` (scale, x, y), `zoomIn`, `zoomOut`, `reset`, `center`
- State must be passed to `useSVGWorld` for coordinate sync

**useHistory** (`src/hooks/useHistory.js`):
- Undo/redo stack implementation
- Used for tracking SVG modifications

## Path Alias

The project uses `@` as an alias for `src/`:
```javascript
import { Button } from '@/components/ui/button';
import { useSVGParser } from '@/hooks/useSVGParser';
```

## Known Issues and In-Progress Features

### Transform Accumulation Issue
**Location**: `src/components/SVGViewer.jsx:467-511`

Resize and move transformations work but may accumulate incorrectly. The current implementation needs better handling of the accumulated transformation matrix. When modifying transformation logic, always test with multiple sequential transforms.

### Node Editor (Incomplete)
**Location**: `src/components/NodeEditor.jsx`

Structure is prepared but core logic is incomplete:
- Node visualization works
- Missing: node drag implementation
- Missing: Bézier control handle manipulation

### Pen Tool (Structure Only)
**Location**: `src/components/SVGViewer.jsx:153-162`

TODOs are commented but no real functionality exists for:
- Adding nodes to paths
- Removing nodes from paths
- Changing node types (smooth/corner/bezier)

### Element Duplication/Deletion
**Location**: `src/App.jsx:189-200`

Functions are stubbed with `console.log` only - no implementation.

## Styling System

**Framework**: Tailwind CSS 4.1.7 with `@tailwindcss/vite` plugin

The project recently migrated from SCSS to pure CSS with Tailwind v4. Style customization uses CSS variables defined in `src/App.css`:

```css
@theme {
  --color-background: /* ... */;
  --color-foreground: /* ... */;
  /* etc */
}
```

**UI Components**: Built with Radix UI primitives in `src/components/ui/` (shadcn/ui style)

## Internationalization

Uses custom `useI18n` hook (`src/hooks/useI18n.jsx`) with ES/EN translations. All user-facing strings should use `t('key')` from this hook.

## SVG Loading and Parsing

**Entry Points**:
- Drag and drop on TextInput
- File button
- Example SVG auto-loads on app startup

**Parser** (`useSVGParser`):
- Validates and cleans SVG (removes BOM, handles missing viewBox)
- Multiple parsing strategies with fallbacks
- Permissive parsing - doesn't reject SVGs with minor errors
- Detailed console logging with emoji symbols (🔄 ✓ ✗ ⚠️)

## Testing Approach

**Framework**: Vitest with @testing-library/react

**Current Coverage**: Low - this is a known issue

**Test Setup** (`src/tests/setup.js`):
- Mocks browser APIs: `URL.createObjectURL`, `navigator.clipboard`, `window.confirm`
- Auto-cleanup after each test
- jsdom environment for DOM testing

**When Writing Tests**:
- Place tests in `src/**/*.test.{js,jsx}` or `src/**/__tests__/**/*.{js,jsx}`
- Mock SVG DOM operations carefully - `getScreenCTM()` is not available in jsdom
- Use test utilities from `@testing-library/react`

## Documentation Structure

Comprehensive documentation exists in `docs/`:

- `docs/coordinate-system.md` - Deep dive on coordinate transformations
- `docs/architecture.md` - System architecture overview
- `docs/ui-overlay-system.md` - Overlay system for interactive editing
- `docs/components.md`, `docs/hooks.md`, `docs/services.md` - API references
- `docs/ascii-divmap.md` - Visual map of interface structure

Spanish legacy docs in `docs/ARQUITECTURA_FASE*.md` and `docs/COORDENADAS.md`.

## Technology Constraints

**Package Manager**: pnpm 10.4.1+ (enforced in package.json)
**Node.js**: 18+
**React**: 19.1.0 (uses concurrent features)
**SVG Library**: @svgdotjs/svg.js 3.2.5 (for manipulation)
**Key Dependencies**:
- `react-moveable` 0.56.0 (interactive transforms)
- `@panzoom/panzoom` 4.6.0 (viewport control)
- Radix UI (accessible components)

## Git Workflow

**Main Branch**: `main`
**Current Version**: 0.0.1

Recent commits show active development on coordinate system, style migration (SCSS → CSS), and SVG loading improvements.
