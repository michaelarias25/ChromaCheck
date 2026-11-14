import Link from 'next/link';
import { notFound } from 'next/navigation';
import ControlCaptura from '@/app/componentes/ControlCaptura';
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
const COLOR_SIN_DATOS = '#555';

type AlertaLote = Alerta;

// Pantalla de monitoreo: detalle en vivo de un lote específico
export default async function PaginaLote({ params }: PageProps<'/lotes/[id]'>) {
  const { id } = await params;
  const { lote, muestra, lecturasRecientes, alertas, capturaActiva } = await cargarDatosLote(id);

  // Las alertas vienen de la más reciente a la más antigua: la primera roja es la que pausó el lote
  const alertaQuePauso = alertas.find((alerta) => alerta.nivel === 'Roja');
  // Solo interesa la captura activa si es de otro lote: la de este lote ya está en lote.modo_captura
  const capturaDeOtroLote = capturaActiva?.loteId !== lote.id ? capturaActiva : null;

  return (
    <main className="min-h-screen bg-surface text-on-surface">
      <section className="max-w-6xl mx-auto px-6 py-10 space-y-6">
        <div>
          <Link
            href="/"
            className="inline-flex h-14 items-center text-lg underline underline-offset-4 focus-visible:outline-4 focus-visible:outline-offset-3 focus-visible:outline-accion"
          >
            ← Volver a lotes
          </Link>
          <h1 className="font-headline text-3xl font-bold uppercase">Lote {lote.codigo}</h1>
          <span className="text-on-surface-variant text-sm uppercase">{lote.estado}</span>
        </div>

        {lote.estado === 'Pausado' && <AvisoLotePausado alertaQuePauso={alertaQuePauso} />}

        <ControlCaptura
          loteId={lote.id}
          estado={lote.estado}
          modoCaptura={lote.modo_captura}
          tieneMuestra={Boolean(muestra)}
          capturaDeOtroLote={capturaDeOtroLote}
        />

        <ComparativaColores muestra={muestra} ultimoTarro={lecturasRecientes[0]} />
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

// Comparativa del color de la muestra patrón con el del último tarro leído
function ComparativaColores({
  muestra,
  ultimoTarro,
}: {
  muestra: Tarro | null;
  ultimoTarro: Tarro | undefined;
}) {
  return (
    <div className="grid grid-cols-2 gap-4 bg-surface-container rounded-lg overflow-hidden">
      <div>
        <div className="bg-surface-container-high px-4 py-2 text-xs uppercase">Muestra Patrón</div>
        <div
          className="h-40 flex items-end p-3"
          style={{ backgroundColor: muestra?.resultado_hex || COLOR_SIN_DATOS }}
        >
          <span className="bg-surface-container-lowest/80 px-2 py-1 rounded text-xs">
            {muestra ? `Ref. ${muestra.resultado_hex}` : 'Sin muestra registrada'}
          </span>
        </div>
      </div>
      <div>
        <div className="bg-surface-container-high px-4 py-2 text-xs uppercase">
          Último Tarro Leído
        </div>
        <div
          className="h-40 flex items-end justify-between p-3"
          style={{ backgroundColor: ultimoTarro?.resultado_hex || COLOR_SIN_DATOS }}
        >
          {ultimoTarro && (
            <>
              <span className="bg-surface-container-lowest/80 px-2 py-1 rounded text-xs tabular-nums">
                ΔE {formatearDeltaE(ultimoTarro.desviacion_delta_e)}
              </span>
              <InsigniaResultado
                resultado={ultimoTarro.resultado}
                desviacionDeltaE={ultimoTarro.desviacion_delta_e}
              />
            </>
          )}
        </div>
      </div>
    </div>
  );
}

// Tabla con las últimas lecturas del lote, de la más reciente a la más antigua
function TablaLecturasRecientes({ lecturas }: { lecturas: Tarro[] }) {
  return (
    <div className="bg-surface-container rounded-lg overflow-hidden">
      <div className="bg-surface-container-high px-4 py-3 text-xs uppercase">
        Historial Reciente del Lote
      </div>
      <table className="w-full text-left">
        <thead className="text-xs uppercase text-on-surface-variant">
          <tr>
            <th className="px-5 py-3">ID de Tarro</th>
            <th className="px-5 py-3">ΔE</th>
            <th className="px-5 py-3">Hora</th>
            <th className="px-5 py-3">Dictamen</th>
          </tr>
        </thead>
        <tbody>
          {lecturas.map((tarro) => (
            <tr key={tarro.id_tarro} className="border-t border-surface-container-highest">
              <td className="px-5 py-3">#TR-{tarro.id_tarro}</td>
              <td className="px-5 py-3 font-bold tabular-nums">
                {formatearDeltaE(tarro.desviacion_delta_e)}
              </td>
              <td className="px-5 py-3">{new Date(tarro.timestamp).toLocaleTimeString('es-CO')}</td>
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
              <td colSpan={4} className="px-5 py-6 text-center text-on-surface-variant">
                Aún no hay lecturas en este lote.
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );
}

// Aviso visible cuando el lote está pausado, con el motivo (la alerta roja que lo pausó)
function AvisoLotePausado({ alertaQuePauso }: { alertaQuePauso: AlertaLote | undefined }) {
  return (
    <div
      role="alert"
      className="bg-primary-container text-on-primary-container rounded-lg p-5 space-y-1"
    >
      <p className="font-headline text-lg font-bold uppercase">
        <span aria-hidden="true">⚠ </span>Lote pausado: no acepta lecturas
      </p>
      {alertaQuePauso ? (
        <p className="text-sm">
          Motivo: {alertaQuePauso.mensaje}. Alerta roja del{' '}
          {formatearFechaHora(alertaQuePauso.timestamp)}
        </p>
      ) : (
        <p className="text-sm">Motivo: alerta roja por desviación acumulativa de color.</p>
      )}
    </div>
  );
}

const ESTILOS_NIVEL_ALERTA: Record<AlertaLote['nivel'], { texto: string; clases: string }> = {
  Roja: { texto: 'Alerta roja', clases: 'bg-primary-container text-on-primary-container' },
  Amarilla: {
    texto: 'Alerta amarilla',
    clases: 'bg-tertiary-container text-on-tertiary-container',
  },
};

// Lista de alertas del lote, de la más reciente a la más antigua
function ListaAlertas({ alertas }: { alertas: AlertaLote[] }) {
  return (
    <div className="bg-surface-container rounded-lg overflow-hidden">
      <h2 className="bg-surface-container-high px-4 py-3 text-xs uppercase">Alertas del Lote</h2>

      {alertas.length === 0 ? (
        <p className="px-5 py-6 text-center text-on-surface-variant">Sin alertas</p>
      ) : (
        <ul>
          {alertas.map((alerta) => {
            // Un nivel desconocido se muestra con su texto tal cual, sin color
            const estilo = ESTILOS_NIVEL_ALERTA[alerta.nivel] ?? {
              texto: `Alerta ${alerta.nivel}`,
              clases: 'bg-surface-container-highest text-on-surface',
            };
            return (
              <li
                key={alerta.id}
                className="px-5 py-4 border-t border-surface-container-highest first:border-t-0 flex flex-wrap items-center gap-x-4 gap-y-2"
              >
                <span
                  className={`px-3 py-1 rounded text-xs uppercase font-bold whitespace-nowrap ${estilo.clases}`}
                >
                  {estilo.texto}
                </span>
                <span className="flex-1 min-w-48">{alerta.mensaje}</span>
                <time
                  dateTime={new Date(alerta.timestamp).toISOString()}
                  className="text-sm text-on-surface-variant whitespace-nowrap"
                >
                  {formatearFechaHora(alerta.timestamp)}
                </time>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
