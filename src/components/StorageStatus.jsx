import { useState, useEffect } from 'react';
import { useStorageQuota } from '@/hooks/useStorage';
import { useI18n } from '@/hooks/useI18n';
import { Button } from '@/components/ui/button';

/**
 * StorageStatus
 *
 * Widget que muestra información sobre el uso de IndexedDB y
 * permite solicitar almacenamiento persistente.
 *
 * Muestra:
 * - Espacio usado (MB)
 * - Espacio disponible (GB)
 * - Porcentaje de uso
 * - Estado de persistencia
 * - Botón para solicitar almacenamiento persistente
 */
export function StorageStatus() {
  const { quota, loading, refresh } = useStorageQuota();
  const { t } = useI18n();
  const [requesting, setRequesting] = useState(false);

  useEffect(() => {
    // Refrescar cada 30 segundos
    const interval = setInterval(() => {
      refresh();
    }, 30000);

    return () => clearInterval(interval);
  }, [refresh]);

  const handleRequestPersistence = async () => {
    setRequesting(true);
    const storage = t('storage') || {};
    try {
      const granted = await navigator.storage.persist();
      if (granted) {
        alert(storage.persistence_granted || 'Persistent storage granted');
      } else {
        alert(storage.persistence_denied || 'Persistent storage denied');
      }
      refresh(); // Actualizar estado
    } catch (error) {
      console.error('Error requesting persistence:', error);
      alert(storage.persistence_error || 'Error requesting persistent storage');
    } finally {
      setRequesting(false);
    }
  };

  if (loading || !quota) {
    return (
      <div className="storage-status loading">
        <p>{t('storage')?.loading || 'Loading...'}</p>
      </div>
    );
  }

  if (!quota.supported) {
    return (
      <div className="storage-status unsupported">
        <p>{t('storage')?.not_supported || 'Storage API not supported'}</p>
      </div>
    );
  }

  const storage = t('storage') || {};

  return (
    <div className="storage-status">
      <h3>{storage.title || 'Storage Information'}</h3>

      <div className="storage-info">
        <div className="storage-metric">
          <span className="label">{storage.used || 'Used'}:</span>
          <span className="value">{quota.usageMB} MB</span>
        </div>

        <div className="storage-metric">
          <span className="label">{storage.available || 'Available'}:</span>
          <span className="value">{quota.quotaGB} GB</span>
        </div>

        <div className="storage-metric">
          <span className="label">{storage.percentage || 'Usage'}:</span>
          <span className="value">{quota.percentage}%</span>
        </div>

        <div className="storage-progress">
          <div
            className="storage-progress-bar"
            style={{ width: `${Math.min(parseFloat(quota.percentage), 100)}%` }}
          />
        </div>

        {quota.usageDetails && (
          <div className="storage-details">
            <details>
              <summary>{storage.details || 'Details'}</summary>
              <ul>
                {Object.entries(quota.usageDetails).map(([key, value]) => (
                  <li key={key}>
                    <span className="label">{key}:</span>
                    <span className="value">
                      {(value / 1024 / 1024).toFixed(2)} MB
                    </span>
                  </li>
                ))}
              </ul>
            </details>
          </div>
        )}
      </div>

      <div className="storage-persistence">
        <div className="persistence-status">
          <span className="label">{storage.persistent || 'Persistent storage'}:</span>
          <span className={`value ${quota.persisted ? 'yes' : 'no'}`}>
            {quota.persisted ? (storage.yes || 'Yes') : (storage.no || 'No')}
          </span>
        </div>

        {!quota.persisted && (
          <Button
            onClick={handleRequestPersistence}
            disabled={requesting}
            size="sm"
            variant="outline"
          >
            {requesting
              ? (storage.requesting || 'Requesting...')
              : (storage.request_persistence || 'Request persistent storage')}
          </Button>
        )}

        <p className="persistence-help">{storage.persistence_help || ''}</p>
      </div>
    </div>
  );
}
