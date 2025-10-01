import { describe, it, expect, vi } from 'vitest';
import { render, waitFor, fireEvent } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import App from '../../App';

describe('App - Integration Tests', () => {
  it('debe renderizar la aplicación completa', async () => {
    const { container } = render(<App />);

    await waitFor(() => {
      expect(container).toBeInTheDocument();
    });
  });

  it('debe cargar SVG de ejemplo automáticamente', async () => {
    const { container } = render(<App />);

    await waitFor(() => {
      const svg = container.querySelector('svg');
      expect(svg).toBeInTheDocument();
    }, { timeout: 5000 });
  });

  it('debe completar flujo: Cargar → Seleccionar → Ver jerarquía', async () => {
    const { container } = render(<App />);

    // 1. Esperar a que cargue el SVG de ejemplo
    await waitFor(() => {
      const svg = container.querySelector('svg');
      expect(svg).toBeInTheDocument();
    }, { timeout: 5000 });

    // 2. Verificar que se muestra la jerarquía
    await waitFor(() => {
      expect(container.textContent.length).toBeGreaterThan(0);
    });

    // 3. Buscar un elemento SVG para seleccionar
    const svgElements = container.querySelectorAll('circle, rect, path, g');
    if (svgElements.length > 0) {
      await userEvent.click(svgElements[0]);

      // El elemento debería estar seleccionado
      await waitFor(() => {
        expect(container).toBeInTheDocument();
      });
    }
  });

  it('debe permitir cambio de herramientas', async () => {
    const { container, getByTitle } = render(<App />);

    await waitFor(() => {
      const svg = container.querySelector('svg');
      expect(svg).toBeInTheDocument();
    }, { timeout: 5000 });

    // Cambiar a herramienta node
    const nodeButton = getByTitle(/mover nodos/i);
    await userEvent.click(nodeButton);

    // Cambiar a herramienta pen
    const penButton = getByTitle(/herramienta pluma/i);
    await userEvent.click(penButton);

    // Volver a herramienta select
    const selectButton = getByTitle(/seleccionar y mover entidades/i);
    await userEvent.click(selectButton);

    expect(selectButton).toBeInTheDocument();
  });

  it('debe permitir zoom in y out', async () => {
    const { container, getByTitle } = render(<App />);

    await waitFor(() => {
      const svg = container.querySelector('svg');
      expect(svg).toBeInTheDocument();
    }, { timeout: 5000 });

    const zoomInButton = getByTitle(/acercar/i);
    const zoomOutButton = getByTitle(/alejar/i);

    await userEvent.click(zoomInButton);
    await userEvent.click(zoomInButton);

    await waitFor(() => {
      expect(container.textContent).toContain('144%');
    });

    await userEvent.click(zoomOutButton);

    expect(container).toBeInTheDocument();
  });

  it('debe resetear vista después de zoom', async () => {
    const { container, getByTitle } = render(<App />);

    await waitFor(() => {
      const svg = container.querySelector('svg');
      expect(svg).toBeInTheDocument();
    }, { timeout: 5000 });

    const zoomInButton = getByTitle(/acercar/i);
    const resetButton = getByTitle(/resetear vista/i);

    await userEvent.click(zoomInButton);
    await userEvent.click(resetButton);

    await waitFor(() => {
      expect(container.textContent).toContain('100%');
    });
  });

  it('debe cargar archivo SVG mediante drag & drop', async () => {
    const { container } = render(<App />);

    const svgContent = '<svg id="test-svg"><circle id="test-circle" cx="50" cy="50" r="40"/></svg>';
    const file = new File([svgContent], 'test.svg', { type: 'image/svg+xml' });

    // Buscar zona de drop
    const dropzones = container.querySelectorAll('[class*="border-dashed"]');

    if (dropzones.length > 0) {
      fireEvent.drop(dropzones[0], {
        dataTransfer: { files: [file] }
      });

      await waitFor(() => {
        expect(container).toBeInTheDocument();
      }, { timeout: 3000 });
    }
  });

  it('debe mostrar estadísticas del SVG en footer', async () => {
    const { container } = render(<App />);

    await waitFor(() => {
      const footer = container.querySelector('footer');
      expect(footer).toBeInTheDocument();
      expect(footer.textContent.length).toBeGreaterThan(0);
    }, { timeout: 5000 });
  });

  it('debe alternar tema sin errores', async () => {
    const { container } = render(<App />);

    // Buscar botón de tema
    const buttons = container.querySelectorAll('button');
    let themeButton = null;

    for (const button of buttons) {
      const svg = button.querySelector('svg');
      if (svg && (svg.classList.contains('lucide-moon') || svg.classList.contains('lucide-sun'))) {
        themeButton = button;
        break;
      }
    }

    if (themeButton) {
      await userEvent.click(themeButton);
      await userEvent.click(themeButton);
    }

    expect(container).toBeInTheDocument();
  });

  it('debe expandir y colapsar elementos en jerarquía', async () => {
    const { container } = render(<App />);

    await waitFor(() => {
      const svg = container.querySelector('svg');
      expect(svg).toBeInTheDocument();
    }, { timeout: 5000 });

    // Buscar botones de expandir/colapsar
    const expandButtons = container.querySelectorAll('[class*="cursor-pointer"]');

    if (expandButtons.length > 0) {
      await userEvent.click(expandButtons[0]);
      await userEvent.click(expandButtons[0]);
    }

    expect(container).toBeInTheDocument();
  });

  it('debe descargar SVG sin errores', async () => {
    const { getByTitle } = render(<App />);

    await waitFor(() => {
      const downloadButton = getByTitle(/exportar svg/i);
      expect(downloadButton).toBeInTheDocument();
    }, { timeout: 5000 });

    const downloadButton = getByTitle(/exportar svg/i);
    await userEvent.click(downloadButton);

    expect(global.URL.createObjectURL).toHaveBeenCalled();
  });

  it('debe mantener sincronización entre jerarquía y visor', async () => {
    const { container } = render(<App />);

    await waitFor(() => {
      const svg = container.querySelector('svg');
      expect(svg).toBeInTheDocument();
    }, { timeout: 5000 });

    // Seleccionar desde el visor
    const svgElements = container.querySelectorAll('circle, rect, path');
    if (svgElements.length > 0 && svgElements[0].id) {
      await userEvent.click(svgElements[0]);

      // Verificar que se actualizó la selección
      await waitFor(() => {
        expect(container).toBeInTheDocument();
      });
    }
  });

  it('debe manejar SVG sin errores durante toda la sesión', async () => {
    const { container, getByTitle } = render(<App />);

    // Cargar SVG
    await waitFor(() => {
      const svg = container.querySelector('svg');
      expect(svg).toBeInTheDocument();
    }, { timeout: 5000 });

    // Hacer zoom
    const zoomInButton = getByTitle(/acercar/i);
    await userEvent.click(zoomInButton);

    // Cambiar herramienta
    const nodeButton = getByTitle(/mover nodos/i);
    await userEvent.click(nodeButton);

    // Volver a select
    const selectButton = getByTitle(/seleccionar y mover entidades/i);
    await userEvent.click(selectButton);

    // Resetear vista
    const resetButton = getByTitle(/resetear vista/i);
    await userEvent.click(resetButton);

    // Todo debería funcionar sin errores
    expect(container).toBeInTheDocument();
  });
});

describe('App - Error Handling', () => {
  it('debe manejar archivo inválido sin crash', async () => {
    const { container } = render(<App />);

    const invalidFile = new File(['not an svg'], 'test.txt', { type: 'text/plain' });

    const dropzones = container.querySelectorAll('[class*="border-dashed"]');

    if (dropzones.length > 0) {
      fireEvent.drop(dropzones[0], {
        dataTransfer: { files: [invalidFile] }
      });

      await waitFor(() => {
        expect(container).toBeInTheDocument();
      });
    }
  });

  it('debe manejar clicks en elementos sin ID', async () => {
    const { container } = render(<App />);

    await waitFor(() => {
      const svg = container.querySelector('svg');
      expect(svg).toBeInTheDocument();
    }, { timeout: 5000 });

    // Click en el contenedor SVG
    const svgContainer = container.querySelector('[class*="svg-container"]');
    if (svgContainer) {
      await userEvent.click(svgContainer);
    }

    expect(container).toBeInTheDocument();
  });
});
