'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';

// Aspecto de los elementos del encabezado: 56 px de alto, 18 px, sin mayúsculas sostenidas.
// Los colores van aparte para que un elemento nunca lleve dos clases de color que compitan
export const CLASES_BASE_ENCABEZADO =
  'inline-flex h-14 items-center justify-center rounded-lg border-2 px-4 text-lg transition focus-visible:outline-4 focus-visible:outline-offset-3 focus-visible:outline-accion';

export const CLASES_ELEMENTO_ENCABEZADO = `${CLASES_BASE_ENCABEZADO} border-borde text-texto hover:border-texto`;

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
            className={
              esActual
                ? `${CLASES_BASE_ENCABEZADO} border-texto text-texto font-bold underline decoration-4 underline-offset-8`
                : CLASES_ELEMENTO_ENCABEZADO
            }
          >
            {texto}
          </Link>
        );
      })}
    </nav>
  );
}
