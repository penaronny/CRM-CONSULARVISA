/**
 * @file src/components/docs/ArchitectureGuideModal.tsx
 * @description Modal interactivo con la estructura de carpetas sugerida, arquitectura Firebase y guía de escalabilidad.
 */

import React, { useState } from 'react';
import { 
  X, 
  FolderTree, 
  Database, 
  ShieldCheck, 
  Layers, 
  Rocket, 
  CreditCard, 
  Webhook, 
  Copy, 
  Check 
} from 'lucide-react';

interface ArchitectureGuideModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const ArchitectureGuideModal: React.FC<ArchitectureGuideModalProps> = ({ isOpen, onClose }) => {
  const [copied, setCopied] = useState(false);
  const [activeTab, setActiveTab] = useState<'folders' | 'firestore' | 'scalability'>('folders');

  if (!isOpen) return null;

  const folderStructureText = `src/
├── types/
│   └── index.ts                # Modelos de Firestore: User, Case, FileItem, Appointment, Message
├── firebase/
│   ├── config.ts               # Conexión Firebase SDK (Auth, Firestore, Storage) y Security Rules
│   └── firestoreService.ts     # Capa CRUD con soporte reactivo y persistencia
├── constants/
│   ├── caseStepsConfig.ts      # Flujos modulares: Petición Familiar, Visa Turismo B1/B2, Ajuste Estatus
│   └── seedData.ts             # Datos iniciales realistas de prueba
├── utils/
│   ├── finance.ts              # Balance pendiente, porcentaje liquidado y moneda USD
│   ├── finance.test.ts         # Pruebas unitarias de cálculo financiero (node:test)
│   ├── caseSteps.ts            # Resolver modular de progreso y etapas
│   └── caseSteps.test.ts       # Pruebas unitarias de flujos de casos
├── components/
│   ├── common/
│   │   ├── Navbar.tsx          # Barra institucional y selector de roles de prueba
│   │   ├── StatusBadge.tsx     # Insignias estandarizadas de estatus USCIS/NVC
│   │   └── ToastContainer.tsx  # Alertas y confirmaciones flotantes
│   ├── admin/
│   │   ├── AdminDashboard.tsx  # Tabla con Actualización Rápida (Quick Update)
│   │   ├── ClientProfile.tsx   # Perfil: Credenciales USCIS, Finanzas, Switch de archivos, Citas, Chat
│   │   └── NewClientModal.tsx  # Registro de nuevo cliente y expediente
│   ├── client/
│   │   ├── ClientDashboard.tsx # Portal móvil-first del cliente
│   │   ├── CaseProgressTracker.tsx # Barra de progreso modular según trámite
│   │   ├── DocumentVault.tsx   # Bóveda (visible_to_client == true) + subida de documentos
│   │   ├── ClientAppointments.tsx # Lista cronológica de citas y tareas
│   │   ├── ClientChat.tsx      # Chat bidireccional con la oficina de abogados
│   │   └── PatreonBanner.tsx   # Banner promocional Club VIP de Patreon
│   └── docs/
│       └── ArchitectureGuideModal.tsx # Documentación interactiva del sistema
├── context/
│   └── AppContext.tsx          # Estado global y suscripciones en tiempo real
├── App.tsx                     # Orquestador de vistas y roles
├── main.tsx                    # Punto de entrada React
└── index.css                   # Tailwind CSS v4`;

