import { useState, useEffect, useCallback } from 'react';

/**
 * Hook personalizado para gestionar datos en sessionStorage con React
 *
 * Características:
 * - Sincronización automática con sessionStorage
 * - Manejo de errores (cuota excedida, JSON inválido)
 * - Soporte para valores complejos (objetos, arrays)
 * - Los datos persisten solo durante la sesión del navegador
 *
 * @param {string} key - Clave para sessionStorage
 * @param {*} initialValue - Valor inicial si no existe en sessionStorage
 * @returns {Array} Un array con el valor actual, una función para actualizarlo y una función para eliminarlo.
 */
export const useSessionStorage = (key, initialValue) => {
  // Estado para almacenar el valor
  const [storedValue, setStoredValue] = useState(() => {
    try {
      // Obtener del sessionStorage
      const item = window.sessionStorage.getItem(key);

      // Parsear JSON guardado o retornar initialValue
      return item ? JSON.parse(item) : initialValue;
    } catch (error) {
      console.error(`Error al leer sessionStorage key "${key}":`, error);
      return initialValue;
    }
  });

  /**
   * Guardar valor en sessionStorage y actualizar estado
   */
  const setValue = useCallback((value) => {
    try {
      // Permitir que value sea una función como en useState
      const valueToStore = value instanceof Function ? value(storedValue) : value;

      // Guardar en estado
      setStoredValue(valueToStore);

      // Guardar en sessionStorage
      if (valueToStore === undefined) {
        window.sessionStorage.removeItem(key);
      } else {
        window.sessionStorage.setItem(key, JSON.stringify(valueToStore));
      }

      // Disparar evento personalizado para sincronización entre componentes
      window.dispatchEvent(new CustomEvent('session-storage-change', {
        detail: { key, value: valueToStore }
      }));
    } catch (error) {
      // Manejar error de cuota excedida
      if (error.name === 'QuotaExceededError') {
        console.error(`⚠️ sessionStorage lleno. No se pudo guardar "${key}"`);
        alert('El almacenamiento de sesión está lleno. Considera limpiar datos antiguos.');
      } else {
        console.error(`Error al guardar en sessionStorage key "${key}":`, error);
      }
    }
  }, [key, storedValue]);

  /**
   * Eliminar valor de sessionStorage
   */
  const removeValue = useCallback(() => {
    try {
      window.sessionStorage.removeItem(key);
      setStoredValue(undefined);

      window.dispatchEvent(new CustomEvent('session-storage-change', {
        detail: { key, value: undefined }
      }));
    } catch (error) {
      console.error(`Error al eliminar de sessionStorage key "${key}":`, error);
    }
  }, [key]);

  /**
   * Sincronizar con cambios de sessionStorage desde la misma tab
   */
  useEffect(() => {
    const handleCustomStorageChange = (e) => {
      if (e.detail.key === key) {
        setStoredValue(e.detail.value);
      }
    };

    // Listener para cambios desde la misma tab
    window.addEventListener('session-storage-change', handleCustomStorageChange);

    return () => {
      window.removeEventListener('session-storage-change', handleCustomStorageChange);
    };
  }, [key]);

  return [storedValue, setValue, removeValue];
};

/**
 * Obtiene el tamaño actual usado en sessionStorage (en KB)
 */
export const getSessionStorageSize = () => {
  let total = 0;

  for (let key in sessionStorage) {
    if (sessionStorage.hasOwnProperty(key)) {
      total += sessionStorage[key].length + key.length;
    }
  }

  return (total / 1024).toFixed(2); // KB
};

/**
 * Limpia sessionStorage de forma segura
 */
export const clearSessionStorage = (keysToKeep = []) => {
  try {
    const toKeep = {};

    // Guardar claves que queremos mantener
    keysToKeep.forEach(key => {
      const value = sessionStorage.getItem(key);
      if (value !== null) {
        toKeep[key] = value;
      }
    });

    // Limpiar todo
    sessionStorage.clear();

    // Restaurar claves guardadas
    Object.entries(toKeep).forEach(([key, value]) => {
      sessionStorage.setItem(key, value);
    });

    console.log('✓ sessionStorage limpiado exitosamente');
    return true;
  } catch (error) {
    console.error('Error al limpiar sessionStorage:', error);
    return false;
  }
};

/**
 * Verifica si hay espacio disponible en sessionStorage
 */
export const checkSessionStorageAvailable = () => {
  try {
    const test = '__storage_test__';
    sessionStorage.setItem(test, test);
    sessionStorage.removeItem(test);
    return true;
  } catch (e) {
    return false;
  }
};

export default useSessionStorage;
