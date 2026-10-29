/**
 * @file src/components/admin/ClientProfile.tsx
 * @description Vista detallada del Perfil del Cliente para el Abogado con gestión de:
 * 1. Credenciales USCIS (Copiar/Pegar con 1-click)
 * 2. Finanzas (Campos editables y cálculo automático de saldo pendiente)
 * 3. Gestor de Archivos con Switch (Toggle) de `visible_to_client`
 * 4. Calendario de citas y tareas programadas
 * 5. Chat interno bidireccional con el cliente
 */

import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useApp } from '../../context/AppContext';
import { User, Case, FileItem, Appointment, Message } from '../../types';
import { StatusBadge } from '../common/StatusBadge';
import { QUICK_STATUS_OPTIONS } from '../../constants/caseStepsConfig';
import { formatUSD, calculatePendingBalance, getFinancialSummary } from '../../utils/finance';
import { 
  getFiles, 
  toggleFileVisibility, 
  uploadFile, 
  deleteFile,
  getAppointments, 
  createAppointment, 
  deleteAppointment,
  getMessages, 
  sendMessage, 
  updateCase,
  subscribeToChanges
} from '../../firebase/firestoreService';
import { 
  ArrowLeft, 
  KeyRound, 
  Copy, 
  Check, 
  Eye, 
  EyeOff, 
  DollarSign, 
  Save, 
  FolderLock, 
  Upload, 
  Calendar, 
  MessageSquare, 
  Send, 
  Clock, 
  FileText, 
  ShieldAlert, 
  Trash2, 
  Plus, 
  MapPin, 
  UserCheck, 
  ExternalLink,
  Edit3,
  Camera
} from 'lucide-react';
import { EditClientModal } from './EditClientModal';

interface ClientProfileProps {
  clientId: string;
  onBack: () => void;
}

