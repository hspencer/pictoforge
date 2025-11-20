/**
 * StorageService
 *
 * Servicio de persistencia para PictoForge usando IndexedDB.
 * Arquitectura basada en SVGs self-contained como fuente de verdad.
 *
 * Stores:
 * - pictograms: Trabajo activo, generaciones recientes
 * - canonical: Vocabulario canónico verificado (unificado: elementos + blends + operadores)
 * - settings: Configuración local de la app
 *
 * Capacidad: ~50MB-300GB+ según browser
 * Con 10,000 pictogramas @ 7.5KB = ~77MB (totalmente viable)
 */

import { SVGMetadataExtractor } from './SVGMetadataExtractor';

const DB_NAME = 'PictoForgeDB';
const DB_VERSION = 2; // Incrementado para migración canonical unificado

export class StorageService {
  constructor() {
    this.db = null;
    this.initPromise = null;
  }

  /**
   * Inicializa la base de datos IndexedDB
   * @returns {Promise<IDBDatabase>}
   */
  async init() {
    // Si ya se está inicializando, esperar a que termine
    if (this.initPromise) {
      return this.initPromise;
    }

    // Si ya está inicializado, retornar
    if (this.db) {
      return this.db;
    }

    this.initPromise = new Promise((resolve, reject) => {
      const request = indexedDB.open(DB_NAME, DB_VERSION);

      request.onerror = () => {
        console.error('IndexedDB error:', request.error);
        reject(request.error);
      };

      request.onsuccess = () => {
        this.db = request.result;
        console.log('✓ IndexedDB initialized');
        resolve(this.db);
      };

      request.onupgradeneeded = (event) => {
        const db = event.target.result;
        const oldVersion = event.oldVersion;
        console.log(`🔄 IndexedDB upgrade needed (v${oldVersion} → v${DB_VERSION})...`);

        // Store 1: pictograms (trabajo activo)
        if (!db.objectStoreNames.contains('pictograms')) {
          const pictogramsStore = db.createObjectStore('pictograms', {
            keyPath: 'id'
          });
          pictogramsStore.createIndex('timestamp', 'timestamp', { unique: false });
          pictogramsStore.createIndex('audit_status', 'audit_status', { unique: false });
          pictogramsStore.createIndex('utterance', 'utterance', { unique: false });
          pictogramsStore.createIndex('domain', 'domain', { unique: false });
          console.log('✓ Created store: pictograms');
        }

        // Store 2: canonical (vocabulario canónico unificado)
        if (!db.objectStoreNames.contains('canonical')) {
          const canonicalStore = db.createObjectStore('canonical', {
            keyPath: 'id'
          });
          canonicalStore.createIndex('concept', 'concept', { unique: false });
          canonicalStore.createIndex('type', 'type', { unique: false });
          canonicalStore.createIndex('verified', 'verified', { unique: false });
          canonicalStore.createIndex('usage_count', 'usage_count', { unique: false });
          canonicalStore.createIndex('tags', 'tags', { unique: false, multiEntry: true });
          console.log('✓ Created store: canonical (unified)');
        } else if (oldVersion < 2) {
          // Migración v1 → v2: Agregar índice 'type' y 'tags'
          const transaction = event.target.transaction;
          const canonicalStore = transaction.objectStore('canonical');

          if (!canonicalStore.indexNames.contains('type')) {
            canonicalStore.createIndex('type', 'type', { unique: false });
            console.log('✓ Added index: canonical.type');
          }

          if (!canonicalStore.indexNames.contains('tags')) {
            canonicalStore.createIndex('tags', 'tags', { unique: false, multiEntry: true });
            console.log('✓ Added index: canonical.tags');
          }

          // Eliminar índice 'role' obsoleto (ahora es un campo, no índice)
          if (canonicalStore.indexNames.contains('role')) {
            canonicalStore.deleteIndex('role');
            console.log('✓ Removed index: canonical.role (now a field)');
          }
        }

        // Store 3: blends - DEPRECATED en v2, migrar a canonical
        if (db.objectStoreNames.contains('blends') && oldVersion < 2) {
          // Migrar datos de blends a canonical
          console.log('🔄 Migrating blends → canonical...');
          const transaction = event.target.transaction;
          const blendsStore = transaction.objectStore('blends');
          const canonicalStore = transaction.objectStore('canonical');

          const blendsRequest = blendsStore.getAll();
          blendsRequest.onsuccess = () => {
            const blends = blendsRequest.result;
            blends.forEach((blend) => {
              // Convertir blend a formato canonical
              const canonicalEntry = {
                id: blend.id,
                concept: blend.concept,
                type: 'modifier', // Los blends suelen ser modificadores o compuestos
                svg: blend.svg,
                formula: blend.formula || null,
                i18n: {
                  en: blend.description || blend.concept
                },
                verified: true,
                usage_count: 0,
                tags: blend.concept.split('+'), // 'safety+house' → ['safety', 'house']
                role: null,
                timestamp: blend.timestamp || Date.now(),
                source: 'migrated_blend'
              };
              canonicalStore.put(canonicalEntry);
            });
            console.log(`✓ Migrated ${blends.length} blends to canonical`);
          };

          // Eliminar store de blends
          db.deleteObjectStore('blends');
          console.log('✓ Removed deprecated store: blends');
        }

        // Store 3 (4 en v1): settings (configuración local)
        if (!db.objectStoreNames.contains('settings')) {
          db.createObjectStore('settings', {
            keyPath: 'key'
          });
          console.log('✓ Created store: settings');
        }
      };
    });

    return this.initPromise;
  }

