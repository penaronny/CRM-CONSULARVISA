/**
 * @file src/components/admin/EditClientModal.tsx
 * @description Modal completo para editar la información de un cliente existente:
 * datos personales, país de origen (listado completo), foto de perfil, credenciales USCIS,
 * clave del portal, finanzas y expediente.
 */

import React, { useState, useEffect, useRef } from 'react';
import { useApp } from '../../context/AppContext';
import { User, Case } from '../../types';
import { updateUser, updateCase } from '../../firebase/firestoreService';
import { FREQUENT_COUNTRIES, ALL_COUNTRIES } from '../../constants/countries';
import { CASE_WORKFLOWS } from '../../constants/caseStepsConfig';
import { formatUSD, calculatePendingBalance } from '../../utils/finance';
import { 
  X, 
  Save, 
  UserCheck, 
  Camera, 
  Upload, 
  Trash2, 
  Shield, 
  DollarSign, 
  KeyRound, 
  Eye, 
  EyeOff,
  Globe,
  FileText
} from 'lucide-react';

interface EditClientModalProps {
  isOpen: boolean;
  onClose: () => void;
  client: User | null;
  clientCase: Case | null;
}

export const EditClientModal: React.FC<EditClientModalProps> = ({
  isOpen,
  onClose,
  client,
  clientCase
}) => {
  const { showToast, refreshData } = useApp();
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Estados del formulario
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [country, setCountry] = useState('República Dominicana');
  const [avatarUrl, setAvatarUrl] = useState('');
  const [portalPassword, setPortalPassword] = useState('');
  const [showPortalPassword, setShowPortalPassword] = useState(false);
  
  // Credenciales USCIS
  const [uscisEmail, setUscisEmail] = useState('');
  const [uscisPassword, setUscisPassword] = useState('');
  const [showUscisPassword, setShowUscisPassword] = useState(false);

  // Finanzas
  const [totalCost, setTotalCost] = useState(0);
  const [amountPaid, setAmountPaid] = useState(0);

  // Caso
  const [caseType, setCaseType] = useState('Petición Familiar (I-130 / Consular)');
  const [caseNumber, setCaseNumber] = useState('');
  const [internalNotes, setInternalNotes] = useState('');

  const [isSubmitting, setIsSubmitting] = useState(false);

  // Sincronizar datos al abrir el modal con el cliente seleccionado
  useEffect(() => {
    if (client) {
      setName(client.name || '');
      setEmail(client.email || '');
      setPhone(client.phone || '');
      setCountry(client.country_of_origin || 'República Dominicana');
      setAvatarUrl(client.avatar_url || '');
      setPortalPassword(client.portal_password || '');
      setUscisEmail(client.uscis_email || '');
      setUscisPassword(client.uscis_password || '');
      setTotalCost(client.total_cost || 0);
      setAmountPaid(client.amount_paid || 0);
    }
    if (clientCase) {
      setCaseType(clientCase.case_type || 'Petición Familiar (I-130 / Consular)');
      setCaseNumber(clientCase.case_number || '');
      setInternalNotes(clientCase.internal_notes || '');
    }
  }, [client, clientCase, isOpen]);

  if (!isOpen || !client) return null;

  // Manejador de carga de foto local
  const handlePhotoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      showToast('Por favor seleccione un archivo de imagen válido (JPG, PNG, WebP).', 'warning');
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      showToast('La imagen debe pesar menos de 5MB.', 'warning');
      return;
    }

    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result === 'string') {
        setAvatarUrl(reader.result);
        showToast('Foto cargada correctamente. Recuerde hacer clic en Guardar.', 'info');
      }
    };
    reader.readAsDataURL(file);
  };

  const handleRemovePhoto = () => {
    setAvatarUrl('');
    if (fileInputRef.current) fileInputRef.current.value = '';
    showToast('Foto eliminada.', 'info');
  };

  const pendingBalance = calculatePendingBalance(totalCost, amountPaid);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !email.trim()) {
      showToast('El nombre y el correo electrónico son obligatorios', 'warning');
      return;
    }

    setIsSubmitting(true);
    try {
      // 1. Actualizar usuario en Firestore
      await updateUser(client.id, {
        name: name.trim(),
        email: email.trim(),
        phone: phone.trim(),
        country_of_origin: country,
        avatar_url: avatarUrl.trim() || undefined,
        portal_password: portalPassword.trim(),
        uscis_email: uscisEmail.trim(),
        uscis_password: uscisPassword.trim(),
        total_cost: Math.max(0, Number(totalCost) || 0),
        amount_paid: Math.max(0, Number(amountPaid) || 0)
      });

      // 2. Actualizar caso si existe
      if (clientCase) {
        await updateCase(clientCase.id, {
          case_type: caseType,
          case_number: caseNumber.trim(),
          internal_notes: internalNotes
        });
      }

      showToast(`Perfil de ${name} actualizado con éxito`, 'success');
      await refreshData();
      onClose();
    } catch (err) {
      console.error('Error updating client:', err);
      showToast('Error al actualizar la información del cliente', 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/75 backdrop-blur-xs">
      <div className="bg-white w-full max-w-2xl rounded-2xl border border-slate-200 shadow-2xl overflow-hidden max-h-[92vh] flex flex-col animate-scale-up">
        
        {/* Cabecera del Modal */}
        <div className="px-6 py-4 bg-slate-900 text-white flex items-center justify-between border-b border-amber-500/20">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl bg-amber-500/20 text-amber-400">
              <UserCheck className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold font-serif text-white">Editar Perfil del Cliente</h2>
              <p className="text-xs text-slate-400">Expediente ID: {client.id} • Actualización en tiempo real</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg hover:bg-slate-800 text-slate-400 hover:text-white transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Cuerpo del Formulario */}
        <form onSubmit={handleSubmit} className="p-6 overflow-y-auto space-y-6 text-xs">
          
          {/* SECCIÓN 1: FOTO DE PERFIL / AVATAR */}
          <div className="bg-slate-50 p-4 rounded-xl border border-slate-200">
            <h3 className="font-bold text-slate-900 text-xs uppercase tracking-wider mb-3 flex items-center gap-2">
              <Camera className="w-4 h-4 text-amber-600" />
              <span>Foto de Perfil del Cliente</span>
            </h3>

            <div className="flex flex-col sm:flex-row items-center gap-4">
              {/* Vista Previa del Avatar */}
              <div className="relative group shrink-0">
                {avatarUrl ? (
                  <img
                    src={avatarUrl}
                    alt={name || 'Cliente'}
                    className="w-20 h-20 rounded-2xl object-cover border-2 border-amber-400 shadow-sm"
                  />
                ) : (
                  <div className="w-20 h-20 rounded-2xl bg-amber-500/20 text-amber-800 flex items-center justify-center font-bold text-2xl border-2 border-dashed border-amber-300">
                    {name ? name.charAt(0) : '?'}
                  </div>
                )}
              </div>

              {/* Controles para cambiar/subir foto */}
              <div className="flex-1 space-y-2 w-full">
                <div className="flex flex-wrap items-center gap-2">
                  <input
                    type="file"
                    ref={fileInputRef}
                    accept="image/*"
                    onChange={handlePhotoUpload}
                    className="hidden"
                    id="client-photo-upload"
                  />
                  <label
                    htmlFor="client-photo-upload"
                    className="inline-flex items-center gap-1.5 px-3 py-2 bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold rounded-lg cursor-pointer transition-colors shadow-2xs"
                  >
                    <Upload className="w-3.5 h-3.5" />
                    <span>Subir Foto</span>
                  </label>

                  {avatarUrl && (
                    <button
                      type="button"
                      onClick={handleRemovePhoto}
                      className="inline-flex items-center gap-1.5 px-3 py-2 bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 font-semibold rounded-lg transition-colors cursor-pointer"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                      <span>Quitar</span>
                    </button>
                  )}
                </div>

                <div>
                  <label className="text-[11px] text-slate-500 block mb-1">
                    O pegar enlace directo de imagen (URL pública):
                  </label>
                  <input
                    type="url"
                    placeholder="https://ejemplo.com/foto.jpg"
                    value={avatarUrl}
                    onChange={(e) => setAvatarUrl(e.target.value)}
                    className="w-full px-3 py-1.5 bg-white border border-slate-200 rounded-lg text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-amber-500"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* SECCIÓN 2: DATOS PERSONALES */}
          <div>
            <h3 className="font-bold text-slate-900 text-xs uppercase tracking-wider mb-3 text-slate-700">
              Datos Personales & Origen
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="font-semibold text-slate-700 block mb-1">Nombre Completo *</label>
                <input
                  type="text"
                  required
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
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-amber-500"
                />
              </div>

              <div>
                <label className="font-semibold text-slate-700 block mb-1">Teléfono (WhatsApp)</label>
                <input
                  type="text"
                  placeholder="+1 (809) 000-0000"
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

          {/* SECCIÓN 3: CREDENCIALES DEL PORTAL & USCIS */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            
            {/* Clave de Acceso al Portal Consularvisa */}
            <div className="p-3.5 rounded-xl bg-amber-50/70 border border-amber-200 space-y-2">
              <div className="flex items-center gap-1.5 font-bold text-amber-900">
                <KeyRound className="w-4 h-4 text-amber-700" />
                <span>Acceso al Portal del Cliente</span>
              </div>
              <div>
                <label className="text-[11px] font-semibold text-amber-800 block mb-1">
                  Contraseña del Portal
                </label>
                <div className="relative">
                  <input
                    type={showPortalPassword ? 'text' : 'password'}
                    value={portalPassword}
                    onChange={(e) => setPortalPassword(e.target.value)}
                    placeholder="Contraseña del cliente"
                    className="w-full pl-3 pr-9 py-2 bg-white border border-amber-300 rounded-lg text-slate-900 font-mono text-xs focus:outline-none focus:ring-2 focus:ring-amber-500"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPortalPassword(!showPortalPassword)}
                    className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                  >
                    {showPortalPassword ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                  </button>
                </div>
              </div>
            </div>

            {/* Credenciales de USCIS / CEAC */}
            <div className="p-3.5 rounded-xl bg-blue-50/70 border border-blue-200 space-y-2">
              <div className="flex items-center gap-1.5 font-bold text-blue-900">
                <Shield className="w-4 h-4 text-blue-700" />
                <span>Credenciales USCIS / CEAC</span>
              </div>
              <div className="space-y-1.5">
                <div>
                  <input
                    type="email"
                    placeholder="Usuario / Correo USCIS"
                    value={uscisEmail}
                    onChange={(e) => setUscisEmail(e.target.value)}
                    className="w-full px-2.5 py-1.5 bg-white border border-blue-200 rounded-lg text-slate-900 text-xs focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div className="relative">
                  <input
                    type={showUscisPassword ? 'text' : 'password'}
                    placeholder="Contraseña USCIS"
                    value={uscisPassword}
                    onChange={(e) => setUscisPassword(e.target.value)}
                    className="w-full pl-2.5 pr-8 py-1.5 bg-white border border-blue-200 rounded-lg text-slate-900 font-mono text-xs focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                  <button
                    type="button"
                    onClick={() => setShowUscisPassword(!showUscisPassword)}
                    className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                  >
                    {showUscisPassword ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                  </button>
                </div>
              </div>
            </div>

          </div>

          {/* SECCIÓN 4: EXPEDIENTE & FINANZAS */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            
            {/* Trámite */}
            <div className="space-y-2">
              <label className="font-semibold text-slate-700 block">Tipo de Trámite Legal</label>
              <select
                value={caseType}
                onChange={(e) => setCaseType(e.target.value)}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-amber-500"
              >
                {Object.keys(CASE_WORKFLOWS).map(type => (
                  <option key={type} value={type}>{type}</option>
                ))}
              </select>

              <label className="font-semibold text-slate-700 block mt-2">Número de Caso (USCIS/NVC)</label>
              <input
                type="text"
                placeholder="ej. IOE-9843210984"
                value={caseNumber}
                onChange={(e) => setCaseNumber(e.target.value)}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-amber-500 font-mono"
              />
            </div>

            {/* Finanzas */}
            <div className="bg-slate-50 p-3.5 rounded-xl border border-slate-200 space-y-2">
              <div className="flex items-center gap-1.5 font-bold text-slate-800 text-xs">
                <DollarSign className="w-4 h-4 text-emerald-600" />
                <span>Gestión Financiera</span>
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="text-[11px] font-semibold text-slate-600 block mb-0.5">Costo Total ($)</label>
                  <input
                    type="number"
                    min="0"
                    step="50"
                    value={totalCost}
                    onChange={(e) => setTotalCost(Number(e.target.value))}
                    className="w-full px-2.5 py-1.5 bg-white border border-slate-200 rounded-lg text-slate-900 font-semibold text-xs"
                  />
                </div>
                <div>
                  <label className="text-[11px] font-semibold text-slate-600 block mb-0.5">Monto Pagado ($)</label>
                  <input
                    type="number"
                    min="0"
                    step="50"
                    value={amountPaid}
                    onChange={(e) => setAmountPaid(Number(e.target.value))}
                    className="w-full px-2.5 py-1.5 bg-white border border-slate-200 rounded-lg text-slate-900 font-semibold text-xs"
                  />
                </div>
              </div>
              <div className="pt-1.5 border-t border-slate-200 flex items-center justify-between text-xs">
                <span className="text-slate-500 font-medium">Saldo Pendiente:</span>
                <span className={`font-bold ${pendingBalance > 0 ? 'text-amber-700' : 'text-emerald-700'}`}>
                  {formatUSD(pendingBalance)}
                </span>
              </div>
            </div>

          </div>

          {/* Notas internas del expediente */}
          <div>
            <label className="font-semibold text-slate-700 block mb-1 flex items-center gap-1.5">
              <FileText className="w-3.5 h-3.5 text-slate-500" />
              <span>Notas Internas del Expediente (Confidencial Abogado)</span>
            </label>
            <textarea
              rows={2}
              placeholder="Notas internas visibles solo para el equipo legal..."
              value={internalNotes}
              onChange={(e) => setInternalNotes(e.target.value)}
              className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-amber-500 text-xs"
            />
          </div>

          {/* Botones de Acción */}
          <div className="pt-3 border-t border-slate-200 flex items-center justify-end gap-2.5">
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
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold transition-all shadow-md cursor-pointer disabled:opacity-50"
            >
              <Save className="w-4 h-4" />
              <span>{isSubmitting ? 'Guardando...' : 'Guardar Cambios'}</span>
            </button>
          </div>

        </form>

      </div>
    </div>
  );
};
