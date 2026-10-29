/**
 * @file src/utils/caseSteps.ts
 * @description Utilidades para resolver el progreso y etapas de cualquier caso de forma modular.
 */

import { CASE_WORKFLOWS } from '../constants/caseStepsConfig';
import { CaseStep, CaseWorkflowConfig } from '../types';

export interface WorkflowProgress {
  workflow: CaseWorkflowConfig;
  currentStepIndex: number;
  totalSteps: number;
  progressPercent: number;
  currentStep: CaseStep | null;
  isComplete: boolean;
  nextStep: CaseStep | null;
}

/**
 * Resuelve la configuración de flujo para un caso, con fallback al flujo estándar de Petición Familiar.
 */
export function getWorkflowForCase(caseType: string): CaseWorkflowConfig {
  if (CASE_WORKFLOWS[caseType]) {
    return CASE_WORKFLOWS[caseType];
  }

  // Fallback genérico o coincidencia parcial
  const normalized = (caseType || '').toLowerCase();
  if (normalized.includes('turismo') || normalized.includes('b1') || normalized.includes('b2')) {
    return CASE_WORKFLOWS['Visa de Turismo (B1/B2)'];
  }
  if (normalized.includes('ajuste') || normalized.includes('485') || normalized.includes('green card')) {
    return CASE_WORKFLOWS['Ajuste de Estatus (I-485)'];
  }

  return CASE_WORKFLOWS['Petición Familiar (I-130 / Consular)'];
}

/**
 * Calcula el estado de progreso exacto del caso en su flujo correspondiente.
 */
export function calculateCaseProgress(caseType: string, currentStatus: string): WorkflowProgress {
  const workflow = getWorkflowForCase(caseType);
  const steps = workflow.steps;
  const normalizedStatus = (currentStatus || '').trim().toLowerCase();

  let matchIndex = steps.findIndex(
    step => step.stageName.toLowerCase() === normalizedStatus
  );

  // Si no hay coincidencia exacta, buscar por coincidencia parcial de palabras clave
  if (matchIndex === -1) {
    if (normalizedStatus.includes('prepar')) matchIndex = 0;
    else if (normalizedStatus.includes('uscis')) matchIndex = 1;
    else if (normalizedStatus.includes('huella') || normalizedStatus.includes('biometr')) matchIndex = 2;
    else if (normalizedStatus.includes('nvc')) matchIndex = 3;
    else if (normalizedStatus.includes('cita') || normalizedStatus.includes('consul') || normalizedStatus.includes('entrevist')) matchIndex = Math.min(4, steps.length - 2);
    else if (normalizedStatus.includes('aprob') || normalizedStatus.includes('tarjeta') || normalizedStatus.includes('emitid')) matchIndex = steps.length - 1;
    else matchIndex = 0;
  }

  const currentStep = steps[matchIndex] || steps[0];
  const isComplete = matchIndex === steps.length - 1;
  const progressPercent = Math.round(((matchIndex + (isComplete ? 1 : 0.5)) / steps.length) * 100);
  const nextStep = matchIndex < steps.length - 1 ? steps[matchIndex + 1] : null;

  return {
    workflow,
    currentStepIndex: matchIndex,
    totalSteps: steps.length,
    progressPercent: Math.min(100, Math.max(5, progressPercent)),
    currentStep,
    isComplete,
    nextStep
  };
}
