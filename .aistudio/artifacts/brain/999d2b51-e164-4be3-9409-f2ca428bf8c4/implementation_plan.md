# Consularvisa: Autenticación Estricta & Generador Automático de Credenciales de Clientes

Implementación de una pantalla de acceso principal (Login) con validación estricta de correo y contraseña, gestión de sesión activa con botón de desconexión (Logout), y un generador automático de credenciales para nuevos clientes en el módulo de administración, con herramientas de copiado en un clic y compartición preformateada para WhatsApp y Correo Electrónico.

---

## Decisiones Críticas y Preferencias Confirmadas

> [!IMPORTANT]
> Decisiones de UX y arquitectura acordadas en la fase de clarificación interactiva:
> - **Pantalla de Inicio de Sesión**: Formulario estricto de correo y contraseña, con validación de credenciales reales registradas en Firestore, alertas de error y persistencia de sesión. Se incluye un botón de "Cerrar Sesión" en la barra superior.
> - **Generación de Credenciales**: Generación automática de contraseña segura aleatoria al registrar un cliente, desplegando un modal de confirmación con opciones directas de:
>   1. Copiar credenciales al portapapeles.
>   2. Compartir vía WhatsApp (`https://wa.me/?text=...`) con mensaje formal de bienvenida.
>   3. Compartir vía Email (`mailto:...`) con plantilla institucional.
> - **Primer Acceso del Cliente**: Acceso directo e inmediato al Portal del Cliente con opción visible en su perfil para actualizar su contraseña cuando lo desee.

---

## 1. Visión General del Producto y Experiencia de Usuario

### A. Flujo de Autenticación Principal (Login)
1. **Acceso Inicial**: Al ingresar a la aplicación sin sesión activa, se presenta una pantalla de bienvenida corporativa de Consularvisa con la paleta Azul Marino Profundo y detalles en Dorado.
2. **Formulario de Credenciales**: Campos de Correo Electrónico y Contraseña con botón de mostrar/ocultar contraseña, y validación contra la colección `users` de Firestore.
3. **Guía de Cuentas Demostrativas**: Plegable discreto con las cuentas preconfiguradas (Abogado Principal y Clientes de prueba con sus contraseñas) para facilitar la evaluación sin fricciones.
4. **Cierre de Sesión (Logout)**: Botón accesible en la barra superior que revoca el estado de sesión y devuelve al usuario a la pantalla de Login.

### B. Flujo de Registro de Cliente y Generación de Credenciales
1. El abogado hace clic en "Nuevo Cliente / Caso" en el Panel de Administración.
2. El sistema genera automáticamente una contraseña segura temporal (ej: `Consular*7K9mQ2`).
3. Al guardar el expediente, se almacena en Firestore (`users` y `cases`) y se abre automáticamente el **Modal de Credenciales Generadas**.
4. La tarjeta permite:
   - Visualizar Usuario (Email) y Contraseña.
   - **Copiar Credenciales**: Formato estructurado para pegar en cualquier chat o documento.
   - **Enviar por WhatsApp**: Abre WhatsApp Web o la app móvil con mensaje predeterminado: *"Estimado(a) [Nombre], su expediente migratorio en Consularvisa ha sido abierto. Sus credenciales de acceso al Portal del Cliente son..."*.
   - **Enviar por Correo Electrónico**: Abre el cliente de correo predeterminado con el asunto y cuerpo redactados formalmente.

---

## 2. Diseño Visual & Interfaz

- **Paleta de Colores**:
  - Fondo y contenedores: Azul Marino Corporativo (`#0a192f` / `#0f172a`), Slate Neutro (`#f8fafc` / `#ffffff`).
  - Acentos y Primarios: Dorado Consular (`#c59b27` / `#d97706` / `#b45309`).
  - Textos: Alta legibilidad con WCAG AA (4.5:1), tipografías Plus Jakarta Sans y Cinzel en títulos de marca.
