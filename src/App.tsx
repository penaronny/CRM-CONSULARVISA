/**
 * @file src/App.tsx
 * @description Orquestador principal de vistas y control estricto de acceso basado en roles (RBAC)
 * para Consularvisa CRM & Portal de Clientes.
 * 
 * Seguridad:
 * - Los clientes solo pueden acceder a su respectivo Portal del Cliente (ClientDashboard).
 * - La administración de clientes, finanzas y notas internas está estrictamente reservada para el rol 'admin'.
 */

import React, { useState } from 'react';
import { AppProvider, useApp } from './context/AppContext';
import { Navbar } from './components/common/Navbar';
import { ToastContainer } from './components/common/ToastContainer';
import { LoginView } from './components/auth/LoginView';
import { AdminDashboard } from './components/admin/AdminDashboard';
import { ClientProfile } from './components/admin/ClientProfile';
import { ClientDashboard } from './components/client/ClientDashboard';
import { NewClientModal } from './components/admin/NewClientModal';
import { ClientCredentialsModal } from './components/admin/ClientCredentialsModal';
import { Scale } from 'lucide-react';

const MainContent: React.FC = () => {
  const { 
    isAuthenticated,
    activeUser, 
    selectedClientId, 
    setSelectedClientId
  } = useApp();

  const [isNewClientModalOpen, setIsNewClientModalOpen] = useState(false);
  const [isCredentialsModalOpen, setIsCredentialsModalOpen] = useState(false);
  const [createdClientData, setCreatedClientData] = useState<{
    name: string;
    email: string;
    password: string;
    phone?: string;
    caseType?: string;
  } | null>(null);

  // Si no está autenticado, renderizar la pantalla estricta de inicio de sesión
  if (!isAuthenticated || !activeUser) {
    return (
      <>
        <LoginView />
        <ToastContainer />
      </>
    );
  }

  const isAdmin = activeUser.role === 'admin';

  // CONTROL DE ACCESO ESTRICTO (RBAC):
  // Si el usuario autenticado es un cliente, únicamente puede ver su propio portal
  if (!isAdmin) {
    return (
      <div className="min-h-screen bg-slate-100 flex flex-col text-slate-900 font-sans">
        <Navbar />

        <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8">
          <ClientDashboard clientId={activeUser.id} />
        </main>

        <footer className="mt-auto bg-slate-950 text-slate-400 border-t border-slate-800 py-6 text-xs">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-2">
              <Scale className="w-4 h-4 text-amber-500" />
              <span className="font-serif font-bold text-white tracking-wider">CONSULARVISA</span>
              <span>• Firma Legal de Inmigración y Trámites Consulares</span>
            </div>
            <div className="text-slate-400">
              <span>Portal de Clientes • Miami, FL & Bogotá, COL</span>
            </div>
          </div>
        </footer>

        <ToastContainer />
      </div>
    );
  }

  // Vista exclusiva de Administrador / Abogado
  return (
    <div className="min-h-screen bg-slate-100 flex flex-col text-slate-900 font-sans">
      
      {/* Barra de Navegación Global */}
      <Navbar />

      {/* Contenido Principal de Gestión Legal */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8">
        {selectedClientId ? (
          <ClientProfile
            clientId={selectedClientId}
            onBack={() => setSelectedClientId(null)}
          />
        ) : (
          <AdminDashboard
            onSelectClient={(clientId) => setSelectedClientId(clientId)}
            onOpenNewClientModal={() => setIsNewClientModalOpen(true)}
          />
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
            <span className="text-amber-400/90 font-medium">Panel de Gestión Confidencial</span>
          </div>
        </div>
      </footer>

      {/* Modal para Crear Nuevo Cliente */}
      <NewClientModal
        isOpen={isNewClientModalOpen}
        onClose={() => setIsNewClientModalOpen(false)}
        onClientCreated={(data) => {
          setCreatedClientData(data);
          setIsCredentialsModalOpen(true);
        }}
      />

      {/* Modal para Mostrar y Compartir Credenciales Generadas */}
      <ClientCredentialsModal
        isOpen={isCredentialsModalOpen}
        onClose={() => {
          setIsCredentialsModalOpen(false);
          setCreatedClientData(null);
        }}
        clientData={createdClientData}
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
