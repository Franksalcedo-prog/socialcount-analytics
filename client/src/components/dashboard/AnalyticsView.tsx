import React, { useState, useEffect } from 'react';
import { DashboardMetrics } from '../../types';
import { apiService } from '../../services/api';
import { useFilters } from '../../context/FilterContext';
import { EvolutionChart } from './EvolutionChart';
import { PlatformComparison } from './PlatformComparison';
import { WeekdayActivity } from './WeekdayActivity';

export const AnalyticsView: React.FC = () => {
  const { platform, startDate, endDate, refreshKey } = useFilters();
  const [metrics, setMetrics] = useState<DashboardMetrics | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchAnalytics = async () => {
      setIsLoading(true);
      try {
        const data = await apiService.getDashboardMetrics({
          platform,
          startDate: startDate || undefined,
          endDate: endDate || undefined,
        });
        setMetrics(data);
      } catch (e) {
        console.error('Error al cargar analítica:', e);
      } finally {
        setIsLoading(false);
      }
    };

    fetchAnalytics();
  }, [platform, startDate, endDate, refreshKey]);

  if (isLoading || !metrics) {
    return (
      <div className="space-y-6">
        <div className="h-64 bg-slate-100 rounded-2xl animate-pulse" />
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="h-80 bg-slate-100 rounded-2xl animate-pulse" />
          <div className="h-80 bg-slate-100 rounded-2xl animate-pulse" />
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header Summary */}
      <div className="bg-white p-5 rounded-2xl border border-border-ui shadow-2xs flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-base font-bold text-slate-900 tracking-tight">
            Análisis Profundo de Métricas e Interacción
          </h2>
          <p className="text-xs text-text-muted mt-0.5">
            Comportamiento temporal, tendencias por plataforma y patrones de respuesta
          </p>
        </div>

        <div className="flex items-center gap-3 text-xs">
          <span className="p-2 rounded-lg bg-emerald-50 text-emerald-700 font-semibold border border-emerald-100">
            Tendencia: {metrics.periodComparison.percentageChange > 0 ? '+' : ''}{metrics.periodComparison.percentageChange}% vs período anterior
          </span>
        </div>
      </div>

      {/* Main Temporal Evolution */}
      <EvolutionChart data={metrics.evolutionChart} isLoading={isLoading} />

      {/* Grid: Platform Comparison & Weekday Heatmap */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <PlatformComparison
          distribution={metrics.platformDistribution}
          totalComments={metrics.totalComments}
        />
        <WeekdayActivity data={metrics.weekdayActivity} />
      </div>
    </div>
  );
};
