# Integración de Base de Datos en la Nube (Firebase Firestore) & Sincronización Multi-Dispositivo

Transición integral del almacenamiento local aislado a una arquitectura en la nube con Firebase Firestore y Cloud Storage, garantizando que el abogado y sus clientes vean exactamente los mismos datos en tiempo real desde cualquier computadora o dispositivo móvil.

## User Review & Critical Decisions

> [!IMPORTANT]
> **Decisiones Confirmadas por el Usuario (Fase 1):**
> 1. **Base de Datos en la Nube:** Aprovisionamiento integrado de **Firebase Firestore** gestionado directamente a través de las herramientas de Google AI Studio.
> 2. **Bóveda Digital:** Almacenamiento seguro de archivos y documentos en la nube con acceso compartido bidireccional (abogado y cliente).
> 3. **Correspondencia Legal:** Bandeja de mensajes estructurada (asunto, cuerpo, remitente, fecha y lectura) en sustitución del chat informal, sincronizada de forma instantánea.

---

## 1. Overview & Core Concept

Actualmente la aplicación utilizaba `localStorage` (aislado en el disco del navegador donde se navega) y un servidor de desarrollo temporal. Al abrir la app desde otra computadora o por parte del cliente, el navegador no tenía acceso a esos datos locales y mostraba los datos semilla predeterminados.

Con esta solución:
- **Base de Datos Centralizada (Firestore):** Las 5 colecciones (`users`, `cases`, `files`, `appointments`, `messages`) se almacenan en la nube de Google Firebase.
- **Sincronización en Tiempo Real (`onSnapshot`):** Cualquier cambio realizado por el Lic. Ronny Peña (crear cliente, registrar pago, enviar comunicado oficial, subir archivo) se refleja de inmediato en la pantalla del cliente sin necesidad de recargar.
- **Bóveda Digital Persistente:** Los archivos subidos por el cliente o la firma quedan almacenados y accesibles para descarga en cualquier momento y equipo.
- **Bandeja de Entrada Formal:** Registro ordenado de comunicados con estado de no leído, visualización de remitente/destinatario y botón de respuesta inmediata.

---

## 2. User Experience & Visual Design

### Flujos Clave de Usuario

1. **Flujo de Acceso Multi-Dispositivo:**
   - El Lic. Ronny Peña crea un cliente desde su oficina y genera sus credenciales.
   - El cliente ingresa desde su propia laptop o smartphone con su correo y contraseña.
   - El cliente visualiza de inmediato su expediente real, su balance financiero, sus citas y los documentos de su caso.

2. **Flujo de la Bandeja de Entrada de Mensajes:**
   - El abogado redacta un comunicado oficial con asunto y cuerpo desde el perfil del cliente.
   - En la computadora del cliente, el banner de la bandeja y el contador de mensajes no leídos se actualizan al instante.
   - El cliente hace clic en "Leer Mensaje", se marca como leído automáticamente y puede redactar una respuesta formal.

3. **Flujo de la Bóveda Digital:**
   - Tanto el abogado como el cliente pueden cargar documentos oficiales (PDFs, imágenes de soporte).
   - El abogado decide mediante el switch si un documento es confidencial o visible para el cliente (`visible_to_client`).
   - Los documentos visibles se listan con enlace de descarga real accesible desde cualquier máquina.

### Identidad Visual y Estilo
- **Paleta Corporativa:** Azul Marino Profundo (`slate-950`/`slate-900`), Dorado/Ámbar (`amber-500`/`amber-600`), fondos limpios en Blanco y Gris Claro (`slate-50`).
- **Tipografía:** Cinzel/Serif para encabezados y nombres legales; Plus Jakarta Sans para formularios y lectura óptima.
- **Retroalimentación:** Notificaciones Toast flotantes, estados de carga elegantes y distintivos visuales claros de roles (Lic. Ronny Peña | ConsularVisa vs. Cliente).

---

## 3. Key Product Decisions & Trade-Offs

