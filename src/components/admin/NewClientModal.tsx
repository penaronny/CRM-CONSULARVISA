/**
 * @file src/components/admin/NewClientModal.tsx
 * @description Modal para registrar un nuevo cliente con su expediente, credenciales USCIS
 * y generación automática de usuario y contraseña temporal para el Portal del Cliente.
 */

import React, { useState, useEffect } from 'react';
import { useApp } from '../../context/AppContext';
import { createUser, createCase } from '../../firebase/firestoreService';
import { CASE_WORKFLOWS } from '../../constants/caseStepsConfig';
import { generateSecurePassword } from '../../utils/credentials';
import { 
  X, 
  UserPlus, 
  Shield, 
  DollarSign, 
  KeyRound, 
  RefreshCw, 
  Sparkles,
  Lock
} from 'lucide-react';

interface NewClientModalProps {
  isOpen: boolean;
  onClose: () => void;
  onClientCreated: (clientData: {
    name: string;
    email: string;
    password: string;
    phone?: string;
    caseType?: string;
  }) => void;
}

export const NewClientModal: React.FC<NewClientModalProps> = ({ 
  isOpen, 
  onClose,
  onClientCreated 
}) => {
  const { showToast, refreshData } = useApp();

  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [country, setCountry] = useState('Colombia');
  const [portalPassword, setPortalPassword] = useState('');
  const [uscisEmail, setUscisEmail] = useState('');
  const [uscisPassword, setUscisPassword] = useState('');
  const [totalCost, setTotalCost] = useState(3500);
  const [amountPaid, setAmountPaid] = useState(1000);
  const [caseType, setCaseType] = useState('Petición Familiar (I-130 / Consular)');
  const [caseNumber, setCaseNumber] = useState('IOE-9843210984');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Generar contraseña segura automáticamente al abrir el modal
  useEffect(() => {
    if (isOpen) {
      setPortalPassword(generateSecurePassword(10));
    }
  }, [isOpen]);

  const handleRegeneratePassword = () => {
    const newPass = generateSecurePassword(10);
    setPortalPassword(newPass);
    showToast('Nueva contraseña temporal generada', 'info');
  };

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !email.trim()) return;

    setIsSubmitting(true);
    const finalPassword = portalPassword.trim() || generateSecurePassword(10);

    try {
      // 1. Crear usuario en colección 'users' con portal_password
      const newUser = await createUser({
        name: name.trim(),
        role: 'client',
        email: email.trim(),
        phone: phone.trim() || '+1 (555) 000-0000',
        country_of_origin: country,
        portal_password: finalPassword,
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

      showToast(`Cliente ${name} y credenciales creadas con éxito`, 'success');
      await refreshData();
      
      // Cerrar este modal de formulario y disparar el modal con credenciales para compartir
      onClose();
      onClientCreated({
        name: name.trim(),
        email: email.trim(),
        password: finalPassword,
        phone: phone.trim(),
        caseType
      });

      // Resetear campos
      setName('');
      setEmail('');
      setPhone('');
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
              <p className="text-xs text-slate-400">Creación simultánea en Firestore con credenciales automáticas</p>
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
                <label className="font-semibold text-slate-700 block mb-1">Correo Electrónico (Usuario) *</label>
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
                <label className="font-semibold text-slate-700 block mb-1">Teléfono (WhatsApp)</label>
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

          {/* CREDENCIALES DEL PORTAL (Autogeneración y compartir) */}
          <div className="p-3.5 rounded-xl bg-amber-50/80 border border-amber-200/90 space-y-2">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-1.5 font-bold text-amber-900 text-xs">
                <KeyRound className="w-4 h-4 text-amber-700" />
                <span>Credenciales para el Portal del Cliente (Autogeneradas)</span>
              </div>
              <button
                type="button"
                onClick={handleRegeneratePassword}
                className="inline-flex items-center gap-1 px-2 py-1 rounded-md bg-white hover:bg-amber-100 text-amber-900 border border-amber-300 font-semibold text-[10px] shadow-2xs transition-colors"
                title="Generar otra contraseña aleatoria"
              >
                <RefreshCw className="w-3 h-3" />
                <span>Regenerar</span>
              </button>
            </div>

            <p className="text-[11px] text-amber-800 leading-snug">
              Se generará una cuenta de acceso al portal. Al finalizar, podrá enviar estas credenciales por <strong>WhatsApp</strong> o <strong>Email</strong> con un solo clic.
            </p>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-1">
              <div>
                <span className="text-slate-500 text-[11px] block">Usuario de Acceso:</span>
                <span className="font-mono text-xs font-semibold text-slate-800 break-all">
                  {email || 'Ingrese el correo arriba'}
                </span>
              </div>

              <div>
                <span className="text-slate-500 text-[11px] block">Contraseña Temporal:</span>
                <div className="flex items-center gap-1.5">
                  <input
                    type="text"
                    value={portalPassword}
                    onChange={(e) => setPortalPassword(e.target.value)}
                    className="w-full px-2 py-1 bg-white border border-amber-300 rounded font-mono font-bold text-xs text-amber-950 focus:outline-none focus:ring-1 focus:ring-amber-500"
                  />
                </div>
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
              <span>Credenciales de USCIS / Portal Consular Oficial</span>
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
              className="px-5 py-2.5 bg-slate-900 hover:bg-slate-800 text-white font-semibold rounded-xl shadow-md transition-colors disabled:opacity-50 flex items-center gap-2"
            >
              <KeyRound className="w-4 h-4 text-amber-400" />
              <span>{isSubmitting ? 'Guardando...' : 'Crear y Generar Credenciales'}</span>
            </button>
          </div>

        </form>

      </div>
    </div>
  );
};
