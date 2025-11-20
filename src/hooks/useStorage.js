import { useState, useEffect, useCallback } from 'react';
import { storageService } from '@/services/StorageService';

/**
 * useStorage
 *
 * Hook de React para interactuar con IndexedDB.
 * Proporciona métodos para guardar/cargar pictogramas, elementos canónicos,
 * blends y settings, con estado reactivo de loading y errores.
 *
 * Uso:
 * ```
 * const {
 *   savePictogram,
 *   getPictogram,
 *   pictograms,
 *   loading,
 *   error
 * } = useStorage();
 * ```
 */
export function useStorage() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [initialized, setInitialized] = useState(false);

  // Inicializar IndexedDB al montar el hook
  useEffect(() => {
    let mounted = true;

    async function initialize() {
      try {
        await storageService.init();
        if (mounted) {
          setInitialized(true);
        }
      } catch (err) {
        console.error('Failed to initialize storage:', err);
        if (mounted) {
          setError(err.message);
        }
      }
    }

    initialize();

    return () => {
      mounted = false;
    };
  }, []);

  // Wrapper para manejar loading y errores
  const withLoadingAndError = useCallback(async (fn) => {
    setLoading(true);
    setError(null);
    try {
      const result = await fn();
      return result;
    } catch (err) {
      console.error('Storage error:', err);
      setError(err.message);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  // ============================================
  // PICTOGRAMS
  // ============================================

  const savePictogram = useCallback(
    async (svg, auditStatus = 'pending') => {
      return withLoadingAndError(async () => {
        return await storageService.savePictogram(svg, auditStatus);
      });
    },
    [withLoadingAndError]
  );

  const getPictogram = useCallback(
    async (id) => {
      return withLoadingAndError(async () => {
        return await storageService.getPictogram(id);
      });
    },
    [withLoadingAndError]
  );

  const getAllPictograms = useCallback(
    async (limit = 100) => {
      return withLoadingAndError(async () => {
        return await storageService.getAllPictograms(limit);
      });
    },
    [withLoadingAndError]
  );

  const getPictogramsByStatus = useCallback(
    async (status) => {
      return withLoadingAndError(async () => {
        return await storageService.getPictogramsByStatus(status);
      });
    },
    [withLoadingAndError]
  );

  const updatePictogramStatus = useCallback(
    async (id, newStatus) => {
      return withLoadingAndError(async () => {
        return await storageService.updatePictogramStatus(id, newStatus);
      });
    },
    [withLoadingAndError]
  );

  const deletePictogram = useCallback(
    async (id) => {
      return withLoadingAndError(async () => {
        return await storageService.deletePictogram(id);
      });
    },
    [withLoadingAndError]
  );

  // ============================================
  // CANONICAL
  // ============================================

  const saveCanonical = useCallback(
    async (element) => {
      return withLoadingAndError(async () => {
        return await storageService.saveCanonical(element);
      });
    },
    [withLoadingAndError]
  );

  const getAllCanonical = useCallback(async () => {
    return withLoadingAndError(async () => {
      return await storageService.getAllCanonical();
    });
  }, [withLoadingAndError]);

  const getCanonicalByConcept = useCallback(
    async (concept) => {
      return withLoadingAndError(async () => {
        return await storageService.getCanonicalByConcept(concept);
      });
    },
    [withLoadingAndError]
  );

  const incrementCanonicalUsage = useCallback(
    async (id) => {
      return withLoadingAndError(async () => {
        return await storageService.incrementCanonicalUsage(id);
      });
    },
    [withLoadingAndError]
  );

  const getCanonical = useCallback(
    async (id) => {
      return withLoadingAndError(async () => {
        return await storageService.getCanonical(id);
      });
    },
    [withLoadingAndError]
  );

  const getCanonicalByType = useCallback(
    async (type) => {
      return withLoadingAndError(async () => {
        return await storageService.getCanonicalByType(type);
      });
    },
    [withLoadingAndError]
  );

  const getCanonicalByTag = useCallback(
    async (tag) => {
      return withLoadingAndError(async () => {
        return await storageService.getCanonicalByTag(tag);
      });
    },
    [withLoadingAndError]
  );

  const getMostUsedCanonical = useCallback(
    async (limit = 20) => {
      return withLoadingAndError(async () => {
        return await storageService.getMostUsedCanonical(limit);
      });
    },
    [withLoadingAndError]
  );

  const deleteCanonical = useCallback(
    async (id) => {
      return withLoadingAndError(async () => {
        return await storageService.deleteCanonical(id);
      });
    },
    [withLoadingAndError]
  );

  // ============================================
  // BLENDS - DEPRECATED (usar canonical con type='modifier')
  // ============================================

  const saveBlend = useCallback(
    async (blend) => {
      return withLoadingAndError(async () => {
        return await storageService.saveBlend(blend);
      });
    },
    [withLoadingAndError]
  );

  const getAllBlends = useCallback(async () => {
    return withLoadingAndError(async () => {
      return await storageService.getAllBlends();
    });
  }, [withLoadingAndError]);

  // ============================================
  // SETTINGS
  // ============================================

  const saveSetting = useCallback(
    async (key, value) => {
      return withLoadingAndError(async () => {
        return await storageService.saveSetting(key, value);
      });
    },
    [withLoadingAndError]
  );

  const getSetting = useCallback(
    async (key, defaultValue = null) => {
      return withLoadingAndError(async () => {
        return await storageService.getSetting(key, defaultValue);
      });
    },
    [withLoadingAndError]
  );

  const getAllSettings = useCallback(async () => {
    return withLoadingAndError(async () => {
      return await storageService.getAllSettings();
    });
  }, [withLoadingAndError]);

  // ============================================
  // STORAGE QUOTA
  // ============================================

  const getStorageQuota = useCallback(async () => {
    return withLoadingAndError(async () => {
      return await storageService.getStorageQuota();
    });
  }, [withLoadingAndError]);

  const requestPersistentStorage = useCallback(async () => {
    return withLoadingAndError(async () => {
      return await storageService.requestPersistentStorage();
    });
  }, [withLoadingAndError]);

  // ============================================
  // EXPORT/IMPORT
  // ============================================

  const exportWorkspace = useCallback(async () => {
    return withLoadingAndError(async () => {
      return await storageService.exportWorkspace();
    });
  }, [withLoadingAndError]);

  const importWorkspace = useCallback(
    async (data, merge = false) => {
      return withLoadingAndError(async () => {
        return await storageService.importWorkspace(data, merge);
      });
    },
    [withLoadingAndError]
  );

  const clearAllData = useCallback(async () => {
    return withLoadingAndError(async () => {
      return await storageService.clearAllData();
    });
  }, [withLoadingAndError]);

  return {
    // Estado
    loading,
    error,
    initialized,

    // Pictograms
    savePictogram,
    getPictogram,
    getAllPictograms,
    getPictogramsByStatus,
    updatePictogramStatus,
    deletePictogram,

    // Canonical
    saveCanonical,
    getCanonical,
    getAllCanonical,
    getCanonicalByConcept,
    getCanonicalByType,
    getCanonicalByTag,
    getMostUsedCanonical,
    incrementCanonicalUsage,
    deleteCanonical,

    // Blends (deprecated - usar canonical con type='modifier')
    saveBlend,
    getAllBlends,

    // Settings
    saveSetting,
    getSetting,
    getAllSettings,

    // Storage quota
    getStorageQuota,
    requestPersistentStorage,

    // Export/Import
    exportWorkspace,
    importWorkspace,
    clearAllData
  };
}

/**
 * useStorageQuota
 *
 * Hook especializado para monitorear la cuota de almacenamiento.
 * Se actualiza automáticamente y proporciona información formateada.
 *
 * Uso:
 * ```
 * const { quota, refresh } = useStorageQuota();
 * // quota: { usageMB: '1.25', quotaGB: '300', percentage: '0.0004', ... }
 * ```
 */
export function useStorageQuota() {
  const [quota, setQuota] = useState(null);
  const [loading, setLoading] = useState(true);

  const refresh = useCallback(async () => {
    setLoading(true);
    try {
      const quotaInfo = await storageService.getStorageQuota();
      setQuota(quotaInfo);
    } catch (error) {
      console.error('Error fetching storage quota:', error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    refresh();
  }, [refresh]);

  return { quota, loading, refresh };
}
