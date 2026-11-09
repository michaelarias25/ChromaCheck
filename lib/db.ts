// Crea y exporta un pool de conexiones reutilizable hacia la base de
// datos PostgreSQL de Neon. El SSL lo define el parámetro sslmode de
// DATABASE_URL, que verifica el certificado del servidor.
import { Pool, type PoolClient } from 'pg';

// En desarrollo, la recarga en caliente vuelve a ejecutar este módulo; guardar
// el pool en globalThis evita abrir un pool nuevo con cada recarga
const globalConPool = globalThis as typeof globalThis & { poolBaseDatos?: Pool };

const pool =
  globalConPool.poolBaseDatos ??
  new Pool({
    connectionString: process.env.DATABASE_URL,
  });

if (process.env.NODE_ENV !== 'production') {
  globalConPool.poolBaseDatos = pool;
}

export default pool;

// Pool o cliente de una transacción: las funciones de los repositorios aceptan cualquiera de los dos
export type EjecutorConsultas = Pool | PoolClient;

// Ejecuta varias consultas en una sola transacción: si la operación falla, se deshace todo
export async function ejecutarEnTransaccion<T>(
  operacion: (cliente: PoolClient) => Promise<T>
): Promise<T> {
  const cliente = await pool.connect();
  try {
    await cliente.query('BEGIN');
    const resultado = await operacion(cliente);
    await cliente.query('COMMIT');
    return resultado;
  } catch (error) {
    await cliente.query('ROLLBACK');
    throw error;
  } finally {
    cliente.release();
  }
}
