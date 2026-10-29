/**
 * @file src/components/admin/ClientCredentialsModal.tsx
 * @description Modal presentado al abogado tras crear un cliente, mostrando las credenciales
 * generadas automáticamente con botones directos para copiar y compartir por WhatsApp o Email.
 */

import React, { useState } from 'react';
import { 
  X, 
  Check, 
  Copy, 
  Share2, 
  Mail, 
  KeyRound, 
  ExternalLink, 
  ShieldCheck,
  Send,
  Sparkles
} from 'lucide-react';
import { 
  formatCredentialsText, 
  generateWhatsAppShareUrl, 
  generateEmailShareUrl 
} from '../../utils/credentials';

interface ClientCredentialsModalProps {
  isOpen: boolean;
  onClose: () => void;
  clientData: {
    name: string;
    email: string;
    password: string;
    phone?: string;
    caseType?: string;
  } | null;
}

export const ClientCredentialsModal: React.FC<ClientCredentialsModalProps> = ({
  isOpen,
  onClose,
  clientData
}) => {
  const [copied, setCopied] = useState(false);

  if (!isOpen || !clientData) return null;

  const credentialsText = formatCredentialsText(
    clientData.name,
    clientData.email,
    clientData.password
  );

  const handleCopy = () => {
    navigator.clipboard.writeText(credentialsText);
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  const whatsAppUrl = generateWhatsAppShareUrl(
    clientData.name,
    clientData.email,
    clientData.password,
    clientData.phone
  );

  const emailUrl = generateEmailShareUrl(
    clientData.name,
    clientData.email,
    clientData.password
  );

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-xs animate-fade-in">
      <div className="bg-white w-full max-w-lg rounded-3xl border border-slate-200 shadow-2xl overflow-hidden flex flex-col animate-scale-up">
        
        {/* Encabezado */}
        <div className="px-6 py-5 bg-gradient-to-r from-slate-950 via-slate-900 to-amber-950 text-white flex items-center justify-between border-b border-amber-500/30">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-2xl bg-amber-500/20 text-amber-400 border border-amber-500/30">
              <KeyRound className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base sm:text-lg font-bold font-serif">
                  Credenciales de Acceso Generadas
                </h2>
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 font-semibold">
                  Nuevo Cliente
                </span>
              </div>
              <p className="text-xs text-slate-300">
                Comparta estas credenciales con su cliente para que acceda a su portal
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 rounded-xl hover:bg-slate-800 text-slate-400 hover:text-white transition-colors"
            title="Cerrar ventana"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Contenido Principal */}
        <div className="p-6 space-y-5 text-xs">
          
          {/* Tarjeta de Resumen de Credenciales */}
          <div className="p-4 rounded-2xl bg-amber-50/70 border border-amber-200/90 space-y-3">
            <div className="flex items-center justify-between pb-2 border-b border-amber-200/60">
              <span className="text-[11px] font-bold text-amber-900 uppercase tracking-wider">
                Datos de la Cuenta del Cliente
              </span>
              <span className="text-[10px] text-amber-800 font-medium">
                {clientData.caseType || 'Expediente Activo'}
              </span>
            </div>

            <div className="space-y-2">
              <div>
                <span className="text-slate-500 block text-[11px]">Cliente:</span>
                <span className="text-sm font-bold text-slate-900">{clientData.name}</span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
                <div>
                  <span className="text-slate-500 block text-[11px]">Usuario (Correo):</span>
                  <span className="font-mono font-semibold text-slate-800 text-xs break-all select-all">
                    {clientData.email}
                  </span>
                </div>

                <div>
                  <span className="text-slate-500 block text-[11px]">Contraseña Temporal Generada:</span>
                  <span className="font-mono font-extrabold text-amber-900 text-sm bg-white px-2 py-0.5 rounded border border-amber-300 inline-block select-all shadow-2xs">
                    {clientData.password}
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Opciones de Compartición en Un Clic */}
          <div>
            <p className="text-xs font-bold text-slate-800 mb-2.5">
              Compartir Directamente con el Cliente:
            </p>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              
              {/* Botón WhatsApp */}
              <a
                href={whatsAppUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-xs shadow-xs hover:shadow transition-all"
              >
                <Send className="w-4 h-4" />
                <span>Enviar por WhatsApp</span>
              </a>

              {/* Botón Correo Electrónico */}
              <a
                href={emailUrl}
                className="flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-semibold text-xs shadow-xs hover:shadow transition-all"
              >
                <Mail className="w-4 h-4" />
                <span>Enviar por Email</span>
              </a>

            </div>
          </div>

          {/* Cuadro de Texto Copiable */}
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="text-xs font-semibold text-slate-600">
                Mensaje Institucional Formateado:
              </label>
              <button
                type="button"
                onClick={handleCopy}
                className="inline-flex items-center gap-1.5 text-xs font-bold text-amber-800 hover:text-amber-950 transition-colors"
              >
                {copied ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                <span>{copied ? '¡Copiado con Éxito!' : 'Copiar Todo el Mensaje'}</span>
              </button>
            </div>

            <textarea
              readOnly
              rows={4}
              value={credentialsText}
              className="w-full p-3 rounded-xl bg-slate-50 border border-slate-200 font-mono text-[11px] text-slate-700 resize-none select-all focus:outline-none"
            />
          </div>

          <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 flex items-center gap-2 text-slate-500 text-[11px]">
            <ShieldCheck className="w-4 h-4 text-emerald-600 shrink-0" />
            <span>El cliente podrá ingresar inmediatamente a su portal y cambiar esta contraseña cuando lo desee.</span>
          </div>

        </div>

        {/* Footer */}
        <div className="px-6 py-4 bg-slate-50 border-t border-slate-200 flex justify-end">
          <button
            type="button"
            onClick={onClose}
            className="px-5 py-2.5 bg-slate-900 hover:bg-slate-800 text-white font-semibold rounded-xl text-xs shadow-md transition-colors"
          >
            Finalizar y Volver al Panel
          </button>
        </div>

      </div>
    </div>
  );
};
