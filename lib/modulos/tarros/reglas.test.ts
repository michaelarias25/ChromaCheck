import {
  calcularDesviacionDeltaE,
  construirAlerta,
  convertirHexARgb,
  convertirRgbALab,
  crearMensajeSinModoMuestra,
  excedeToleranciaDeltaE,
  formanPatronAcumulativo,
  obtenerMotivoRechazoLectura,
  obtenerMotivoRechazoMuestra,
  obtenerNivelAlerta,
  obtenerResultadoLectura,
  UMBRAL_TOLERANCIA_DELTA_E,
} from './reglas';

// Margen aceptado entre el deltaE calculado y el documentado en CP-03
const MARGEN_DELTA_E = 0.5;

describe('casos de prueba documentados (CP)', () => {
  test('CP-01: muestra (120,80,200) y lectura (121,79,200) dan ΔE 0,80 y se aprueba', () => {
    const desviacion = calcularDesviacionDeltaE([120, 80, 200], [121, 79, 200]);
    expect(desviacion).toBe(0.8);
    expect(obtenerResultadoLectura(desviacion)).toBe('Aprobado');
    expect(obtenerNivelAlerta(desviacion, false)).toBeNull();
  });

  test('CP-02: lectura (118,79,200) da ΔE 0,81 y no se aprueba', () => {
    const desviacion = calcularDesviacionDeltaE([120, 80, 200], [118, 79, 200]);
    expect(desviacion).toBe(0.81);
    expect(obtenerResultadoLectura(desviacion)).toBe('No Aprobado');
  });

  test.each([
    { muestra: [255, 0, 0], lectura: [250, 0, 0], esperado: 1.87 },
    { muestra: [100, 100, 100], lectura: [110, 100, 100], esperado: 4.31 },
    { muestra: [0, 0, 0], lectura: [255, 255, 255], esperado: 100 },
  ] as const)(
    'CP-03: $muestra frente a $lectura da ΔE $esperado (margen < 0,5)',
    ({ muestra, lectura, esperado }) => {
      const desviacion = calcularDesviacionDeltaE([...muestra], [...lectura]);
      expect(Math.abs(desviacion - esperado)).toBeLessThan(MARGEN_DELTA_E);
    }
  );

  test('CP-04: ΔE 0,3 → 0,9 → 1,3 forma un patrón acumulativo y da alerta Roja', () => {
    const esPatron = formanPatronAcumulativo([0.3, 0.9, 1.3]);
    expect(esPatron).toBe(true);
    expect(obtenerNivelAlerta(1.3, esPatron)).toBe('Roja');
  });

  test('CP-05: ΔE 0,3 → 0,3 → 0,9 no forma patrón y da solo alerta Amarilla', () => {
    const esPatron = formanPatronAcumulativo([0.3, 0.3, 0.9]);
    expect(esPatron).toBe(false);
    expect(obtenerNivelAlerta(0.9, esPatron)).toBe('Amarilla');
  });
});

describe('calcularDesviacionDeltaE', () => {
  test('dos colores iguales tienen ΔE 0', () => {
    expect(calcularDesviacionDeltaE([227, 83, 55], [227, 83, 55])).toBe(0);
  });

  test('redondea a 2 decimales', () => {
    const desviacion = calcularDesviacionDeltaE([128, 128, 128], [131, 131, 131]);
    expect(desviacion).toBe(Math.round(desviacion * 100) / 100);
  });
});

describe('convertirRgbALab', () => {
  test('el blanco es L=100 y el negro L=0, ambos sin color', () => {
    const blanco = convertirRgbALab(255, 255, 255);
    expect(blanco.l).toBeCloseTo(100, 1);
    expect(blanco.a).toBeCloseTo(0, 1);
    expect(blanco.b).toBeCloseTo(0, 1);
    expect(convertirRgbALab(0, 0, 0).l).toBeCloseTo(0, 5);
  });

  test('usa la aproximación lineal en canales muy oscuros', () => {
    expect(convertirRgbALab(5, 5, 5).l).toBeGreaterThan(0);
  });
});

describe('tolerancia y resultado (umbral 0,8)', () => {
  test('el umbral es 0,8 (ACQ-04)', () => {
    expect(UMBRAL_TOLERANCIA_DELTA_E).toBe(0.8);
  });

  test('0,8 está dentro de la tolerancia; 0,81 la supera', () => {
    expect(excedeToleranciaDeltaE(0.8)).toBe(false);
    expect(excedeToleranciaDeltaE(0.81)).toBe(true);
  });

  test('acepta otro límite', () => {
    expect(excedeToleranciaDeltaE(1, 2)).toBe(false);
  });
});

