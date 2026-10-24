import React, { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import {
  Trophy,
  Users,
  MessageSquare,
  CheckCircle2,
  Copy,
  Crown,
  Share2,
  RefreshCw,
  Sparkles,
  ArrowUpRight,
  ShieldCheck,
  TrendingUp,
} from 'lucide-react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Legend,
} from 'recharts';
import { VotingDashboardData, CategoryResultData } from '../../types';
import { apiService } from '../../services/api';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '../ui/Card';
import { Badge } from '../ui/Badge';
import { Button } from '../ui/Button';

interface VotingDashboardViewProps {
  onSelectCategory?: (categoryId: string) => void;
  onOpenCandidateDetail?: (candidateId: string) => void;
}

export const VotingDashboardView: React.FC<VotingDashboardViewProps> = ({
  onSelectCategory,
  onOpenCandidateDetail,
}) => {
  const [data, setData] = useState<VotingDashboardData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);

  const loadData = async () => {
    try {
      const res = await apiService.getVotingDashboard();
      setData(res);
    } catch (err) {
      console.error('Error al cargar dashboard de votaciones:', err);
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleRefresh = () => {
    setIsRefreshing(true);
    loadData();
  };

  if (isLoading || !data) {
    return (
      <div className="space-y-6 animate-pulse">
        <div className="h-28 bg-white rounded-2xl border border-slate-200" />
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {Array.from({ length: 8 }).map((_, i) => (
            <div key={i} className="h-24 bg-white rounded-xl border border-slate-200" />
          ))}
        </div>
        <div className="h-96 bg-white rounded-2xl border border-slate-200" />
      </div>
    );
  }

  const statCards = [
    {
      title: 'Categorías Registradas',
      value: data.totalCategories,
      subtitle: 'Convocatorias activas',
      icon: <Trophy className="w-4 h-4 text-brand-600" />,
      color: 'border-l-4 border-l-brand-600',
    },
    {
      title: 'Integrantes Participantes',
      value: data.totalCandidates,
      subtitle: 'En competencia',
      icon: <Users className="w-4 h-4 text-blue-600" />,
      color: 'border-l-4 border-l-blue-600',
    },
    {
      title: 'Comentarios Recibidos',
      value: data.totalCommentsReceived.toLocaleString(),
      subtitle: 'Total FB + IG importados',
      icon: <MessageSquare className="w-4 h-4 text-slate-600" />,
      color: 'border-l-4 border-l-slate-600',
    },
    {
      title: 'Votos Válidos Convalidados',
      value: data.totalValidVotes.toLocaleString(),
      subtitle: 'Conteo auditado',
      icon: <CheckCircle2 className="w-4 h-4 text-emerald-600" />,
      color: 'border-l-4 border-l-emerald-600',
    },
    {
      title: 'Comentarios Repetidos / Spam',
      value: data.totalRepeatedComments.toLocaleString(),
      subtitle: 'Filtrados sin inflar votos',
      icon: <Copy className="w-4 h-4 text-amber-600" />,
      color: 'border-l-4 border-l-amber-600',
    },
    {
      title: 'Votos Válidos Facebook',
      value: data.totalFacebookVotes.toLocaleString(),
      subtitle: `${data.platformDistribution.facebook.percentage}% de participación`,
      icon: <Share2 className="w-4 h-4 text-[#1877F2]" />,
      color: 'border-l-4 border-l-[#1877F2]',
    },
    {
      title: 'Votos Válidos Instagram',
      value: data.totalInstagramVotes.toLocaleString(),
      subtitle: `${data.platformDistribution.instagram.percentage}% de participación`,
      icon: <Share2 className="w-4 h-4 text-[#E1306C]" />,
      color: 'border-l-4 border-l-[#E1306C]',
    },
    {
      title: 'Líder General de Votos',
      value: data.topCandidateOverall ? data.topCandidateOverall.name : 'N/A',
      subtitle: data.topCandidateOverall ? `${data.topCandidateOverall.totalVotes} votos (${data.topCandidateOverall.categoryName})` : 'Sin votos aún',
      icon: <Crown className="w-4 h-4 text-amber-500" />,
      color: 'border-l-4 border-l-amber-500',
    },
  ];

  const pieData = [
    { name: 'Facebook', value: data.totalFacebookVotes, color: '#1877F2' },
    { name: 'Instagram', value: data.totalInstagramVotes, color: '#E1306C' },
  ];

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="bg-gradient-to-r from-slate-900 via-slate-800 to-indigo-950 p-6 rounded-3xl text-white shadow-xl relative overflow-hidden flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div className="relative z-10 space-y-1">
          <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-amber-400/20 text-amber-300 text-[11px] font-semibold border border-amber-400/30">
            <Crown className="w-3.5 h-3.5 text-amber-300" />
            Convocatoria Oficial Ébano 2026
          </div>
          <h2 className="text-xl sm:text-2xl font-black tracking-tight text-white">
            Conteo y Consolidación Oficial de Votaciones
          </h2>
          <p className="text-slate-300 text-xs sm:text-sm max-w-2xl leading-relaxed">
            Consolidación transparente y verificable de interacciones en Facebook e Instagram para la elección popular de integrantes por categoría.
          </p>
        </div>

        <div className="flex items-center gap-2 relative z-10 self-stretch sm:self-auto justify-end">
          <Button
            variant="outline"
            size="sm"
            onClick={handleRefresh}
            isLoading={isRefreshing}
            className="bg-white/10 hover:bg-white/20 text-white border-white/20"
            leftIcon={<RefreshCw className="w-3.5 h-3.5" />}
          >
            Actualizar Resultados
          </Button>
        </div>
      </div>

      {/* 8 Metric Cards Grid */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {statCards.map((card, idx) => (
          <motion.div
            key={card.title}
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: idx * 0.05 }}
          >
            <Card className={`p-4 bg-white shadow-2xs ${card.color} hover:shadow-md transition-shadow`}>
              <div className="flex items-center justify-between mb-1.5">
                <span className="text-[11px] font-semibold text-slate-500 line-clamp-1">{card.title}</span>
                {card.icon}
              </div>
              <div className="text-lg sm:text-xl font-black text-slate-900 tracking-tight truncate">
                {card.value}
              </div>
              <span className="text-[10px] text-slate-400 font-medium block truncate mt-0.5">
                {card.subtitle}
              </span>
            </Card>
          </motion.div>
        ))}
      </div>

      {/* Visualizations Section */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Comparative Chart: Facebook vs Instagram */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-sm font-bold flex items-center gap-2">
                  <TrendingUp className="w-4 h-4 text-brand-600" />
                  <span>Comparativa de Votos Válidos por Categoría</span>
                </CardTitle>
                <CardDescription className="text-xs">
                  Desglose de votos de Facebook frente a Instagram por categoría
                </CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            {data.categories.length === 0 ? (
              <p className="text-xs text-slate-400 text-center py-12">No hay categorías registradas.</p>
            ) : (
              <div className="h-72 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart
                    data={data.categories.map((c) => ({
                      name: c.name,
                      total: c.totalVotes,
                      líder: c.leader ? `${c.leader.name} (${c.leader.totalVotes})` : 'Sin votos',
                    }))}
                    margin={{ top: 20, right: 30, left: 0, bottom: 20 }}
                  >
                    <XAxis dataKey="name" tick={{ fontSize: 11 }} />
                    <YAxis tick={{ fontSize: 11 }} />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: '#0F172A',
                        borderRadius: '12px',
                        color: '#fff',
                        fontSize: '12px',
                        border: 'none',
                      }}
                    />
                    <Bar dataKey="total" name="Total Votos Consolidados" fill="#4F46E5" radius={[6, 6, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Platform Distribution Pie */}
        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-bold flex items-center gap-2">
              <Share2 className="w-4 h-4 text-brand-600" />
              <span>Distribución por Red Social</span>
            </CardTitle>
            <CardDescription className="text-xs">
              Participación porcentual en Facebook vs Instagram
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-56 w-full flex items-center justify-center">
              {data.totalValidVotes === 0 ? (
                <p className="text-xs text-slate-400">Sin votos registrados</p>
              ) : (
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={pieData}
                      cx="50%"
                      cy="50%"
                      innerRadius={50}
                      outerRadius={75}
                      paddingAngle={4}
                      dataKey="value"
                    >
                      {pieData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip
                      formatter={(val: any) => [`${val} votos`, 'Total']}
                      contentStyle={{
                        backgroundColor: '#0F172A',
                        borderRadius: '10px',
                        color: '#fff',
                        fontSize: '11px',
                      }}
                    />
                    <Legend iconType="circle" wrapperStyle={{ fontSize: '11px' }} />
                  </PieChart>
                </ResponsiveContainer>
              )}
            </div>

            <div className="grid grid-cols-2 gap-2 mt-2 pt-2 border-t border-slate-100 text-center">
              <div className="p-2 bg-blue-50/70 rounded-lg">
                <span className="text-[10px] text-blue-700 font-semibold block">Facebook</span>
                <span className="text-sm font-black text-blue-900">{data.totalFacebookVotes}</span>
              </div>
              <div className="p-2 bg-pink-50/70 rounded-lg">
                <span className="text-[10px] text-pink-700 font-semibold block">Instagram</span>
                <span className="text-sm font-black text-pink-900">{data.totalInstagramVotes}</span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Categories Showcase Cards */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="text-base font-bold text-slate-900">Categorías y Líderes en Competencia</h3>
            <p className="text-xs text-slate-500">Haz clic en una categoría para consultar la tabla comparativa oficial completa</p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          {data.categories.map((cat) => (
            <Card
              key={cat.id}
              onClick={() => onSelectCategory?.(cat.id)}
              className="group cursor-pointer hover:border-brand-300 transition-all shadow-2xs hover:shadow-md p-5 flex flex-col justify-between"
            >
              <div>
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-brand-50 text-brand-700 border border-brand-200">
                      {cat.edition}
                    </span>
                    <Badge variant={cat.status === 'DEFINITIVE' ? 'success' : 'warning'} size="sm">
                      {cat.status === 'DEFINITIVE' ? 'Ganador Definitivo' : 'Ganador Provisional'}
                    </Badge>
                  </div>
                  <span className="text-xs font-semibold text-brand-600 flex items-center gap-1 group-hover:translate-x-1 transition-transform">
                    Ver Resultados <ArrowUpRight className="w-3.5 h-3.5" />
                  </span>
                </div>

                <h4 className="text-base font-bold text-slate-900 group-hover:text-brand-600 transition-colors">
                  {cat.name}
                </h4>
                <p className="text-xs text-slate-500 mt-0.5">
                  Regla de conteo: <strong>{cat.votingPolicy.replace(/_/g, ' ')}</strong>
                </p>

                {/* Leader Box */}
                {cat.leader ? (
                  <div className="mt-4 p-3 bg-gradient-to-r from-amber-50 to-orange-50/50 rounded-xl border border-amber-200 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      {cat.leader.photoUrl ? (
                        <img
                          src={cat.leader.photoUrl}
                          alt={cat.leader.name}
                          className="w-10 h-10 rounded-full object-cover border-2 border-amber-400"
                        />
                      ) : (
                        <div className="w-10 h-10 rounded-full bg-amber-400 text-amber-950 flex items-center justify-center font-black">
                          1
                        </div>
                      )}
                      <div>
                        <span className="text-[10px] uppercase font-bold text-amber-800 tracking-wider block">
                          1er Lugar Actual
                        </span>
                        <span className="text-xs font-bold text-amber-950">{cat.leader.name}</span>
                      </div>
                    </div>
                    <span className="text-sm font-black text-amber-900 bg-amber-200/80 px-2.5 py-1 rounded-lg">
                      {cat.leader.totalVotes} votos
                    </span>
                  </div>
                ) : (
                  <div className="mt-4 p-3 bg-slate-50 rounded-xl border border-slate-200 text-center text-xs text-slate-400">
                    Aún no se han registrado votos en esta categoría
                  </div>
                )}
              </div>

              {/* Top 3 Participants preview */}
              {cat.topCandidates && cat.topCandidates.length > 0 && (
                <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
                  <span>{cat.candidatesCount} participantes</span>
                  <div className="flex items-center gap-1 font-semibold text-slate-700">
                    <span>Total Categoría:</span>
                    <strong className="text-slate-900 font-bold">{cat.totalVotes} votos</strong>
                  </div>
                </div>
              )}
            </Card>
          ))}
        </div>
      </div>
    </div>
  );
};
