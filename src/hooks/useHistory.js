import { useState, useCallback, useEffect, useRef } from 'react';

/**
 * Hook para manejar historial de cambios y undo/redo
 */
export const useHistory = (initialState = null) => {
  const [state, setState] = useState({
    history: initialState !== null && initialState !== undefined ? [initialState] : [],
    currentIndex: 0
  });
  const lastInitialState = useRef(initialState);

  // Detectar cuando initialState cambia (por ejemplo, al cargar un nuevo SVG)
  useEffect(() => {
    if (initialState && initialState !== lastInitialState.current) {
      lastInitialState.current = initialState;
      setState({
        history: [initialState],
        currentIndex: 0
      });
    }
  }, [initialState]);

  const { history, currentIndex } = state;

  // Estado actual
  const currentState = history[currentIndex] || initialState;

  // Agregar nuevo estado al historial
  const pushState = useCallback((newState) => {
    setState(prev => {
      // Remover estados futuros si estamos en el medio del historial
      const newHistory = prev.history.slice(0, prev.currentIndex + 1);
      newHistory.push(newState);

      // Limitar el historial a 50 estados para evitar problemas de memoria
      if (newHistory.length > 50) {
        newHistory.shift();
        return {
          history: newHistory,
          currentIndex: newHistory.length - 1
        };
      }

      return {
        history: newHistory,
        currentIndex: newHistory.length - 1
      };
    });
  }, []);

  // Deshacer (undo)
  const undo = useCallback(() => {
    let success = false;
    setState(prev => {
      if (prev.currentIndex > 0) {
        success = true;
        return {
          ...prev,
          currentIndex: prev.currentIndex - 1
        };
      }
      return prev;
    });
    return success;
  }, []);

  // Rehacer (redo)
  const redo = useCallback(() => {
    let success = false;
    setState(prev => {
      if (prev.currentIndex < prev.history.length - 1) {
        success = true;
        return {
          ...prev,
          currentIndex: prev.currentIndex + 1
        };
      }
      return prev;
    });
    return success;
  }, []);

  // Verificar si se puede deshacer/rehacer
  const canUndo = currentIndex > 0;
  const canRedo = currentIndex < history.length - 1;

  // Limpiar historial
  const clearHistory = useCallback(() => {
    setState({
      history: initialState !== null && initialState !== undefined ? [initialState] : [],
      currentIndex: 0
    });
  }, [initialState]);

  return {
    currentState,
    pushState,
    undo,
    redo,
    canUndo,
    canRedo,
    clearHistory,
    historyLength: history.length,
    currentIndex
  };
};

export default useHistory;
