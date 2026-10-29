/**
 * @file src/components/client/ClientDashboard.tsx
 * @description Portal del Cliente Móvil-First para Consularvisa con:
 * 1. Barra de progreso modular según el estatus del caso
 * 2. Resumen financiero (Costo total, Pagado, Balance pendiente)
 * 3. Bóveda Digital (visible_to_client == true) y subida de archivos
 * 4. Mis Citas cronológicas
 * 5. Chat directo de soporte legal
 * 6. Banner promocional del Club VIP de Patreon
 */

import React, { useState, useEffect } from 'react';
import { useApp } from '../../context/AppContext';
import { CaseProgressTracker } from './CaseProgressTracker';
import { DocumentVault } from './DocumentVault';
import { ClientAppointments } from './ClientAppointments';
import { ClientInbox } from './ClientInbox';
import { PatreonBanner } from './PatreonBanner';
import { formatUSD, getFinancialSummary } from '../../utils/finance';
import { StatusBadge } from '../common/StatusBadge';
import { getMessages } from '../../firebase/firestoreService';
import { 
  FolderLock, 
  Calendar, 
  Mail,
  Inbox,
  TrendingUp, 
  DollarSign, 
  CheckCircle2, 
  Clock, 
  HelpCircle,
  FileCheck2,
  Sparkles,
  Phone,
  ShieldCheck,
  KeyRound
} from 'lucide-react';

interface ClientDashboardProps {
  clientId: string;
}

