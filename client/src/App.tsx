import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { CheckCircle2, X } from 'lucide-react';
import { FilterProvider, useFilters } from './context/FilterContext';
import { SyncProvider, useSync } from './context/SyncContext';
import { Sidebar, NavTab } from './components/layout/Sidebar';
import { Topbar } from './components/layout/Topbar';
import { DemoBanner } from './components/layout/DemoBanner';
import { ConnectModal } from './components/accounts/ConnectModal';
import { DashboardOverview } from './components/dashboard/DashboardOverview';
import { AnalyticsView } from './components/dashboard/AnalyticsView';
import { PostsView } from './components/posts/PostsView';
import { CommentsView } from './components/comments/CommentsView';
import { AccountsView } from './components/accounts/AccountsView';
import { ReportsView } from './components/reports/ReportsView';
import { SyncHistoryView } from './components/sync/SyncHistoryView';
import { SettingsView } from './components/settings/SettingsView';
import { VotingDashboardView } from './components/voting/VotingDashboardView';
import { CategoryResultsView } from './components/voting/CategoryResultsView';
import { VotesAuditView } from './components/voting/VotesAuditView';
import { ContestManagementView } from './components/voting/ContestManagementView';
import { CandidateDetailDrawer } from './components/voting/CandidateDetailDrawer';
import { apiService } from './services/api';

