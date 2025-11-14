import { useState, useEffect, useCallback } from 'react';

/**
 * Hook personalizado para gestionar datos en localStorage con React
 *
 * Características:
 * - Sincronización automática con localStorage
 * - Manejo de errores (cuota excedida, JSON inválido)
 * - Soporte para valores complejos (objetos, arrays)
 * - Sincronización entre tabs
 *
 * @param {string} key - Clave para localStorage
 * @param {*} initialValue - Valor inicial si no existe en localStorage
 * @returns {[value, setValue, removeValue]} - [valor actual, función set, función remove]
 */
export const useLocalStorage = (key, initialValue) => {
  // Estado para almacenar el valor
  const [storedValue, setStoredValue] = useState(() => {
    try {
      // Obtener del localStorage
      const item = window.localStorage.getItem(key);

      // Parsear JSON guardado o retornar initialValue
      return item ? JSON.parse(item) : initialValue;
    } catch (error) {
      console.error(`Error al leer localStorage key "${key}":`, error);
      return initialValue;
    }
  });

  /**
   * Guardar valor en localStorage y actualizar estado
   */
  const setValue = useCallback((value) => {
    try {
      // Permitir que value sea una función como en useState
      const valueToStore = value instanceof Function ? value(storedValue) : value;

      // Guardar en estado
      setStoredValue(valueToStore);

      // Guardar en localStorage
      if (valueToStore === undefined) {
        window.localStorage.removeItem(key);
      } else {
        window.localStorage.setItem(key, JSON.stringify(valueToStore));
      }

      // Disparar evento personalizado para sincronización entre componentes
      window.dispatchEvent(new CustomEvent('local-storage-change', {
        detail: { key, value: valueToStore }
      }));
    } catch (error) {
      // Manejar error de cuota excedida
      if (error.name === 'QuotaExceededError') {
        console.error(`⚠️ localStorage lleno. No se pudo guardar "${key}"`);
        alert('El almacenamiento local está lleno. Considera limpiar datos antiguos.');
      } else {
        console.error(`Error al guardar en localStorage key "${key}":`, error);
      }
    }
  }, [key, storedValue]);

  /**
   * Eliminar valor de localStorage
   */
  const removeValue = useCallback(() => {
    try {
      window.localStorage.removeItem(key);
      setStoredValue(undefined);

      window.dispatchEvent(new CustomEvent('local-storage-change', {
        detail: { key, value: undefined }
      }));
    } catch (error) {
      console.error(`Error al eliminar de localStorage key "${key}":`, error);
    }
  }, [key]);

  /**
   * Sincronizar con cambios de localStorage desde otras tabs/ventanas
   */
  useEffect(() => {
    const handleStorageChange = (e) => {
      if (e.key === key && e.newValue !== null) {
        try {
          setStoredValue(JSON.parse(e.newValue));
        } catch (error) {
          console.error('Error al parsear valor de storage:', error);
        }
      }
    };

    const handleCustomStorageChange = (e) => {
      if (e.detail.key === key) {
        setStoredValue(e.detail.value);
      }
    };

    // Listener para cambios desde otras tabs
    window.addEventListener('storage', handleStorageChange);

    // Listener para cambios desde la misma tab
    window.addEventListener('local-storage-change', handleCustomStorageChange);

    return () => {
      window.removeEventListener('storage', handleStorageChange);
      window.removeEventListener('local-storage-change', handleCustomStorageChange);
    };
  }, [key]);

  return [storedValue, setValue, removeValue];
};

/**
 * Obtiene el tamaño actual usado en localStorage (en KB)
 */
export const getLocalStorageSize = () => {
  let total = 0;

  for (let key in localStorage) {
    if (localStorage.hasOwnProperty(key)) {
      total += localStorage[key].length + key.length;
    }
  }

  return (total / 1024).toFixed(2); // KB
};

/**
 * Limpia localStorage de forma segura
 */
export const clearLocalStorage = (keysToKeep = []) => {
  try {
    const toKeep = {};

    // Guardar claves que queremos mantener
    keysToKeep.forEach(key => {
      const value = localStorage.getItem(key);
      if (value !== null) {
        toKeep[key] = value;
      }
    });

    // Limpiar todo
    localStorage.clear();

    // Restaurar claves guardadas
    Object.entries(toKeep).forEach(([key, value]) => {
      localStorage.setItem(key, value);
    });

    console.log('✓ localStorage limpiado exitosamente');
    return true;
  } catch (error) {
    console.error('Error al limpiar localStorage:', error);
    return false;
  }
};

/**
 * Verifica si hay espacio disponible en localStorage
 */
export const checkLocalStorageAvailable = () => {
  try {
    const test = '__storage_test__';
    localStorage.setItem(test, test);
    localStorage.removeItem(test);
    return true;
  } catch (e) {
    return false;
  }
};

export default useLocalStorage;
