import { useState, useEffect, useCallback } from 'react';
import { useLocalStorage } from './useLocalStorage';
import { useSessionStorage } from './useSessionStorage';

/**
 * Hook personalizado para gestionar almacenamiento de SVGs
 *
 * Estrategia de almacenamiento:
 * - localStorage: Último SVG trabajado + configuraciones persistentes
 * - sessionStorage: Configuración de la sesión actual
 * - IndexedDB: Historial completo de SVGs (futuro)
 *
 * @returns {Object} Métodos y estado del almacenamiento
 */
export const useSVGStorage = () => {
  // Último SVG trabajado
  const [lastSVG, setLastSVG] = useLocalStorage('pictoforge_last_svg', null);

  // Configuraciones del usuario (persistente)
  const [userConfig, setUserConfig] = useLocalStorage('pictoforge_config', {
    // Configuración básica
    darkMode: false,
    language: 'es',
    showGrid: true,
    autoSave: true,

    // Configuración de layout
    swapPanels: false, // Intercambiar panel izquierdo/derecho (hierarchy <-> viewer)

    // Configuración de instancia
    instanceName: '',
    author: '',
    location: {
      address: '',
      coordinates: null,
      placeId: null
    },

    // Configuración de estilos
    graphicStylePrompt: '',
    customStyles: []
  });

  // Configuración de la sesión actual (temporal)
  const [sessionConfig, setSessionConfig] = useSessionStorage('pictoforge_session_config', {
    instanceName: '',
    author: '',
    location: {
      address: '',
      coordinates: null,
      placeId: null
    },
    language: 'es',
    graphicStylePrompt: '',
    customStyles: []
  });

  // Historial reciente (últimos 5 SVGs en localStorage)
  const [recentSVGs, setRecentSVGs] = useLocalStorage('pictoforge_recent', []);

  /**
   * Guarda el SVG actual en localStorage
   */
  const saveSVG = useCallback((svgData, metadata = {}) => {
    try {
      const svgEntry = {
        id: Date.now().toString(),
        content: svgData.originalSVG || svgData,
        metadata: {
          name: metadata.name || 'Sin título',
          dateModified: new Date().toISOString(),
          viewBox: svgData.viewBox,
          width: svgData.width,
          height: svgData.height,
          elementCount: svgData.elementCount || 0,
          ...metadata
        }
      };

      // Guardar como último SVG
      setLastSVG(svgEntry);

      // Agregar al historial reciente (máximo 5)
      setRecentSVGs(prev => {
        const filtered = (prev || []).filter(item => item.id !== svgEntry.id);
        return [svgEntry, ...filtered].slice(0, 5);
      });

      console.log('✓ SVG guardado en localStorage');
      return true;
    } catch (error) {
      console.error('✗ Error al guardar SVG:', error);

      // Si es error de cuota, intentar limpiar historial antiguo
      if (error.name === 'QuotaExceededError') {
        console.warn('⚠️ Limpiando historial antiguo...');
        setRecentSVGs([]);

        // Reintentar guardado
        try {
          setLastSVG({
            id: Date.now().toString(),
            content: svgData.originalSVG || svgData,
            metadata: { name: metadata.name || 'Sin título' }
          });
          return true;
        } catch (retryError) {
          console.error('✗ No se pudo guardar incluso después de limpiar');
          return false;
        }
      }

      return false;
    }
  }, [setLastSVG, setRecentSVGs]);

  /**
   * Carga el último SVG guardado
   */
  const loadLastSVG = useCallback(() => {
    if (lastSVG && lastSVG.content) {
      console.log('✓ Cargando último SVG guardado:', lastSVG.metadata?.name);
      return lastSVG;
    }
    return null;
  }, [lastSVG]);

  /**
   * Obtiene el historial reciente
   */
  const getRecentSVGs = useCallback(() => {
    return recentSVGs || [];
  }, [recentSVGs]);

  /**
   * Elimina un SVG del historial
   */
  const deleteSVG = useCallback((id) => {
    setRecentSVGs(prev => (prev || []).filter(item => item.id !== id));

    if (lastSVG && lastSVG.id === id) {
      setLastSVG(null);
    }

    console.log('✓ SVG eliminado del historial');
  }, [setRecentSVGs, lastSVG, setLastSVG]);

  /**
   * Limpia todo el historial (mantiene configuración)
   */
  const clearHistory = useCallback(() => {
    setRecentSVGs([]);
    setLastSVG(null);
    console.log('✓ Historial limpiado');
  }, [setRecentSVGs, setLastSVG]);

  /**
   * Actualiza configuración del usuario
   * Guarda tanto en localStorage (persistente) como en sessionStorage (sesión actual)
   */
  const updateConfig = useCallback((newConfig) => {
    // Actualizar localStorage (persistente)
    setUserConfig(prev => ({ ...prev, ...newConfig }));

    // Actualizar sessionStorage (sesión actual)
    setSessionConfig(prev => ({ ...prev, ...newConfig }));

    console.log('✓ Configuración actualizada en localStorage y sessionStorage');
  }, [setUserConfig, setSessionConfig]);

  /**
   * Obtiene estadísticas de almacenamiento
   */
  const getStorageStats = useCallback(() => {
    const stats = {
      lastSVGSize: lastSVG ? JSON.stringify(lastSVG).length : 0,
      recentCount: (recentSVGs || []).length,
      totalSize: 0
    };

    try {
      for (let key in localStorage) {
        if (key.startsWith('pictoforge_')) {
          stats.totalSize += localStorage[key].length;
        }
      }
    } catch (error) {
      console.error('Error calculando estadísticas:', error);
    }

    stats.totalSizeKB = (stats.totalSize / 1024).toFixed(2);
    return stats;
  }, [lastSVG, recentSVGs]);

  /**
   * Exporta el historial completo como JSON
   */
  const exportHistory = useCallback(() => {
    const exportData = {
      lastSVG,
      recentSVGs,
      config: userConfig,
      exportDate: new Date().toISOString(),
      version: '1.0'
    };

    const blob = new Blob([JSON.stringify(exportData, null, 2)], {
      type: 'application/json'
    });

    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `pictoforge_backup_${Date.now()}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);

    console.log('✓ Historial exportado');
  }, [lastSVG, recentSVGs, userConfig]);

  /**
   * Importa historial desde JSON
   */
  const importHistory = useCallback((jsonData) => {
    try {
      const data = typeof jsonData === 'string' ? JSON.parse(jsonData) : jsonData;

      if (data.lastSVG) setLastSVG(data.lastSVG);
      if (data.recentSVGs) setRecentSVGs(data.recentSVGs);
      if (data.config) setUserConfig(data.config);

      console.log('✓ Historial importado exitosamente');
      return true;
    } catch (error) {
      console.error('✗ Error al importar historial:', error);
      return false;
    }
  }, [setLastSVG, setRecentSVGs, setUserConfig]);

  return {
    // Estado
    lastSVG,
    recentSVGs,
    userConfig,
    sessionConfig,

    // Métodos de SVG
    saveSVG,
    loadLastSVG,
    getRecentSVGs,
    deleteSVG,
    clearHistory,

    // Métodos de configuración
    updateConfig,

    // Utilidades
    getStorageStats,
    exportHistory,
    importHistory
  };
};

export default useSVGStorage;
