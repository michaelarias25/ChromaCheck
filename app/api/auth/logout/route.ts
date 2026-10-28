import { NextResponse } from 'next/server';
import { NOMBRE_COOKIE_SESION } from '@/lib/modulos/auth/sesion';

export async function POST() {
  const respuesta = NextResponse.json({ exito: true });
  respuesta.cookies.delete(NOMBRE_COOKIE_SESION);
  return respuesta;
}
