'use client';

import { useRouter } from 'next/navigation';

// Cierra la sesión y vuelve a la pantalla de login
export default function BotonCerrarSesion() {
  const router = useRouter();

  async function cerrarSesion() {
    await fetch('/api/auth/logout', { method: 'POST' });
    router.push('/login');
    router.refresh();
  }

  return (
    <button
      type="button"
      onClick={cerrarSesion}
      className="px-4 h-9 bg-surface-container-high text-on-surface-variant flex items-center justify-center rounded font-headline text-xs uppercase tracking-wider transition hover:opacity-90"
    >
      Cerrar sesión
    </button>
  );
}
