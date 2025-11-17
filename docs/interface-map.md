## Interface Map (ASCII DivMap)

This is the complete interface structure of PictoForge with all component names:

```
┌─────────────────────────────────────────────────────────────────────────────────┐
│ HEADER [<header>]                                                               │
│ ┌─────────────────────────────────────────┬─────────────────────────────────┐   │
│ │ App Title + Subtitle                    │ Locale + ThemeToggle            │   │
│ │ "PictoForge" │ "Semantic SVG Editor"    │ [Button:   Sun/Moon]            │   │
│ └─────────────────────────────────────────┴─────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────────────────────┐
│ TEXTINPUT [TextInput Component]                                                 │
│ ┌───────────────────────────────────────────────────────────────────────────┐   │
│ │ Text Input Area + File Upload (Drag & Drop)                               │   │
│ │ [Upload Button] [placeholder: currentText]                                │   │
│ └───────────────────────────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────────────────────┐
│ FILELOADDEMO [FileLoadDemo Component] - visible when !svgData                   │
│ Example file loader demonstration                                               │
└─────────────────────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────────────────────┐
│ MAIN LAYOUT [<div className="flex-1 flex">] - Two Panel System                  │
│                                                                                 │
│ ┌────────────────────────────────────┬───────────────────────────────────────┐  │
│ │ LEFT PANEL (w-1/2)                 │ RIGHT PANEL (w-1/2)                   │  │
│ │                                    │                                       │  │
│ │ ┌────────────────────────────────┐ │ ┌────────────────────────────────────┐│  │
│ │ │ SVGHIERARCHY                   │ │ │ SVGVIEWER or CODEVIEW              ││  │
│ │ │ [SVGHierarchy Component]       │ │ │ (Toggle: showCodeView)             ││  │
│ │ │                                │ │ │                                    ││  │
│ │ │ Header: "SVG Elements"         │ │ │ ┌─────────────────────────────-───┐││  │
│ │ │                                │ │ │ │ TOOLBAR                         │││  │
│ │ │ Tree Structure:                │ │ │ │ ┌──────────┬─────────────────┐  │││  │
│ │ │ - [ChevronRight/Down] Toggle   │ │ │ │ │ Tools    │ Actions         │  │││  │
│ │ │ - [Icon] Element Type          │ │ │ │ │ ────────  ───────────────  │  │││  │
│ │ │ - [ID] Element Name            │ │ │ │ │ select   │ undo/redo       │  │││  │
│ │ │ - [.class] CSS Class           │ │ │ │ │ node     │ zoom in/out     │  │││  │
│ │ │ - (N) Children count           │ │ │ │ │ pen      │ reset view      │  │││  │
│ │ │                                │ │ │ │ │          │ export          │  │││  │
│ │ │ Elements:                      │ │ │ │ │          │ metrics         │  │││  │
│ │ │ • selectedElement (highlight)  │ │ │ │ └──────────┴─────────────────┘  │││  │
│ │ │ • expandedElements (Set)       │ │ │ └────────────────────────────────-┘││  │
│ │ │ • onClick: onElementSelect     │ │ │                                    ││  │
│ │ │                                │ │ │ ┌────────────────────────────────┐ ││  │
│ │ └────────────────────────────────┘ │ │ │ CANVAS AREA                    │ ││  │
│ │                                    │ │ │ [containerRef]                 │ ││  │
│ │ ┌────────────────────────────────┐ │ │ │                                │ ││  │
│ │ │ STYLEPANEL                     │ │ │ │ SVG Content [svgRef]           │ ││  │
│ │ │ [StylePanel Component]         │ │ │ │ • zoom + pan applied           │ ││  │
│ │ │                                │ │ │ │ • dangerouslySetInnerHTML      │ ││  │
│ │ │ Header: "CSS Styles"           │ │ │ │ • onClick: handleElementClick  │ ││  │
│ │ │                                │ │ │ │                                │ ││  │
│ │ │ Styles List:                   │ │ │ │ Overlay [overlayRef, <svg>]    │ ││  │
│ │ │ • Available CSS classes        │ │ │ │ • pointer-events-none          │ ││  │
│ │ │ • Preview properties           │ │ │ │                                │ ││  │
│ │ │ • Apply/Remove buttons         │ │ │ │ ┌────────────────────────────┐ │ ││  │
│ │ │ • onStyleChange callback       │ │ │ │ │ BOUNDINGBOX                │ │ ││  │
│ │ │                                │ │ │ │ │ [BoundingBox Component]    │ │ ││  │
│ │ │ For selectedElement:           │ │ │ │ │                            │ │ ││  │
│ │ │ • fill, stroke properties      │ │ │ │ │ • 8 resize handles         │ │ ││  │
│ │ │ • stroke-width, stroke-join    │ │ │ │ │ • rotation handle          │ │ ││  │
│ │ └────────────────────────────────┘ │ │ │ │ • visible: tool=='select'  │ │ ││  │
│ │                                    │ │ │ │ • onResize, onMove, onRot  │ │ ││  │
│ └────────────────────────────────────┘ │ │ └────────────────────────────┘ │ ││  │
│                                        │ │                                │ ││  │
│                                        │ │ ┌────────────────────────────┐ │ ││  │
│                                        │ │ │ NODEEDITOR                 │ │ ││  │
│                                        │ │ │ [NodeEditor Component]     │ │ ││  │
│                                        │ │ │                            │ │ ││  │
│                                        │ │ │ • node circles (paths)     │ │ ││  │
│                                        │ │ │ • control handles (bezier) │ │ ││  │
│                                        │ │ │ • visible: tool=='node'    │ │ ││  │
│                                        │ │ │   or tool=='pen'           │ │ ││  │
│                                        │ │ │ • onNodeChange, onNodeAdd  │ │ ││  │
│                                        │ │ │   onNodeRemove             │ │ ││  │
│                                        │ │ └────────────────────────────┘ │ ││  │
│                                        │ │                                │ ││  │
│                                        │ │ ┌────────────────────────────┐ │ ││  │
│                                        │ │ │ PERFORMANCEMETRICS         │ │ ││  │
│                                        │ │ │ [PerformanceMetrics Comp]  │ │ ││  │
│                                        │ │ │ • visible: showMetrics     │ │ ││  │
│                                        │ │ │ • complexity, metrics      │ │ ││  │
│                                        │ │ └────────────────────────────┘ │ ││  │
│                                        │ └────────────────────────────────┘ ││  │
│                                        │                                    ││  │
│                                        │ ┌────────────────────────────────┐ ││  │
│                                        │ │ CODEVIEW (alternate view)      │ ││  │
│                                        │ │ [CodeView Component]           │ ││  │
│                                        │ │                                │ ││  │
│                                        │ │ • Line numbers                 │ ││  │
│                                        │ │ • Syntax highlighting          │ ││  │
│                                        │ │ • Editable SVG code            │ ││  │
│                                        │ │ • onSVGUpdate callback         │ ││  │
│                                        │ │ • selectedElement highlight    │ ││  │
│                                        │ │ └────────────────────────────────┘ ││  │
│                                        └────────────────────────────────────┘┘  │
└─────────────────────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────────────────────┐
│ FOOTER [<footer>]                                                               │
│ ┌─────────────────────────────────────────┬─────────────────────────────────┐   │
│ │ Stats: "N styles" │ "Element: id"     │ "Version 0.0.1"                 │   │
│ └─────────────────────────────────────────┴─────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────────────────────────┘
```
