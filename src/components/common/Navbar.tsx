/**
 * @file src/components/common/Navbar.tsx
 * @description Barra de navegación institucional de Consularvisa con selector de roles y accesos directos.
 */

import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { 
  Scale, 
  ShieldCheck, 
  UserCircle2, 
  ChevronDown, 
  RotateCcw, 
  FileCode2, 
  Sparkles,
  ExternalLink,
  Laptop
} from 'lucide-react';

interface NavbarProps {
  onOpenArchitecture: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({ onOpenArchitecture }) => {
  const { 
    users, 
    activeUser, 
    setActiveUser, 
    activeView, 
    setActiveView, 
    setSelectedClientId,
    resetAllData 
  } = useApp();

  const [isDropdownOpen, setIsDropdownOpen] = useState(false);

  const clients = users.filter(u => u.role === 'client');
  const admins = users.filter(u => u.role === 'admin');

  return (
    <header className="sticky top-0 z-40 bg-slate-900 border-b border-amber-500/20 shadow-md text-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-18">
          
          {/* Logo & Marca Consularvisa */}
          <div className="flex items-center gap-3">
            <button 
              onClick={() => {
                if (activeUser.role === 'admin') {
                  setActiveView('admin_dashboard');
                  setSelectedClientId(null);
                } else {
                  setActiveView('client_portal');
                }
              }}
              className="flex items-center gap-2.5 group text-left"
              title="Ir al inicio"
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

          {/* Acciones del Sistema y Selector de Simulación de Usuario */}
          <div className="flex items-center gap-2 sm:gap-4">
            
            {/* Botón Ver Guía de Arquitectura */}
            <button
              onClick={onOpenArchitecture}
              className="hidden md:flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-amber-300 border border-amber-500/30 hover:border-amber-400 transition-all shadow-xs"
              title="Ver arquitectura del proyecto, estructura de carpetas y guía de escalabilidad"
            >
              <FileCode2 className="w-4 h-4 text-amber-400" />
              <span>Arquitectura & Código</span>
            </button>

            {/* Selector de Rol / Usuario para Probar Ambos Módulos */}
            <div className="relative">
              <button
                onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-slate-800/90 hover:bg-slate-750 border border-slate-700 text-left transition-all focus:outline-none focus:ring-2 focus:ring-amber-500/50"
                aria-expanded={isDropdownOpen}
                aria-label="Cambiar usuario o rol de prueba"
              >
                <div className="relative">
                  {activeUser.avatar_url ? (
                    <img 
                      src={activeUser.avatar_url} 
                      alt={activeUser.name} 
                      className="w-7 h-7 rounded-full object-cover border border-amber-400/50"
                    />
                  ) : (
                    <div className="w-7 h-7 rounded-full bg-amber-500/20 text-amber-300 flex items-center justify-center font-bold text-xs">
                      {activeUser.name.charAt(0)}
                    </div>
                  )}
                  <span className={`absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 rounded-full border border-slate-900 ${activeUser.role === 'admin' ? 'bg-amber-400' : 'bg-emerald-400'}`} />
                </div>

                <div className="hidden sm:block text-left">
                  <p className="text-xs font-semibold text-slate-100 max-w-[140px] truncate leading-tight">
                    {activeUser.name}
                  </p>
                  <p className="text-[10px] text-amber-400/90 font-medium">
                    {activeUser.role === 'admin' ? 'Modo Abogado (Admin)' : 'Portal del Cliente'}
                  </p>
                </div>
                <ChevronDown className="w-4 h-4 text-slate-400" />
              </button>

              {/* Menú Desplegable con opciones de simulación */}
              {isDropdownOpen && (
                <>
                  <div 
                    className="fixed inset-0 z-40" 
                    onClick={() => setIsDropdownOpen(false)} 
                  />
                  <div className="absolute right-0 mt-2 w-72 rounded-2xl bg-slate-900 border border-slate-700 shadow-2xl z-50 py-2 divide-y divide-slate-800 text-slate-200">
                    <div className="px-4 py-2 text-[11px] text-slate-400 font-semibold uppercase tracking-wider">
                      Simular Sesión de Usuario
                    </div>

                    {/* Sección Abogados / Administradores */}
                    <div className="py-1">
                      <div className="px-3 py-1 text-[10px] font-bold text-amber-400 uppercase">
                        Administración Legal
                      </div>
                      {admins.map(admin => (
                        <button
                          key={admin.id}
                          onClick={() => {
                            setActiveUser(admin);
                            setIsDropdownOpen(false);
                          }}
                          className={`w-full text-left px-3 py-2 text-xs flex items-center justify-between hover:bg-slate-800 transition-colors ${activeUser.id === admin.id ? 'bg-amber-500/10 text-amber-300 font-semibold' : ''}`}
                        >
                          <div className="flex items-center gap-2">
                            <ShieldCheck className="w-4 h-4 text-amber-400" />
                            <span className="truncate">{admin.name}</span>
                          </div>
                          {activeUser.id === admin.id && (
                            <span className="text-[10px] bg-amber-400/20 text-amber-300 px-1.5 py-0.5 rounded">Activo</span>
                          )}
                        </button>
                      ))}
                    </div>

                    {/* Sección Clientes */}
                    <div className="py-1 max-h-48 overflow-y-auto">
                      <div className="px-3 py-1 text-[10px] font-bold text-emerald-400 uppercase">
                        Clientes Activos (Portal Móvil)
                      </div>
                      {clients.map(client => (
                        <button
                          key={client.id}
                          onClick={() => {
                            setActiveUser(client);
                            setIsDropdownOpen(false);
                          }}
                          className={`w-full text-left px-3 py-2 text-xs flex items-center justify-between hover:bg-slate-800 transition-colors ${activeUser.id === client.id ? 'bg-emerald-500/10 text-emerald-300 font-semibold' : ''}`}
                        >
                          <div className="flex items-center gap-2 truncate">
                            <UserCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                            <span className="truncate">{client.name}</span>
                          </div>
                          {activeUser.id === client.id && (
                            <span className="text-[10px] bg-emerald-400/20 text-emerald-300 px-1.5 py-0.5 rounded">Activo</span>
                          )}
                        </button>
                      ))}
                    </div>

                    {/* Acciones de Sistema */}
                    <div className="p-2">
                      <button
                        onClick={() => {
                          setIsDropdownOpen(false);
                          resetAllData();
                        }}
                        className="w-full flex items-center justify-center gap-1.5 px-3 py-1.5 text-xs text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg transition-colors"
                      >
                        <RotateCcw className="w-3.5 h-3.5" />
                        <span>Restablecer datos de prueba</span>
                      </button>
                    </div>
                  </div>
                </>
              )}
            </div>

          </div>

        </div>
      </div>
    </header>
  );
};
