// Validaciones compartidas para los datos que llegan a la API

const PATRON_COLOR_HEX = /^#[0-9A-Fa-f]{6}$/;

// Indica si el valor es un entero mayor que cero (por ejemplo, un id de la base de datos)
export function esEnteroPositivo(valor: unknown): valor is number {
  return typeof valor === 'number' && Number.isInteger(valor) && valor > 0;
}

// Indica si el valor es un color hex completo con el formato #RRGGBB
export function esColorHexValido(valor: unknown): valor is string {
  return typeof valor === 'string' && PATRON_COLOR_HEX.test(valor);
}

// Indica si el valor es un arreglo [r, g, b] con tres enteros entre 0 y 255
export function esColorRgbValido(valor: unknown): valor is [number, number, number] {
  return (
    Array.isArray(valor) &&
    valor.length === 3 &&
    valor.every((canal) => Number.isInteger(canal) && canal >= 0 && canal <= 255)
  );
}

// Indica si el color hex y el color RGB representan el mismo color
export function coincidenColorHexYRgb(
  colorHex: string,
  colorRgb: [number, number, number]
): boolean {
  const colorHexDesdeRgb =
    '#' + colorRgb.map((canal) => canal.toString(16).padStart(2, '0')).join('');
  return colorHexDesdeRgb.toLowerCase() === colorHex.toLowerCase();
}

// Largo máximo del código de un lote (columna lotes.codigo, VARCHAR(50))
export const LONGITUD_MAXIMA_CODIGO_LOTE = 50;

// Indica si el texto supera el largo máximo del código de un lote.
// Cuenta caracteres igual que PostgreSQL (un emoji cuenta como uno)
export function excedeLongitudCodigoLote(codigo: string): boolean {
  return Array.from(codigo).length > LONGITUD_MAXIMA_CODIGO_LOTE;
}
