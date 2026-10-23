import React, { useState, useEffect } from 'react';
import {
  Plus,
  RefreshCw,
  Trash2,
  CheckCircle2,
  AlertTriangle,
  Clock,
  MessageSquare,
  FileText,
  ExternalLink,
  Shield,
} from 'lucide-react';
import { SocialAccount } from '../../types';
import { apiService } from '../../services/api';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '../ui/Card';
import { Button } from '../ui/Button';
import { Badge } from '../ui/Badge';
import { ConnectModal } from './ConnectModal';
import { useSync } from '../../context/SyncContext';

export const AccountsView: React.FC = () => {
  const [accounts, setAccounts] = useState<SocialAccount[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isConnectModalOpen, setIsConnectModalOpen] = useState(false);
  const [actionAccountLoading, setActionAccountLoading] = useState<string | null>(null);
  const { triggerSync } = useSync();

  const loadAccounts = async () => {
    setIsLoading(true);
    try {
      const data = await apiService.getAccounts();
      setAccounts(data);
    } catch (e) {
      console.error('Error al cargar cuentas:', e);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadAccounts();
  }, []);

  const handleToggleMonitoring = async (account: SocialAccount) => {
    const updated = !account.isMonitored;
    // Optimistic update
    setAccounts((prev) =>
      prev.map((a) => (a.id === account.id ? { ...a, isMonitored: updated } : a))
    );
    try {
      await apiService.updateAccount(account.id, { isMonitored: updated });
    } catch (e) {
      // Revert on error
      setAccounts((prev) =>
        prev.map((a) => (a.id === account.id ? { ...a, isMonitored: !updated } : a))
      );
    }
  };

  const handleDisconnect = async (accountId: string, accountName: string) => {
    if (!window.confirm(`¿Estás seguro de desconectar la cuenta "${accountName}"? Esta acción eliminará sus credenciales de sincronización.`)) {
      return;
    }

    setActionAccountLoading(accountId);
    try {
      await apiService.disconnectAccount(accountId);
      setAccounts((prev) => prev.filter((a) => a.id !== accountId));
    } catch (e) {
      alert('Error al desconectar la cuenta.');
    } finally {
      setActionAccountLoading(null);
    }
  };

  const handleSyncAccount = async (accountId: string) => {
    setActionAccountLoading(accountId);
    try {
      await triggerSync(accountId);
      await loadAccounts();
    } finally {
      setActionAccountLoading(null);
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Banner and Action */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 bg-white p-5 rounded-2xl border border-border-ui shadow-2xs">
        <div>
          <h2 className="text-base font-bold text-slate-900 tracking-tight">
            Cuentas Sociales Conectadas
          </h2>
          <p className="text-xs text-text-muted mt-0.5">
            Administra tus páginas de Facebook autorizadas y perfiles de Instagram Profesional
          </p>
        </div>

        <Button
          variant="primary"
          size="sm"
          onClick={() => setIsConnectModalOpen(true)}
          leftIcon={<Plus className="w-4 h-4" />}
        >
          Conectar Nueva Cuenta
        </Button>
      </div>

      {/* Loading state */}
      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {[1, 2].map((i) => (
            <Card key={i} className="p-6 animate-pulse">
              <div className="flex items-center gap-4 mb-4">
                <div className="w-12 h-12 rounded-full bg-slate-200" />
                <div className="space-y-2">
                  <div className="h-4 w-36 bg-slate-200 rounded" />
                  <div className="h-3 w-24 bg-slate-100 rounded" />
                </div>
              </div>
            </Card>
          ))}
        </div>
      ) : accounts.length === 0 ? (
        /* Empty state */
        <Card className="p-12 text-center flex flex-col items-center justify-center">
          <div className="w-14 h-14 rounded-2xl bg-brand-50 text-brand-600 flex items-center justify-center mb-4">
            <Shield className="w-7 h-7" />
          </div>
          <h3 className="text-base font-bold text-slate-900 mb-1">No hay cuentas conectadas</h3>
          <p className="text-xs text-text-muted max-w-sm mb-6">
            Conecta tus Páginas de Facebook o cuentas de Instagram Profesional para comenzar a contabilizar comentarios y generar métricas.
          </p>
          <Button
            variant="primary"
            onClick={() => setIsConnectModalOpen(true)}
            leftIcon={<Plus className="w-4 h-4" />}
          >
            Conectar Cuenta con Meta
          </Button>
        </Card>
      ) : (
        /* Accounts Grid */
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          {accounts.map((account) => {
            const isFb = account.platform === 'FACEBOOK';
            const isActing = actionAccountLoading === account.id;

            return (
              <Card key={account.id} className="relative overflow-hidden flex flex-col justify-between">
                {/* Accent top stripe */}
                <div
                  className={`h-1.5 w-full ${isFb ? 'bg-facebook' : 'bg-ig-gradient'}`}
                />

                <CardContent className="p-5 flex-1 flex flex-col justify-between">
                  <div>
                    {/* Header: Avatar, Name, Badges */}
                    <div className="flex items-start justify-between gap-3 mb-4">
                      <div className="flex items-center gap-3">
                        {account.profilePictureUrl ? (
                          <img
                            src={account.profilePictureUrl}
                            alt={account.name}
                            className="w-12 h-12 rounded-full object-cover border-2 border-slate-100 shrink-0"
                          />
                        ) : (
                          <div
                            className={`w-12 h-12 rounded-full flex items-center justify-center text-white font-bold text-sm shrink-0 ${
                              isFb ? 'bg-facebook' : 'bg-ig-gradient'
                            }`}
                          >
                            {account.name.charAt(0)}
                          </div>
                        )}

                        <div>
                          <div className="flex items-center gap-2">
                            <h3 className="text-sm font-bold text-slate-900 leading-tight">
                              {account.name}
                            </h3>
                            {account.isDemo && <Badge variant="demo" size="sm">DEMO</Badge>}
                          </div>
                          <span className="text-xs text-slate-500 font-medium">
                            {account.username ? `@${account.username}` : `ID: ${account.externalId}`}
                          </span>
                        </div>
                      </div>

                      <Badge variant={isFb ? 'facebook' : 'instagram'}>
                        {isFb ? 'Facebook Page' : 'Instagram Business'}
                      </Badge>
                    </div>

                    {/* Stats summary */}
                    <div className="grid grid-cols-2 gap-3 p-3 bg-slate-50 rounded-xl border border-slate-200/70 mb-4">
                      <div className="flex items-center gap-2.5">
                        <div className="p-2 bg-white rounded-lg border border-slate-200 text-slate-600 shadow-2xs">
                          <FileText className="w-4 h-4 text-brand-600" />
                        </div>
                        <div>
                          <span className="text-xs text-slate-500 block">Posts</span>
                          <span className="text-sm font-bold text-slate-900">
                            {account.postsCount}
                          </span>
                        </div>
                      </div>

                      <div className="flex items-center gap-2.5">
                        <div className="p-2 bg-white rounded-lg border border-slate-200 text-slate-600 shadow-2xs">
                          <MessageSquare className="w-4 h-4 text-brand-600" />
                        </div>
                        <div>
                          <span className="text-xs text-slate-500 block">Comentarios</span>
                          <span className="text-sm font-bold text-slate-900">
                            {account.commentsCount}
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Meta details: Token status, Last sync */}
                    <div className="space-y-1.5 text-xs text-slate-600">
                      <div className="flex items-center justify-between">
                        <span className="text-slate-500">Estado de Credenciales:</span>
                        {account.tokenStatus === 'ACTIVE' ? (
                          <span className="inline-flex items-center gap-1 font-semibold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded text-[11px] border border-emerald-200">
                            <CheckCircle2 className="w-3 h-3" /> Token Válido
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 font-semibold text-amber-700 bg-amber-50 px-2 py-0.5 rounded text-[11px] border border-amber-200">
                            <AlertTriangle className="w-3 h-3" /> Requiere Reautorización
                          </span>
                        )}
                      </div>

                      <div className="flex items-center justify-between">
                        <span className="text-slate-500">Última Sincronización:</span>
                        <span className="font-medium text-slate-700 flex items-center gap-1 text-[11px]">
                          <Clock className="w-3 h-3 text-slate-400" />
                          {account.lastSyncAt
                            ? new Date(account.lastSyncAt).toLocaleString('es-ES', {
                                dateStyle: 'short',
                                timeStyle: 'short',
                              })
                            : 'Pendiente'}
                        </span>
                      </div>

                      {/* Monitoring Toggle */}
                      <div className="flex items-center justify-between pt-1 border-t border-slate-100">
                        <span className="text-slate-700 font-medium">Monitoreo Automático:</span>
                        <button
                          type="button"
                          onClick={() => handleToggleMonitoring(account)}
                          className={`relative inline-flex h-5 w-9 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                            account.isMonitored ? 'bg-brand-600' : 'bg-slate-200'
                          }`}
                        >
                          <span
                            className={`inline-block h-4 w-4 transform rounded-full bg-white shadow transition duration-200 ease-in-out ${
                              account.isMonitored ? 'translate-x-4' : 'translate-x-0'
                            }`}
                          />
                        </button>
                      </div>
                    </div>
                  </div>

                  {/* Actions footer */}
                  <div className="flex items-center justify-between gap-2 pt-4 mt-4 border-t border-slate-100">
                    <Button
                      variant="outline"
                      size="sm"
                      isLoading={isActing}
                      onClick={() => handleSyncAccount(account.id)}
                      leftIcon={<RefreshCw className="w-3.5 h-3.5" />}
                    >
                      Sincronizar
                    </Button>

                    <Button
                      variant="ghost"
                      size="sm"
                      disabled={isActing}
                      onClick={() => handleDisconnect(account.id, account.name)}
                      className="text-rose-600 hover:text-rose-700 hover:bg-rose-50"
                      leftIcon={<Trash2 className="w-3.5 h-3.5" />}
                    >
                      Desconectar
                    </Button>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      {/* Connect Modal */}
      <ConnectModal
        isOpen={isConnectModalOpen}
        onClose={() => {
          setIsConnectModalOpen(false);
          loadAccounts();
        }}
      />
    </div>
  );
};
