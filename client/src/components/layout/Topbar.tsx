import React from 'react';
import {
  Menu,
  RefreshCw,
  Calendar,
  Layers,
  Sparkles,
} from 'lucide-react';
import { useFilters } from '../../context/FilterContext';
import { useSync } from '../../context/SyncContext';
import { Platform, DateRangePreset } from '../../types';
import { Button } from '../ui/Button';

interface TopbarProps {
  sectionTitle: string;
  sectionSubtitle?: string;
  onOpenMobileMenu: () => void;
  lastSyncAt: string | null;
}

export const Topbar: React.FC<TopbarProps> = ({
  sectionTitle,
  sectionSubtitle,
  onOpenMobileMenu,
  lastSyncAt,
}) => {
  const { platform, setPlatform, preset, setPreset } = useFilters();
  const { isSyncing, triggerSync } = useSync();

  const platformOptions: Array<{ id: Platform; label: string }> = [
    { id: 'ALL', label: 'Todas' },
    { id: 'FACEBOOK', label: 'Facebook' },
    { id: 'INSTAGRAM', label: 'Instagram' },
  ];

  const presetOptions: Array<{ id: DateRangePreset; label: string }> = [
    { id: 'today', label: 'Hoy' },
    { id: 'last7days', label: 'Últimos 7 días' },
    { id: 'last30days', label: 'Últimos 30 días' },
    { id: 'thisMonth', label: 'Este mes' },
    { id: 'allTime', label: 'Todo el historial' },
  ];

  const formatLastSync = (timestamp: string | null) => {
    if (!timestamp) return 'Sin sincronizaciones previas';
    try {
      const date = new Date(timestamp);
      return `Última sincr.: ${date.toLocaleTimeString('es-ES', {
        hour: '2-digit',
        minute: '2-digit',
      })}`;
    } catch {
      return 'Sincronizado recientemente';
    }
  };

  return (
    <header className="sticky top-0 z-30 bg-surface/95 backdrop-blur-md border-b border-border-ui px-4 sm:px-6 lg:px-8 py-3.5">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        {/* Left: Mobile Toggle & Page Title */}
        <div className="flex items-center gap-3">
          <button
            onClick={onOpenMobileMenu}
            className="lg:hidden p-2 text-slate-500 hover:text-slate-800 hover:bg-slate-100 rounded-lg transition-colors -ml-1"
            aria-label="Abrir menú de navegación"
          >
            <Menu className="w-5 h-5" />
          </button>

          <div>
            <h1 className="text-lg font-bold text-slate-900 tracking-tight leading-tight flex items-center gap-2">
              <span>{sectionTitle}</span>
            </h1>
            {sectionSubtitle && (
              <p className="text-xs text-text-muted mt-0.5">{sectionSubtitle}</p>
            )}
          </div>
        </div>

        {/* Right: Platform Filter, Date Range Selector & Sync Button */}
        <div className="flex flex-wrap items-center gap-2.5">
          {/* Platform Segmented Switcher */}
          <div className="inline-flex p-1 bg-slate-100/90 rounded-lg border border-slate-200/80">
            {platformOptions.map((opt) => {
              const active = platform === opt.id;
              return (
                <button
                  key={opt.id}
                  onClick={() => setPlatform(opt.id)}
                  className={`px-2.5 py-1 text-xs font-medium rounded-md transition-all ${
                    active
                      ? 'bg-white text-slate-900 shadow-2xs font-semibold'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  {opt.id === 'FACEBOOK' && (
                    <span className="inline-block w-1.5 h-1.5 rounded-full bg-facebook mr-1.5 align-middle" />
                  )}
                  {opt.id === 'INSTAGRAM' && (
                    <span className="inline-block w-1.5 h-1.5 rounded-full bg-instagram-pink mr-1.5 align-middle" />
                  )}
                  {opt.id === 'ALL' && (
                    <Layers className="inline-block w-3 h-3 mr-1 text-slate-400" />
                  )}
                  {opt.label}
                </button>
              );
            })}
          </div>

          {/* Date Range Selector */}
          <div className="relative inline-flex items-center">
            <span className="absolute left-2.5 text-slate-400 pointer-events-none">
              <Calendar className="w-3.5 h-3.5" />
            </span>
            <select
              value={preset}
              onChange={(e) => setPreset(e.target.value as DateRangePreset)}
              aria-label="Seleccionar rango de fechas"
              className="pl-8 pr-7 py-1.5 text-xs font-medium text-slate-700 bg-white border border-slate-300 rounded-lg shadow-2xs focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500 cursor-pointer appearance-none"
            >
              {presetOptions.map((opt) => (
                <option key={opt.id} value={opt.id}>
                  {opt.label}
                </option>
              ))}
            </select>
            <span className="absolute right-2 text-slate-400 pointer-events-none text-[10px]">
              ▼
            </span>
          </div>

          {/* Sincronizar Ahora Button */}
          <div className="flex flex-col items-end">
            <Button
              variant="primary"
              size="sm"
              isLoading={isSyncing}
              onClick={() => triggerSync()}
              leftIcon={<RefreshCw className={`w-3.5 h-3.5 ${isSyncing ? 'animate-spin' : ''}`} />}
            >
              <span>{isSyncing ? 'Sincronizando...' : 'Sincronizar'}</span>
            </Button>
            {lastSyncAt && (
              <span className="text-[10px] text-slate-400 font-medium mt-0.5">
                {formatLastSync(lastSyncAt)}
              </span>
            )}
          </div>
        </div>
      </div>
    </header>
  );
};
