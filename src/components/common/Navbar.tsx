/**
 * @file src/components/common/Navbar.tsx
 * @description Barra de navegación institucional de Consularvisa con identificación de usuario,
 * acceso al panel de edición del perfil del abogado (con cambio de foto), rol activo y cierre de sesión seguro.
 */

import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { 
  Scale, 
  ShieldCheck, 
  UserCircle2, 
  LogOut,
  UserCog,
  Camera
} from 'lucide-react';
import { AdminProfileModal } from '../admin/AdminProfileModal';

export const Navbar: React.FC = () => {
  const { 
    activeUser, 
    setActiveView, 
    setSelectedClientId,
    logout
  } = useApp();

  const [isAdminProfileOpen, setIsAdminProfileOpen] = useState(false);

  const handleBrandClick = () => {
    if (!activeUser) return;
    if (activeUser.role === 'admin') {
      setActiveView('admin_dashboard');
      setSelectedClientId(null);
    } else {
      setActiveView('client_portal');
    }
  };

  return (
    <header className="sticky top-0 z-40 bg-slate-900 border-b border-amber-500/20 shadow-md text-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-18">
          
          {/* Logo & Marca Consularvisa */}
          <div className="flex items-center gap-3">
            <button 
              onClick={handleBrandClick}
              className="flex items-center gap-2.5 group text-left cursor-pointer"
              title="Ir al inicio de su panel"
            >
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-amber-400 via-amber-500 to-amber-700 p-0.5 shadow-md group-hover:scale-105 transition-transform">
                <div className="w-full h-full bg-slate-950 rounded-[10px] flex items-center justify-center">
                  <Scale className="w-5 h-5 text-amber-400" />
                </div>
              </div>
              <div>
                <div className="flex items-center gap-1.5">
                  <span className="font-serif tracking-wider text-lg font-bold text-white group-hover:text-amber-300 transition-colors">
                    CONSULARVISA
                  </span>
                  <span className="text-[10px] uppercase font-bold tracking-widest px-1.5 py-0.5 bg-amber-500/20 text-amber-300 border border-amber-500/30 rounded">
                    CRM
                  </span>
                </div>
                <p className="text-[11px] text-slate-400 font-medium tracking-tight">
                  Inmigration Law & Consular Services
                </p>
              </div>
            </button>
          </div>

          {/* Perfil del Usuario Activo y Cierre de Sesión */}
          {activeUser && (
            <div className="flex items-center gap-2.5 sm:gap-3">
              
              {/* Tarjeta de Identificación del Usuario (Clickable para admin para editar perfil) */}
              {activeUser.role === 'admin' ? (
                <button
                  type="button"
                  onClick={() => setIsAdminProfileOpen(true)}
                  className="flex items-center gap-2.5 px-3 py-1.5 rounded-xl bg-slate-800/90 hover:bg-slate-750 border border-slate-700 hover:border-amber-500/50 text-left transition-all cursor-pointer group shadow-xs"
                  title="Haga clic para editar su información personal, cambiar foto o contraseña"
                >
                  <div className="relative">
                    {activeUser.avatar_url ? (
                      <img 
                        src={activeUser.avatar_url} 
                        alt={activeUser.name} 
                        className="w-8 h-8 rounded-full object-cover border border-amber-400/60 shadow-xs group-hover:scale-105 transition-transform"
                      />
                    ) : (
                      <div className="w-8 h-8 rounded-full bg-amber-500/20 text-amber-300 flex items-center justify-center font-bold text-xs">
                        {activeUser.name.charAt(0)}
                      </div>
                    )}
                    <span className="absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 rounded-full border border-slate-900 bg-amber-400" />
                  </div>

                  <div className="text-left hidden sm:block">
                    <p className="text-xs font-semibold text-slate-100 max-w-[150px] truncate leading-tight group-hover:text-amber-300 transition-colors">
                      {activeUser.name}
                    </p>
                    <div className="flex items-center gap-1 mt-0.5">
                      <ShieldCheck className="w-3 h-3 text-amber-400" />
                      <span className="text-[10px] text-amber-300 font-medium tracking-wide">
                        Abogado
                      </span>
                      <span className="text-[10px] text-slate-400 ml-1 group-hover:text-amber-300">
                        • Editar
                      </span>
                    </div>
                  </div>
                </button>
              ) : (
                <div className="flex items-center gap-2.5 px-3 py-1.5 rounded-xl bg-slate-800/80 border border-slate-700/80">
                  <div className="relative">
                    {activeUser.avatar_url ? (
                      <img 
                        src={activeUser.avatar_url} 
                        alt={activeUser.name} 
                        className="w-8 h-8 rounded-full object-cover border border-emerald-400/50 shadow-xs"
                      />
                    ) : (
                      <div className="w-8 h-8 rounded-full bg-emerald-500/20 text-emerald-300 flex items-center justify-center font-bold text-xs">
                        {activeUser.name.charAt(0)}
                      </div>
                    )}
                    <span className="absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 rounded-full border border-slate-900 bg-emerald-400" />
                  </div>

                  <div className="text-left hidden sm:block">
                    <p className="text-xs font-semibold text-slate-100 max-w-[150px] truncate leading-tight">
                      {activeUser.name}
                    </p>
                    <div className="flex items-center gap-1 mt-0.5">
                      <UserCircle2 className="w-3 h-3 text-emerald-400" />
                      <span className="text-[10px] text-emerald-300 font-medium tracking-wide">
                        Cliente
                      </span>
                    </div>
                  </div>
                </div>
              )}

              {/* Botón Mi Perfil exclusivo para Administrador */}
              {activeUser.role === 'admin' && (
                <button
                  type="button"
                  onClick={() => setIsAdminProfileOpen(true)}
                  className="flex items-center gap-1.5 px-3 py-2 text-xs font-semibold rounded-xl bg-slate-800 hover:bg-slate-700 text-amber-300 hover:text-amber-200 border border-amber-500/30 hover:border-amber-400 transition-all cursor-pointer shadow-xs active:scale-95"
                  title="Editar información del abogado y cambiar foto"
                >
                  <UserCog className="w-3.5 h-3.5 text-amber-400" />
                  <span className="hidden md:inline">Mi Perfil</span>
                </button>
              )}

              {/* Botón de Cerrar Sesión */}
              <button
                onClick={logout}
                className="flex items-center gap-1.5 px-3 py-2 text-xs font-semibold rounded-xl bg-slate-800 hover:bg-rose-950/80 text-slate-300 hover:text-rose-200 border border-slate-700 hover:border-rose-800 transition-all cursor-pointer shadow-xs active:scale-95"
                title="Cerrar sesión de forma segura"
              >
                <LogOut className="w-3.5 h-3.5 text-rose-400" />
                <span className="hidden sm:inline">Cerrar Sesión</span>
              </button>
            </div>
          )}

        </div>
      </div>

      {/* Modal de Configuración del Perfil de Abogado */}
      <AdminProfileModal
        isOpen={isAdminProfileOpen}
        onClose={() => setIsAdminProfileOpen(false)}
      />

    </header>
  );
};
