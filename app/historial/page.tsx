import type { ReactNode } from 'react';
import Link from 'next/link';
import { redirect } from 'next/navigation';
import { formatearDeltaE } from '@/lib/formato';
import { obtenerHistorialTarros } from '@/lib/modulos/tarros/servicio';
import { obtenerClasesBoton } from '../componentes/Boton';
import CuadroColor from '../componentes/CuadroColor';
import InsigniaResultado from '../componentes/InsigniaResultado';

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
  const numeroPagina = Number(
    Array.isArray(parametroPagina) ? parametroPagina[0] : parametroPagina
  );
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
    <main className="flex-1 bg-fondo text-texto">
      <section className="mx-auto max-w-300 space-y-6 px-4 py-10 sm:px-8">
        <h1 className="text-3xl font-bold">Historial de tarros</h1>

        {/* En pantallas angostas la tabla se desplaza dentro de su recuadro, no la página */}
        <div className="overflow-x-auto rounded-lg border-2 border-borde bg-superficie">
          <table className="w-full text-left text-lg">
            <thead className="border-b-2 border-borde text-base font-bold">
              <tr>
                <th className="px-5 py-4">Tarro</th>
                <th className="px-5 py-4">Lote</th>
                <th className="px-5 py-4">Color medido</th>
                <th className="px-5 py-4">Diferencia de color (ΔE)</th>
                <th className="px-5 py-4">Resultado</th>
              </tr>
            </thead>
            <tbody>
              {tarros.map((tarro: FilaHistorialTarro) => (
                <FilaTarro key={tarro.id_tarro} tarro={tarro} />
              ))}
              {tarros.length === 0 && (
                <tr>
                  <td colSpan={5} className="px-5 py-8 text-center text-texto-secundario">
                    Todavía no hay tarros revisados.
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
    <nav
      className="flex flex-wrap items-center justify-between gap-4"
      aria-label="Paginación del historial"
    >
      <BotonPaginacion
        destino={`/historial?pagina=${paginaActual - 1}`}
        estaHabilitado={tienePaginaAnterior}
      >
        ← Página anterior
      </BotonPaginacion>

      <span className="text-lg">
        Página {paginaActual} de {totalPaginas}
      </span>

      <BotonPaginacion
        destino={`/historial?pagina=${paginaActual + 1}`}
        estaHabilitado={tienePaginaSiguiente}
      >
        Página siguiente →
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
  const clases = obtenerClasesBoton({ variante: 'secundario' });

  if (!estaHabilitado) {
    return (
      <span className={`${clases} cursor-not-allowed opacity-60`} aria-disabled="true">
        {children}
      </span>
    );
  }

  return (
    <Link href={destino} className={clases}>
      {children}
    </Link>
  );
}

// Una fila individual del historial
function FilaTarro({ tarro }: { tarro: FilaHistorialTarro }) {
  return (
    <tr className="border-t-2 border-borde first:border-t-0">
      <td className="px-5 py-4">#TR-{tarro.id_tarro}</td>
      <td className="px-5 py-4">{tarro.lote_codigo}</td>
      <td className="px-5 py-4">
        <CuadroColor hex={tarro.resultado_hex} tamano="pequeno" />
      </td>
      <td className="px-5 py-4 font-bold tabular-nums">
        {formatearDeltaE(tarro.desviacion_delta_e)}
      </td>
      <td className="px-5 py-4">
        <InsigniaResultado
          resultado={tarro.resultado}
          desviacionDeltaE={tarro.desviacion_delta_e}
        />
      </td>
    </tr>
  );
}
