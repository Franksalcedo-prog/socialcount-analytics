import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  X,
  Trophy,
  Crown,
  Calendar,
  Share2,
  Users,
  CheckCircle2,
  AlertCircle,
  Copy,
  TrendingUp,
  BarChart2,
  User,
} from 'lucide-react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  LabelList,
  AreaChart,
  Area,
} from 'recharts';
import { CandidateDetailData } from '../../types';
import { apiService } from '../../services/api';
import { Badge } from '../ui/Badge';
import { Card } from '../ui/Card';

interface CandidateDetailDrawerProps {
  candidateId: string | null;
  isOpen: boolean;
  onClose: () => void;
}

export const CandidateDetailDrawer: React.FC<CandidateDetailDrawerProps> = ({
  candidateId,
  isOpen,
  onClose,
}) => {
  const [data, setData] = useState<CandidateDetailData | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [filterType, setFilterType] = useState<'ALL' | 'VALID' | 'DISCARDED'>('ALL');

  useEffect(() => {
    if (!candidateId || !isOpen) return;

    const loadCandidate = async () => {
      setIsLoading(true);
      try {
        const res = await apiService.getCandidateDetail(candidateId);
        setData(res);
      } catch (err) {
        console.error('Error al cargar detalle del integrante:', err);
      } finally {
        setIsLoading(false);
      }
    };

    loadCandidate();
  }, [candidateId, isOpen]);

  if (!isOpen) return null;

  const filteredComments = data?.recentComments.filter((c) => {
    if (filterType === 'VALID') return c.status === 'VALID' || c.status === 'MANUALLY_APPROVED';
    if (filterType === 'DISCARDED') return c.status !== 'VALID' && c.status !== 'MANUALLY_APPROVED';
    return true;
  }) || [];

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 overflow-hidden flex justify-end">
        {/* Backdrop */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
          className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs"
        />

        {/* Drawer Panel */}
        <motion.aside
          initial={{ x: '100%' }}
          animate={{ x: 0 }}
          exit={{ x: '100%' }}
          transition={{ type: 'spring', damping: 28, stiffness: 300 }}
          className="relative w-full max-w-2xl bg-white border-l border-border-ui shadow-2xl flex flex-col h-full z-10"
        >
          {/* Header */}
          <div className="p-5 border-b border-border-ui flex items-center justify-between bg-slate-50/50">
            <div className="flex items-center gap-2">
              <Trophy className="w-4 h-4 text-brand-600" />
              <span className="text-xs font-bold text-slate-800">
                Ficha Técnica Individual de Votación
              </span>
            </div>
            <button
              onClick={onClose}
              className="p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-200 rounded-lg transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {isLoading || !data ? (
            <div className="p-8 text-center text-xs text-slate-400 animate-pulse">
              Cargando estadísticas del integrante...
            </div>
          ) : (
            <div className="flex-1 overflow-y-auto p-6 space-y-6">
              {/* Candidate Profile Box */}
              <div className="p-5 bg-gradient-to-r from-slate-900 to-indigo-950 rounded-2xl text-white shadow-md flex items-center gap-4">
                {data.candidate.photoUrl ? (
                  <img
                    src={data.candidate.photoUrl}
                    alt={data.candidate.name}
                    className="w-16 h-16 rounded-full object-cover border-2 border-amber-400 shrink-0"
                  />
                ) : (
                  <div className="w-16 h-16 rounded-full bg-slate-800 border-2 border-slate-700 flex items-center justify-center text-slate-400 shrink-0">
                    <User className="w-8 h-8" />
                  </div>
                )}

                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-white/20 text-indigo-100">
                      {data.candidate.category.name}
                    </span>
                    {data.stats.isWinner && (
                      <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-amber-400 text-amber-950 flex items-center gap-1">
                        <Crown className="w-3 h-3" /> 1er Lugar
                      </span>
                    )}
                  </div>
                  <h3 className="text-lg font-black text-white truncate">{data.candidate.name}</h3>
                  <p className="text-xs text-slate-300 line-clamp-2 mt-0.5">
                    {data.candidate.bio || 'Participante oficial de la Convocatoria Ébano 2026.'}
                  </p>
                </div>
              </div>

              {/* 4 Key Metrics Cards */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                <div className="p-3 bg-slate-50 rounded-xl border border-slate-200">
                  <span className="text-[10px] font-semibold text-slate-500 block">Posición Actual</span>
                  <span className="text-lg font-black text-slate-900">
                    #{data.stats.rank}
                  </span>
                </div>
                <div className="p-3 bg-slate-50 rounded-xl border border-slate-200">
                  <span className="text-[10px] font-semibold text-slate-500 block">Total Votos</span>
                  <span className="text-lg font-black text-brand-600">
                    {data.stats.totalVotes}
                  </span>
                </div>
                <div className="p-3 bg-slate-50 rounded-xl border border-slate-200">
                  <span className="text-[10px] font-semibold text-slate-500 block">Porcentaje</span>
                  <span className="text-lg font-black text-slate-800">
                    {data.stats.percentage}%
                  </span>
                </div>
                <div className="p-3 bg-slate-50 rounded-xl border border-slate-200">
                  <span className="text-[10px] font-semibold text-slate-500 block">Diferencia 1°</span>
                  <span className="text-lg font-black text-amber-600">
                    {data.stats.rank === 1 ? 'Líder' : `-${data.stats.differenceFromLeader}`}
                  </span>
                </div>
              </div>

              {/* Required Horizontal Bar Chart (Sección 4) */}
              <Card className="p-4 space-y-3">
                <div className="flex items-center justify-between">
                  <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wider flex items-center gap-1.5">
                    <BarChart2 className="w-4 h-4 text-brand-600" />
                    Comparativa de Votos: Facebook vs Instagram vs Total
                  </h4>
                  <span className="text-[10px] text-slate-400">Valores exactos consolidados</span>
                </div>

                <div className="h-44 w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart
                      layout="vertical"
                      data={data.horizontalBarData}
                      margin={{ top: 10, right: 40, left: 20, bottom: 5 }}
                    >
                      <XAxis type="number" tick={{ fontSize: 11 }} />
                      <YAxis type="category" dataKey="network" tick={{ fontSize: 11, fontWeight: 600 }} width={120} />
                      <Tooltip
                        contentStyle={{
                          backgroundColor: '#0F172A',
                          borderRadius: '10px',
                          color: '#fff',
                          fontSize: '11px',
                        }}
                      />
                      <Bar dataKey="votos" radius={[0, 6, 6, 0]}>
                        <LabelList dataKey="votos" position="right" style={{ fontSize: 12, fontWeight: 'bold', fill: '#0F172A' }} />
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </Card>

              {/* Evolution Chart if timeline has data */}
              {data.timeline.length > 0 && (
                <Card className="p-4 space-y-3">
                  <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wider flex items-center gap-1.5">
                    <TrendingUp className="w-4 h-4 text-brand-600" />
                    Evolución Temporal de Votos Recibidos
                  </h4>
                  <div className="h-40 w-full">
                    <ResponsiveContainer width="100%" height="100%">
                      <AreaChart data={data.timeline}>
                        <XAxis dataKey="date" tick={{ fontSize: 10 }} />
                        <YAxis tick={{ fontSize: 10 }} />
                        <Tooltip
                          contentStyle={{
                            backgroundColor: '#0F172A',
                            borderRadius: '10px',
                            color: '#fff',
                            fontSize: '11px',
                          }}
                        />
                        <Area type="monotone" dataKey="total" name="Votos del Día" stroke="#4F46E5" fill="#4F46E5" fillOpacity={0.15} />
                      </AreaChart>
                    </ResponsiveContainer>
                  </div>
                </Card>
              )}

              {/* Comments Breakdown: Valid, Repeated, Discarded */}
              <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 grid grid-cols-3 gap-3 text-center text-xs">
                <div>
                  <span className="text-[10px] text-slate-500 block">Total Menciones</span>
                  <span className="font-bold text-slate-900 text-sm">{data.stats.totalCommentsReceived}</span>
                </div>
                <div>
                  <span className="text-[10px] text-slate-500 block">Votos Convalidados</span>
                  <span className="font-bold text-emerald-600 text-sm">{data.stats.totalVotes}</span>
                </div>
                <div>
                  <span className="text-[10px] text-slate-500 block">Descartados / Spam</span>
                  <span className="font-bold text-amber-600 text-sm">{data.stats.discardedCount}</span>
                </div>
              </div>

              {/* Comments Stream & Filter */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wider">
                    Comentarios y Votos Registrados ({filteredComments.length})
                  </h4>

                  {/* Filter Pills */}
                  <div className="inline-flex p-0.5 bg-slate-100 rounded-lg text-[10px]">
                    <button
                      onClick={() => setFilterType('ALL')}
                      className={`px-2 py-1 rounded-md font-medium transition-colors ${
                        filterType === 'ALL' ? 'bg-white text-brand-600 shadow-2xs font-bold' : 'text-slate-500'
                      }`}
                    >
                      Todos
                    </button>
                    <button
                      onClick={() => setFilterType('VALID')}
                      className={`px-2 py-1 rounded-md font-medium transition-colors ${
                        filterType === 'VALID' ? 'bg-white text-emerald-600 shadow-2xs font-bold' : 'text-slate-500'
                      }`}
                    >
                      Válidos
                    </button>
                    <button
                      onClick={() => setFilterType('DISCARDED')}
                      className={`px-2 py-1 rounded-md font-medium transition-colors ${
                        filterType === 'DISCARDED' ? 'bg-white text-amber-600 shadow-2xs font-bold' : 'text-slate-500'
                      }`}
                    >
                      Descartados
                    </button>
                  </div>
                </div>

                <div className="space-y-2 max-h-64 overflow-y-auto pr-1">
                  {filteredComments.length === 0 ? (
                    <p className="text-xs text-slate-400 italic text-center py-6">
                      No hay comentarios para el filtro seleccionado.
                    </p>
                  ) : (
                    filteredComments.map((c) => {
                      const isValid = c.status === 'VALID' || c.status === 'MANUALLY_APPROVED';
                      return (
                        <div
                          key={c.id}
                          className={`p-3 rounded-xl border text-xs space-y-1 transition-all ${
                            isValid
                              ? 'bg-white border-slate-200'
                              : 'bg-amber-50/50 border-amber-200/80 text-amber-950'
                          }`}
                        >
                          <div className="flex items-center justify-between">
                            <span className="font-semibold text-slate-800 flex items-center gap-1">
                              <span
                                className={`w-2 h-2 rounded-full ${
                                  c.platform === 'FACEBOOK' ? 'bg-[#1877F2]' : 'bg-[#E1306C]'
                                }`}
                              />
                              {c.author} ({c.platform})
                            </span>
                            <span className="text-[10px] text-slate-400">
                              {new Date(c.date).toLocaleDateString('es-ES')}
                            </span>
                          </div>
                          <p className="text-slate-700">{c.text}</p>
                          {!isValid && c.discardReason && (
                            <span className="text-[10px] text-amber-700 bg-amber-100/60 px-1.5 py-0.5 rounded block">
                              Motivo de descarte: {c.discardReason}
                            </span>
                          )}
                        </div>
                      );
                    })
                  )}
                </div>
              </div>
            </div>
          )}
        </motion.aside>
      </div>
    </AnimatePresence>
  );
};
