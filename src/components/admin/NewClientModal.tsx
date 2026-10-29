/**
 * @file src/components/admin/NewClientModal.tsx
 * @description Modal para registrar un nuevo cliente con su expediente, credenciales USCIS,
 * listado completo de países de origen, carga o cambio de foto de perfil y generación automática de clave.
 */

import React, { useState, useEffect, useRef } from 'react';
import { useApp } from '../../context/AppContext';
import { createUser, createCase } from '../../firebase/firestoreService';
import { CASE_WORKFLOWS } from '../../constants/caseStepsConfig';
import { FREQUENT_COUNTRIES, ALL_COUNTRIES } from '../../constants/countries';
import { generateSecurePassword } from '../../utils/credentials';
import { 
  X, 
  UserPlus, 
  Shield, 
  DollarSign, 
  KeyRound, 
  RefreshCw, 
  Sparkles,
  Lock,
  Camera,
  Upload,
  Trash2,
  Globe
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
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [country, setCountry] = useState('República Dominicana');
  const [avatarUrl, setAvatarUrl] = useState('');
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

  const handlePhotoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      showToast('Por favor seleccione una imagen válida (JPG, PNG, WebP).', 'warning');
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      showToast('La foto debe pesar menos de 5MB.', 'warning');
      return;
    }

    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result === 'string') {
        setAvatarUrl(reader.result);
        showToast('Foto cargada correctamente.', 'info');
      }
    };
    reader.readAsDataURL(file);
  };

  const handleRemovePhoto = () => {
    setAvatarUrl('');
    if (fileInputRef.current) fileInputRef.current.value = '';
    showToast('Foto removida.', 'info');
  };

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !email.trim()) {
      showToast('Por favor ingrese el nombre y correo del cliente', 'warning');
      return;
    }

    setIsSubmitting(true);
    const finalPassword = portalPassword.trim() || generateSecurePassword(10);

    try {
      // 1. Crear usuario en colección 'users' con portal_password y foto
      const defaultAvatar = `https://images.unsplash.com/photo-${1534528741775 + Math.floor(Math.random() * 1000)}?w=160&auto=format&fit=crop&q=80`;
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
        avatar_url: avatarUrl.trim() || defaultAvatar,
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
      setAvatarUrl('');
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
        <div className="px-6 py-4 bg-slate-900 text-white flex items-center justify-between border-b border-amber-500/20">
          <div className="flex items-center gap-2.5">
            <UserPlus className="w-5 h-5 text-amber-400" />
            <div>
              <h2 className="text-base font-bold font-serif">Registrar Nuevo Cliente & Trámite</h2>
              <p className="text-xs text-slate-400">Creación simultánea en Firestore con credenciales automáticas</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg hover:bg-slate-800 text-slate-400 hover:text-white transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-6 overflow-y-auto space-y-4 text-xs">
          
          {/* FOTO DEL CLIENTE */}
          <div className="bg-slate-50 p-3.5 rounded-xl border border-slate-200">
            <label className="font-semibold text-slate-700 block mb-2 flex items-center gap-1.5">
              <Camera className="w-4 h-4 text-amber-600" />
              <span>Foto de Perfil del Cliente (Opcional)</span>
            </label>
            <div className="flex items-center gap-3">
              <div className="relative shrink-0">
                {avatarUrl ? (
                  <img
                    src={avatarUrl}
                    alt="Vista previa"
                    className="w-14 h-14 rounded-xl object-cover border-2 border-amber-400 shadow-2xs"
                  />
                ) : (
                  <div className="w-14 h-14 rounded-xl bg-amber-500/20 text-amber-800 flex items-center justify-center font-bold text-lg border-2 border-dashed border-amber-300">
                    {name ? name.charAt(0) : '+'}
                  </div>
                )}
              </div>

              <div className="flex-1 space-y-1.5">
                <div className="flex items-center gap-2">
                  <input
                    type="file"
                    ref={fileInputRef}
                    accept="image/*"
                    onChange={handlePhotoUpload}
                    className="hidden"
                    id="new-client-photo"
                  />
                  <label
                    htmlFor="new-client-photo"
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold rounded-lg cursor-pointer transition-colors shadow-2xs text-[11px]"
                  >
                    <Upload className="w-3.5 h-3.5" />
                    <span>Subir Foto</span>
                  </label>
                  {avatarUrl && (
                    <button
                      type="button"
                      onClick={handleRemovePhoto}
                      className="px-2.5 py-1.5 bg-rose-50 text-rose-700 hover:bg-rose-100 rounded-lg font-semibold text-[11px] transition-colors"
                    >
                      Quitar
                    </button>
                  )}
                </div>
                <input
                  type="url"
                  placeholder="O pegar URL de imagen pública..."
                  value={avatarUrl}
                  onChange={(e) => setAvatarUrl(e.target.value)}
                  className="w-full px-2.5 py-1 bg-white border border-slate-200 rounded-lg text-slate-800 placeholder-slate-400 text-[11px] focus:outline-none focus:ring-1 focus:ring-amber-500"
                />
              </div>
            </div>
          </div>

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

              {/* LISTADO COMPLETO DE PAÍSES */}
              <div>
                <label className="font-semibold text-slate-700 block mb-1 flex items-center gap-1.5">
                  <Globe className="w-3.5 h-3.5 text-amber-600" />
                  <span>País de Origen</span>
                </label>
                <select
                  value={country}
                  onChange={(e) => setCountry(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-amber-500 font-medium"
                >
                  <optgroup label="Países Frecuentes">
                    {FREQUENT_COUNTRIES.map(c => (
                      <option key={`freq-${c}`} value={c}>{c}</option>
                    ))}
                  </optgroup>
                  <optgroup label="Todos los Países (A - Z)">
                    {ALL_COUNTRIES.map(c => (
                      <option key={`all-${c}`} value={c}>{c}</option>
                    ))}
                  </optgroup>
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
                className="inline-flex items-center gap-1 px-2 py-1 rounded-md bg-white hover:bg-amber-100 text-amber-900 border border-amber-300 font-semibold text-[10px] shadow-2xs transition-colors cursor-pointer"
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
                <span className="font-mono font-semibold text-slate-800 bg-white px-2 py-1 rounded border border-amber-200 block truncate">
                  {email.trim() || 'mariana@gmail.com'}
                </span>
              </div>

              <div>
                <span className="text-slate-500 text-[11px] block">Contraseña Asignada:</span>
                <span className="font-mono font-bold text-amber-900 bg-amber-100/80 px-2 py-1 rounded border border-amber-300 block tracking-wider">
                  {portalPassword}
                </span>
              </div>
            </div>
          </div>

          {/* Credenciales USCIS */}
          <div>
            <h3 className="font-bold text-slate-900 uppercase tracking-wider text-[11px] mb-2 text-slate-600 flex items-center gap-1.5">
              <Shield className="w-3.5 h-3.5 text-blue-600" />
              <span>Credenciales Oficiales de USCIS / CEAC</span>
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="font-semibold text-slate-700 block mb-1">Correo Registrado en USCIS</label>
                <input
                  type="email"
                  placeholder="usuario.uscis@email.com"
                  value={uscisEmail}
                  onChange={(e) => setUscisEmail(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-amber-500"
                />
              </div>

              <div>
                <label className="font-semibold text-slate-700 block mb-1">Contraseña de USCIS</label>
                <input
                  type="text"
                  placeholder="PasswordUscis2025#"
                  value={uscisPassword}
                  onChange={(e) => setUscisPassword(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-amber-500 font-mono"
                />
              </div>
            </div>
          </div>

          {/* Información del Caso */}
          <div>
            <h3 className="font-bold text-slate-900 uppercase tracking-wider text-[11px] mb-2 text-slate-600">
              Datos del Expediente y Caso
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="font-semibold text-slate-700 block mb-1">Tipo de Trámite</label>
                <select
                  value={caseType}
                  onChange={(e) => setCaseType(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-amber-500"
                >
                  {Object.keys(CASE_WORKFLOWS).map(type => (
                    <option key={type} value={type}>{type}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="font-semibold text-slate-700 block mb-1">Número de Caso (USCIS/NVC)</label>
                <input
                  type="text"
                  placeholder="IOE-9843210984"
                  value={caseNumber}
                  onChange={(e) => setCaseNumber(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-amber-500 font-mono"
                />
              </div>
            </div>
          </div>

          {/* Finanzas Iniciales */}
          <div>
            <h3 className="font-bold text-slate-900 uppercase tracking-wider text-[11px] mb-2 text-slate-600 flex items-center gap-1.5">
              <DollarSign className="w-3.5 h-3.5 text-emerald-600" />
              <span>Acuerdo Financiero Inicial</span>
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="font-semibold text-slate-700 block mb-1">Costo Total del Trámite ($)</label>
                <input
                  type="number"
                  min="0"
                  step="50"
                  value={totalCost}
                  onChange={(e) => setTotalCost(Number(e.target.value))}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-amber-500"
                />
              </div>

              <div>
                <label className="font-semibold text-slate-700 block mb-1">Primer Pago Recibido ($)</label>
                <input
                  type="number"
                  min="0"
                  step="50"
                  value={amountPaid}
                  onChange={(e) => setAmountPaid(Number(e.target.value))}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-amber-500"
                />
              </div>
            </div>
          </div>

          {/* Footer Actions */}
          <div className="pt-4 border-t border-slate-200 flex items-center justify-end gap-3">
            <button
              type="button"
              onClick={onClose}
              disabled={isSubmitting}
              className="px-4 py-2 rounded-xl text-slate-700 hover:bg-slate-100 font-semibold transition-colors cursor-pointer"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-gradient-to-r from-amber-500 via-amber-600 to-amber-700 hover:from-amber-600 hover:to-amber-800 text-slate-950 font-bold shadow-md hover:shadow-amber-500/20 transition-all cursor-pointer disabled:opacity-50"
            >
              <Sparkles className="w-4 h-4" />
              <span>{isSubmitting ? 'Registrando...' : 'Crear Cliente y Generar Clave'}</span>
            </button>
          </div>

        </form>

      </div>
    </div>
  );
};
