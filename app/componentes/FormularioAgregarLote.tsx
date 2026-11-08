'use client';

import { FormEvent, useState } from 'react';
import { useRouter } from 'next/navigation';
import { LONGITUD_MAXIMA_CODIGO_LOTE } from '@/lib/validacion';

// Botón "Agregar lote" que abre un formulario para crear un lote con su código
export default function FormularioAgregarLote() {
  const router = useRouter();
  const [estaAbierto, setEstaAbierto] = useState(false);
  const [codigo, setCodigo] = useState('');
  const [mensajeError, setMensajeError] = useState('');
  const [estaEnviando, setEstaEnviando] = useState(false);

  function cerrarFormulario() {
    setEstaAbierto(false);
    setCodigo('');
    setMensajeError('');
  }

  async function crearLote(evento: FormEvent<HTMLFormElement>) {
    evento.preventDefault();
    setMensajeError('');
    setEstaEnviando(true);

    try {
      const respuesta = await fetch('/api/lotes', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ codigo }),
      });
      const resultado = await respuesta.json();

      if (!resultado.exito) {
        setMensajeError(resultado.error);
        return;
      }

      cerrarFormulario();
      // Vuelve a consultar los lotes en el servidor para que aparezca la tarjeta nueva
      router.refresh();
    } catch {
      setMensajeError('No se pudo conectar con el servidor');
    } finally {
      setEstaEnviando(false);
    }
  }

  if (!estaAbierto) {
    return (
      <button
        type="button"
        onClick={() => setEstaAbierto(true)}
        className="px-5 h-10 rounded bg-primary-container text-on-primary-container font-headline text-xs uppercase tracking-wider transition hover:opacity-90"
      >
        Agregar lote
      </button>
    );
  }

  return (
    <form
      onSubmit={crearLote}
      className="w-full max-w-md bg-surface-container rounded-lg shadow-md p-5 space-y-4"
    >
      <label className="block space-y-1">
        <span className="text-xs uppercase text-on-surface-variant">Código del lote</span>
        <input
          type="text"
          value={codigo}
          onChange={(evento) => setCodigo(evento.target.value)}
          maxLength={LONGITUD_MAXIMA_CODIGO_LOTE}
          placeholder="#005_Azul_Cielo"
          autoFocus
          className="w-full h-10 px-3 rounded bg-surface-container-high text-on-surface outline-none focus:ring-2 focus:ring-secondary"
        />
      </label>

      {mensajeError && (
        <p role="alert" className="text-sm text-primary">
          {mensajeError}
        </p>
      )}

      <div className="flex gap-3">
        <button
          type="submit"
          disabled={estaEnviando}
          className="flex-1 h-10 rounded bg-primary-container text-on-primary-container font-headline text-xs uppercase tracking-wider transition hover:opacity-90 disabled:opacity-50"
        >
          {estaEnviando ? 'Creando...' : 'Crear lote'}
        </button>
        <button
          type="button"
          onClick={cerrarFormulario}
          disabled={estaEnviando}
          className="flex-1 h-10 rounded bg-surface-container-high text-on-surface-variant font-headline text-xs uppercase tracking-wider transition hover:opacity-90 disabled:opacity-50"
        >
          Cancelar
        </button>
      </div>
    </form>
  );
}
