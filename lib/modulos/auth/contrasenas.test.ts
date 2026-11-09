import { hashearContrasena, verificarContrasena } from './contrasenas';

test('el hash tiene el formato sal:hash y nunca contiene la contraseña', () => {
  const hash = hashearContrasena('clave-secreta');
  expect(hash).toMatch(/^[0-9a-f]{32}:[0-9a-f]{128}$/);
  expect(hash).not.toContain('clave-secreta');
});

test('la misma contraseña da hashes distintos por la sal aleatoria', () => {
  expect(hashearContrasena('clave')).not.toBe(hashearContrasena('clave'));
});

test('verifica la contraseña correcta y rechaza la incorrecta', () => {
  const hash = hashearContrasena('clave-secreta');
  expect(verificarContrasena('clave-secreta', hash)).toBe(true);
  expect(verificarContrasena('otra-clave', hash)).toBe(false);
});

test.each(['', 'sin-separador', ':solo-hash', 'solo-sal:'])(
  'rechaza un hash guardado mal formado %p',
  (hashGuardado) => {
    expect(verificarContrasena('clave', hashGuardado)).toBe(false);
  }
);
