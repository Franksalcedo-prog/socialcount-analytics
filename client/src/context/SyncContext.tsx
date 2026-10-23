import React, { createContext, useContext, useState, useEffect } from 'react';
import { apiService } from '../services/api';
import { useFilters } from './FilterContext';

interface SyncContextType {
  isSyncing: boolean;
  syncProgressMessage: string;
  lastSyncResult: string | null;
  triggerSync: (accountId?: string) => Promise<void>;
  showSuccessToast: boolean;
  dismissToast: () => void;
}

const SyncContext = createContext<SyncContextType | undefined>(undefined);

export const SyncProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [isSyncing, setIsSyncing] = useState<boolean>(false);
  const [syncProgressMessage, setSyncProgressMessage] = useState<string>('');
  const [lastSyncResult, setLastSyncResult] = useState<string | null>(null);
  const [showSuccessToast, setShowSuccessToast] = useState<boolean>(false);
  const { triggerRefresh } = useFilters();

  // Comprobar al montar si hay un job activo en el servidor
  useEffect(() => {
    let interval: NodeJS.Timeout;

    const checkActive = async () => {
      try {
        const res = await apiService.getActiveSync();
        if (res.hasActiveJob) {
          setIsSyncing(true);
          setSyncProgressMessage('Sincronización en curso...');
        } else if (isSyncing) {
          setIsSyncing(false);
          triggerRefresh();
        }
      } catch {
        // Silencioso
      }
    };

    checkActive();
    interval = setInterval(checkActive, 5000);
    return () => clearInterval(interval);
  }, [isSyncing, triggerRefresh]);

  const triggerSync = async (accountId?: string) => {
    if (isSyncing) return;

    setIsSyncing(true);
    setSyncProgressMessage('Consultando publicaciones y comentarios en Meta...');
    setShowSuccessToast(false);

    try {
      const res = await apiService.triggerSync(accountId);
      setLastSyncResult(`Sincronización completada. +${res.commentsAdded} comentarios nuevos.`);
      setShowSuccessToast(true);
      triggerRefresh();
    } catch (error: any) {
      setLastSyncResult(error.response?.data?.error || 'Error al ejecutar la sincronización.');
      setShowSuccessToast(true);
    } finally {
      setIsSyncing(false);
    }
  };

  const dismissToast = () => {
    setShowSuccessToast(false);
  };

  return (
    <SyncContext.Provider
      value={{
        isSyncing,
        syncProgressMessage,
        lastSyncResult,
        triggerSync,
        showSuccessToast,
        dismissToast,
      }}
    >
      {children}
    </SyncContext.Provider>
  );
};

export const useSync = (): SyncContextType => {
  const context = useContext(SyncContext);
  if (!context) {
    throw new Error('useSync debe usarse dentro de SyncProvider');
  }
  return context;
};
