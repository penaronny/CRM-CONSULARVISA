import test from 'node:test';
import assert from 'node:assert/strict';
import { getWorkflowForCase, calculateCaseProgress } from './caseSteps';

test('getWorkflowForCase returns correct workflow configuration', () => {
  const familiar = getWorkflowForCase('Petición Familiar (I-130 / Consular)');
  assert.equal(familiar.caseType, 'Petición Familiar (I-130 / Consular)');
  assert.equal(familiar.steps.length, 6);

  const turismo = getWorkflowForCase('Visa de Turismo (B1/B2)');
  assert.equal(turismo.caseType, 'Visa de Turismo (B1/B2)');
  assert.equal(turismo.steps.length, 5);

  const fallback = getWorkflowForCase('Trámite Desconocido');
  assert.equal(fallback.caseType, 'Petición Familiar (I-130 / Consular)');
});

test('calculateCaseProgress calculates stage progression and completion', () => {
  const p1 = calculateCaseProgress('Petición Familiar (I-130 / Consular)', 'Preparación de Documentos');
  assert.equal(p1.currentStepIndex, 0);
  assert.equal(p1.isComplete, false);
  assert.ok(p1.nextStep);
  assert.equal(p1.nextStep?.stageName, 'En USCIS');

  const p2 = calculateCaseProgress('Petición Familiar (I-130 / Consular)', 'En NVC');
  assert.equal(p2.currentStepIndex, 3);
  assert.equal(p2.currentStep?.stageName, 'En NVC');

  const pEnd = calculateCaseProgress('Petición Familiar (I-130 / Consular)', 'Caso Aprobado / Tarjeta Emitida');
  assert.equal(pEnd.currentStepIndex, 5);
  assert.equal(pEnd.isComplete, true);
  assert.equal(pEnd.nextStep, null);
  assert.equal(pEnd.progressPercent, 100);
});

test('calculateCaseProgress handles Visa de Turismo workflow properly', () => {
  const turismoProgress = calculateCaseProgress('Visa de Turismo (B1/B2)', 'Pago de Tasa Consular');
  assert.equal(turismoProgress.currentStepIndex, 1);
  assert.equal(turismoProgress.workflow.steps.length, 5);
});
