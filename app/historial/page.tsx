import type { ReactNode } from 'react';
import Link from 'next/link';
import { redirect } from 'next/navigation';
import { obtenerHistorialTarros } from '@/lib/modulos/tarros/servicio';

const TARROS_POR_PAGINA = 6;

interface FilaHistorialTarro {
  id_tarro: number;
  lote_codigo: string;
  resultado: string;
  resultado_hex: string;
  desviacion_delta_e: string | number | null;
}

// Convierte el parámetro ?pagina= en un número de página válido (1 si viene vacío o mal escrito)
function leerNumeroPagina(parametroPagina: string | string[] | undefined): number {
  const numeroPagina = Number(Array.isArray(parametroPagina) ? parametroPagina[0] : parametroPagina);
  return Number.isInteger(numeroPagina) && numeroPagina >= 1 ? numeroPagina : 1;
}

// Pantalla de historial: tabla paginada con los tarros registrados
export default async function PaginaHistorial({ searchParams }: PageProps<'/historial'>) {
  const { pagina } = await searchParams;
  const paginaActual = leerNumeroPagina(pagina);

  const { tarros, totalTarros } = await obtenerHistorialTarros(paginaActual, TARROS_POR_PAGINA);
  const totalPaginas = Math.max(1, Math.ceil(totalTarros / TARROS_POR_PAGINA));

  if (paginaActual > totalPaginas) {
    redirect(`/historial?pagina=${totalPaginas}`);
  }

  return (
    <main className="min-h-screen bg-surface text-on-surface">
      <section className="max-w-6xl mx-auto px-6 py-10">
        <h1 className="font-headline text-3xl font-bold uppercase mb-8">
          Historial de Calidad de Tarros
        </h1>

        <div className="bg-surface-container rounded-lg overflow-hidden">
          <table className="w-full text-left">
            <thead className="bg-surface-container-high text-xs uppercase text-on-surface-variant">
              <tr>
                <th className="px-5 py-4">ID de Tarro</th>
                <th className="px-5 py-4">Lote</th>
                <th className="px-5 py-4">Color Medido</th>
                <th className="px-5 py-4">ΔE</th>
                <th className="px-5 py-4">Resultado</th>
              </tr>
            </thead>
            <tbody>
              {tarros.map((tarro: FilaHistorialTarro) => (
                <FilaTarro key={tarro.id_tarro} tarro={tarro} />
              ))}
              {tarros.length === 0 && (
                <tr>
                  <td colSpan={5} className="px-5 py-8 text-center text-on-surface-variant">
                    Aún no hay tarros registrados.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        <ControlesPaginacion paginaActual={paginaActual} totalPaginas={totalPaginas} />
      </section>
    </main>
  );
}

// Botones de página anterior y siguiente, con el indicador de página actual
function ControlesPaginacion({
  paginaActual,
  totalPaginas,
}: {
  paginaActual: number;
  totalPaginas: number;
}) {
  const tienePaginaAnterior = paginaActual > 1;
  const tienePaginaSiguiente = paginaActual < totalPaginas;

  return (
    <nav className="mt-6 flex items-center justify-between" aria-label="Paginación del historial">
      <BotonPaginacion
        destino={`/historial?pagina=${paginaActual - 1}`}
        estaHabilitado={tienePaginaAnterior}
      >
        Anterior
      </BotonPaginacion>

      <span className="text-sm text-on-surface-variant uppercase">
        Página {paginaActual} de {totalPaginas}
      </span>

      <BotonPaginacion
        destino={`/historial?pagina=${paginaActual + 1}`}
        estaHabilitado={tienePaginaSiguiente}
      >
        Siguiente
      </BotonPaginacion>
    </nav>
  );
}

// Un botón de paginación; si no hay página a la cual ir se muestra deshabilitado
function BotonPaginacion({
  destino,
  estaHabilitado,
  children,
}: {
  destino: string;
  estaHabilitado: boolean;
  children: ReactNode;
}) {
  const clasesBase =
    'px-4 h-9 flex items-center justify-center rounded font-headline text-xs uppercase tracking-wider';

  if (!estaHabilitado) {
    return (
      <span
        className={`${clasesBase} bg-surface-container text-on-surface-variant opacity-50 cursor-not-allowed`}
        aria-disabled="true"
      >
        {children}
      </span>
    );
  }

  return (
    <Link
      href={destino}
      className={`${clasesBase} bg-surface-container-high text-on-surface transition hover:bg-surface-container-highest`}
    >
      {children}
    </Link>
  );
}

// Una fila individual del historial
function FilaTarro({ tarro }: { tarro: FilaHistorialTarro }) {
  const esAprobado = tarro.resultado === 'Aprobado';

  return (
    <tr className="border-t border-surface-container-highest">
      <td className="px-5 py-4">#TR-{tarro.id_tarro}</td>
      <td className="px-5 py-4">{tarro.lote_codigo}</td>
      <td className="px-5 py-4">
        <div className="flex items-center gap-2">
          <span
            className="w-6 h-6 rounded"
            style={{ backgroundColor: tarro.resultado_hex }}
          />
          {tarro.resultado_hex}
        </div>
      </td>
      <td className="px-5 py-4 text-xl font-bold">{tarro.desviacion_delta_e}</td>
      <td className="px-5 py-4">
        <span
          className={`px-3 py-1 rounded text-xs uppercase font-bold ${
            esAprobado
              ? 'bg-secondary-container text-secondary-fixed'
              : 'bg-primary-container text-on-primary-container'
          }`}
        >
          {tarro.resultado}
        </span>
      </td>
    </tr>
  );
}