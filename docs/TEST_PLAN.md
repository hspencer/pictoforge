# Plan de Testing - PictoForge

## Configuración de Testing

### Stack de Testing Recomendado
- **Vitest**: Test runner (compatible con Vite)
- **@testing-library/react**: Testing utilities para React
- **@testing-library/user-event**: Simulación de interacciones de usuario
- **@testing-library/jest-dom**: Matchers adicionales para DOM
- **jsdom**: Ambiente DOM para tests

### Instalación
```bash
pnpm add -D vitest @testing-library/react @testing-library/jest-dom @testing-library/user-event jsdom
```

---

## 1. Tests de Carga de Archivos

### Test Suite: `FileLoadDemo.test.jsx`

#### 1.1 Cargar archivo SVG válido mediante drag & drop
```javascript
describe('FileLoadDemo - Drag & Drop', () => {
  it('debe cargar un archivo SVG válido mediante drag & drop', async () => {
    const mockOnLoadExample = vi.fn();
    const { getByText } = render(<FileLoadDemo onLoadExample={mockOnLoadExample} />);

    const svgContent = '<svg><circle cx="50" cy="50" r="40"/></svg>';
    const file = new File([svgContent], 'test.svg', { type: 'image/svg+xml' });

    const dropzone = getByText(/arrastra/i).parentElement;

    // Simular drag & drop
    fireEvent.drop(dropzone, {
      dataTransfer: { files: [file] }
    });

    await waitFor(() => {
      expect(mockOnLoadExample).toHaveBeenCalledWith(svgContent, 'test.svg');
    });
  });

  it('debe rechazar archivos que no sean SVG', async () => {
    const mockOnLoadExample = vi.fn();
    const { getByText } = render(<FileLoadDemo onLoadExample={mockOnLoadExample} />);

    const file = new File(['not svg'], 'test.txt', { type: 'text/plain' });
    const dropzone = getByText(/arrastra/i).parentElement;

    fireEvent.drop(dropzone, {
      dataTransfer: { files: [file] }
    });

    await waitFor(() => {
      expect(mockOnLoadExample).not.toHaveBeenCalled();
    });
  });
});
```

#### 1.2 Cargar archivo mediante botón de carga
```javascript
it('debe cargar archivo mediante input file', async () => {
  const mockOnLoadExample = vi.fn();
  const { container } = render(<FileLoadDemo onLoadExample={mockOnLoadExample} />);

  const svgContent = '<svg><rect x="0" y="0" width="100" height="100"/></svg>';
  const file = new File([svgContent], 'rect.svg', { type: 'image/svg+xml' });

  const input = container.querySelector('input[type="file"]');

  await userEvent.upload(input, file);

  await waitFor(() => {
    expect(mockOnLoadExample).toHaveBeenCalledWith(svgContent, 'rect.svg');
  });
});
```

#### 1.3 Cargar ejemplos predefinidos
```javascript
it('debe cargar ejemplos predefinidos', async () => {
  const mockOnLoadExample = vi.fn();
  const { getByText } = render(<FileLoadDemo onLoadExample={mockOnLoadExample} />);

  const exampleButton = getByText(/ejemplo/i);
  await userEvent.click(exampleButton);

  expect(mockOnLoadExample).toHaveBeenCalled();
});
```

### Test Suite: `TextInput.test.jsx`

#### 1.4 Cargar SVG desde textarea
```javascript
it('debe procesar contenido SVG desde textarea', async () => {
  const mockOnTextChange = vi.fn();
  const { getByRole } = render(<TextInput onTextChange={mockOnTextChange} />);

  const textarea = getByRole('textbox');
  const svgContent = '<svg><path d="M10 10 L90 90"/></svg>';

  await userEvent.type(textarea, svgContent);

  expect(mockOnTextChange).toHaveBeenCalledWith(svgContent);
});
```

---

## 2. Tests de Selección de Entidades Gráficas

### Test Suite: `SVGViewer.test.jsx`

