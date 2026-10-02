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