import { DURACION_COOKIE_TEMA_SEGUNDOS, leerTema } from './tema';

test('la cookie "oscuro" da el tema oscuro', () => {
  expect(leerTema('oscuro')).toBe('oscuro');
});

test.each([undefined, '', 'claro', 'rojo', 'OSCURO'])(
  'sin cookie o con un valor desconocido %p el tema es claro',
  (valorCookie) => {
    expect(leerTema(valorCookie)).toBe('claro');
  }
);

test('la cookie dura 1 año', () => {
  expect(DURACION_COOKIE_TEMA_SEGUNDOS).toBe(31_536_000);
});
