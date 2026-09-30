// Crea y exporta un pool de conexiones reutilizable hacia la base de 
// datos PostgreSQL de Neon
import { Pool } from 'pg';

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: {
    rejectUnauthorized: false,
  },
});

export default pool;