export const ClientProfile: React.FC<ClientProfileProps> = ({ clientId, onBack }) => {
  const { users, cases, updateClientFinancials, quickUpdateCaseStatus, showToast } = useApp();

  const client = users.find(u => u.id === clientId);
  const clientCase = cases.find(c => c.client_id === clientId);

  // Estados locales para formularios y datos relacionados
  const [copiedField, setCopiedField] = useState<string | null>(null);
  const [showPassword, setShowPassword] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);

  // Estados de finanzas editables
  const [totalCostInput, setTotalCostInput] = useState<number>(client?.total_cost || 0);
  const [amountPaidInput, setAmountPaidInput] = useState<number>(client?.amount_paid || 0);
  const [isSavingFinances, setIsSavingFinances] = useState(false);

  // Archivos
  const [files, setFiles] = useState<FileItem[]>([]);
  const [isUploadingFile, setIsUploadingFile] = useState(false);
  const [newFileName, setNewFileName] = useState('');
  const [newFileCategory, setNewFileCategory] = useState<'Identificación' | 'Formularios' | 'Evidencias' | 'Notificaciones USCIS' | 'Otros'>('Formularios');
  const [newFileVisibility, setNewFileVisibility] = useState(true);

  // Citas
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [isAddingApt, setIsAddingApt] = useState(false);
  const [aptDate, setAptDate] = useState('');
  const [aptTime, setAptTime] = useState('10:00');
  const [aptType, setAptType] = useState<'Consulta Legal' | 'Toma de Huellas (ASC)' | 'Entrevista Consular' | 'Revisión Documental'>('Consulta Legal');
  const [aptDescription, setAptDescription] = useState('');
  const [aptLocation, setAptLocation] = useState('Videollamada Consularvisa');

  // Mensajería Chat
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMsgText, setNewMsgText] = useState('');
  const [isSendingMsg, setIsSendingMsg] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Notas internas
  const [internalNotes, setInternalNotes] = useState(clientCase?.internal_notes || '');
  const [isSavingNotes, setIsSavingNotes] = useState(false);

  // Carga de datos del cliente
  const loadClientDetails = useCallback(async () => {
    if (!clientId) return;
    try {
      const [f, a, m] = await Promise.all([
        getFiles(clientId, 'admin'), // Admin ve todos los archivos
        getAppointments(clientId),
        getMessages(clientId)
      ]);
      setFiles(f);
      setAppointments(a);
      setMessages(m);
    } catch (err) {
      console.error('Error loading client details:', err);
    }
  }, [clientId]);

  useEffect(() => {
    loadClientDetails();

    // 1. Polling cada 1.5 segundos para sincronizar con incógnito y otros navegadores
    const pollInterval = setInterval(() => {
      loadClientDetails();
    }, 1500);

    // 2. BroadcastChannel para sincronización instantánea entre pestañas
    const channel = typeof BroadcastChannel !== 'undefined' ? new BroadcastChannel('consularvisa_sync_bus') : null;
    if (channel) {
      channel.onmessage = () => {
        loadClientDetails();
      };
    }

    // 3. StorageEvent
    const handleStorage = (e: StorageEvent) => {
      if (!e.key || e.key === 'consularvisa_messages_v1') {
        loadClientDetails();
      }
    };
    window.addEventListener('storage', handleStorage);

    // 4. Custom event
    const handleLocal = () => loadClientDetails();
    window.addEventListener('consularvisa_local_update', handleLocal);

    // 5. Visibilidad y foco
    const handleFocus = () => {
      if (document.visibilityState === 'visible') {
        loadClientDetails();
      }
    };
    window.addEventListener('focus', handleFocus);
    document.addEventListener('visibilitychange', handleFocus);

    // 6. Suscripción en memoria
    const unsub = subscribeToChanges(() => {
      loadClientDetails();
    });

    return () => {
      clearInterval(pollInterval);
      channel?.close();
      window.removeEventListener('storage', handleStorage);
      window.removeEventListener('consularvisa_local_update', handleLocal);
      window.removeEventListener('focus', handleFocus);
      document.removeEventListener('visibilitychange', handleFocus);
      unsub();
    };
  }, [loadClientDetails]);

  // Auto-scroll al último mensaje
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Actualizar estados locales cuando cambie el cliente
  useEffect(() => {
    if (client) {
      setTotalCostInput(client.total_cost || 0);
      setAmountPaidInput(client.amount_paid || 0);
    }
    if (clientCase) {
      setInternalNotes(clientCase.internal_notes || '');
    }
  }, [client, clientCase]);

  if (!client) {
    return (
      <div className="p-8 text-center bg-white rounded-2xl border border-slate-200">
        <p className="text-slate-600 font-semibold">Cliente no encontrado</p>
        <button
          onClick={onBack}
          className="mt-4 px-4 py-2 bg-slate-900 text-white rounded-xl text-sm font-semibold"
        >
          Volver al Dashboard
        </button>
      </div>
    );
  }

  // Finanzas reactivas calculadas
  const liveFinancialSummary = getFinancialSummary(totalCostInput, amountPaidInput);

  // Copiar al portapapeles
  const handleCopy = (text: string, fieldName: string) => {
    navigator.clipboard.writeText(text);
    setCopiedField(fieldName);
    showToast(`Copiado: ${fieldName}`, 'info');
    setTimeout(() => {
      setCopiedField(null);
    }, 2500);
  };

  // Guardar finanzas
  const handleSaveFinances = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSavingFinances(true);
    try {
      await updateClientFinancials(client.id, totalCostInput, amountPaidInput);
    } finally {
      setIsSavingFinances(false);
    }
  };

  // Cambiar toggle de visibilidad de archivo
  const handleToggleVisibility = async (fileId: string, currentVal: boolean) => {
    const newVal = !currentVal;
    try {
      await toggleFileVisibility(fileId, newVal);
      setFiles(prev => prev.map(f => f.id === fileId ? { ...f, visible_to_client: newVal } : f));
      showToast(
        newVal ? 'Archivo visible para el cliente' : 'Archivo marcado como confidencial (solo abogado)',
        'info'
      );
    } catch (err) {
      console.error(err);
      showToast('Error al modificar visibilidad', 'error');
    }
  };

  // Subir documento
  const handleUploadFile = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newFileName.trim()) return;

    try {
      const created = await uploadFile({
        client_id: client.id,
        file_name: newFileName.trim().endsWith('.pdf') ? newFileName.trim() : `${newFileName.trim()}.pdf`,
        file_url: 'https://example.com/vault/' + encodeURIComponent(newFileName.trim()),
        file_size: `${(Math.random() * 2 + 0.5).toFixed(1)} MB`,
        category: newFileCategory,
        uploaded_by: 'admin',
        uploaded_at: new Date().toISOString(),
        visible_to_client: newFileVisibility
      });

      setFiles(prev => [created, ...prev]);
      setNewFileName('');
      setIsUploadingFile(false);
      showToast('Documento subido y registrado exitosamente', 'success');
    } catch (err) {
      console.error(err);
      showToast('Error al subir documento', 'error');
    }
  };

  // Eliminar documento
  const handleDeleteFile = async (fileId: string) => {
    if (!window.confirm('¿Está seguro de eliminar este documento del expediente?')) return;
    try {
      await deleteFile(fileId);
      setFiles(prev => prev.filter(f => f.id !== fileId));
      showToast('Documento eliminado', 'info');
    } catch (err) {
      console.error(err);
      showToast('Error al eliminar', 'error');
    }
  };

  // Programar cita
  const handleCreateAppointment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!aptDate || !aptDescription.trim()) return;

    const fullDateTime = `${aptDate}T${aptTime}:00Z`;

    try {
      const created = await createAppointment({
        client_id: client.id,
        date_time: fullDateTime,
        description: aptDescription.trim(),
        type: aptType,
        location: aptLocation,
        status: 'Programada'
      });

      setAppointments(prev => [...prev, created].sort((a, b) => new Date(a.date_time).getTime() - new Date(b.date_time).getTime()));
      setAptDescription('');
      setAptDate('');
      setIsAddingApt(false);
      showToast('Cita programada y notificada en el portal del cliente', 'success');
    } catch (err) {
      console.error(err);
      showToast('Error al agendar cita', 'error');
    }
  };

  // Eliminar cita
  const handleDeleteAppointment = async (aptId: string) => {
    try {
      await deleteAppointment(aptId);
      setAppointments(prev => prev.filter(a => a.id !== aptId));
      showToast('Cita cancelada', 'info');
    } catch (err) {
      console.error(err);
    }
  };

  // Enviar mensaje en chat con actualización optimista inmediata
  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    const cleanText = newMsgText.trim();
    if (!cleanText || isSendingMsg) return;

    setIsSendingMsg(true);
    const tempId = `temp-${Date.now()}`;
    const optimisticMsg: Message = {
      id: tempId,
      client_id: clientId,
      sender: 'admin',
      text: cleanText,
      timestamp: new Date().toISOString()
    };

    // Actualización optimista instantánea en UI
    setMessages(prev => [...prev, optimisticMsg]);
    setNewMsgText('');

    try {
      const msg = await sendMessage({
        client_id: clientId,
        sender: 'admin',
        text: cleanText
      });
      setMessages(prev => prev.map(m => m.id === tempId ? msg : m));
    } catch (err) {
      console.error(err);
      showToast('Error al enviar mensaje', 'error');
      setMessages(prev => prev.filter(m => m.id !== tempId));
    } finally {
      setIsSendingMsg(false);
    }
  };

  // Guardar notas internas
  const handleSaveNotes = async () => {
    if (!clientCase) return;
    setIsSavingNotes(true);
    try {
      await updateCase(clientCase.id, { internal_notes: internalNotes });
      showToast('Notas del abogado guardadas', 'success');
    } catch (err) {
      console.error(err);
      showToast('Error al guardar notas', 'error');
    } finally {
      setIsSavingNotes(false);
    }
  };

  return (
    <div className="space-y-6">
      
      {/* Barra de Navegación Superior y Resumen del Cliente */}
      <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          
          <div className="flex items-center gap-4">
            <button
              onClick={onBack}
              className="p-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 transition-colors cursor-pointer"
              title="Volver al listado de clientes"
            >
              <ArrowLeft className="w-5 h-5" />
            </button>

            <div className="flex items-center gap-3.5">
              {/* Avatar con botón de cámara para cambiar foto o editar */}
              <div className="relative group shrink-0">
                {client.avatar_url ? (
                  <img
                    src={client.avatar_url}
                    alt={client.name}
                    className="w-14 h-14 rounded-2xl object-cover border-2 border-amber-500/40 shadow-xs"
                  />
                ) : (
                  <div className="w-14 h-14 rounded-2xl bg-amber-500/20 text-amber-800 flex items-center justify-center font-bold text-xl border border-amber-300">
                    {client.name.charAt(0)}
                  </div>
                )}
                <button
                  type="button"
                  onClick={() => setIsEditModalOpen(true)}
                  className="absolute -bottom-1 -right-1 p-1 bg-amber-500 hover:bg-amber-400 text-slate-950 rounded-lg shadow-sm transition-transform hover:scale-110 cursor-pointer"
                  title="Cambiar foto o editar información del cliente"
                >
                  <Camera className="w-3.5 h-3.5" />
                </button>
              </div>

              <div>
                <div className="flex flex-wrap items-center gap-2">
                  <h1 className="text-xl font-bold text-slate-900 font-serif">
                    {client.name}
                  </h1>
                  {client.country_of_origin && (
                    <span className="text-xs px-2 py-0.5 rounded-md bg-slate-100 text-slate-700 font-medium border border-slate-200">
                      {client.country_of_origin}
                    </span>
                  )}
                  <button
                    type="button"
                    onClick={() => setIsEditModalOpen(true)}
                    className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-amber-50 hover:bg-amber-100 text-amber-900 border border-amber-300 font-semibold text-xs transition-colors cursor-pointer"
                    title="Editar datos del cliente, país de origen, credenciales y foto"
                  >
                    <Edit3 className="w-3.5 h-3.5 text-amber-600" />
                    <span>Editar Perfil</span>
                  </button>
                </div>
                <div className="flex flex-wrap items-center gap-3 text-xs text-slate-500 mt-1">
                  <span>{client.email}</span>
                  <span>•</span>
                  <span>{client.phone}</span>
                </div>
              </div>
            </div>
          </div>

          {/* Quick Update de Estatus desde el Perfil */}
          {clientCase && (
            <div className="flex flex-col sm:flex-row sm:items-center gap-2.5 bg-slate-50 p-2.5 rounded-xl border border-slate-200">
              <span className="text-xs font-semibold text-slate-600">Estatus del Caso:</span>
              <select
                value={clientCase.current_status}
                onChange={(e) => quickUpdateCaseStatus(clientCase.id, e.target.value)}
                className="text-xs font-semibold py-1.5 px-3 bg-white border border-amber-300 text-amber-950 rounded-lg shadow-2xs focus:ring-2 focus:ring-amber-500"
              >
                {QUICK_STATUS_OPTIONS.map(opt => (
                  <option key={opt} value={opt}>{opt}</option>
                ))}
              </select>
              <StatusBadge status={clientCase.current_status} size="sm" />
            </div>
          )}

        </div>
      </div>

      {/* Grid Principal: Credenciales USCIS & Finanzas */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

        {/* 1. CREDENCIALES DE USCIS (Copiar/Pegar) */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100">
            <div className="flex items-center gap-2">
              <div className="p-2 bg-blue-50 text-blue-700 rounded-xl">
                <KeyRound className="w-5 h-5" />
              </div>
              <div>
                <h2 className="text-base font-bold text-slate-900">
                  Credenciales de USCIS / CEAC
                </h2>
                <p className="text-xs text-slate-500">
                  Acceso directo y seguro para radicación y consultas consulares
                </p>
              </div>
            </div>
            <span className="text-[11px] font-semibold text-amber-700 bg-amber-50 border border-amber-200 px-2 py-0.5 rounded-md">
              Uso Confidencial
            </span>
          </div>

          <div className="space-y-3">
            {/* Email USCIS */}
            <div>
              <label className="text-xs font-semibold text-slate-600 block mb-1">
                Correo Electrónico Registrado (USCIS)
              </label>
              <div className="flex items-center gap-2">
                <div className="flex-1 px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl font-mono text-xs text-slate-800 break-all select-all">
                  {client.uscis_email || 'No registrado aún'}
                </div>
                {client.uscis_email && (
                  <button
                    onClick={() => handleCopy(client.uscis_email!, 'Email USCIS')}
                    className="p-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 transition-colors shrink-0"
                    title="Copiar correo"
                  >
                    {copiedField === 'Email USCIS' ? (
                      <Check className="w-4 h-4 text-emerald-600" />
                    ) : (
                      <Copy className="w-4 h-4" />
                    )}
                  </button>
                )}
              </div>
            </div>

            {/* Contraseña USCIS */}
            <div>
              <label className="text-xs font-semibold text-slate-600 block mb-1">
                Contraseña Temporal de USCIS
              </label>
              <div className="flex items-center gap-2">
                <div className="flex-1 px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl font-mono text-xs text-slate-800 break-all select-all">
                  {showPassword ? (client.uscis_password || 'No registrada') : '••••••••••••••••'}
                </div>
                <button
                  onClick={() => setShowPassword(!showPassword)}
                  className="p-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 transition-colors shrink-0"
                  title={showPassword ? 'Ocultar contraseña' : 'Ver contraseña'}
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
                {client.uscis_password && (
                  <button
                    onClick={() => handleCopy(client.uscis_password!, 'Contraseña USCIS')}
                    className="p-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 transition-colors shrink-0"
                    title="Copiar contraseña"
                  >
                    {copiedField === 'Contraseña USCIS' ? (
                      <Check className="w-4 h-4 text-emerald-600" />
                    ) : (
                      <Copy className="w-4 h-4" />
                    )}
                  </button>
                )}
              </div>
            </div>

            {/* Número de Recibo y Peticionario */}
            {clientCase && (
              <div className="pt-2 border-t border-slate-100 grid grid-cols-2 gap-2 text-xs">
                <div>
                  <span className="text-slate-500 block">Número de Caso:</span>
                  <span className="font-mono font-bold text-blue-700">{clientCase.case_number}</span>
                </div>
                <div>
                  <span className="text-slate-500 block">Trámite:</span>
                  <span className="font-semibold text-slate-800">{clientCase.case_type}</span>
                </div>
              </div>
            )}

            {/* Credenciales de Acceso al Portal del Cliente */}
            <div className="mt-3 p-3 rounded-xl bg-amber-50/70 border border-amber-200/80 space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-bold text-amber-950 uppercase tracking-wide">
                  Acceso al Portal del Cliente (App Móvil)
                </span>
                <span className="text-[10px] text-amber-800 font-semibold">Credenciales Activas</span>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
                <div>
                  <span className="text-slate-500 text-[10px] block">Usuario:</span>
                  <span className="font-mono font-semibold text-slate-800 break-all">{client.email}</span>
                </div>
                <div>
                  <span className="text-slate-500 text-[10px] block">Clave del Portal:</span>
                  <span className="font-mono font-bold text-amber-900 bg-white px-1.5 py-0.5 rounded border border-amber-300">
                    {client.portal_password || 'Consular2025*Pass'}
                  </span>
                </div>
              </div>
              <div className="pt-1 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => {
                    const text = `Consularvisa Portal: Ingrese en ${window.location.origin} con Usuario: ${client.email} y Contraseña: ${client.portal_password || 'Consular2025*Pass'}`;
                    navigator.clipboard.writeText(text);
                    showToast('Credenciales del portal copiadas', 'info');
                  }}
                  className="inline-flex items-center gap-1 text-[11px] font-semibold text-amber-900 hover:text-amber-950 bg-white px-2 py-1 rounded border border-amber-300 hover:bg-amber-50 transition-colors"
                >
                  <Copy className="w-3 h-3 text-amber-700" />
                  <span>Copiar Acceso</span>
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* 2. FINANZAS (Campos editables y cálculo automático) */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100">
            <div className="flex items-center gap-2">
              <div className="p-2 bg-amber-50 text-amber-700 rounded-xl">
                <DollarSign className="w-5 h-5" />
              </div>
              <div>
                <h2 className="text-base font-bold text-slate-900">
                  Control Financiero & Honorarios
                </h2>
                <p className="text-xs text-slate-500">
                  Actualización de costos con recálculo dinámico de balance
                </p>
              </div>
            </div>
            <span className={`text-[11px] font-semibold border px-2 py-0.5 rounded-md ${liveFinancialSummary.statusBadge.color}`}>
              {liveFinancialSummary.statusBadge.label}
            </span>
          </div>

          <form onSubmit={handleSaveFinances} className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="text-xs font-semibold text-slate-600 block mb-1">
                  Costo Total del Trámite ($)
                </label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 font-bold">$</span>
                  <input
                    type="number"
                    min="0"
                    step="50"
                    value={totalCostInput}
                    onChange={(e) => setTotalCostInput(Number(e.target.value))}
                    className="w-full pl-7 pr-3 py-2 text-sm bg-slate-50 border border-slate-200 rounded-xl font-semibold text-slate-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-amber-500"
                  />
                </div>
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-600 block mb-1">
                  Monto Pagado / Abonado ($)
                </label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 font-bold">$</span>
                  <input
                    type="number"
                    min="0"
                    step="50"
                    value={amountPaidInput}
                    onChange={(e) => setAmountPaidInput(Number(e.target.value))}
                    className="w-full pl-7 pr-3 py-2 text-sm bg-slate-50 border border-slate-200 rounded-xl font-semibold text-emerald-800 focus:bg-white focus:outline-none focus:ring-2 focus:ring-amber-500"
                  />
                </div>
              </div>
            </div>

            {/* Tarjeta de Balance Pendiente Calculado Automáticamente */}
            <div className="p-3.5 rounded-xl bg-amber-50/70 border border-amber-200/80 flex items-center justify-between">
              <div>
                <p className="text-xs font-semibold text-amber-900">
                  Balance Pendiente (Cálculo Automático)
                </p>
                <p className="text-xs text-amber-700 mt-0.5">
                  Liquidado: {liveFinancialSummary.percentPaid}% del total
                </p>
              </div>
              <p className="text-2xl font-extrabold text-amber-950 font-serif">
                {formatUSD(liveFinancialSummary.pendingBalance)}
              </p>
            </div>

            {/* Barra de Progreso de Pago */}
            <div className="w-full bg-slate-200 rounded-full h-2 overflow-hidden">
              <div
                className={`h-full transition-all duration-500 ${liveFinancialSummary.isFullyPaid ? 'bg-emerald-500' : 'bg-amber-500'}`}
                style={{ width: `${liveFinancialSummary.percentPaid}%` }}
              />
            </div>

            <button
              type="submit"
              disabled={isSavingFinances}
              className="w-full flex items-center justify-center gap-2 py-2 px-4 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-semibold text-xs shadow-xs transition-colors"
            >
              <Save className="w-4 h-4 text-amber-400" />
              <span>{isSavingFinances ? 'Guardando en Firestore...' : 'Guardar Datos Financieros'}</span>
            </button>
          </form>
        </div>

      </div>

      {/* 3. GESTOR DE ARCHIVOS CON SWITCH DE VISIBILIDAD */}
      <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-100">
          <div className="flex items-center gap-2">
            <div className="p-2 bg-emerald-50 text-emerald-700 rounded-xl">
              <FolderLock className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-900">
                Gestor de Archivos & Bóveda Digital
              </h2>
              <p className="text-xs text-slate-500">
                Active el interruptor para hacer visible cada documento en el portal del cliente
              </p>
            </div>
          </div>

          <button
            onClick={() => setIsUploadingFile(!isUploadingFile)}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-amber-600 hover:bg-amber-700 text-white font-semibold text-xs shadow-xs transition-colors self-start sm:self-auto"
          >
            <Upload className="w-3.5 h-3.5" />
            <span>Subir Documento</span>
          </button>
        </div>

        {/* Formulario Desplegable para Subir Documentos */}
        {isUploadingFile && (
          <form onSubmit={handleUploadFile} className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-3">
            <p className="text-xs font-bold text-slate-800">Cargar nuevo archivo al expediente</p>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div>
                <label className="text-xs text-slate-600 font-semibold block mb-1">Nombre del Archivo</label>
                <input
                  type="text"
                  required
                  placeholder="ej. Formulario_I-130_Firmado.pdf"
                  value={newFileName}
                  onChange={(e) => setNewFileName(e.target.value)}
                  className="w-full px-3 py-1.5 text-xs bg-white border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-500"
                />
              </div>

              <div>
                <label className="text-xs text-slate-600 font-semibold block mb-1">Categoría</label>
                <select
                  value={newFileCategory}
                  onChange={(e) => setNewFileCategory(e.target.value as any)}
                  className="w-full px-3 py-1.5 text-xs bg-white border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-500"
                >
                  <option value="Formularios">Formularios Oficiales</option>
                  <option value="Notificaciones USCIS">Notificaciones USCIS</option>
                  <option value="Identificación">Identificación / Pasaporte</option>
                  <option value="Evidencias">Evidencias / Pruebas</option>
                  <option value="Otros">Otros</option>
                </select>
              </div>

              <div>
                <label className="text-xs text-slate-600 font-semibold block mb-1">Visibilidad Inicial</label>
                <label className="flex items-center gap-2 mt-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={newFileVisibility}
                    onChange={(e) => setNewFileVisibility(e.target.checked)}
                    className="w-4 h-4 text-amber-600 rounded focus:ring-amber-500"
                  />
                  <span className="text-xs text-slate-700 font-medium">
                    {newFileVisibility ? 'Visible para cliente' : 'Solo uso interno'}
                  </span>
                </label>
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setIsUploadingFile(false)}
                className="px-3 py-1.5 text-xs text-slate-600 hover:text-slate-800"
              >
                Cancelar
              </button>
              <button
                type="submit"
                className="px-4 py-1.5 text-xs bg-slate-900 text-white font-semibold rounded-lg hover:bg-slate-800"
              >
                Confirmar y Subir a Storage
              </button>
            </div>
          </form>
        )}

        {/* Tabla / Lista de Archivos con Switch Toggle */}
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="border-b border-slate-200 bg-slate-50 text-[11px] font-bold text-slate-600 uppercase tracking-wider">
                <th className="py-2.5 px-3">Documento</th>
                <th className="py-2.5 px-3">Categoría</th>
                <th className="py-2.5 px-3">Subido por</th>
                <th className="py-2.5 px-3">Fecha</th>
                <th className="py-2.5 px-3 text-center">
                  <div className="flex items-center justify-center gap-1 text-slate-700">
                    <span>Visibilidad al Cliente (Switch)</span>
                  </div>
                </th>
                <th className="py-2.5 px-3 text-right">Acción</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {files.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-6 text-center text-slate-400 italic">
                    No hay documentos cargados en el expediente de este cliente.
                  </td>
                </tr>
              ) : (
                files.map((file) => (
                  <tr key={file.id} className="hover:bg-slate-50/70 transition-colors">
                    <td className="py-3 px-3 font-medium text-slate-900">
                      <div className="flex items-center gap-2">
                        <FileText className="w-4 h-4 text-slate-400 shrink-0" />
                        <span className="truncate max-w-[200px]" title={file.file_name}>
                          {file.file_name}
                        </span>
                        {file.file_size && (
                          <span className="text-[10px] text-slate-400">({file.file_size})</span>
                        )}
                      </div>
                    </td>
                    <td className="py-3 px-3">
                      <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-slate-100 text-slate-700">
                        {file.category || 'Expediente'}
                      </span>
                    </td>
                    <td className="py-3 px-3">
                      <span className={`text-[11px] font-medium ${file.uploaded_by === 'admin' ? 'text-blue-700' : 'text-emerald-700'}`}>
                        {file.uploaded_by === 'admin' ? 'Lic. Ronny Peña | ConsularVisa' : 'Cliente'}
                      </span>
                    </td>
                    <td className="py-3 px-3 text-slate-500 text-[11px]">
                      {new Date(file.uploaded_at).toLocaleDateString()}
                    </td>

                    {/* SWITCH TOGGLE DE VISIBILIDAD CRUCIAL */}
                    <td className="py-3 px-3 text-center">
                      <div className="flex items-center justify-center gap-2">
                        <button
                          type="button"
                          role="switch"
                          aria-checked={file.visible_to_client}
                          onClick={() => handleToggleVisibility(file.id, file.visible_to_client)}
                          className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-amber-500 focus:ring-offset-2 ${file.visible_to_client ? 'bg-emerald-600' : 'bg-slate-300'}`}
                          title={file.visible_to_client ? 'Click para hacer privado' : 'Click para hacer visible al cliente'}
                        >
                          <span
                            className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow-md ring-0 transition duration-200 ease-in-out ${file.visible_to_client ? 'translate-x-5' : 'translate-x-0'}`}
                          />
                        </button>
                        <span className={`text-[11px] font-semibold min-w-[90px] text-left ${file.visible_to_client ? 'text-emerald-700' : 'text-slate-500'}`}>
                          {file.visible_to_client ? '✓ Visible' : '🔒 Solo interno'}
                        </span>
                      </div>
                    </td>

                    <td className="py-3 px-3 text-right">
                      <button
                        onClick={() => handleDeleteFile(file.id)}
                        className="p-1 rounded text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-colors"
                        title="Eliminar archivo"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Grid Inferior: Calendario de Citas & Chat Interno */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

        {/* 4. CALENDARIO: FORMULARIO RÁPIDO PARA PROGRAMAR CITAS/TAREAS */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100">
            <div className="flex items-center gap-2">
              <div className="p-2 bg-purple-50 text-purple-700 rounded-xl">
                <Calendar className="w-5 h-5" />
              </div>
              <div>
                <h2 className="text-base font-bold text-slate-900">
                  Citas & Tareas Asignadas
                </h2>
                <p className="text-xs text-slate-500">
                  Agenda reuniones de preparación y citas consulares
                </p>
              </div>
            </div>

            <button
              onClick={() => setIsAddingApt(!isAddingApt)}
              className="inline-flex items-center gap-1 px-3 py-1.5 rounded-xl bg-purple-600 hover:bg-purple-700 text-white font-semibold text-xs shadow-xs transition-colors"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Nueva Cita</span>
            </button>
          </div>

          {/* Formulario para programar cita */}
          {isAddingApt && (
            <form onSubmit={handleCreateAppointment} className="p-4 rounded-xl bg-purple-50/60 border border-purple-200 space-y-3">
              <p className="text-xs font-bold text-purple-900">Programar Cita / Tarea al Cliente</p>
              
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="text-[11px] font-semibold text-slate-600 block mb-1">Fecha</label>
                  <input
                    type="date"
                    required
                    value={aptDate}
                    onChange={(e) => setAptDate(e.target.value)}
                    className="w-full px-2.5 py-1.5 text-xs bg-white border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
                  />
                </div>
                <div>
                  <label className="text-[11px] font-semibold text-slate-600 block mb-1">Hora</label>
                  <input
                    type="time"
                    required
                    value={aptTime}
                    onChange={(e) => setAptTime(e.target.value)}
                    className="w-full px-2.5 py-1.5 text-xs bg-white border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
                  />
                </div>
              </div>

              <div>
                <label className="text-[11px] font-semibold text-slate-600 block mb-1">Tipo de Evento</label>
                <select
                  value={aptType}
                  onChange={(e) => setAptType(e.target.value as any)}
                  className="w-full px-2.5 py-1.5 text-xs bg-white border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
                >
                  <option value="Consulta Legal">Consulta Legal con Lic. Ronny Peña | ConsularVisa</option>
                  <option value="Toma de Huellas (ASC)">Toma de Huellas / Biometría (ASC)</option>
                  <option value="Entrevista Consular">Entrevista Consular / Embajada</option>
                  <option value="Revisión Documental">Revisión Documental Final</option>
                </select>
              </div>

              <div>
                <label className="text-[11px] font-semibold text-slate-600 block mb-1">Descripción / Instrucciones</label>
                <textarea
                  required
                  rows={2}
                  placeholder="ej. Llevar pasaporte original vigente y talón de pago de tarifas..."
                  value={aptDescription}
                  onChange={(e) => setAptDescription(e.target.value)}
                  className="w-full px-2.5 py-1.5 text-xs bg-white border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
                />
              </div>

              <div className="flex justify-end gap-2 pt-1">
                <button
                  type="button"
                  onClick={() => setIsAddingApt(false)}
                  className="px-3 py-1 text-xs text-slate-600 hover:text-slate-800"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-3 py-1 text-xs bg-purple-700 text-white font-semibold rounded-lg hover:bg-purple-800"
                >
                  Agendar en Firestore
                </button>
              </div>
            </form>
          )}

          {/* Lista de Citas Programadas */}
          <div className="space-y-2.5 max-h-72 overflow-y-auto">
            {appointments.length === 0 ? (
              <p className="text-xs text-slate-400 italic py-4 text-center">
                No hay citas o tareas pendientes programadas para este cliente.
              </p>
            ) : (
              appointments.map((apt) => {
                const dateObj = new Date(apt.date_time);
                return (
                  <div
                    key={apt.id}
                    className="p-3 rounded-xl border border-slate-200 bg-slate-50/70 hover:bg-slate-50 flex items-start justify-between gap-3 transition-colors"
                  >
                    <div className="flex items-start gap-2.5">
                      <div className="p-2 bg-purple-100 text-purple-800 rounded-lg mt-0.5 shrink-0">
                        <Clock className="w-4 h-4" />
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-bold text-slate-900">
                            {apt.type || 'Cita Legal'}
                          </span>
                          <span className="text-[10px] px-1.5 py-0.2 bg-purple-100 text-purple-800 rounded font-semibold">
                            {apt.status}
                          </span>
                        </div>
                        <p className="text-xs font-medium text-slate-700 mt-0.5">
                          {apt.description}
                        </p>
                        <p className="text-[11px] text-purple-700 font-semibold mt-1">
                          📅 {dateObj.toLocaleDateString()} a las {dateObj.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </p>
                      </div>
                    </div>
                    <button
                      onClick={() => handleDeleteAppointment(apt.id)}
                      className="text-slate-400 hover:text-rose-600 p-1"
                      title="Cancelar cita"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* 5. CHAT: INTERFAZ DE MENSAJERÍA DIRECTA CON EL CLIENTE */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs flex flex-col h-[420px]">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100 shrink-0">
            <div className="flex items-center gap-2">
              <div className="p-2 bg-indigo-50 text-indigo-700 rounded-xl">
                <MessageSquare className="w-5 h-5" />
              </div>
              <div>
                <h2 className="text-base font-bold text-slate-900">
                  Chat Interno con {client.name.split(' ')[0]}
                </h2>
                <p className="text-xs text-slate-500">
                  Comunicación directa reflejada en el portal del cliente
                </p>
              </div>
            </div>
            <span className="text-[10px] font-semibold px-2 py-0.5 bg-emerald-100 text-emerald-800 rounded-full">
              En Línea
            </span>
          </div>

          {/* Historial de Mensajes */}
          <div className="flex-1 overflow-y-auto py-3 space-y-3 pr-1 text-xs">
            {messages.length === 0 ? (
              <p className="text-slate-400 text-center py-8 italic">
                Inicie la conversación con su cliente aquí.
              </p>
            ) : (
              messages.map((msg) => {
                const isAdmin = msg.sender === 'admin';
                return (
                  <div
                    key={msg.id}
                    className={`flex flex-col ${isAdmin ? 'items-end' : 'items-start'}`}
                  >
                    <div
                      className={`max-w-[85%] rounded-2xl px-3.5 py-2.5 shadow-2xs ${isAdmin ? 'bg-slate-900 text-white rounded-br-xs' : 'bg-slate-100 text-slate-800 rounded-bl-xs'}`}
                    >
                      <p className="leading-relaxed whitespace-pre-wrap">{msg.text}</p>
                    </div>
                    <span className="text-[10px] text-slate-400 mt-1 px-1">
                      {isAdmin ? 'Lic. Ronny Peña | ConsularVisa' : (client?.name ? client.name.split(' ')[0] : 'Cliente')} • {new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </span>
                  </div>
                );
              })
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Entrada de Nuevo Mensaje */}
          <form onSubmit={handleSendMessage} className="pt-2 border-t border-slate-100 shrink-0 flex gap-2">
            <input
              type="text"
              placeholder="Escriba un mensaje formal al cliente..."
              value={newMsgText}
              onChange={(e) => setNewMsgText(e.target.value)}
              className="flex-1 text-xs px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-amber-500"
            />
            <button
              type="submit"
              disabled={isSendingMsg || !newMsgText.trim()}
              className="px-3.5 py-2.5 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-semibold flex items-center justify-center transition-colors disabled:opacity-50"
            >
              <Send className="w-3.5 h-3.5" />
            </button>
          </form>
        </div>

      </div>

      {/* 6. NOTAS INTERNAS DEL ABOGADO */}
      {clientCase && (
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <ShieldAlert className="w-4 h-4 text-amber-600" />
              <h3 className="text-sm font-bold text-slate-900">
                Anotaciones Legales Internas (Lic. Ronny Peña | ConsularVisa - Confidencial)
              </h3>
            </div>
            <button
              onClick={handleSaveNotes}
              disabled={isSavingNotes}
              className="text-xs font-semibold px-3 py-1 bg-amber-500 hover:bg-amber-600 text-white rounded-lg shadow-2xs transition-colors"
            >
              {isSavingNotes ? 'Guardando...' : 'Guardar Notas'}
            </button>
          </div>
          <textarea
            rows={3}
            value={internalNotes}
            onChange={(e) => setInternalNotes(e.target.value)}
            placeholder="Apuntes confidenciales sobre estrategia legal, historial de inadmisibilidad, recordatorios de RFE..."
            className="w-full text-xs p-3 bg-slate-50 border border-slate-200 rounded-xl font-mono focus:bg-white focus:outline-none focus:ring-2 focus:ring-amber-500"
          />
        </div>
      )}

      {/* Modal para Editar Perfil del Cliente */}
      <EditClientModal
        isOpen={isEditModalOpen}
        onClose={() => setIsEditModalOpen(false)}
        client={client}
        clientCase={clientCase || null}
      />

    </div>
  );
};
