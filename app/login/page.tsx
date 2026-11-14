'use client';

import { FormEvent, useState } from 'react';
import { useRouter } from 'next/navigation';
import Boton from '../componentes/Boton';

const CLASES_CAMPO =
  'h-14 w-full rounded-lg border-2 border-borde bg-superficie px-4 text-lg text-texto focus-visible:outline-4 focus-visible:outline-offset-3 focus-visible:outline-accion';

// Pantalla de inicio de sesión con usuario y contraseña
export default function PaginaLogin() {
  const router = useRouter();
  const [nombreUsuario, setNombreUsuario] = useState('');
  const [contrasena, setContrasena] = useState('');
  const [estaContrasenaVisible, setEstaContrasenaVisible] = useState(false);
  const [mensajeError, setMensajeError] = useState('');
  const [estaEnviando, setEstaEnviando] = useState(false);

  async function iniciarSesion(evento: FormEvent<HTMLFormElement>) {
    evento.preventDefault();
    setMensajeError('');
    setEstaEnviando(true);

    try {
      const respuesta = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ nombreUsuario, contrasena }),
      });
      const resultado = await respuesta.json();

      if (!resultado.exito) {
        setMensajeError(resultado.error);
        return;
      }

      router.push('/');
      router.refresh();
    } catch {
      setMensajeError(
        'No se pudo conectar con el servidor. Revise la conexión e intente de nuevo.'
      );
    } finally {
      setEstaEnviando(false);
    }
  }

  return (
    <main className="flex flex-1 items-center justify-center bg-fondo px-4 py-10 text-texto">
      <form
        onSubmit={iniciarSesion}
        className="w-full max-w-md space-y-6 rounded-lg border-2 border-borde bg-superficie p-8"
      >
        <h1 className="text-3xl font-bold">Iniciar sesión</h1>

        <div className="space-y-2">
          <label htmlFor="usuario" className="block text-base font-bold">
            Usuario
          </label>
          <input
            id="usuario"
            type="text"
            value={nombreUsuario}
            onChange={(evento) => setNombreUsuario(evento.target.value)}
            autoComplete="username"
            required
            className={CLASES_CAMPO}
          />
        </div>

        <div className="space-y-2">
          <label htmlFor="contrasena" className="block text-base font-bold">
            Contraseña
          </label>
          <input
            id="contrasena"
            type={estaContrasenaVisible ? 'text' : 'password'}
            value={contrasena}
            onChange={(evento) => setContrasena(evento.target.value)}
            autoComplete="current-password"
            required
            className={CLASES_CAMPO}
          />
          {/* Permite revisar lo escrito antes de entrar */}
          <Boton
            variante="secundario"
            aria-controls="contrasena"
            aria-pressed={estaContrasenaVisible}
            onClick={() => setEstaContrasenaVisible(!estaContrasenaVisible)}
          >
            {estaContrasenaVisible ? 'Ocultar contraseña' : 'Mostrar contraseña'}
          </Boton>
        </div>

        <Boton
          type="submit"
          esGrande
          estaEnviando={estaEnviando}
          textoEnviando="Ingresando…"
          className="w-full"
        >
          Ingresar
        </Boton>

        {/* El error queda debajo del botón y no se borra solo */}
        {mensajeError && (
          <p role="alert" className="text-lg text-peligro">
            <span aria-hidden="true">⚠ </span>
            {mensajeError}
          </p>
        )}
      </form>
    </main>
  );
}