| Decisión | Enfoque Seleccionado | Justificación | Alternativa Descartada |
| :--- | :--- | :--- | :--- |
| **Persistencia de Datos** | Firebase Firestore Cloud Database | Permite persistencia real multi-equipo, suscripciones en tiempo real y reglas de seguridad RBAC. | LocalStorage (descartado porque no sincroniza entre computadoras). |
| **Flujo de Aprovisionamiento** | Herramientas integradas `show_aistudio_ui` y `rpc_action` | Garantiza configuración automática segura sin exponer claves privadas en el código cliente. | Configuración manual con riesgo de llaves expuestas. |
| **Gestión de Comunicación** | Bandeja de Entrada con Asunto y Estado de Lectura | Proporciona formalidad jurídica a las consultas legales y previene pérdidas de mensajes. | Chat informal sin estructura de asunto ni acuses formales. |
| **Compatibilidad Híbrida** | Conexión activa a Firestore con fallback offline reactivo | Si hay intermitencia de red, la interfaz no se congela y sincroniza al restablecer conexión. | Bloqueo total ante microcortes de red. |

---

## 4. Technical Architecture & Data Strategy

```
┌────────────────────────────────────────────────────────────────────────┐
│                   DISPOSITIVOS & USUARIOS REMOTOS                      │
├───────────────────────────────────┬────────────────────────────────────┤
│   LAPTOP ABOGADO (LIC. RONNY)     │     DISPOSITIVO / PC CLIENTE       │
│  [Panel Admin & Bandeja Envíos]   │  [Portal Cliente & Bandeja Entrada]│
└─────────────────┬─────────────────┴──────────────────┬─────────────────┘
                  │                                    │
                  │  HTTPS / WebSockets en Tiempo Real │
                  ▼                                    ▼
┌────────────────────────────────────────────────────────────────────────┐
│              GOOGLE CLOUD / FIREBASE FIRESTORE CLUSTER                 │
├────────────────────────────────────────────────────────────────────────┤
│  /users/{userId}           -> Credenciales, balances, perfil, foto     │
│  /cases/{caseId}           -> Estatus oficial USCIS/NVC, notas         │
│  /files/{fileId}           -> Bóveda digital con visible_to_client     │
│  /appointments/{aptId}     -> Citas consulares, huellas y asesorías    │
│  /messages/{messageId}     -> Bandeja: asunto, cuerpo, remitente, leída│
└───────────────────────────────────┬────────────────────────────────────┘
                                    │
                                    ▼
┌────────────────────────────────────────────────────────────────────────┐
│                FIRESTORE SECURITY RULES (firestore.rules)              │
│  - Control de acceso RBAC estricto para law@ronnypena.com.do          │
│  - Clientes solo leen/escriben registros con su propio client_id       │
│  - Archivos con visible_to_client == false ocultos a clientes          │
└────────────────────────────────────────────────────────────────────────┘
```

### Entidades de Datos

1. **`users`**: `id`, `name`, `role` (`admin`/`client`), `email`, `phone`, `portal_password`, `uscis_email`, `uscis_password`, `total_cost`, `amount_paid`, `avatar_url`, `country_of_origin`.
2. **`cases`**: `id`, `client_id`, `case_type`, `case_number`, `current_status`, `last_updated`, `internal_notes`, `petitioner_name`, `beneficiary_name`.
3. **`files`**: `id`, `client_id`, `file_name`, `file_url`, `file_size`, `category`, `uploaded_by`, `uploaded_at`, `visible_to_client` (booleano).
4. **`appointments`**: `id`, `client_id`, `date_time`, `description`, `location`, `type`, `status`.
5. **`messages`**: `id`, `client_id`, `sender` (`admin`/`client`), `subject`, `text`, `timestamp`, `read` (booleano).

### Pasos de Ejecución tras Aprobación:
1. Activar la interfaz de aprovisionamiento de Firebase (`show_aistudio_ui` con `firebase_setup`) para aceptar los términos y crear la base de datos Firestore en el proyecto en la nube.
2. Generar el esquema `firebase-blueprint.json` y desplegar las reglas de seguridad `firestore.rules` con permisos estrictos RBAC.
3. Conectar el cliente de Firebase SDK con sincronización en tiempo real (`onSnapshot`) en `firestoreService.ts`.
4. Verificar la creación de registros, actualización de pagos, subida de documentos a la bóveda y envío de mensajes entre dos sesiones simultáneas.
