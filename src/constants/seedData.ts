/**
 * @file src/constants/seedData.ts
 * @description Datos iniciales realistas para la firma de abogados de inmigración Consularvisa.
 */

import { User, Case, FileItem, Appointment, Message } from '../types';

export const SEED_USERS: User[] = [
  {
    id: 'admin-1',
    name: 'Lic. Roberto Valdez (Abogado Principal)',
    role: 'admin',
    email: 'abogado@consularvisa.com',
    portal_password: 'Abogado2025*Admin',
    phone: '+1 (305) 555-0199',
    total_cost: 0,
    amount_paid: 0,
    avatar_url: 'https://images.unsplash.com/photo-1560250097-0b93528c311a?w=160&auto=format&fit=crop&q=80',
    created_at: '2024-01-10T08:00:00Z'
  },
  {
    id: 'client-1',
    name: 'Carlos Morales Ramos',
    role: 'client',
    email: 'carlos.morales@gmail.com',
    portal_password: 'Carlos2025*Secure',
    phone: '+1 (786) 432-8890',
    uscis_email: 'cmorales.uscis@gmail.com',
    uscis_password: 'UscisPass2025!#Secure',
    total_cost: 3500,
    amount_paid: 2200,
    avatar_url: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=160&auto=format&fit=crop&q=80',
    country_of_origin: 'Colombia',
    created_at: '2024-03-15T10:30:00Z'
  },
  {
    id: 'client-2',
    name: 'Elena Sofía Gómez',
    role: 'client',
    email: 'elena.gomez@outlook.com',
    portal_password: 'Elena2025*Travel',
    phone: '+1 (407) 891-2345',
    uscis_email: 'elena.travel.visa@outlook.com',
    uscis_password: 'ConsularB2*Elena26',
    total_cost: 850,
    amount_paid: 850,
    avatar_url: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=160&auto=format&fit=crop&q=80',
    country_of_origin: 'México',
    created_at: '2024-06-20T14:15:00Z'
  },
  {
    id: 'client-3',
    name: 'Roberto Silva Mendoza',
    role: 'client',
    email: 'roberto.silva@yahoo.com',
    portal_password: 'Silva2025*Safe',
    phone: '+1 (832) 710-4491',
    uscis_email: 'rsilva.greencard@yahoo.com',
    uscis_password: 'SilvaAOS2025#Safe',
    total_cost: 4200,
    amount_paid: 1600,
    avatar_url: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=160&auto=format&fit=crop&q=80',
    country_of_origin: 'Venezuela',
    created_at: '2024-07-08T09:00:00Z'
  },
  {
    id: 'client-4',
    name: 'Mariana Duarte Rivas',
    role: 'client',
    email: 'mariana.duarte@gmail.com',
    portal_password: 'Duarte2025*Pass',
    phone: '+1 (210) 902-1133',
    uscis_email: 'mariana.duarte.i130@gmail.com',
    uscis_password: 'DuarteI130*USCIS',
    total_cost: 3200,
    amount_paid: 600,
    avatar_url: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=160&auto=format&fit=crop&q=80',
    country_of_origin: 'Perú',
    created_at: '2024-09-01T11:45:00Z'
  },
  {
    id: 'client-5',
    name: 'Juan Pablo Navarro',
    role: 'client',
    email: 'jp.navarro@hotmail.com',
    portal_password: 'Navarro2025*Win',
    phone: '+1 (312) 640-5521',
    uscis_email: 'jp.navarro.case@hotmail.com',
    uscis_password: 'NavarroSuccess2024!',
    total_cost: 3800,
    amount_paid: 3800,
    avatar_url: 'https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?w=160&auto=format&fit=crop&q=80',
    country_of_origin: 'Guatemala',
    created_at: '2024-01-22T16:00:00Z'
  }
];