#### 2.1 Seleccionar elemento mediante click
```javascript
describe('SVGViewer - Selección de Elementos', () => {
  it('debe seleccionar elemento al hacer click con herramienta select', async () => {
    const mockOnElementSelect = vi.fn();
    const svgContent = '<svg id="root"><circle id="circle1" cx="50" cy="50" r="40"/></svg>';
    const svgData = {
      root: {
        id: 'root',
        tagName: 'svg',
        children: [{
          id: 'circle1',
          tagName: 'circle',
          children: []
        }]
      }
    };

    const { container } = render(
      <SVGViewer
        svgContent={svgContent}
        onElementSelect={mockOnElementSelect}
        svgData={svgData}
      />
    );

    // Activar herramienta select (debería estar activa por defecto)
    const circle = container.querySelector('#circle1');
    await userEvent.click(circle);

    expect(mockOnElementSelect).toHaveBeenCalled();
    expect(mockOnElementSelect.mock.calls[0][0].id).toBe('circle1');
  });

  it('debe mostrar bounding box al seleccionar elemento', async () => {
    const svgContent = '<svg><rect id="rect1" x="10" y="10" width="50" height="50"/></svg>';
    const svgData = {
      root: {
        id: 'root',
        children: [{
          id: 'rect1',
          tagName: 'rect',
          children: []
        }]
      }
    };

    const { container } = render(
      <SVGViewer
        svgContent={svgContent}
        svgData={svgData}
      />
    );

    const rect = container.querySelector('#rect1');
    await userEvent.click(rect);

    // Verificar que existe el bounding box
    const boundingBox = container.querySelector('.bounding-box');
    expect(boundingBox).toBeInTheDocument();
  });
});
```

#### 2.2 Destacar elemento seleccionado
```javascript
it('debe aplicar clase highlighted al elemento seleccionado', async () => {
  const svgContent = '<svg><circle id="circle1" cx="50" cy="50" r="40"/></svg>';
  const selectedElement = { id: 'circle1', tagName: 'circle' };

  const { container } = render(
    <SVGViewer
      svgContent={svgContent}
      selectedElement={selectedElement}
    />
  );

  const circle = container.querySelector('#circle1');
  expect(circle).toHaveClass('highlighted');
});
```

### Test Suite: `SVGHierarchy.test.jsx`

#### 2.3 Selección bidireccional (Round Trip)
```javascript
describe('SVGHierarchy - Selección Bidireccional', () => {
  it('debe seleccionar elemento desde jerarquía y resaltar en visor', async () => {
    const mockOnElementSelect = vi.fn();
    const svgData = {
      root: {
        id: 'root',
        tagName: 'svg',
        children: [{
          id: 'group1',
          tagName: 'g',
          children: [{
            id: 'circle1',
            tagName: 'circle',
            children: []
          }]
        }]
      }
    };

    const { getByText } = render(
      <SVGHierarchy
        svgData={svgData}
        onElementSelect={mockOnElementSelect}
      />
    );

    const elementNode = getByText('circle1');
    await userEvent.click(elementNode);

    expect(mockOnElementSelect).toHaveBeenCalled();
  });

  it('debe auto-expandir ruta hacia elemento seleccionado', async () => {
    const svgData = {
      root: {
        id: 'root',
        tagName: 'svg',
        children: [{
          id: 'group1',
          tagName: 'g',
          children: [{
            id: 'nested',
            tagName: 'g',
            children: [{
              id: 'target',
              tagName: 'circle',
              children: []
            }]
          }]
        }]
      }
    };

    const selectedElement = svgData.root.children[0].children[0].children[0];
    const expandedElements = new Set(['root', 'group1', 'nested']);

    const { getByText } = render(
      <SVGHierarchy
        svgData={svgData}
        selectedElement={selectedElement}
        expandedElements={expandedElements}
      />
    );

    // Verificar que todos los padres están expandidos
    expect(getByText('target')).toBeVisible();
  });
});
```

---

## 3. Tests de Selección y Movimiento de Nodos

### Test Suite: `NodeEditor.test.jsx`

