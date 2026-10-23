import React from 'react';
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
} from 'recharts';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '../ui/Card';

interface EvolutionChartProps {
  data: Array<{
    date: string;
    total: number;
    facebook: number;
    instagram: number;
  }>;
  isLoading?: boolean;
}

const CustomTooltip = ({ active, payload, label }: any) => {
  if (active && payload && payload.length) {
    const formattedDate = new Date(label).toLocaleDateString('es-ES', {
      weekday: 'short',
      day: 'numeric',
      month: 'short',
    });

    return (
      <div className="bg-slate-900 text-white p-3 rounded-lg shadow-xl text-xs space-y-1.5 border border-slate-800">
        <p className="font-semibold text-slate-200 border-b border-slate-800 pb-1 capitalize">
          {formattedDate}
        </p>
        <div className="flex items-center justify-between gap-4">
          <span className="flex items-center gap-1.5 text-slate-300">
            <span className="w-2 h-2 rounded-full bg-brand-500" /> Total:
          </span>
          <span className="font-bold text-white">
            {payload.find((p: any) => p.dataKey === 'total')?.value || 0}
          </span>
        </div>
        <div className="flex items-center justify-between gap-4">
          <span className="flex items-center gap-1.5 text-blue-300">
            <span className="w-2 h-2 rounded-full bg-facebook" /> Facebook:
          </span>
          <span className="font-semibold text-blue-200">
            {payload.find((p: any) => p.dataKey === 'facebook')?.value || 0}
          </span>
        </div>
        <div className="flex items-center justify-between gap-4">
          <span className="flex items-center gap-1.5 text-pink-300">
            <span className="w-2 h-2 rounded-full bg-instagram-pink" /> Instagram:
          </span>
          <span className="font-semibold text-pink-200">
            {payload.find((p: any) => p.dataKey === 'instagram')?.value || 0}
          </span>
        </div>
      </div>
    );
  }
  return null;
};

export const EvolutionChart: React.FC<EvolutionChartProps> = ({ data, isLoading }) => {
  if (isLoading || !data || data.length === 0) {
    return (
      <Card className="h-80 flex flex-col justify-center items-center">
        <p className="text-xs text-slate-400">Cargando gráfico de evolución...</p>
      </Card>
    );
  }

  const formatXAxis = (tickItem: string) => {
    try {
      const parts = tickItem.split('-');
      if (parts.length === 3) {
        return `${parts[2]}/${parts[1]}`;
      }
      return tickItem;
    } catch {
      return tickItem;
    }
  };

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between pb-2">
        <div>
          <CardTitle>Evolución Temporal de Comentarios</CardTitle>
          <CardDescription>
            Volumen diario recolectado a través de Facebook e Instagram
          </CardDescription>
        </div>
        <div className="flex items-center gap-3 text-xs">
          <span className="flex items-center gap-1 text-slate-600">
            <span className="w-2.5 h-2.5 rounded-full bg-brand-600" /> Total
          </span>
          <span className="flex items-center gap-1 text-slate-600">
            <span className="w-2.5 h-2.5 rounded-full bg-facebook" /> Facebook
          </span>
          <span className="flex items-center gap-1 text-slate-600">
            <span className="w-2.5 h-2.5 rounded-full bg-instagram-pink" /> Instagram
          </span>
        </div>
      </CardHeader>

      <CardContent className="pt-2">
        <div className="h-72 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={data} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
              <defs>
                <linearGradient id="colorTotal" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#4F46E5" stopOpacity={0.25} />
                  <stop offset="95%" stopColor="#4F46E5" stopOpacity={0.0} />
                </linearGradient>
                <linearGradient id="colorFb" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#1877F2" stopOpacity={0.2} />
                  <stop offset="95%" stopColor="#1877F2" stopOpacity={0.0} />
                </linearGradient>
                <linearGradient id="colorIg" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#E1306C" stopOpacity={0.2} />
                  <stop offset="95%" stopColor="#E1306C" stopOpacity={0.0} />
                </linearGradient>
              </defs>

              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#F1F5F9" />

              <XAxis
                dataKey="date"
                tickFormatter={formatXAxis}
                tick={{ fontSize: 11, fill: '#94A3B8' }}
                axisLine={false}
                tickLine={false}
              />
              <YAxis
                tick={{ fontSize: 11, fill: '#94A3B8' }}
                axisLine={false}
                tickLine={false}
                allowDecimals={false}
              />

              <Tooltip content={<CustomTooltip />} />

              <Area
                type="monotone"
                dataKey="total"
                stroke="#4F46E5"
                strokeWidth={2.5}
                fillOpacity={1}
                fill="url(#colorTotal)"
              />
              <Area
                type="monotone"
                dataKey="facebook"
                stroke="#1877F2"
                strokeWidth={1.5}
                strokeDasharray="4 4"
                fillOpacity={1}
                fill="url(#colorFb)"
              />
              <Area
                type="monotone"
                dataKey="instagram"
                stroke="#E1306C"
                strokeWidth={1.5}
                strokeDasharray="4 4"
                fillOpacity={1}
                fill="url(#colorIg)"
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  );
};
