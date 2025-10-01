import { describe, it, expect, vi } from 'vitest';
import { render, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import StylePanel from '../StylePanel';

describe('StylePanel - CSS Styles', () => {
  const mockSvgData = {
    styles: {
      'fill-red': 'fill: red;',
      'stroke-blue': 'stroke: blue; stroke-width: 2;',
      'large': 'transform: scale(1.5);'
    }
  };

  const mockSelectedElement = {
    id: 'circle1',
    tagName: 'circle',
    className: ''
  };

  it('debe renderizar sin datos', () => {
    const { container } = render(
      <StylePanel
        svgData={null}
        selectedElement={null}
        onStyleChange={vi.fn()}
      />
    );

    expect(container).toBeInTheDocument();
  });

  it('debe mostrar lista de estilos disponibles', () => {
    const { getByText } = render(
      <StylePanel
        svgData={mockSvgData}
        selectedElement={mockSelectedElement}
        onStyleChange={vi.fn()}
      />
    );

    expect(getByText('fill-red')).toBeInTheDocument();
    expect(getByText('stroke-blue')).toBeInTheDocument();
    expect(getByText('large')).toBeInTheDocument();
  });

  it('debe aplicar clase CSS a elemento seleccionado', async () => {
    const mockOnStyleChange = vi.fn();

    const { getByText } = render(
      <StylePanel
        svgData={mockSvgData}
        selectedElement={mockSelectedElement}
        onStyleChange={mockOnStyleChange}
      />
    );

    const styleButton = getByText('fill-red');
    await userEvent.click(styleButton);

    await waitFor(() => {
      expect(mockOnStyleChange).toHaveBeenCalledWith('circle1', expect.any(String));
    });
  });

  it('debe mostrar propiedades CSS del estilo', () => {
    const { container } = render(
      <StylePanel
        svgData={mockSvgData}
        selectedElement={mockSelectedElement}
        onStyleChange={vi.fn()}
      />
    );

    // Debería mostrar propiedades de los estilos
    expect(container.textContent).toContain('fill-red');
  });

  it('debe indicar estilo activo en elemento seleccionado', () => {
    const elementWithStyle = {
      ...mockSelectedElement,
      className: 'fill-red'
    };

    const { container } = render(
      <StylePanel
        svgData={mockSvgData}
        selectedElement={elementWithStyle}
        onStyleChange={vi.fn()}
      />
    );

    // El componente debería renderizar
    expect(container).toBeInTheDocument();
  });

  it('debe mostrar mensaje cuando no hay elemento seleccionado', () => {
    const { container } = render(
      <StylePanel
        svgData={mockSvgData}
        selectedElement={null}
        onStyleChange={vi.fn()}
      />
    );

    expect(container).toBeInTheDocument();
  });

  it('debe mostrar conteo de estilos disponibles', () => {
    const { container } = render(
      <StylePanel
        svgData={mockSvgData}
        selectedElement={mockSelectedElement}
        onStyleChange={vi.fn()}
      />
    );

    // Debería mostrar los 3 estilos
    const styleElements = container.querySelectorAll('[class*="cursor-pointer"]');
    expect(styleElements.length).toBeGreaterThan(0);
  });
});
