import { describe, it, expect } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useHistory } from '../useHistory';

describe('useHistory', () => {
  it('debe inicializar con estado inicial', () => {
    const { result } = renderHook(() => useHistory('initial'));

    expect(result.current.currentState).toBe('initial');
    expect(result.current.canUndo).toBe(false);
    expect(result.current.canRedo).toBe(false);
    expect(result.current.currentIndex).toBe(0);
  });

  it('debe agregar estados al historial', () => {
    const { result } = renderHook(() => useHistory('initial'));

    act(() => {
      result.current.pushState('state1');
    });

    act(() => {
      result.current.pushState('state2');
    });

    expect(result.current.historyLength).toBeGreaterThan(1);
  });

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

    expect(result.current.currentIndex).toBeLessThan(2);
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

    expect(result.current.currentIndex).toBeGreaterThan(0);
  });

  it('debe retornar false al hacer undo sin historial', () => {
    const { result } = renderHook(() => useHistory('initial'));

    act(() => {
      const success = result.current.undo();
      expect(success).toBe(false);
    });
  });

  it('debe retornar false al hacer redo sin estados futuros', () => {
    const { result } = renderHook(() => useHistory('initial'));

    act(() => {
      result.current.pushState('state1');
    });

    act(() => {
      const success = result.current.redo();
      expect(success).toBe(false);
    });
  });

  it('debe limpiar estados futuros al agregar nuevo estado en medio del historial', () => {
    const { result } = renderHook(() => useHistory('initial'));

    act(() => {
      result.current.pushState('state1');
      result.current.pushState('state2');
      result.current.pushState('state3');
      result.current.undo();
      result.current.undo();
    });

    act(() => {
      result.current.pushState('newState');
    });

    // No debería poder hacer redo después de agregar nuevo estado
    expect(result.current.canRedo).toBe(false);
  });

  it('debe limitar historial a 50 estados', () => {
    const { result } = renderHook(() => useHistory('initial'));

    act(() => {
      for (let i = 0; i < 60; i++) {
        result.current.pushState(`state${i}`);
      }
    });

    expect(result.current.historyLength).toBeLessThanOrEqual(51); // initial + 50
  });

  it('debe limpiar historial', () => {
    const { result } = renderHook(() => useHistory('initial'));

    act(() => {
      result.current.pushState('state1');
      result.current.pushState('state2');
    });

    act(() => {
      result.current.clearHistory();
    });

    expect(result.current.currentIndex).toBe(0);
    expect(result.current.canUndo).toBe(false);
    expect(result.current.canRedo).toBe(false);
  });

  it('debe manejar secuencia completa de undo/redo', () => {
    const { result } = renderHook(() => useHistory('initial'));

    act(() => {
      result.current.pushState('state1');
      result.current.pushState('state2');
      result.current.pushState('state3');
    });

    // Hacer undo dos veces
    act(() => {
      result.current.undo();
      result.current.undo();
    });

    expect(result.current.canUndo).toBe(true);
    expect(result.current.canRedo).toBe(true);

    // Hacer redo una vez
    act(() => {
      result.current.redo();
    });

    expect(result.current.canRedo).toBe(true);
  });

  it('debe mantener integridad del historial', () => {
    const { result } = renderHook(() => useHistory(0));

    act(() => {
      result.current.pushState(1);
      result.current.pushState(2);
      result.current.pushState(3);
    });

    act(() => {
      result.current.undo(); // current = 2
      result.current.undo(); // current = 1
    });

    expect(result.current.canUndo).toBe(true);
    expect(result.current.canRedo).toBe(true);

    act(() => {
      result.current.redo(); // current = 2
    });

    expect(result.current.canUndo).toBe(true);
    expect(result.current.canRedo).toBe(true);
  });
});
