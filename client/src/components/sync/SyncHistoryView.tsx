import React, { useState, useEffect } from 'react';
import {
  History,
  CheckCircle2,
  AlertTriangle,
  XCircle,
  Clock,
  RefreshCw,
  FileText,
  Terminal,
} from 'lucide-react';
import { SyncJob } from '../../types';
import { apiService } from '../../services/api';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '../ui/Card';
import { Badge } from '../ui/Badge';
import { Button } from '../ui/Button';
import { Modal } from '../ui/Modal';
import { useSync } from '../../context/SyncContext';

export const SyncHistoryView: React.FC = () => {
  const [jobs, setJobs] = useState<SyncJob[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedJob, setSelectedJob] = useState<SyncJob | null>(null);
  const [isLogModalOpen, setIsLogModalOpen] = useState(false);
  const { isSyncing, triggerSync } = useSync();

  const loadHistory = async () => {
    setIsLoading(true);
    try {
      const data = await apiService.getSyncHistory();
      setJobs(data);
    } catch (e) {
      console.error('Error al cargar historial de sincronización:', e);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadHistory();
  }, [isSyncing]);

  const handleOpenLogs = (job: SyncJob) => {
    setSelectedJob(job);
    setIsLogModalOpen(true);
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'COMPLETED':
        return (
          <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
            <CheckCircle2 className="w-3 h-3" /> Completado
          </span>
        );
      case 'PARTIAL':
        return (
          <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-amber-700 bg-amber-50 px-2 py-0.5 rounded border border-amber-200">
            <AlertTriangle className="w-3 h-3" /> Parcial
          </span>
        );
      case 'FAILED':
        return (
          <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-rose-700 bg-rose-50 px-2 py-0.5 rounded border border-rose-200">
            <XCircle className="w-3 h-3" /> Fallido
          </span>
        );
      case 'IN_PROGRESS':
        return (
          <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-brand-700 bg-brand-50 px-2 py-0.5 rounded border border-brand-200">
            <RefreshCw className="w-3 h-3 animate-spin" /> En Curso
          </span>
        );
      default:
        return <Badge size="sm">{status}</Badge>;
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 bg-white p-5 rounded-2xl border border-border-ui shadow-2xs">
        <div>
          <h2 className="text-base font-bold text-slate-900 tracking-tight">
            Historial de Procesos de Sincronización
          </h2>
          <p className="text-xs text-text-muted mt-0.5">
            Registro de ejecuciones manuales, programadas y eventos en tiempo real de Meta
          </p>
        </div>

        <Button
          variant="primary"
          size="sm"
          isLoading={isSyncing}
          onClick={() => triggerSync()}
          leftIcon={<RefreshCw className="w-3.5 h-3.5" />}
        >
          Sincronizar Ahora
        </Button>
      </div>

      {/* History Table */}
      <Card className="overflow-hidden">
        {isLoading ? (
          <div className="p-8 space-y-3">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-10 bg-slate-100 rounded animate-pulse" />
            ))}
          </div>
        ) : jobs.length === 0 ? (
          <div className="p-12 text-center text-xs text-slate-500">
            No se han registrado procesos de sincronización aún.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 border-b border-border-ui text-slate-500 font-semibold uppercase tracking-wider text-[10px]">
                <tr>
                  <th className="py-3 px-4">Fecha y Hora</th>
                  <th className="py-3 px-4">Origen</th>
                  <th className="py-3 px-4">Estado</th>
                  <th className="py-3 px-4 text-center">Duración</th>
                  <th className="py-3 px-4 text-center">Posts</th>
                  <th className="py-3 px-4 text-center">Comentarios Nuevos</th>
                  <th className="py-3 px-4 text-center">Logs</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {jobs.map((job) => (
                  <tr key={job.id} className="hover:bg-slate-50/80 transition-colors">
                    <td className="py-3 px-4 font-medium text-slate-800 whitespace-nowrap">
                      {new Date(job.startedAt).toLocaleString('es-ES', {
                        dateStyle: 'short',
                        timeStyle: 'medium',
                      })}
                    </td>

                    <td className="py-3 px-4 whitespace-nowrap">
                      <code className="text-[10px] font-mono uppercase bg-slate-100 text-slate-700 px-1.5 py-0.5 rounded border border-slate-200">
                        {job.triggerSource}
                      </code>
                    </td>

                    <td className="py-3 px-4 whitespace-nowrap">
                      {getStatusBadge(job.status)}
                    </td>

                    <td className="py-3 px-4 text-center text-slate-500 whitespace-nowrap">
                      {job.durationMs ? `${(job.durationMs / 1000).toFixed(2)}s` : '—'}
                    </td>

                    <td className="py-3 px-4 text-center font-semibold text-slate-700">
                      {job.postsProcessed}
                    </td>

                    <td className="py-3 px-4 text-center font-bold text-emerald-700">
                      +{job.commentsAdded}
                    </td>

                    <td className="py-3 px-4 text-center">
                      <button
                        onClick={() => handleOpenLogs(job)}
                        className="inline-flex items-center gap-1 px-2 py-1 text-slate-600 hover:text-brand-600 hover:bg-brand-50 rounded-md transition-colors text-xs font-medium"
                      >
                        <Terminal className="w-3.5 h-3.5" />
                        <span>Ver logs</span>
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>

      {/* Logs Modal */}
      <Modal
        isOpen={isLogModalOpen}
        onClose={() => setIsLogModalOpen(false)}
        title="Detalles y Logs del Proceso de Sincronización"
        description={`ID del Trabajo: ${selectedJob?.id}`}
        maxWidth="xl"
      >
        <div className="space-y-4">
          {selectedJob?.errorSummary && (
            <div className="p-3 bg-red-50 border border-red-200 rounded-xl text-xs text-red-800">
              <span className="font-bold block mb-1">Resumen del Error:</span>
              {selectedJob.errorSummary}
            </div>
          )}

          <div className="bg-slate-950 text-slate-200 p-4 rounded-xl font-mono text-xs max-h-80 overflow-y-auto space-y-2 border border-slate-800">
            {(!selectedJob?.logs || selectedJob.logs.length === 0) ? (
              <p className="text-slate-500 italic">No hay registros de consola vinculados a este trabajo.</p>
            ) : (
              selectedJob.logs.map((log) => (
                <div key={log.id} className="flex items-start gap-2 leading-relaxed">
                  <span className="text-slate-500 shrink-0 text-[10px]">
                    [{new Date(log.timestamp).toLocaleTimeString()}]
                  </span>
                  <span
                    className={`font-bold shrink-0 text-[10px] px-1 rounded ${
                      log.level === 'ERROR'
                        ? 'bg-rose-950 text-rose-400'
                        : log.level === 'WARN'
                        ? 'bg-amber-950 text-amber-400'
                        : 'bg-emerald-950 text-emerald-400'
                    }`}
                  >
                    {log.level}
                  </span>
                  <span className="text-slate-300">{log.message}</span>
                </div>
              ))
            )}
          </div>
        </div>
      </Modal>
    </div>
  );
};
