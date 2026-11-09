// Consultas SQL de la tabla alertas
import pool from '@/lib/db';

export type NivelAlertaGuardada = 'Amarilla' | 'Roja';

export interface Alerta {
  id: number;
  tarro_id: number;
  nivel: NivelAlertaGuardada;
  mensaje: string;
  congela_registro: boolean;
  timestamp: Date;
}

export interface DatosAlertaNueva {
  tarroId: number;
  nivel: NivelAlertaGuardada;
  mensaje: string;
  congelaRegistro: boolean;
}

// Inserta una alerta asociada a un tarro
export async function insertarAlerta(datos: DatosAlertaNueva): Promise<Alerta> {
  const resultado = await pool.query<Alerta>(
    `INSERT INTO alertas (tarro_id, nivel, mensaje, congela_registro)
     VALUES ($1, $2, $3, $4) RETURNING *`,
    [datos.tarroId, datos.nivel, datos.mensaje, datos.congelaRegistro]
  );
  return resultado.rows[0];
}

// Trae las alertas de un lote (vía sus tarros), de la más reciente a la más antigua
export async function buscarAlertasDeLote(loteId: number): Promise<Alerta[]> {
  const resultado = await pool.query<Alerta>(
    `SELECT a.* FROM alertas a
     JOIN tarros t ON t.id_tarro = a.tarro_id
     WHERE t.lote_id = $1
     ORDER BY a.timestamp DESC`,
    [loteId]
  );
  return resultado.rows;
}