#### 3.1 Activar modo de edición de nodos
```javascript
describe('NodeEditor - Edición de Nodos', () => {
  it('debe mostrar nodos cuando la herramienta node está activa', () => {
    const pathElement = document.createElementNS('http://www.w3.org/2000/svg', 'path');
    pathElement.setAttribute('d', 'M10,10 L50,50 L90,10');

    const { container } = render(
      <NodeEditor
        element={pathElement}
        tool="node"
        visible={true}
      />
    );

    const nodes = container.querySelectorAll('.svg-node');
    expect(nodes.length).toBeGreaterThan(0);
  });

  it('debe permitir seleccionar nodo individual', async () => {
    const pathElement = document.createElementNS('http://www.w3.org/2000/svg', 'path');
    pathElement.setAttribute('d', 'M10,10 L50,50');

    const { container } = render(
      <NodeEditor
        element={pathElement}
        tool="node"
        visible={true}
      />
    );

    const firstNode = container.querySelector('.svg-node');
    await userEvent.click(firstNode);

    expect(firstNode).toHaveClass('selected');
  });
});
```

#### 3.2 Mover nodo mediante drag
```javascript
it('debe mover nodo al arrastrar', async () => {
  const mockOnNodeChange = vi.fn();
  const pathElement = document.createElementNS('http://www.w3.org/2000/svg', 'path');
  pathElement.setAttribute('d', 'M10,10 L50,50');

  const { container } = render(
    <NodeEditor
      element={pathElement}
      tool="node"
      visible={true}
      onNodeChange={mockOnNodeChange}
    />
  );

  const node = container.querySelector('.svg-node');

  // Simular drag
  fireEvent.mouseDown(node, { clientX: 10, clientY: 10 });
  fireEvent.mouseMove(document, { clientX: 20, clientY: 20 });
  fireEvent.mouseUp(document);

  expect(mockOnNodeChange).toHaveBeenCalled();
});
```

#### 3.3 Agregar nodo con herramienta pluma
```javascript
it('debe agregar nodo al hacer click con herramienta pen', async () => {
  const mockOnNodeAdd = vi.fn();
  const pathElement = document.createElementNS('http://www.w3.org/2000/svg', 'path');
  pathElement.setAttribute('d', 'M10,10 L50,50');

  const { container } = render(
    <NodeEditor
      element={pathElement}
      tool="pen"
      visible={true}
      onNodeAdd={mockOnNodeAdd}
    />
  );

  const pathOverlay = container.querySelector('path[stroke="transparent"]');
  await userEvent.click(pathOverlay, { clientX: 30, clientY: 30 });

  expect(mockOnNodeAdd).toHaveBeenCalled();
});
```

#### 3.4 Eliminar nodo
```javascript
it('debe eliminar nodo con Ctrl+Click en modo pen', async () => {
  const mockOnNodeRemove = vi.fn();
  const pathElement = document.createElementNS('http://www.w3.org/2000/svg', 'path');
  pathElement.setAttribute('d', 'M10,10 L50,50 L90,90');

  const { container } = render(
    <NodeEditor
      element={pathElement}
      tool="pen"
      visible={true}
      onNodeRemove={mockOnNodeRemove}
    />
  );

  const node = container.querySelector('.svg-node');
  await userEvent.click(node, { ctrlKey: true });

  expect(mockOnNodeRemove).toHaveBeenCalled();
});
```

#### 3.5 Cambiar tipo de nodo (line/curve/smooth)
```javascript
it('debe cambiar tipo de nodo al hacer click en modo pen', async () => {
  const mockOnNodeChange = vi.fn();
  const pathElement = document.createElementNS('http://www.w3.org/2000/svg', 'path');
  pathElement.setAttribute('d', 'M10,10 L50,50');

  const { container } = render(
    <NodeEditor
      element={pathElement}
      tool="pen"
      visible={true}
      onNodeChange={mockOnNodeChange}
    />
  );

  const node = container.querySelector('.svg-node');
  await userEvent.click(node);

  expect(mockOnNodeChange).toHaveBeenCalled();
  // Verificar que cambió el tipo de nodo
  const newType = mockOnNodeChange.mock.calls[0][1].type;
  expect(['line', 'curve', 'smooth']).toContain(newType);
});
```

