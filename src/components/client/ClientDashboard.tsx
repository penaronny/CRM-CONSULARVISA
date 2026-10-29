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

import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { CaseProgressTracker } from './CaseProgressTracker';
import { DocumentVault } from './DocumentVault';
import { ClientAppointments } from './ClientAppointments';
import { ClientChat } from './ClientChat';
import { PatreonBanner } from './PatreonBanner';
import { formatUSD, getFinancialSummary } from '../../utils/finance';
import { StatusBadge } from '../common/StatusBadge';
import { 
  FolderLock, 
  Calendar, 
  MessageSquare, 
  TrendingUp, 
  DollarSign, 
  CheckCircle2, 
  Clock, 
  HelpCircle,
  FileCheck2,
  Sparkles,
  Phone,
  Mail,
  ShieldCheck
} from 'lucide-react';

interface ClientDashboardProps {
  clientId: string;
}

export const ClientDashboard: React.FC<ClientDashboardProps> = ({ clientId }) => {
  const { users, cases } = useApp();
  const [activeTab, setActiveTab] = useState<'overview' | 'vault' | 'appointments' | 'chat'>('overview');

  const client = users.find(u => u.id === clientId);
  const clientCase = cases.find(c => c.client_id === clientId);

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

          {/* Estatus Actual */}
          {clientCase && (
            <div className="self-start sm:self-auto flex items-center gap-2 bg-slate-50 p-2 rounded-xl border border-slate-200">
              <span className="text-xs text-slate-500 font-medium">Estatus Oficial:</span>
              <StatusBadge status={clientCase.current_status} size="md" />
            </div>
          )}

        </div>
      </div>

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
          onClick={() => setActiveTab('chat')}
          className={`flex-1 min-w-[120px] flex items-center justify-center gap-2 py-2 px-3 rounded-xl text-xs font-bold transition-all ${
            activeTab === 'chat'
              ? 'bg-white text-slate-900 shadow-xs'
              : 'text-slate-600 hover:text-slate-900'
          }`}
        >
          <MessageSquare className="w-4 h-4 text-indigo-600" />
          <span>Chat Legal</span>
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

      {activeTab === 'chat' && (
        <div className="space-y-6">
          <ClientChat clientId={client.id} />
          <PatreonBanner />
        </div>
      )}

    </div>
  );
};
