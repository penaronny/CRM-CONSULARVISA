/**
 * @file src/components/client/CaseProgressTracker.tsx
 * @description Rastreador visual modular de etapas migratorias para el Portal del Cliente.
 * 
 * MODULARIDAD:
 * Se adapta automáticamente al tipo de caso (Petición Familiar, Visa de Turismo B1/B2, Ajuste de Estatus)
 * utilizando el motor de etapas definido en `src/constants/caseStepsConfig.ts`.
 */

import React from 'react';
import { calculateCaseProgress } from '../../utils/caseSteps';
import { Check, Clock, Sparkles, ChevronRight, AlertCircle } from 'lucide-react';

interface CaseProgressTrackerProps {
  caseType: string;
  currentStatus: string;
}

export const CaseProgressTracker: React.FC<CaseProgressTrackerProps> = ({
  caseType,
  currentStatus
}) => {
  const progress = calculateCaseProgress(caseType, currentStatus);
  const steps = progress.workflow.steps;

  return (
    <div className="bg-white rounded-2xl border border-slate-200 shadow-xs p-5 sm:p-6 space-y-6">
      
      {/* Encabezado del Tracker */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-slate-100">
        <div>
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-amber-500 animate-pulse" />
            <h2 className="text-base sm:text-lg font-bold text-slate-900 font-serif">
              Línea de Progreso de su Caso
            </h2>
          </div>
          <p className="text-xs text-slate-500 mt-0.5">
            Trámite: <strong className="text-slate-800">{progress.workflow.caseType}</strong>
          </p>
        </div>

        {/* Porcentaje y Estatus Global */}
        <div className="flex items-center gap-3 self-start sm:self-auto">
          <div className="text-right">
            <span className="text-xs font-semibold text-slate-500 block">Progreso Estimado</span>
            <span className="text-base font-extrabold text-amber-900 font-serif">
              {progress.progressPercent}%
            </span>
          </div>
          <div className="w-12 h-12 rounded-full border-4 border-amber-500/20 flex items-center justify-center font-bold text-xs text-amber-900 bg-amber-50">
            {progress.progressPercent}%
          </div>
        </div>
      </div>

      {/* Barra de Progreso General */}
      <div className="w-full bg-slate-100 rounded-full h-2.5 overflow-hidden">
        <div 
          className="bg-gradient-to-r from-amber-500 via-amber-600 to-amber-700 h-full rounded-full transition-all duration-700 ease-out shadow-xs"
          style={{ width: `${progress.progressPercent}%` }}
        />
      </div>

      {/* Stepper Visual (Desktop & Mobile Stepper) */}
      <div className="relative">
        
        {/* Vista Desktop / Tablet (Pasos Horizontales) */}
        <div className="hidden md:grid gap-2" style={{ gridTemplateColumns: `repeat(${steps.length}, minmax(0, 1fr))` }}>
          {steps.map((step, idx) => {
            const isCompleted = idx < progress.currentStepIndex || (idx === progress.currentStepIndex && progress.isComplete);
            const isCurrent = idx === progress.currentStepIndex && !progress.isComplete;
            const isUpcoming = idx > progress.currentStepIndex;

            return (
              <div key={step.id} className="flex flex-col items-center text-center relative group">
                
                {/* Círculo indicador */}
                <div
                  className={`w-9 h-9 rounded-full flex items-center justify-center font-bold text-xs transition-all duration-300 z-10 ${
                    isCompleted
                      ? 'bg-amber-600 text-white shadow-sm ring-4 ring-amber-100'
                      : isCurrent
                      ? 'bg-slate-900 text-amber-400 ring-4 ring-amber-400/40 shadow-md animate-bounce-subtle'
                      : 'bg-slate-100 text-slate-400 border border-slate-300'
                  }`}
                >
                  {isCompleted ? (
                    <Check className="w-4 h-4 stroke-[3]" />
                  ) : (
                    <span>{idx + 1}</span>
                  )}
                </div>

                {/* Título y badge */}
                <div className="mt-2.5 max-w-[120px]">
                  <p className={`text-[11px] font-bold leading-tight ${isCurrent ? 'text-amber-950 font-extrabold' : isCompleted ? 'text-slate-800' : 'text-slate-400'}`}>
                    {step.title}
                  </p>
                  {isCurrent && (
                    <span className="inline-block mt-1 px-1.5 py-0.5 rounded text-[9px] uppercase tracking-wider font-extrabold bg-amber-100 text-amber-900 border border-amber-300">
                      En Curso
                    </span>
                  )}
                </div>
              </div>
            );
          })}
        </div>

        {/* Vista Móvil (Vertical y compacta) */}
        <div className="md:hidden space-y-3">
          {steps.map((step, idx) => {
            const isCompleted = idx < progress.currentStepIndex || (idx === progress.currentStepIndex && progress.isComplete);
            const isCurrent = idx === progress.currentStepIndex && !progress.isComplete;

            return (
              <div 
                key={step.id}
                className={`p-3 rounded-xl border transition-all flex items-start gap-3 ${
                  isCurrent 
                    ? 'bg-amber-50/70 border-amber-300 shadow-xs ring-1 ring-amber-400/30' 
                    : isCompleted 
                    ? 'bg-slate-50 border-slate-200' 
                    : 'bg-white border-slate-100 opacity-60'
                }`}
              >
                <div 
                  className={`w-7 h-7 rounded-full shrink-0 flex items-center justify-center text-xs font-bold ${
                    isCompleted 
                      ? 'bg-amber-600 text-white' 
                      : isCurrent 
                      ? 'bg-slate-900 text-amber-400 font-extrabold' 
                      : 'bg-slate-200 text-slate-500'
                  }`}
                >
                  {isCompleted ? <Check className="w-3.5 h-3.5 stroke-[3]" /> : idx + 1}
                </div>

                <div className="min-w-0 flex-1">
                  <div className="flex items-center justify-between">
                    <p className={`text-xs font-bold ${isCurrent ? 'text-amber-950' : 'text-slate-800'}`}>
                      {step.title}
                    </p>
                    {isCurrent && (
                      <span className="text-[10px] font-bold px-1.5 py-0.5 bg-amber-200 text-amber-900 rounded">
                        Etapa Actual
                      </span>
                    )}
                  </div>
                  <p className="text-[11px] text-slate-600 mt-0.5 leading-snug">
                    {step.description}
                  </p>
                </div>
              </div>
            );
          })}
        </div>

      </div>

      {/* Tarjeta Informativa de la Etapa Actual */}
      {progress.currentStep && (
        <div className="p-4 rounded-xl bg-slate-900 text-white flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-amber-400" />
              <span className="text-xs uppercase tracking-wider font-semibold text-amber-400">
                Estado Actual Asignado por Lic. Ronny Peña | ConsularVisa
              </span>
            </div>
            <p className="text-sm font-bold text-white">
              {progress.currentStep.title} ({progress.currentStep.stageName})
            </p>
            <p className="text-xs text-slate-300 max-w-xl">
              {progress.currentStep.description}
            </p>
          </div>

          {progress.nextStep && (
            <div className="p-2.5 rounded-lg bg-slate-800/90 border border-slate-700 text-xs shrink-0 max-w-xs">
              <span className="text-[10px] uppercase font-bold text-slate-400 block">Siguiente Hito:</span>
              <span className="font-semibold text-amber-300">{progress.nextStep.title}</span>
            </div>
          )}
        </div>
      )}

    </div>
  );
};
