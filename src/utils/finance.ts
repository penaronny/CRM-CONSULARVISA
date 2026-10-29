/**
 * @file src/utils/finance.ts
 * @description Utilidades de cálculo financiero para facturación legal y portal de clientes.
 */

export interface FinancialSummary {
  totalCost: number;
  amountPaid: number;
  pendingBalance: number;
  percentPaid: number;
  isFullyPaid: boolean;
  statusBadge: {
    label: string;
    color: string;
  };
}

/**
 * Calcula el balance pendiente garantizando que nunca sea negativo.
 */
export function calculatePendingBalance(totalCost: number, amountPaid: number): number {
  const total = Number(totalCost) || 0;
  const paid = Number(amountPaid) || 0;
  const diff = total - paid;
  return Math.max(0, Math.round(diff * 100) / 100);
}

/**
 * Calcula el porcentaje completado de pago (entre 0 y 100).
 */
export function calculatePaymentPercentage(totalCost: number, amountPaid: number): number {
  const total = Number(totalCost) || 0;
  const paid = Number(amountPaid) || 0;
  if (total <= 0) {
    return paid > 0 ? 100 : 0;
  }
  const pct = (paid / total) * 100;
  return Math.min(100, Math.max(0, Math.round(pct)));
}

/**
 * Formatea un número a formato de moneda estadounidense (USD).
 */
export function formatUSD(amount: number): string {
  const valid = Number(amount) || 0;
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  }).format(valid);
}

/**
 * Retorna el resumen financiero completo para tarjetas y widgets.
 */
export function getFinancialSummary(totalCost: number, amountPaid: number): FinancialSummary {
  const total = Math.max(0, Number(totalCost) || 0);
  const paid = Math.max(0, Number(amountPaid) || 0);
  const pending = calculatePendingBalance(total, paid);
  const percent = calculatePaymentPercentage(total, paid);
  const isFullyPaid = pending === 0 && total > 0;

  let statusBadge = {
    label: 'Sin Facturación',
    color: 'bg-slate-100 text-slate-700 border-slate-300'
  };

  if (total > 0) {
    if (isFullyPaid) {
      statusBadge = {
        label: '100% Liquidado',
        color: 'bg-emerald-100 text-emerald-800 border-emerald-300'
      };
    } else if (paid > 0) {
      statusBadge = {
        label: 'Pago Parcial',
        color: 'bg-amber-100 text-amber-800 border-amber-300'
      };
    } else {
      statusBadge = {
        label: 'Pendiente de Pago',
        color: 'bg-rose-100 text-rose-800 border-rose-300'
      };
    }
  }

  return {
    totalCost: total,
    amountPaid: paid,
    pendingBalance: pending,
    percentPaid: percent,
    isFullyPaid,
    statusBadge
  };
}