  /**
   * Cierra la conexión a la base de datos
   */
  close() {
    if (this.db) {
      this.db.close();
      this.db = null;
      this.initPromise = null;
    }
  }

  // ============================================
  // PICTOGRAMS (trabajo activo)
  // ============================================

  /**
   * Guarda un pictograma completo
   * @param {string} svg - SVG completo (self-contained)
   * @param {string} auditStatus - 'pending' | 'approved' | 'rejected'
   * @returns {Promise<string>} ID del pictograma guardado
   */
  async savePictogram(svg, auditStatus = 'pending') {
    await this.init();

    const id = crypto.randomUUID();
    const metadata = SVGMetadataExtractor.parse(svg);

    if (!metadata) {
      throw new Error('Could not extract metadata from SVG');
    }

    const record = {
      id,
      svg,
      timestamp: Date.now(),
      audit_status: auditStatus,

      // Campos extraídos para búsqueda (no son fuente de verdad)
      utterance: metadata.utterance || '',
      domain: metadata.domain || '',
      intent: metadata.intent || '',
      language: metadata.language || '',
      concepts: metadata.concepts || []
    };

    const tx = this.db.transaction('pictograms', 'readwrite');
    const store = tx.objectStore('pictograms');

    return new Promise((resolve, reject) => {
      const request = store.add(record);
      request.onsuccess = () => {
        console.log('✓ Pictogram saved:', id);
        resolve(id);
      };
      request.onerror = () => reject(request.error);
    });
  }

  /**
   * Obtiene un pictograma por ID
   * @param {string} id
   * @returns {Promise<Object|null>}
   */
  async getPictogram(id) {
    await this.init();

    const tx = this.db.transaction('pictograms', 'readonly');
    const store = tx.objectStore('pictograms');

    return new Promise((resolve, reject) => {
      const request = store.get(id);
      request.onsuccess = () => resolve(request.result || null);
      request.onerror = () => reject(request.error);
    });
  }

  /**
   * Obtiene todos los pictogramas ordenados por timestamp
   * @param {number} limit - Límite de resultados (default: 100)
   * @returns {Promise<Array>}
   */
  async getAllPictograms(limit = 100) {
    await this.init();

    const tx = this.db.transaction('pictograms', 'readonly');
    const store = tx.objectStore('pictograms');
    const index = store.index('timestamp');

    return new Promise((resolve, reject) => {
      const request = index.openCursor(null, 'prev'); // Más recientes primero
      const results = [];

      request.onsuccess = (event) => {
        const cursor = event.target.result;
        if (cursor && results.length < limit) {
          results.push(cursor.value);
          cursor.continue();
        } else {
          resolve(results);
        }
      };
      request.onerror = () => reject(request.error);
    });
  }

