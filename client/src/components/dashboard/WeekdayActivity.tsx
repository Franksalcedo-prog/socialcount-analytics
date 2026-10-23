import React from 'react';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
} from 'recharts';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '../ui/Card';

interface WeekdayActivityProps {
  data: Array<{
    day: string;
    dayNumber: number;
    facebook: number;
    instagram: number;
    total: number;
  }>;
}

const CustomBarTooltip = ({ active, payload, label }: any) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-slate-900 text-white p-2.5 rounded-lg shadow-xl text-xs space-y-1 border border-slate-800">
        <p className="font-semibold text-slate-200 border-b border-slate-800 pb-1">{label}</p>
        <p className="text-blue-300">Facebook: {payload.find((p: any) => p.dataKey === 'facebook')?.value || 0}</p>
        <p className="text-pink-300">Instagram: {payload.find((p: any) => p.dataKey === 'instagram')?.value || 0}</p>
        <p className="font-bold text-white pt-0.5 border-t border-slate-800">
          Total: {payload.find((p: any) => p.dataKey === 'total')?.value || 0}
        </p>
      </div>
    );
  }
  return null;
};

export const WeekdayActivity: React.FC<WeekdayActivityProps> = ({ data }) => {
  return (
    <Card className="h-full">
      <CardHeader>
        <CardTitle>Actividad por Día de la Semana</CardTitle>
        <CardDescription>
          Momentos de mayor interacción y volumen de respuestas de los usuarios
        </CardDescription>
      </CardHeader>

      <CardContent>
        <div className="h-64 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={data} margin={{ top: 10, right: 10, left: -25, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#F1F5F9" />
              <XAxis
                dataKey="day"
                tick={{ fontSize: 11, fill: '#64748B' }}
                axisLine={false}
                tickLine={false}
              />
              <YAxis
                tick={{ fontSize: 11, fill: '#94A3B8' }}
                axisLine={false}
                tickLine={false}
                allowDecimals={false}
              />
              <Tooltip content={<CustomBarTooltip />} />
              <Bar dataKey="facebook" name="Facebook" stackId="a" fill="#1877F2" radius={[0, 0, 0, 0]} />
              <Bar dataKey="instagram" name="Instagram" stackId="a" fill="#E1306C" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  );
};
