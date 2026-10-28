import type { ReactNode } from 'react';
import Form from 'next/form';
import Link from 'next/link';
import { redirect } from 'next/navigation';
import { obtenerLotes } from '@/lib/modulos/lotes/servicio';
import {
  obtenerHistorialTarros,
  type FiltrosHistorialTarros,
} from '@/lib/modulos/tarros/servicio';

const TARROS_POR_PAGINA = 6;
const RESULTADOS_TARRO = ['Aprobado', 'No Aprobado'];
const PATRON_ID_TARRO = /^#?(?:TR-)?(\d+)$/i;
const PATRON_FECHA = /^\d{4}-\d{2}-\d{2}$/;

interface FilaHistorialTarro {
  id_tarro: number;
  lote_codigo: string;
  resultado: string;
  resultado_hex: string;
  desviacion_delta_e: string | number | null;
}

interface LoteOpcion {
  id: number;
  codigo: string;
}

// Valores de los filtros tal como vienen en la URL, para rellenar el formulario y armar enlaces
interface ValoresFiltro {
  tarro: string;
  lote: string;
  resultado: string;
  desde: string;
  hasta: string;
}

type ParametroUrl = string | string[] | undefined;

// Toma el primer valor de un parámetro de la URL, sin espacios sobrantes
function leerTextoParametro(parametro: ParametroUrl): string {
  const valor = Array.isArray(parametro) ? parametro[0] : parametro;
  return (valor ?? '').trim();
}

// Convierte el parámetro ?pagina= en un número de página válido (1 si viene vacío o mal escrito)
function leerNumeroPagina(parametroPagina: ParametroUrl): number {
  const numeroPagina = Number(leerTextoParametro(parametroPagina));
  return Number.isInteger(numeroPagina) && numeroPagina >= 1 ? numeroPagina : 1;
}

// Indica si el texto es una fecha AAAA-MM-DD que existe en el calendario
function esFechaValida(texto: string): boolean {
  if (!PATRON_FECHA.test(texto)) return false;
  const fecha = new Date(`${texto}T00:00:00Z`);
  return !Number.isNaN(fecha.getTime()) && fecha.toISOString().startsWith(texto);
}

// Convierte los valores de la URL en filtros para la consulta; los valores inválidos se ignoran
// y se devuelven como avisos para mostrarlos al usuario
function construirFiltros(valores: ValoresFiltro) {
  const filtros: FiltrosHistorialTarros = {};
  const avisos: string[] = [];

  if (valores.tarro) {
    const coincidenciaId = PATRON_ID_TARRO.exec(valores.tarro);
    if (coincidenciaId) filtros.idTarro = Number(coincidenciaId[1]);
    else avisos.push('El ID de tarro debe escribirse como TR-12 o 12.');
  }
  if (valores.lote) {
    const loteId = Number(valores.lote);
    if (Number.isInteger(loteId) && loteId > 0) filtros.loteId = loteId;
  }
  if (RESULTADOS_TARRO.includes(valores.resultado)) {
    filtros.resultado = valores.resultado;
  }
  if (valores.desde) {
    if (esFechaValida(valores.desde)) filtros.fechaDesde = valores.desde;
    else avisos.push('La fecha "desde" no es válida.');
  }
  if (valores.hasta) {
    if (esFechaValida(valores.hasta)) filtros.fechaHasta = valores.hasta;
    else avisos.push('La fecha "hasta" no es válida.');
  }

  return { filtros, avisos };
}

// Arma la URL del historial conservando los filtros activos
function construirUrlHistorial(valores: ValoresFiltro, pagina: number): string {
  const parametros = new URLSearchParams();
  for (const [nombre, valor] of Object.entries(valores)) {
    if (valor) parametros.set(nombre, valor);
  }
  if (pagina > 1) parametros.set('pagina', String(pagina));
  const consulta = parametros.toString();
  return consulta ? `/historial?${consulta}` : '/historial';
}