  /**
   * Busca pictogramas por status de auditoría
   * @param {string} status - 'pending' | 'approved' | 'rejected'
   * @returns {Promise<Array>}
   */
  async getPictogramsByStatus(status) {
    await this.init();

    const tx = this.db.transaction('pictograms', 'readonly');
    const store = tx.objectStore('pictograms');
    const index = store.index('audit_status');

    return new Promise((resolve, reject) => {
      const request = index.getAll(status);
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });
  }

  /**
   * Actualiza el estado de auditoría de un pictograma
   * @param {string} id
   * @param {string} newStatus
   * @returns {Promise<void>}
   */
  async updatePictogramStatus(id, newStatus) {
    await this.init();

    const pictogram = await this.getPictogram(id);
    if (!pictogram) {
      throw new Error(`Pictogram ${id} not found`);
    }

    pictogram.audit_status = newStatus;

    const tx = this.db.transaction('pictograms', 'readwrite');
    const store = tx.objectStore('pictograms');

    return new Promise((resolve, reject) => {
      const request = store.put(pictogram);
      request.onsuccess = () => {
        console.log('✓ Pictogram status updated:', id, '→', newStatus);
        resolve();
      };
      request.onerror = () => reject(request.error);
    });
  }

  /**
   * Elimina un pictograma
   * @param {string} id
   * @returns {Promise<void>}
   */
  async deletePictogram(id) {
    await this.init();

    const tx = this.db.transaction('pictograms', 'readwrite');
    const store = tx.objectStore('pictograms');

    return new Promise((resolve, reject) => {
      const request = store.delete(id);
      request.onsuccess = () => {
        console.log('✓ Pictogram deleted:', id);
        resolve();
      };
      request.onerror = () => reject(request.error);
    });
  }

  // ============================================
  // CANONICAL (vocabulario canónico unificado)
  // ============================================

  /**
   * Guarda un elemento en el vocabulario canónico
   * @param {Object} entry - Entrada de vocabulario
   * @param {string} entry.id - ID único
   * @param {string} entry.concept - Concepto (puede ser compuesto: 'safety+house')
   * @param {string} entry.type - 'object' | 'action' | 'modifier' | 'operator'
   * @param {string} entry.svg - SVG del elemento
   * @param {string|null} entry.formula - Fórmula si es compuesto (ej: 'house + lock_inside')
   * @param {Object} entry.i18n - Traducciones { en: '...', es: '...', mi: '...', arn: '...' }
   * @param {boolean} entry.verified - Si está verificado
   * @param {Array<string>} entry.tags - Tags para búsqueda
   * @param {string|null} entry.role - Rol semántico (opcional)
   * @param {string} entry.source - Origen: 'pictonet' | 'arasaac' | 'manual' | 'extracted'
   * @returns {Promise<void>}
   */
  async saveCanonical(entry) {
    await this.init();

    const record = {
      id: entry.id,
      concept: entry.concept,
      type: entry.type || 'object',
      svg: entry.svg,
      formula: entry.formula || null,
      i18n: entry.i18n || { en: entry.concept },
      verified: entry.verified !== false,
      usage_count: entry.usage_count || 0,
      tags: entry.tags || [entry.concept],
      role: entry.role || null,
      timestamp: entry.timestamp || Date.now(),
      source: entry.source || 'manual'
    };

    const tx = this.db.transaction('canonical', 'readwrite');
    const store = tx.objectStore('canonical');

    return new Promise((resolve, reject) => {
      const request = store.put(record);
      request.onsuccess = () => {
        console.log('✓ Canonical entry saved:', entry.id, `(${entry.type})`);
        resolve();
      };
      request.onerror = () => reject(request.error);
    });
  }

