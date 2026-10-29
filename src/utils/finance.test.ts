import test from 'node:test';
import assert from 'node:assert/strict';
import { 
  calculatePendingBalance, 
  calculatePaymentPercentage, 
  formatUSD, 
  getFinancialSummary 
} from './finance';

test('calculatePendingBalance calculates remainder accurately without negative values', () => {
  assert.equal(calculatePendingBalance(3500, 1500), 2000);
  assert.equal(calculatePendingBalance(3500, 3500), 0);
  assert.equal(calculatePendingBalance(3500, 4000), 0);
  assert.equal(calculatePendingBalance(0, 0), 0);
  assert.equal(calculatePendingBalance(2500.50, 1250.25), 1250.25);
});

test('calculatePaymentPercentage handles bounds and divisions cleanly', () => {
  assert.equal(calculatePaymentPercentage(4000, 2000), 50);
  assert.equal(calculatePaymentPercentage(4000, 4000), 100);
  assert.equal(calculatePaymentPercentage(4000, 0), 0);
  assert.equal(calculatePaymentPercentage(0, 0), 0);
  assert.equal(calculatePaymentPercentage(3000, 1000), 33);
});

test('formatUSD formats valid currency strings', () => {
  assert.match(formatUSD(2500), /\$2,500\.00/);
  assert.match(formatUSD(0), /\$0\.00/);
});

test('getFinancialSummary returns correct status badges', () => {
  const partial = getFinancialSummary(4000, 1500);
  assert.equal(partial.pendingBalance, 2500);
  assert.equal(partial.percentPaid, 38);
  assert.equal(partial.isFullyPaid, false);
  assert.equal(partial.statusBadge.label, 'Pago Parcial');

  const paid = getFinancialSummary(3000, 3000);
  assert.equal(paid.pendingBalance, 0);
  assert.equal(paid.isFullyPaid, true);
  assert.equal(paid.statusBadge.label, '100% Liquidado');

  const zero = getFinancialSummary(3000, 0);
  assert.equal(zero.pendingBalance, 3000);
  assert.equal(zero.statusBadge.label, 'Pendiente de Pago');
});
