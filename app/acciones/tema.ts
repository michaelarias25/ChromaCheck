'use server';

import { cookies } from 'next/headers';
import { DURACION_COOKIE_TEMA_SEGUNDOS, leerTema, NOMBRE_COOKIE_TEMA } from '@/lib/tema';

// Guarda el fondo elegido en la cookie "tema" por 1 año (F7). Next.js vuelve a generar la página
// y el layout con la cookie nueva, así el servidor y el navegador quedan con el mismo tema
export async function guardarTema(temaPedido: string) {
  const tema = leerTema(temaPedido);
  (await cookies()).set(NOMBRE_COOKIE_TEMA, tema, {
    maxAge: DURACION_COOKIE_TEMA_SEGUNDOS,
    path: '/',
    sameSite: 'lax',
  });
}
