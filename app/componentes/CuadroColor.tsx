// Tamaños del cuadro: 32 px en tablas (F6), 160 px en la pantalla completa (F4) y ancho completo en tarjetas
export type TamanoCuadroColor = 'pequeno' | 'mediano' | 'ancho';

interface PropiedadesCuadroColor {
  // Color real de la pintura (resultado_hex); null si todavía no hay lectura
  hex: string | null;
  tamano?: TamanoCuadroColor;
  textoSinColor?: string;
}

const CLASES_TAMANO: Record<TamanoCuadroColor, string> = {
  pequeno: 'h-8 w-8',
  mediano: 'h-40 w-40',
  ancho: 'h-36 w-full',
};

// Color de la pintura con borde de 2 px y su código hex debajo, nunca encima del color.
// Es el único color que no viene de la paleta, por eso va en style y no cambia con el tema
export default function CuadroColor({
  hex,
  tamano = 'ancho',
  textoSinColor = 'Sin lectura',
}: PropiedadesCuadroColor) {
  const tieneColor = Boolean(hex);

  return (
    <div className={tamano === 'ancho' ? 'w-full' : 'w-fit'}>
      <div
        aria-hidden="true"
        className={`${CLASES_TAMANO[tamano]} rounded-lg border-2 ${
          tieneColor ? 'border-borde' : 'border-dashed border-borde bg-fondo'
        }`}
        style={tieneColor ? { backgroundColor: hex ?? undefined } : undefined}
      />
      <p className="mt-2 text-base text-texto-secundario tabular-nums">
        {tieneColor ? hex?.toUpperCase() : textoSinColor}
      </p>
    </div>
  );
}
