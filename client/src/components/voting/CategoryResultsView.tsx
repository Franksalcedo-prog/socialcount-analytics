import React, { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import {
  Trophy,
  Crown,
  FileSpreadsheet,
  Printer,
  RefreshCw,
  Search,
  Users,
  Share2,
  CheckCircle2,
  AlertCircle,
  ChevronRight,
  TrendingUp,
  User,
} from 'lucide-react';
import { CategoryItem, CategoryResultData } from '../../types';
import { apiService } from '../../services/api';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '../ui/Card';
import { Badge } from '../ui/Badge';
import { Button } from '../ui/Button';

interface CategoryResultsViewProps {
  initialCategoryId?: string | null;
  onOpenCandidateDetail?: (candidateId: string) => void;
}

export const CategoryResultsView: React.FC<CategoryResultsViewProps> = ({
  initialCategoryId,
  onOpenCandidateDetail,
}) => {
  const [categories, setCategories] = useState<CategoryItem[]>([]);
  const [selectedCategoryId, setSelectedCategoryId] = useState<string>('');
  const [results, setResults] = useState<CategoryResultData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isProcessing, setIsProcessing] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');

  // 1. Cargar lista de categorías
  useEffect(() => {
    const loadCategories = async () => {
      try {
        const list = await apiService.getVotingCategories();
        setCategories(list);
        if (list.length > 0) {
          const defaultCat = initialCategoryId && list.some((c) => c.id === initialCategoryId)
            ? initialCategoryId
            : list[0].id;
          setSelectedCategoryId(defaultCat);
        }
      } catch (err) {
        console.error('Error al cargar categorías:', err);
      }
    };
    loadCategories();
  }, [initialCategoryId]);

  // 2. Cargar resultados cuando cambie la categoría seleccionada
  useEffect(() => {
    if (!selectedCategoryId) return;

    const loadResults = async () => {
      setIsLoading(true);
      try {
        const res = await apiService.getCategoryResults(selectedCategoryId);
        setResults(res);
      } catch (err) {
        console.error('Error al cargar resultados de categoría:', err);
      } finally {
        setIsLoading(false);
      }
    };

    loadResults();
  }, [selectedCategoryId]);

  const handleProcessVotes = async () => {
    if (!selectedCategoryId) return;
    setIsProcessing(true);
    try {
      const res = await apiService.processCategoryVotes(selectedCategoryId);
      setResults(res);
    } catch (err) {
      console.error('Error al reprocesar votos:', err);
    } finally {
      setIsProcessing(false);
    }
  };

  const handlePrint = () => {
    window.print();
  };

  const filteredRanking = results?.candidatesRanking.filter((c) =>
    c.name.toLowerCase().includes(searchTerm.toLowerCase())
  ) || [];

  return (
    <div className="space-y-6">
      {/* Category Selection & Action Toolbar */}
      <div className="bg-white p-4 rounded-2xl border border-border-ui shadow-2xs flex flex-col md:flex-row items-center justify-between gap-4">
        {/* Category Switcher Dropdown */}
        <div className="flex items-center gap-2 w-full md:w-auto">
          <Trophy className="w-4 h-4 text-brand-600 shrink-0" />
          <span className="text-xs font-semibold text-slate-700">Categoría:</span>
          <select
            value={selectedCategoryId}
            onChange={(e) => setSelectedCategoryId(e.target.value)}
            className="text-xs font-bold text-slate-900 bg-slate-50 border border-slate-200 rounded-lg px-3 py-1.5 focus:outline-none focus:ring-2 focus:ring-brand-500/20"
          >
            {categories.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name} ({c.edition}) - {c.status}
              </option>
            ))}
          </select>
        </div>

        {/* Action Buttons: Export, Recalculate, Print */}
        <div className="flex items-center gap-2 w-full md:w-auto justify-end">
          <Button
            variant="outline"
            size="sm"
            onClick={handleProcessVotes}
            isLoading={isProcessing}
            leftIcon={<RefreshCw className="w-3.5 h-3.5" />}
          >
            Recalcular Votos
          </Button>

          {selectedCategoryId && (
            <a
              href={apiService.getVotingCsvExportUrl(selectedCategoryId)}
              download
              className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold rounded-lg border border-slate-200 transition-colors"
            >
              <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-600" />
              <span>Exportar Excel</span>
            </a>
          )}

          <Button
            variant="outline"
            size="sm"
            onClick={handlePrint}
            leftIcon={<Printer className="w-3.5 h-3.5" />}
          >
            Imprimir
          </Button>
        </div>
      </div>

      {isLoading || !results ? (
        <Card className="p-12 text-center text-xs text-slate-400 animate-pulse">
          Cargando y consolidando resultados de votación...
        </Card>
      ) : (
        <>
          {/* Official Results Header */}
          <div className="bg-gradient-to-r from-slate-900 to-indigo-950 p-6 rounded-2xl text-white shadow-lg flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
            <div>
              <div className="flex items-center gap-2 mb-1">
                <Badge variant={results.categoryStatus === 'DEFINITIVE' ? 'success' : 'warning'} size="sm">
                  {results.categoryStatus === 'DEFINITIVE' ? 'GANADOR DEFINITIVO' : 'RESULTADOS PROVISIONALES'}
                </Badge>
                <span className="text-xs text-indigo-200">
                  Regla: <strong>{results.votingPolicy.replace(/_/g, ' ')}</strong>
                </span>
              </div>
              <h2 className="text-xl font-black text-white">{results.categoryName}</h2>
              <p className="text-xs text-slate-300 mt-1">
                Total de participantes: <strong>{results.candidatesRanking.length}</strong> | Comentarios auditados:{' '}
                <strong>{results.totalCommentsAnalyzed}</strong> | Descartados: <strong>{results.totalDiscardedComments}</strong>
              </p>
            </div>

            {/* Consolidated Winner Highlight */}
            {results.leader ? (
              <div className="bg-white/10 backdrop-blur-md p-3.5 rounded-xl border border-white/20 flex items-center gap-3">
                {results.leader.photoUrl ? (
                  <img
                    src={results.leader.photoUrl}
                    alt={results.leader.name}
                    className="w-12 h-12 rounded-full object-cover border-2 border-amber-400"
                  />
                ) : (
                  <div className="w-12 h-12 rounded-full bg-amber-400 text-amber-950 flex items-center justify-center font-black text-lg">
                    1
                  </div>
                )}
                <div>
                  <span className="text-[10px] font-bold text-amber-300 uppercase tracking-wider block flex items-center gap-1">
                    <Crown className="w-3 h-3 text-amber-300" /> Primer Lugar Consolidado
                  </span>
                  <span className="text-sm font-bold text-white block">{results.leader.name}</span>
                  <span className="text-xs font-semibold text-indigo-200">
                    {results.leader.totalVotes} votos totales
                  </span>
                </div>
              </div>
            ) : (
              <div className="text-xs text-indigo-200 italic">No hay votos válidos registrados aún</div>
            )}
          </div>

          {/* Quick Metrics Grid */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            <Card className="p-4 bg-white border-l-4 border-l-brand-600">
              <span className="text-[11px] text-slate-500 font-semibold block">Total Votos Consolidados</span>
              <span className="text-xl font-black text-slate-900">{results.totalValidVotes}</span>
              <span className="text-[10px] text-slate-400 block mt-0.5">Facebook + Instagram</span>
            </Card>

            <Card className="p-4 bg-white border-l-4 border-l-[#1877F2]">
              <span className="text-[11px] text-slate-500 font-semibold block">Votos Facebook</span>
              <span className="text-xl font-black text-[#1877F2]">{results.totalFacebookVotes}</span>
              <span className="text-[10px] text-slate-400 block mt-0.5">
                {results.totalValidVotes > 0
                  ? `${Math.round((results.totalFacebookVotes / results.totalValidVotes) * 100)}% de los votos`
                  : '0%'}
              </span>
            </Card>

            <Card className="p-4 bg-white border-l-4 border-l-[#E1306C]">
              <span className="text-[11px] text-slate-500 font-semibold block">Votos Instagram</span>
              <span className="text-xl font-black text-[#E1306C]">{results.totalInstagramVotes}</span>
              <span className="text-[10px] text-slate-400 block mt-0.5">
                {results.totalValidVotes > 0
                  ? `${Math.round((results.totalInstagramVotes / results.totalValidVotes) * 100)}% de los votos`
                  : '0%'}
              </span>
            </Card>

            <Card className="p-4 bg-white border-l-4 border-l-amber-500">
              <span className="text-[11px] text-slate-500 font-semibold block">Comentarios Repetidos</span>
              <span className="text-xl font-black text-amber-600">{results.totalRepeatedComments}</span>
              <span className="text-[10px] text-slate-400 block mt-0.5">Deduplicados sin inflar</span>
            </Card>
          </div>

          {/* Search bar inside ranking table */}
          <div className="flex items-center justify-between gap-4">
            <div className="relative w-full sm:w-72">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Buscar integrante por nombre..."
                className="w-full pl-9 pr-3 py-1.5 text-xs bg-white border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-500/20"
              />
            </div>

            <span className="text-xs text-slate-500">
              Fórmula Oficial: <code>Total = Votos Facebook + Votos Instagram</code>
            </span>
          </div>

          {/* Official Comparative Table (Especificación de Sección 3) */}
          <Card className="overflow-hidden shadow-2xs">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 border-b border-border-ui text-slate-500 font-semibold uppercase tracking-wider text-[10px]">
                  <tr>
                    <th className="py-3 px-4 text-center w-16">Posición</th>
                    <th className="py-3 px-4">Integrante</th>
                    <th className="py-3 px-4 text-right">Facebook</th>
                    <th className="py-3 px-4 text-right">Instagram</th>
                    <th className="py-3 px-4 text-right font-black">Total</th>
                    <th className="py-3 px-4 text-right">Porcentaje</th>
                    <th className="py-3 px-4 text-right">Diferencia 1°</th>
                    <th className="py-3 px-4 text-center">Acciones</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {filteredRanking.length === 0 ? (
                    <tr>
                      <td colSpan={8} className="py-8 text-center text-slate-400 italic">
                        No se encontraron integrantes que coincidan con la búsqueda.
                      </td>
                    </tr>
                  ) : (
                    filteredRanking.map((cand) => (
                      <tr
                        key={cand.id}
                        onClick={() => onOpenCandidateDetail?.(cand.id)}
                        className={`hover:bg-slate-50/80 cursor-pointer transition-colors ${
                          cand.isWinner ? 'bg-amber-50/30' : ''
                        }`}
                      >
                        {/* Posición / Rank */}
                        <td className="py-3 px-4 text-center font-bold">
                          {cand.rank === 1 ? (
                            <span className="inline-flex items-center justify-center w-6 h-6 rounded-full bg-amber-400 text-amber-950 text-xs font-black shadow-2xs">
                              1
                            </span>
                          ) : cand.rank === 2 ? (
                            <span className="inline-flex items-center justify-center w-6 h-6 rounded-full bg-slate-300 text-slate-800 text-xs font-black shadow-2xs">
                              2
                            </span>
                          ) : cand.rank === 3 ? (
                            <span className="inline-flex items-center justify-center w-6 h-6 rounded-full bg-amber-700/20 text-amber-900 text-xs font-black shadow-2xs">
                              3
                            </span>
                          ) : (
                            <span className="text-slate-400 font-semibold">#{cand.rank}</span>
                          )}
                        </td>

                        {/* Integrante con Foto y Número */}
                        <td className="py-3 px-4">
                          <div className="flex items-center gap-2.5">
                            {cand.photoUrl ? (
                              <img
                                src={cand.photoUrl}
                                alt={cand.name}
                                className="w-8 h-8 rounded-full object-cover border border-slate-200"
                              />
                            ) : (
                              <div className="w-8 h-8 rounded-full bg-slate-100 border border-slate-200 flex items-center justify-center text-slate-400">
                                <User className="w-4 h-4" />
                              </div>
                            )}
                            <div>
                              <div className="font-bold text-slate-900 flex items-center gap-1.5">
                                <span>{cand.name}</span>
                                {cand.isWinner && (
                                  <Badge variant="warning" size="sm">
                                    Líder
                                  </Badge>
                                )}
                              </div>
                              {cand.number && (
                                <span className="text-[10px] text-slate-400">Número #{cand.number}</span>
                              )}
                            </div>
                          </div>
                        </td>

                        {/* Facebook */}
                        <td className="py-3 px-4 text-right font-semibold text-blue-700">
                          {cand.facebookVotes}
                        </td>

                        {/* Instagram */}
                        <td className="py-3 px-4 text-right font-semibold text-pink-700">
                          {cand.instagramVotes}
                        </td>

                        {/* Total Consolidado */}
                        <td className="py-3 px-4 text-right font-black text-slate-900 text-sm">
                          {cand.totalVotes}
                        </td>

                        {/* Porcentaje */}
                        <td className="py-3 px-4 text-right">
                          <div className="inline-flex items-center gap-1.5">
                            <div className="w-16 h-1.5 bg-slate-100 rounded-full overflow-hidden hidden sm:block">
                              <div
                                className="h-full bg-brand-600 rounded-full"
                                style={{ width: `${Math.min(cand.percentage, 100)}%` }}
                              />
                            </div>
                            <span className="font-bold text-slate-800">{cand.percentage}%</span>
                          </div>
                        </td>

                        {/* Diferencia vs 1er Lugar */}
                        <td className="py-3 px-4 text-right">
                          {cand.rank === 1 ? (
                            <span className="text-[11px] font-semibold text-amber-700 bg-amber-100/70 px-2 py-0.5 rounded">
                              Líder
                            </span>
                          ) : (
                            <span className="text-[11px] font-medium text-slate-500">
                              -{cand.differenceFromLeader}
                            </span>
                          )}
                        </td>

                        {/* Acciones */}
                        <td className="py-3 px-4 text-center" onClick={(e) => e.stopPropagation()}>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => onOpenCandidateDetail?.(cand.id)}
                            className="text-[11px] py-1 px-2.5 h-auto"
                          >
                            Ver Ficha
                          </Button>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </Card>
        </>
      )}
    </div>
  );
};
