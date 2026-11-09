import pool from '@/lib/db';
import { hashearContrasena } from './contrasenas';
import { crearUsuario, obtenerUsuarioPorNombre, verificarCredenciales } from './servicio';

jest.mock('@/lib/db', () => ({ __esModule: true, default: { query: jest.fn() } }));

const consulta = jest.mocked(pool.query) as unknown as jest.Mock;

describe('verificarCredenciales', () => {
  const usuario = {
    id: 4,
    nombre_usuario: 'operario',
    contrasena_hash: hashearContrasena('clave'),
  };

  test('devuelve el usuario si la contraseña es correcta', async () => {
    consulta.mockResolvedValue({ rows: [usuario] });
    expect(await verificarCredenciales('operario', 'clave')).toEqual({
      id: 4,
      nombreUsuario: 'operario',
    });
  });

  test('devuelve null si la contraseña es incorrecta', async () => {
    consulta.mockResolvedValue({ rows: [usuario] });
    expect(await verificarCredenciales('operario', 'otra')).toBeNull();
  });

  test('devuelve null si el usuario no existe, sin indicar qué campo falló', async () => {
    consulta.mockResolvedValue({ rows: [] });
    expect(await verificarCredenciales('nadie', 'clave')).toBeNull();
  });
});

test('obtenerUsuarioPorNombre devuelve null si no existe', async () => {
  consulta.mockResolvedValue({ rows: [] });
  expect(await obtenerUsuarioPorNombre('nadie')).toBeNull();
});

test('crearUsuario guarda solo el hash de la contraseña', async () => {
  consulta.mockResolvedValue({ rows: [{ id: 5, nombre_usuario: 'nuevo' }] });
  expect(await crearUsuario('nuevo', 'clave')).toEqual({ id: 5, nombre_usuario: 'nuevo' });
  const [, parametros] = consulta.mock.calls[0];
  expect(parametros[0]).toBe('nuevo');
  expect(parametros[1]).not.toBe('clave');
  expect(parametros[1]).toMatch(/^[0-9a-f]+:[0-9a-f]+$/);
});
