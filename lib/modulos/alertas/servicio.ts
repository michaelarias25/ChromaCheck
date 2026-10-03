import pool from '@/lib/db';

// Registra una alerta nueva asociada a un tarro
export async function crearAlerta(
  tarroId: number,
  nivel: 'Amarilla' | 'Roja',
  mensaje: string,
  congelaRegistro: boolean
) {
  const resultado = await pool.query(
    `INSERT INTO alertas (tarro_id, nivel, mensaje, congela_registro)
     VALUES ($1, $2, $3, $4) RETURNING *`,
    [tarroId, nivel, mensaje, congelaRegistro]
  );
  return resultado.rows[0];
}

// Trae las alertas de un lote específico (vía sus tarros)
export async function obtenerAlertasDeLote(loteId: number) {
  const resultado = await pool.query(
    `SELECT a.* FROM alertas a
     JOIN tarros t ON t.id_tarro = a.tarro_id
     WHERE t.lote_id = $1
     ORDER BY a.timestamp DESC`,
    [loteId]
  );
  return resultado.rows;
}