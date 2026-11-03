// Crea y exporta un pool de conexiones reutilizable hacia la base de
// datos PostgreSQL de Neon. El SSL lo define el parámetro sslmode de
// DATABASE_URL, que verifica el certificado del servidor.
import { Pool } from 'pg';

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
