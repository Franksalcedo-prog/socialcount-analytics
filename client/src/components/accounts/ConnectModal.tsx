import React, { useState } from 'react';
import { KeyRound, ShieldCheck, CheckCircle2, AlertCircle, ArrowUpRight } from 'lucide-react';
import { Modal } from '../ui/Modal';
import { Button } from '../ui/Button';
import axios from 'axios';

interface ConnectModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const ConnectModal: React.FC<ConnectModalProps> = ({ isOpen, onClose }) => {
  const [isLoading, setIsLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const handleStartOAuth = async () => {
    setIsLoading(true);
    setErrorMsg(null);

    try {
      const res = await axios.get('/api/oauth/meta/connect');
      if (res.data?.authUrl) {
        window.location.href = res.data.authUrl;
      }
    } catch (err: any) {
      setIsLoading(false);
      setErrorMsg(
        err.response?.data?.error ||
          'No se pudo iniciar el flujo OAuth de Meta. Verifica que META_APP_ID y META_APP_SECRET estén configurados en el archivo .env del servidor.'
      );
    }
  };

  const permissionsList = [
    { name: 'pages_show_list', desc: 'Permite descubrir las Páginas de Facebook que administras.' },
    { name: 'pages_read_engagement', desc: 'Permite consultar el conteo y actividad de publicaciones.' },
    { name: 'pages_read_user_content', desc: 'Permite leer los comentarios oficiales recibidos en la Página.' },
    { name: 'instagram_basic', desc: 'Permite vincular perfiles de Instagram Profesional asociados a la Página.' },
    { name: 'instagram_manage_comments', desc: 'Permite contabilizar y reconciliar comentarios en publicaciones de Instagram.' },
  ];

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Conectar Cuentas con Meta Graph API"
      description="Autoriza de forma segura tus Páginas de Facebook e Instagram Profesional mediante OAuth 2.0 oficial"
      maxWidth="lg"
    >
      <div className="space-y-5">
        {/* Security Notice */}
        <div className="p-3.5 bg-brand-50/70 border border-brand-100 rounded-xl flex items-start gap-3">
          <ShieldCheck className="w-5 h-5 text-brand-600 shrink-0 mt-0.5" />
          <div className="text-xs text-slate-700 leading-relaxed">
            <span className="font-semibold text-slate-900 block mb-0.5">Seguridad y Cifrado de Grado Militar</span>
            Tus tokens de acceso nunca se exponen al navegador. Se cifran simétricamente en el servidor con <strong>AES-256-GCM</strong> y solo se utilizan para consultar las estadísticas autorizadas.
          </div>
        </div>

        {/* Permissions list */}
        <div>
          <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-2.5">
            Permisos requeridos por Meta
          </h4>
          <div className="space-y-2">
            {permissionsList.map((p) => (
              <div
                key={p.name}
                className="p-2.5 rounded-lg border border-slate-200/80 bg-slate-50/50 flex items-start gap-2.5 text-xs"
              >
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                <div>
                  <code className="font-mono font-semibold text-slate-800 text-[11px] bg-white px-1.5 py-0.5 rounded border border-slate-200 mr-1.5">
                    {p.name}
                  </code>
                  <span className="text-slate-600">{p.desc}</span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Error message if server credentials not configured */}
        {errorMsg && (
          <div className="p-3 bg-red-50 border border-red-200 rounded-xl flex items-start gap-2.5 text-xs text-red-800">
            <AlertCircle className="w-4 h-4 text-red-600 shrink-0 mt-0.5" />
            <div>
              <span className="font-bold block mb-0.5">Configuración requerida</span>
              {errorMsg}
            </div>
          </div>
        )}

        {/* Footer Actions */}
        <div className="pt-2 flex flex-col sm:flex-row items-center justify-between gap-3 border-t border-slate-100">
          <span className="text-[11px] text-slate-400 text-center sm:text-left">
            Serás redirigido a Facebook.com para iniciar sesión y autorizar tus páginas.
          </span>

          <div className="flex items-center gap-2 w-full sm:w-auto">
            <Button variant="outline" size="sm" onClick={onClose} className="w-full sm:w-auto">
              Cancelar
            </Button>
            <Button
              variant="facebook"
              size="sm"
              isLoading={isLoading}
              onClick={handleStartOAuth}
              rightIcon={<ArrowUpRight className="w-4 h-4" />}
              className="w-full sm:w-auto"
            >
              Continuar con Meta
            </Button>
          </div>
        </div>
      </div>
    </Modal>
  );
};
