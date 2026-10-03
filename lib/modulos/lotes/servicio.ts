import pool from '@/lib/db';

// Trae todos los lotes, más recientes primero
export async function obtenerLotes() {
  const resultado = await pool.query(
    'SELECT * FROM lotes ORDER BY fecha_inicio DESC'
  );
  return resultado.rows;
}

// Crea un lote nuevo con el código dado (ej. "#005_Azul_Cielo")
export async function crearLote(codigo: string) {
  const resultado = await pool.query(
    'INSERT INTO lotes (codigo) VALUES ($1) RETURNING *',
    [codigo]
  );
  return resultado.rows[0];
}

// Trae los lotes con su color de muestra y desviación promedio, para la pantalla principal
export async function obtenerLotesConResumen() {
  const resultado = await pool.query(`
    SELECT
      l.id,
      l.codigo,
      l.estado,
      l.fecha_inicio,
      (SELECT resultado_hex FROM tarros WHERE lote_id = l.id AND es_muestra = true LIMIT 1) AS muestra_hex,
      (SELECT ROUND(AVG(desviacion_delta_e), 2) FROM tarros WHERE lote_id = l.id AND es_muestra = false) AS desviacion_promedio
    FROM lotes l
    ORDER BY l.fecha_inicio DESC
  `);
  return resultado.rows;
}

// Trae un lote específico por su id
export async function obtenerLotePorId(id: number) {
  const resultado = await pool.query('SELECT * FROM lotes WHERE id = $1', [id]);
  return resultado.rows[0] || null;
}
// Cambia el estado de un lote (ej. a "Pausado" cuando hay una alerta roja)
export async function actualizarEstadoLote(loteId: number, estado: string) {
  const resultado = await pool.query(
    'UPDATE lotes SET estado = $1 WHERE id = $2 RETURNING *',
    [estado, loteId]
  );
  return resultado.rows[0];
}