export const ClientDashboard: React.FC<ClientDashboardProps> = ({ clientId }) => {
  const { users, cases, changeActiveUserPassword } = useApp();
  const [activeTab, setActiveTab] = useState<'overview' | 'vault' | 'appointments' | 'messages'>('overview');
  const [isSecurityModalOpen, setIsSecurityModalOpen] = useState(false);
  const [newPasswordInput, setNewPasswordInput] = useState('');
  const [isUpdatingPass, setIsUpdatingPass] = useState(false);
  const [latestAdminMsg, setLatestAdminMsg] = useState<string | null>(null);

  const client = users.find(u => u.id === clientId);
  const clientCase = cases.find(c => c.client_id === clientId);

  useEffect(() => {
    let isMounted = true;
    const fetchLatest = async () => {
      if (!clientId) return;
      try {
        const msgs = await getMessages(clientId);
        const adminMsgs = msgs.filter(m => m.sender === 'admin');
        if (isMounted && adminMsgs.length > 0) {
          setLatestAdminMsg(adminMsgs[adminMsgs.length - 1].text);
        }
      } catch { /* ignore */ }
    };
    fetchLatest();
    const interval = setInterval(fetchLatest, 2000);
    return () => {
      isMounted = false;
      clearInterval(interval);
    };
  }, [clientId]);

  if (!client) {
    return (
      <div className="p-8 text-center bg-white rounded-2xl border border-slate-200">
        <p className="text-slate-600 font-semibold">Cargando expediente del cliente...</p>
      </div>
    );
  }

  const finances = getFinancialSummary(client.total_cost, client.amount_paid);

  return (
    <div className="space-y-6">
      
      {/* 1. Header de Bienvenida Móvil-First */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-xs p-5 sm:p-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          
          <div className="flex items-center gap-3.5">
            {client.avatar_url ? (
              <img
                src={client.avatar_url}
                alt={client.name}
                className="w-14 h-14 rounded-2xl object-cover border-2 border-amber-500/40 shadow-xs shrink-0"
              />
            ) : (
              <div className="w-14 h-14 rounded-2xl bg-amber-500/20 text-amber-900 flex items-center justify-center font-bold text-xl shrink-0">
                {client.name.charAt(0)}
              </div>
            )}
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-xl sm:text-2xl font-bold text-slate-900 font-serif">
                  Hola, {client.name.split(' ')[0]}
                </h1>
                <span className="hidden sm:inline-block text-[11px] font-semibold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 border border-emerald-200">
                  Expediente Activo
                </span>
              </div>
              
              <div className="flex flex-wrap items-center gap-2 text-xs text-slate-500 mt-1">
                <span>{clientCase ? clientCase.case_type : 'Trámite Migratorio'}</span>
                {clientCase?.case_number && (
                  <>
                    <span>•</span>
                    <span className="font-mono font-semibold text-blue-700 bg-blue-50 px-1.5 py-0.2 rounded border border-blue-200">
                      {clientCase.case_number}
                    </span>
                  </>
                )}
              </div>
            </div>
          </div>

          {/* Estatus Actual y Seguridad */}
          <div className="flex flex-wrap items-center gap-2 self-start sm:self-auto">
            {clientCase && (
              <div className="flex items-center gap-2 bg-slate-50 p-2 rounded-xl border border-slate-200">
                <span className="text-xs text-slate-500 font-medium">Estatus Oficial:</span>
                <StatusBadge status={clientCase.current_status} size="md" />
              </div>
            )}
            <button
              onClick={() => setIsSecurityModalOpen(true)}
              className="flex items-center gap-1.5 px-3 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold rounded-xl border border-slate-200 transition-colors cursor-pointer"
              title="Ver o cambiar contraseña de acceso"
            >
              <KeyRound className="w-3.5 h-3.5 text-amber-600" />
              <span>Mi Clave</span>
            </button>
          </div>

        </div>
      </div>

      {/* Modal de Seguridad y Cambio de Contraseña */}
      {isSecurityModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-xs">
          <div className="bg-white w-full max-w-md rounded-2xl border border-slate-200 shadow-2xl overflow-hidden animate-scale-up">
            <div className="px-5 py-4 bg-slate-900 text-white flex items-center justify-between">
              <div className="flex items-center gap-2">
                <KeyRound className="w-4 h-4 text-amber-400" />
                <h3 className="font-bold text-sm">Seguridad y Contraseña del Portal</h3>
              </div>
              <button
                onClick={() => setIsSecurityModalOpen(false)}
                className="text-slate-400 hover:text-white p-1 rounded-lg"
              >
                ✕
              </button>
            </div>

            <form
              onSubmit={async (e) => {
                e.preventDefault();
                if (!newPasswordInput.trim()) return;
                setIsUpdatingPass(true);
                const ok = await changeActiveUserPassword(newPasswordInput.trim());
                setIsUpdatingPass(false);
                if (ok) {
                  setNewPasswordInput('');
                  setIsSecurityModalOpen(false);
                }
              }}
              className="p-5 space-y-4 text-xs"
            >
              <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 space-y-1">
                <span className="text-slate-500 text-[11px] block">Usuario de Acceso:</span>
                <span className="font-mono font-semibold text-slate-900 text-xs">{client.email}</span>
                <div className="pt-1 flex items-center justify-between">
                  <span className="text-slate-500 text-[11px]">Contraseña Actual:</span>
                  <span className="font-mono font-bold text-amber-900 bg-amber-50 px-2 py-0.5 rounded border border-amber-200">
                    {client.portal_password || 'Consular2025*Pass'}
                  </span>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Nueva Contraseña Personal
                </label>
                <input
                  type="text"
                  required
                  placeholder="Ingrese su nueva contraseña..."
                  value={newPasswordInput}
                  onChange={(e) => setNewPasswordInput(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl font-mono text-xs focus:outline-none focus:ring-2 focus:ring-amber-500"
                />
                <p className="text-[10px] text-slate-500 mt-1">
                  Recomendamos usar al menos 8 caracteres con letras y números.
                </p>
              </div>

              <div className="flex justify-end gap-2 pt-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsSecurityModalOpen(false)}
                  className="px-3 py-1.5 text-xs text-slate-600 hover:text-slate-800"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={isUpdatingPass || !newPasswordInput.trim()}
                  className="px-4 py-1.5 bg-slate-900 hover:bg-slate-800 text-white font-semibold rounded-xl shadow-xs transition-colors disabled:opacity-50"
                >
                  {isUpdatingPass ? 'Guardando...' : 'Actualizar Contraseña'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 2. RESUMEN FINANCIERO (Cards: Costo Total, Pagado, Balance Pendiente) */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        
        {/* Costo Total */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">
              Costo Total
            </span>
            <div className="p-2 bg-slate-100 text-slate-700 rounded-xl">
              <DollarSign className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3">
            <p className="text-2xl sm:text-3xl font-extrabold text-slate-900 font-serif">
              {formatUSD(finances.totalCost)}
            </p>
            <p className="text-[11px] text-slate-500 mt-1">Honorarios legales pactados</p>
          </div>
        </div>

        {/* Monto Pagado */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">
              Monto Pagado
            </span>
            <div className="p-2 bg-emerald-50 text-emerald-700 rounded-xl">
              <CheckCircle2 className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3">
            <p className="text-2xl sm:text-3xl font-extrabold text-emerald-700 font-serif">
              {formatUSD(finances.amountPaid)}
            </p>
            <div className="flex items-center gap-2 mt-1">
              <div className="flex-1 bg-slate-100 rounded-full h-1.5 overflow-hidden">
                <div 
                  className="bg-emerald-500 h-full rounded-full" 
                  style={{ width: `${finances.percentPaid}%` }} 
                />
              </div>
              <span className="text-[11px] font-bold text-emerald-700">{finances.percentPaid}%</span>
            </div>
          </div>
        </div>

        {/* Balance Pendiente */}
        <div className={`p-5 rounded-2xl border shadow-xs flex flex-col justify-between ${finances.pendingBalance === 0 ? 'bg-emerald-50/50 border-emerald-200' : 'bg-white border-slate-200'}`}>
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">
              Balance Pendiente
            </span>
            <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${finances.statusBadge.color}`}>
              {finances.statusBadge.label}
            </span>
          </div>
          <div className="mt-3">
            <p className={`text-2xl sm:text-3xl font-extrabold font-serif ${finances.pendingBalance === 0 ? 'text-emerald-800' : 'text-amber-900'}`}>
              {formatUSD(finances.pendingBalance)}
            </p>
            <p className="text-[11px] text-slate-500 mt-1">
              {finances.pendingBalance === 0 
                ? 'Su cuenta se encuentra al día y liquidada' 
                : 'Saldo a liquidar según plan acordado'}
            </p>
          </div>
        </div>

      </div>

      {/* Navegación por Pestañas Optimizada para Móvil */}
      <div className="flex items-center gap-1.5 p-1.5 bg-slate-200/70 rounded-2xl overflow-x-auto">
        <button
          onClick={() => setActiveTab('overview')}
          className={`flex-1 min-w-[130px] flex items-center justify-center gap-2 py-2 px-3 rounded-xl text-xs font-bold transition-all ${
            activeTab === 'overview'
              ? 'bg-white text-slate-900 shadow-xs'
              : 'text-slate-600 hover:text-slate-900'
          }`}
        >
          <TrendingUp className="w-4 h-4 text-amber-600" />
          <span>Progreso del Caso</span>
        </button>

        <button
          onClick={() => setActiveTab('vault')}
          className={`flex-1 min-w-[130px] flex items-center justify-center gap-2 py-2 px-3 rounded-xl text-xs font-bold transition-all ${
            activeTab === 'vault'
              ? 'bg-white text-slate-900 shadow-xs'
              : 'text-slate-600 hover:text-slate-900'
          }`}
        >
          <FolderLock className="w-4 h-4 text-emerald-600" />
          <span>Bóveda Digital</span>
        </button>

        <button
          onClick={() => setActiveTab('appointments')}
          className={`flex-1 min-w-[120px] flex items-center justify-center gap-2 py-2 px-3 rounded-xl text-xs font-bold transition-all ${
            activeTab === 'appointments'
              ? 'bg-white text-slate-900 shadow-xs'
              : 'text-slate-600 hover:text-slate-900'
          }`}
        >
          <Calendar className="w-4 h-4 text-purple-600" />
          <span>Mis Citas</span>
        </button>

        <button
          onClick={() => setActiveTab('messages')}
          className={`flex-1 min-w-[120px] flex items-center justify-center gap-2 py-2 px-3 rounded-xl text-xs font-bold transition-all relative ${
            activeTab === 'messages'
              ? 'bg-white text-slate-900 shadow-xs'
              : 'text-slate-600 hover:text-slate-900'
          }`}
        >
          <Mail className="w-4 h-4 text-amber-600" />
          <span>Bandeja de Mensajes</span>
          <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" title="Canal oficial activo" />
        </button>
      </div>

      {/* Contenido según pestaña activa */}
      {activeTab === 'overview' && (
        <div className="space-y-6">
          {/* Tracker Modular de Etapas del Caso */}
          {clientCase ? (
            <CaseProgressTracker
              caseType={clientCase.case_type}
              currentStatus={clientCase.current_status}
            />
          ) : (
            <div className="p-6 bg-white rounded-2xl border border-slate-200 text-center text-slate-500">
              No hay caso registrado actualmente.
            </div>
          )}

          {/* Tarjeta de Acceso Directo a la Bandeja de Mensajes con Lic. Ronny Peña */}
          <div className="p-4 sm:p-5 rounded-2xl bg-gradient-to-r from-slate-950 via-slate-900 to-indigo-950 text-white shadow-xs border border-indigo-900/50 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div className="flex items-start gap-3.5">
              <div className="w-10 h-10 rounded-xl bg-amber-500/20 text-amber-400 border border-amber-500/30 flex items-center justify-center shrink-0 mt-0.5">
                <Mail className="w-5 h-5" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="text-sm font-bold font-serif text-white">
                    Bandeja de Entrada & Comunicados Legales
                  </h3>
                  <span className="text-[10px] font-semibold bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 px-2 py-0.5 rounded-full">
                    Lic. Ronny Peña | ConsularVisa
                  </span>
                </div>
                <p className="text-xs text-slate-300 mt-1 line-clamp-1 max-w-xl">
                  {latestAdminMsg ? `Último comunicado: "${latestAdminMsg}"` : 'Revise los comunicados oficiales o redacte un mensaje a la oficina.'}
                </p>
              </div>
            </div>

            <button
              onClick={() => setActiveTab('messages')}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs transition-colors shadow-xs shrink-0 cursor-pointer"
            >
              <Inbox className="w-3.5 h-3.5" />
              <span>Ver Bandeja de Mensajes</span>
            </button>
          </div>

          {/* Banner Promocional del Club VIP de Patreon */}
          <PatreonBanner />

          {/* Acceso Rápido a Bóveda y Citas */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <DocumentVault clientId={client.id} />
            <ClientAppointments clientId={client.id} />
          </div>
        </div>
      )}

      {activeTab === 'vault' && (
        <div className="space-y-6">
          <DocumentVault clientId={client.id} />
          <PatreonBanner />
        </div>
      )}

      {activeTab === 'appointments' && (
        <div className="space-y-6">
          <ClientAppointments clientId={client.id} />
          <PatreonBanner />
        </div>
      )}

      {activeTab === 'messages' && (
        <div className="space-y-6">
          <ClientInbox clientId={client.id} />
          <PatreonBanner />
        </div>
      )}

    </div>
  );
};
