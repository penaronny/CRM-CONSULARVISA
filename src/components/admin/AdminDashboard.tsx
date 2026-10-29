/**
 * @file src/components/admin/AdminDashboard.tsx
 * @description Panel Principal del Abogado (Admin) con tabla de clientes y componente de Actualización Rápida.
 */

import React, { useState, useMemo } from 'react';
import { useApp } from '../../context/AppContext';
import { QUICK_STATUS_OPTIONS } from '../../constants/caseStepsConfig';
import { StatusBadge } from '../common/StatusBadge';
import { formatUSD, calculatePendingBalance } from '../../utils/finance';
import { 
  Users, 
  FolderKanban, 
  Search, 
  UserPlus, 
  ArrowUpRight, 
  DollarSign, 
  Building2, 
  FileCheck2,
  Filter,
  CheckCircle2,
  Clock,
  Sparkles,
  Phone,
  Mail,
  Edit3
} from 'lucide-react';
import { EditClientModal } from './EditClientModal';

interface AdminDashboardProps {
  onSelectClient: (clientId: string) => void;
  onOpenNewClientModal: () => void;
}

export const AdminDashboard: React.FC<AdminDashboardProps> = ({ 
  onSelectClient, 
  onOpenNewClientModal 
}) => {
  const { users, cases, quickUpdateCaseStatus } = useApp();
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [updatingCaseId, setUpdatingCaseId] = useState<string | null>(null);
  const [editingClient, setEditingClient] = useState<User | null>(null);

  const clients = useMemo(() => users.filter(u => u.role === 'client'), [users]);

  // Mapa de caso por clientId para búsquedas rápidas O(1)
  const caseByClientId = useMemo(() => {
    const map = new Map();
    cases.forEach(c => map.set(c.client_id, c));
    return map;
  }, [cases]);

  // Métricas para tarjetas de resumen
  const metrics = useMemo(() => {
    const totalClients = clients.length;
    const casesInUSCIS = cases.filter(c => c.current_status.toLowerCase().includes('uscis')).length;
    const casesInNVC = cases.filter(c => c.current_status.toLowerCase().includes('nvc')).length;
    const totalBilled = clients.reduce((acc, c) => acc + (c.total_cost || 0), 0);
    const totalCollected = clients.reduce((acc, c) => acc + (c.amount_paid || 0), 0);
    const totalPending = totalBilled - totalCollected;

    return {
      totalClients,
      casesInUSCIS,
      casesInNVC,
      totalBilled,
      totalCollected,
      totalPending
    };
  }, [clients, cases]);

  // Filtrado de clientes
  const filteredClients = useMemo(() => {
    return clients.filter(client => {
      const clientCase = caseByClientId.get(client.id);
      const matchesSearch = 
        client.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        client.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
        client.phone.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (clientCase?.case_number && clientCase.case_number.toLowerCase().includes(searchTerm.toLowerCase())) ||
        (clientCase?.case_type && clientCase.case_type.toLowerCase().includes(searchTerm.toLowerCase()));

      const matchesStatus = 
        statusFilter === 'ALL' || 
        clientCase?.current_status === statusFilter;

      return matchesSearch && matchesStatus;
    });
  }, [clients, caseByClientId, searchTerm, statusFilter]);

  // Manejo del cambio rápido de estatus
  const handleQuickStatusChange = async (caseId: string, newStatus: string) => {
    setUpdatingCaseId(caseId);
    try {
      await quickUpdateCaseStatus(caseId, newStatus);
    } finally {
      setUpdatingCaseId(null);
    }
  };

  return (
    <div className="space-y-6">
      
      {/* Encabezado y Acciones Principales */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-2 border-b border-slate-200">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-bold tracking-tight text-slate-900 font-serif">
              Panel de Administración Consular
            </h1>
            <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-blue-100 text-blue-900 border border-blue-200">
              Vista Abogado
            </span>
          </div>
          <p className="text-sm text-slate-500 mt-1">
            Gestión integral de expedientes migratorios, credenciales USCIS y facturación legal.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={onOpenNewClientModal}
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-gradient-to-r from-amber-600 to-amber-700 hover:from-amber-700 hover:to-amber-800 text-white font-semibold text-sm shadow-md hover:shadow-lg transition-all active:scale-[0.98]"
            title="Registrar un nuevo cliente y abrir su expediente migratorio"
          >
            <UserPlus className="w-4 h-4" />
            <span>Nuevo Cliente / Caso</span>
          </button>
        </div>
      </div>

      {/* Tarjetas de Métricas de Alto Nivel */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        
        {/* Total Clientes Activos */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs hover:border-slate-300 transition-colors">
          <div className="flex items-center justify-between">
            <p className="text-xs font-semibold uppercase tracking-wider text-slate-500">
              Clientes Activos
            </p>
            <div className="p-2 bg-blue-50 text-blue-600 rounded-xl">
              <Users className="w-5 h-5" />
            </div>
          </div>
          <p className="text-2xl font-extrabold text-slate-900 mt-2">
            {metrics.totalClients}
          </p>
          <div className="flex items-center gap-1.5 mt-2 text-xs text-slate-600">
            <span className="font-semibold text-emerald-600">100%</span>
            <span>expedientes sincronizados</span>
          </div>
        </div>

        {/* En USCIS */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs hover:border-slate-300 transition-colors">
          <div className="flex items-center justify-between">
            <p className="text-xs font-semibold uppercase tracking-wider text-slate-500">
              Radicados en USCIS
            </p>
            <div className="p-2 bg-indigo-50 text-indigo-600 rounded-xl">
              <Building2 className="w-5 h-5" />
            </div>
          </div>
          <p className="text-2xl font-extrabold text-slate-900 mt-2">
            {metrics.casesInUSCIS}
          </p>
          <div className="flex items-center gap-1.5 mt-2 text-xs text-indigo-600 font-medium">
            <Clock className="w-3.5 h-3.5" />
            <span>En procesamiento / biometría</span>
          </div>
        </div>

        {/* En NVC / Trámite Consular */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs hover:border-slate-300 transition-colors">
          <div className="flex items-center justify-between">
            <p className="text-xs font-semibold uppercase tracking-wider text-slate-500">
              En Centro NVC / Citas
            </p>
            <div className="p-2 bg-purple-50 text-purple-600 rounded-xl">
              <FolderKanban className="w-5 h-5" />
            </div>
          </div>
          <p className="text-2xl font-extrabold text-slate-900 mt-2">
            {metrics.casesInNVC}
          </p>
          <div className="flex items-center gap-1.5 mt-2 text-xs text-purple-600 font-medium">
            <FileCheck2 className="w-3.5 h-3.5" />
            <span>Fase consular activa</span>
          </div>
        </div>

        {/* Balance Financiero Pendiente */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs hover:border-slate-300 transition-colors">
          <div className="flex items-center justify-between">
            <p className="text-xs font-semibold uppercase tracking-wider text-slate-500">
              Cuentas por Cobrar
            </p>
            <div className="p-2 bg-amber-50 text-amber-700 rounded-xl">
              <DollarSign className="w-5 h-5" />
            </div>
          </div>
          <p className="text-2xl font-extrabold text-amber-900 mt-2">
            {formatUSD(metrics.totalPending)}
          </p>
          <div className="flex items-center justify-between mt-2 text-xs text-slate-500">
            <span>Cobrado: {formatUSD(metrics.totalCollected)}</span>
            <span className="font-semibold text-slate-700">Total: {formatUSD(metrics.totalBilled)}</span>
          </div>
        </div>

      </div>

      {/* Controles de Búsqueda y Filtros */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs flex flex-col md:flex-row gap-3 items-center justify-between">
        
        {/* Barra de Búsqueda */}
        <div className="relative w-full md:w-96">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Buscar por cliente, teléfono, caso IOE / WAC..."
            className="w-full pl-10 pr-4 py-2 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-amber-500/30 focus:border-amber-500 transition-all"
          />
        </div>

        {/* Filtro por Estatus */}
        <div className="flex items-center gap-2 w-full md:w-auto">
          <Filter className="w-4 h-4 text-slate-400 shrink-0" />
          <label htmlFor="status-filter" className="text-xs font-semibold text-slate-600 whitespace-nowrap">
            Filtrar Estatus:
          </label>
          <select
            id="status-filter"
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="w-full md:w-auto text-xs py-2 px-3 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-amber-500/30 text-slate-700 font-medium cursor-pointer"
          >
            <option value="ALL">Todos los estatus ({clients.length})</option>
            {QUICK_STATUS_OPTIONS.map(opt => (
              <option key={opt} value={opt}>{opt}</option>
            ))}
          </select>
        </div>

      </div>

      {/* Tabla Principal de Clientes y Casos */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
        
        <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/70">
          <div>
            <h2 className="text-base font-bold text-slate-900">
              Listado de Clientes y Casos Activos
            </h2>
            <p className="text-xs text-slate-500">
              Haga clic en el menú desplegable para actualizar el estatus en Firestore con un solo clic.
            </p>
          </div>
          <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-slate-200 text-slate-700">
            {filteredClients.length} de {clients.length} clientes
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-slate-200 bg-slate-100/70 text-[11px] font-bold text-slate-600 uppercase tracking-wider">
                <th className="py-3 px-5">Cliente</th>
                <th className="py-3 px-5">Tipo de Trámite & Recibo</th>
                <th className="py-3 px-5">
                  <div className="flex items-center gap-1.5 text-amber-900">
                    <Sparkles className="w-3.5 h-3.5 text-amber-600" />
                    <span>Actualización Rápida (Estatus)</span>
                  </div>
                </th>
                <th className="py-3 px-5">Finanzas (Honorarios)</th>
                <th className="py-3 px-5 text-right">Acción</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-sm">
              {filteredClients.length === 0 ? (
                <tr>
                  <td colSpan={5} className="py-12 text-center text-slate-500">
                    <div className="max-w-xs mx-auto">
                      <Search className="w-8 h-8 text-slate-300 mx-auto mb-2" />
                      <p className="font-semibold text-slate-700">No se encontraron clientes</p>
                      <p className="text-xs text-slate-400 mt-1">Intente ajustar los términos de búsqueda o el filtro de estatus.</p>
                    </div>
                  </td>
                </tr>
              ) : (
                filteredClients.map((client) => {
                  const clientCase = caseByClientId.get(client.id);
                  const pendingBalance = calculatePendingBalance(client.total_cost, client.amount_paid);
                  const isUpdating = clientCase && updatingCaseId === clientCase.id;

                  return (
                    <tr 
                      key={client.id}
                      className="hover:bg-slate-50/80 transition-colors group"
                    >
                      {/* Información de Cliente */}
                      <td className="py-4 px-5">
                        <div className="flex items-center gap-3">
                          {client.avatar_url ? (
                            <img
                              src={client.avatar_url}
                              alt={client.name}
                              className="w-10 h-10 rounded-full object-cover border border-slate-200 shrink-0"
                            />
                          ) : (
                            <div className="w-10 h-10 rounded-full bg-slate-200 text-slate-700 flex items-center justify-center font-bold text-sm shrink-0">
                              {client.name.charAt(0)}
                            </div>
                          )}
                          <div className="min-w-0">
                            <button
                              onClick={() => onSelectClient(client.id)}
                              className="font-semibold text-slate-900 hover:text-amber-700 text-left transition-colors truncate block"
                            >
                              {client.name}
                            </button>
                            <div className="flex items-center gap-2 text-xs text-slate-500 mt-0.5">
                              <span className="flex items-center gap-1">
                                <Mail className="w-3 h-3 text-slate-400" />
                                <span className="truncate max-w-[150px]">{client.email}</span>
                              </span>
                              {client.country_of_origin && (
                                <span className="px-1.5 py-0.2 bg-slate-100 rounded text-[11px] font-medium text-slate-600">
                                  {client.country_of_origin}
                                </span>
                              )}
                            </div>
                          </div>
                        </div>
                      </td>

                      {/* Tipo de Caso y Número de Recibo */}
                      <td className="py-4 px-5">
                        {clientCase ? (
                          <div>
                            <p className="font-medium text-slate-800 text-xs sm:text-sm">
                              {clientCase.case_type}
                            </p>
                            <span className="inline-block font-mono text-xs font-semibold text-blue-700 bg-blue-50 px-2 py-0.5 rounded border border-blue-200 mt-1">
                              {clientCase.case_number || 'Pendiente radicar'}
                            </span>
                          </div>
                        ) : (
                          <span className="text-xs text-slate-400 italic">Sin caso asignado</span>
                        )}
                      </td>

                      {/* Componente de Actualización Rápida (Quick Update) */}
                      <td className="py-4 px-5">
                        {clientCase ? (
                          <div className="flex flex-col gap-1.5 max-w-[230px]">
                            <div className="relative">
                              <select
                                value={clientCase.current_status}
                                disabled={isUpdating}
                                onChange={(e) => handleQuickStatusChange(clientCase.id, e.target.value)}
                                aria-label={`Actualizar estatus para ${client.name}`}
                                className="w-full text-xs font-semibold py-1.5 pl-2.5 pr-8 bg-amber-50/60 hover:bg-amber-50 border border-amber-300 hover:border-amber-500 text-amber-950 rounded-lg shadow-2xs focus:outline-none focus:ring-2 focus:ring-amber-500 cursor-pointer transition-all disabled:opacity-50"
                              >
                                {QUICK_STATUS_OPTIONS.map((status) => (
                                  <option key={status} value={status}>
                                    {status}
                                  </option>
                                ))}
                              </select>
                              {isUpdating && (
                                <span className="absolute right-2.5 top-1/2 -translate-y-1/2 text-amber-700 animate-spin text-xs">
                                  ⏳
                                </span>
                              )}
                            </div>
                            <div>
                              <StatusBadge status={clientCase.current_status} size="sm" />
                            </div>
                          </div>
                        ) : (
                          <span className="text-xs text-slate-400 italic">No disponible</span>
                        )}
                      </td>

                      {/* Finanzas */}
                      <td className="py-4 px-5">
                        <div className="text-xs space-y-1">
                          <div className="flex items-center justify-between text-slate-600">
                            <span>Total:</span>
                            <span className="font-semibold text-slate-900">{formatUSD(client.total_cost)}</span>
                          </div>
                          <div className="flex items-center justify-between text-emerald-700">
                            <span>Pagado:</span>
                            <span className="font-semibold">{formatUSD(client.amount_paid)}</span>
                          </div>
                          <div className="flex items-center justify-between font-bold pt-0.5 border-t border-slate-100">
                            <span className={pendingBalance > 0 ? 'text-amber-800' : 'text-emerald-700'}>
                              {pendingBalance > 0 ? 'Saldo:' : 'Liquidado:'}
                            </span>
                            <span className={pendingBalance > 0 ? 'text-amber-900' : 'text-emerald-700'}>
                              {formatUSD(pendingBalance)}
                            </span>
                          </div>
                        </div>
                      </td>

                      {/* Acciones: Editar & Ver Perfil */}
                      <td className="py-4 px-5 text-right whitespace-nowrap">
                        <div className="flex items-center justify-end gap-1.5">
                          <button
                            type="button"
                            onClick={() => setEditingClient(client)}
                            className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-amber-50 hover:bg-amber-100 text-amber-900 border border-amber-300 text-xs font-semibold shadow-2xs transition-all cursor-pointer"
                            title="Editar información, país, foto y expediente de este cliente"
                          >
                            <Edit3 className="w-3.5 h-3.5 text-amber-700" />
                            <span className="hidden sm:inline">Editar</span>
                          </button>

                          <button
                            onClick={() => onSelectClient(client.id)}
                            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-900 hover:bg-slate-800 text-white text-xs font-semibold shadow-xs hover:shadow transition-all group-hover:bg-amber-600 cursor-pointer"
                          >
                            <span>Ver Perfil</span>
                            <ArrowUpRight className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

      </div>

      {/* Modal para Editar Cliente seleccionado desde la tabla */}
      <EditClientModal
        isOpen={!!editingClient}
        onClose={() => setEditingClient(null)}
        client={editingClient}
        clientCase={editingClient ? caseByClientId.get(editingClient.id) || null : null}
      />

    </div>
  );
};
