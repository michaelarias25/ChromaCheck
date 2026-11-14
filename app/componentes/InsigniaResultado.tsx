// Insignia con el resultado de un tarro. Siempre muestra texto y símbolo,
// para que el resultado no dependa solo del color
interface PropiedadesInsigniaResultado {
  resultado: string | null;
  desviacionDeltaE: string | number | null;
}

type TipoResultado = 'aprobado' | 'noAprobado' | 'sinCalcular';

const ESTILOS_RESULTADO: Record<TipoResultado, { texto: string; simbolo: string; clases: string }> =
  {
    aprobado: {
      texto: 'Aprobado',
      simbolo: '✓',
      clases: 'bg-aprobado text-texto-sobre-aprobado border-aprobado',
    },
    noAprobado: {
      texto: 'No aprobado',
      simbolo: '✕',
      clases: 'bg-peligro text-texto-sobre-peligro border-peligro',
    },
    sinCalcular: {
      texto: 'Sin calcular',
      simbolo: '–',
      clases: 'bg-superficie text-texto-secundario border-borde',
    },
  };

// Traduce el resultado guardado en la base ("Aprobado" / "No Aprobado") al tipo de insignia.
// Sin deltaE no hay dictamen, aunque la columna resultado tenga texto
function obtenerTipoResultado(
  resultado: string | null,
  desviacionDeltaE: string | number | null
): TipoResultado {
  const tieneDeltaE = desviacionDeltaE !== null && desviacionDeltaE !== '';
  if (!tieneDeltaE) return 'sinCalcular';
  if (resultado === 'Aprobado') return 'aprobado';
  if (resultado === 'No Aprobado') return 'noAprobado';
  return 'sinCalcular';
}

export default function InsigniaResultado({
  resultado,
  desviacionDeltaE,
}: PropiedadesInsigniaResultado) {
  const estilo = ESTILOS_RESULTADO[obtenerTipoResultado(resultado, desviacionDeltaE)];

  return (
    <span
      className={`inline-flex items-center gap-2 px-3 py-1 rounded-lg border-2 text-lg font-bold whitespace-nowrap ${estilo.clases}`}
    >
      <span aria-hidden="true">{estilo.simbolo}</span>
      {estilo.texto}
    </span>
  );
}
