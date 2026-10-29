/**
 * @file src/components/client/ClientChat.tsx
 * @description Mensajería directa del cliente con la oficina de Consularvisa (soporte legal).
 */

import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useApp } from '../../context/AppContext';
import { Message } from '../../types';
import { getMessages, sendMessage, subscribeToChanges } from '../../firebase/firestoreService';
import { MessageSquare, Send, Scale, CheckCheck } from 'lucide-react';

interface ClientChatProps {
  clientId: string;
}

export const ClientChat: React.FC<ClientChatProps> = ({ clientId }) => {
  const { showToast } = useApp();
  const [messages, setMessages] = useState<Message[]>([]);
  const [newText, setNewText] = useState('');
  const [isSending, setIsSending] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const loadChat = useCallback(async () => {
    if (!clientId) return;
    try {
      const msgs = await getMessages(clientId);
      setMessages(msgs);
    } catch (err) {
      console.error('Error cargando mensajes del chat:', err);
    }
  }, [clientId]);

  useEffect(() => {
    loadChat();
  }, [loadChat]);

  // Sincronización en tiempo real reactiva
  useEffect(() => {
    const unsub = subscribeToChanges(() => {
      loadChat();
    });
    const handleStorage = (e: StorageEvent) => {
      if (e.key === 'consularvisa_messages_v1') {
        loadChat();
      }
    };
    window.addEventListener('storage', handleStorage);
    return () => {
      unsub();
      window.removeEventListener('storage', handleStorage);
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
    try {
      const sent = await sendMessage({
        client_id: clientId,
        sender: 'client',
        text: cleanText
      });
      setMessages(prev => {
        if (prev.some(m => m.id === sent.id)) return prev;
        return [...prev, sent];
      });
      setNewText('');
    } catch (err) {
      console.error(err);
      showToast('Error al enviar el mensaje', 'error');
    } finally {
      setIsSending(false);
    }
  };

  return (
    <div className="bg-white rounded-2xl border border-slate-200 shadow-xs flex flex-col h-[480px] overflow-hidden">
      
      {/* Header del Chat */}
      <div className="px-5 py-4 bg-slate-900 text-white flex items-center justify-between shrink-0">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-amber-500/20 text-amber-400 border border-amber-500/30 flex items-center justify-center">
            <Scale className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-sm font-bold font-serif">Mesa de Soporte & Abogado Asignado</h3>
            <p className="text-[11px] text-amber-300 font-medium">Lic. Ronny Peña | ConsularVisa</p>
          </div>
        </div>
        <div className="flex items-center gap-1.5 text-xs text-emerald-400 font-semibold bg-emerald-950/60 border border-emerald-500/30 px-2.5 py-1 rounded-full">
          <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
          <span>Atención Activa</span>
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
          className="p-2.5 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-semibold flex items-center justify-center transition-colors disabled:opacity-40"
          title="Enviar mensaje"
        >
          <Send className="w-4 h-4 text-amber-400" />
        </button>
      </form>

    </div>
  );
};
