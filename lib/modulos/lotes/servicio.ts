import type { PoolClient } from 'pg';
import {
  actualizarModoCaptura,
  buscarLoteCapturando,
  buscarLoteConMuestra,
  buscarLotePorId,
  buscarLotes,
  buscarLotesConResumen,
  detenerCapturaDeMuestra,
  insertarLote,
  pausarLoteYDetenerCaptura,
  type Lote,
} from './repositorio';
import {
  crearMensajeOtroLoteCapturando,
  MODO_CAPTURA_DETENIDO,
  obtenerMotivoRechazoModoCaptura,
  type ModoCaptura,
} from './reglas';

export type ResultadoCambioModoCaptura =
  | { tipo: 'loteInexistente' }
  | { tipo: 'rechazado'; mensaje: string }
  | { tipo: 'cambiado'; lote: Lote };

export interface CapturaActiva {
  loteId: number;
  codigo: string;
  modo: ModoCaptura;
}

// Trae todos los lotes, más recientes primero
export async function obtenerLotes() {
  return buscarLotes();
}

// Crea un lote nuevo con el código dado (ej. "#005_Azul_Cielo").
// Devuelve null si ya existe un lote con ese código
export async function crearLote(codigo: string) {
  return insertarLote(codigo);
}

// Pone el lote en el modo de captura pedido, si las reglas lo permiten y ningún otro lote está capturando
export async function cambiarModoCaptura(
  loteId: number,
  modoNuevo: ModoCaptura
): Promise<ResultadoCambioModoCaptura> {
  const lote = await buscarLoteConMuestra(loteId);
  if (!lote) return { tipo: 'loteInexistente' };

  const motivoRechazo = obtenerMotivoRechazoModoCaptura(modoNuevo, {
    estado: lote.estado,
    tieneMuestra: lote.tiene_muestra,
  });
  if (motivoRechazo) return { tipo: 'rechazado', mensaje: motivoRechazo };

  if (modoNuevo !== MODO_CAPTURA_DETENIDO) {
    const loteCapturando = await buscarLoteCapturando();
    if (loteCapturando && loteCapturando.id !== loteId) {
      return {
        tipo: 'rechazado',
        mensaje: crearMensajeOtroLoteCapturando(loteCapturando.codigo, loteCapturando.modo_captura),
      };
    }
  }

  const loteActualizado = await actualizarModoCaptura(loteId, modoNuevo);
  if (!loteActualizado) {
    // Otro lote empezó a capturar entre la revisión y la actualización
    const loteCapturando = await buscarLoteCapturando();
    return {
      tipo: 'rechazado',
      mensaje: loteCapturando
        ? crearMensajeOtroLoteCapturando(loteCapturando.codigo, loteCapturando.modo_captura)
        : 'Otro lote empezó a capturar al mismo tiempo; intenta de nuevo',
    };
  }
  return { tipo: 'cambiado', lote: loteActualizado };
}

// Saca el lote del modo 'Muestra' dentro de la transacción que registra la muestra.
// Devuelve false si el lote ya no estaba en modo 'Muestra'
export async function finalizarModoMuestra(cliente: PoolClient, loteId: number) {
  return detenerCapturaDeMuestra(cliente, loteId);
}

// Pausa el lote por una alerta roja y detiene su captura en la misma operación
export async function pausarLote(loteId: number) {
  return pausarLoteYDetenerCaptura(loteId);
}

// Indica qué lote está capturando y en qué modo, para el puente serial; null si ninguno
export async function obtenerCapturaActiva(): Promise<CapturaActiva | null> {
  const lote = await buscarLoteCapturando();
  if (!lote) return null;
  return { loteId: lote.id, codigo: lote.codigo, modo: lote.modo_captura };
}

// Trae los lotes con su modo de captura, color de muestra y desviación promedio, para la pantalla principal
export async function obtenerLotesConResumen() {
  return buscarLotesConResumen();
}

// Trae un lote específico por su id; null si no existe
export async function obtenerLotePorId(id: number) {
  return buscarLotePorId(id);
}
