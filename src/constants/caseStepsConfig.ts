/**
 * @file src/constants/caseStepsConfig.ts
 * @description Configuración MODULAR de flujos de trabajo migratorios para Consularvisa.
 * 
 * GUÍA DE ESCALABILIDAD:
 * Para añadir un nuevo tipo de visado o trámite (ej. "Visa de Estudiante F-1", "Visa de Trabajo H-1B", "Asilo"):
 * 1. Agregue una nueva entrada en el objeto `CASE_WORKFLOWS` con la clave coincidente.
 * 2. Defina los `steps` en orden cronológico con sus identificadores de estado (`stageName`).
 * 3. El componente `CaseProgressTracker` y el menú de actualización rápida consumirán automáticamente
 *    la nueva configuración sin requerir cambios en el código de interfaz gráfica.
 */

import { CaseWorkflowConfig } from '../types';

export const CASE_WORKFLOWS: Record<string, CaseWorkflowConfig> = {
  'Petición Familiar (I-130 / Consular)': {
    caseType: 'Petición Familiar (I-130 / Consular)',
    description: 'Trámite consular para familiares inmediatos de ciudadanos o residentes permanentes.',
    defaultStatus: 'Preparación de Documentos',
    steps: [
      {
        id: 'step-1',
        title: 'Preparación de Expediente',
        description: 'Recolección de actas civiles, pruebas de relación y llenado del Formulario I-130 / I-130A.',
        stageName: 'Preparación de Documentos',
        approxDuration: '2 - 4 semanas',
        badgeColor: 'bg-amber-100 text-amber-900 border-amber-300'
      },
      {
        id: 'step-2',
        title: 'Radicado en USCIS',
        description: 'Petición ingresada en USCIS. Asignación de número de recibo (Notice of Action I-797C).',
        stageName: 'En USCIS',
        approxDuration: '8 - 14 meses',
        badgeColor: 'bg-blue-100 text-blue-900 border-blue-300'
      },
      {
        id: 'step-3',
        title: 'Biometría y Espera Activa',
        description: 'Toma de huellas dactilares y verificación de antecedentes de seguridad.',
        stageName: 'En Espera de Huellas / Biometría',
        approxDuration: '1 - 2 meses',
        badgeColor: 'bg-indigo-100 text-indigo-900 border-indigo-300'
      },
      {
        id: 'step-4',
        title: 'Enviado al Centro Nacional de Visas (NVC)',
        description: 'Caso aprobado por USCIS y transferido al NVC para pago de tarifas y Formulario DS-260.',
        stageName: 'En NVC',
        approxDuration: '2 - 3 meses',
        badgeColor: 'bg-purple-100 text-purple-900 border-purple-300'
      },
      {
        id: 'step-5',
        title: 'Cita Consular y Entrevista',
        description: 'Examen médico completado y entrevista presencial en la Embajada o Consulado de EE.UU.',
        stageName: 'Cita Consular Programada',
        approxDuration: '1 - 3 meses',
        badgeColor: 'bg-amber-100 text-amber-900 border-amber-400'
      },
      {
        id: 'step-6',
        title: 'Visa Aprobada / Paquete Emitido',
        description: 'Aprobación oficial otorgada, pasaporte visado y emisión de paquete migratorio para entrada a EE.UU.',
        stageName: 'Caso Aprobado / Tarjeta Emitida',
        approxDuration: 'Completado',
        badgeColor: 'bg-emerald-100 text-emerald-900 border-emerald-300'
      }
    ]
  },

  'Visa de Turismo (B1/B2)': {
    caseType: 'Visa de Turismo (B1/B2)',
    description: 'Solicitud de visa de no inmigrante para viajes de placer, turismo o negocios temporales.',
    defaultStatus: 'Preparación de Documentos',
    steps: [
      {
        id: 'b1-1',
        title: 'Diagnóstico y Llenado DS-160',
        description: 'Revisión de perfil financiero, lazos con el país de origen y llenado exhaustivo del formulario DS-160.',
        stageName: 'Preparación de Documentos',
        approxDuration: '1 - 2 semanas',
        badgeColor: 'bg-amber-100 text-amber-900 border-amber-300'
      },
      {
        id: 'b1-2',
        title: 'Pago de Tasa MRV y Creación de Perfil',
        description: 'Generación de pago consular oficial y apertura de cuenta en el sistema de citas de la embajada.',
        stageName: 'Pago de Tasa Consular',
        approxDuration: '2 - 5 días',
        badgeColor: 'bg-sky-100 text-sky-900 border-sky-300'
      },
      {
        id: 'b1-3',
        title: 'Cita Agendada en CAS / Embajada',
        description: 'Asignación de fecha para toma de fotos/huellas (CAS) y entrevista con el oficial consular.',
        stageName: 'Cita Consular Programada',
        approxDuration: 'Variable según consulado',
        badgeColor: 'bg-indigo-100 text-indigo-900 border-indigo-300'
      },
      {
        id: 'b1-4',
        title: 'Simulacro de Entrevista Consular',
        description: 'Preparación 1-a-1 con nuestros abogados para responder con solvencia y seguridad.',
        stageName: 'Preparación para Entrevista',
        approxDuration: '1 semana previa a cita',
        badgeColor: 'bg-yellow-100 text-yellow-900 border-yellow-300'
      },
      {
        id: 'b1-5',
        title: 'Resolución de Visa y Envío',
        description: 'Aprobación de visa estampada en pasaporte y entrega vía mensajería autorizada.',
        stageName: 'Caso Aprobado / Tarjeta Emitida',
        approxDuration: 'Completado',
        badgeColor: 'bg-emerald-100 text-emerald-900 border-emerald-300'
      }
    ]
  },

  'Ajuste de Estatus (I-485)': {
    caseType: 'Ajuste de Estatus (I-485)',
    description: 'Solicitud de residencia permanente legal dentro de los Estados Unidos con paquete concurrente.',
    defaultStatus: 'Preparación de Documentos',
    steps: [
      {
        id: 'aos-1',
        title: 'Paquete Concurrente (I-130, I-485, I-765, I-131)',
        description: 'Armado de solicitud de Green Card, permiso de trabajo y permiso de viaje adelantado.',
        stageName: 'Preparación de Documentos',
        approxDuration: '3 - 5 semanas',
        badgeColor: 'bg-amber-100 text-amber-900 border-amber-300'
      },
      {
        id: 'aos-2',
        title: 'Radicado y Notificaciones I-797',
        description: 'Expediente recibido en el Lockbox de USCIS. Emisión de números de recibo oficiales.',
        stageName: 'En USCIS',
        approxDuration: '4 - 6 semanas',
        badgeColor: 'bg-blue-100 text-blue-900 border-blue-300'
      },
      {
        id: 'aos-3',
        title: 'Cita de Servicios Biométricos',
        description: 'Toma de huellas y fotografía en el Application Support Center (ASC) más cercano.',
        stageName: 'En Espera de Huellas / Biometría',
        approxDuration: '1 - 2 meses',
        badgeColor: 'bg-indigo-100 text-indigo-900 border-indigo-300'
      },
      {
        id: 'aos-4',
        title: 'Permiso de Trabajo / Viaje Aprobado',
        description: 'Emisión de Documento de Autorización de Empleo (EAD Combo Card).',
        stageName: 'Permiso de Trabajo Aprobado',
        approxDuration: '3 - 6 meses',
        badgeColor: 'bg-teal-100 text-teal-900 border-teal-300'
      },
      {
        id: 'aos-5',
        title: 'Entrevista en Oficina Local USCIS',
        description: 'Audiencia formal con oficial de adjudicación o exención de entrevista por evidencia suficiente.',
        stageName: 'Cita Consular Programada',
        approxDuration: '6 - 12 meses',
        badgeColor: 'bg-violet-100 text-violet-900 border-violet-300'
      },
      {
        id: 'aos-6',
        title: 'Green Card Producida y Enviada',
        description: 'Aprobación definitiva de residencia permanente y envío de la tarjeta de residencia.',
        stageName: 'Caso Aprobado / Tarjeta Emitida',
        approxDuration: 'Completado',
        badgeColor: 'bg-emerald-100 text-emerald-900 border-emerald-300'
      }
    ]
  }
};

/**
 * Lista de estatus universales para el menú de Actualización Rápida en el Admin Dashboard.
 */
export const QUICK_STATUS_OPTIONS = [
  'Preparación de Documentos',
  'En USCIS',
  'En Espera de Huellas / Biometría',
  'En NVC',
  'Pago de Tasa Consular',
  'Cita Consular Programada',
  'Preparación para Entrevista',
  'Permiso de Trabajo Aprobado',
  'RFE (Solicitud de Evidencia Adicional)',
  'Caso Aprobado / Tarjeta Emitida',
  'Caso Cerrado'
];
