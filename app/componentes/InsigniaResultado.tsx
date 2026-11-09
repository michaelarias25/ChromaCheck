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
      clases: 'bg-secondary-container text-secondary-fixed',
    },
    noAprobado: {
      texto: 'No aprobado',
      simbolo: '✕',
      clases: 'bg-primary-container text-on-primary-container',
    },
    sinCalcular: {
      texto: 'Sin calcular',
      simbolo: '–',
      clases: 'bg-surface-container-highest text-on-surface-variant',
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
      className={`inline-flex items-center gap-1.5 px-3 py-1 rounded text-xs uppercase font-bold whitespace-nowrap ${estilo.clases}`}
    >
      <span aria-hidden="true">{estilo.simbolo}</span>
      {estilo.texto}
    </span>
  );
}
