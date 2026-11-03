'use client';

import { FormEvent, useState } from 'react';
import { useRouter } from 'next/navigation';

// Pantalla de inicio de sesión con usuario y contraseña
export default function PaginaLogin() {
  const router = useRouter();
  const [nombreUsuario, setNombreUsuario] = useState('');
  const [contrasena, setContrasena] = useState('');
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
      setMensajeError('No se pudo conectar con el servidor');
    } finally {
      setEstaEnviando(false);
    }
  }

  return (
    <main className="min-h-screen bg-surface text-on-surface flex items-center justify-center px-6">
      <form
        onSubmit={iniciarSesion}
        className="w-full max-w-sm bg-surface-container rounded-lg shadow-md p-8 space-y-5"
      >
        <h1 className="font-headline text-2xl font-bold uppercase">Iniciar sesión</h1>

        <label className="block space-y-1">
          <span className="text-xs uppercase text-on-surface-variant">Usuario</span>
          <input
            type="text"
            value={nombreUsuario}
            onChange={(evento) => setNombreUsuario(evento.target.value)}
            autoComplete="username"
            required
            className="w-full h-10 px-3 rounded bg-surface-container-high text-on-surface outline-none focus:ring-2 focus:ring-secondary"
          />
        </label>

        <label className="block space-y-1">
          <span className="text-xs uppercase text-on-surface-variant">Contraseña</span>
          <input
            type="password"
            value={contrasena}
            onChange={(evento) => setContrasena(evento.target.value)}
            autoComplete="current-password"
            required
            className="w-full h-10 px-3 rounded bg-surface-container-high text-on-surface outline-none focus:ring-2 focus:ring-secondary"
          />
        </label>

        {mensajeError && (
          <p role="alert" className="text-sm text-primary">
            {mensajeError}
          </p>
        )}

        <button
          type="submit"
          disabled={estaEnviando}
          className="w-full h-10 rounded bg-primary-container text-on-primary-container font-headline text-xs uppercase tracking-wider transition hover:opacity-90 disabled:opacity-50"
        >
          {estaEnviando ? 'Ingresando...' : 'Ingresar'}
        </button>
      </form>
    </main>
  );
}
