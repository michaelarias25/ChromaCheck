import { NOMBRE_COOKIE_SESION } from '@/lib/modulos/auth/sesion';
import { responderExito } from '@/lib/respuestas';

export async function POST() {
  const respuesta = responderExito(null);
  respuesta.cookies.delete(NOMBRE_COOKIE_SESION);
  return respuesta;
}
