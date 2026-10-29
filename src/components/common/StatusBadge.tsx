/**
 * @file src/components/common/StatusBadge.tsx
 * @description Insignia visual estandarizada para los estatus del proceso consular y USCIS.
 */

import React from 'react';

interface StatusBadgeProps {
  status: string;
  size?: 'sm' | 'md' | 'lg';
}

export const StatusBadge: React.FC<StatusBadgeProps> = ({ status, size = 'md' }) => {
  const norm = (status || '').toLowerCase();

  let colorClasses = 'bg-slate-100 text-slate-800 border-slate-300';
  let dotColor = 'bg-slate-400';

  if (norm.includes('aprob') || norm.includes('emitid') || norm.includes('complet')) {
    colorClasses = 'bg-emerald-50 text-emerald-800 border-emerald-300';
    dotColor = 'bg-emerald-500';
  } else if (norm.includes('nvc')) {
    colorClasses = 'bg-purple-50 text-purple-800 border-purple-300';
    dotColor = 'bg-purple-500 animate-pulse';
  } else if (norm.includes('uscis')) {
    colorClasses = 'bg-blue-50 text-blue-800 border-blue-300';
    dotColor = 'bg-blue-500 animate-pulse';
  } else if (norm.includes('cita') || norm.includes('consul')) {
    colorClasses = 'bg-amber-50 text-amber-900 border-amber-400';
    dotColor = 'bg-amber-500';
  } else if (norm.includes('huella') || norm.includes('biometr')) {
    colorClasses = 'bg-indigo-50 text-indigo-800 border-indigo-300';
    dotColor = 'bg-indigo-500';
  } else if (norm.includes('prepar') || norm.includes('tasa')) {
    colorClasses = 'bg-amber-50/70 text-amber-900 border-amber-200';
    dotColor = 'bg-amber-400';
  } else if (norm.includes('rfe') || norm.includes('evidencia')) {
    colorClasses = 'bg-rose-50 text-rose-800 border-rose-300';
    dotColor = 'bg-rose-500 animate-ping';
  }

  const sizeClasses = {
    sm: 'text-xs px-2 py-0.5 font-medium',
    md: 'text-xs px-2.5 py-1 font-semibold',
    lg: 'text-sm px-3.5 py-1.5 font-semibold'
  }[size];

  return (
    <span className={`inline-flex items-center gap-1.5 rounded-full border shadow-xs ${sizeClasses} ${colorClasses}`}>
      <span className={`w-1.5 h-1.5 rounded-full ${dotColor}`} />
      <span>{status || 'En Proceso'}</span>
    </span>
  );
};
