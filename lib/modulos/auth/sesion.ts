// Sesión basada en una cookie firmada con HMAC-SHA256 (Web Crypto, funciona en rutas y en proxy)
export const NOMBRE_COOKIE_SESION = 'sesion';
export const DURACION_SESION_SEGUNDOS = 60 * 60 * 8;

const codificador = new TextEncoder();

// Importa la clave secreta desde las variables de entorno
async function obtenerClaveFirma() {
  const secreto = process.env.AUTH_SECRET;
  if (!secreto || secreto.length < 32) {
    throw new Error('AUTH_SECRET no está definido o tiene menos de 32 caracteres');
  }
  return crypto.subtle.importKey(
    'raw',
    codificador.encode(secreto),
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign', 'verify']
  );
}

function convertirBytesAHex(bytes: ArrayBuffer): string {
  return Array.from(new Uint8Array(bytes), (byte) => byte.toString(16).padStart(2, '0')).join('');
}

function convertirHexABytes(hex: string): Uint8Array<ArrayBuffer> | null {
  if (hex.length === 0 || hex.length % 2 !== 0 || !/^[0-9a-f]+$/.test(hex)) return null;
  const bytes = new Uint8Array(hex.length / 2);
  for (let i = 0; i < bytes.length; i++) {
    bytes[i] = parseInt(hex.substring(i * 2, i * 2 + 2), 16);
  }
  return bytes;
}

// Crea el token "idUsuario.expiraEnSegundos.firma" para guardar en la cookie
export async function crearTokenSesion(idUsuario: number): Promise<string> {
  const expiraEn = Math.floor(Date.now() / 1000) + DURACION_SESION_SEGUNDOS;
  const carga = `${idUsuario}.${expiraEn}`;
  const firma = await crypto.subtle.sign('HMAC', await obtenerClaveFirma(), codificador.encode(carga));
  return `${carga}.${convertirBytesAHex(firma)}`;
}

// Valida firma y vencimiento del token. Devuelve el id del usuario, o null si no es válido
export async function verificarTokenSesion(token: string | undefined): Promise<number | null> {
  if (!token) return null;

  const partes = token.split('.');
  if (partes.length !== 3) return null;

  const [idTexto, expiraTexto, firmaHex] = partes;
  const firma = convertirHexABytes(firmaHex);
  if (!firma) return null;

  const esFirmaValida = await crypto.subtle.verify(
    'HMAC',
    await obtenerClaveFirma(),
    firma,
    codificador.encode(`${idTexto}.${expiraTexto}`)
  );
  if (!esFirmaValida) return null;

  const haExpirado = Number(expiraTexto) < Math.floor(Date.now() / 1000);
  const idUsuario = Number(idTexto);
  if (haExpirado || !Number.isInteger(idUsuario)) return null;

  return idUsuario;
}
