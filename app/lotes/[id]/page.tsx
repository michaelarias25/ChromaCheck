import type { ReactNode } from 'react';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import ControlCaptura from '@/app/componentes/ControlCaptura';
import CuadroColor from '@/app/componentes/CuadroColor';
import InsigniaResultado from '@/app/componentes/InsigniaResultado';
import { formatearDeltaE, formatearFechaHora } from '@/lib/formato';
import type { Alerta } from '@/lib/modulos/alertas/repositorio';
import { obtenerAlertasDeLote } from '@/lib/modulos/alertas/servicio';
import { obtenerCapturaActiva, obtenerLotePorId } from '@/lib/modulos/lotes/servicio';
import {
  obtenerLecturasRecientesDeLote,
  obtenerMuestraDeLote,
} from '@/lib/modulos/tarros/servicio';
import type { Tarro } from '@/lib/modulos/tarros/repositorio';

const CANTIDAD_LECTURAS_RECIENTES = 8;

type AlertaLote = Alerta;

// Pantalla del lote: estado del sensor, comparación de colores, últimas lecturas y alertas
export default async function PaginaLote({ params }: PageProps<'/lotes/[id]'>) {
  const { id } = await params;
  const { lote, muestra, lecturasRecientes, alertas, capturaActiva } = await cargarDatosLote(id);

  // Las alertas vienen de la más reciente a la más antigua: la primera roja es la que pausó el lote
  const alertaQuePauso = alertas.find((alerta) => alerta.nivel === 'Roja');
  // Solo interesa la captura activa si es de otro lote: la de este lote ya está en lote.modo_captura
  const capturaDeOtroLote = capturaActiva?.loteId !== lote.id ? capturaActiva : null;

  return (
    <main className="flex-1 bg-fondo text-texto">
      <section className="mx-auto max-w-300 space-y-6 px-4 py-10 sm:px-8">
        <div>
          <Link
            href="/"
            className="inline-flex h-14 items-center text-lg text-accion underline underline-offset-4 focus-visible:outline-4 focus-visible:outline-offset-3 focus-visible:outline-accion"
          >
            ← Volver a lotes
          </Link>
          <h1 className="text-3xl font-bold break-all">Lote {lote.codigo}</h1>
          <p className="mt-1 text-lg text-texto-secundario">
            {lote.estado}. {muestra ? 'Muestra patrón registrada.' : 'Sin muestra patrón.'}
          </p>
        </div>

        {lote.estado === 'Pausado' && <AvisoLotePausado alertaQuePauso={alertaQuePauso} />}

        {/* Acción principal de la pantalla, debajo del título */}
        <ControlCaptura
          loteId={lote.id}
          estado={lote.estado}
          modoCaptura={lote.modo_captura}
          tieneMuestra={Boolean(muestra)}
          capturaDeOtroLote={capturaDeOtroLote}
        />

        <ComparacionColores muestra={muestra} ultimoTarro={lecturasRecientes[0]} />
        <TablaLecturasRecientes lecturas={lecturasRecientes} />
        <ListaAlertas alertas={alertas} />
      </section>
    </main>
  );
}

// Consulta todo lo que muestra la pantalla. Responde 404 si el id no es válido o el lote no existe
async function cargarDatosLote(id: string) {
  const loteId = Number(id);
  // Un id que no es un entero positivo no puede ser un lote: se responde 404 sin consultar la base
  if (!Number.isInteger(loteId) || loteId < 1) {
    notFound();
  }

  const [lote, muestra, lecturasRecientes, alertas, capturaActiva] = await Promise.all([
    obtenerLotePorId(loteId),
    obtenerMuestraDeLote(loteId),
    obtenerLecturasRecientesDeLote(loteId, CANTIDAD_LECTURAS_RECIENTES),
    obtenerAlertasDeLote(loteId),
    obtenerCapturaActiva(),
  ]);

  if (!lote) {
    notFound();
  }
  return { lote, muestra, lecturasRecientes, alertas, capturaActiva };
}

// Recuadro con título de sección; bordes en lugar de sombras
function Recuadro({ titulo, children }: { titulo: string; children: ReactNode }) {
  return (
    <section className="overflow-hidden rounded-lg border-2 border-borde bg-superficie">
      <h2 className="border-b-2 border-borde px-5 py-4 text-2xl font-bold">{titulo}</h2>
      {children}
    </section>
  );
}

// Comparación del color de la muestra patrón con el del último tarro leído
function ComparacionColores({
  muestra,
  ultimoTarro,
}: {
  muestra: Tarro | null;
  ultimoTarro: Tarro | undefined;
}) {
  return (
    <Recuadro titulo="Comparación de colores">
      <div className="grid grid-cols-1 gap-6 p-5 sm:grid-cols-2">
        <div className="space-y-2">
          <p className="text-base font-bold">Muestra patrón</p>
          <CuadroColor hex={muestra?.resultado_hex ?? null} textoSinColor="Sin muestra patrón" />
        </div>
        <div className="space-y-2">
          <p className="text-base font-bold">Último tarro</p>
          <CuadroColor
            hex={ultimoTarro?.resultado_hex ?? null}
            textoSinColor="Todavía no hay tarros revisados"
          />
          {ultimoTarro && (
            <div className="flex flex-wrap items-center gap-4">
              <InsigniaResultado
                resultado={ultimoTarro.resultado}
                desviacionDeltaE={ultimoTarro.desviacion_delta_e}
              />
              <p className="text-lg tabular-nums">
                Diferencia de color: {formatearDeltaE(ultimoTarro.desviacion_delta_e)} ΔE
              </p>
            </div>
          )}
        </div>
      </div>
    </Recuadro>
  );
}

