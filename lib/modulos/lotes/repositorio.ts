// Consultas SQL de la tabla lotes
import pool from '@/lib/db';

export interface Lote {
  id: number;
  codigo: string;
  estado: string;
  fecha_inicio: Date;
}

// Inserta un lote con el código dado y lo devuelve
export async function insertarLote(codigo: string): Promise<Lote> {
  const resultado = await pool.query<Lote>(
    'INSERT INTO lotes (codigo) VALUES ($1) RETURNING *',
    [codigo]
  );
  return resultado.rows[0];
}
