import { NextResponse } from 'next/server';
import { verificarCredenciales } from '@/lib/modulos/auth/servicio';
import {
  crearTokenSesion,
  DURACION_SESION_SEGUNDOS,
  NOMBRE_COOKIE_SESION,
} from '@/lib/modulos/auth/sesion';

export async function POST(peticion: Request) {
  try {
    const cuerpo = await peticion.json().catch(() => null);
    const nombreUsuario = typeof cuerpo?.nombreUsuario === 'string' ? cuerpo.nombreUsuario.trim() : '';
    const contrasena = typeof cuerpo?.contrasena === 'string' ? cuerpo.contrasena : '';

    if (!nombreUsuario || !contrasena) {
      return NextResponse.json(
        { exito: false, error: 'Ingresa usuario y contraseña' },
        { status: 400 }
      );
    }

    const usuario = await verificarCredenciales(nombreUsuario, contrasena);
    if (!usuario) {
      return NextResponse.json(
        { exito: false, error: 'Usuario o contraseña incorrectos' },
        { status: 401 }
      );
    }

    const respuesta = NextResponse.json({ exito: true, datos: usuario });
    respuesta.cookies.set(NOMBRE_COOKIE_SESION, await crearTokenSesion(usuario.id), {
      httpOnly: true,
      sameSite: 'lax',
      secure: process.env.NODE_ENV === 'production',
      path: '/',
      maxAge: DURACION_SESION_SEGUNDOS,
    });
    return respuesta;
  } catch (error) {
    console.error('Error al iniciar sesión:', error);
    return NextResponse.json(
      { exito: false, error: 'No se pudo iniciar sesión' },
      { status: 500 }
    );
  }
}