// Tabla con las últimas lecturas del lote, de la más reciente a la más antigua
function TablaLecturasRecientes({ lecturas }: { lecturas: Tarro[] }) {
  return (
    <Recuadro titulo="Últimas lecturas del lote">
      {/* En pantallas angostas la tabla se desplaza dentro de su recuadro, no la página */}
      <div className="overflow-x-auto">
        <table className="w-full text-left text-lg">
          <thead className="border-b-2 border-borde text-base font-bold">
            <tr>
              <th className="px-5 py-3">Tarro</th>
              <th className="px-5 py-3">Color</th>
              <th className="px-5 py-3">Diferencia de color (ΔE)</th>
              <th className="px-5 py-3">Hora</th>
              <th className="px-5 py-3">Resultado</th>
            </tr>
          </thead>
          <tbody>
            {lecturas.map((tarro) => (
              <tr key={tarro.id_tarro} className="border-t-2 border-borde first:border-t-0">
                <td className="px-5 py-3">#TR-{tarro.id_tarro}</td>
                <td className="px-5 py-3">
                  <CuadroColor hex={tarro.resultado_hex} tamano="pequeno" />
                </td>
                <td className="px-5 py-3 font-bold tabular-nums">
                  {formatearDeltaE(tarro.desviacion_delta_e)}
                </td>
                <td className="px-5 py-3">
                  {new Date(tarro.timestamp).toLocaleTimeString('es-CO')}
                </td>
                <td className="px-5 py-3">
                  <InsigniaResultado
                    resultado={tarro.resultado}
                    desviacionDeltaE={tarro.desviacion_delta_e}
                  />
                </td>
              </tr>
            ))}
            {lecturas.length === 0 && (
              <tr>
                <td colSpan={5} className="px-5 py-6 text-center text-texto-secundario">
                  Todavía no hay lecturas en este lote.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </Recuadro>
  );
}

// Aviso visible cuando el lote está pausado, con el motivo (la alerta roja que lo pausó)
function AvisoLotePausado({ alertaQuePauso }: { alertaQuePauso: AlertaLote | undefined }) {
  return (
    <div role="alert" className="space-y-2 rounded-lg bg-peligro p-5 text-texto-sobre-peligro">
      <p className="text-2xl font-bold">
        <span aria-hidden="true">⚠ </span>Lote pausado: no acepta lecturas
      </p>
      {alertaQuePauso ? (
        <p className="text-lg">
          Motivo: {alertaQuePauso.mensaje}. Alerta roja del{' '}
          {formatearFechaHora(alertaQuePauso.timestamp)}
        </p>
      ) : (
        <p className="text-lg">Motivo: alerta roja por desviación acumulativa de color.</p>
      )}
    </div>
  );
}

const ESTILOS_NIVEL_ALERTA: Record<AlertaLote['nivel'], { texto: string; clases: string }> = {
  Roja: {
    texto: 'Alerta roja',
    clases: 'bg-peligro text-texto-sobre-peligro border-peligro',
  },
  Amarilla: {
    texto: 'Alerta amarilla',
    clases: 'bg-alerta-suave text-texto-sobre-alerta-suave border-alerta',
  },
};

// Lista de alertas del lote, de la más reciente a la más antigua
function ListaAlertas({ alertas }: { alertas: AlertaLote[] }) {
  return (
    <Recuadro titulo="Alertas del lote">
      {alertas.length === 0 ? (
        <p className="px-5 py-6 text-center text-lg text-texto-secundario">
          Este lote no tiene alertas.
        </p>
      ) : (
        <ul>
          {alertas.map((alerta) => {
            // Un nivel desconocido se muestra con su texto tal cual, sin color
            const estilo = ESTILOS_NIVEL_ALERTA[alerta.nivel] ?? {
              texto: `Alerta ${alerta.nivel}`,
              clases: 'bg-superficie text-texto border-borde',
            };
            return (
              <li
                key={alerta.id}
                className="flex flex-wrap items-center gap-x-4 gap-y-2 border-t-2 border-borde px-5 py-4 text-lg first:border-t-0"
              >
                <span
                  className={`rounded-lg border-2 px-3 py-1 font-bold whitespace-nowrap ${estilo.clases}`}
                >
                  <span aria-hidden="true">⚠ </span>
                  {estilo.texto}
                </span>
                <span className="min-w-48 flex-1">{alerta.mensaje}</span>
                <time
                  dateTime={new Date(alerta.timestamp).toISOString()}
                  className="text-base whitespace-nowrap text-texto-secundario"
                >
                  {formatearFechaHora(alerta.timestamp)}
                </time>
              </li>
            );
          })}
        </ul>
      )}
    </Recuadro>
  );
}
