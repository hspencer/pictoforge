# SCSS Architecture

## Overview

The PictoForge application uses SCSS (Sass) for styling, organized into modular files for better maintainability and reusability.

## File Structure

```
src/
├── App.scss                     # Main stylesheet (290 lines)
├── index.css                    # Tailwind CSS imports
└── styles/
    ├── variables.scss           # SCSS variables, mixins, and theme tokens (91 lines)
    ├── svg-container.scss       # SVG container and panzoom styles (120 lines)
    ├── bounding-box.scss        # Bounding box and resize handles (64 lines)
    ├── node-editor.scss         # Path node editor styles (72 lines)
    └── ui-overlay.scss          # Base UI overlay system (88 lines)
```

## Import Strategy

### Tailwind CSS (index.css)
```css
@import "tailwindcss";
@import "tw-animate-css";
```

Tailwind CSS and animation libraries are imported in `index.css` (not in SCSS) because:
- They contain Tailwind v4 syntax (`@theme`, `@utility`) that SASS cannot parse
- Keeping them separate prevents compilation errors
- They load globally before React components

### SCSS Modules (App.scss)
```scss
@use "./styles/variables.scss" as *;
@use "./styles/svg-container.scss";
@use "./styles/bounding-box.scss";
@use "./styles/node-editor.scss";
```

SCSS files use `@use` instead of deprecated `@import`:
- `@use` with `as *` makes mixins and variables available without namespace
- Each module is imported once and scoped properly
- Better performance and no duplicate code

## Module Details

### 1. variables.scss
**Purpose**: Centralized design tokens, mixins, and CSS custom properties

**Contents**:
- CSS custom properties (`:root` variables)
- Color tokens (primary, secondary, etc.)
- UI sizing tokens (handle size, node size, etc.)
- Z-index layers
- SCSS mixins:
  - `@mixin draggable-cursor` - Grab cursor states
  - `@mixin smooth-transition` - Ease-in-out transitions
  - `@mixin ui-element-fixed-size` - Fixed-size UI elements (for zoom-independent rendering)

**Usage**:
```scss
.my-element {
  @include draggable-cursor;
  @include smooth-transition(opacity, 0.3s);
  background: var(--color-primary);
}
```

### 2. svg-container.scss
**Purpose**: Main SVG viewer container and pan/zoom functionality

**Contains**:
- `.pictoforge-container` - Main application container
- `.svg-panzoom-container` - Pan/zoom wrapper with touch support
- `.svg-container` - SVG display area with hover effects
- `.svg-viewer-grid` - Background grid pattern
- Dark theme overrides for containers
- Responsive styles for mobile

**Key Features**:
- Glow effect on hover for SVG elements
- Pointer events management for interactive elements
- Touch-action support for mobile gestures

### 3. bounding-box.scss
**Purpose**: Bounding box UI for selected elements

**Contains**:
- `.svg-bounding-box` - Main bounding box rectangle
- `.svg-bounding-box-simple` - Lighter variant with dashed border
- `.svg-resize-handle` - Corner/edge resize handles
- `.svg-resize-handle-simple` - Lighter handle variant
- `.svg-rotation-line` - Rotation indicator line
- `.svg-rotation-handle` - Rotation control handle

**Variants**:
- Standard (solid stroke, full opacity)
- Simple (dashed stroke, lower opacity)

**Interaction States**:
- Default
- Hover (color change)
- Active (grabbing cursor)

### 4. node-editor.scss
**Purpose**: Path node editing UI for bezier curve manipulation

**Contains**:
- `.svg-node` - Editable path anchor points
- `.svg-node-curve` - Curve control points (orange)
- `.svg-node-smooth` - Smooth points (green)
- `.svg-node-default` - Regular points (blue)
- `.svg-control-point` - Bezier control handles
- `.svg-control-line` - Lines connecting control points
- `.svg-path-overlay` - Invisible hit area for path selection
- `.svg-tooltip` - Informational tooltips

**Node Types**:
- Curve (cubic bezier) - `#ff6b35`
- Smooth (smooth curve) - `#4ade80`
- Default (corner) - `#00b9ff`

### 5. ui-overlay.scss
**Purpose**: Base styles for the UI overlay system (work in progress)

**Contains**:
- `.ui-overlay` - Base overlay container
- `.ui-handle` - Interactive handle base class
- `.ui-node` - Interactive node base class

**Future Use**:
This file will contain styles for zoom-independent UI elements that render at constant screen size regardless of SVG zoom level (see [ui-overlay-system.md](./ui-overlay-system.md)).

