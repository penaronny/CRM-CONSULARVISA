/**
 * @file src/App.tsx
 * @description Orquestador principal de vistas y roles para Consularvisa CRM & Portal de Clientes.
 */

import React, { useState } from 'react';
import { AppProvider, useApp } from './context/AppContext';
import { Navbar } from './components/common/Navbar';
import { ToastContainer } from './components/common/ToastContainer';
import { AdminDashboard } from './components/admin/AdminDashboard';
import { ClientProfile } from './components/admin/ClientProfile';
import { ClientDashboard } from './components/client/ClientDashboard';
import { NewClientModal } from './components/admin/NewClientModal';
import { ArchitectureGuideModal } from './components/docs/ArchitectureGuideModal';
import { ShieldCheck, UserCheck, Sparkles, Scale, Info, ArrowRight } from 'lucide-react';

const MainContent: React.FC = () => {
  const { 
    activeUser, 
    selectedClientId, 
    setSelectedClientId, 
    setActiveUser,
    users 
  } = useApp();

  const [isNewClientModalOpen, setIsNewClientModalOpen] = useState(false);
  const [isArchitectureModalOpen, setIsArchitectureModalOpen] = useState(false);

  const isAdmin = activeUser.role === 'admin';

  return (
    <div className="min-h-screen bg-slate-100 flex flex-col text-slate-900 font-sans">
      
      {/* Barra de Navegación Global */}
      <Navbar onOpenArchitecture={() => setIsArchitectureModalOpen(true)} />

      {/* Banner de Estado de Modo / Rol de Demostración */}
      <div className={`border-b transition-colors ${isAdmin ? 'bg-amber-950/90 border-amber-800 text-amber-200' : 'bg-slate-900 border-slate-800 text-slate-300'}`}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-2.5 flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs">
          
          <div className="flex items-center gap-2">
            {isAdmin ? (
              <span className="p-1 rounded-md bg-amber-500/20 text-amber-400">
                <ShieldCheck className="w-4 h-4" />
              </span>
            ) : (
              <span className="p-1 rounded-md bg-emerald-500/20 text-emerald-400">
                <UserCheck className="w-4 h-4" />
              </span>
            )}
            <p>
              <strong className="text-white">
                {isAdmin ? 'MÓDULO 1: PANEL DE ADMINISTRACIÓN (VISTA ABOGADO)' : 'MÓDULO 2: PORTAL DEL CLIENTE (VISTA USUARIO)'}
              </strong>
              <span className="hidden md:inline ml-2 opacity-80">
                — {isAdmin ? 'Gestión de clientes, credenciales USCIS, actualización rápida de estatus y finanzas.' : 'Seguimiento visual de caso, bóveda de documentos protegida y chat directo.'}
              </span>
            </p>
          </div>

          <div className="flex items-center gap-2 self-start sm:self-auto">
            {isAdmin ? (
              <button
                onClick={() => {
                  const firstClient = users.find(u => u.role === 'client');
                  if (firstClient) setActiveUser(firstClient);
                }}
                className="inline-flex items-center gap-1.5 px-3 py-1 rounded-lg bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold transition-all shadow-xs"
              >
                <span>Probar Vista Cliente</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            ) : (
              <button
                onClick={() => {
                  const adminUser = users.find(u => u.role === 'admin');
                  if (adminUser) setActiveUser(adminUser);
                }}
                className="inline-flex items-center gap-1.5 px-3 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-amber-300 border border-amber-500/30 font-bold transition-all"
              >
                <span>Volver a Vista Abogado (Admin)</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

        </div>
      </div>

      {/* Contenido Dinámico de la Aplicación */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8">
        {isAdmin ? (
          selectedClientId ? (
            <ClientProfile
              clientId={selectedClientId}
              onBack={() => setSelectedClientId(null)}
            />
          ) : (
            <AdminDashboard
              onSelectClient={(clientId) => setSelectedClientId(clientId)}
              onOpenNewClientModal={() => setIsNewClientModalOpen(true)}
            />
          )
        ) : (
          <ClientDashboard clientId={activeUser.id} />
        )}
      </main>

      {/* Pie de Página Institucional */}
      <footer className="mt-auto bg-slate-950 text-slate-400 border-t border-slate-800 py-6 text-xs">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <Scale className="w-4 h-4 text-amber-500" />
            <span className="font-serif font-bold text-white tracking-wider">CONSULARVISA</span>
            <span>• Firma Legal de Inmigración y Trámites Consulares</span>
          </div>

          <div className="flex items-center gap-4 text-slate-400">
            <span>Miami, FL • Bogotá, COL</span>
            <span>•</span>
            <button
              onClick={() => setIsArchitectureModalOpen(true)}
              className="text-amber-400 hover:underline font-semibold"
            >
              Ver Esquema Firestore & Guía de Código
            </button>
          </div>
        </div>
      </footer>

      {/* Modales y Notificaciones */}
      <NewClientModal
        isOpen={isNewClientModalOpen}
        onClose={() => setIsNewClientModalOpen(false)}
      />

      <ArchitectureGuideModal
        isOpen={isArchitectureModalOpen}
        onClose={() => setIsArchitectureModalOpen(false)}
      />

      <ToastContainer />
    </div>
  );
};

export default function App() {
  return (
    <AppProvider>
      <MainContent />
    </AppProvider>
  );
}
