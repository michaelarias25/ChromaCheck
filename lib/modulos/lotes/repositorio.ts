// Consultas SQL de la tabla lotes
import pool from '@/lib/db';

// Código de error de PostgreSQL cuando se viola un índice o restricción única
const CODIGO_ERROR_VALOR_REPETIDO = '23505';

export interface Lote {
  id: number;
  codigo: string;
  estado: string;
  fecha_inicio: Date;
}

// Inserta un lote con el código dado. Devuelve null si el código ya existe
// (índice único lotes_codigo_unico, que ignora mayúsculas y espacios en los extremos)
export async function insertarLote(codigo: string): Promise<Lote | null> {
  try {
    const resultado = await pool.query<Lote>(
      'INSERT INTO lotes (codigo) VALUES ($1) RETURNING *',
      [codigo]
    );
    return resultado.rows[0];
  } catch (error) {
    const esCodigoRepetido =
      typeof error === 'object' &&
      error !== null &&
      'code' in error &&
      error.code === CODIGO_ERROR_VALOR_REPETIDO;
    if (esCodigoRepetido) return null;
    throw error;
  }
}