const AppContent: React.FC = () => {
  const [currentTab, setCurrentTab] = useState<NavTab>('voting-dashboard');
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isConnectModalOpen, setIsConnectModalOpen] = useState(false);
  const [isDemoMode, setIsDemoMode] = useState(true);
  const [lastSyncTimestamp, setLastSyncTimestamp] = useState<string | null>(null);

  // Estados para Drawer de Ficha de Participante y Selección de Categoría
  const [selectedCandidateId, setSelectedCandidateId] = useState<string | null>(null);
  const [isCandidateDrawerOpen, setIsCandidateDrawerOpen] = useState(false);
  const [activeCategoryIdForResults, setActiveCategoryIdForResults] = useState<string | null>(null);

  const { showSuccessToast, lastSyncResult, dismissToast } = useSync();
  const { refreshKey } = useFilters();

  const handleOpenCandidateDetail = (candidateId: string) => {
    setSelectedCandidateId(candidateId);
    setIsCandidateDrawerOpen(true);
  };

  const handleSelectCategory = (categoryId: string) => {
    setActiveCategoryIdForResults(categoryId);
    setCurrentTab('categories-results');
  };

  // Comprobar estado inicial del sistema y timestamp de última sincronización
  useEffect(() => {
    const checkSystemStatus = async () => {
      try {
        const settings = await apiService.getSystemSettings();
        setIsDemoMode(settings.demoModeActive);
      } catch {
        // En caso de fallo asumimos modo demo
        setIsDemoMode(true);
      }

      try {
        const accounts = await apiService.getAccounts();
        const latestAccount = accounts.find((a) => a.lastSyncAt !== null);
        if (latestAccount?.lastSyncAt) {
          setLastSyncTimestamp(latestAccount.lastSyncAt);
        }
      } catch {
        // Silencioso
      }
    };

    checkSystemStatus();
  }, [refreshKey]);

  // Chequear parámetros de callback OAuth en la URL al cargar
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    if (params.get('connected') === 'true') {
      setCurrentTab('accounts');
      window.history.replaceState({}, document.title, window.location.pathname);
    }
  }, []);

  const sectionMeta: Record<NavTab, { title: string; subtitle: string }> = {
    'voting-dashboard': {
      title: 'Conteo y Métricas de Votos — Ébano',
      subtitle: 'Consolidación oficial de votos provenientes de comentarios de Facebook e Instagram',
    },
    'categories-results': {
      title: 'Resultados Oficiales por Categoría',
      subtitle: 'Tabla comparativa, porcentajes, rankings y fórmulas consolidadas auditables',
    },
    'voting-audit': {
      title: 'Auditoría y Validación de Votos',
      subtitle: 'Control de comentarios repetidos, detección de votos inválidos y corrección manual',
    },
    'contest-mgmt': {
      title: 'Gestión de Convocatorias y Cuentas',
      subtitle: 'Administración de categorías, integrantes oficiales, reglas de conteo y posts vinculados',
    },
    dashboard: {
      title: 'Panel General de Control',
      subtitle: 'Visión consolidada de comentarios de Facebook Pages e Instagram Profesional',
    },
    analytics: {
      title: 'Analítica y Tendencias Meta',
      subtitle: 'Comportamiento de interacciones, comparativa entre plataformas y patrones',
    },
    posts: {
      title: 'Publicaciones Monitoreadas',
      subtitle: 'Catálogo de contenidos en Meta y desglose de respuestas recibidas',
    },
    comments: {
      title: 'Historial Centralizado de Comentarios',
      subtitle: 'Explorador y tabla con paginación en servidor y trazabilidad de Meta IDs',
    },
    accounts: {
      title: 'Cuentas Sociales Conectadas',
      subtitle: 'Administración de permisos OAuth, credenciales cifradas y reconexión',
    },
    reports: {
      title: 'Informes y Exportaciones',
      subtitle: 'Consolidado ejecutivo descargable y exportación tabular a formato CSV',
    },
    sync: {
      title: 'Historial de Sincronización',
      subtitle: 'Auditoría de ejecuciones, llamadas a la API de Meta y logs técnicos',
    },
    settings: {
      title: 'Configuración del Sistema',
      subtitle: 'Parámetros de Graph API v21.0, Webhooks en tiempo real y Base de Datos',
    },
  };

  const renderCurrentView = () => {
    switch (currentTab) {
      case 'voting-dashboard':
        return (
          <VotingDashboardView
            onSelectCategory={handleSelectCategory}
            onOpenCandidateDetail={handleOpenCandidateDetail}
          />
        );
      case 'categories-results':
        return (
          <CategoryResultsView
            initialCategoryId={activeCategoryIdForResults}
            onOpenCandidateDetail={handleOpenCandidateDetail}
          />
        );
      case 'voting-audit':
        return <VotesAuditView />;
      case 'contest-mgmt':
        return <ContestManagementView />;
      case 'dashboard':
        return <DashboardOverview />;
      case 'analytics':
        return <AnalyticsView />;
      case 'posts':
        return <PostsView />;
      case 'comments':
        return <CommentsView />;
      case 'accounts':
        return <AccountsView />;
      case 'reports':
        return <ReportsView />;
      case 'sync':
        return <SyncHistoryView />;
      case 'settings':
        return <SettingsView />;
      default:
        return (
          <VotingDashboardView
            onSelectCategory={handleSelectCategory}
            onOpenCandidateDetail={handleOpenCandidateDetail}
          />
        );
    }
  };

  return (
    <div className="min-h-screen bg-background flex flex-col antialiased">
      {/* 1. Top Demo Banner if demo mode is enabled */}
      {isDemoMode && (
        <DemoBanner onOpenConnectModal={() => setIsConnectModalOpen(true)} />
      )}

      <div className="flex-1 flex">
        {/* 2. Responsive Sidebar */}
        <Sidebar
          currentTab={currentTab}
          onSelectTab={setCurrentTab}
          isOpenMobile={isMobileMenuOpen}
          onCloseMobile={() => setIsMobileMenuOpen(false)}
          isDemoMode={isDemoMode}
        />

        {/* 3. Main Content Container (with left margin for sidebar on lg screens) */}
        <div className="flex-1 flex flex-col lg:pl-64 min-w-0">
          {/* Topbar */}
          <Topbar
            sectionTitle={sectionMeta[currentTab].title}
            sectionSubtitle={sectionMeta[currentTab].subtitle}
            onOpenMobileMenu={() => setIsMobileMenuOpen(true)}
            lastSyncAt={lastSyncTimestamp}
          />

          {/* Page Content Body */}
          <main className="flex-1 p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto w-full">
            {renderCurrentView()}
          </main>
        </div>
      </div>

      {/* Drawer Ficha de Participante */}
      <CandidateDetailDrawer
        candidateId={selectedCandidateId}
        isOpen={isCandidateDrawerOpen}
        onClose={() => setIsCandidateDrawerOpen(false)}
      />

      {/* Global Connect Modal */}
      <ConnectModal
        isOpen={isConnectModalOpen}
        onClose={() => setIsConnectModalOpen(false)}
      />

      {/* Global Feedback Toast Notification */}
      <AnimatePresence>
        {showSuccessToast && (
          <motion.div
            initial={{ opacity: 0, y: 30, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.95 }}
            className="fixed bottom-6 right-6 z-50 bg-slate-900 text-white p-4 rounded-xl shadow-2xl border border-slate-800 flex items-center gap-3 text-xs max-w-md"
          >
            <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />
            <div className="flex-1">
              <span className="font-bold text-white block">Sincronización Finalizada</span>
              <span className="text-slate-300">{lastSyncResult}</span>
            </div>
            <button
              onClick={dismissToast}
              className="text-slate-400 hover:text-white p-1 rounded-md"
            >
              <X className="w-4 h-4" />
            </button>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export function App() {
  return (
    <FilterProvider>
      <SyncProvider>
        <AppContent />
      </SyncProvider>
    </FilterProvider>
  );
}

export default App;
