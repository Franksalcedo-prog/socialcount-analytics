import React from 'react';
import { AlertTriangle, KeyRound, RefreshCw } from 'lucide-react';
import { apiService } from '../../services/api';
import { useFilters } from '../../context/FilterContext';

interface DemoBannerProps {
  onOpenConnectModal: () => void;
}

export const DemoBanner: React.FC<DemoBannerProps> = ({ onOpenConnectModal }) => {
  const { triggerRefresh } = useFilters();
  const [isResetting, setIsResetting] = React.useState(false);

  const handleReset = async () => {
    setIsResetting(true);
    try {
      await apiService.resetDemoAccounts();
      triggerRefresh();
    } finally {
      setIsResetting(false);
    }
  };

  return (
    <div className="bg-gradient-to-r from-amber-500/10 via-amber-500/5 to-amber-500/10 border-b border-amber-200/80 px-4 py-2.5 sm:px-6">
      <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-3 text-xs">
        <div className="flex items-center gap-2.5 text-amber-900 font-medium">
          <span className="inline-flex p-1 bg-amber-100 text-amber-700 rounded-md">
            <AlertTriangle className="w-3.5 h-3.5" />
          </span>
          <span>
            <strong className="font-semibold uppercase tracking-wider text-[11px] bg-amber-200/80 px-1.5 py-0.5 rounded mr-1.5">
              Modo Demostración
            </strong>
            Visualizando datos de prueba representativos para Facebook Pages e Instagram Profesional.
          </span>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <button
            onClick={handleReset}
            disabled={isResetting}
            className="inline-flex items-center gap-1 px-2.5 py-1 text-slate-700 bg-white hover:bg-slate-50 border border-amber-300 rounded-md text-xs font-medium transition-colors shadow-2xs"
          >
            <RefreshCw className={`w-3 h-3 ${isResetting ? 'animate-spin' : ''}`} />
            <span>Restablecer demo</span>
          </button>
          <button
            onClick={onOpenConnectModal}
            className="inline-flex items-center gap-1 px-3 py-1 bg-brand-600 hover:bg-brand-700 text-white rounded-md text-xs font-semibold transition-colors shadow-2xs"
          >
            <KeyRound className="w-3 h-3" />
            <span>Conectar Cuentas Reales</span>
          </button>
        </div>
      </div>
    </div>
  );
};