  /**
   * Obtiene un elemento canónico por ID
   * @param {string} id
   * @returns {Promise<Object|null>}
   */
  async getCanonical(id) {
    await this.init();

    const tx = this.db.transaction('canonical', 'readonly');
    const store = tx.objectStore('canonical');

    return new Promise((resolve, reject) => {
      const request = store.get(id);
      request.onsuccess = () => resolve(request.result || null);
      request.onerror = () => reject(request.error);
    });
  }

  /**
   * Obtiene todos los elementos canónicos
   * @returns {Promise<Array>}
   */
  async getAllCanonical() {
    await this.init();

    const tx = this.db.transaction('canonical', 'readonly');
    const store = tx.objectStore('canonical');

    return new Promise((resolve, reject) => {
      const request = store.getAll();
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });
  }

  /**
   * Busca elementos canónicos por concepto
   * @param {string} concept
   * @returns {Promise<Array>}
   */
  async getCanonicalByConcept(concept) {
    await this.init();

    const tx = this.db.transaction('canonical', 'readonly');
    const store = tx.objectStore('canonical');
    const index = store.index('concept');

    return new Promise((resolve, reject) => {
      const request = index.getAll(concept);
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });
  }

  /**
   * Busca elementos canónicos por tipo
   * @param {string} type - 'object' | 'action' | 'modifier' | 'operator'
   * @returns {Promise<Array>}
   */
  async getCanonicalByType(type) {
    await this.init();

    const tx = this.db.transaction('canonical', 'readonly');
    const store = tx.objectStore('canonical');
    const index = store.index('type');

    return new Promise((resolve, reject) => {
      const request = index.getAll(type);
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });
  }

  /**
   * Busca elementos canónicos por tag
   * @param {string} tag
   * @returns {Promise<Array>}
   */
  async getCanonicalByTag(tag) {
    await this.init();

    const tx = this.db.transaction('canonical', 'readonly');
    const store = tx.objectStore('canonical');
    const index = store.index('tags');

    return new Promise((resolve, reject) => {
      const request = index.getAll(tag);
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });
  }

  /**
   * Obtiene los elementos más usados
   * @param {number} limit - Límite de resultados
   * @returns {Promise<Array>}
   */
  async getMostUsedCanonical(limit = 20) {
    await this.init();

    const tx = this.db.transaction('canonical', 'readonly');
    const store = tx.objectStore('canonical');
    const index = store.index('usage_count');

    return new Promise((resolve, reject) => {
      const request = index.openCursor(null, 'prev'); // Descendente
      const results = [];

      request.onsuccess = (event) => {
        const cursor = event.target.result;
        if (cursor && results.length < limit) {
          results.push(cursor.value);
          cursor.continue();
        } else {
          resolve(results);
        }
      };
      request.onerror = () => reject(request.error);
    });
  }

  /**
   * Incrementa el contador de uso de un elemento canónico
   * @param {string} id
   * @returns {Promise<void>}
   */
  async incrementCanonicalUsage(id) {
    await this.init();

    const tx = this.db.transaction('canonical', 'readwrite');
    const store = tx.objectStore('canonical');

    return new Promise((resolve, reject) => {
      const getRequest = store.get(id);
      getRequest.onsuccess = () => {
        const record = getRequest.result;
        if (record) {
          record.usage_count = (record.usage_count || 0) + 1;
          const putRequest = store.put(record);
          putRequest.onsuccess = () => resolve();
          putRequest.onerror = () => reject(putRequest.error);
        } else {
          resolve(); // No existe, no hacer nada
        }
      };
      getRequest.onerror = () => reject(getRequest.error);
    });
  }

