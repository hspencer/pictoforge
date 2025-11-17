# PictoForge Documentation

Welcome to the technical documentation for PictoForge. This site provides a comprehensive overview of the project's architecture, components, and core logic.

## Project Vision & Planning

*   **[Project Plan](./plan.md):** Complete vision for the PictoForge round-trip semantic editor within the MediaFranca ecosystem. Describes the full system architecture including NLU Schema integration, model layer, storage, and federation.

*   **[Implementation Roadmap](./ROADMAP.md):** Detailed 6-phase implementation plan (17-21 months estimated). Current status: **Phase 2.1 Complete** (Semantic Layer infrastructure setup).

## Core Architecture

*   **[Architecture](./architecture.md):** High-level overview of the current visual editor system design, core services, data flow, and key architectural patterns.

*   **[Coordinate System](./coordinate-system.md):** In-depth explanation of how PictoForge manages transformations between screen, viewport, and SVG coordinate spaces.

*   **[Semantic Layer](../src/semantic/README.md):** Architecture and development guide for the NLU Schema integration layer. Feature-flagged, non-invasive addition for round-trip semantic editing.

## API Reference

*   **[API Reference](./api-reference.md):** Detailed reference for all custom services, React hooks, and UI components.

*   **[Storage System](./storage.md):** Guide to the local storage system, including the `useLocalStorage` and `useSVGStorage` hooks.

## UI & Styling

*   **[UI Overlay System](./ui-overlay-system.md):** Description of the two-layer rendering system used for non-scaling UI controls like bounding boxes and handles.

*   **[Interface Map](./interface-map.md):** ASCII-based map of the complete user interface and its corresponding React components.

*   **[SCSS Architecture](./scss-architecture.md):** ⚠️ **Deprecated** - Project migrated to Tailwind CSS v4 with pure CSS. Kept for historical reference.

## External References

*   **[NLU Schema Repository](https://github.com/mediafranca/nlu-schema):** Official NLU Schema specification (v1.0.1) - integrated as git submodule at `schemas/nlu-schema/`

*   **[PictoNet Repository](https://github.com/mediafranca/pictonet):** Generative model for pictogram creation (future integration in Phase 2.4)

## Getting Started

For development setup and commands, see the root [CLAUDE.md](../CLAUDE.md) file.