import { useState, useCallback, useEffect, useRef } from 'react';

/**
 * Hook para manejar historial de cambios y undo/redo
 */
export const useHistory = (initialState = null) => {
  const [history, setHistory] = useState([initialState].filter(Boolean));
  const [currentIndex, setCurrentIndex] = useState(0);
  const lastInitialState = useRef(initialState);

  // Detectar cuando initialState cambia (por ejemplo, al cargar un nuevo SVG)
  useEffect(() => {
    if (initialState && initialState !== lastInitialState.current) {
      lastInitialState.current = initialState;
      setHistory([initialState]);
      setCurrentIndex(0);
    }
  }, [initialState]);

  // Estado actual
  const currentState = history[currentIndex] || initialState;

  // Agregar nuevo estado al historial
  const pushState = useCallback((newState) => {
    setHistory(prev => {
      // Remover estados futuros si estamos en el medio del historial
      const newHistory = prev.slice(0, currentIndex + 1);
      newHistory.push(newState);
      
      // Limitar el historial a 50 estados para evitar problemas de memoria
      if (newHistory.length > 50) {
        newHistory.shift();
        return newHistory;
      }
      
      return newHistory;
    });
    
    setCurrentIndex(prev => {
      const newIndex = Math.min(prev + 1, history.length);
      return newIndex;
    });
  }, [currentIndex, history.length]);

  // Deshacer (undo)
  const undo = useCallback(() => {
    if (currentIndex > 0) {
      setCurrentIndex(prev => prev - 1);
      return true;
    }
    return false;
  }, [currentIndex]);

  // Rehacer (redo)
  const redo = useCallback(() => {
    if (currentIndex < history.length - 1) {
      setCurrentIndex(prev => prev + 1);
      return true;
    }
    return false;
  }, [currentIndex, history.length]);

  // Verificar si se puede deshacer/rehacer
  const canUndo = currentIndex > 0;
  const canRedo = currentIndex < history.length - 1;

  // Limpiar historial
  const clearHistory = useCallback(() => {
    setHistory([initialState].filter(Boolean));
    setCurrentIndex(0);
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
