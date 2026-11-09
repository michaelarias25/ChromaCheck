import pool from '@/lib/db';
import {
  buscarLecturasRecientesDeLote,
  buscarMuestraDeLote,
  buscarPaginaHistorial,
  buscarTarrosDeLote,
  buscarUltimasDesviacionesDeLote,
  contarLecturas,
  insertarTarro,
} from './repositorio';

jest.mock('@/lib/db', () => ({ __esModule: true, default: { query: jest.fn() } }));

const consulta = jest.mocked(pool.query) as unknown as jest.Mock;
const TARRO = { id_tarro: 5, lote_id: 1, resultado_hex: '#808080' };

function responderFilas(filas: unknown[]) {
  consulta.mockResolvedValue({ rows: filas, rowCount: filas.length });
}

describe('insertarTarro', () => {
  const datos = {
    loteId: 1,
    resultadoHex: '#808080',
    desviacionDeltaE: 0.39,
    resultado: 'Aprobado',
    esMuestra: false,
  };

  test('inserta con el pool y en el orden de columnas esperado', async () => {
    responderFilas([TARRO]);
    expect(await insertarTarro(datos)).toBe(TARRO);
    expect(consulta).toHaveBeenCalledWith(expect.stringContaining('INSERT INTO tarros'), [
      1,
      '#808080',
      0.39,
      'Aprobado',
      false,
    ]);
  });

  test('usa el cliente de la transacción si se le pasa', async () => {
    const cliente = { query: jest.fn().mockResolvedValue({ rows: [TARRO] }) };
    expect(await insertarTarro(datos, cliente as never)).toBe(TARRO);
    expect(consulta).not.toHaveBeenCalled();
  });
});

test('buscarUltimasDesviacionesDeLote convierte a número y ordena de la más antigua a la más reciente', async () => {
  // La consulta las trae de la más reciente a la más antigua, como texto (NUMERIC)
  responderFilas([
    { desviacion_delta_e: '1.30' },
    { desviacion_delta_e: '0.90' },
    { desviacion_delta_e: '0.30' },
  ]);
  expect(await buscarUltimasDesviacionesDeLote(1, 3)).toEqual([0.3, 0.9, 1.3]);
  expect(consulta).toHaveBeenCalledWith(expect.stringContaining('LIMIT $2'), [1, 3]);
});

test('contarLecturas convierte el total a número', async () => {
  responderFilas([{ total: '13' }]);
  expect(await contarLecturas()).toBe(13);
});

test('buscarPaginaHistorial pasa la cantidad y el desplazamiento', async () => {
  responderFilas([]);
  expect(await buscarPaginaHistorial(6, 12)).toEqual([]);
  expect(consulta).toHaveBeenCalledWith(expect.stringContaining('LIMIT $1 OFFSET $2'), [6, 12]);
});

test('las búsquedas por lote devuelven sus filas', async () => {
  responderFilas([TARRO]);
  expect(await buscarTarrosDeLote(1)).toEqual([TARRO]);
  expect(await buscarLecturasRecientesDeLote(1, 8)).toEqual([TARRO]);
  expect(await buscarMuestraDeLote(1)).toBe(TARRO);
  responderFilas([]);
  expect(await buscarMuestraDeLote(1)).toBeNull();
});
