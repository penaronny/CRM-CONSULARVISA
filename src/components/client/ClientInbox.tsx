/**
 * @file src/components/client/ClientInbox.tsx
 * @description Bandeja de Entrada Formal de Mensajes y Comunicados Legales para el Portal del Cliente.
 * Reemplaza el chat informal por una correspondencia estructurada y confiable con el Lic. Ronny Peña | ConsularVisa.
 */

import React, { useState, useEffect, useCallback } from 'react';
import { useApp } from '../../context/AppContext';
import { Message } from '../../types';
import { 
  getMessages, 
  sendMessage, 
  markMessageAsRead, 
  deleteMessage,
  subscribeToChanges 
} from '../../firebase/firestoreService';
import { 
  Mail, 
  Inbox, 
  Send, 
  PenSquare, 
  Scale, 
  Clock, 
  CheckCircle2, 
  ArrowLeft, 
  Reply, 
  RefreshCw, 
  Trash2, 
  CheckCheck,
  AlertCircle,
  FileText
} from 'lucide-react';

interface ClientInboxProps {
  clientId: string;
}

export const ClientInbox: React.FC<ClientInboxProps> = ({ clientId }) => {
  const { showToast, users } = useApp();
  const [messages, setMessages] = useState<Message[]>([]);
  const [selectedMessage, setSelectedMessage] = useState<Message | null>(null);
  const [isComposing, setIsComposing] = useState(false);
  const [filter, setFilter] = useState<'all' | 'received' | 'sent'>('all');
  const [isRefreshing, setIsRefreshing] = useState(false);

  // Formulario de redacción
  const [subjectInput, setSubjectInput] = useState('');
  const [bodyInput, setBodyInput] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const client = users.find(u => u.id === clientId);

  const loadInbox = useCallback(async (quiet = false) => {
    if (!clientId) return;
    if (!quiet) setIsRefreshing(true);
    try {
      const msgs = await getMessages(clientId);
      // Ordenar: los más recientes arriba
      const sorted = [...msgs].sort(
        (a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
      );
      setMessages(sorted);

      // Si hay un mensaje seleccionado, actualizar sus datos
      setSelectedMessage(prev => {
        if (!prev) return null;
        return sorted.find(m => m.id === prev.id) || prev;
      });
    } catch (err) {
      console.error('Error cargando mensajes:', err);
    } finally {
      if (!quiet) setIsRefreshing(false);
    }
  }, [clientId]);

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

  // Abrir mensaje para lectura
  const handleSelectMessage = async (msg: Message) => {
    setSelectedMessage(msg);
    setIsComposing(false);
    if (!msg.read && msg.sender === 'admin') {
      try {
        await markMessageAsRead(msg.id);
        setMessages(prev => prev.map(m => m.id === msg.id ? { ...m, read: true } : m));
      } catch (err) {
        console.error(err);
      }
    }
  };

  // Abrir formulario para responder
  const handleStartReply = (msg: Message) => {
    const defaultSubject = msg.subject?.startsWith('Re:') 
      ? msg.subject 
      : `Re: ${msg.subject || 'Consulta Legal'}`;
    setSubjectInput(defaultSubject);
    setBodyInput('');
    setIsComposing(true);
  };

  // Enviar nuevo mensaje formal
  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    const cleanBody = bodyInput.trim();
    const cleanSubject = subjectInput.trim() || 'Consulta Legal del Cliente';
    if (!cleanBody || isSubmitting) return;

    setIsSubmitting(true);
    try {
      const created = await sendMessage({
        client_id: clientId,
        sender: 'client',
        subject: cleanSubject,
        text: cleanBody
      });

      showToast('Mensaje enviado exitosamente a la oficina legal', 'success');
      setSubjectInput('');
      setBodyInput('');
      setIsComposing(false);

      // Actualizar bandeja inmediatamente
      await loadInbox(true);
      setSelectedMessage(created);
    } catch (err) {
      console.error(err);
      showToast('Error al enviar el mensaje. Intente de nuevo.', 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Filtrado de mensajes
  const filteredMessages = messages.filter(m => {
    if (filter === 'received') return m.sender === 'admin';
    if (filter === 'sent') return m.sender === 'client';
    return true;
  });

  const unreadCount = messages.filter(m => m.sender === 'admin' && !m.read).length;

  return (
    <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden flex flex-col min-h-[560px]">
      
      {/* Cabecera Principal de la Bandeja */}
      <div className="px-5 py-4 bg-slate-900 text-white flex flex-col sm:flex-row sm:items-center justify-between gap-3 shrink-0">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-amber-500/20 text-amber-400 border border-amber-500/30 flex items-center justify-center shrink-0">
            <Mail className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-base font-bold font-serif">Bandeja de Entrada de Mensajes</h2>
              {unreadCount > 0 && (
                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-500 text-slate-950">
                  {unreadCount} nuevo{unreadCount > 1 ? 's' : ''}
                </span>
              )}
            </div>
            <p className="text-xs text-slate-300">
              Comunicados oficiales y correspondencia con el <span className="text-amber-300 font-semibold">Lic. Ronny Peña | ConsularVisa</span>
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 self-start sm:self-auto">
          <button
            type="button"
            onClick={() => loadInbox(false)}
            className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 transition-colors cursor-pointer"
            title="Refrescar bandeja"
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
            <span>Redactar Mensaje</span>
          </button>
        </div>
      </div>

      {/* Contenido Principal: Formulario de Redacción, Vista de Mensaje o Lista */}
      <div className="flex-1 flex flex-col p-4 sm:p-6 bg-slate-50/50">

        {/* 1. VISTA DE REDACTAR NUEVO MENSAJE */}
        {isComposing && (
          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-5 space-y-4 max-w-3xl w-full mx-auto animate-fade-in">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <PenSquare className="w-5 h-5 text-amber-600" />
                <h3 className="text-base font-bold text-slate-900 font-serif">
                  Redactar Mensaje a la Oficina Legal
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setIsComposing(false)}
                className="text-xs text-slate-500 hover:text-slate-800 px-2.5 py-1 rounded-lg hover:bg-slate-100 cursor-pointer"
              >
                Cancelar
              </button>
            </div>

            <form onSubmit={handleSendMessage} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1">
                  Destinatario
                </label>
                <div className="px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 font-semibold flex items-center justify-between">
                  <span>Lic. Ronny Peña | ConsularVisa (Abogado de Inmigración)</span>
                  <span className="text-[11px] text-amber-700 font-mono">law@ronnypena.com.do</span>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1">
                  Asunto del Mensaje *
                </label>
                <input
                  type="text"
                  required
                  placeholder="ej. Consulta sobre documentos para entrevista consular..."
                  value={subjectInput}
                  onChange={(e) => setSubjectInput(e.target.value)}
                  className="w-full text-xs px-3.5 py-2.5 bg-white border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-amber-500 font-medium"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1">
                  Mensaje Detallado *
                </label>
                <textarea
                  required
                  rows={6}
                  placeholder="Escriba aquí su consulta, duda sobre trámites, pagos o requerimientos. El Lic. Ronny Peña revisará su mensaje en su panel legal..."
                  value={bodyInput}
                  onChange={(e) => setBodyInput(e.target.value)}
                  className="w-full text-xs p-3.5 bg-white border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-amber-500"
                />
              </div>

              <div className="flex items-center justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setIsComposing(false)}
                  className="px-4 py-2 text-xs font-semibold text-slate-600 hover:text-slate-900 cursor-pointer"
                >
                  Descartar
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting || !bodyInput.trim()}
                  className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs shadow-xs transition-colors disabled:opacity-50 cursor-pointer"
                >
                  <Send className="w-4 h-4 text-amber-400" />
                  <span>{isSubmitting ? 'Enviando a la oficina...' : 'Enviar Mensaje Formal'}</span>
                </button>
              </div>
            </form>
          </div>
        )}

        {/* 2. VISTA DE LECTURA DE MENSAJE SELECCIONADO */}
        {!isComposing && selectedMessage && (
          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden flex flex-col max-w-3xl w-full mx-auto animate-fade-in">
            {/* Barra superior de lectura */}
            <div className="px-5 py-3.5 bg-slate-50 border-b border-slate-200 flex items-center justify-between">
              <button
                type="button"
                onClick={() => setSelectedMessage(null)}
                className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-700 hover:text-slate-950 px-2.5 py-1.5 rounded-lg hover:bg-slate-200/60 transition-colors cursor-pointer"
              >
                <ArrowLeft className="w-4 h-4" />
                <span>Volver a la Bandeja</span>
              </button>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => handleStartReply(selectedMessage)}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-900 hover:bg-slate-800 text-white font-semibold text-xs transition-colors cursor-pointer"
                >
                  <Reply className="w-3.5 h-3.5 text-amber-400" />
                  <span>Responder</span>
                </button>
              </div>
            </div>

            {/* Cabecera del Documento/Mensaje */}
            <div className="p-5 sm:p-6 space-y-4">
              <div className="border-b border-slate-100 pb-4">
                <div className="flex flex-wrap items-center justify-between gap-2 mb-2">
                  <span className={`text-[11px] font-bold px-2.5 py-0.5 rounded-full ${
                    selectedMessage.sender === 'admin' 
                      ? 'bg-amber-100 text-amber-900 border border-amber-300' 
                      : 'bg-blue-100 text-blue-900 border border-blue-300'
                  }`}>
                    {selectedMessage.sender === 'admin' ? 'Comunicado de la Firma Legal' : 'Mensaje Enviado por Ti'}
                  </span>
                  <span className="text-xs text-slate-500">
                    {new Date(selectedMessage.timestamp).toLocaleDateString(undefined, { 
                      weekday: 'long', 
                      year: 'numeric', 
                      month: 'long', 
                      day: 'numeric' 
                    })} a las {new Date(selectedMessage.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </span>
                </div>

                <h1 className="text-lg sm:text-xl font-bold text-slate-900 font-serif">
                  {selectedMessage.subject || 'Comunicado Legal'}
                </h1>
              </div>

              {/* Ficha de Remitente y Destinatario */}
              <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 text-xs space-y-1.5">
                <div className="flex items-center gap-2">
                  <span className="font-semibold text-slate-500 w-16">De:</span>
                  <span className="font-bold text-slate-900">
                    {selectedMessage.sender === 'admin' ? 'Lic. Ronny Peña | ConsularVisa' : (client?.name || 'Cliente')}
                  </span>
                  <span className="text-slate-400 text-[11px]">
                    ({selectedMessage.sender === 'admin' ? 'law@ronnypena.com.do' : (client?.email || '')})
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="font-semibold text-slate-500 w-16">Para:</span>
                  <span className="text-slate-800">
                    {selectedMessage.sender === 'admin' ? (client?.name || 'Cliente') : 'Lic. Ronny Peña | ConsularVisa'}
                  </span>
                </div>
              </div>

              {/* Cuerpo del Mensaje */}
              <div className="py-2 text-slate-800 text-sm leading-relaxed whitespace-pre-wrap font-sans">
                {selectedMessage.text}
              </div>

              {/* Pie de Firma Institucional */}
              <div className="pt-6 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
                <div className="flex items-center gap-2">
                  <Scale className="w-4 h-4 text-amber-600" />
                  <span className="font-serif font-bold text-slate-800">CONSULARVISA</span>
                  <span>• Mesa de Soporte y Notificaciones Oficiales</span>
                </div>
                <button
                  type="button"
                  onClick={() => handleStartReply(selectedMessage)}
                  className="text-amber-700 font-bold hover:underline inline-flex items-center gap-1 cursor-pointer"
                >
                  <Reply className="w-3.5 h-3.5" />
                  <span>Enviar Respuesta</span>
                </button>
              </div>
            </div>
          </div>
        )}

        {/* 3. VISTA DE LISTA DE MENSAJES (BANDEJA DE ENTRADA) */}
        {!isComposing && !selectedMessage && (
          <div className="space-y-4 max-w-4xl w-full mx-auto">
            
            {/* Filtros de la Bandeja */}
            <div className="flex items-center justify-between gap-2">
              <div className="flex items-center gap-1.5 bg-slate-200/70 p-1 rounded-xl text-xs font-semibold">
                <button
                  type="button"
                  onClick={() => setFilter('all')}
                  className={`px-3 py-1.5 rounded-lg transition-colors cursor-pointer ${
                    filter === 'all' ? 'bg-white text-slate-900 shadow-2xs' : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  Todos ({messages.length})
                </button>
                <button
                  type="button"
                  onClick={() => setFilter('received')}
                  className={`px-3 py-1.5 rounded-lg transition-colors cursor-pointer ${
                    filter === 'received' ? 'bg-white text-slate-900 shadow-2xs' : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  Del Abogado ({messages.filter(m => m.sender === 'admin').length})
                </button>
                <button
                  type="button"
                  onClick={() => setFilter('sent')}
                  className={`px-3 py-1.5 rounded-lg transition-colors cursor-pointer ${
                    filter === 'sent' ? 'bg-white text-slate-900 shadow-2xs' : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  Mis Mensajes ({messages.filter(m => m.sender === 'client').length})
                </button>
              </div>

              <span className="text-xs text-slate-500 hidden sm:inline">
                Mostrando {filteredMessages.length} mensaje{filteredMessages.length === 1 ? '' : 's'}
              </span>
            </div>

            {/* Lista de Filas / Tarjetas de Mensajes */}
            {filteredMessages.length === 0 ? (
              <div className="bg-white rounded-2xl border border-slate-200 p-10 text-center space-y-3">
                <Inbox className="w-12 h-12 text-slate-300 mx-auto" />
                <h3 className="text-sm font-bold text-slate-800">No hay mensajes en esta bandeja</h3>
                <p className="text-xs text-slate-500 max-w-md mx-auto">
                  Aquí aparecerán todas las comunicaciones formales de su expediente. Si tiene dudas sobre su caso, puede escribirle directamente al Lic. Ronny Peña.
                </p>
                <button
                  type="button"
                  onClick={() => {
                    setIsComposing(true);
                    setSubjectInput('');
                    setBodyInput('');
                  }}
                  className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-slate-900 text-white font-bold text-xs hover:bg-slate-800 transition-colors shadow-xs cursor-pointer"
                >
                  <PenSquare className="w-3.5 h-3.5 text-amber-400" />
                  <span>Redactar Mensaje Ahora</span>
                </button>
              </div>
            ) : (
              <div className="space-y-2.5">
                {filteredMessages.map((msg) => {
                  const isAdmin = msg.sender === 'admin';
                  const isUnread = isAdmin && !msg.read;
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
                      className={`p-4 rounded-2xl border transition-all cursor-pointer flex flex-col sm:flex-row sm:items-center justify-between gap-3 ${
                        isUnread
                          ? 'bg-amber-50/70 border-amber-300 shadow-2xs hover:bg-amber-50'
                          : 'bg-white border-slate-200 hover:border-slate-300 hover:shadow-2xs'
                      }`}
                    >
                      <div className="flex items-start gap-3 min-w-0">
                        <div className={`p-2.5 rounded-xl mt-0.5 shrink-0 ${
                          isAdmin 
                            ? 'bg-amber-500/15 text-amber-800 border border-amber-300' 
                            : 'bg-blue-50 text-blue-700 border border-blue-200'
                        }`}>
                          <Mail className="w-4 h-4" />
                        </div>

                        <div className="min-w-0 space-y-1">
                          <div className="flex flex-wrap items-center gap-2">
                            <span className="text-xs font-bold text-slate-900">
                              {isAdmin ? 'Lic. Ronny Peña | ConsularVisa' : 'Tú (Cliente)'}
                            </span>
                            {isUnread && (
                              <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-500 text-slate-950">
                                Nuevo
                              </span>
                            )}
                            <span className="text-[11px] text-slate-400">• {dateStr} a las {timeStr}</span>
                          </div>

                          <h4 className="text-xs font-semibold text-slate-800 truncate">
                            {msg.subject || (isAdmin ? 'Comunicado de la Firma Legal' : 'Consulta Legal del Cliente')}
                          </h4>

                          <p className="text-xs text-slate-500 line-clamp-1">
                            {msg.text}
                          </p>
                        </div>
                      </div>

                      <div className="flex items-center gap-2 self-end sm:self-center shrink-0">
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleSelectMessage(msg);
                          }}
                          className="px-3 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold transition-colors cursor-pointer"
                        >
                          Leer Mensaje
                        </button>
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
