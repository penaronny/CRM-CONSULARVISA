/**
 * @file src/utils/credentials.ts
 * @description Utilidades de generación y compartición de credenciales temporales para clientes.
 */

/**
 * Genera una contraseña temporal segura, legible y con alta entropía.
 * Formato: Prefijo amigable + Número + Letras mayúsculas/minúsculas + Símbolo seguro.
 * Ejemplo: "Visa*8Kp9W4"
 */
export function generateSecurePassword(length: number = 10): string {
  const letters = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz';
  const numbers = '23456789';
  const symbols = '!*#$';

  let randomLetters = '';
  for (let i = 0; i < length - 4; i++) {
    randomLetters += letters.charAt(Math.floor(Math.random() * letters.length));
  }

  const randomNum = numbers.charAt(Math.floor(Math.random() * numbers.length)) +
                    numbers.charAt(Math.floor(Math.random() * numbers.length));
  const randomSymbol = symbols.charAt(Math.floor(Math.random() * symbols.length));

  return `Visa${randomSymbol}${randomNum}${randomLetters}`;
}

/**
 * Retorna el texto preformateado institucional con las credenciales para compartir.
 */
export function formatCredentialsText(
  clientName: string,
  email: string,
  password: string,
  portalUrl?: string
): string {
  const resolvedUrl = portalUrl || (typeof window !== 'undefined' && window.location ? window.location.origin : 'https://consularvisa.com');
  return (
`🏛️ *CONSULARVISA - ACCESO AL PORTAL DEL CLIENTE*

Estimado(a) ${clientName},

Le damos la más cordial bienvenida a nuestra firma. Su expediente migratorio ha sido registrado exitosamente en nuestro sistema.

A través del Portal del Cliente podrá:
✓ Dar seguimiento en tiempo real al estatus de su caso (USCIS / NVC).
✓ Consultar su balance y pagos de honorarios.
✓ Descargar sus documentos oficiales y subir pruebas a su Bóveda Digital.
✓ Revisar sus próximas citas y chatear con su abogado.

*Sus Credenciales de Acceso:*
🔗 Enlace al Portal: ${resolvedUrl}
📧 Usuario (Correo): ${email}
🔑 Contraseña Temporal: ${password}

*Nota de Seguridad:* Esta contraseña es temporal. Puede actualizarla en su perfil cuando lo desee.`
  );
}

/**
 * Genera el enlace directo para enviar las credenciales a través de WhatsApp.
 */
export function generateWhatsAppShareUrl(
  clientName: string,
  email: string,
  password: string,
  phone?: string,
  portalUrl?: string
): string {
  const text = formatCredentialsText(clientName, email, password, portalUrl);
  const encodedText = encodeURIComponent(text);
  
  if (phone) {
    const cleanPhone = phone.replace(/[^0-9]/g, '');
    if (cleanPhone.length >= 8) {
      return `https://wa.me/${cleanPhone}?text=${encodedText}`;
    }
  }

  return `https://wa.me/?text=${encodedText}`;
}

/**
 * Genera el enlace directo `mailto:` para enviar las credenciales por correo electrónico.
 */
export function generateEmailShareUrl(
  clientName: string,
  email: string,
  password: string,
  portalUrl?: string
): string {
  const subject = encodeURIComponent(`Consularvisa - Credenciales de Acceso a su Portal de Cliente`);
  const body = encodeURIComponent(formatCredentialsText(clientName, email, password, portalUrl));
  return `mailto:${email}?subject=${subject}&body=${body}`;
}
