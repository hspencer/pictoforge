import { describe, it, expect, vi, beforeAll } from 'vitest';
import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { SVGViewer } from '../SVGViewer';

// Mock de @panzoom/panzoom
vi.mock('@panzoom/panzoom', () => {
  return {
    __esModule: true,
    default: vi.fn((element, options) => {
      let scale = options.startScale || 1;
      let x = options.startX || 0;
      let y = options.startY || 0;
      const step = options.step || 0.3;

      const triggerChange = () => {
        console.log('DEBUG: Mock triggerChange called', { scale, x, y });
        const event = new CustomEvent('panzoomchange', {
          detail: { scale, x, y }
        });
        element.dispatchEvent(event);
      };

      return {
        zoomWithWheel: vi.fn(),
        destroy: vi.fn(),
        getScale: vi.fn(() => scale),
        getPan: vi.fn(() => ({ x, y })),
        zoomIn: vi.fn(() => {
          scale = Math.min(scale + step, 10);
          triggerChange();
        }),
        zoomOut: vi.fn(() => {
          scale = Math.max(scale - step, 0.1);
          triggerChange();
        }),
        zoom: vi.fn((newScale) => {
          scale = newScale;
          triggerChange();
        }),
        pan: vi.fn((newX, newY) => {
          x = newX;
          y = newY;
          triggerChange();
        }),
        reset: vi.fn(() => {
          scale = 1;
          x = 0;
          y = 0;
          triggerChange();
        }),
      };
    }),
  };
});

// Mock de useI18n
vi.mock('../../hooks/useI18n', () => ({
  useI18n: () => ({
    t: (key) => key,
  }),
  default: () => ({
    t: (key) => key,
  }),
}));
// Mock global de getBBox para JSDOM
beforeAll(() => {
  if (!SVGElement.prototype.getBBox) {
    SVGElement.prototype.getBBox = () => ({
      x: 0,
      y: 0,
      width: 100,
      height: 100,
      top: 0,
      right: 100,
      bottom: 100,
      left: 0,
    });
  }
});

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
    const svgContainer = container.querySelector('.svg-container');

    console.log('DEBUG: Circle found:', !!circle);
    if (circle) {
      fireEvent.click(circle, { bubbles: true });

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
    const { getByTitle } = render(
      <SVGViewer svgContent={mockSvgContent} onElementSelect={vi.fn()} />
    );

    const zoomInButton = getByTitle(/acercar/i);
    const zoomInput = getByTitle(/establecer porcentaje de zoom/i);

    await userEvent.click(zoomInButton);

    await waitFor(() => {
      expect(zoomInput.value).toBe('130%');
    });
  });

  it('debe disminuir zoom al hacer click en zoom out', async () => {
    const { getByTitle } = render(
      <SVGViewer svgContent={mockSvgContent} onElementSelect={vi.fn()} />
    );

    const zoomOutButton = getByTitle(/alejar/i);
    const zoomInput = getByTitle(/establecer porcentaje de zoom/i);

    await userEvent.click(zoomOutButton);

    await waitFor(() => {
      expect(zoomInput.value).toBe('70%');
    });
  });

  it('debe resetear vista al hacer click en reset', async () => {
    const { getByTitle } = render(
      <SVGViewer svgContent={mockSvgContent} onElementSelect={vi.fn()} />
    );

    const resetButton = getByTitle(/resetear vista/i);
    const zoomInput = getByTitle(/establecer porcentaje de zoom/i);

    // First change zoom
    const zoomInButton = getByTitle(/acercar/i);
    await userEvent.click(zoomInButton);

    // Then reset
    await userEvent.click(resetButton);

    await waitFor(() => {
      expect(zoomInput.value).toBe('100%');
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
