/**
 * @file src/context/AppContext.tsx
 * @description Contexto global reactivo para la gestión de usuarios, casos, autenticación y sincronización de datos.
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
  loginUser,
  updateUserPassword,
  resetDatabaseToSeed 
} from '../firebase/firestoreService';

const SESSION_KEY = 'consularvisa_active_session_v1';

interface Toast {
  id: string;
  type: 'success' | 'info' | 'warning' | 'error';
  message: string;
}

interface AppContextType {
  users: User[];
  cases: Case[];
  activeUser: User | null;
  isAuthenticated: boolean;
  selectedClientId: string | null;
  activeView: 'admin_dashboard' | 'client_profile' | 'client_portal' | 'architecture_guide';
  isLoading: boolean;
  toasts: Toast[];
  login: (email: string, password: string) => Promise<{ success: boolean; error?: string }>;
  logout: () => void;
  setActiveUser: (user: User) => void;
  setSelectedClientId: (clientId: string | null) => void;
  setActiveView: (view: 'admin_dashboard' | 'client_profile' | 'client_portal' | 'architecture_guide') => void;
  quickUpdateCaseStatus: (caseId: string, newStatus: string) => Promise<void>;
  updateClientFinancials: (clientId: string, totalCost: number, amountPaid: number) => Promise<void>;
  changeActiveUserPassword: (newPassword: string) => Promise<boolean>;
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
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(false);
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

      // Verificar si hay sesión guardada en localStorage o activa en memoria
      const savedSessionId = localStorage.getItem(SESSION_KEY);
      const targetUserId = savedSessionId || (activeUser ? activeUser.id : null);
      if (targetUserId) {
        const found = u.find(item => item.id === targetUserId);
        if (found) {
          setActiveUserState(found);
          setIsAuthenticated(true);
          if (found.role === 'client') {
            setActiveView('client_portal');
            setSelectedClientId(found.id);
          }
        }
      }
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

  // Función de Login Estricto
  const login = useCallback(async (email: string, password: string): Promise<{ success: boolean; error?: string }> => {
    setIsLoading(true);
    try {
      const { user, error } = await loginUser(email, password);
      if (error || !user) {
        showToast(error || 'Credenciales inválidas', 'error');
        return { success: false, error: error || 'Credenciales inválidas' };
      }

      setActiveUserState(user);
      setIsAuthenticated(true);
      localStorage.setItem(SESSION_KEY, user.id);

      if (user.role === 'admin') {
        setActiveView('admin_dashboard');
        setSelectedClientId(null);
        showToast(`Bienvenido al Sistema de Gestión, ${user.name}`, 'success');
      } else {
        setActiveView('client_portal');
        setSelectedClientId(user.id);
        showToast(`Bienvenido a su Portal del Cliente, ${user.name}`, 'success');
      }

      return { success: true };
    } catch (err) {
      console.error(err);
      showToast('Ocurrió un error al procesar el inicio de sesión', 'error');
      return { success: false, error: 'Error del servidor' };
    } finally {
      setIsLoading(false);
    }
  }, [showToast]);

  // Cierre de Sesión
  const logout = useCallback(() => {
    localStorage.removeItem(SESSION_KEY);
    setActiveUserState(null);
    setIsAuthenticated(false);
    setSelectedClientId(null);
    setActiveView('admin_dashboard');
    showToast('Sesión finalizada con éxito. Hasta pronto.', 'info');
  }, [showToast]);

  const setActiveUser = useCallback((user: User) => {
    setActiveUserState(user);
    setIsAuthenticated(true);
    localStorage.setItem(SESSION_KEY, user.id);
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

  // Cambio de contraseña del usuario activo
  const changeActiveUserPassword = useCallback(async (newPassword: string): Promise<boolean> => {
    if (!activeUser) return false;
    try {
      await updateUserPassword(activeUser.id, newPassword);
      showToast('Contraseña actualizada con éxito', 'success');
      await refreshData();
      return true;
    } catch (err) {
      console.error(err);
      showToast('Error al actualizar contraseña', 'error');
      return false;
    }
  }, [activeUser, showToast, refreshData]);

  const resetAllData = useCallback(() => {
    resetDatabaseToSeed();
    localStorage.removeItem(SESSION_KEY);
    setIsAuthenticated(false);
    setActiveUserState(null);
    showToast('Datos restablecidos a la configuración inicial de prueba', 'info');
    refreshData();
  }, [showToast, refreshData]);

  return (
    <AppContext.Provider
      value={{
        users,
        cases,
        activeUser,
        isAuthenticated,
        selectedClientId,
        activeView,
        isLoading,
        toasts,
        login,
        logout,
        setActiveUser,
        setSelectedClientId,
        setActiveView,
        quickUpdateCaseStatus,
        updateClientFinancials,
        changeActiveUserPassword,
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
