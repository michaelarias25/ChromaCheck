// Fondo claro u oscuro (F7): la elección vive en una cookie que lee el servidor

export type Tema = 'claro' | 'oscuro';

export const NOMBRE_COOKIE_TEMA = 'tema';

// La cookie dura 1 año
export const DURACION_COOKIE_TEMA_SEGUNDOS = 60 * 60 * 24 * 365;

// Sin cookie o con un valor desconocido, el tema es claro (decisión del 2026-11-13)
export function leerTema(valorCookie: string | undefined): Tema {
  return valorCookie === 'oscuro' ? 'oscuro' : 'claro';
}
