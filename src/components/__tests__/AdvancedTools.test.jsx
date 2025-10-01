import { describe, it, expect, vi } from 'vitest';
import { render, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import AdvancedTools from '../AdvancedTools';

describe('AdvancedTools - Buttons', () => {
  const mockSvgData = {
    root: {
      id: 'root',
      tagName: 'svg',
      children: []
    },
    styles: {
      'fill-red': 'fill: red;'
    }
  };

  const mockSelectedElement = {
    id: 'circle1',
    tagName: 'circle',
    className: 'fill-red'
  };

  it('debe renderizar correctamente', () => {
    const { container } = render(
      <AdvancedTools
        svgData={mockSvgData}
        onSave={vi.fn()}
      />
    );

    expect(container).toBeInTheDocument();
  });

  it('debe llamar onSave sin errores', async () => {
    const mockOnSave = vi.fn();
    const { getByTitle } = render(
      <AdvancedTools
        svgData={mockSvgData}
        onSave={mockOnSave}
      />
    );

    const saveButton = getByTitle(/guardar svg/i);
    await userEvent.click(saveButton);

    expect(mockOnSave).toHaveBeenCalled();
  });

  it('botón save debe estar deshabilitado sin svgData', () => {
    const { getByTitle } = render(
      <AdvancedTools
        svgData={null}
        onSave={vi.fn()}
      />
    );

    const saveButton = getByTitle(/guardar svg/i);
    expect(saveButton).toBeDisabled();
  });

  it('debe copiar elemento al clipboard', async () => {
    const { getByTitle } = render(
      <AdvancedTools
        selectedElement={mockSelectedElement}
      />
    );

    const copyButton = getByTitle(/copiar elemento/i);
    await userEvent.click(copyButton);

    expect(navigator.clipboard.writeText).toHaveBeenCalled();
  });

  it('botón copy debe estar deshabilitado sin elemento seleccionado', () => {
    const { getByTitle } = render(
      <AdvancedTools
        selectedElement={null}
      />
    );

    const copyButton = getByTitle(/copiar elemento/i);
    expect(copyButton).toBeDisabled();
  });

  it('debe duplicar elemento seleccionado', async () => {
    const mockOnDuplicate = vi.fn();
    const { getByTitle } = render(
      <AdvancedTools
        selectedElement={mockSelectedElement}
        onDuplicate={mockOnDuplicate}
      />
    );

    const duplicateButton = getByTitle(/duplicar elemento/i);
    await userEvent.click(duplicateButton);

    expect(mockOnDuplicate).toHaveBeenCalled();
  });

  it('botón duplicate debe estar deshabilitado sin elemento seleccionado', () => {
    const { getByTitle } = render(
      <AdvancedTools
        selectedElement={null}
        onDuplicate={vi.fn()}
      />
    );

    const duplicateButton = getByTitle(/duplicar elemento/i);
    expect(duplicateButton).toBeDisabled();
  });

  it('debe eliminar elemento con confirmación', async () => {
    const mockOnDelete = vi.fn();
    global.confirm = vi.fn(() => true);

    const { getByTitle } = render(
      <AdvancedTools
        selectedElement={mockSelectedElement}
        onDelete={mockOnDelete}
      />
    );

    const deleteButton = getByTitle(/eliminar elemento/i);
    await userEvent.click(deleteButton);

    expect(global.confirm).toHaveBeenCalled();
    expect(mockOnDelete).toHaveBeenCalledWith('circle1');
  });

  it('debe cancelar eliminación si usuario no confirma', async () => {
    const mockOnDelete = vi.fn();
    global.confirm = vi.fn(() => false);

    const { getByTitle } = render(
      <AdvancedTools
        selectedElement={mockSelectedElement}
        onDelete={mockOnDelete}
      />
    );

    const deleteButton = getByTitle(/eliminar elemento/i);
    await userEvent.click(deleteButton);

    expect(global.confirm).toHaveBeenCalled();
    expect(mockOnDelete).not.toHaveBeenCalled();
  });

  it('botón delete debe estar deshabilitado sin elemento seleccionado', () => {
    const { getByTitle } = render(
      <AdvancedTools
        selectedElement={null}
        onDelete={vi.fn()}
      />
    );

    const deleteButton = getByTitle(/eliminar elemento/i);
    expect(deleteButton).toBeDisabled();
  });

  it('debe alternar vista de código', async () => {
    const mockOnToggleCodeView = vi.fn();

    const { getByTitle } = render(
      <AdvancedTools
        onToggleCodeView={mockOnToggleCodeView}
      />
    );

    const codeViewButton = getByTitle(/ver código svg/i);
    await userEvent.click(codeViewButton);

    expect(mockOnToggleCodeView).toHaveBeenCalled();
  });

  it('debe mostrar información del elemento seleccionado', () => {
    const { getByText } = render(
      <AdvancedTools
        selectedElement={mockSelectedElement}
      />
    );

    expect(getByText('circle1')).toBeInTheDocument();
    expect(getByText('circle')).toBeInTheDocument();
  });

  it('debe mostrar estadísticas del SVG', () => {
    const { getByText } = render(
      <AdvancedTools
        svgData={mockSvgData}
      />
    );

    expect(getByText(/1 estilos/i)).toBeInTheDocument();
    expect(getByText(/1 elementos/i)).toBeInTheDocument();
  });

  it('botones undo y redo deben existir', () => {
    const { getByTitle } = render(
      <AdvancedTools
        onUndo={vi.fn()}
        onRedo={vi.fn()}
      />
    );

    expect(getByTitle(/deshacer/i)).toBeInTheDocument();
    expect(getByTitle(/rehacer/i)).toBeInTheDocument();
  });
});
