'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import type { ModoCaptura } from '@/lib/modulos/lotes/reglas';

// Cada cuánto se vuelve a consultar la página mientras el lote está capturando
const INTERVALO_REFRESCO_MS = 3000;

interface CapturaDeOtroLote {
  loteId: number;
  codigo: string;
  modo: ModoCaptura;
}

interface PropiedadesControlCaptura {
  loteId: number;
  estado: string;
  modoCaptura: ModoCaptura;
  tieneMuestra: boolean;
  capturaDeOtroLote: CapturaDeOtroLote | null;
}

// Botones para decidir si el sensor registra la muestra o recolecta lecturas para este lote
export default function ControlCaptura({
  loteId,
  estado,
  modoCaptura,
  tieneMuestra,
  capturaDeOtroLote,
}: PropiedadesControlCaptura) {
  const router = useRouter();
  const [mensajeError, setMensajeError] = useState('');
  const [estaEnviando, setEstaEnviando] = useState(false);

  const estaCapturando = modoCaptura !== 'Inactivo';

  // Mientras el sensor captura para este lote, refresca la página para ver la muestra,
  // las lecturas y las alertas nuevas que envía el puente serial
  useEffect(() => {
    if (!estaCapturando) return;
    const intervalo = setInterval(() => router.refresh(), INTERVALO_REFRESCO_MS);
    return () => clearInterval(intervalo);
  }, [estaCapturando, router]);

  async function cambiarModo(modo: ModoCaptura) {
    setMensajeError('');
    setEstaEnviando(true);

    try {
      const respuesta = await fetch(`/api/lotes/${loteId}/captura`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ modo }),
      });
      const resultado = await respuesta.json();

      if (!resultado.exito) {
        setMensajeError(resultado.error);
        return;
      }
      router.refresh();
    } catch {
      setMensajeError('No se pudo conectar con el servidor');
    } finally {
      setEstaEnviando(false);
    }
  }

  // Un lote pausado no puede capturar: el aviso de pausa ya explica el motivo
  if (estado !== 'Activo') return null;

  return (
    <div className="bg-surface-container rounded-lg overflow-hidden">
      <h2 className="bg-surface-container-high px-4 py-3 text-xs uppercase">Captura del Sensor</h2>

      <div className="p-5 space-y-4">
        <ContenidoCaptura
          modoCaptura={modoCaptura}
          tieneMuestra={tieneMuestra}
          capturaDeOtroLote={capturaDeOtroLote}
          estaEnviando={estaEnviando}
          cambiarModo={cambiarModo}
        />

        {mensajeError && (
          <p role="alert" className="text-sm text-primary">
            <span aria-hidden="true">⚠ </span>
            {mensajeError}
          </p>
        )}
      </div>
    </div>
  );
}

// Elige el indicador y los botones según el modo del lote y si el sensor está libre
function ContenidoCaptura({
  modoCaptura,
  tieneMuestra,
  capturaDeOtroLote,
  estaEnviando,
  cambiarModo,
}: {
  modoCaptura: ModoCaptura;
  tieneMuestra: boolean;
  capturaDeOtroLote: CapturaDeOtroLote | null;
  estaEnviando: boolean;
  cambiarModo: (modo: ModoCaptura) => void;
}) {
  if (modoCaptura === 'Muestra') {
    return (
      <>
        <IndicadorEstado texto="Esperando la muestra" estaActivo />
        <p className="font-headline text-lg">Coloca el tarro muestra frente al sensor</p>
        <BotonCaptura
          texto="Cancelar"
          esSecundario
          estaDeshabilitado={estaEnviando}
          alPulsar={() => cambiarModo('Inactivo')}
        />
      </>
    );
  }

  if (modoCaptura === 'Recoleccion') {
    return (
      <>
        <IndicadorEstado texto="Recolectando lecturas" estaActivo />
        <BotonCaptura
          texto="Detener recolección"
          esSecundario
          estaDeshabilitado={estaEnviando}
          alPulsar={() => cambiarModo('Inactivo')}
        />
      </>
    );
  }

  // Modo Inactivo
  const textoEstado = tieneMuestra ? 'Detenido' : 'Sin muestra registrada';

  if (capturaDeOtroLote) {
    return (
      <>
        <IndicadorEstado texto={textoEstado} estaActivo={false} />
        <p className="text-sm">
          El sensor está ocupado: el lote{' '}
          <Link
            href={`/lotes/${capturaDeOtroLote.loteId}`}
            className="font-bold underline underline-offset-2"
          >
            {capturaDeOtroLote.codigo}
          </Link>{' '}
          está capturando en modo {capturaDeOtroLote.modo}. Detén esa captura para usar el sensor en
          este lote.
        </p>
      </>
    );
  }

  return (
    <>
      <IndicadorEstado texto={textoEstado} estaActivo={false} />
      {tieneMuestra ? (
        <BotonCaptura
          texto="Iniciar recolección"
          estaDeshabilitado={estaEnviando}
          alPulsar={() => cambiarModo('Recoleccion')}
        />
      ) : (
        <BotonCaptura
          texto="Registrar muestra"
          estaDeshabilitado={estaEnviando}
          alPulsar={() => cambiarModo('Muestra')}
        />
      )}
    </>
  );
}

// Estado de la captura en texto; el símbolo y el color solo lo refuerzan
function IndicadorEstado({ texto, estaActivo }: { texto: string; estaActivo: boolean }) {
  return (
    <p role="status" className="flex items-center gap-2 text-sm uppercase">
      <span className="text-on-surface-variant">Estado:</span>
      <span
        className={`inline-flex items-center gap-1.5 px-3 py-1 rounded font-bold ${
          estaActivo
            ? 'bg-secondary-container text-secondary-fixed'
            : 'bg-surface-container-highest text-on-surface-variant'
        }`}
      >
        <span aria-hidden="true">{estaActivo ? '●' : '■'}</span>
        {texto}
      </span>
    </p>
  );
}

function BotonCaptura({
  texto,
  esSecundario = false,
  estaDeshabilitado,
  alPulsar,
}: {
  texto: string;
  esSecundario?: boolean;
  estaDeshabilitado: boolean;
  alPulsar: () => void;
}) {
  return (
    <button
      type="button"
      onClick={alPulsar}
      disabled={estaDeshabilitado}
      className={`px-5 h-10 rounded font-headline text-xs uppercase tracking-wider transition hover:opacity-90 disabled:opacity-50 ${
        esSecundario
          ? 'bg-surface-container-high text-on-surface'
          : 'bg-primary-container text-on-primary-container'
      }`}
    >
      {estaDeshabilitado ? 'Enviando...' : texto}
    </button>
  );
}
