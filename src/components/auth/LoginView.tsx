/**
 * @file src/components/auth/LoginView.tsx
 * @description Pantalla principal de inicio de sesión institucional para Consularvisa.
 * Autenticación estricta con correo y contraseña.
 */

import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { 
  Scale, 
  Lock, 
  Mail, 
  Eye, 
  EyeOff, 
  ArrowRight, 
  ShieldCheck, 
  AlertCircle 
} from 'lucide-react';

export const LoginView: React.FC = () => {
  const { login, isLoading } = useApp();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    if (!email.trim() || !password.trim()) {
      setErrorMessage('Por favor ingrese tanto el correo electrónico como la contraseña.');
      return;
    }

    setIsSubmitting(true);
    const result = await login(email, password);
    if (!result.success) {
      setErrorMessage(result.error || 'Credenciales no válidas. Revise su correo o contraseña.');
    }
    setIsSubmitting(false);
  };

  return (
    <div className="min-h-screen bg-slate-950 flex flex-col justify-center py-12 px-4 sm:px-6 lg:px-8 relative overflow-hidden text-slate-100 font-sans">
      
      {/* Luces sutiles y efectos decorativos de fondo */}
      <div className="absolute top-0 right-1/4 -mt-20 w-96 h-96 rounded-full bg-amber-500/10 blur-3xl pointer-events-none" />
      <div className="absolute bottom-0 left-1/4 -mb-20 w-96 h-96 rounded-full bg-blue-900/15 blur-3xl pointer-events-none" />

      <div className="sm:mx-auto sm:w-full sm:max-w-md relative z-10 text-center">
        
        {/* Isotipo y Logo */}
        <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-gradient-to-br from-amber-400 via-amber-500 to-amber-700 p-0.5 shadow-xl mb-4">
          <div className="w-full h-full bg-slate-950 rounded-[14px] flex items-center justify-center">
            <Scale className="w-8 h-8 text-amber-400" />
          </div>
        </div>

        <h1 className="text-2xl sm:text-3xl font-extrabold tracking-wider font-serif text-white">
          CONSULARVISA
        </h1>
        <p className="text-xs uppercase tracking-widest text-amber-400/90 font-bold mt-1">
          Inmigration Law & Client Portal
        </p>
        <p className="text-xs text-slate-400 mt-2 max-w-sm mx-auto">
          Sistema seguro para la administración legal de expedientes migratorios y seguimiento de casos USCIS / NVC.
        </p>
      </div>

      {/* Tarjeta Principal de Inicio de Sesión */}
      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md relative z-10">
        <div className="bg-slate-900/90 backdrop-blur-md py-8 px-6 sm:px-10 rounded-3xl border border-slate-800 shadow-2xl space-y-6">
          
          <div className="border-b border-slate-800 pb-3">
            <h2 className="text-base font-bold text-white">
              Iniciar Sesión en su Cuenta
            </h2>
            <p className="text-xs text-slate-400 mt-0.5">
              Ingrese sus credenciales registradas como abogado o cliente
            </p>
          </div>

          {/* Mensaje de Error */}
          {errorMessage && (
            <div className="p-3.5 rounded-xl bg-rose-950/80 border border-rose-800/80 text-rose-200 text-xs flex items-start gap-2.5 animate-shake">
              <AlertCircle className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
              <span>{errorMessage}</span>
            </div>
          )}

          {/* Formulario de Login */}
          <form onSubmit={handleSubmit} className="space-y-4">
            
            {/* Campo Email */}
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                Correo Electrónico
              </label>
              <div className="relative">
                <Mail className="w-4 h-4 text-slate-500 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                <input
                  type="email"
                  required
                  autoComplete="email"
                  placeholder="su.correo@ejemplo.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full pl-10 pr-4 py-2.5 bg-slate-950/80 border border-slate-700 rounded-xl text-xs sm:text-sm text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-amber-500/60 focus:border-amber-500 transition-all"
                />
              </div>
            </div>

            {/* Campo Contraseña */}
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="block text-xs font-semibold text-slate-300">
                  Contraseña de Acceso
                </label>
              </div>
              <div className="relative">
                <Lock className="w-4 h-4 text-slate-500 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                <input
                  type={showPassword ? 'text' : 'password'}
                  required
                  autoComplete="current-password"
                  placeholder="••••••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full pl-10 pr-11 py-2.5 bg-slate-950/80 border border-slate-700 rounded-xl text-xs sm:text-sm text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-amber-500/60 focus:border-amber-500 transition-all font-mono"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-200 p-1"
                  title={showPassword ? 'Ocultar contraseña' : 'Ver contraseña'}
                  aria-label={showPassword ? 'Ocultar contraseña' : 'Ver contraseña'}
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            {/* Botón Ingresar */}
            <button
              type="submit"
              disabled={isSubmitting || isLoading}
              className="w-full flex items-center justify-center gap-2 py-3 px-4 rounded-xl bg-gradient-to-r from-amber-500 via-amber-600 to-amber-700 hover:from-amber-600 hover:to-amber-800 text-slate-950 font-bold text-sm shadow-lg hover:shadow-amber-500/20 transition-all transform active:scale-[0.99] disabled:opacity-50 cursor-pointer mt-2"
            >
              <span>{isSubmitting ? 'Verificando credenciales...' : 'Ingresar al Portal'}</span>
              <ArrowRight className="w-4 h-4 stroke-[2.5]" />
            </button>
          </form>

        </div>

        {/* Aviso de Privacidad y Cumplimiento Legal */}
        <div className="mt-6 flex items-center justify-center gap-2 text-xs text-slate-500">
          <ShieldCheck className="w-4 h-4 text-emerald-500 shrink-0" />
          <span>Acceso seguro protegido por cifrado SSL y protocolo de confidencialidad legal.</span>
        </div>

      </div>

    </div>
  );
};
