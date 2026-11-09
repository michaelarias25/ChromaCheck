import { verificarCredenciales } from '@/lib/modulos/auth/servicio';
import {
  crearTokenSesion,
  DURACION_SESION_SEGUNDOS,
  NOMBRE_COOKIE_SESION,
} from '@/lib/modulos/auth/sesion';
import {
  leerCuerpoJson,
  responderError,
  responderErrorInterno,
  responderExito,
} from '@/lib/respuestas';

export async function POST(peticion: Request) {
  try {
    const cuerpo = await leerCuerpoJson(peticion);
    if (!cuerpo) {
      return responderError('El cuerpo de la petición debe ser un objeto JSON', 400);
    }

    const nombreUsuario =
      typeof cuerpo.nombreUsuario === 'string' ? cuerpo.nombreUsuario.trim() : '';
    const contrasena = typeof cuerpo.contrasena === 'string' ? cuerpo.contrasena : '';
    if (!nombreUsuario || !contrasena) {
      return responderError('Ingresa usuario y contraseña', 400);
    }

    const usuario = await verificarCredenciales(nombreUsuario, contrasena);
    if (!usuario) {
      return responderError('Usuario o contraseña incorrectos', 401);
    }

    const respuesta = responderExito(usuario);
    respuesta.cookies.set(NOMBRE_COOKIE_SESION, await crearTokenSesion(usuario.id), {
      httpOnly: true,
      sameSite: 'lax',
      secure: process.env.NODE_ENV === 'production',
      path: '/',
      maxAge: DURACION_SESION_SEGUNDOS,
    });
    return respuesta;
  } catch (error) {
    return responderErrorInterno(error);
  }
}
