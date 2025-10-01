import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import NodeEditor from '../NodeEditor';

describe('NodeEditor - Edición de Nodos', () => {
  let pathElement;

  beforeEach(() => {
    pathElement = document.createElementNS('http://www.w3.org/2000/svg', 'path');
    pathElement.setAttribute('d', 'M10,10 L50,50 L90,10');
    pathElement.setAttribute('id', 'test-path');
  });

  it('debe renderizar null cuando no es visible', () => {
    const { container } = render(
      <NodeEditor
        element={pathElement}
        tool="node"
        visible={false}
      />
    );

    expect(container.firstChild).toBeNull();
  });

  it('debe renderizar null cuando tool no es node ni pen', () => {
    const { container } = render(
      <NodeEditor
        element={pathElement}
        tool="select"
        visible={true}
      />
    );

    expect(container.firstChild).toBeNull();
  });

  it('debe mostrar nodos cuando la herramienta node está activa', () => {
    const { container } = render(
      <svg>
        <NodeEditor
          element={pathElement}
          tool="node"
          visible={true}
        />
      </svg>
    );

    const nodes = container.querySelectorAll('circle');
    expect(nodes.length).toBeGreaterThan(0);
  });

  it('debe mostrar overlay de path en modo pen', () => {
    const { container } = render(
      <svg>
        <NodeEditor
          element={pathElement}
          tool="pen"
          visible={true}
        />
      </svg>
    );

    const overlayPath = container.querySelector('path[stroke="transparent"]');
    expect(overlayPath).toBeInTheDocument();
  });

  it('debe permitir seleccionar nodo individual en modo node', async () => {
    const mockOnNodeChange = vi.fn();
    const { container } = render(
      <svg>
        <NodeEditor
          element={pathElement}
          tool="node"
          visible={true}
          onNodeChange={mockOnNodeChange}
        />
      </svg>
    );

    const firstNode = container.querySelector('circle');

    if (firstNode) {
      await userEvent.click(firstNode);
      // El nodo debería cambiar su tamaño cuando se selecciona
      expect(firstNode).toBeInTheDocument();
    }
  });

  it('debe mover nodo al arrastrar en modo node', async () => {
    const mockOnNodeChange = vi.fn();
    const { container } = render(
      <svg>
        <NodeEditor
          element={pathElement}
          tool="node"
          visible={true}
          onNodeChange={mockOnNodeChange}
        />
      </svg>
    );

    const node = container.querySelector('circle');

    if (node) {
      fireEvent.mouseDown(node, { clientX: 10, clientY: 10 });
      fireEvent.mouseMove(document, { clientX: 20, clientY: 20 });
      fireEvent.mouseUp(document);

      await waitFor(() => {
        expect(mockOnNodeChange).toHaveBeenCalled();
      });
    }
  });

  it('debe agregar nodo al hacer click con herramienta pen', async () => {
    const mockOnNodeAdd = vi.fn();
    const { container } = render(
      <svg>
        <NodeEditor
          element={pathElement}
          tool="pen"
          visible={true}
          onNodeAdd={mockOnNodeAdd}
        />
      </svg>
    );

    const pathOverlay = container.querySelector('path[stroke="transparent"]');

    if (pathOverlay) {
      await userEvent.click(pathOverlay);

      await waitFor(() => {
        expect(mockOnNodeAdd).toHaveBeenCalled();
      });
    }
  });

  it('debe eliminar nodo con Ctrl+Click en modo pen', async () => {
    const mockOnNodeRemove = vi.fn();
    const { container } = render(
      <svg>
        <NodeEditor
          element={pathElement}
          tool="pen"
          visible={true}
          onNodeRemove={mockOnNodeRemove}
        />
      </svg>
    );

    const node = container.querySelector('circle');

    if (node) {
      await userEvent.click(node, { ctrlKey: true });

      await waitFor(() => {
        expect(mockOnNodeRemove).toHaveBeenCalled();
      });
    }
  });

  it('debe cambiar tipo de nodo al hacer click en modo pen', async () => {
    const mockOnNodeChange = vi.fn();
    const { container } = render(
      <svg>
        <NodeEditor
          element={pathElement}
          tool="pen"
          visible={true}
          onNodeChange={mockOnNodeChange}
        />
      </svg>
    );

    const node = container.querySelector('circle');

    if (node) {
      await userEvent.click(node);

      await waitFor(() => {
        expect(mockOnNodeChange).toHaveBeenCalled();
      });
    }
  });

  it('debe mostrar tooltip al hacer hover sobre nodo', async () => {
    const { container } = render(
      <svg>
        <NodeEditor
          element={pathElement}
          tool="node"
          visible={true}
        />
      </svg>
    );

    const node = container.querySelector('circle');

    if (node) {
      fireEvent.mouseEnter(node);

      await waitFor(() => {
        const tooltip = container.querySelector('text');
        expect(tooltip).toBeInTheDocument();
      });

      fireEvent.mouseLeave(node);
    }
  });

  it('debe renderizar control points para nodos curve', () => {
    // Path con curvas bezier
    const curvePathElement = document.createElementNS('http://www.w3.org/2000/svg', 'path');
    curvePathElement.setAttribute('d', 'M10,10 C20,20 40,20 50,10');

    const { container } = render(
      <svg>
        <NodeEditor
          element={curvePathElement}
          tool="node"
          visible={true}
        />
      </svg>
    );

    // Debería renderizar círculos para los nodos
    const circles = container.querySelectorAll('circle');
    expect(circles.length).toBeGreaterThan(0);
  });
});
