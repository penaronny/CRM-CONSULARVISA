/**
 * @file src/components/admin/ClientMessagesInbox.tsx
 * @description Bandeja de Entrada Formal y Gestor de Comunicados Oficiales para el Abogado (Lic. Ronny Peña).
 * Permite redactar comunicados oficiales, revisar consultas recibidas y responder directamente al cliente.
 */

import React, { useState, useEffect, useCallback } from 'react';
import { useApp } from '../../context/AppContext';
import { User, Message } from '../../types';
import { 
  getMessages, 
  sendMessage, 
  deleteMessage,
  markMessageAsRead,
  subscribeToChanges 
} from '../../firebase/firestoreService';
import { 
  Mail, 
  Inbox, 
  Send, 
  PenSquare, 
  Scale, 
  Reply, 
  RefreshCw, 
  Trash2, 
  ArrowLeft,
  CheckCircle2,
  Clock,
  UserCheck
} from 'lucide-react';

interface ClientMessagesInboxProps {
  client: User;
}

export const ClientMessagesInbox: React.FC<ClientMessagesInboxProps> = ({ client }) => {
  const { showToast } = useApp();
  const [messages, setMessages] = useState<Message[]>([]);
  const [selectedMessage, setSelectedMessage] = useState<Message | null>(null);
  const [isComposing, setIsComposing] = useState(false);
  const [filter, setFilter] = useState<'all' | 'received' | 'sent'>('all');
  const [isRefreshing, setIsRefreshing] = useState(false);

  // Formulario de redacción de comunicado oficial
  const [subjectInput, setSubjectInput] = useState('');
  const [bodyInput, setBodyInput] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const loadInbox = useCallback(async (quiet = false) => {
    if (!client?.id) return;
    if (!quiet) setIsRefreshing(true);
    try {
      const msgs = await getMessages(client.id);
      // Ordenar cronológicamente descendente (más recientes arriba)
      const sorted = [...msgs].sort(
        (a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
      );
      setMessages(sorted);

      setSelectedMessage(prev => {
        if (!prev) return null;
        return sorted.find(m => m.id === prev.id) || prev;
      });
    } catch (err) {
      console.error('Error cargando bandeja de mensajes:', err);
    } finally {
      if (!quiet) setIsRefreshing(false);
    }
  }, [client?.id]);

  useEffect(() => {
    loadInbox(false);
  }, [loadInbox]);

  // Sincronización multi-canal
  useEffect(() => {
    const pollInterval = setInterval(() => {
      loadInbox(true);
    }, 2000);

    const channel = typeof BroadcastChannel !== 'undefined' ? new BroadcastChannel('consularvisa_sync_bus') : null;
    if (channel) {
      channel.onmessage = () => {
        loadInbox(true);
      };
    }

    const handleStorage = (e: StorageEvent) => {
      if (!e.key || e.key === 'consularvisa_messages_v1') {
        loadInbox(true);
      }
    };
    window.addEventListener('storage', handleStorage);

    const handleLocal = () => loadInbox(true);
    window.addEventListener('consularvisa_local_update', handleLocal);

    const handleFocus = () => {
      if (document.visibilityState === 'visible') {
        loadInbox(true);
      }
    };
    window.addEventListener('focus', handleFocus);
    document.addEventListener('visibilitychange', handleFocus);

    const unsub = subscribeToChanges(() => {
      loadInbox(true);
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
  }, [loadInbox]);

  const handleSelectMessage = async (msg: Message) => {
    setSelectedMessage(msg);
    setIsComposing(false);
    if (!msg.read && msg.sender === 'client') {
      try {
        await markMessageAsRead(msg.id);
        setMessages(prev => prev.map(m => m.id === msg.id ? { ...m, read: true } : m));
      } catch (err) {
        console.error(err);
      }
    }
  };

  const handleStartReply = (msg: Message) => {
    const defaultSubject = msg.subject?.startsWith('Re:') 
      ? msg.subject 
      : `Re: ${msg.subject || 'Consulta Legal'}`;
    setSubjectInput(defaultSubject);
    setBodyInput('');
    setIsComposing(true);
  };

  const handleSendOfficialNotice = async (e: React.FormEvent) => {
    e.preventDefault();
    const cleanBody = bodyInput.trim();
    const cleanSubject = subjectInput.trim() || 'Comunicado Oficial de Consularvisa';
    if (!cleanBody || isSubmitting) return;

    setIsSubmitting(true);
    try {
      const created = await sendMessage({
        client_id: client.id,
        sender: 'admin',
        subject: cleanSubject,
        text: cleanBody
      });

      showToast(`Comunicado enviado a la bandeja de ${client.name.split(' ')[0]}`, 'success');
      setSubjectInput('');
      setBodyInput('');
      setIsComposing(false);

      await loadInbox(true);
      setSelectedMessage(created);
    } catch (err) {
      console.error(err);
      showToast('Error al enviar el comunicado', 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async (msgId: string) => {
    if (!window.confirm('¿Está seguro de eliminar este mensaje del registro?')) return;
    try {
      await deleteMessage(msgId);
      setMessages(prev => prev.filter(m => m.id !== msgId));
      if (selectedMessage?.id === msgId) {
        setSelectedMessage(null);
      }
      showToast('Mensaje eliminado', 'info');
    } catch (err) {
      console.error(err);
      showToast('Error al eliminar mensaje', 'error');
    }
  };

  const filteredMessages = messages.filter(m => {
    if (filter === 'received') return m.sender === 'client';
    if (filter === 'sent') return m.sender === 'admin';
    return true;
  });

  const pendingClientQueries = messages.filter(m => m.sender === 'client' && !m.read).length;

  return (
    <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden flex flex-col min-h-[500px]">
      
      {/* Cabecera de la Bandeja */}
      <div className="px-5 py-4 bg-slate-900 text-white flex flex-col sm:flex-row sm:items-center justify-between gap-3 shrink-0">
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-xl bg-amber-500/20 text-amber-400 border border-amber-500/30 shrink-0">
            <Mail className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-base font-bold font-serif text-white">
                Bandeja de Mensajes & Comunicados Oficiales
              </h3>
              {pendingClientQueries > 0 && (
                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-500 text-slate-950">
                  {pendingClientQueries} consulta{pendingClientQueries > 1 ? 's' : ''} pendiente{pendingClientQueries > 1 ? 's' : ''}
                </span>
              )}
            </div>
            <p className="text-xs text-slate-300">
              Expediente de correspondencia con <span className="text-amber-300 font-semibold">{client.name}</span>
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 self-start sm:self-auto">
          <button
            type="button"
            onClick={() => loadInbox(false)}
            className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 transition-colors cursor-pointer"
            title="Refrescar mensajes"
          >
            <RefreshCw className={`w-4 h-4 ${isRefreshing ? 'animate-spin text-amber-400' : ''}`} />
          </button>

          <button
            type="button"
            onClick={() => {
              setSelectedMessage(null);
              setIsComposing(true);
              setSubjectInput('');
              setBodyInput('');
            }}
            className="inline-flex items-center gap-2 px-3.5 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs transition-colors shadow-xs cursor-pointer"
          >
            <PenSquare className="w-4 h-4" />
            <span>Redactar Comunicado</span>
          </button>
        </div>
      </div>

      {/* Contenido de la Bandeja */}
      <div className="flex-1 p-4 sm:p-5 bg-slate-50/50">

        {/* 1. FORMULARIO PARA REDACTAR COMUNICADO OFICIAL */}
        {isComposing && (
          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-5 space-y-4 max-w-2xl mx-auto animate-fade-in">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <PenSquare className="w-5 h-5 text-amber-600" />
                <h4 className="text-sm font-bold text-slate-900 font-serif">
                  Redactar Comunicado Oficial al Cliente
                </h4>
              </div>
              <button
                type="button"
                onClick={() => setIsComposing(false)}
                className="text-xs text-slate-500 hover:text-slate-800 px-2 py-1 rounded hover:bg-slate-100 cursor-pointer"
              >
                Cancelar
              </button>
            </div>

            <form onSubmit={handleSendOfficialNotice} className="space-y-3.5">
              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1">
                  Destinatario
                </label>
                <div className="px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 font-semibold flex items-center justify-between">
                  <span>{client.name}</span>
                  <span className="text-[11px] text-slate-500 font-mono">{client.email}</span>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1">
                  Asunto del Comunicado *
                </label>
                <input
                  type="text"
                  required
                  placeholder="ej. Notificación de Estado CEAC / Asignación de Entrevista Consular..."
                  value={subjectInput}
                  onChange={(e) => setSubjectInput(e.target.value)}
                  className="w-full text-xs px-3.5 py-2 bg-white border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-amber-500 font-medium"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1">
                  Cuerpo del Comunicado Oficial *
                </label>
                <textarea
                  required
                  rows={5}
                  placeholder="Redacte las instrucciones o actualización legal para el cliente. Este comunicado aparecerá destacado en su bandeja de entrada..."
                  value={bodyInput}
                  onChange={(e) => setBodyInput(e.target.value)}
                  className="w-full text-xs p-3.5 bg-white border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-amber-500"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-1">
                <button
                  type="button"
                  onClick={() => setIsComposing(false)}
                  className="px-3.5 py-2 text-xs font-semibold text-slate-600 hover:text-slate-800 cursor-pointer"
                >
                  Descartar
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting || !bodyInput.trim()}
                  className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs shadow-xs transition-colors disabled:opacity-50 cursor-pointer"
                >
                  <Send className="w-3.5 h-3.5 text-amber-400" />
                  <span>{isSubmitting ? 'Enviando comunicado...' : 'Enviar a la Bandeja del Cliente'}</span>
                </button>
              </div>
            </form>
          </div>
        )}

        {/* 2. VISTA DE LECTURA DE MENSAJE */}
        {!isComposing && selectedMessage && (
          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden flex flex-col max-w-2xl mx-auto animate-fade-in">
            <div className="px-4 py-3 bg-slate-50 border-b border-slate-200 flex items-center justify-between">
              <button
                type="button"
                onClick={() => setSelectedMessage(null)}
                className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-700 hover:text-slate-950 px-2 py-1 rounded-lg hover:bg-slate-200/60 cursor-pointer"
              >
                <ArrowLeft className="w-3.5 h-3.5" />
                <span>Volver a la Lista</span>
              </button>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => handleStartReply(selectedMessage)}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-900 hover:bg-slate-800 text-white font-semibold text-xs cursor-pointer"
                >
                  <Reply className="w-3.5 h-3.5 text-amber-400" />
                  <span>Responder</span>
                </button>
                <button
                  type="button"
                  onClick={() => handleDelete(selectedMessage.id)}
                  className="p-1.5 text-slate-400 hover:text-rose-600 rounded-lg hover:bg-rose-50 cursor-pointer"
                  title="Eliminar mensaje"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>

            <div className="p-5 space-y-4">
              <div className="border-b border-slate-100 pb-3">
                <div className="flex items-center justify-between text-xs text-slate-500 mb-1">
                  <span className={`px-2 py-0.5 rounded-full font-bold text-[10px] ${
                    selectedMessage.sender === 'admin' 
                      ? 'bg-amber-100 text-amber-900 border border-amber-300' 
                      : 'bg-emerald-100 text-emerald-900 border border-emerald-300'
                  }`}>
                    {selectedMessage.sender === 'admin' ? 'Enviado por Lic. Ronny Peña' : 'Consulta Recibida del Cliente'}
                  </span>
                  <span>
                    {new Date(selectedMessage.timestamp).toLocaleDateString()} a las {new Date(selectedMessage.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </span>
                </div>
                <h3 className="text-base font-bold text-slate-900 font-serif mt-1">
                  {selectedMessage.subject || 'Comunicado Legal'}
                </h3>
              </div>

              <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 text-xs space-y-1">
                <div>
                  <span className="font-semibold text-slate-500">De: </span>
                  <span className="font-bold text-slate-800">
                    {selectedMessage.sender === 'admin' ? 'Lic. Ronny Peña | ConsularVisa' : client.name}
                  </span>
                </div>
                <div>
                  <span className="font-semibold text-slate-500">Para: </span>
                  <span className="text-slate-800">
                    {selectedMessage.sender === 'admin' ? client.name : 'Lic. Ronny Peña | ConsularVisa'}
                  </span>
                </div>
              </div>

              <div className="text-xs text-slate-800 leading-relaxed whitespace-pre-wrap py-2">
                {selectedMessage.text}
              </div>
            </div>
          </div>
        )}

        {/* 3. LISTA DE MENSAJES DE LA BANDEJA */}
        {!isComposing && !selectedMessage && (
          <div className="space-y-3">
            
            {/* Filtros */}
            <div className="flex items-center justify-between gap-2">
              <div className="flex items-center gap-1.5 bg-slate-200/70 p-1 rounded-xl text-xs font-semibold">
                <button
                  type="button"
                  onClick={() => setFilter('all')}
                  className={`px-2.5 py-1 rounded-lg transition-colors cursor-pointer ${
                    filter === 'all' ? 'bg-white text-slate-900 shadow-2xs' : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  Todos ({messages.length})
                </button>
                <button
                  type="button"
                  onClick={() => setFilter('received')}
                  className={`px-2.5 py-1 rounded-lg transition-colors cursor-pointer ${
                    filter === 'received' ? 'bg-white text-slate-900 shadow-2xs' : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  Recibidos del Cliente ({messages.filter(m => m.sender === 'client').length})
                </button>
                <button
                  type="button"
                  onClick={() => setFilter('sent')}
                  className={`px-2.5 py-1 rounded-lg transition-colors cursor-pointer ${
                    filter === 'sent' ? 'bg-white text-slate-900 shadow-2xs' : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  Enviados por la Firma ({messages.filter(m => m.sender === 'admin').length})
                </button>
              </div>

              <span className="text-xs text-slate-500 hidden sm:inline">
                {filteredMessages.length} mensaje{filteredMessages.length === 1 ? '' : 's'}
              </span>
            </div>

            {/* Listado */}
            {filteredMessages.length === 0 ? (
              <div className="bg-white rounded-2xl border border-slate-200 p-8 text-center space-y-2">
                <Inbox className="w-10 h-10 text-slate-300 mx-auto" />
                <h4 className="text-xs font-bold text-slate-700">No hay comunicados registrados con este cliente</h4>
                <p className="text-[11px] text-slate-400">
                  Haga clic en "Redactar Comunicado" para enviar un mensaje formal al portal del cliente.
                </p>
              </div>
            ) : (
              <div className="space-y-2">
                {filteredMessages.map((msg) => {
                  const isAdmin = msg.sender === 'admin';
                  const isUnread = !isAdmin && !msg.read;
                  const dateStr = new Date(msg.timestamp).toLocaleDateString(undefined, {
                    month: 'short',
                    day: 'numeric'
                  });
                  const timeStr = new Date(msg.timestamp).toLocaleTimeString([], {
                    hour: '2-digit',
                    minute: '2-digit'
                  });

                  return (
                    <div
                      key={msg.id}
                      onClick={() => handleSelectMessage(msg)}
                      className={`p-3.5 rounded-xl border transition-all cursor-pointer flex items-center justify-between gap-3 ${
                        isUnread
                          ? 'bg-amber-50/80 border-amber-300 shadow-2xs hover:bg-amber-50'
                          : 'bg-white border-slate-200 hover:border-slate-300'
                      }`}
                    >
                      <div className="flex items-start gap-3 min-w-0">
                        <div className={`p-2 rounded-lg mt-0.5 shrink-0 ${
                          isAdmin 
                            ? 'bg-amber-500/15 text-amber-800' 
                            : 'bg-emerald-50 text-emerald-800'
                        }`}>
                          <Mail className="w-4 h-4" />
                        </div>

                        <div className="min-w-0 space-y-0.5">
                          <div className="flex items-center gap-2">
                            <span className="text-xs font-bold text-slate-900 truncate">
                              {isAdmin ? 'Lic. Ronny Peña | ConsularVisa' : client.name}
                            </span>
                            {isUnread && (
                              <span className="px-1.5 py-0.2 rounded text-[10px] font-bold bg-amber-500 text-slate-950">
                                Consulta Nueva
                              </span>
                            )}
                            <span className="text-[11px] text-slate-400">• {dateStr} {timeStr}</span>
                          </div>

                          <h5 className="text-xs font-semibold text-slate-800 truncate">
                            {msg.subject || (isAdmin ? 'Comunicado de la Firma Legal' : 'Consulta Legal')}
                          </h5>

                          <p className="text-xs text-slate-500 line-clamp-1">
                            {msg.text}
                          </p>
                        </div>
                      </div>

                      <div className="flex items-center gap-2 shrink-0">
                        <span className="text-xs font-semibold text-slate-600 hover:text-slate-900 bg-slate-100 px-2.5 py-1 rounded-lg">
                          Ver
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}

          </div>
        )}

      </div>

    </div>
  );
};