// Pantalla de historial: tabla paginada y filtrable con los tarros registrados
export default async function PaginaHistorial({ searchParams }: PageProps<'/historial'>) {
  const parametros = await searchParams;
  const paginaActual = leerNumeroPagina(parametros.pagina);
  const valoresFiltro: ValoresFiltro = {
    tarro: leerTextoParametro(parametros.tarro),
    lote: leerTextoParametro(parametros.lote),
    resultado: leerTextoParametro(parametros.resultado),
    desde: leerTextoParametro(parametros.desde),
    hasta: leerTextoParametro(parametros.hasta),
  };
  const { filtros, avisos } = construirFiltros(valoresFiltro);
  const hayFiltrosActivos = Object.keys(filtros).length > 0;

  const [{ tarros, totalTarros }, lotes] = await Promise.all([
    obtenerHistorialTarros(paginaActual, TARROS_POR_PAGINA, filtros),
    obtenerLotes(),
  ]);
  const totalPaginas = Math.max(1, Math.ceil(totalTarros / TARROS_POR_PAGINA));

  if (paginaActual > totalPaginas) {
    redirect(construirUrlHistorial(valoresFiltro, totalPaginas));
  }

  return (
    <main className="min-h-screen bg-surface text-on-surface">
      <section className="max-w-6xl mx-auto px-6 py-10">
        <h1 className="font-headline text-3xl font-bold uppercase mb-8">
          Historial de Calidad de Tarros
        </h1>

        <FormularioFiltros
          key={construirUrlHistorial(valoresFiltro, 1)}
          valores={valoresFiltro}
          lotes={lotes}
        />

        {avisos.length > 0 && (
          <ul className="mb-4 space-y-1 text-sm text-primary">
            {avisos.map((aviso) => (
              <li key={aviso}>{aviso}</li>
            ))}
          </ul>
        )}

        <p className="mb-3 text-sm text-on-surface-variant">
          {totalTarros === 1 ? '1 tarro encontrado' : `${totalTarros} tarros encontrados`}
        </p>

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
                    {hayFiltrosActivos
                      ? 'Ningún tarro coincide con los filtros.'
                      : 'Aún no hay tarros registrados.'}
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        <ControlesPaginacion
          paginaActual={paginaActual}
          totalPaginas={totalPaginas}
          valoresFiltro={valoresFiltro}
        />
      </section>
    </main>
  );
}

// Formulario de filtros; al enviarlo, Form de Next.js navega a /historial con los valores en la URL
function FormularioFiltros({ valores, lotes }: { valores: ValoresFiltro; lotes: LoteOpcion[] }) {
  const clasesCampo =
    'h-10 w-full rounded bg-surface-container-high px-3 text-sm text-on-surface border border-surface-container-highest focus:outline-none focus:border-outline';
  const clasesEtiqueta = 'flex flex-col gap-1 text-xs uppercase text-on-surface-variant';

  return (
    <Form
      action="/historial"
      className="mb-6 grid grid-cols-1 gap-4 rounded-lg bg-surface-container p-5 sm:grid-cols-2 lg:grid-cols-6"
    >
      <label className={clasesEtiqueta}>
        ID de tarro
        <input
          name="tarro"
          defaultValue={valores.tarro}
          placeholder="TR-12"
          className={clasesCampo}
        />
      </label>

      <label className={clasesEtiqueta}>
        Lote
        <select name="lote" defaultValue={valores.lote} className={clasesCampo}>
          <option value="">Todos</option>
          {lotes.map((lote) => (
            <option key={lote.id} value={lote.id}>
              {lote.codigo}
            </option>
          ))}
        </select>
      </label>

      <label className={clasesEtiqueta}>
        Resultado
        <select name="resultado" defaultValue={valores.resultado} className={clasesCampo}>
          <option value="">Todos</option>
          {RESULTADOS_TARRO.map((resultado) => (
            <option key={resultado} value={resultado}>
              {resultado}
            </option>
          ))}
        </select>
      </label>

      <label className={clasesEtiqueta}>
        Desde
        <input type="date" name="desde" defaultValue={valores.desde} className={clasesCampo} />
      </label>

      <label className={clasesEtiqueta}>
        Hasta
        <input type="date" name="hasta" defaultValue={valores.hasta} className={clasesCampo} />
      </label>

      <div className="flex items-end gap-2">
        <button
          type="submit"
          className="h-10 flex-1 rounded bg-primary-container px-4 font-headline text-xs uppercase tracking-wider text-on-primary-container transition hover:opacity-90"
        >
          Filtrar
        </button>
        <Link
          href="/historial"
          className="h-10 flex items-center rounded bg-surface-container-high px-4 font-headline text-xs uppercase tracking-wider text-on-surface-variant transition hover:bg-surface-container-highest"
        >
          Limpiar
        </Link>
      </div>
    </Form>
  );
}

// Botones de página anterior y siguiente, con el indicador de página actual
function ControlesPaginacion({
  paginaActual,
  totalPaginas,
  valoresFiltro,
}: {
  paginaActual: number;
  totalPaginas: number;
  valoresFiltro: ValoresFiltro;
}) {
  const tienePaginaAnterior = paginaActual > 1;
  const tienePaginaSiguiente = paginaActual < totalPaginas;

  return (
    <nav className="mt-6 flex items-center justify-between" aria-label="Paginación del historial">
      <BotonPaginacion
        destino={construirUrlHistorial(valoresFiltro, paginaActual - 1)}
        estaHabilitado={tienePaginaAnterior}
      >
        Anterior
      </BotonPaginacion>

      <span className="text-sm text-on-surface-variant uppercase">
        Página {paginaActual} de {totalPaginas}
      </span>

      <BotonPaginacion
        destino={construirUrlHistorial(valoresFiltro, paginaActual + 1)}
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