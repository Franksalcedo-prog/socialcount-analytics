import React, { useState, useEffect } from 'react';
import {
  Settings,
  Database,
  KeyRound,
  Webhook,
  Copy,
  Check,
  ShieldAlert,
  Server,
  Layers,
  Sparkles,
} from 'lucide-react';
import { SystemSettingsInfo } from '../../types';
import { apiService } from '../../services/api';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '../ui/Card';
import { Badge } from '../ui/Badge';
import { Button } from '../ui/Button';

export const SettingsView: React.FC = () => {
  const [info, setInfo] = useState<SystemSettingsInfo | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [copiedField, setCopiedField] = useState<string | null>(null);

  useEffect(() => {
    const loadSettings = async () => {
      setIsLoading(true);
      try {
        const data = await apiService.getSystemSettings();
        setInfo(data);
      } catch (e) {
        console.error('Error al cargar configuración:', e);
      } finally {
        setIsLoading(false);
      }
    };

    loadSettings();
  }, []);

  const copyToClipboard = (text: string, fieldName: string) => {
    navigator.clipboard.writeText(text);
    setCopiedField(fieldName);
    setTimeout(() => setCopiedField(null), 2000);
  };

  if (isLoading || !info) {
    return <div className="p-8 text-center text-xs text-slate-400">Cargando configuración...</div>;
  }

  return (
    <div className="space-y-6">
      {/* Overview Header */}
      <div className="bg-white p-5 rounded-2xl border border-border-ui shadow-2xs">
        <h2 className="text-base font-bold text-slate-900 tracking-tight">
          Configuración e Integraciones del Sistema
        </h2>
        <p className="text-xs text-text-muted mt-0.5">
          Parámetros técnicos de Meta Graph API, Webhooks, Base de Datos y Seguridad
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Meta API Config */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="flex items-center gap-2">
                <KeyRound className="w-4 h-4 text-brand-600" />
                <span>Meta for Developers API</span>
              </CardTitle>
              {info.meta.isConfigured ? (
                <Badge variant="success" size="sm">Credenciales Activas</Badge>
              ) : (
                <Badge variant="warning" size="sm">Modo Demostración</Badge>
              )}
            </div>
            <CardDescription>
              Configuración de la aplicación en developers.facebook.com
            </CardDescription>
          </CardHeader>

          <CardContent className="space-y-4 text-xs">
            <div className="p-3 bg-slate-50 rounded-xl border border-slate-200/80 space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-slate-500">Versión Oficial de Graph API:</span>
                <span className="font-mono font-bold text-slate-800">{info.meta.apiVersion}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-slate-500">App ID:</span>
                <span className="font-mono text-slate-800">{info.meta.appId}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-slate-500">Redirect URI (OAuth):</span>
                <span className="font-mono text-slate-800 truncate max-w-[200px]" title={info.meta.redirectUri}>
                  {info.meta.redirectUri}
                </span>
              </div>
            </div>

            <p className="text-slate-600 leading-relaxed text-[11px]">
              Para ingresar tus credenciales reales, actualiza las variables <code>META_APP_ID</code> y <code>META_APP_SECRET</code> en el archivo <code>server/.env</code> y reinicia el servicio.
            </p>
          </CardContent>
        </Card>

        {/* Webhooks Configuration */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Webhook className="w-4 h-4 text-brand-600" />
              <span>Webhooks en Tiempo Real</span>
            </CardTitle>
            <CardDescription>
              Recibe notificaciones instantáneas de comentarios mediante Meta Webhooks
            </CardDescription>
          </CardHeader>

          <CardContent className="space-y-4 text-xs">
            <div>
              <span className="text-slate-500 block mb-1">Callback URL (URL de retorno):</span>
              <div className="flex items-center gap-2">
                <input
                  type="text"
                  readOnly
                  value={info.meta.webhookEndpoint}
                  className="w-full font-mono text-xs p-2 bg-slate-50 border border-slate-200 rounded-lg select-all"
                />
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => copyToClipboard(info.meta.webhookEndpoint, 'endpoint')}
                >
                  {copiedField === 'endpoint' ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                </Button>
              </div>
            </div>

            <div>
              <span className="text-slate-500 block mb-1">Verify Token (Token de verificación):</span>
              <div className="flex items-center gap-2">
                <input
                  type="text"
                  readOnly
                  value={info.meta.webhookVerifyToken}
                  className="w-full font-mono text-xs p-2 bg-slate-50 border border-slate-200 rounded-lg select-all"
                />
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => copyToClipboard(info.meta.webhookVerifyToken, 'token')}
                >
                  {copiedField === 'token' ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Database & Infrastructure */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Database className="w-4 h-4 text-brand-600" />
              <span>Base de Datos y Persistencia</span>
            </CardTitle>
            <CardDescription>
              Prisma ORM con integridad referencial y deduplicación por clave única
            </CardDescription>
          </CardHeader>

          <CardContent className="space-y-3 text-xs">
            <div className="flex items-center justify-between p-3 bg-slate-50 rounded-xl border border-slate-200">
              <span className="text-slate-600">Motor Activo:</span>
              <span className="font-bold text-slate-900 bg-white px-2 py-0.5 rounded border border-slate-200">
                {info.database.provider}
              </span>
            </div>

            <div className="grid grid-cols-3 gap-3 text-center">
              <div className="p-3 bg-slate-50 rounded-xl border border-slate-200">
                <span className="text-slate-500 block text-[11px]">Cuentas</span>
                <span className="text-base font-bold text-slate-900">{info.database.accountsCount}</span>
              </div>
              <div className="p-3 bg-slate-50 rounded-xl border border-slate-200">
                <span className="text-slate-500 block text-[11px]">Publicaciones</span>
                <span className="text-base font-bold text-slate-900">{info.database.postsCount}</span>
              </div>
              <div className="p-3 bg-slate-50 rounded-xl border border-slate-200">
                <span className="text-slate-500 block text-[11px]">Comentarios</span>
                <span className="text-base font-bold text-brand-600">{info.database.commentsCount}</span>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Security Summary */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <ShieldAlert className="w-4 h-4 text-brand-600" />
              <span>Garantías de Seguridad</span>
            </CardTitle>
            <CardDescription>
              Cumplimiento técnico de las normativas de Meta y protección de datos
            </CardDescription>
          </CardHeader>

          <CardContent className="space-y-2 text-xs text-slate-600">
            <div className="flex items-center gap-2 p-2 bg-emerald-50/60 rounded-lg border border-emerald-100 text-emerald-800">
              <Check className="w-4 h-4 text-emerald-600 shrink-0" />
              <span>Tokens cifrados en reposo mediante algoritmo AES-256-GCM.</span>
            </div>
            <div className="flex items-center gap-2 p-2 bg-emerald-50/60 rounded-lg border border-emerald-100 text-emerald-800">
              <Check className="w-4 h-4 text-emerald-600 shrink-0" />
              <span>Protección CSRF con nonce criptográfico y validación de state.</span>
            </div>
            <div className="flex items-center gap-2 p-2 bg-emerald-50/60 rounded-lg border border-emerald-100 text-emerald-800">
              <Check className="w-4 h-4 text-emerald-600 shrink-0" />
              <span>Validación de firmas HMAC-SHA256 con tiempo constante (timingSafeEqual).</span>
            </div>
            <div className="flex items-center gap-2 p-2 bg-emerald-50/60 rounded-lg border border-emerald-100 text-emerald-800">
              <Check className="w-4 h-4 text-emerald-600 shrink-0" />
              <span>Exclusión estricta de credenciales en logs y frontend.</span>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};