### 6. App.scss
**Purpose**: Main stylesheet with global styles and component-specific overrides

**Contains**:
- Tailwind theme configuration (`@theme inline`)
- CSS custom property definitions (`:root` and `.dark`)
- Base layer styles (`@layer base`)
- Cursor utility classes (generated with `@each` loop)
- Scrollbar styles
- Animation keyframes
- Utility classes
- Collapsible transitions
- Hierarchy component styles
- Accessibility focus styles

## SCSS Features Used

### 1. Nesting
```scss
.svg-container {
  padding: 20px;

  > div {
    display: flex;
  }

  svg {
    max-width: 100%;

    * {
      cursor: default;
    }
  }
}
```

### 2. Parent Selector (&)
```scss
.svg-resize-handle {
  fill: var(--col-select);

  &:hover {
    fill: #0099dd;
  }

  &-simple {
    stroke-width: 0.3;
  }
}
```

### 3. @extend
```scss
.svg-bounding-box-simple {
  @extend .svg-bounding-box;
  stroke-dasharray: 2,2;
}
```

### 4. Mixins
```scss
@mixin smooth-transition($properties: all, $duration: 0.2s) {
  transition: $properties $duration ease-in-out;
}

.my-element {
  @include smooth-transition(opacity, 0.3s);
}
```

### 5. Variables and Maps
```scss
$cursors: (
  'nw-resize': nw-resize,
  'n-resize': n-resize,
  'ne-resize': ne-resize,
);

@each $name, $cursor in $cursors {
  .cursor-#{$name} {
    cursor: $cursor;
  }
}
```

### 6. @use and Namespacing
```scss
// Import with all exports available
@use "./styles/variables.scss" as *;

// Now can use mixins directly
.element {
  @include smooth-transition;
}
```

## Design Tokens

### Colors
```scss
--col-select: #00b9ff;          // Primary selection color
--color-primary: ...            // Theme primary
--color-secondary: ...          // Theme secondary
--color-background: ...         // Background
--color-foreground: ...         // Text
```

### UI Sizing
```scss
--ui-handle-size: 8px;          // Resize handle size
--ui-node-size: 6px;            // Path node size
--radius: 0.625rem;             // Border radius
```

### Z-Index Layers
```scss
--z-svg-content: 1;             // SVG content layer
--z-ui-overlay: 100;            // UI overlay layer (handles, nodes)
```

## Dark Theme

The application supports dark mode using the `.dark` class:

```scss
.dark {
  .svg-container {
    background: #1f2937;
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.3);
  }

  .svg-viewer-grid {
    background-image:
      linear-gradient(rgba(255,255,255,0.1) 1px, transparent 1px),
      linear-gradient(90deg, rgba(255,255,255,0.1) 1px, transparent 1px);
  }
}
```

## Responsive Design

Mobile-first approach with breakpoints:

```scss
@media (max-width: 768px) {
  .svg-container {
    padding: 10px;
  }

  .w-80 {
    width: 100%;
    max-width: 300px;
  }
}
```

## Best Practices

1. **Use mixins for repeated patterns**
   - Transitions, cursor states, fixed sizing

2. **Keep related styles together**
   - Component-specific styles in dedicated files
   - Use nesting to show DOM hierarchy

3. **Use CSS custom properties for dynamic values**
   - Colors, sizes, spacing
   - Enables runtime theme switching

4. **Use SCSS variables for build-time constants**
   - Maps, lists, configuration

5. **Avoid deep nesting**
   - Maximum 3-4 levels deep
   - Use BEM naming when needed

6. **Use @extend sparingly**
   - Only for simple variants
   - Prefer mixins for complex patterns

## Future Improvements

1. **BEM Naming Convention**
   - Implement block-element-modifier pattern for UI components
   - See [ui-overlay-system.md](./ui-overlay-system.md)

2. **Component-Specific Files**
   - Create dedicated SCSS files for each major component
   - Example: `hierarchy-panel.scss`, `style-panel.scss`, `text-input.scss`

3. **Zoom-Independent UI**
   - Implement fixed-size rendering for UI overlays
   - Use `ui-overlay.scss` as foundation
   - Render UI elements at constant pixel size regardless of zoom

4. **CSS Modules**
   - Consider migrating to CSS Modules for better scoping
   - Would prevent global namespace pollution

5. **PostCSS Plugins**
   - Add autoprefixer for better browser support
   - Consider CSS custom property fallbacks
