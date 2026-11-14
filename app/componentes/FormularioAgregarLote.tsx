'use client';

import { FormEvent, useState } from 'react';
import { useRouter } from 'next/navigation';
import { LONGITUD_MAXIMA_CODIGO_LOTE } from '@/lib/validacion';
import Boton from './Boton';

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
      setMensajeError(
        'No se pudo conectar con el servidor. Revise la conexión e intente de nuevo.'
      );
    } finally {
      setEstaEnviando(false);
    }
  }

  if (!estaAbierto) {
    return (
      <Boton esGrande onClick={() => setEstaAbierto(true)}>
        Agregar lote
      </Boton>
    );
  }

  return (
    <form
      onSubmit={crearLote}
      className="w-full max-w-md space-y-4 rounded-lg border-2 border-borde bg-superficie p-6"
    >
      <div className="space-y-2">
        <label htmlFor="codigo-lote" className="block text-base font-bold">
          Código del lote
        </label>
        <input
          id="codigo-lote"
          type="text"
          value={codigo}
          onChange={(evento) => setCodigo(evento.target.value)}
          maxLength={LONGITUD_MAXIMA_CODIGO_LOTE}
          placeholder="#005_Azul_Cielo"
          autoFocus
          className="h-14 w-full rounded-lg border-2 border-borde bg-superficie px-4 text-lg text-texto focus-visible:outline-4 focus-visible:outline-offset-3 focus-visible:outline-accion"
        />
      </div>

      {mensajeError && (
        <p role="alert" className="text-lg text-peligro">
          <span aria-hidden="true">⚠ </span>
          {mensajeError}
        </p>
      )}

      <div className="flex flex-wrap gap-4">
        <Boton type="submit" estaEnviando={estaEnviando} textoEnviando="Creando…">
          Crear lote
        </Boton>
        <Boton variante="secundario" onClick={cerrarFormulario} disabled={estaEnviando}>
          Cancelar
        </Boton>
      </div>
    </form>
  );
}