  const copyToClipboard = () => {
    navigator.clipboard.writeText(folderStructureText);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/75 backdrop-blur-xs">
      <div className="bg-white w-full max-w-4xl rounded-2xl border border-slate-200 shadow-2xl overflow-hidden max-h-[92vh] flex flex-col animate-scale-up">
        
        {/* Header */}
        <div className="px-6 py-4 bg-slate-900 text-white flex items-center justify-between border-b border-amber-500/30">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl bg-amber-500/20 text-amber-400">
              <Layers className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base sm:text-lg font-bold font-serif">
                Arquitectura del Software & Guía de Escalabilidad
              </h2>
              <p className="text-xs text-slate-400">
                Diseño para la firma de inmigración Consularvisa (React + Tailwind + Firebase)
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 rounded-lg hover:bg-slate-800 text-slate-400 hover:text-white transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Pestañas de Navegación del Modal */}
        <div className="flex items-center gap-2 px-6 pt-3 border-b border-slate-200 bg-slate-50 text-xs font-semibold">
          <button
            onClick={() => setActiveTab('folders')}
            className={`py-2 px-3 border-b-2 transition-all flex items-center gap-1.5 ${
              activeTab === 'folders'
                ? 'border-amber-600 text-amber-900 font-bold'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            <FolderTree className="w-4 h-4" />
            <span>Estructura de Carpetas</span>
          </button>

          <button
            onClick={() => setActiveTab('firestore')}
            className={`py-2 px-3 border-b-2 transition-all flex items-center gap-1.5 ${
              activeTab === 'firestore'
                ? 'border-amber-600 text-amber-900 font-bold'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            <Database className="w-4 h-4" />
            <span>Modelo Firestore & Seguridad</span>
          </button>

          <button
            onClick={() => setActiveTab('scalability')}
            className={`py-2 px-3 border-b-2 transition-all flex items-center gap-1.5 ${
              activeTab === 'scalability'
                ? 'border-amber-600 text-amber-900 font-bold'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            <Rocket className="w-4 h-4" />
            <span>Escalabilidad Futura</span>
          </button>
        </div>

        {/* Contenido del Modal */}
        <div className="p-6 overflow-y-auto space-y-4 text-xs">
          
          {activeTab === 'folders' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <p className="text-xs text-slate-600 font-medium">
                  Estructura modular limpia recomendada para producción en React:
                </p>
                <button
                  onClick={copyToClipboard}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold transition-colors"
                >
                  {copied ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                  <span>{copied ? 'Copiado' : 'Copiar Árbol'}</span>
                </button>
              </div>

              <pre className="p-4 rounded-xl bg-slate-900 text-amber-300 font-mono text-[11px] leading-relaxed overflow-x-auto shadow-inner">
                {folderStructureText}
              </pre>
            </div>
          )}

          {activeTab === 'firestore' && (
            <div className="space-y-4">
              <p className="text-slate-600">
                La base de datos sigue el modelo relacional-documental NoSQL de Firestore con 5 colecciones raíz optimizadas para consultas atómicas y filtrado de seguridad:
              </p>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs">
                <div className="p-3.5 rounded-xl border border-slate-200 bg-slate-50 space-y-1">
                  <div className="flex items-center gap-2 text-slate-900 font-bold">
                    <span className="w-2 h-2 rounded-full bg-blue-500" />
                    <span>/users/{'{userId}'}</span>
                  </div>
                  <p className="text-slate-600 text-[11px]">
                    id, name, role (admin/client), email, phone, uscis_email, uscis_password, total_cost, amount_paid.
                  </p>
                </div>

                <div className="p-3.5 rounded-xl border border-slate-200 bg-slate-50 space-y-1">
                  <div className="flex items-center gap-2 text-slate-900 font-bold">
                    <span className="w-2 h-2 rounded-full bg-indigo-500" />
                    <span>/cases/{'{caseId}'}</span>
                  </div>
                  <p className="text-slate-600 text-[11px]">
                    id, client_id, case_type, current_status, last_updated, internal_notes, case_number.
                  </p>
                </div>

                <div className="p-3.5 rounded-xl border border-slate-200 bg-slate-50 space-y-1">
                  <div className="flex items-center gap-2 text-slate-900 font-bold">
                    <span className="w-2 h-2 rounded-full bg-emerald-500" />
                    <span>/files/{'{fileId}'}</span>
                  </div>
                  <p className="text-slate-600 text-[11px]">
                    id, client_id, file_name, file_url, uploaded_by, visible_to_client (booleano).
                  </p>
                </div>

                <div className="p-3.5 rounded-xl border border-slate-200 bg-slate-50 space-y-1">
                  <div className="flex items-center gap-2 text-slate-900 font-bold">
                    <span className="w-2 h-2 rounded-full bg-purple-500" />
                    <span>/appointments/{'{aptId}'}</span>
                  </div>
                  <p className="text-slate-600 text-[11px]">
                    id, client_id, date_time, description, type, location, status.
                  </p>
                </div>

                <div className="p-3.5 rounded-xl border border-slate-200 bg-slate-50 space-y-1 md:col-span-2">
                  <div className="flex items-center gap-2 text-slate-900 font-bold">
                    <span className="w-2 h-2 rounded-full bg-amber-500" />
                    <span>/messages/{'{messageId}'}</span>
                  </div>
                  <p className="text-slate-600 text-[11px]">
                    id, client_id, sender (admin/client), text, timestamp.
                  </p>
                </div>
              </div>

              <div className="p-4 rounded-xl bg-amber-50/70 border border-amber-200 space-y-1.5">
                <div className="flex items-center gap-1.5 font-bold text-amber-900">
                  <ShieldCheck className="w-4 h-4 text-amber-700" />
                  <span>Regla Crítica de Seguridad para Archivos</span>
                </div>
                <p className="text-[11px] text-amber-800 leading-relaxed font-mono">
                  allow read: if isAdmin() || (request.auth.uid == resource.data.client_id &amp;&amp; resource.data.visible_to_client == true);
                </p>
                <p className="text-[11px] text-amber-700">
                  Esto garantiza que los clientes nunca puedan interceptar ni descargar documentos marcados como confidenciales/internos por el abogado.
                </p>
              </div>
            </div>
          )}

          {activeTab === 'scalability' && (
            <div className="space-y-4">
              <p className="text-slate-600">
                La arquitectura fue diseñada para permitir la adición de nuevos procesos migratorios y pasarelas de pago con mínimo esfuerzo:
              </p>

              <div className="space-y-3">
                <div className="p-3.5 rounded-xl border border-slate-200 bg-slate-50">
                  <div className="flex items-center gap-2 font-bold text-slate-900">
                    <Rocket className="w-4 h-4 text-amber-600" />
                    <span>1. Nuevos Procesos Migratorios (Visas de Turismo, Estudiantes F-1, Trabajo H-1B)</span>
                  </div>
                  <p className="text-slate-600 text-[11px] mt-1 leading-relaxed">
                    Edite únicamente el archivo <code className="bg-slate-200 px-1 py-0.5 rounded font-mono text-slate-800">src/constants/caseStepsConfig.ts</code> agregando la nueva clave en <code className="bg-slate-200 px-1 py-0.5 rounded font-mono text-slate-800">CASE_WORKFLOWS</code> con su array de etapas ordenadas. Tanto el rastreador del cliente como el dropdown de Quick Update consumirán el nuevo flujo automáticamente.
                  </p>
                </div>

                <div className="p-3.5 rounded-xl border border-slate-200 bg-slate-50">
                  <div className="flex items-center gap-2 font-bold text-slate-900">
                    <CreditCard className="w-4 h-4 text-emerald-600" />
                    <span>2. Pasarela de Pagos (Stripe / PayPal Checkout)</span>
                  </div>
                  <p className="text-slate-600 text-[11px] mt-1 leading-relaxed">
                    Las utilidades en <code className="bg-slate-200 px-1 py-0.5 rounded font-mono text-slate-800">src/utils/finance.ts</code> están desacopladas de la UI. Puede invocar Stripe Cloud Functions mediante webhooks que llamen a <code className="bg-slate-200 px-1 py-0.5 rounded font-mono text-slate-800">updateUser(userId, &#123; amount_paid: newTotal &#125;)</code> tras confirmar el cobro del anticipo.
                  </p>
                </div>

                <div className="p-3.5 rounded-xl border border-slate-200 bg-slate-50">
                  <div className="flex items-center gap-2 font-bold text-slate-900">
                    <Webhook className="w-4 h-4 text-blue-600" />
                    <span>3. Sincronización Automática con la API de USCIS Case Status</span>
                  </div>
                  <p className="text-slate-600 text-[11px] mt-1 leading-relaxed">
                    Un Cloud Scheduler puede consultar periódicamente los números de caso (IOE, WAC, MSC) contra el endpoint de USCIS y ejecutar <code className="bg-slate-200 px-1 py-0.5 rounded font-mono text-slate-800">updateCase(caseId, &#123; current_status: nuevoEstatus &#125;)</code>, actualizando la barra de progreso del cliente en tiempo real.
                  </p>
                </div>
              </div>
            </div>
          )}

        </div>

        {/* Footer */}
        <div className="px-6 py-3 bg-slate-100 border-t border-slate-200 flex justify-end">
          <button
            onClick={onClose}
            className="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white font-semibold rounded-xl text-xs transition-colors"
          >
            Entendido
          </button>
        </div>

      </div>
    </div>
  );
};
