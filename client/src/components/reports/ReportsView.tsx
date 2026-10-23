import React, { useState, useEffect } from 'react';
import {
  FileSpreadsheet,
  Download,
  Calendar,
  Printer,
  CheckCircle2,
  TrendingUp,
  BarChart,
  FileCheck,
} from 'lucide-react';
import { DashboardMetrics } from '../../types';
import { apiService } from '../../services/api';
import { useFilters } from '../../context/FilterContext';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '../ui/Card';
import { Button } from '../ui/Button';
import { Badge } from '../ui/Badge';

export const ReportsView: React.FC = () => {
  const { platform, preset, startDate, endDate } = useFilters();
  const [metrics, setMetrics] = useState<DashboardMetrics | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchReportData = async () => {
      setIsLoading(true);
      try {
        const data = await apiService.getDashboardMetrics({
          platform,
          startDate: startDate || undefined,
          endDate: endDate || undefined,
        });
        setMetrics(data);
      } catch (e) {
        console.error('Error al cargar métricas para informe:', e);
      } finally {
        setIsLoading(false);
      }
    };

    fetchReportData();
  }, [platform, startDate, endDate]);

  const handleDownloadCsv = () => {
    const url = apiService.getCsvExportUrl({
      platform,
      startDate: startDate || undefined,
      endDate: endDate || undefined,
    });
    window.open(url, '_blank');
  };

  const handlePrint = () => {
    window.print();
  };

  const generationDate = new Date().toLocaleString('es-ES', {
    dateStyle: 'long',
    timeStyle: 'short',
  });

  return (
    <div className="space-y-6">
      {/* Action Toolbar */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 bg-white p-5 rounded-2xl border border-border-ui shadow-2xs">
        <div>
          <h2 className="text-base font-bold text-slate-900 tracking-tight">
            Informes Analíticos Ejecutivos
          </h2>
          <p className="text-xs text-text-muted mt-0.5">
            Genera reportes de rendimiento y exporta registros consolidados en formato CSV
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={handlePrint}
            leftIcon={<Printer className="w-4 h-4" />}
          >
            Imprimir / Guardar PDF
          </Button>
          <Button
            variant="primary"
            size="sm"
            onClick={handleDownloadCsv}
            leftIcon={<Download className="w-4 h-4" />}
          >
            Descargar CSV Completo
          </Button>
        </div>
      </div>

      {/* Printable Report Document Card */}
      <Card className="p-8 bg-white border border-slate-200 print:shadow-none print:border-none">
        {/* Document Header */}
        <div className="border-b border-slate-200 pb-6 mb-6 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="text-lg font-black tracking-tight text-slate-900">SocialCount Analytics</span>
              <span className="text-[10px] uppercase font-bold bg-brand-50 text-brand-700 px-2 py-0.5 rounded border border-brand-200">
                Informe Oficial
              </span>
            </div>
            <h1 className="text-xl font-bold text-slate-800">
              Reporte de Interacción y Conteo de Comentarios
            </h1>
            <p className="text-xs text-slate-500 mt-1">
              Alcance de datos: Meta Graph API (Facebook Pages & Instagram Business)
            </p>
          </div>

          <div className="text-right text-xs space-y-1 text-slate-500">
            <div>
              <strong>Fecha de Emisión:</strong> {generationDate}
            </div>
            <div>
              <strong>Período evaluado:</strong> {preset.toUpperCase()}
            </div>
            <div>
              <strong>Filtro Plataforma:</strong> {platform}
            </div>
          </div>
        </div>

        {/* Executive Summary Grid */}
        {isLoading || !metrics ? (
          <div className="h-40 flex items-center justify-center text-xs text-slate-400">
            Generando consolidado de datos...
          </div>
        ) : (
          <div className="space-y-6">
            <div>
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-3">
                1. Resumen Consolidado de Volúmenes
              </h3>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                <div className="p-4 rounded-xl bg-slate-50 border border-slate-200/80">
                  <span className="text-xs text-slate-500 block mb-1">Total Comentarios</span>
                  <span className="text-2xl font-bold text-slate-900">{metrics.totalComments}</span>
                  <span className="text-[11px] text-slate-400 block mt-1">Verificados en BD</span>
                </div>

                <div className="p-4 rounded-xl bg-blue-50/60 border border-blue-100">
                  <span className="text-xs text-facebook block mb-1 font-medium">Facebook Pages</span>
                  <span className="text-2xl font-bold text-slate-900">{metrics.facebookComments}</span>
                  <span className="text-[11px] text-slate-500 block mt-1">
                    {metrics.platformDistribution.facebook.percentage}% de participación
                  </span>
                </div>

                <div className="p-4 rounded-xl bg-pink-50/60 border border-pink-100">
                  <span className="text-xs text-instagram-pink block mb-1 font-medium">Instagram Business</span>
                  <span className="text-2xl font-bold text-slate-900">{metrics.instagramComments}</span>
                  <span className="text-[11px] text-slate-500 block mt-1">
                    {metrics.platformDistribution.instagram.percentage}% de participación
                  </span>
                </div>

                <div className="p-4 rounded-xl bg-emerald-50/60 border border-emerald-100">
                  <span className="text-xs text-emerald-800 block mb-1 font-medium">Variación Período</span>
                  <span className="text-2xl font-bold text-slate-900">
                    {metrics.periodComparison.percentageChange > 0 ? '+' : ''}
                    {metrics.periodComparison.percentageChange}%
                  </span>
                  <span className="text-[11px] text-slate-500 block mt-1">
                    vs período anterior ({metrics.periodComparison.previousPeriodCount})
                  </span>
                </div>
              </div>
            </div>

            {/* Top Posts Breakdown */}
            <div>
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-3">
                2. Contenido con Mayor Índice de Participación
              </h3>
              <div className="border border-slate-200 rounded-xl overflow-hidden">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 font-semibold uppercase text-[10px]">
                    <tr>
                      <th className="py-2.5 px-4">Posición</th>
                      <th className="py-2.5 px-4">Plataforma</th>
                      <th className="py-2.5 px-4">Cuenta</th>
                      <th className="py-2.5 px-4">Mensaje</th>
                      <th className="py-2.5 px-4 text-right">Comentarios</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {metrics.topPosts.map((p, idx) => (
                      <tr key={p.id}>
                        <td className="py-2.5 px-4 font-bold text-slate-500">#{idx + 1}</td>
                        <td className="py-2.5 px-4">
                          <Badge variant={p.platform === 'FACEBOOK' ? 'facebook' : 'instagram'} size="sm">
                            {p.platform}
                          </Badge>
                        </td>
                        <td className="py-2.5 px-4 font-medium text-slate-800">{p.accountName}</td>
                        <td className="py-2.5 px-4 max-w-sm truncate text-slate-700">{p.message || 'Multimedia'}</td>
                        <td className="py-2.5 px-4 text-right font-bold text-slate-900">{p.commentsCount}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Methodology & Compliance Statement */}
            <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 text-xs text-slate-600 space-y-2">
              <span className="font-bold text-slate-800 block">Nota Metodológica & Trazabilidad:</span>
              <p>
                Los datos expuestos en este informe son recuperados de forma directa y autenticada mediante los endpoints oficiales de Meta Graph API. No se incluyen estimaciones artificiales; cada comentario corresponde a una entrada validada en la base de datos de SocialCount Analytics.
              </p>
            </div>
          </div>
        )}
      </Card>
    </div>
  );
};
