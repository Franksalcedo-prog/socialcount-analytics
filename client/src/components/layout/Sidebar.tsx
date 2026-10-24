import React from 'react';
import {
  LayoutDashboard,
  BarChart3,
  Newspaper,
  MessageSquare,
  Share2,
  FileSpreadsheet,
  History,
  Settings,
  Activity,
  CheckCircle2,
  X,
  Trophy,
  Award,
  ShieldCheck,
  FolderKanban,
} from 'lucide-react';
import { Badge } from '../ui/Badge';

export type NavTab =
  | 'voting-dashboard'
  | 'categories-results'
  | 'voting-audit'
  | 'contest-mgmt'
  | 'dashboard'
  | 'analytics'
  | 'posts'
  | 'comments'
  | 'accounts'
  | 'reports'
  | 'sync'
  | 'settings';

interface SidebarProps {
  currentTab: NavTab;
  onSelectTab: (tab: NavTab) => void;
  isOpenMobile: boolean;
  onCloseMobile: () => void;
  isDemoMode: boolean;
}

export const Sidebar: React.FC<SidebarProps> = ({
  currentTab,
  onSelectTab,
  isOpenMobile,
  onCloseMobile,
  isDemoMode,
}) => {
  const votingNavItems: Array<{
    id: NavTab;
    label: string;
    icon: React.ReactNode;
    badge?: string;
  }> = [
    {
      id: 'voting-dashboard',
      label: 'Conteo y Métricas',
      icon: <Trophy className="w-4 h-4" />,
      badge: 'ÉBANO',
    },
    {
      id: 'categories-results',
      label: 'Resultados por Categoría',
      icon: <Award className="w-4 h-4" />,
    },
    {
      id: 'voting-audit',
      label: 'Auditoría de Votos',
      icon: <ShieldCheck className="w-4 h-4" />,
    },
    {
      id: 'contest-mgmt',
      label: 'Gestión Convocatoria',
      icon: <FolderKanban className="w-4 h-4" />,
    },
  ];

  const metaNavItems: Array<{
    id: NavTab;
    label: string;
    icon: React.ReactNode;
    badge?: string;
  }> = [
    {
      id: 'dashboard',
      label: 'Resumen general',
      icon: <LayoutDashboard className="w-4 h-4" />,
    },
    {
      id: 'analytics',
      label: 'Analítica Meta',
      icon: <BarChart3 className="w-4 h-4" />,
    },
    {
      id: 'posts',
      label: 'Publicaciones',
      icon: <Newspaper className="w-4 h-4" />,
    },
    {
      id: 'comments',
      label: 'Comentarios',
      icon: <MessageSquare className="w-4 h-4" />,
    },
    {
      id: 'accounts',
      label: 'Cuentas conectadas',
      icon: <Share2 className="w-4 h-4" />,
    },
    {
      id: 'reports',
      label: 'Informes',
      icon: <FileSpreadsheet className="w-4 h-4" />,
    },
    {
      id: 'sync',
      label: 'Historial de sincronización',
      icon: <History className="w-4 h-4" />,
    },
    {
      id: 'settings',
      label: 'Configuración',
      icon: <Settings className="w-4 h-4" />,
    },
  ];

  const handleNavClick = (id: NavTab) => {
    onSelectTab(id);
    onCloseMobile();
  };

  return (
    <>
      {/* Mobile Backdrop */}
      {isOpenMobile && (
        <div
          onClick={onCloseMobile}
          className="fixed inset-0 z-40 bg-slate-900/40 backdrop-blur-xs lg:hidden"
        />
      )}

      {/* Sidebar Aside */}
      <aside
        className={`fixed top-0 bottom-0 left-0 z-50 w-64 bg-surface border-r border-border-ui flex flex-col transition-transform duration-300 ease-in-out lg:translate-x-0 ${
          isOpenMobile ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        {/* Brand Header */}
        <div className="h-16 flex items-center justify-between px-6 border-b border-border-ui/70">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-brand-600 to-indigo-500 flex items-center justify-center text-white shadow-sm shadow-brand-500/30">
              <Activity className="w-5 h-5 stroke-[2.2]" />
            </div>
            <div>
              <div className="flex items-center gap-1.5">
                <span className="font-bold text-slate-900 text-sm tracking-tight">SocialCount</span>
                <span className="text-[10px] font-semibold text-brand-600 bg-brand-50 px-1 py-0.2 rounded border border-brand-100">
                  PRO
                </span>
              </div>
              <span className="text-[10px] text-text-muted font-medium block">
                Meta Analytics & Votos
              </span>
            </div>
          </div>

          <button
            onClick={onCloseMobile}
            className="lg:hidden p-1.5 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-lg transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Navigation List */}
        <div className="flex-1 py-4 px-3 space-y-4 overflow-y-auto">
          {/* Seccion 1: Convocatoria Ebano */}
          <div>
            <div className="px-3 pb-2 text-[10px] font-bold uppercase tracking-wider text-amber-700 flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 rounded-full bg-amber-500 inline-block animate-pulse"></span>
              Convocatoria Ébano
            </div>
            <div className="space-y-1">
              {votingNavItems.map((item) => {
                const isActive = currentTab === item.id;
                return (
                  <button
                    key={item.id}
                    onClick={() => handleNavClick(item.id)}
                    className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-lg text-xs font-medium transition-all ${
                      isActive
                        ? 'bg-amber-50 text-amber-900 font-semibold shadow-2xs border border-amber-200/90'
                        : 'text-slate-700 hover:text-slate-900 hover:bg-amber-50/40'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <span className={isActive ? 'text-amber-600' : 'text-slate-400'}>
                        {item.icon}
                      </span>
                      <span>{item.label}</span>
                    </div>
                    {item.badge && (
                      <span className="text-[9px] bg-amber-100 text-amber-800 font-bold px-1.5 py-0.5 rounded-full tracking-wide">
                        {item.badge}
                      </span>
                    )}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Seccion 2: Plataforma Meta */}
          <div>
            <div className="px-3 pb-2 text-[10px] font-semibold uppercase tracking-wider text-slate-400">
              Plataforma Meta
            </div>
            <div className="space-y-1">
              {metaNavItems.map((item) => {
                const isActive = currentTab === item.id;
                return (
                  <button
                    key={item.id}
                    onClick={() => handleNavClick(item.id)}
                    className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-lg text-xs font-medium transition-all ${
                      isActive
                        ? 'bg-brand-50 text-brand-700 font-semibold shadow-2xs border border-brand-100/80'
                        : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <span className={isActive ? 'text-brand-600' : 'text-slate-400'}>
                        {item.icon}
                      </span>
                      <span>{item.label}</span>
                    </div>
                    {item.badge && (
                      <span className="text-[10px] bg-brand-100 text-brand-700 font-semibold px-1.5 py-0.5 rounded-full">
                        {item.badge}
                      </span>
                    )}
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        {/* Platform Status Widget in Sidebar footer */}
        <div className="p-4 border-t border-border-ui/70 bg-slate-50/50">
          <div className="flex items-center justify-between mb-2">
            <span className="text-[11px] font-medium text-slate-500">Estado de Meta APIs</span>
            {isDemoMode ? (
              <Badge variant="demo" size="sm">DEMO</Badge>
            ) : (
              <span className="flex items-center gap-1 text-[10px] font-medium text-emerald-600">
                <CheckCircle2 className="w-3 h-3" /> Conectado
              </span>
            )}
          </div>

          <div className="space-y-1.5 text-[11px]">
            <div className="flex items-center justify-between p-2 rounded-md bg-white border border-slate-200/80 shadow-2xs">
              <div className="flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-facebook" />
                <span className="font-medium text-slate-700">Facebook Pages</span>
              </div>
              <span className="text-[10px] text-slate-400 font-mono">v21.0</span>
            </div>

            <div className="flex items-center justify-between p-2 rounded-md bg-white border border-slate-200/80 shadow-2xs">
              <div className="flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-instagram-pink" />
                <span className="font-medium text-slate-700">Instagram Business</span>
              </div>
              <span className="text-[10px] text-slate-400 font-mono">v21.0</span>
            </div>
          </div>
        </div>
      </aside>
    </>
  );
};
