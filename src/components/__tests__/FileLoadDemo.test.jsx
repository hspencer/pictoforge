import { describe, it, expect, vi } from 'vitest';
import { render, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import FileLoadDemo from '../FileLoadDemo';

describe('FileLoadDemo - Drag & Drop', () => {
  it('debe cargar un archivo SVG válido mediante drag & drop', async () => {
    const mockOnLoadExample = vi.fn();
    const { container } = render(<FileLoadDemo onLoadExample={mockOnLoadExample} />);

    const svgContent = '<svg><circle cx="50" cy="50" r="40"/></svg>';
    const file = new File([svgContent], 'test.svg', { type: 'image/svg+xml' });

    const dropzone = container.querySelector('[class*="border-dashed"]');

    // Simular drag & drop
    fireEvent.drop(dropzone, {
      dataTransfer: { files: [file] }
    });

    await waitFor(() => {
      expect(mockOnLoadExample).toHaveBeenCalled();
    }, { timeout: 3000 });
  });

  it('debe rechazar archivos que no sean SVG', async () => {
    const mockOnLoadExample = vi.fn();
    const { container } = render(<FileLoadDemo onLoadExample={mockOnLoadExample} />);

    const file = new File(['not svg'], 'test.txt', { type: 'text/plain' });
    const dropzone = container.querySelector('[class*="border-dashed"]');

    fireEvent.drop(dropzone, {
      dataTransfer: { files: [file] }
    });

    await waitFor(() => {
      expect(mockOnLoadExample).not.toHaveBeenCalled();
    });
  });

  it('debe prevenir comportamiento por defecto en dragover', () => {
    const { container } = render(<FileLoadDemo onLoadExample={vi.fn()} />);
    const dropzone = container.querySelector('[class*="border-dashed"]');

    const dragOverEvent = new Event('dragover', { bubbles: true, cancelable: true });
    fireEvent(dropzone, dragOverEvent);

    expect(dragOverEvent.defaultPrevented).toBe(true);
  });

  it('debe cargar archivo mediante input file', async () => {
    const mockOnLoadExample = vi.fn();
    const { container } = render(<FileLoadDemo onLoadExample={mockOnLoadExample} />);

    const svgContent = '<svg><rect x="0" y="0" width="100" height="100"/></svg>';
    const file = new File([svgContent], 'rect.svg', { type: 'image/svg+xml' });

    const input = container.querySelector('input[type="file"]');

    await userEvent.upload(input, file);

    await waitFor(() => {
      expect(mockOnLoadExample).toHaveBeenCalled();
    }, { timeout: 3000 });
  });

  it('debe renderizar botones de ejemplos', () => {
    const { container } = render(<FileLoadDemo onLoadExample={vi.fn()} />);
    const buttons = container.querySelectorAll('button');

    // Debe haber al menos un botón
    expect(buttons.length).toBeGreaterThan(0);
  });
});