export const SEED_CASES: Case[] = [
  {
    id: 'case-1',
    client_id: 'client-1',
    case_type: 'Petición Familiar (I-130 / Consular)',
    case_number: 'IOE-0932849182',
    current_status: 'En NVC',
    last_updated: '2025-05-18T14:30:00Z',
    internal_notes: 'Caso aprobado en USCIS sin RFE. Se completó el pago de tarifas AOS e IV en CEAC. Próximo paso: subir affidavits y esperar cita consular en Bogotá.',
    priority_date: '2023-11-04',
    petitioner_name: 'Laura Ramos (Madre - Ciudadana EE.UU.)',
    beneficiary_name: 'Carlos Morales Ramos'
  },
  {
    id: 'case-2',
    client_id: 'client-2',
    case_type: 'Visa de Turismo (B1/B2)',
    case_number: 'AA00C9F821',
    current_status: 'Pago de Tasa Consular',
    last_updated: '2025-05-14T09:10:00Z',
    internal_notes: 'Formulario DS-160 finalizado y revisado. Se descargó el talón de pago Scotiabank. Esperando acreditación para programar citas CAS y Embajada.',
    petitioner_name: 'Elena Sofía Gómez',
    beneficiary_name: 'Elena Sofía Gómez'
  },
  {
    id: 'case-3',
    client_id: 'client-3',
    case_type: 'Ajuste de Estatus (I-485)',
    case_number: 'MSC-2490184472',
    current_status: 'En Espera de Huellas / Biometría',
    last_updated: '2025-05-10T11:20:00Z',
    internal_notes: 'Paquete de Ajuste radicado en Lockbox de Chicago. Llegaron recibos I-797C. Notificación de biometría en camino para el ASC de Houston.',
    priority_date: '2024-04-12',
    petitioner_name: 'Jessica Silva (Esposa - Ciudadana EE.UU.)',
    beneficiary_name: 'Roberto Silva Mendoza'
  },
  {
    id: 'case-4',
    client_id: 'client-4',
    case_type: 'Petición Familiar (I-130 / Consular)',
    case_number: 'IOE-0941198234',
    current_status: 'Preparación de Documentos',
    last_updated: '2025-05-02T16:00:00Z',
    internal_notes: 'Falta traducción certificada de la partida de matrimonio y fotos tamaño pasaporte del cónyuge.',
    petitioner_name: 'David Duarte (Esposo - Residente Permanente)',
    beneficiary_name: 'Mariana Duarte Rivas'
  },
  {
    id: 'case-5',
    client_id: 'client-5',
    case_type: 'Petición Familiar (I-130 / Consular)',
    case_number: 'WAC-2390018491',
    current_status: 'Caso Aprobado / Tarjeta Emitida',
    last_updated: '2025-04-20T10:00:00Z',
    internal_notes: 'Cliente asistió a entrevista en consulado y fue aprobado. Tarjeta de Residencia Permanente recibida en el buzón. Trámite cerrado con éxito.',
    priority_date: '2022-08-15',
    petitioner_name: 'Rosa Navarro (Hermana - Ciudadana EE.UU.)',
    beneficiary_name: 'Juan Pablo Navarro'
  }
];

export const SEED_FILES: FileItem[] = [
  // Archivos de Carlos Morales (client-1)
  {
    id: 'file-1',
    client_id: 'client-1',
    file_name: 'I-797C_Aprobacion_USCIS.pdf',
    file_url: 'https://www.uscis.gov/sites/default/files/document/forms/i-797c.pdf',
    file_size: '1.4 MB',
    category: 'Notificaciones USCIS',
    uploaded_by: 'admin',
    uploaded_at: '2025-03-12T15:00:00Z',
    visible_to_client: true
  },
  {
    id: 'file-2',
    client_id: 'client-1',
    file_name: 'Confirmacion_Tarifas_NVC_CEAC.pdf',
    file_url: 'https://travel.state.gov/content/dam/visas/ceac-sample.pdf',
    file_size: '420 KB',
    category: 'Formularios',
    uploaded_by: 'admin',
    uploaded_at: '2025-04-05T11:20:00Z',
    visible_to_client: true
  },
  {
    id: 'file-3',
    client_id: 'client-1',
    file_name: 'Guia_Preparacion_Entrevista_Consular.pdf',
    file_url: 'https://travel.state.gov/content/dam/visas/interview-prep.pdf',
    file_size: '2.1 MB',
    category: 'Evidencias',
    uploaded_by: 'admin',
    uploaded_at: '2025-05-02T10:00:00Z',
    visible_to_client: true
  },
  {
    id: 'file-4',
    client_id: 'client-1',
    file_name: 'Notas_Estrategia_Legal_Admisibilidad_Interna.pdf',
    file_url: '#internal-confidential-memo',
    file_size: '680 KB',
    category: 'Otros',
    uploaded_by: 'admin',
    uploaded_at: '2025-03-10T14:00:00Z',
    visible_to_client: false // DOCUMENTO INTERNO CONFIDENCIAL
  },
  {
    id: 'file-5',
    client_id: 'client-1',
    file_name: 'Auditoria_Patrocinio_Financiero_I864_Interno.xlsx',
    file_url: '#internal-financial-review',
    file_size: '340 KB',
    category: 'Evidencias',
    uploaded_by: 'admin',
    uploaded_at: '2025-04-18T16:45:00Z',
    visible_to_client: false // DOCUMENTO INTERNO CONFIDENCIAL
  },
  {
    id: 'file-6',
    client_id: 'client-1',
    file_name: 'Acta_Nacimiento_Apostillada_Carlos.pdf',
    file_url: 'https://example.com/docs/acta-morales.pdf',
    file_size: '3.2 MB',
    category: 'Identificación',
    uploaded_by: 'client',
    uploaded_at: '2025-02-14T08:15:00Z',
    visible_to_client: true
  },

  // Archivos de Elena Gómez (client-2)
  {
    id: 'file-7',
    client_id: 'client-2',
    file_name: 'Confirmacion_Hoja_DS160.pdf',
    file_url: 'https://travel.state.gov/content/dam/visas/ds-160-sample.pdf',
    file_size: '890 KB',
    category: 'Formularios',
    uploaded_by: 'admin',
    uploaded_at: '2025-05-12T11:00:00Z',
    visible_to_client: true
  },
  {
    id: 'file-8',
    client_id: 'client-2',
    file_name: 'Instrucciones_Pago_Tasa_MRV_Embajada.pdf',
    file_url: 'https://ais.usvisa-info.com/sample-fee.pdf',
    file_size: '520 KB',
    category: 'Notificaciones USCIS',
    uploaded_by: 'admin',
    uploaded_at: '2025-05-13T16:30:00Z',
    visible_to_client: true
  },
  {
    id: 'file-9',
    client_id: 'client-2',
    file_name: 'Analisis_Interno_Arraigo_Financiero.docx',
    file_url: '#internal-risk-assessment',
    file_size: '410 KB',
    category: 'Evidencias',
    uploaded_by: 'admin',
    uploaded_at: '2025-05-11T17:00:00Z',
    visible_to_client: false // CONFIDENCIAL
  },

  // Archivos de Roberto Silva (client-3)
  {
    id: 'file-10',
    client_id: 'client-3',
    file_name: 'Recibos_Oficiales_I797_AOS_Combo.pdf',
    file_url: 'https://www.uscis.gov/receipt-sample.pdf',
    file_size: '1.9 MB',
    category: 'Notificaciones USCIS',
    uploaded_by: 'admin',
    uploaded_at: '2025-05-08T13:40:00Z',
    visible_to_client: true
  },
  {
    id: 'file-11',
    client_id: 'client-3',
    file_name: 'Examen_Medico_Sellado_I693_CopiaSegura.pdf',
    file_url: '#sealed-medical-record',
    file_size: '4.5 MB',
    category: 'Evidencias',
    uploaded_by: 'admin',
    uploaded_at: '2025-05-09T10:15:00Z',
    visible_to_client: false // CONFIDENCIAL
  }
];

