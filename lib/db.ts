// Crea y exporta un pool de conexiones reutilizable hacia la base de
// datos PostgreSQL de Neon. El SSL lo define el parámetro sslmode de
// DATABASE_URL, que verifica el certificado del servidor.
import { Pool } from 'pg';

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

export default pool;
