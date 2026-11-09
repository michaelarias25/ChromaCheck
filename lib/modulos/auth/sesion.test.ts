import { createHmac } from 'node:crypto';
import type { NextRequest } from 'next/server';
import {
  crearTokenSesion,
  DURACION_SESION_SEGUNDOS,
  NOMBRE_COOKIE_SESION,
  obtenerIdUsuarioDePeticion,
  verificarTokenSesion,
} from './sesion';

// Clave solo para las pruebas: no depende de .env.local
const SECRETO_DE_PRUEBA = 'secreto-de-prueba-con-mas-de-32-caracteres';
const secretoOriginal = process.env.AUTH_SECRET;

beforeEach(() => {
  process.env.AUTH_SECRET = SECRETO_DE_PRUEBA;
});

afterAll(() => {
  process.env.AUTH_SECRET = secretoOriginal;
});

// Firma una carga cualquiera como lo hace crearTokenSesion
function firmar(carga: string) {
  return `${carga}.${createHmac('sha256', SECRETO_DE_PRUEBA).update(carga).digest('hex')}`;
}

function crearPeticion(token?: string) {
  return {
    cookies: {
      get: (nombre: string) =>
        nombre === NOMBRE_COOKIE_SESION && token ? { value: token } : undefined,
    },
  } as unknown as NextRequest;
}

test('un token recién creado devuelve el id del usuario', async () => {
  const token = await crearTokenSesion(7);
  expect(token.split('.')).toHaveLength(3);
  expect(await verificarTokenSesion(token)).toBe(7);
});

test('un token vencido no es válido', async () => {
  const token = await crearTokenSesion(7);
  const despuesDeVencer = Date.now() + (DURACION_SESION_SEGUNDOS + 1) * 1000;
  jest.spyOn(Date, 'now').mockReturnValue(despuesDeVencer);
  expect(await verificarTokenSesion(token)).toBeNull();
  jest.restoreAllMocks();
});

test('un token con la firma alterada no es válido', async () => {
  const token = await crearTokenSesion(7);
  const alterado = token.replace(/^7\./, '8.');
  expect(await verificarTokenSesion(alterado)).toBeNull();
});

test.each([undefined, '', 'sin-puntos', 'a.b.c.d', '1.2.zz', '1.2.abc'])(
  'rechaza el token mal formado %p',
  async (token) => {
    expect(await verificarTokenSesion(token)).toBeNull();
  }
);

test('rechaza un token bien firmado cuyo id no es entero', async () => {
  const expira = Math.floor(Date.now() / 1000) + 60;
  expect(await verificarTokenSesion(firmar(`abc.${expira}`))).toBeNull();
});

test('exige AUTH_SECRET de al menos 32 caracteres', async () => {
  process.env.AUTH_SECRET = 'corto';
  await expect(crearTokenSesion(7)).rejects.toThrow('AUTH_SECRET');
});

test('obtenerIdUsuarioDePeticion lee la cookie de sesión', async () => {
  expect(await obtenerIdUsuarioDePeticion(crearPeticion(await crearTokenSesion(3)))).toBe(3);
  expect(await obtenerIdUsuarioDePeticion(crearPeticion())).toBeNull();
});
