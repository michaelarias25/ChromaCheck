import * as repositorio from './repositorio';
import type { Lote, LoteConMuestra } from './repositorio';
import {
  cambiarModoCaptura,
  crearLote,
  finalizarModoMuestra,
  obtenerCapturaActiva,
  obtenerLotePorId,
  obtenerLotes,
  obtenerLotesConResumen,
  pausarLote,
} from './servicio';

jest.mock('./repositorio');

const repo = jest.mocked(repositorio);

function crearLoteDePrueba(cambios: Partial<LoteConMuestra> = {}): LoteConMuestra {
  return {
    id: 1,
    codigo: 'TEST_A',
    estado: 'Activo',
    modo_captura: 'Inactivo',
    fecha_inicio: new Date(),
    tiene_muestra: false,
    ...cambios,
  };
}

const OTRO_LOTE: Lote = {
  id: 2,
  codigo: 'TEST_B',
  estado: 'Activo',
  modo_captura: 'Recoleccion',
  fecha_inicio: new Date(),
};

describe('cambiarModoCaptura', () => {
  beforeEach(() => {
    repo.buscarLoteConMuestra.mockResolvedValue(crearLoteDePrueba());
    repo.buscarLoteCapturando.mockResolvedValue(null);
    repo.actualizarModoCaptura.mockImplementation(async (loteId, modo) => ({
      ...crearLoteDePrueba({ id: loteId }),
      modo_captura: modo,
    }));
  });

  test('pone en modo Muestra un lote activo sin muestra', async () => {
    const resultado = await cambiarModoCaptura(1, 'Muestra');
    expect(resultado).toMatchObject({ tipo: 'cambiado', lote: { modo_captura: 'Muestra' } });
    expect(repo.actualizarModoCaptura).toHaveBeenCalledWith(1, 'Muestra');
  });

  test('pone en modo Recoleccion un lote activo con muestra', async () => {
    repo.buscarLoteConMuestra.mockResolvedValue(crearLoteDePrueba({ tiene_muestra: true }));
    const resultado = await cambiarModoCaptura(1, 'Recoleccion');
    expect(resultado).toMatchObject({ tipo: 'cambiado', lote: { modo_captura: 'Recoleccion' } });
  });

  test('responde loteInexistente si el lote no existe', async () => {
    repo.buscarLoteConMuestra.mockResolvedValue(null);
    expect(await cambiarModoCaptura(1, 'Muestra')).toEqual({ tipo: 'loteInexistente' });
    expect(repo.actualizarModoCaptura).not.toHaveBeenCalled();
  });

  test('rechaza el cambio si las reglas no lo permiten (Recoleccion sin muestra)', async () => {
    const resultado = await cambiarModoCaptura(1, 'Recoleccion');
    expect(resultado).toEqual({
      tipo: 'rechazado',
      mensaje:
        'El lote no tiene muestra registrada; captura primero la muestra con el modo Muestra',
    });
    expect(repo.actualizarModoCaptura).not.toHaveBeenCalled();
  });

  test('rechaza iniciar si otro lote ya está capturando', async () => {
    repo.buscarLoteCapturando.mockResolvedValue(OTRO_LOTE);
    const resultado = await cambiarModoCaptura(1, 'Muestra');
    expect(resultado).toEqual({
      tipo: 'rechazado',
      mensaje:
        'El lote "TEST_B" ya está capturando en modo Recoleccion; detén esa captura antes de iniciar otra',
    });
    expect(repo.actualizarModoCaptura).not.toHaveBeenCalled();
  });

  test('permite cambiar el modo del mismo lote que ya está capturando', async () => {
    repo.buscarLoteConMuestra.mockResolvedValue(crearLoteDePrueba({ tiene_muestra: true }));
    repo.buscarLoteCapturando.mockResolvedValue({ ...OTRO_LOTE, id: 1 });
    expect(await cambiarModoCaptura(1, 'Recoleccion')).toMatchObject({ tipo: 'cambiado' });
  });

  test('detener (Inactivo) no revisa si otro lote está capturando', async () => {
    repo.buscarLoteConMuestra.mockResolvedValue(crearLoteDePrueba({ estado: 'Pausado' }));
    expect(await cambiarModoCaptura(1, 'Inactivo')).toMatchObject({ tipo: 'cambiado' });
    expect(repo.buscarLoteCapturando).not.toHaveBeenCalled();
  });

  test('si otro lote empezó a capturar al mismo tiempo, rechaza nombrándolo', async () => {
    repo.actualizarModoCaptura.mockResolvedValue(null);
    repo.buscarLoteCapturando.mockResolvedValueOnce(null).mockResolvedValueOnce(OTRO_LOTE);
    const resultado = await cambiarModoCaptura(1, 'Muestra');
    expect(resultado).toMatchObject({ tipo: 'rechazado' });
    expect(resultado).toHaveProperty('mensaje', expect.stringContaining('"TEST_B"'));
  });

  test('si la carrera ya terminó cuando se consulta, pide intentar de nuevo', async () => {
    repo.actualizarModoCaptura.mockResolvedValue(null);
    expect(await cambiarModoCaptura(1, 'Muestra')).toEqual({
      tipo: 'rechazado',
      mensaje: 'Otro lote empezó a capturar al mismo tiempo; intenta de nuevo',
    });
  });

  test('los errores de la base de datos se propagan', async () => {
    repo.buscarLoteConMuestra.mockRejectedValue(new Error('sin conexión'));
    await expect(cambiarModoCaptura(1, 'Muestra')).rejects.toThrow('sin conexión');
  });
});

describe('obtenerCapturaActiva', () => {
  test('devuelve null si ningún lote está capturando', async () => {
    repo.buscarLoteCapturando.mockResolvedValue(null);
    expect(await obtenerCapturaActiva()).toBeNull();
  });

  test('devuelve el lote y su modo con el formato que consulta el puente', async () => {
    repo.buscarLoteCapturando.mockResolvedValue(OTRO_LOTE);
    expect(await obtenerCapturaActiva()).toEqual({
      loteId: 2,
      codigo: 'TEST_B',
      modo: 'Recoleccion',
    });
  });
});

describe('operaciones que delegan en el repositorio', () => {
  test('pausarLote pausa y detiene la captura en una sola operación', async () => {
    const lotePausado = { ...OTRO_LOTE, estado: 'Pausado', modo_captura: 'Inactivo' as const };
    repo.pausarLoteYDetenerCaptura.mockResolvedValue(lotePausado);
    expect(await pausarLote(2)).toBe(lotePausado);
    expect(repo.pausarLoteYDetenerCaptura).toHaveBeenCalledWith(2);
  });

  test('finalizarModoMuestra usa el cliente de la transacción', async () => {
    const cliente = {} as never;
    repo.detenerCapturaDeMuestra.mockResolvedValue(true);
    expect(await finalizarModoMuestra(cliente, 1)).toBe(true);
    expect(repo.detenerCapturaDeMuestra).toHaveBeenCalledWith(cliente, 1);
  });

  test('crear y consultar lotes', async () => {
    repo.insertarLote.mockResolvedValue(null);
    repo.buscarLotes.mockResolvedValue([OTRO_LOTE]);
    repo.buscarLotePorId.mockResolvedValue(OTRO_LOTE);
    repo.buscarLotesConResumen.mockResolvedValue([]);

    expect(await crearLote('TEST_B')).toBeNull();
    expect(await obtenerLotes()).toEqual([OTRO_LOTE]);
    expect(await obtenerLotePorId(2)).toBe(OTRO_LOTE);
    expect(await obtenerLotesConResumen()).toEqual([]);
  });
});
