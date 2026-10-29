/**
 * @file src/components/client/ClientChat.tsx
 * @description Mensajería directa del cliente con la oficina de Consularvisa (Lic. Ronny Peña).
 * Sincronización en tiempo real multi-canal (BroadcastChannel, Polling 1.5s, Storage, VisibilityChange).
 */

import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useApp } from '../../context/AppContext';
import { Message } from '../../types';
import { getMessages, sendMessage, subscribeToChanges } from '../../firebase/firestoreService';
import { MessageSquare, Send, Scale, CheckCheck, Sparkles, RefreshCw } from 'lucide-react';

interface ClientChatProps {
  clientId: string;
}

export const ClientChat: React.FC<ClientChatProps> = ({ clientId }) => {
  const { showToast } = useApp();
  const [messages, setMessages] = useState<Message[]>([]);
  const [newText, setNewText] = useState('');
  const [isSending, setIsSending] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const loadChat = useCallback(async (quiet = false) => {
    if (!clientId) return;
    if (!quiet) setIsRefreshing(true);
    try {
      const msgs = await getMessages(clientId);
      setMessages(msgs);
    } catch (err) {
      console.error('Error cargando mensajes del chat:', err);
    } finally {
      if (!quiet) setIsRefreshing(false);
    }
  }, [clientId]);

  // Carga inicial
  useEffect(() => {
    loadChat(false);
  }, [loadChat]);

  // Sincronización continua y multi-capa
  useEffect(() => {
    // 1. Polling silencioso cada 1.5 segundos (garantiza sincronización con modo incógnito o segundo navegador)
    const pollInterval = setInterval(() => {
      loadChat(true);
    }, 1500);

    // 2. BroadcastChannel para sincronización instantánea entre pestañas
    const channel = typeof BroadcastChannel !== 'undefined' ? new BroadcastChannel('consularvisa_sync_bus') : null;
    if (channel) {
      channel.onmessage = (event) => {
        if (!event.data || event.data.type === 'NEW_CHAT_MESSAGE' || event.data.key === 'consularvisa_messages_v1') {
          loadChat(true);
        }
      };
    }

    // 3. StorageEvent del navegador
    const handleStorage = (e: StorageEvent) => {
      if (!e.key || e.key === 'consularvisa_messages_v1') {
        loadChat(true);
      }
    };
    window.addEventListener('storage', handleStorage);

    // 4. Custom event en la misma ventana
    const handleLocalUpdate = () => loadChat(true);
    window.addEventListener('consularvisa_local_update', handleLocalUpdate);

    // 5. Al volver el usuario a la pestaña (foco)
    const handleVisibility = () => {
      if (document.visibilityState === 'visible') {
        loadChat(true);
      }
    };
    window.addEventListener('focus', handleVisibility);
    document.addEventListener('visibilitychange', handleVisibility);

    // 6. Suscripción en memoria
    const unsub = subscribeToChanges(() => {
      loadChat(true);
    });

    return () => {
      clearInterval(pollInterval);
      channel?.close();
      window.removeEventListener('storage', handleStorage);
      window.removeEventListener('consularvisa_local_update', handleLocalUpdate);
      window.removeEventListener('focus', handleVisibility);
      document.removeEventListener('visibilitychange', handleVisibility);
      unsub();
    };
  }, [loadChat]);

  // Auto-scroll hacia el último mensaje recibido o enviado
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    const cleanText = newText.trim();
    if (!cleanText || isSending) return;

    setIsSending(true);
    const tempId = `temp-${Date.now()}`;
    const optimisticMsg: Message = {
      id: tempId,
      client_id: clientId,
      sender: 'client',
      text: cleanText,
      timestamp: new Date().toISOString()
    };

    // Actualización optimista instantánea en UI
    setMessages(prev => [...prev, optimisticMsg]);
    setNewText('');

    try {
      const sent = await sendMessage({
        client_id: clientId,
        sender: 'client',
        text: cleanText
      });
      // Reemplazar mensaje temporal con el confirmado
      setMessages(prev => prev.map(m => m.id === tempId ? sent : m));
    } catch (err) {
      console.error(err);
      showToast('Error al enviar el mensaje', 'error');
      // Revertir optimistic si falló
      setMessages(prev => prev.filter(m => m.id !== tempId));
    } finally {
      setIsSending(false);
    }
  };

  return (
    <div className="bg-white rounded-2xl border border-slate-200 shadow-xs flex flex-col h-[520px] overflow-hidden">
      
      {/* Header del Chat */}
      <div className="px-5 py-4 bg-slate-900 text-white flex items-center justify-between shrink-0">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-amber-500/20 text-amber-400 border border-amber-500/30 flex items-center justify-center shrink-0">
            <Scale className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-sm font-bold font-serif">Mesa de Soporte & Abogado Asignado</h3>
            <p className="text-[11px] text-amber-300 font-medium">Lic. Ronny Peña | ConsularVisa</p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => loadChat(false)}
            className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 transition-colors"
            title="Actualizar chat ahora"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isRefreshing ? 'animate-spin text-amber-400' : ''}`} />
          </button>
          <div className="flex items-center gap-1.5 text-xs text-emerald-400 font-semibold bg-emerald-950/60 border border-emerald-500/30 px-2.5 py-1 rounded-full">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            <span className="hidden sm:inline">En Línea</span>
          </div>
        </div>
      </div>

      {/* Historial de Mensajes */}
      <div className="flex-1 overflow-y-auto p-4 space-y-3 bg-slate-50/50 text-xs">
        {messages.length === 0 ? (
          <div className="h-full flex flex-col items-center justify-center text-center p-6 text-slate-400">
            <MessageSquare className="w-10 h-10 text-slate-300 mb-2" />
            <p className="font-semibold text-slate-700">Canal Seguro de Comunicación Legal</p>
            <p className="text-[11px] mt-1 max-w-xs">
              Escriba sus dudas sobre formularios, citas o pagos directamente aquí. El Lic. Ronny Peña | ConsularVisa le responderá a la brevedad.
            </p>
          </div>
        ) : (
          messages.map((m) => {
            const isClient = m.sender === 'client';
            const timeStr = new Date(m.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

            return (
              <div
                key={m.id}
                className={`flex flex-col ${isClient ? 'items-end' : 'items-start'}`}
              >
                <div
                  className={`max-w-[85%] sm:max-w-[75%] rounded-2xl px-4 py-3 shadow-2xs ${
                    isClient
                      ? 'bg-amber-600 text-white rounded-br-xs'
                      : 'bg-white text-slate-900 border border-slate-200 rounded-bl-xs'
                  }`}
                >
                  <p className="leading-relaxed whitespace-pre-wrap">{m.text}</p>
                </div>
                <div className="flex items-center gap-1 text-[10px] text-slate-400 mt-1 px-1">
                  <span>{isClient ? 'Tú' : 'Lic. Ronny Peña | ConsularVisa'} • {timeStr}</span>
                  {isClient && <CheckCheck className="w-3 h-3 text-amber-600" />}
                </div>
              </div>
            );
          })
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Input de Enviar */}
      <form onSubmit={handleSend} className="p-3 bg-white border-t border-slate-200 shrink-0 flex items-center gap-2">
        <input
          type="text"
          placeholder="Escriba su consulta o duda legal aquí..."
          value={newText}
          onChange={(e) => setNewText(e.target.value)}
          className="flex-1 text-xs px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-amber-500"
        />
        <button
          type="submit"
          disabled={isSending || !newText.trim()}
          className="px-4 py-2.5 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-semibold flex items-center justify-center gap-1.5 transition-colors disabled:opacity-40 cursor-pointer"
          title="Enviar mensaje"
        >
          <span>Enviar</span>
          <Send className="w-3.5 h-3.5 text-amber-400" />
        </button>
      </form>

    </div>
  );
};
