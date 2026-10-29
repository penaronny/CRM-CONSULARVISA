/**
 * @file src/components/admin/NewClientModal.tsx
 * @description Modal para registrar un nuevo cliente con su expediente y credenciales USCIS en Firestore.
 */

import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { createUser, createCase } from '../../firebase/firestoreService';
import { CASE_WORKFLOWS } from '../../constants/caseStepsConfig';
import { X, UserPlus, Shield, DollarSign } from 'lucide-react';

interface NewClientModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const NewClientModal: React.FC<NewClientModalProps> = ({ isOpen, onClose }) => {
  const { showToast, refreshData } = useApp();

  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [country, setCountry] = useState('Colombia');
  const [uscisEmail, setUscisEmail] = useState('');
  const [uscisPassword, setUscisPassword] = useState('');
  const [totalCost, setTotalCost] = useState(3500);
  const [amountPaid, setAmountPaid] = useState(1000);
  const [caseType, setCaseType] = useState('Petición Familiar (I-130 / Consular)');
  const [caseNumber, setCaseNumber] = useState('IOE-9843210984');
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !email.trim()) return;

    setIsSubmitting(true);
    try {
      // 1. Crear usuario en colección 'users'
      const newUser = await createUser({
        name: name.trim(),
        role: 'client',
        email: email.trim(),
        phone: phone.trim() || '+1 (555) 000-0000',
        country_of_origin: country,
        uscis_email: uscisEmail.trim() || email.trim(),
        uscis_password: uscisPassword.trim() || 'UscisTemp2025!',
        total_cost: Number(totalCost) || 0,
        amount_paid: Number(amountPaid) || 0,
        avatar_url: `https://images.unsplash.com/photo-${1534528741775 + Math.floor(Math.random() * 1000)}?w=160&auto=format&fit=crop&q=80`,
        created_at: new Date().toISOString()
      });

      // 2. Crear caso asociado en colección 'cases'
      await createCase({
        client_id: newUser.id,
        case_type: caseType,
        case_number: caseNumber.trim() || `CASE-${Date.now()}`,
        current_status: 'Preparación de Documentos',
        last_updated: new Date().toISOString(),
        internal_notes: `Nuevo expediente abierto para ${name.trim()} (${caseType}).`,
        petitioner_name: `${name.trim()} (Petición)`,
        beneficiary_name: name.trim()
      });

      showToast(`Cliente ${name} y expediente migratorio creados con éxito`, 'success');
      await refreshData();
      onClose();
    } catch (err) {
      console.error(err);
      showToast('Error al crear el cliente en Firestore', 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-xs">
      <div className="bg-white w-full max-w-xl rounded-2xl border border-slate-200 shadow-2xl overflow-hidden max-h-[90vh] flex flex-col animate-scale-up">
        
        {/* Header */}
        <div className="px-6 py-4 bg-slate-900 text-white flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <UserPlus className="w-5 h-5 text-amber-400" />
            <div>
              <h2 className="text-base font-bold font-serif">Registrar Nuevo Cliente & Trámite</h2>
              <p className="text-xs text-slate-400">Creación simultánea en colecciones users y cases</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg hover:bg-slate-800 text-slate-400 hover:text-white transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-6 overflow-y-auto space-y-4 text-xs">
          
          {/* Datos Personales */}
          <div>
            <h3 className="font-bold text-slate-900 uppercase tracking-wider text-[11px] mb-2 text-slate-600">
              Información Básica del Cliente
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="font-semibold text-slate-700 block mb-1">Nombre Completo *</label>
                <input
                  type="text"
                  required
                  placeholder="ej. Mariana Santos"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-amber-500"
                />
              </div>

              <div>
                <label className="font-semibold text-slate-700 block mb-1">Correo Electrónico *</label>
                <input
                  type="email"
                  required
                  placeholder="mariana@gmail.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-amber-500"
                />
              </div>

              <div>
                <label className="font-semibold text-slate-700 block mb-1">Teléfono</label>
                <input
                  type="text"
                  placeholder="+1 (786) 000-0000"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-amber-500"
                />
              </div>

              <div>
                <label className="font-semibold text-slate-700 block mb-1">País de Origen</label>
                <select
                  value={country}
                  onChange={(e) => setCountry(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-amber-500"
                >
                  <option value="Colombia">Colombia</option>
                  <option value="México">México</option>
                  <option value="Venezuela">Venezuela</option>
                  <option value="Perú">Perú</option>
                  <option value="Guatemala">Guatemala</option>
                  <option value="Ecuador">Ecuador</option>
                  <option value="Honduras">Honduras</option>
                  <option value="Otro">Otro</option>
                </select>
              </div>
            </div>
          </div>

          {/* Expediente Migratorio */}
          <div className="pt-2 border-t border-slate-100">
            <h3 className="font-bold text-slate-900 uppercase tracking-wider text-[11px] mb-2 text-slate-600">
              Trámite Migratorio Asignado
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="font-semibold text-slate-700 block mb-1">Tipo de Proceso</label>
                <select
                  value={caseType}
                  onChange={(e) => setCaseType(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-amber-500"
                >
                  {Object.keys(CASE_WORKFLOWS).map(k => (
                    <option key={k} value={k}>{k}</option>
                  ))}
                  <option value="Perdón Migratorio (I-601A)">Perdón Migratorio (I-601A)</option>
                  <option value="Permiso de Trabajo (I-765)">Permiso de Trabajo (I-765)</option>
                </select>
              </div>

              <div>
                <label className="font-semibold text-slate-700 block mb-1">Número de Caso / Recibo</label>
                <input
                  type="text"
                  placeholder="ej. IOE-0941298412"
                  value={caseNumber}
                  onChange={(e) => setCaseNumber(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl font-mono focus:outline-none focus:ring-2 focus:ring-amber-500"
                />
              </div>
            </div>
          </div>

          {/* Credenciales de USCIS */}
          <div className="pt-2 border-t border-slate-100">
            <h3 className="font-bold text-slate-900 uppercase tracking-wider text-[11px] mb-2 text-slate-600 flex items-center gap-1.5">
              <Shield className="w-3.5 h-3.5 text-blue-600" />
              <span>Credenciales de USCIS / Portal Consular</span>
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="font-semibold text-slate-700 block mb-1">Usuario / Email USCIS</label>
                <input
                  type="text"
                  placeholder="mariana.uscis@gmail.com"
                  value={uscisEmail}
                  onChange={(e) => setUscisEmail(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl font-mono text-xs focus:outline-none focus:ring-2 focus:ring-amber-500"
                />
              </div>

              <div>
                <label className="font-semibold text-slate-700 block mb-1">Contraseña de USCIS</label>
                <input
                  type="text"
                  placeholder="PasswordSeguro2025#"
                  value={uscisPassword}
                  onChange={(e) => setUscisPassword(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl font-mono text-xs focus:outline-none focus:ring-2 focus:ring-amber-500"
                />
              </div>
            </div>
          </div>

          {/* Facturación y Honorarios */}
          <div className="pt-2 border-t border-slate-100">
            <h3 className="font-bold text-slate-900 uppercase tracking-wider text-[11px] mb-2 text-slate-600 flex items-center gap-1.5">
              <DollarSign className="w-3.5 h-3.5 text-amber-600" />
              <span>Honorarios Legales</span>
            </h3>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="font-semibold text-slate-700 block mb-1">Costo Total ($)</label>
                <input
                  type="number"
                  min="0"
                  step="50"
                  value={totalCost}
                  onChange={(e) => setTotalCost(Number(e.target.value))}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl font-semibold focus:outline-none focus:ring-2 focus:ring-amber-500"
                />
              </div>

              <div>
                <label className="font-semibold text-slate-700 block mb-1">Pago Inicial / Abono ($)</label>
                <input
                  type="number"
                  min="0"
                  step="50"
                  value={amountPaid}
                  onChange={(e) => setAmountPaid(Number(e.target.value))}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl font-semibold text-emerald-800 focus:outline-none focus:ring-2 focus:ring-amber-500"
                />
              </div>
            </div>
          </div>

          {/* Botones de Acción */}
          <div className="pt-4 border-t border-slate-100 flex items-center justify-end gap-3">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-slate-600 hover:text-slate-800 font-semibold"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="px-5 py-2.5 bg-slate-900 hover:bg-slate-800 text-white font-semibold rounded-xl shadow-md transition-colors disabled:opacity-50"
            >
              {isSubmitting ? 'Guardando...' : 'Crear Cliente y Expediente'}
            </button>
          </div>

        </form>

      </div>
    </div>
  );
};
