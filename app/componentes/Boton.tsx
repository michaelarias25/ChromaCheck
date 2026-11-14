import type { ButtonHTMLAttributes } from 'react';

export type VarianteBoton = 'principal' | 'secundario' | 'peligro';

interface OpcionesClasesBoton {
  variante?: VarianteBoton;
  // 72 px para la acción principal de la pantalla; 56 px para el resto
  esGrande?: boolean;
}

interface PropiedadesBoton extends ButtonHTMLAttributes<HTMLButtonElement>, OpcionesClasesBoton {
  estaEnviando?: boolean;
  // Texto mientras se envía, por ejemplo "Abriendo…"; el botón no admite un segundo clic
  textoEnviando?: string;
}

const CLASES_VARIANTE: Record<VarianteBoton, string> = {
  principal: 'bg-accion text-texto-sobre-accion hover:brightness-90',
  secundario: 'bg-superficie text-texto border-2 border-texto hover:bg-fondo',
  peligro: 'bg-peligro text-texto-sobre-peligro hover:brightness-90',
};

// Clases de un botón según identidad-visual.md; también sirven para un Link con aspecto de botón
export function obtenerClasesBoton({
  variante = 'principal',
  esGrande = false,
}: OpcionesClasesBoton) {
  return [
    'inline-flex items-center justify-center gap-2 rounded-lg px-6 text-lg font-bold transition',
    'focus-visible:outline-4 focus-visible:outline-offset-3 focus-visible:outline-accion',
    'disabled:cursor-not-allowed disabled:opacity-60',
    esGrande ? 'h-18' : 'h-14',
    CLASES_VARIANTE[variante],
  ].join(' ');
}

// Botón con texto: principal, secundario o peligro, de 56 o 72 px, con estado "enviando"
export default function Boton({
  variante,
  esGrande,
  estaEnviando = false,
  textoEnviando,
  disabled,
  className = '',
  type = 'button',
  children,
  ...otrasPropiedades
}: PropiedadesBoton) {
  return (
    <button
      type={type}
      disabled={disabled || estaEnviando}
      aria-busy={estaEnviando || undefined}
      className={`${obtenerClasesBoton({ variante, esGrande })} ${className}`}
      {...otrasPropiedades}
    >
      {estaEnviando && textoEnviando ? textoEnviando : children}
    </button>
  );
}
