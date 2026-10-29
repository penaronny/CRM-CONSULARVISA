/**
 * @file src/components/client/ClientAppointments.tsx
 * @description Listado cronológico de citas consulares, toma de huellas y reuniones asignadas al cliente.
 */

import React, { useState, useEffect, useCallback } from 'react';
import { Appointment } from '../../types';
import { getAppointments } from '../../firebase/firestoreService';
import { Calendar, Clock, MapPin, CheckCircle2, AlertCircle } from 'lucide-react';

interface ClientAppointmentsProps {
  clientId: string;
}

export const ClientAppointments: React.FC<ClientAppointmentsProps> = ({ clientId }) => {
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [loading, setLoading] = useState(true);

  const loadClientApts = useCallback(async () => {
    try {
      setLoading(true);
      const data = await getAppointments(clientId);
      setAppointments(data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, [clientId]);

  useEffect(() => {
    loadClientApts();
  }, [loadClientApts]);

  return (
    <div className="bg-white rounded-2xl border border-slate-200 shadow-xs p-5 sm:p-6 space-y-4">
      <div className="flex items-center justify-between pb-3 border-b border-slate-100">
        <div className="flex items-center gap-2.5">
          <div className="p-2 bg-purple-50 text-purple-700 rounded-xl">
            <Calendar className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-base sm:text-lg font-bold text-slate-900 font-serif">
              Mis Citas y Tareas Asignadas
            </h2>
            <p className="text-xs text-slate-500">
              Cronograma oficial de citas consulares, huellas biométricas y asesorías
            </p>
          </div>
        </div>

        <span className="text-xs font-semibold px-2.5 py-1 bg-purple-50 text-purple-800 rounded-full border border-purple-200">
          {appointments.length} {appointments.length === 1 ? 'evento programado' : 'eventos programados'}
        </span>
      </div>

      {loading ? (
        <div className="py-6 text-center text-xs text-slate-400">
          Consultando calendario migratorio...
        </div>
      ) : appointments.length === 0 ? (
        <div className="py-8 text-center bg-slate-50 rounded-xl border border-slate-100">
          <Calendar className="w-8 h-8 text-slate-300 mx-auto mb-2" />
          <p className="text-xs font-bold text-slate-700">Sin citas pendientes en este momento</p>
          <p className="text-xs text-slate-400 mt-0.5">
            Su abogado le agendará las sesiones de preparación cuando su caso avance de etapa.
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {appointments.map((apt) => {
            const dateObj = new Date(apt.date_time);
            return (
              <div
                key={apt.id}
                className="p-4 rounded-xl border border-slate-200 bg-slate-50/50 hover:bg-white hover:border-purple-300 hover:shadow-xs transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-3"
              >
                <div className="flex items-start gap-3">
                  <div className="p-2.5 bg-purple-100 text-purple-900 rounded-xl shrink-0 text-center min-w-[55px]">
                    <span className="text-[10px] uppercase font-bold block text-purple-700">
                      {dateObj.toLocaleDateString('es-ES', { month: 'short' })}
                    </span>
                    <span className="text-lg font-extrabold block leading-tight font-serif">
                      {dateObj.getDate()}
                    </span>
                  </div>

                  <div>
                    <div className="flex items-center gap-2">
                      <h3 className="text-xs sm:text-sm font-bold text-slate-900">
                        {apt.type || 'Cita de Asesoría'}
                      </h3>
                      <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 font-semibold">
                        Confirmada
                      </span>
                    </div>
                    <p className="text-xs text-slate-700 mt-1 leading-snug">
                      {apt.description}
                    </p>
                    {apt.location && (
                      <p className="text-[11px] text-slate-500 mt-1 flex items-center gap-1 font-medium">
                        <MapPin className="w-3.5 h-3.5 text-purple-600 shrink-0" />
                        <span>{apt.location}</span>
                      </p>
                    )}
                  </div>
                </div>

                <div className="self-end sm:self-center shrink-0">
                  <span className="inline-flex items-center gap-1 text-xs font-semibold px-3 py-1.5 rounded-lg bg-white border border-slate-200 text-slate-700 shadow-2xs">
                    <Clock className="w-3.5 h-3.5 text-purple-600" />
                    <span>{dateObj.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
