/**
 * @file src/types/index.ts
 * @description Modelos de datos de Firestore y tipos de arquitectura para Consularvisa.
 * 
 * ESTRUCTURA FIRESTORE DEFINIDA EN LA ESPECIFICACIÓN:
 * 1. users: id, name, role (admin/client), email, phone, uscis_email, uscis_password, total_cost, amount_paid
 * 2. cases: id, client_id, case_type, current_status, last_updated, internal_notes
 * 3. files: id, client_id, file_name, file_url, uploaded_by, visible_to_client (booleano)
 * 4. appointments: id, client_id, date_time, description
 * 5. messages: id, client_id, sender (admin/client), text, timestamp
 */

export type UserRole = 'admin' | 'client';

export interface User {
  id: string;
  name: string;
  role: UserRole;
  email: string;
  phone: string;
  portal_password?: string; // Contraseña de acceso al portal de Consularvisa
  uscis_email?: string;
  uscis_password?: string;
  total_cost: number;
  amount_paid: number;
  avatar_url?: string;
  country_of_origin?: string;
  created_at?: string;
}

export type CaseType = 
  | 'Petición Familiar (I-130 / Consular)'
  | 'Visa de Turismo (B1/B2)'
  | 'Ajuste de Estatus (I-485)'
  | 'Perdón Migratorio (I-601A)'
  | 'Permiso de Trabajo (I-765)'
  | string;

export interface Case {
  id: string;
  client_id: string;
  case_type: CaseType;
  case_number: string; // ej. WAC-2490123891, IOE-0932849182
  current_status: string;
  last_updated: string;
  internal_notes: string;
  priority_date?: string;
  petitioner_name?: string; // Nombre del peticionario (ej. Ciudadano estadounidense)
  beneficiary_name?: string;
}

export interface FileItem {
  id: string;
  client_id: string;
  file_name: string;
  file_url: string;
  file_size?: string;
  category?: 'Identificación' | 'Formularios' | 'Evidencias' | 'Notificaciones USCIS' | 'Otros';
  uploaded_by: 'admin' | 'client';
  uploaded_at: string;
  visible_to_client: boolean; // TRUE: cliente lo ve; FALSE: solo uso interno del abogado
  file_data?: string; // Data URL en Base64 para visualización y descarga directa en cualquier dispositivo
}

export interface Appointment {
  id: string;
  client_id: string;
  date_time: string; // ISO 8601 string
  description: string;
  location?: string;
  type?: 'Consulta Legal' | 'Toma de Huellas (ASC)' | 'Entrevista Consular' | 'Revisión Documental';
  status?: 'Programada' | 'Completada' | 'Reprogramada';
}

export interface Message {
  id: string;
  client_id: string;
  sender: 'admin' | 'client';
  text: string;
  timestamp: string; // ISO 8601 string
  subject?: string; // Asunto formal del mensaje/comunicado
  read?: boolean; // Estado de lectura
}

/**
 * Configuración modular para los pasos de cada proceso migratorio.
 * Diseñado para ser extensible a nuevas categorías de visados (ej. Turismo B1/B2, F-1, H-1B).
 */
export interface CaseStep {
  id: string;
  title: string;
  description: string;
  stageName: string; // Identificador canónico del estatus
  approxDuration?: string;
  badgeColor?: string;
}

export interface CaseWorkflowConfig {
  caseType: string;
  description: string;
  defaultStatus: string;
  steps: CaseStep[];
}
