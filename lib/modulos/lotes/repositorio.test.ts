import pool from '@/lib/db';
import {
  actualizarModoCaptura,
  buscarLoteCapturando,
  buscarLoteConMuestra,
  buscarLotePorId,
  buscarLotes,
  buscarLotesConResumen,
  detenerCapturaDeMuestra,
  insertarLote,
  pausarLoteYDetenerCaptura,
} from './repositorio';

jest.mock('@/lib/db', () => ({ __esModule: true, default: { query: jest.fn() } }));

const consulta = jest.mocked(pool.query) as unknown as jest.Mock;
const LOTE = { id: 1, codigo: 'TEST_A', estado: 'Activo', modo_captura: 'Inactivo' };

function responderFilas(filas: unknown[], rowCount = filas.length) {
  consulta.mockResolvedValue({ rows: filas, rowCount });
}

function crearErrorPostgres(code: string, constraint?: string) {
  return Object.assign(new Error('error de PostgreSQL'), { code, constraint });
}

describe('insertarLote', () => {
  test('inserta el código y devuelve el lote', async () => {
    responderFilas([LOTE]);
    expect(await insertarLote('TEST_A')).toBe(LOTE);
    expect(consulta).toHaveBeenCalledWith(expect.stringContaining('INSERT INTO lotes'), ['TEST_A']);
  });

  test('devuelve null si el código ya existe (23505)', async () => {
    consulta.mockRejectedValue(crearErrorPostgres('23505', 'lotes_codigo_unico'));
    expect(await insertarLote('TEST_A')).toBeNull();
  });

  test('propaga los demás errores', async () => {
    consulta.mockRejectedValue(crearErrorPostgres('08006'));
    await expect(insertarLote('TEST_A')).rejects.toThrow('error de PostgreSQL');
    consulta.mockRejectedValue('texto que no es un error');
    await expect(insertarLote('TEST_A')).rejects.toBe('texto que no es un error');
  });
});

describe('actualizarModoCaptura', () => {
  test('cambia el modo y devuelve el lote', async () => {
    responderFilas([{ ...LOTE, modo_captura: 'Muestra' }]);
    expect(await actualizarModoCaptura(1, 'Muestra')).toMatchObject({ modo_captura: 'Muestra' });
    expect(consulta).toHaveBeenCalledWith(expect.stringContaining('SET modo_captura'), [
      'Muestra',
      1,
    ]);
  });

  test('devuelve null si el lote no existe', async () => {
    responderFilas([]);
    expect(await actualizarModoCaptura(1, 'Muestra')).toBeNull();
  });

  test('devuelve null si el índice lotes_un_lote_capturando lo impide', async () => {
    consulta.mockRejectedValue(crearErrorPostgres('23505', 'lotes_un_lote_capturando'));
    expect(await actualizarModoCaptura(1, 'Muestra')).toBeNull();
  });

  test('propaga una violación de unicidad de otro índice', async () => {
    consulta.mockRejectedValue(crearErrorPostgres('23505', 'otro_indice'));
    await expect(actualizarModoCaptura(1, 'Muestra')).rejects.toThrow();
  });
});

describe('detenerCapturaDeMuestra', () => {
  test('usa el cliente de la transacción y solo cambia lotes Activos en modo Muestra', async () => {
    const cliente = { query: jest.fn().mockResolvedValue({ rows: [], rowCount: 1 }) };
    expect(await detenerCapturaDeMuestra(cliente as never, 1)).toBe(true);
    expect(cliente.query).toHaveBeenCalledWith(
      expect.stringMatching(/modo_captura = 'Muestra' AND estado = 'Activo'/),
      ['Inactivo', 1]
    );
  });

  test('devuelve false si el lote ya no estaba en modo Muestra', async () => {
    const cliente = { query: jest.fn().mockResolvedValue({ rows: [], rowCount: 0 }) };
    expect(await detenerCapturaDeMuestra(cliente as never, 1)).toBe(false);
  });
});

test('pausarLoteYDetenerCaptura pausa el lote y lo deja Inactivo en una sola sentencia', async () => {
  responderFilas([{ ...LOTE, estado: 'Pausado' }]);
  expect(await pausarLoteYDetenerCaptura(1)).toMatchObject({ estado: 'Pausado' });
  expect(consulta).toHaveBeenCalledWith(
    expect.stringMatching(/SET estado = 'Pausado', modo_captura = \$1/),
    ['Inactivo', 1]
  );
  responderFilas([]);
  expect(await pausarLoteYDetenerCaptura(1)).toBeNull();
});

describe('búsquedas', () => {
  test('buscarLoteConMuestra y buscarLotePorId devuelven null si no hay filas', async () => {
    responderFilas([]);
    expect(await buscarLoteConMuestra(1)).toBeNull();
    expect(await buscarLotePorId(1)).toBeNull();
  });

  test('buscarLoteCapturando busca un lote con modo distinto de Inactivo', async () => {
    responderFilas([LOTE]);
    expect(await buscarLoteCapturando()).toBe(LOTE);
    expect(consulta).toHaveBeenCalledWith(expect.stringContaining('modo_captura <> $1'), [
      'Inactivo',
    ]);
    responderFilas([]);
    expect(await buscarLoteCapturando()).toBeNull();
  });

  test('las listas devuelven las filas', async () => {
    responderFilas([LOTE]);
    expect(await buscarLotes()).toEqual([LOTE]);
    expect(await buscarLotesConResumen()).toEqual([LOTE]);
    expect(await buscarLoteConMuestra(1)).toBe(LOTE);
    expect(await buscarLotePorId(1)).toBe(LOTE);
  });
});
