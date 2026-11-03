// Crea un usuario guardando solo el hash de su contraseña.
// Uso: node --env-file=.env.local --experimental-strip-types scripts/crear-usuario.ts <nombre_usuario> <contrasena>
import { Pool } from 'pg';
import { hashearContrasena } from '../lib/modulos/auth/contrasenas.ts';

const [nombreUsuario, contrasena] = process.argv.slice(2);

if (!nombreUsuario || !contrasena) {
  console.error('Uso: crear-usuario.ts <nombre_usuario> <contrasena>');
  process.exit(1);
}

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false },
});

try {
  await pool.query('INSERT INTO usuarios (nombre_usuario, contrasena_hash) VALUES ($1, $2)', [
    nombreUsuario,
    hashearContrasena(contrasena),
  ]);
  console.log(`Usuario "${nombreUsuario}" creado`);
} catch (error) {
  console.error('No se pudo crear el usuario:', error instanceof Error ? error.message : error);
  process.exitCode = 1;
} finally {
  await pool.end();
}
