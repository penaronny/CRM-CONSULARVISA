/**
 * @file src/components/admin/AdminProfileModal.tsx
 * @description Panel de perfil del abogado / administrador para editar sus datos personales,
 * número de teléfono, cambiar o subir su foto de perfil y actualizar su contraseña de acceso.
 */

import React, { useState, useEffect, useRef } from 'react';
import { useApp } from '../../context/AppContext';
import { updateUser, updateUserPassword } from '../../firebase/firestoreService';
import { 
  X, 
  Save, 
  ShieldCheck, 
  Camera, 
  Upload, 
  Trash2, 
  Lock, 
  Eye, 
  EyeOff, 
  Phone, 
  Mail, 
  User as UserIcon,
  CheckCircle2 
} from 'lucide-react';

interface AdminProfileModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const AdminProfileModal: React.FC<AdminProfileModalProps> = ({
  isOpen,
  onClose
}) => {
  const { activeUser, showToast, refreshData } = useApp();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [avatarUrl, setAvatarUrl] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (activeUser && isOpen) {
      setName(activeUser.name || '');
      setPhone(activeUser.phone || '');
      setAvatarUrl(activeUser.avatar_url || '');
      setNewPassword('');
      setConfirmPassword('');
    }
  }, [activeUser, isOpen]);

  if (!isOpen || !activeUser) return null;

  // Manejo de carga de foto local
  const handlePhotoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      showToast('Por favor seleccione un archivo de imagen válido (JPG, PNG, WebP).', 'warning');
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
        showToast('Foto cargada. Guarde los cambios para confirmar.', 'info');
      }
    };
    reader.readAsDataURL(file);
  };

  const handleRemovePhoto = () => {
    setAvatarUrl('');
    if (fileInputRef.current) fileInputRef.current.value = '';
    showToast('Foto eliminada.', 'info');
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      showToast('El nombre no puede estar vacío.', 'warning');
      return;
    }

    if (newPassword && newPassword !== confirmPassword) {
      showToast('Las contraseñas no coinciden.', 'warning');
      return;
    }

    setIsSubmitting(true);
    try {
      const updates: any = {
        name: name.trim(),
        phone: phone.trim(),
        avatar_url: avatarUrl.trim() || undefined
      };

      if (newPassword.trim()) {
        updates.portal_password = newPassword.trim();
      }

      await updateUser(activeUser.id, updates);
      showToast('Su perfil de abogado ha sido actualizado exitosamente.', 'success');
      await refreshData();
      onClose();
    } catch (err) {
      console.error(err);
      showToast('Error al actualizar el perfil.', 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-xs">
      <div className="bg-white w-full max-w-lg rounded-2xl border border-slate-200 shadow-2xl overflow-hidden max-h-[90vh] flex flex-col animate-scale-up">
        
        {/* Cabecera del Panel */}
        <div className="px-6 py-4 bg-slate-900 text-white flex items-center justify-between border-b border-amber-500/20">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl bg-amber-500/20 text-amber-400">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold font-serif text-white">Mi Perfil de Abogado</h2>
              <p className="text-xs text-slate-400">Configuración de cuenta y personalización</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg hover:bg-slate-800 text-slate-400 hover:text-white transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Formulario */}
        <form onSubmit={handleSubmit} className="p-6 overflow-y-auto space-y-5 text-xs">
          
          {/* FOTO DE PERFIL / AVATAR */}
          <div className="bg-slate-50 p-4 rounded-xl border border-slate-200">
            <h3 className="font-bold text-slate-900 text-xs uppercase tracking-wider mb-3 flex items-center gap-2">
              <Camera className="w-4 h-4 text-amber-600" />
              <span>Foto de Perfil Profesional</span>
            </h3>

            <div className="flex flex-col sm:flex-row items-center gap-4">
              <div className="relative group shrink-0">
                {avatarUrl ? (
                  <img
                    src={avatarUrl}
                    alt={name}
                    className="w-20 h-20 rounded-full object-cover border-2 border-amber-500 shadow-md"
                  />
                ) : (
                  <div className="w-20 h-20 rounded-full bg-amber-500/20 text-amber-800 flex items-center justify-center font-bold text-2xl border-2 border-amber-400">
                    {name ? name.charAt(0) : 'A'}
                  </div>
                )}
              </div>

              <div className="flex-1 space-y-2 w-full">
                <div className="flex flex-wrap items-center gap-2">
                  <input
                    type="file"
                    ref={fileInputRef}
                    accept="image/*"
                    onChange={handlePhotoUpload}
                    className="hidden"
                    id="admin-photo-upload"
                  />
                  <label
                    htmlFor="admin-photo-upload"
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
                  <input
                    type="url"
                    placeholder="O pegar URL de imagen pública..."
                    value={avatarUrl}
                    onChange={(e) => setAvatarUrl(e.target.value)}
                    className="w-full px-3 py-1.5 bg-white border border-slate-200 rounded-lg text-slate-800 placeholder-slate-400 text-[11px] focus:outline-none focus:ring-2 focus:ring-amber-500"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* DATOS DE LA CUENTA */}
          <div className="space-y-3">
            <div>
              <label className="font-semibold text-slate-700 block mb-1">Nombre Completo Profesional *</label>
              <div className="relative">
                <UserIcon className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full pl-9 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-amber-500 font-medium"
                />
              </div>
            </div>

            <div>
              <label className="font-semibold text-slate-700 block mb-1">Correo Electrónico (Login)</label>
              <div className="relative">
                <Mail className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                <input
                  type="email"
                  disabled
                  value={activeUser.email}
                  className="w-full pl-9 pr-3 py-2 bg-slate-100 border border-slate-200 rounded-xl text-slate-500 cursor-not-allowed"
                />
              </div>
              <p className="text-[10px] text-slate-400 mt-0.5">El correo institucional de acceso principal no se modifica desde aquí.</p>
            </div>

            <div>
              <label className="font-semibold text-slate-700 block mb-1">Teléfono Directo</label>
              <div className="relative">
                <Phone className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                <input
                  type="text"
                  placeholder="+1 (809) 000-0000"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  className="w-full pl-9 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-amber-500"
                />
              </div>
            </div>
          </div>

          {/* CAMBIAR CONTRASEÑA */}
          <div className="p-3.5 rounded-xl bg-amber-50/70 border border-amber-200 space-y-2.5">
            <div className="flex items-center gap-1.5 font-bold text-amber-900">
              <Lock className="w-4 h-4 text-amber-700" />
              <span>Cambiar Contraseña de Acceso (Opcional)</span>
            </div>
            <p className="text-[11px] text-amber-800">
              Deje estos campos en blanco si no desea modificar su contraseña actual.
            </p>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  placeholder="Nueva contraseña"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  className="w-full pl-3 pr-8 py-2 bg-white border border-amber-300 rounded-lg text-slate-900 font-mono text-xs focus:outline-none focus:ring-2 focus:ring-amber-500"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                >
                  {showPassword ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                </button>
              </div>

              <div>
                <input
                  type={showPassword ? 'text' : 'password'}
                  placeholder="Confirmar contraseña"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  className="w-full px-3 py-2 bg-white border border-amber-300 rounded-lg text-slate-900 font-mono text-xs focus:outline-none focus:ring-2 focus:ring-amber-500"
                />
              </div>
            </div>
          </div>

          {/* Botones */}
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
