import React from 'react';
import { motion } from 'motion/react';
import {
  MessageSquare,
  TrendingUp,
  TrendingDown,
  Layers,
  CalendarDays,
  FileText,
  Clock,
} from 'lucide-react';
import { DashboardMetrics } from '../../types';
import { Card, CardContent } from '../ui/Card';
import { NumberCounter } from '../ui/NumberCounter';

interface StatCardsProps {
  metrics: DashboardMetrics | null;
  isLoading: boolean;
}

export const StatCards: React.FC<StatCardsProps> = ({ metrics, isLoading }) => {
  if (isLoading || !metrics) {
    return (
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
        {Array.from({ length: 6 }).map((_, i) => (
          <Card key={i} className="p-4 animate-pulse">
            <div className="h-4 w-24 bg-slate-200 rounded mb-3" />
            <div className="h-7 w-16 bg-slate-200 rounded mb-2" />
            <div className="h-3 w-28 bg-slate-100 rounded" />
          </Card>
        ))}
      </div>
    );
  }

  const {
    totalComments,
    facebookComments,
    instagramComments,
    todayComments,
    monitoredPosts,
    periodComparison,
  } = metrics;

  const cardsData = [
    {
      title: 'Total Comentarios',
      value: totalComments,
      icon: <MessageSquare className="w-4 h-4 text-brand-600" />,
      bgIcon: 'bg-brand-50',
      description: 'En el período seleccionado',
      trend: {
        value: `${periodComparison.percentageChange > 0 ? '+' : ''}${periodComparison.percentageChange}%`,
        isPositive: periodComparison.isPositive,
      },
    },
    {
      title: 'En Facebook',
      value: facebookComments,
      icon: <span className="w-2.5 h-2.5 rounded-full bg-facebook" />,
      bgIcon: 'bg-blue-50',
      description: `${metrics.platformDistribution.facebook.percentage}% del volumen total`,
    },
    {
      title: 'En Instagram',
      value: instagramComments,
      icon: <span className="w-2.5 h-2.5 rounded-full bg-instagram-pink" />,
      bgIcon: 'bg-pink-50',
      description: `${metrics.platformDistribution.instagram.percentage}% del volumen total`,
    },
    {
      title: 'Comentarios Hoy',
      value: todayComments,
      icon: <CalendarDays className="w-4 h-4 text-emerald-600" />,
      bgIcon: 'bg-emerald-50',
      description: 'Actividad registrada hoy',
    },
    {
      title: 'Posts Monitoreados',
      value: monitoredPosts,
      icon: <FileText className="w-4 h-4 text-slate-700" />,
      bgIcon: 'bg-slate-100',
      description: 'Contenido activo en Meta',
    },
    {
      title: 'Variación Período',
      isPercentageOnly: true,
      valueText: `${periodComparison.percentageChange > 0 ? '+' : ''}${periodComparison.percentageChange}%`,
      icon: periodComparison.isPositive ? (
        <TrendingUp className="w-4 h-4 text-emerald-600" />
      ) : (
        <TrendingDown className="w-4 h-4 text-rose-600" />
      ),
      bgIcon: periodComparison.isPositive ? 'bg-emerald-50' : 'bg-rose-50',
      description: `Frente al período anterior (${periodComparison.previousPeriodCount} comentarios)`,
      isPositive: periodComparison.isPositive,
    },
  ];

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
      {cardsData.map((item, index) => (
        <motion.div
          key={item.title}
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.25, delay: index * 0.04 }}
        >
          <Card className="h-full">
            <CardContent className="p-4 flex flex-col justify-between h-full">
              {/* Header row */}
              <div className="flex items-center justify-between gap-2 mb-2">
                <span className="text-xs font-medium text-text-muted truncate">
                  {item.title}
                </span>
                <span className={`p-1.5 rounded-lg ${item.bgIcon} shrink-0`}>
                  {item.icon}
                </span>
              </div>

              {/* Main value */}
              <div className="flex items-baseline gap-2 mb-1">
                {item.isPercentageOnly ? (
                  <span
                    className={`text-2xl font-bold tracking-tight ${
                      item.isPositive ? 'text-emerald-600' : 'text-rose-600'
                    }`}
                  >
                    {item.valueText}
                  </span>
                ) : (
                  <span className="text-2xl font-bold text-text-main tracking-tight">
                    <NumberCounter value={item.value || 0} />
                  </span>
                )}

                {item.trend && (
                  <span
                    className={`inline-flex items-center gap-0.5 text-xs font-semibold px-1.5 py-0.5 rounded ${
                      item.trend.isPositive
                        ? 'bg-emerald-50 text-emerald-700'
                        : 'bg-rose-50 text-rose-700'
                    }`}
                  >
                    {item.trend.isPositive ? (
                      <TrendingUp className="w-3 h-3" />
                    ) : (
                      <TrendingDown className="w-3 h-3" />
                    )}
                    {item.trend.value}
                  </span>
                )}
              </div>

              {/* Description */}
              <p className="text-[11px] text-slate-500 leading-tight">
                {item.description}
              </p>
            </CardContent>
          </Card>
        </motion.div>
      ))}
    </div>
  );
};
