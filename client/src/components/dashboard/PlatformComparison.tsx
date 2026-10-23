import React from 'react';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '../ui/Card';
import { NumberCounter } from '../ui/NumberCounter';

interface PlatformComparisonProps {
  distribution: {
    facebook: { count: number; percentage: number };
    instagram: { count: number; percentage: number };
  };
  totalComments: number;
}

export const PlatformComparison: React.FC<PlatformComparisonProps> = ({
  distribution,
  totalComments,
}) => {
  const fb = distribution.facebook;
  const ig = distribution.instagram;

  return (
    <Card className="h-full">
      <CardHeader>
        <CardTitle>Comparativa de Actividad por Plataforma</CardTitle>
        <CardDescription>
          Distribución de volumen entre Facebook Pages e Instagram Profesional
        </CardDescription>
      </CardHeader>

      <CardContent className="space-y-6">
        {/* Visual Progress Bar */}
        <div>
          <div className="flex justify-between items-center text-xs font-semibold mb-2">
            <span className="flex items-center gap-1.5 text-facebook">
              <span className="w-2.5 h-2.5 rounded-full bg-facebook" /> Facebook ({fb.percentage}%)
            </span>
            <span className="flex items-center gap-1.5 text-instagram-pink">
              Instagram ({ig.percentage}%) <span className="w-2.5 h-2.5 rounded-full bg-instagram-pink" />
            </span>
          </div>

          <div className="h-3 w-full bg-slate-100 rounded-full overflow-hidden flex p-0.5 border border-slate-200">
            <div
              className="h-full bg-facebook rounded-l-full transition-all duration-700 ease-out"
              style={{ width: `${Math.max(fb.percentage, 2)}%` }}
            />
            <div
              className="h-full bg-ig-gradient rounded-r-full transition-all duration-700 ease-out"
              style={{ width: `${Math.max(ig.percentage, 2)}%` }}
            />
          </div>
        </div>

        {/* Detailed Metrics Grid */}
        <div className="grid grid-cols-2 gap-4 pt-2">
          {/* Facebook Card */}
          <div className="p-4 rounded-xl bg-blue-50/50 border border-blue-100 flex flex-col justify-between">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-semibold text-slate-700">Facebook</span>
              <span className="text-[10px] bg-white text-facebook font-bold px-1.5 py-0.5 rounded border border-blue-200">
                Páginas
              </span>
            </div>
            <div>
              <span className="text-2xl font-bold text-slate-900 tracking-tight block">
                <NumberCounter value={fb.count} />
              </span>
              <span className="text-[11px] text-slate-500">Comentarios recibidos</span>
            </div>
          </div>

          {/* Instagram Card */}
          <div className="p-4 rounded-xl bg-pink-50/50 border border-pink-100 flex flex-col justify-between">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-semibold text-slate-700">Instagram</span>
              <span className="text-[10px] bg-white text-instagram-pink font-bold px-1.5 py-0.5 rounded border border-pink-200">
                Profesional
              </span>
            </div>
            <div>
              <span className="text-2xl font-bold text-slate-900 tracking-tight block">
                <NumberCounter value={ig.count} />
              </span>
              <span className="text-[11px] text-slate-500">Comentarios recibidos</span>
            </div>
          </div>
        </div>

        {/* Summary Footer Insight */}
        <div className="p-3 bg-slate-50 rounded-lg border border-slate-200/80 text-xs text-slate-600 flex items-center justify-between">
          <span>Plataforma líder del período:</span>
          <span className="font-bold text-slate-900">
            {fb.count >= ig.count ? 'Facebook (+ ' + (fb.count - ig.count) + ')' : 'Instagram (+ ' + (ig.count - fb.count) + ')'}
          </span>
        </div>
      </CardContent>
    </Card>
  );
};