---

## 4. Tests de Botones y Herramientas

### Test Suite: `SVGViewer.toolbar.test.jsx`

#### 4.1 Herramienta Select (Flecha negra)
```javascript
describe('SVGViewer - Toolbar Buttons', () => {
  it('debe activar herramienta select', async () => {
    const { getByTitle } = render(<SVGViewer svgContent="<svg></svg>" />);

    const selectButton = getByTitle(/seleccionar y mover entidades/i);
    await userEvent.click(selectButton);

    expect(selectButton).toHaveAttribute('data-state', 'active');
  });
});
```

#### 4.2 Herramienta Node (Flecha blanca)
```javascript
it('debe activar herramienta node', async () => {
  const { getByTitle } = render(<SVGViewer svgContent="<svg></svg>" />);

  const nodeButton = getByTitle(/mover nodos/i);
  await userEvent.click(nodeButton);

  expect(nodeButton).toHaveAttribute('data-state', 'active');
});
```

#### 4.3 Herramienta Pen (Pluma)
```javascript
it('debe activar herramienta pen', async () => {
  const { getByTitle } = render(<SVGViewer svgContent="<svg></svg>" />);

  const penButton = getByTitle(/herramienta pluma/i);
  await userEvent.click(penButton);

  expect(penButton).toHaveAttribute('data-state', 'active');
});
```

#### 4.4 Zoom In
```javascript
it('debe aumentar zoom al hacer click en zoom in', async () => {
  const { getByTitle, getByText } = render(<SVGViewer svgContent="<svg></svg>" />);

  const zoomInButton = getByTitle(/acercar/i);
  await userEvent.click(zoomInButton);

  // Verificar que el porcentaje aumentó
  const zoomDisplay = getByText(/120%/i);
  expect(zoomDisplay).toBeInTheDocument();
});
```

#### 4.5 Zoom Out
```javascript
it('debe disminuir zoom al hacer click en zoom out', async () => {
  const { getByTitle, getByText } = render(<SVGViewer svgContent="<svg></svg>" />);

  const zoomOutButton = getByTitle(/alejar/i);
  await userEvent.click(zoomOutButton);

  // Verificar que el porcentaje disminuyó
  const zoomDisplay = getByText(/80%/i);
  expect(zoomDisplay).toBeInTheDocument();
});
```

#### 4.6 Reset View
```javascript
it('debe resetear vista al hacer click en reset', async () => {
  const { getByTitle, getByText } = render(<SVGViewer svgContent="<svg></svg>" />);

  // Hacer zoom primero
  const zoomInButton = getByTitle(/acercar/i);
  await userEvent.click(zoomInButton);

  // Resetear
  const resetButton = getByTitle(/resetear vista/i);
  await userEvent.click(resetButton);

  // Verificar que volvió a 100%
  const zoomDisplay = getByText(/100%/i);
  expect(zoomDisplay).toBeInTheDocument();
});
```

#### 4.7 Descargar SVG
```javascript
it('debe descargar SVG sin errores', async () => {
  const createObjectURL = vi.fn(() => 'blob:mock-url');
  const revokeObjectURL = vi.fn();

  global.URL.createObjectURL = createObjectURL;
  global.URL.revokeObjectURL = revokeObjectURL;

  const svgContent = '<svg><circle cx="50" cy="50" r="40"/></svg>';
  const { getByTitle } = render(<SVGViewer svgContent={svgContent} />);

  const downloadButton = getByTitle(/exportar svg/i);
  await userEvent.click(downloadButton);

  expect(createObjectURL).toHaveBeenCalled();
  expect(revokeObjectURL).toHaveBeenCalled();
});
```

#### 4.8 Undo
```javascript
it('debe deshacer acción', async () => {
  const { getByTitle } = render(<SVGViewer svgContent="<svg></svg>" />);

  const undoButton = getByTitle(/deshacer/i);

  // Debe estar deshabilitado si no hay historial
  expect(undoButton).toBeDisabled();
});
```

