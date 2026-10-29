/**
 * @file src/context/AppContext.tsx
 * @description Contexto global reactivo para la gestión de usuarios, casos y sincronización de datos.
 */

import React, { createContext, useContext, useState, useEffect, useCallback, ReactNode } from 'react';
import { User, Case } from '../types';
import { 
  getUsers, 
  getCases, 
  initializeDatabase, 
  subscribeToChanges, 
  updateCase, 
  updateUser,
  resetDatabaseToSeed 
} from '../firebase/firestoreService';

interface Toast {
  id: string;
  type: 'success' | 'info' | 'warning' | 'error';
  message: string;
}

interface AppContextType {
  users: User[];
  cases: Case[];
  activeUser: User;
  selectedClientId: string | null;
  activeView: 'admin_dashboard' | 'client_profile' | 'client_portal' | 'architecture_guide';
  isLoading: boolean;
  toasts: Toast[];
  setActiveUser: (user: User) => void;
  setSelectedClientId: (clientId: string | null) => void;
  setActiveView: (view: 'admin_dashboard' | 'client_profile' | 'client_portal' | 'architecture_guide') => void;
  quickUpdateCaseStatus: (caseId: string, newStatus: string) => Promise<void>;
  updateClientFinancials: (clientId: string, totalCost: number, amountPaid: number) => Promise<void>;
  showToast: (message: string, type?: 'success' | 'info' | 'warning' | 'error') => void;
  removeToast: (id: string) => void;
  resetAllData: () => void;
  refreshData: () => Promise<void>;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

export const AppProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [users, setUsers] = useState<User[]>([]);
  const [cases, setCases] = useState<Case[]>([]);
  const [activeUser, setActiveUserState] = useState<User | null>(null);
  const [selectedClientId, setSelectedClientId] = useState<string | null>(null);
  const [activeView, setActiveView] = useState<'admin_dashboard' | 'client_profile' | 'client_portal' | 'architecture_guide'>('admin_dashboard');
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [toasts, setToasts] = useState<Toast[]>([]);

  const showToast = useCallback((message: string, type: 'success' | 'info' | 'warning' | 'error' = 'success') => {
    const id = `toast-${Date.now()}-${Math.random()}`;
    setToasts(prev => [...prev, { id, type, message }]);
    setTimeout(() => {
      setToasts(prev => prev.filter(t => t.id !== id));
    }, 4000);
  }, []);

  const removeToast = useCallback((id: string) => {
    setToasts(prev => prev.filter(t => t.id !== id));
  }, []);

  // Carga inicial y reactiva de datos
  const refreshData = useCallback(async () => {
    try {
      const [u, c] = await Promise.all([getUsers(), getCases()]);
      setUsers(u);
      setCases(c);

      // Si no hay usuario activo, seleccionar por defecto el admin
      setActiveUserState(prev => {
        if (prev) {
          // Mantener sincronizado el usuario activo con sus datos más recientes
          const fresh = u.find(item => item.id === prev.id);
          return fresh || prev;
        }
        const admin = u.find(item => item.role === 'admin') || u[0];
        return admin || null;
      });
    } catch (err) {
      console.error('Error refreshing data:', err);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    initializeDatabase();
    refreshData();
    const unsubscribe = subscribeToChanges(() => {
      refreshData();
    });
    return () => {
      unsubscribe();
    };
  }, [refreshData]);

  const setActiveUser = useCallback((user: User) => {
    setActiveUserState(user);
    if (user.role === 'admin') {
      setActiveView('admin_dashboard');
      setSelectedClientId(null);
      showToast(`Sesión cambiada a: ${user.name} (Modo Abogado/Admin)`, 'info');
    } else {
      setActiveView('client_portal');
      setSelectedClientId(user.id);
      showToast(`Bienvenido al Portal, ${user.name}`, 'info');
    }
  }, [showToast]);

  // Actualización rápida de estatus (Quick Update)
  const quickUpdateCaseStatus = useCallback(async (caseId: string, newStatus: string) => {
    try {
      await updateCase(caseId, { current_status: newStatus });
      showToast(`Estatus actualizado a "${newStatus}" con éxito`, 'success');
      await refreshData();
    } catch (err) {
      console.error('Error updating status:', err);
      showToast('Error al actualizar el estatus del caso', 'error');
    }
  }, [showToast, refreshData]);

  // Actualización de finanzas del cliente
  const updateClientFinancials = useCallback(async (clientId: string, totalCost: number, amountPaid: number) => {
    try {
      await updateUser(clientId, {
        total_cost: Math.max(0, totalCost),
        amount_paid: Math.max(0, amountPaid)
      });
      showToast('Datos financieros actualizados correctamente', 'success');
      await refreshData();
    } catch (err) {
      console.error('Error updating financials:', err);
      showToast('Error al guardar datos financieros', 'error');
    }
  }, [showToast, refreshData]);

  const resetAllData = useCallback(() => {
    resetDatabaseToSeed();
    showToast('Datos restablecidos a la configuración inicial de prueba', 'info');
    refreshData();
  }, [showToast, refreshData]);

  // Fallback seguro si activeUser aún no ha cargado
  const resolvedActiveUser: User = activeUser || {
    id: 'admin-1',
    name: 'Lic. Roberto Valdez (Abogado Principal)',
    role: 'admin',
    email: 'abogado@consularvisa.com',
    phone: '+1 (305) 555-0199',
    total_cost: 0,
    amount_paid: 0
  };

  return (
    <AppContext.Provider
      value={{
        users,
        cases,
        activeUser: resolvedActiveUser,
        selectedClientId,
        activeView,
        isLoading,
        toasts,
        setActiveUser,
        setSelectedClientId,
        setActiveView,
        quickUpdateCaseStatus,
        updateClientFinancials,
        showToast,
        removeToast,
        resetAllData,
        refreshData
      }}
    >
      {children}
    </AppContext.Provider>
  );
};

export function useApp(): AppContextType {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error('useApp must be used within an AppProvider');
  }
  return context;
}
