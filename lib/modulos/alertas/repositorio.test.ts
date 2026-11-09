import pool from '@/lib/db';
import { buscarAlertasDeLote, insertarAlerta } from './repositorio';

jest.mock('@/lib/db', () => ({ __esModule: true, default: { query: jest.fn() } }));

const consulta = jest.mocked(pool.query) as unknown as jest.Mock;

test('insertarAlerta guarda la alerta con sus datos', async () => {
  const alerta = { id: 1, tarro_id: 7, nivel: 'Amarilla' };
  consulta.mockResolvedValue({ rows: [alerta] });

  const datos = {
    tarroId: 7,
    nivel: 'Amarilla' as const,
    mensaje: 'Aislada',
    congelaRegistro: false,
  };
  expect(await insertarAlerta(datos)).toBe(alerta);
  expect(consulta).toHaveBeenCalledWith(expect.stringContaining('INSERT INTO alertas'), [
    7,
    'Amarilla',
    'Aislada',
    false,
  ]);
});

test('buscarAlertasDeLote busca por el lote de los tarros, de la más reciente', async () => {
  consulta.mockResolvedValue({ rows: [] });
  expect(await buscarAlertasDeLote(3)).toEqual([]);
  expect(consulta).toHaveBeenCalledWith(expect.stringMatching(/ORDER BY a.timestamp DESC/), [3]);
});