#### 4.9 Redo
```javascript
it('debe rehacer acción', async () => {
  const { getByTitle } = render(<SVGViewer svgContent="<svg></svg>" />);

  const redoButton = getByTitle(/rehacer/i);

  // Debe estar deshabilitado si no hay historial
  expect(redoButton).toBeDisabled();
});
```

#### 4.10 Toggle Performance Metrics
```javascript
it('debe mostrar/ocultar métricas de rendimiento', async () => {
  const { getByTitle, queryByText } = render(<SVGViewer svgContent="<svg></svg>" />);

  const metricsButton = getByTitle(/métricas de rendimiento/i);
  await userEvent.click(metricsButton);

  // Verificar que se muestran las métricas
  expect(queryByText(/elementos/i)).toBeInTheDocument();

  // Click de nuevo para ocultar
  await userEvent.click(metricsButton);
  expect(queryByText(/elementos/i)).not.toBeInTheDocument();
});
```

### Test Suite: `AdvancedTools.test.jsx`

#### 4.11 Guardar
```javascript
describe('AdvancedTools - Buttons', () => {
  it('debe llamar onSave sin errores', async () => {
    const mockOnSave = vi.fn();
    const svgData = { root: { id: 'root', children: [] } };

    const { getByTitle } = render(
      <AdvancedTools svgData={svgData} onSave={mockOnSave} />
    );

    const saveButton = getByTitle(/guardar svg/i);
    await userEvent.click(saveButton);

    expect(mockOnSave).toHaveBeenCalled();
  });
});
```

#### 4.12 Copiar
```javascript
it('debe copiar elemento al clipboard', async () => {
  const mockClipboard = {
    writeText: vi.fn()
  };
  Object.assign(navigator, { clipboard: mockClipboard });

  const selectedElement = { id: 'circle1', tagName: 'circle' };

  const { getByTitle } = render(
    <AdvancedTools selectedElement={selectedElement} />
  );

  const copyButton = getByTitle(/copiar elemento/i);
  await userEvent.click(copyButton);

  expect(mockClipboard.writeText).toHaveBeenCalled();
});
```

#### 4.13 Duplicar
```javascript
it('debe duplicar elemento seleccionado', async () => {
  const mockOnDuplicate = vi.fn();
  const selectedElement = { id: 'rect1', tagName: 'rect' };

  const { getByTitle } = render(
    <AdvancedTools
      selectedElement={selectedElement}
      onDuplicate={mockOnDuplicate}
    />
  );

  const duplicateButton = getByTitle(/duplicar elemento/i);
  await userEvent.click(duplicateButton);

  expect(mockOnDuplicate).toHaveBeenCalled();
});
```

#### 4.14 Eliminar
```javascript
it('debe eliminar elemento con confirmación', async () => {
  const mockOnDelete = vi.fn();
  global.confirm = vi.fn(() => true);

  const selectedElement = { id: 'path1', tagName: 'path' };

  const { getByTitle } = render(
    <AdvancedTools
      selectedElement={selectedElement}
      onDelete={mockOnDelete}
    />
  );

  const deleteButton = getByTitle(/eliminar elemento/i);
  await userEvent.click(deleteButton);

  expect(global.confirm).toHaveBeenCalled();
  expect(mockOnDelete).toHaveBeenCalledWith('path1');
});
```

#### 4.15 Toggle Code View
```javascript
it('debe alternar vista de código', async () => {
  const mockOnToggleCodeView = vi.fn();

  const { getByTitle } = render(
    <AdvancedTools onToggleCodeView={mockOnToggleCodeView} />
  );

  const codeViewButton = getByTitle(/ver código svg/i);
  await userEvent.click(codeViewButton);

  expect(mockOnToggleCodeView).toHaveBeenCalled();
});
```

### Test Suite: `StylePanel.test.jsx`

