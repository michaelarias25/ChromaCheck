'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';

// Aspecto de los elementos del encabezado: 56 px de alto, 18 px, sin mayúsculas sostenidas
export const CLASES_ELEMENTO_ENCABEZADO =
  'inline-flex h-14 items-center justify-center rounded-lg border-2 border-borde px-4 text-lg text-texto transition hover:border-texto focus-visible:outline-4 focus-visible:outline-offset-3 focus-visible:outline-accion';

const ENLACES = [
  { destino: '/', texto: 'Lotes' },
  { destino: '/historial', texto: 'Historial' },
];

// La pantalla del lote cuelga de "Lotes"; no hay más niveles
function esEnlaceActual(destino: string, ruta: string) {
  if (destino === '/') return ruta === '/' || ruta.startsWith('/lotes');
  return ruta.startsWith(destino);
}

// "Lotes" (inicio) e "Historial" (secundario). En /login no hay navegación: sin sesión no lleva a ningún lado
export default function Navegacion() {
  const ruta = usePathname();
  if (ruta === '/login') return null;

  return (
    <nav aria-label="Principal" className="flex flex-wrap items-center gap-4">
      {ENLACES.map(({ destino, texto }) => {
        const esActual = esEnlaceActual(destino, ruta);
        return (
          <Link
            key={destino}
            href={destino}
            aria-current={esActual ? 'page' : undefined}
            // El enlace actual se marca con subrayado de 4 px y negrita, no solo con color
            className={`${CLASES_ELEMENTO_ENCABEZADO} ${
              esActual ? 'border-texto font-bold underline decoration-4 underline-offset-8' : ''
            }`}
          >
            {texto}
          </Link>
        );
      })}
    </nav>
  );
}
