import { buscarAlertasDeLote, insertarAlerta, type NivelAlertaGuardada } from './repositorio';

// Registra una alerta nueva asociada a un tarro
export async function crearAlerta(
  tarroId: number,
  nivel: NivelAlertaGuardada,
  mensaje: string,
  congelaRegistro: boolean
) {
  return insertarAlerta({ tarroId, nivel, mensaje, congelaRegistro });
}

// Trae las alertas de un lote específico (vía sus tarros), de la más reciente a la más antigua
export async function obtenerAlertasDeLote(loteId: number) {
  return buscarAlertasDeLote(loteId);
}