#### 4.16 Aplicar estilo CSS
```javascript
describe('StylePanel - CSS Styles', () => {
  it('debe aplicar clase CSS a elemento seleccionado', async () => {
    const mockOnStyleChange = vi.fn();
    const svgData = {
      styles: {
        'fill-red': 'fill: red;',
        'stroke-blue': 'stroke: blue;'
      }
    };
    const selectedElement = { id: 'circle1', className: '' };

    const { getByText } = render(
      <StylePanel
        svgData={svgData}
        selectedElement={selectedElement}
        onStyleChange={mockOnStyleChange}
      />
    );

    const styleButton = getByText('fill-red');
    await userEvent.click(styleButton);

    expect(mockOnStyleChange).toHaveBeenCalledWith('circle1', 'fill-red');
  });
});
```

### Test Suite: `CodeView.test.jsx`

#### 4.17 Editar código SVG
```javascript
describe('CodeView - SVG Code Editing', () => {
  it('debe permitir editar código SVG', async () => {
    const mockOnSVGUpdate = vi.fn();
    const svgContent = '<svg><circle cx="50" cy="50" r="40"/></svg>';

    const { getByRole } = render(
      <CodeView
        svgContent={svgContent}
        onSVGUpdate={mockOnSVGUpdate}
      />
    );

    const textarea = getByRole('textbox');
    const newContent = '<svg><rect x="0" y="0" width="100" height="100"/></svg>';

    await userEvent.clear(textarea);
    await userEvent.type(textarea, newContent);

    // Debería validar y actualizar
    expect(mockOnSVGUpdate).toHaveBeenCalled();
  });
});
```

### Test Suite: `App.test.jsx`

#### 4.18 Toggle Theme
```javascript
describe('App - Theme Toggle', () => {
  it('debe alternar entre tema claro y oscuro', async () => {
    const { getByTitle } = render(<App />);

    const themeButton = getByTitle(/cambiar tema/i);
    await userEvent.click(themeButton);

    expect(document.documentElement).toHaveClass('dark');

    await userEvent.click(themeButton);
    expect(document.documentElement).not.toHaveClass('dark');
  });
});
```

#### 4.19 Language Selector
```javascript
describe('LanguageSelector', () => {
  it('debe cambiar idioma sin errores', async () => {
    const { getByRole } = render(<LanguageSelector />);

    const selector = getByRole('combobox');
    await userEvent.click(selector);

    // Seleccionar otro idioma
    const option = getByRole('option', { name: /english/i });
    await userEvent.click(option);

    // No debe arrojar error
    expect(selector).toBeInTheDocument();
  });
});
```

---

## 5. Tests de Integración

### Test Suite: `App.integration.test.jsx`

#### 5.1 Flujo completo: Cargar → Seleccionar → Editar → Guardar
```javascript
describe('App - Integration Tests', () => {
  it('debe completar flujo completo sin errores', async () => {
    const { container, getByTitle, getByText } = render(<App />);

    // 1. Cargar SVG
    const svgContent = '<svg id="test"><circle id="c1" cx="50" cy="50" r="40"/></svg>';
    const file = new File([svgContent], 'test.svg', { type: 'image/svg+xml' });

    const input = container.querySelector('input[type="file"]');
    await userEvent.upload(input, file);

    await waitFor(() => {
      expect(container.querySelector('#c1')).toBeInTheDocument();
    });

    // 2. Seleccionar elemento
    const circle = container.querySelector('#c1');
    await userEvent.click(circle);

    expect(circle).toHaveClass('highlighted');

    // 3. Aplicar estilo (si hay estilos disponibles)
    // ...

    // 4. Guardar
    const saveButton = getByTitle(/exportar svg/i);
    await userEvent.click(saveButton);

    // No debe arrojar error
    expect(container).toBeInTheDocument();
  });
});
```

---

## 6. Tests de Hooks Personalizados

### Test Suite: `useSVGParser.test.js`

