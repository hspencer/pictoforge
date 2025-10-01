import React from 'react';
import { Activity, Zap, Database, Clock } from 'lucide-react';
import { useI18n } from '../hooks/useI18n';

/**
 * Componente para mostrar métricas de rendimiento
 */
const PerformanceMetrics = ({ metrics, visible = false }) => {
  const { t } = useI18n();

  if (!visible || !metrics) return null;

  const getComplexityColor = (level) => {
    switch (level) {
      case 'low': return 'text-green-600';
      case 'medium': return 'text-yellow-600';
      case 'high': return 'text-red-600';
      default: return 'text-gray-600';
    }
  };

  const getComplexityIcon = (level) => {
    switch (level) {
      case 'low': return <Zap size={14} className="text-green-600" />;
      case 'medium': return <Activity size={14} className="text-yellow-600" />;
      case 'high': return <Activity size={14} className="text-red-600" />;
      default: return <Activity size={14} className="text-gray-600" />;
    }
  };

  return (
    <div className="absolute top-2 right-2 bg-white/90 backdrop-blur-sm border rounded-lg p-3 shadow-lg text-xs z-20">
      <div className="font-medium text-gray-700 mb-2 flex items-center gap-1">
        <Activity size={12} />
        {t('performance.title', 'Performance')}
      </div>
      
      <div className="space-y-2">
        {/* Complejidad */}
        <div className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-1">
            {getComplexityIcon(metrics.complexityLevel)}
            <span className="text-gray-600">
              {t('performance.complexity', 'Complexity')}:
            </span>
          </div>
          <span className={`font-medium ${getComplexityColor(metrics.complexityLevel)}`}>
            {t(`performance.level.${metrics.complexityLevel}`, metrics.complexityLevel)}
          </span>
        </div>

        {/* Número de elementos */}
        <div className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-1">
            <Database size={12} className="text-blue-600" />
            <span className="text-gray-600">
              {t('performance.elements', 'Elements')}:
            </span>
          </div>
          <span className="font-medium text-blue-600">
            {metrics.elementCount}
          </span>
        </div>

        {/* Tiempo de renderizado */}
        <div className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-1">
            <Clock size={12} className="text-purple-600" />
            <span className="text-gray-600">
              {t('performance.renderTime', 'Render')}:
            </span>
          </div>
          <span className="font-medium text-purple-600">
            {metrics.renderTime.toFixed(1)}ms
          </span>
        </div>

        {/* Uso de memoria */}
        <div className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-1">
            <Database size={12} className="text-orange-600" />
            <span className="text-gray-600">
              {t('performance.memory', 'Memory')}:
            </span>
          </div>
          <span className="font-medium text-orange-600">
            {metrics.memoryUsage}
          </span>
        </div>

        {/* Estado de optimización */}
        {metrics.isOptimized && (
          <div className="flex items-center gap-1 text-green-600 pt-1 border-t">
            <Zap size={12} />
            <span className="text-xs">
              {t('performance.optimized', 'Optimized')}
            </span>
          </div>
        )}
      </div>
    </div>
  );
};

export default PerformanceMetrics;
