import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { NOMBRE_COOKIE_SESION, verificarTokenSesion } from '@/lib/modulos/auth/sesion';

// Sin sesión válida, cualquier página redirige a /login; con sesión, /login redirige al inicio
export async function proxy(peticion: NextRequest) {
  const idUsuario = await verificarTokenSesion(peticion.cookies.get(NOMBRE_COOKIE_SESION)?.value);
  const estaEnLogin = peticion.nextUrl.pathname === '/login';

  if (!idUsuario && !estaEnLogin) {
    return NextResponse.redirect(new URL('/login', peticion.url));
  }
  if (idUsuario && estaEnLogin) {
    return NextResponse.redirect(new URL('/', peticion.url));
  }
  return NextResponse.next();
}

export const config = {
  matcher: ['/((?!api|_next/static|_next/image|favicon.ico|logo-blanco.png|logo-negro.png).*)'],
};