export const SEED_APPOINTMENTS: Appointment[] = [
  {
    id: 'apt-1',
    client_id: 'client-1',
    date_time: '2025-06-12T15:30:00Z',
    description: 'Revisión final de evidencias financieras (I-864) y certificados tributarios IRS.',
    type: 'Revisión Documental',
    location: 'Videollamada Consularvisa Zoom Seguro',
    status: 'Programada'
  },
  {
    id: 'apt-2',
    client_id: 'client-1',
    date_time: '2025-06-25T11:00:00Z',
    description: 'Simulacro personalizado de Entrevista Consular con el Lic. Valdez.',
    type: 'Entrevista Consular',
    location: 'Oficina Central Consularvisa Miami / Sala Virtual',
    status: 'Programada'
  },
  {
    id: 'apt-3',
    client_id: 'client-2',
    date_time: '2025-05-28T16:00:00Z',
    description: 'Sesión de preparación de preguntas clave para la entrevista de Visa B1/B2.',
    type: 'Consulta Legal',
    location: 'Videollamada de Asesoría',
    status: 'Programada'
  },
  {
    id: 'apt-4',
    client_id: 'client-3',
    date_time: '2025-06-04T09:00:00Z',
    description: 'Cita oficial de Toma de Huellas y Fotografía (ASC Biometrics Houston).',
    type: 'Toma de Huellas (ASC)',
    location: 'USCIS ASC Houston Center, 12600 Northwest Fwy',
    status: 'Programada'
  }
];

export const SEED_MESSAGES: Message[] = [
  {
    id: 'msg-1',
    client_id: 'client-1',
    sender: 'admin',
    text: 'Estimado Carlos, buenas tardes. Le confirmamos que su expediente I-130 ya fue validado en CEAC. Estamos esperando la asignación de su cita en la embajada.',
    timestamp: '2025-05-18T14:40:00Z'
  },
  {
    id: 'msg-2',
    client_id: 'client-1',
    sender: 'client',
    text: '¡Excelente noticia Licenciado! ¿Tengo que llevar los originales de mis declaraciones de impuestos el día de la cita?',
    timestamp: '2025-05-18T14:48:00Z'
  },
  {
    id: 'msg-3',
    client_id: 'client-1',
    sender: 'admin',
    text: 'Sí, exactamente. En la Bóveda Digital le hemos subido la "Guía de Preparación de Entrevista" con el checklist ordenado de lo que debe llevar en mano.',
    timestamp: '2025-05-18T15:02:00Z'
  },
  {
    id: 'msg-4',
    client_id: 'client-2',
    sender: 'admin',
    text: 'Hola Elena, su formulario DS-160 está completado al 100%. Por favor revise la sección de Bóveda para descargar el comprobante de pago consular.',
    timestamp: '2025-05-14T09:30:00Z'
  },
  {
    id: 'msg-5',
    client_id: 'client-2',
    sender: 'client',
    text: 'Muchas gracias Lic. Valdez. Ya lo descargué y realizaré el depósito bancario mañana mismo.',
    timestamp: '2025-05-14T10:15:00Z'
  },
  {
    id: 'msg-6',
    client_id: 'client-3',
    sender: 'admin',
    text: 'Roberto, hemos radicado su paquete I-485 con éxito. En cuanto recibamos la notificación formal de la cita de huellas se la publicaremos en su calendario.',
    timestamp: '2025-05-10T12:00:00Z'
  }
];