describe('convertirHexARgb', () => {
  test('convierte con o sin #', () => {
    expect(convertirHexARgb('#E35336')).toEqual([227, 83, 54]);
    expect(convertirHexARgb('0005ff')).toEqual([0, 5, 255]);
  });
});

describe('formanPatronAcumulativo', () => {
  test('con menos de 3 lecturas no hay patrón', () => {
    expect(formanPatronAcumulativo([])).toBe(false);
    expect(formanPatronAcumulativo([0.9, 1.3])).toBe(false);
  });

  test('crecientes pero con la última dentro de tolerancia no es patrón', () => {
    expect(formanPatronAcumulativo([0.1, 0.4, 0.8])).toBe(false);
  });

  test('una bajada rompe el patrón', () => {
    expect(formanPatronAcumulativo([0.9, 0.5, 1.3])).toBe(false);
  });

  test('solo cuentan las 3 lecturas más recientes', () => {
    expect(formanPatronAcumulativo([5, 0.3, 0.9, 1.3])).toBe(true);
  });
});

describe('construirAlerta', () => {
  test('la Roja congela el registro y avisa del patrón acumulativo', () => {
    expect(construirAlerta('Roja', 1.3)).toEqual({
      nivel: 'Roja',
      mensaje: 'Desviación acumulativa detectada: revisar mezclador o posibles fugas',
      congelaRegistro: true,
    });
  });

  test('la Amarilla no congela e incluye el deltaE', () => {
    expect(construirAlerta('Amarilla', 0.95)).toEqual({
      nivel: 'Amarilla',
      mensaje: 'Desviación aislada de 0.95 ΔE',
      congelaRegistro: false,
    });
  });
});

describe('obtenerMotivoRechazoMuestra', () => {
  const loteEnMuestra = { estado: 'Activo', modoCaptura: 'Muestra', tieneMuestra: false };

  test('acepta la muestra en modo Muestra si aún no tiene', () => {
    expect(obtenerMotivoRechazoMuestra(loteEnMuestra)).toBeNull();
  });

  test('rechaza una segunda muestra', () => {
    expect(obtenerMotivoRechazoMuestra({ ...loteEnMuestra, tieneMuestra: true })).toBe(
      'El lote ya tiene un tarro muestra registrado'
    );
  });

  test.each(['Inactivo', 'Recoleccion'])('rechaza la muestra en modo %s', (modoCaptura) => {
    expect(obtenerMotivoRechazoMuestra({ ...loteEnMuestra, modoCaptura })).toBe(
      crearMensajeSinModoMuestra(modoCaptura)
    );
  });

  test('el mensaje indica el modo actual', () => {
    expect(crearMensajeSinModoMuestra('Inactivo')).toBe(
      'El lote no está en modo Muestra (modo actual: Inactivo); actívalo desde la web antes de registrar la muestra'
    );
  });
});

describe('obtenerMotivoRechazoLectura', () => {
  const loteRecolectando = { estado: 'Activo', modoCaptura: 'Recoleccion', tieneMuestra: true };

  test('acepta la lectura de un lote activo, con muestra y en Recoleccion', () => {
    expect(obtenerMotivoRechazoLectura(loteRecolectando)).toBeNull();
  });

  test('rechaza la lectura sin muestra', () => {
    expect(obtenerMotivoRechazoLectura({ ...loteRecolectando, tieneMuestra: false })).toBe(
      'El lote no tiene tarro muestra registrado'
    );
  });

  test('rechaza la lectura de un lote pausado', () => {
    expect(obtenerMotivoRechazoLectura({ ...loteRecolectando, estado: 'Pausado' })).toBe(
      'El lote está pausado por una alerta roja y no acepta lecturas'
    );
  });

  test.each(['Inactivo', 'Muestra'])('rechaza la lectura en modo %s', (modoCaptura) => {
    expect(obtenerMotivoRechazoLectura({ ...loteRecolectando, modoCaptura })).toBe(
      `El lote no está en modo Recoleccion (modo actual: ${modoCaptura}); actívalo desde la web antes de enviar lecturas`
    );
  });
});
