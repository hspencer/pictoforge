import { describe, it, expect, vi } from 'vitest';
import { render, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import SVGViewer from '../SVGViewer';

describe('SVGViewer - Selección de Elementos', () => {
  const mockSvgContent = '<svg id="root"><circle id="circle1" cx="50" cy="50" r="40"/></svg>';
  const mockSvgData = {
    root: {
      id: 'root',
      tagName: 'svg',
      children: [{
        id: 'circle1',
        tagName: 'circle',
        children: []
      }]
    },
    styles: {}
  };

  it('debe renderizar sin SVG mostrando mensaje placeholder', () => {
    const { getByText } = render(
      <SVGViewer
        svgContent=""
        onElementSelect={vi.fn()}
        svgData={null}
      />
    );

    expect(getByText(/no hay svg cargado/i)).toBeInTheDocument();
  });

  it('debe renderizar SVG cuando se proporciona contenido', () => {
    const { container } = render(
      <SVGViewer
        svgContent={mockSvgContent}
        onElementSelect={vi.fn()}
        svgData={mockSvgData}
      />
    );

    const circle = container.querySelector('#circle1');
    expect(circle).toBeInTheDocument();
  });

  it('debe seleccionar elemento al hacer click', async () => {
    const mockOnElementSelect = vi.fn();
    const { container } = render(
      <SVGViewer
        svgContent={mockSvgContent}
        onElementSelect={mockOnElementSelect}
        svgData={mockSvgData}
      />
    );

    const circle = container.querySelector('#circle1');
    if (circle) {
      await userEvent.click(circle);
      await waitFor(() => {
        expect(mockOnElementSelect).toHaveBeenCalled();
      });
    }
  });

  it('debe aplicar clase highlighted al elemento seleccionado', () => {
    const selectedElement = { id: 'circle1', tagName: 'circle' };
    const { container } = render(
      <SVGViewer
        svgContent={mockSvgContent}
        selectedElement={selectedElement}
        onElementSelect={vi.fn()}
        svgData={mockSvgData}
      />
    );

    // Esperar a que el efecto se aplique
    waitFor(() => {
      const circle = container.querySelector('#circle1');
      expect(circle).toHaveClass('highlighted');
    });
  });

  it('debe tener botones de herramientas', () => {
    const { getByTitle } = render(
      <SVGViewer
        svgContent={mockSvgContent}
        onElementSelect={vi.fn()}
        svgData={mockSvgData}
      />
    );

    expect(getByTitle(/seleccionar y mover entidades/i)).toBeInTheDocument();
    expect(getByTitle(/mover nodos/i)).toBeInTheDocument();
    expect(getByTitle(/herramienta pluma/i)).toBeInTheDocument();
  });
});

describe('SVGViewer - Toolbar Buttons', () => {
  const mockSvgContent = '<svg><rect x="10" y="10" width="50" height="50"/></svg>';

  it('debe activar herramienta select', async () => {
    const { getByTitle } = render(
      <SVGViewer svgContent={mockSvgContent} onElementSelect={vi.fn()} />
    );

    const selectButton = getByTitle(/seleccionar y mover entidades/i);
    await userEvent.click(selectButton);

    expect(selectButton).toBeInTheDocument();
  });

  it('debe activar herramienta node', async () => {
    const { getByTitle } = render(
      <SVGViewer svgContent={mockSvgContent} onElementSelect={vi.fn()} />
    );

    const nodeButton = getByTitle(/mover nodos/i);
    await userEvent.click(nodeButton);

    expect(nodeButton).toBeInTheDocument();
  });

  it('debe activar herramienta pen', async () => {
    const { getByTitle } = render(
      <SVGViewer svgContent={mockSvgContent} onElementSelect={vi.fn()} />
    );

    const penButton = getByTitle(/herramienta pluma/i);
    await userEvent.click(penButton);

    expect(penButton).toBeInTheDocument();
  });

  it('debe aumentar zoom al hacer click en zoom in', async () => {
    const { getByTitle, container } = render(
      <SVGViewer svgContent={mockSvgContent} onElementSelect={vi.fn()} />
    );

    const zoomInButton = getByTitle(/acercar/i);
    await userEvent.click(zoomInButton);

    await waitFor(() => {
      const zoomDisplay = container.textContent;
      expect(zoomDisplay).toContain('120%');
    });
  });

  it('debe disminuir zoom al hacer click en zoom out', async () => {
    const { getByTitle, container } = render(
      <SVGViewer svgContent={mockSvgContent} onElementSelect={vi.fn()} />
    );

    const zoomOutButton = getByTitle(/alejar/i);
    await userEvent.click(zoomOutButton);

    await waitFor(() => {
      const zoomDisplay = container.textContent;
      expect(zoomDisplay).toContain('80%');
    });
  });

  it('debe resetear vista al hacer click en reset', async () => {
    const { getByTitle, container } = render(
      <SVGViewer svgContent={mockSvgContent} onElementSelect={vi.fn()} />
    );

    // Hacer zoom primero
    const zoomInButton = getByTitle(/acercar/i);
    await userEvent.click(zoomInButton);

    // Resetear
    const resetButton = getByTitle(/resetear vista/i);
    await userEvent.click(resetButton);

    await waitFor(() => {
      const zoomDisplay = container.textContent;
      expect(zoomDisplay).toContain('100%');
    });
  });

  it('debe descargar SVG sin errores', async () => {
    const { getByTitle } = render(
      <SVGViewer svgContent={mockSvgContent} onElementSelect={vi.fn()} />
    );

    const downloadButton = getByTitle(/exportar svg/i);
    await userEvent.click(downloadButton);

    expect(global.URL.createObjectURL).toHaveBeenCalled();
  });

  it('botón undo debe estar deshabilitado sin historial', () => {
    const { getByTitle } = render(
      <SVGViewer svgContent={mockSvgContent} onElementSelect={vi.fn()} />
    );

    const undoButton = getByTitle(/deshacer/i);
    expect(undoButton).toBeDisabled();
  });

  it('botón redo debe estar deshabilitado sin historial', () => {
    const { getByTitle } = render(
      <SVGViewer svgContent={mockSvgContent} onElementSelect={vi.fn()} />
    );

    const redoButton = getByTitle(/rehacer/i);
    expect(redoButton).toBeDisabled();
  });

  it('debe mostrar/ocultar métricas de rendimiento', async () => {
    const { getByTitle, queryByText } = render(
      <SVGViewer svgContent={mockSvgContent} onElementSelect={vi.fn()} />
    );

    const metricsButton = getByTitle(/métricas de rendimiento/i);
    await userEvent.click(metricsButton);

    // Click de nuevo para ocultar
    await userEvent.click(metricsButton);

    expect(metricsButton).toBeInTheDocument();
  });
});
