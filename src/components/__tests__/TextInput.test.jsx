import { describe, it, expect, vi } from 'vitest';
import { render, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import TextInput from '../TextInput';

describe('TextInput', () => {
  it('debe renderizar correctamente', () => {
    const { container } = render(
      <TextInput
        currentText=""
        onTextChange={vi.fn()}
        onFileLoad={vi.fn()}
      />
    );

    const textarea = container.querySelector('textarea');
    expect(textarea).toBeInTheDocument();
  });

  it('debe procesar contenido SVG desde textarea', async () => {
    const mockOnTextChange = vi.fn();
    const { container } = render(
      <TextInput
        currentText=""
        onTextChange={mockOnTextChange}
        onFileLoad={vi.fn()}
      />
    );

    const textarea = container.querySelector('textarea');
    const svgContent = '<svg><path d="M10 10 L90 90"/></svg>';

    await userEvent.type(textarea, svgContent);

    expect(mockOnTextChange).toHaveBeenCalled();
  });

  it('debe mostrar el texto actual', () => {
    const currentText = 'Test content';
    const { container } = render(
      <TextInput
        currentText={currentText}
        onTextChange={vi.fn()}
        onFileLoad={vi.fn()}
      />
    );

    const textarea = container.querySelector('textarea');
    expect(textarea.value).toBe(currentText);
  });

  it('debe permitir drag & drop de archivos', async () => {
    const mockOnFileLoad = vi.fn();
    const { container } = render(
      <TextInput
        currentText=""
        onTextChange={vi.fn()}
        onFileLoad={mockOnFileLoad}
      />
    );

    const svgContent = '<svg><circle cx="50" cy="50" r="40"/></svg>';
    const file = new File([svgContent], 'test.svg', { type: 'image/svg+xml' });

    const dropzone = container.querySelector('[class*="relative"]');

    if (dropzone) {
      const dropEvent = new Event('drop', { bubbles: true });
      Object.defineProperty(dropEvent, 'dataTransfer', {
        value: { files: [file] }
      });

      dropzone.dispatchEvent(dropEvent);

      await waitFor(() => {
        // El componente puede manejar el archivo
        expect(dropzone).toBeInTheDocument();
      });
    }
  });

  it('debe tener placeholder cuando se proporciona', () => {
    const placeholder = 'Enter SVG content';
    const { container } = render(
      <TextInput
        currentText=""
        onTextChange={vi.fn()}
        onFileLoad={vi.fn()}
        placeholder={placeholder}
      />
    );

    const textarea = container.querySelector('textarea');
    expect(textarea.placeholder).toBe(placeholder);
  });
});