  /**
   * Elimina un elemento canónico
   * @param {string} id
   * @returns {Promise<void>}
   */
  async deleteCanonical(id) {
    await this.init();

    const tx = this.db.transaction('canonical', 'readwrite');
    const store = tx.objectStore('canonical');

    return new Promise((resolve, reject) => {
      const request = store.delete(id);
      request.onsuccess = () => {
        console.log('✓ Canonical entry deleted:', id);
        resolve();
      };
      request.onerror = () => reject(request.error);
    });
  }

  // ============================================
  // BLENDS - DEPRECATED (ahora parte de canonical)
  // Mantenidos por compatibilidad, redirigen a canonical
  // ============================================

  /**
   * @deprecated Usar saveCanonical con type='modifier'
   * Guarda un blend como entrada canonical
   */
  async saveBlend(blend) {
    console.warn('saveBlend is deprecated, use saveCanonical with type="modifier"');

    return this.saveCanonical({
      id: blend.id,
      concept: blend.concept,
      type: 'modifier',
      svg: blend.svg,
      formula: blend.formula || null,
      i18n: { en: blend.description || blend.concept },
      verified: true,
      tags: blend.concept.split('+'),
      source: 'blend_compat'
    });
  }

  /**
   * @deprecated Usar getCanonicalByType('modifier')
   * Obtiene todos los blends (ahora elementos canonical type='modifier')
   */
  async getAllBlends() {
    console.warn('getAllBlends is deprecated, use getCanonicalByType("modifier")');
    return this.getCanonicalByType('modifier');
  }

  // ============================================
  // SETTINGS (configuración local)
  // ============================================

  /**
   * Guarda un setting
   * @param {string} key
   * @param {*} value
   * @returns {Promise<void>}
   */
  async saveSetting(key, value) {
    await this.init();

    const tx = this.db.transaction('settings', 'readwrite');
    const store = tx.objectStore('settings');

    return new Promise((resolve, reject) => {
      const request = store.put({ key, value });
      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    });
  }

  /**
   * Obtiene un setting
   * @param {string} key
   * @param {*} defaultValue - Valor por defecto si no existe
   * @returns {Promise<*>}
   */
  async getSetting(key, defaultValue = null) {
    await this.init();

    const tx = this.db.transaction('settings', 'readonly');
    const store = tx.objectStore('settings');

    return new Promise((resolve, reject) => {
      const request = store.get(key);
      request.onsuccess = () => {
        const result = request.result;
        resolve(result ? result.value : defaultValue);
      };
      request.onerror = () => reject(request.error);
    });
  }

  /**
   * Obtiene todos los settings
   * @returns {Promise<Object>} Objeto con key-value pairs
   */
  async getAllSettings() {
    await this.init();

    const tx = this.db.transaction('settings', 'readonly');
    const store = tx.objectStore('settings');

    return new Promise((resolve, reject) => {
      const request = store.getAll();
      request.onsuccess = () => {
        const settings = {};
        request.result.forEach((item) => {
          settings[item.key] = item.value;
        });
        resolve(settings);
      };
      request.onerror = () => reject(request.error);
    });
  }

  // ============================================
  // STORAGE QUOTA (información de espacio)
  // ============================================

  /**
   * Obtiene información de la cuota de almacenamiento
   * @returns {Promise<Object>}
   */
  async getStorageQuota() {
    if (!navigator.storage || !navigator.storage.estimate) {
      return {
        supported: false,
        message: 'Storage API not supported'
      };
    }

    const estimate = await navigator.storage.estimate();
    const persisted = await navigator.storage.persisted();

    return {
      supported: true,
      usage: estimate.usage,
      quota: estimate.quota,
      percentage: ((estimate.usage / estimate.quota) * 100).toFixed(2),
      usageMB: (estimate.usage / 1024 / 1024).toFixed(2),
      quotaGB: (estimate.quota / 1024 / 1024 / 1024).toFixed(2),
      persisted: persisted,
      usageDetails: estimate.usageDetails || {}
    };
  }

