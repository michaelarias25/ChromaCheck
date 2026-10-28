import { randomBytes, scryptSync, timingSafeEqual } from 'node:crypto';

const LONGITUD_CLAVE = 64;

// Genera el hash de una contraseña con scrypt y una sal aleatoria (formato "sal:hash" en hex)
export function hashearContrasena(contrasena: string): string {
  const sal = randomBytes(16).toString('hex');
  const hash = scryptSync(contrasena, sal, LONGITUD_CLAVE).toString('hex');
  return `${sal}:${hash}`;
}

// Compara una contraseña con un hash guardado, en tiempo constante
export function verificarContrasena(contrasena: string, hashGuardado: string): boolean {
  const [sal, hash] = hashGuardado.split(':');
  if (!sal || !hash) return false;

  const hashEsperado = Buffer.from(hash, 'hex');
  const hashCalculado = scryptSync(contrasena, sal, hashEsperado.length);

  return timingSafeEqual(hashEsperado, hashCalculado);
}
