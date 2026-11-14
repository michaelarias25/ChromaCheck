import type { Metadata } from 'next';
import { Atkinson_Hyperlegible_Next, Inter, Montserrat } from 'next/font/google';
import { cookies } from 'next/headers';
import './globals.css';
import Image from 'next/image';
import BotonCerrarSesion from './componentes/BotonCerrarSesion';
import Navegacion from './componentes/Navegacion';

// Fuente de identidad-visual.md: 400 para texto, 700 para títulos y botones
const atkinson = Atkinson_Hyperlegible_Next({
  variable: '--font-atkinson',
  subsets: ['latin'],
  weight: ['400', '700'],
});

const inter = Inter({
  variable: '--font-inter',
  subsets: ['latin'],
  weight: ['400', '500', '600', '700'],
});

const montserrat = Montserrat({
  variable: '--font-montserrat',
  subsets: ['latin'],
  weight: ['600', '700'],
});

export const metadata: Metadata = {
  title: 'Chroma Check',
  description: 'Sistema de control espectrométrico industrial',
};

export default async function PlantillaPrincipal({ children }: LayoutProps<'/'>) {
  // El tema llega en el HTML desde el servidor para que la página no parpadee al cargar (F7)
  const tema = (await cookies()).get('tema')?.value === 'oscuro' ? 'oscuro' : 'claro';

  return (
    <html
      lang="es"
      data-tema={tema}
      className={`${atkinson.variable} ${inter.variable} ${montserrat.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col">
        {/* Con flex-wrap los controles bajan de línea en una pantalla angosta, sin desplazamiento horizontal */}
        <header className="flex flex-wrap items-center gap-4 border-b-2 border-borde bg-encabezado px-4 py-2 text-texto sm:px-8">
          {/* Los dos logos están en el HTML y el CSS muestra el del tema: el cambio no recarga la página */}
          <div className="flex items-center h-10 w-auto">
            <Image
              src="/logo-negro.png"
              alt="Chroma Check Logo"
              width={142}
              height={40}
              preload={tema === 'claro'}
              className="h-full w-auto object-contain oscuro:hidden"
            />
            <Image
              src="/logo-blanco.png"
              alt="Chroma Check Logo"
              width={142}
              height={40}
              preload={tema === 'oscuro'}
              className="hidden h-full w-auto object-contain oscuro:block"
            />
          </div>

          <Navegacion />

          {/* "Cerrar sesión" va a la derecha, separado de la navegación */}
          <div className="ml-auto flex flex-wrap items-center gap-4">
            <BotonCerrarSesion />
          </div>
        </header>
        {children}
      </body>
    </html>
  );
}