- **Micro-interacciones y Estados**:
  - Retroalimentación con toasts al copiar contraseñas o compartir credenciales.
  - Indicadores de carga durante la autenticación.
  - Mensajes de error claros ante contraseñas incorrectas o correos inexistentes.

---

## 3. Arquitectura Técnica y Flujo de Datos

```
┌─────────────────────────────────────────────────────────────┐
│                       APP ROUTER                            │
│           (Evalúa si existe sesión autenticada)             │
└──────────────┬──────────────────────────────┬───────────────┘
               │                               │
        [No Autenticado]                 [Autenticado]
               ▼                               ▼
     ┌───────────────────┐          ┌────────────────────┐
     │   LoginView.tsx   │          │    Navbar.tsx      │
     │  Formulario con   │          │ (Con botón Logout) │
     │  Email & Password │          └──────────┬─────────┘
     └─────────┬─────────┘                     │
               │                        ┌──────┴──────┐
        (Éxito Login)                   │             │
               │                   [Rol Admin]   [Rol Client]
               ▼                        ▼             ▼
      [Guarda sesión en        ┌─────────────┐ ┌───────────────┐
       AppContext & Storage]   │AdminDashboard│ │ClientDashboard│
                               └─────────────┘ └───────────────┘
```

### Mutaciones en el Modelo de Datos:
1. `src/types/index.ts`: Añadir campo opcional `password` (o `portal_password`) a la interfaz `User` para la autenticación en el portal, manteniendo `uscis_password` para las credenciales oficiales de USCIS/CEAC.
2. `src/firebase/firestoreService.ts`:
   - Añadir función `loginUser(email, password)` con verificación y retorno de sesión.
   - Actualizar `createUser` para aceptar y almacenar la contraseña autogenerada del portal.
   - Añadir función `updateUserPassword(userId, newPassword)` para permitir el cambio de clave por parte del cliente.
3. `src/utils/credentials.ts`: Utilidad para generación de contraseñas seguras y plantillas de mensajes para WhatsApp y Correo.
4. `src/components/auth/LoginView.tsx`: Vista dedicada de inicio de sesión.
5. `src/components/admin/ClientCredentialsModal.tsx`: Modal emergente post-creación para compartir credenciales al instante.

---

## 4. Plan de Ejecución Paso a Paso

1. **Utilidades de Credenciales (`src/utils/credentials.ts` y tests)**:
   - Función pura de generación aleatoria de contraseñas con caracteres alfanuméricos y símbolos seguros.
   - Generador de enlaces para WhatsApp (`https://wa.me/?text=...`) y `mailto:`.
   - Pruebas unitarias con `node:test` para garantizar que las contraseñas cumplan con longitud y entropía.

2. **Capa de Autenticación en `firestoreService.ts`**:
   - Asignar contraseñas a los usuarios semilla existentes para permitir iniciar sesión inmediatamente con cualquiera de ellos.
   - Implementar método de login y actualización de credenciales.

3. **Componente `LoginView.tsx`**:
   - Formulario elegante con validación de campos, toggle de visibilidad de contraseña y alertas de error.
   - Acordeón de credenciales de demostración para el evaluador/usuario.

4. **Modificación de `NewClientModal.tsx` & Nuevo `ClientCredentialsModal.tsx`**:
   - Autogenerar la contraseña en el formulario de creación.
   - Mostrar el modal de confirmación con las acciones de "Copiar Credenciales", "Enviar por WhatsApp" y "Enviar por Email".

5. **Integración en `App.tsx` y `Navbar.tsx`**:
   - Condicionar el renderizado principal al estado de autenticación.
   - Incorporar el botón "Cerrar Sesión" en la barra de navegación.

6. **Verificación & Pruebas**:
   - Ejecutar pruebas unitarias de contraseñas.
   - Validar compilación con `compile_applet`.
   - Verificar flujos completos: Login como Abogado -> Crear Cliente -> Ver credenciales generadas -> Compartir -> Cerrar sesión -> Login con el nuevo cliente creado.
