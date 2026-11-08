// Funciones para mostrar valores en pantalla con un formato uniforme

const SIN_VALOR = '—';

// Muestra una desviación deltaE con 2 decimales (ej. "0,45"); "—" si no está calculada.
// Acepta texto porque PostgreSQL devuelve las columnas NUMERIC como string
export function formatearDeltaE(desviacionDeltaE: string | number | null | undefined): string {
  if (desviacionDeltaE === null || desviacionDeltaE === undefined || desviacionDeltaE === '') {
    return SIN_VALOR;
  }

  const valor = Number(desviacionDeltaE);
  if (!Number.isFinite(valor)) return SIN_VALOR;

  return valor.toLocaleString('es-CO', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

// Muestra una fecha con día, mes, año y hora (ej. "30/09/2026, 3:44:33 a. m.")
export function formatearFechaHora(fecha: Date | string): string {
  return new Date(fecha).toLocaleString('es-CO');
}
