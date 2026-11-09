import {
  crearMensajeOtroLoteCapturando,
  esModoCapturaValido,
  obtenerMotivoRechazoModoCaptura,
  puedeRegistrarLectura,
  puedeRegistrarMuestra,
} from './reglas';

describe('esModoCapturaValido', () => {
  test.each(['Inactivo', 'Muestra', 'Recoleccion'])('acepta %s', (modo) => {
    expect(esModoCapturaValido(modo)).toBe(true);
  });

  test.each(['inactivo', 'Otro', '', null, 3])('rechaza %p', (valor) => {
    expect(esModoCapturaValido(valor)).toBe(false);
  });
});

describe('puedeRegistrarMuestra y puedeRegistrarLectura', () => {
  test('la muestra solo se acepta en modo Muestra', () => {
    expect(puedeRegistrarMuestra('Muestra')).toBe(true);
    expect(puedeRegistrarMuestra('Recoleccion')).toBe(false);
    expect(puedeRegistrarMuestra('Inactivo')).toBe(false);
  });

  test('las lecturas solo se aceptan en modo Recoleccion', () => {
    expect(puedeRegistrarLectura('Recoleccion')).toBe(true);
    expect(puedeRegistrarLectura('Muestra')).toBe(false);
    expect(puedeRegistrarLectura('Inactivo')).toBe(false);
  });
});

describe('obtenerMotivoRechazoModoCaptura', () => {
  const activoSinMuestra = { estado: 'Activo', tieneMuestra: false };
  const activoConMuestra = { estado: 'Activo', tieneMuestra: true };
  const pausado = { estado: 'Pausado', tieneMuestra: true };

  test('detener la captura siempre está permitido, incluso pausado', () => {
    expect(obtenerMotivoRechazoModoCaptura('Inactivo', pausado)).toBeNull();
    expect(obtenerMotivoRechazoModoCaptura('Inactivo', activoSinMuestra)).toBeNull();
  });

  test('un lote pausado no puede capturar', () => {
    expect(obtenerMotivoRechazoModoCaptura('Recoleccion', pausado)).toBe(
      'El lote está Pausado y no puede capturar lecturas'
    );
  });

  test('Muestra solo si el lote aún no tiene muestra', () => {
    expect(obtenerMotivoRechazoModoCaptura('Muestra', activoSinMuestra)).toBeNull();
    expect(obtenerMotivoRechazoModoCaptura('Muestra', activoConMuestra)).toBe(
      'El lote ya tiene muestra registrada; usa el modo Recoleccion'
    );
  });

  test('Recoleccion solo si el lote ya tiene muestra', () => {
    expect(obtenerMotivoRechazoModoCaptura('Recoleccion', activoConMuestra)).toBeNull();
    expect(obtenerMotivoRechazoModoCaptura('Recoleccion', activoSinMuestra)).toBe(
      'El lote no tiene muestra registrada; captura primero la muestra con el modo Muestra'
    );
  });
});

test('crearMensajeOtroLoteCapturando nombra el lote y su modo', () => {
  expect(crearMensajeOtroLoteCapturando('#001_Terracota', 'Muestra')).toBe(
    'El lote "#001_Terracota" ya está capturando en modo Muestra; detén esa captura antes de iniciar otra'
  );
});
