import pool from '@/lib/db';
import { hashearContrasena, verificarContrasena } from '@/lib/modulos/auth/contrasenas';

// Hash de relleno para gastar el mismo tiempo cuando el usuario no existe
const HASH_RELLENO = hashearContrasena('contrasena-de-relleno');

// Trae un usuario por su nombre de usuario, o null si no existe
export async function obtenerUsuarioPorNombre(nombreUsuario: string) {
  const resultado = await pool.query(
    'SELECT id, nombre_usuario, contrasena_hash FROM usuarios WHERE nombre_usuario = $1',
    [nombreUsuario]
  );
  return resultado.rows[0] || null;
}

// Crea un usuario nuevo guardando solo el hash de su contraseña
export async function crearUsuario(nombreUsuario: string, contrasena: string) {
  const resultado = await pool.query(
    `INSERT INTO usuarios (nombre_usuario, contrasena_hash)
     VALUES ($1, $2) RETURNING id, nombre_usuario`,
    [nombreUsuario, hashearContrasena(contrasena)]
  );
  return resultado.rows[0];
}

// Valida usuario y contraseña. Devuelve el usuario si son correctos, o null sin indicar cuál campo falló
export async function verificarCredenciales(nombreUsuario: string, contrasena: string) {
  const usuario = await obtenerUsuarioPorNombre(nombreUsuario);
  const hashAComparar = usuario ? usuario.contrasena_hash : HASH_RELLENO;
  const esContrasenaCorrecta = verificarContrasena(contrasena, hashAComparar);

  if (!usuario || !esContrasenaCorrecta) return null;

  return { id: usuario.id as number, nombreUsuario: usuario.nombre_usuario as string };
}