#### 6.1 Parsear SVG válido
```javascript
import { renderHook, act } from '@testing-library/react';
import { useSVGParser } from '../hooks/useSVGParser';

describe('useSVGParser', () => {
  it('debe parsear SVG válido correctamente', async () => {
    const { result } = renderHook(() => useSVGParser());

    const svgString = '<svg><circle id="c1" cx="50" cy="50" r="40"/></svg>';

    await act(async () => {
      await result.current.loadSVG(svgString);
    });

    expect(result.current.svgData).not.toBeNull();
    expect(result.current.svgData.root.tagName).toBe('svg');
    expect(result.current.svgData.root.children).toHaveLength(1);
  });

  it('debe extraer estilos CSS del SVG', async () => {
    const { result } = renderHook(() => useSVGParser());

    const svgString = `
      <svg>
        <style>.red { fill: red; }</style>
        <circle class="red" cx="50" cy="50" r="40"/>
      </svg>
    `;

    await act(async () => {
      await result.current.loadSVG(svgString);
    });

    expect(result.current.svgData.styles).toHaveProperty('red');
  });
});
```

### Test Suite: `useHistory.test.js`

#### 6.2 Sistema de Undo/Redo
```javascript
import { renderHook, act } from '@testing-library/react';
import { useHistory } from '../hooks/useHistory';

describe('useHistory', () => {
  it('debe manejar undo correctamente', () => {
    const { result } = renderHook(() => useHistory('initial'));

    act(() => {
      result.current.pushState('state1');
      result.current.pushState('state2');
    });

    expect(result.current.canUndo).toBe(true);

    act(() => {
      result.current.undo();
    });

    expect(result.current.currentState).toBe('state1');
  });

  it('debe manejar redo correctamente', () => {
    const { result } = renderHook(() => useHistory('initial'));

    act(() => {
      result.current.pushState('state1');
      result.current.undo();
    });

    expect(result.current.canRedo).toBe(true);

    act(() => {
      result.current.redo();
    });

    expect(result.current.currentState).toBe('state1');
  });
});
```

---

## 7. Configuración de Vitest

### `vitest.config.js`
```javascript
import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';
import path from 'path';

export default defineConfig({
  plugins: [react()],
  test: {
    globals: true,
    environment: 'jsdom',
    setupFiles: './src/tests/setup.js',
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'html'],
      exclude: [
        'node_modules/',
        'src/tests/setup.js',
      ]
    }
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src')
    }
  }
});
```

### `src/tests/setup.js`
```javascript
import { expect, afterEach } from 'vitest';
import { cleanup } from '@testing-library/react';
import '@testing-library/jest-dom';

// Cleanup después de cada test
afterEach(() => {
  cleanup();
});

// Mock de funciones del navegador
global.URL.createObjectURL = vi.fn(() => 'mock-url');
global.URL.revokeObjectURL = vi.fn();
```

---

## 8. Scripts de Testing en package.json

```json
{
  "scripts": {
    "test": "vitest",
    "test:ui": "vitest --ui",
    "test:coverage": "vitest run --coverage",
    "test:watch": "vitest --watch"
  }
}
```

---

## 9. Estructura de Directorios para Tests

```
src/
├── components/
│   ├── SVGViewer.jsx
│   └── __tests__/
│       └── SVGViewer.test.jsx
├── hooks/
│   ├── useSVGParser.js
│   └── __tests__/
│       └── useSVGParser.test.js
└── tests/
    ├── setup.js
    ├── integration/
    │   └── App.integration.test.jsx
    └── utils/
        └── testHelpers.js
```

---

## 10. Resumen de Cobertura Esperada

| Componente | Tests | Prioridad |
|------------|-------|-----------|
| FileLoadDemo | 5 | Alta |
| SVGViewer | 15 | Alta |
| NodeEditor | 6 | Alta |
| AdvancedTools | 8 | Media |
| SVGHierarchy | 4 | Alta |
| StylePanel | 2 | Media |
| CodeView | 2 | Media |
| useSVGParser | 3 | Alta |
| useHistory | 2 | Media |
| **TOTAL** | **47** | |

---

## Métricas de Calidad

- **Cobertura mínima**: 80%
- **Tests que deben pasar**: 100%
- **Tiempo máximo de ejecución**: < 30s
- **Tests de regresión**: Todos los botones deben ser clickeables sin errores