  /**
   * Solicita almacenamiento persistente
   * @returns {Promise<boolean>}
   */
  async requestPersistentStorage() {
    if (!navigator.storage || !navigator.storage.persist) {
      return false;
    }

    try {
      const persisted = await navigator.storage.persist();
      if (persisted) {
        console.log('✓ Persistent storage granted');
        await this.saveSetting('persistent_storage_requested', true);
      } else {
        console.warn('⚠️ Persistent storage denied');
      }
      return persisted;
    } catch (error) {
      console.error('Error requesting persistent storage:', error);
      return false;
    }
  }

  // ============================================
  // EXPORT/IMPORT (backup)
  // ============================================

  /**
   * Exporta todo el workspace a JSON
   * @returns {Promise<Object>}
   */
  async exportWorkspace() {
    await this.init();

    const [pictograms, canonical, settings] = await Promise.all([
      this.getAllPictograms(10000), // Todos
      this.getAllCanonical(),
      this.getAllSettings()
    ]);

    return {
      version: DB_VERSION,
      exported_at: new Date().toISOString(),
      pictograms,
      canonical, // Incluye elementos, blends, operadores, etc. (unificado)
      settings
    };
  }

  /**
   * Importa un workspace desde JSON
   * @param {Object} data - Workspace exportado
   * @param {boolean} merge - Si true, hace merge. Si false, reemplaza todo
   * @returns {Promise<Object>} Resumen de la importación
   */
  async importWorkspace(data, merge = false) {
    await this.init();

    if (!merge) {
      // Limpiar todo antes de importar
      await this.clearAllData();
    }

    const stats = {
      pictograms: 0,
      canonical: 0,
      blends_migrated: 0, // Blends antiguos migrados a canonical
      settings: 0,
      errors: []
    };

    // Importar pictograms
    if (data.pictograms) {
      for (const item of data.pictograms) {
        try {
          const tx = this.db.transaction('pictograms', 'readwrite');
          const store = tx.objectStore('pictograms');
          await new Promise((resolve, reject) => {
            const request = store.put(item);
            request.onsuccess = () => resolve();
            request.onerror = () => reject(request.error);
          });
          stats.pictograms++;
        } catch (error) {
          stats.errors.push(`Pictogram ${item.id}: ${error.message}`);
        }
      }
    }

    // Importar canonical
    if (data.canonical) {
      for (const item of data.canonical) {
        try {
          await this.saveCanonical(item);
          stats.canonical++;
        } catch (error) {
          stats.errors.push(`Canonical ${item.id}: ${error.message}`);
        }
      }
    }

    // Importar blends (formato antiguo, migrar a canonical)
    if (data.blends) {
      console.log(`🔄 Migrating ${data.blends.length} legacy blends to canonical...`);
      for (const item of data.blends) {
        try {
          // Usar el método deprecated que hace la conversión
          await this.saveBlend(item);
          stats.blends_migrated++;
        } catch (error) {
          stats.errors.push(`Blend ${item.id}: ${error.message}`);
        }
      }
    }

    // Importar settings
    if (data.settings) {
      for (const [key, value] of Object.entries(data.settings)) {
        try {
          await this.saveSetting(key, value);
          stats.settings++;
        } catch (error) {
          stats.errors.push(`Setting ${key}: ${error.message}`);
        }
      }
    }

    console.log('✓ Workspace imported:', stats);
    return stats;
  }

  /**
   * Limpia todos los datos (¡CUIDADO!)
   * @returns {Promise<void>}
   */
  async clearAllData() {
    await this.init();

    // Solo stores que existen en v2
    const stores = ['pictograms', 'canonical', 'settings'];

    for (const storeName of stores) {
      // Verificar que el store existe antes de intentar limpiarlo
      if (this.db.objectStoreNames.contains(storeName)) {
        const tx = this.db.transaction(storeName, 'readwrite');
        const store = tx.objectStore(storeName);
        await new Promise((resolve, reject) => {
          const request = store.clear();
          request.onsuccess = () => resolve();
          request.onerror = () => reject(request.error);
        });
      }
    }

    console.log('✓ All data cleared');
  }
}

// Singleton instance
export const storageService = new StorageService();
