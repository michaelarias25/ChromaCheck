// Reglas del modo de captura de un lote: qué lote recibe las lecturas del sensor y en qué modo.
// Funciones puras, sin acceso a la base de datos

// 'Inactivo': el lote no recibe lecturas.
// 'Muestra': el próximo tarro leído se registra como muestra del lote.
// 'Recoleccion': cada tarro leído se registra como lectura y se compara con la muestra
export const MODOS_CAPTURA = ['Inactivo', 'Muestra', 'Recoleccion'] as const;

export type ModoCaptura = (typeof MODOS_CAPTURA)[number];

export const MODO_CAPTURA_DETENIDO: ModoCaptura = 'Inactivo';

const ESTADO_LOTE_ACTIVO = 'Activo';

// Indica si el valor es uno de los modos de captura válidos
export function esModoCapturaValido(valor: unknown): valor is ModoCaptura {
  return typeof valor === 'string' && (MODOS_CAPTURA as readonly string[]).includes(valor);
}

// Indica si un lote en este modo acepta el registro de su tarro muestra
export function puedeRegistrarMuestra(modoCaptura: string): boolean {
  return modoCaptura === 'Muestra';
}

// Indica si un lote en este modo acepta lecturas de tarros
export function puedeRegistrarLectura(modoCaptura: string): boolean {
  return modoCaptura === 'Recoleccion';
}

// Revisa si el lote puede pasar al modo pedido. Devuelve el motivo del rechazo, o null si puede.
// No revisa si otro lote ya está capturando: eso depende de los demás lotes
export function obtenerMotivoRechazoModoCaptura(
  modoNuevo: ModoCaptura,
  lote: { estado: string; tieneMuestra: boolean }
): string | null {
  // Detener la captura siempre está permitido
  if (modoNuevo === MODO_CAPTURA_DETENIDO) return null;

  if (lote.estado !== ESTADO_LOTE_ACTIVO) {
    return `El lote está ${lote.estado} y no puede capturar lecturas`;
  }
  if (modoNuevo === 'Muestra' && lote.tieneMuestra) {
    return 'El lote ya tiene muestra registrada; usa el modo Recoleccion';
  }
  if (modoNuevo === 'Recoleccion' && !lote.tieneMuestra) {
    return 'El lote no tiene muestra registrada; captura primero la muestra con el modo Muestra';
  }
  return null;
}

// Mensaje cuando otro lote ya ocupa el sensor
export function crearMensajeOtroLoteCapturando(codigo: string, modoCaptura: string): string {
  return `El lote "${codigo}" ya está capturando en modo ${modoCaptura}; detén esa captura antes de iniciar otra`;
}
