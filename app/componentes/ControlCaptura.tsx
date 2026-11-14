'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import type { ModoCaptura } from '@/lib/modulos/lotes/reglas';
import Boton from './Boton';

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

// Acción principal de la pantalla del lote: tomar la muestra patrón o revisar tarros.
// Mientras no exista la pantalla completa (sección 3), lo que hace el sensor se muestra aquí
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
      setMensajeError(
        'No se pudo conectar con el servidor. Revise la conexión e intente de nuevo.'
      );
    } finally {
      setEstaEnviando(false);
    }
  }

  // Un lote pausado no puede capturar: el aviso de pausa ya explica el motivo
  if (estado !== 'Activo') return null;

  return (
    <div className="space-y-4">
      <ContenidoCaptura
        modoCaptura={modoCaptura}
        tieneMuestra={tieneMuestra}
        capturaDeOtroLote={capturaDeOtroLote}
        estaEnviando={estaEnviando}
        cambiarModo={cambiarModo}
      />

      {mensajeError && (
        <p role="alert" className="text-lg text-peligro">
          <span aria-hidden="true">⚠ </span>
          {mensajeError}
        </p>
      )}
    </div>
  );
}

// Elige el estado del sensor y el botón según el modo del lote y si el sensor está libre
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
        <EstadoSensor texto="Esperando el tarro…" estaActivo />
        <p className="text-2xl font-bold">Coloque el tarro patrón frente al sensor</p>
        <Boton
          variante="secundario"
          esGrande
          estaEnviando={estaEnviando}
          textoEnviando="Cancelando…"
          onClick={() => cambiarModo('Inactivo')}
        >
          Cancelar
        </Boton>
      </>
    );
  }

  if (modoCaptura === 'Recoleccion') {
    return (
      <>
        <EstadoSensor texto="Revisando tarros…" estaActivo />
        <p className="text-2xl font-bold">Pase los tarros uno por uno frente al sensor</p>
        <Boton
          variante="peligro"
          esGrande
          estaEnviando={estaEnviando}
          textoEnviando="Terminando…"
          onClick={() => cambiarModo('Inactivo')}
        >
          Terminar revisión
        </Boton>
      </>
    );
  }

  // Modo Inactivo: la acción principal depende de si el lote ya tiene muestra patrón
  const textoAccion = tieneMuestra ? 'Revisar tarros' : 'Tomar muestra patrón';
  const modoSiguiente: ModoCaptura = tieneMuestra ? 'Recoleccion' : 'Muestra';

  return (
    <>
      <div className="flex flex-wrap items-center gap-4">
        <Boton
          esGrande
          disabled={Boolean(capturaDeOtroLote)}
          estaEnviando={estaEnviando}
          textoEnviando="Abriendo…"
          onClick={() => cambiarModo(modoSiguiente)}
        >
          {textoAccion}
        </Boton>
        <EstadoSensor texto="El sensor está detenido" estaActivo={false} />
      </div>

      {/* El botón deshabilitado lleva al lado la frase que explica por qué */}
      {capturaDeOtroLote && (
        <p className="text-lg">
          <span aria-hidden="true">⚠ </span>El sensor está ocupado con el lote{' '}
          <Link
            href={`/lotes/${capturaDeOtroLote.loteId}`}
            className="font-bold text-accion underline underline-offset-4"
          >
            {capturaDeOtroLote.codigo}
          </Link>
          . Termine esa revisión para usarlo aquí.
        </p>
      )}
    </>
  );
}

// Estado del sensor en texto; el símbolo solo lo refuerza
function EstadoSensor({ texto, estaActivo }: { texto: string; estaActivo: boolean }) {
  return (
    <p role="status" className="text-lg">
      <span aria-hidden="true" className={estaActivo ? 'text-accion' : 'text-texto-secundario'}>
        {estaActivo ? '● ' : '■ '}
      </span>
      {texto}
    </p>
  );
}
