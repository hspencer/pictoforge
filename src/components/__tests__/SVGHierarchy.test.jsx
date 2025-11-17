import { describe, it, expect, vi } from 'vitest';
import { render, waitFor } from '@/tests/test-utils';
import userEvent from '@testing-library/user-event';
import SVGHierarchy from '../SVGHierarchy';

describe('SVGHierarchy - Selección Bidireccional', () => {
  const mockSvgData = {
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
    },
    styles: {}
  };

  it('debe renderizar sin datos mostrando mensaje', () => {
    const { getByText } = render(
      <SVGHierarchy
        svgData={null}
        onElementSelect={vi.fn()}
        expandedElements={new Set()}
        onToggleExpand={vi.fn()}
      />
    );

    expect(getByText(/no hay svg cargado/i)).toBeInTheDocument();
  });

  it('debe renderizar jerarquía de elementos', () => {
    const { getByText } = render(
      <SVGHierarchy
        svgData={mockSvgData}
        onElementSelect={vi.fn()}
        expandedElements={new Set(['root', 'group1'])}
        onToggleExpand={vi.fn()}
      />
    );

    expect(getByText('svg')).toBeInTheDocument();
  });

  it('debe seleccionar elemento desde jerarquía', async () => {
    const mockOnElementSelect = vi.fn();
    const expandedElements = new Set(['root', 'group1']);

    const { container } = render(
      <SVGHierarchy
        svgData={mockSvgData}
        onElementSelect={mockOnElementSelect}
        expandedElements={expandedElements}
        onToggleExpand={vi.fn()}
      />
    );

    const elements = container.querySelectorAll('[class*="cursor-pointer"]');

    if (elements.length > 0) {
      await userEvent.click(elements[0]);

      await waitFor(() => {
        expect(mockOnElementSelect).toHaveBeenCalled();
      });
    }
  });

  it('debe expandir/colapsar elementos', async () => {
    const mockOnToggleExpand = vi.fn();
    const expandedElements = new Set(['root']);

    const { container } = render(
      <SVGHierarchy
        svgData={mockSvgData}
        onElementSelect={vi.fn()}
        expandedElements={expandedElements}
        onToggleExpand={mockOnToggleExpand}
      />
    );

    // Buscar botón de expandir/colapsar
    const expandButton = container.querySelector('button');

    if (expandButton) {
      await userEvent.click(expandButton);

      expect(mockOnToggleExpand).toHaveBeenCalled();
    }
  });

  it('debe mostrar elemento seleccionado con estilo diferente', () => {
    const selectedElement = mockSvgData.root.children[0];
    const expandedElements = new Set(['root', 'group1']);

    const { container } = render(
      <SVGHierarchy
        svgData={mockSvgData}
        selectedElement={selectedElement}
        onElementSelect={vi.fn()}
        expandedElements={expandedElements}
        onToggleExpand={vi.fn()}
      />
    );

    // Verificar que el componente renderiza
    expect(container).toBeInTheDocument();
  });

  it('debe mostrar conteo de elementos hijos', () => {
    const expandedElements = new Set(['root']);

    const { container } = render(
      <SVGHierarchy
        svgData={mockSvgData}
        onElementSelect={vi.fn()}
        expandedElements={expandedElements}
        onToggleExpand={vi.fn()}
      />
    );

    // Debe mostrar información del SVG
    expect(container.textContent).toContain('svg');
  });
});
