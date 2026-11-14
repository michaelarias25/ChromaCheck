'use client';

import { usePathname, useRouter } from 'next/navigation';
import { CLASES_ELEMENTO_ENCABEZADO } from './Navegacion';

// Cierra la sesión y vuelve a la pantalla de login. En /login no se muestra
export default function BotonCerrarSesion() {
  const router = useRouter();
  const ruta = usePathname();

  async function cerrarSesion() {
    await fetch('/api/auth/logout', { method: 'POST' });
    router.push('/login');
    router.refresh();
  }

  if (ruta === '/login') return null;

  return (
    <button type="button" onClick={cerrarSesion} className={CLASES_ELEMENTO_ENCABEZADO}>
      Cerrar sesión
    </button>
  );
}
