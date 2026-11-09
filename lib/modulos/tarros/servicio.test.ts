import { ejecutarEnTransaccion } from '@/lib/db';
import { crearAlerta } from '@/lib/modulos/alertas/servicio';
import type { Lote } from '@/lib/modulos/lotes/repositorio';
import { finalizarModoMuestra, obtenerLotePorId, pausarLote } from '@/lib/modulos/lotes/servicio';
import * as repositorio from './repositorio';
import type { Tarro } from './repositorio';
import {
  obtenerHistorialTarros,
  obtenerLecturasRecientesDeLote,
  obtenerMuestraDeLote,
  obtenerTarrosDeLote,
  registrarLecturaDelSensor,
  registrarMuestraDelSensor,
} from './servicio';

jest.mock('./repositorio');
jest.mock('@/lib/db');
jest.mock('@/lib/modulos/alertas/servicio');
jest.mock('@/lib/modulos/lotes/servicio');

const repo = jest.mocked(repositorio);
const mockObtenerLotePorId = jest.mocked(obtenerLotePorId);
const mockFinalizarModoMuestra = jest.mocked(finalizarModoMuestra);
const mockPausarLote = jest.mocked(pausarLote);
const mockCrearAlerta = jest.mocked(crearAlerta);
const clienteTransaccion = { soyElCliente: true };

function crearLote(cambios: Partial<Lote> = {}): Lote {
  return {
    id: 1,
    codigo: 'TEST_lote',
    estado: 'Activo',
    modo_captura: 'Recoleccion',
    fecha_inicio: new Date(),
    ...cambios,
  };
}

function crearTarro(cambios: Partial<Tarro> = {}): Tarro {
  return {
    id_tarro: 10,
    lote_id: 1,
    resultado_hex: '#7850C8',
    desviacion_delta_e: null,
    resultado: 'Muestra',
    es_muestra: true,
    timestamp: new Date(),
    ...cambios,
  };
}

// CP-01/CP-02: muestra (120,80,200) = #7850C8
const MUESTRA = crearTarro();

beforeEach(() => {
  // La transacción ejecuta la operación con un cliente simulado
  jest
    .mocked(ejecutarEnTransaccion)
    .mockImplementation(async (operacion) => operacion(clienteTransaccion as never));
  repo.insertarTarro.mockImplementation(async (datos) =>
    crearTarro({
      id_tarro: 99,
      resultado_hex: datos.resultadoHex,
      desviacion_delta_e: datos.desviacionDeltaE === null ? null : String(datos.desviacionDeltaE),
      resultado: datos.resultado,
      es_muestra: datos.esMuestra,
    })
  );
});

describe('registrarMuestraDelSensor', () => {
  beforeEach(() => {
    mockObtenerLotePorId.mockResolvedValue(crearLote({ modo_captura: 'Muestra' }));
    repo.buscarMuestraDeLote.mockResolvedValue(null);
    mockFinalizarModoMuestra.mockResolvedValue(true);
  });

  test('registra la muestra en la transacción que saca al lote del modo Muestra', async () => {
    const resultado = await registrarMuestraDelSensor(1, '#7850C8');

    expect(resultado).toMatchObject({ tipo: 'registrado', tarro: { es_muestra: true } });
    expect(mockFinalizarModoMuestra).toHaveBeenCalledWith(clienteTransaccion, 1);
    expect(repo.insertarTarro).toHaveBeenCalledWith(
      {
        loteId: 1,
        resultadoHex: '#7850C8',
        desviacionDeltaE: null,
        resultado: 'Muestra',
        esMuestra: true,
      },
      clienteTransaccion
    );
  });

  test('responde loteInexistente si el lote no existe', async () => {
    mockObtenerLotePorId.mockResolvedValue(null);
    expect(await registrarMuestraDelSensor(1, '#7850C8')).toEqual({ tipo: 'loteInexistente' });
    expect(repo.insertarTarro).not.toHaveBeenCalled();
  });

  test('rechaza una segunda muestra', async () => {
    repo.buscarMuestraDeLote.mockResolvedValue(MUESTRA);
    expect(await registrarMuestraDelSensor(1, '#7850C8')).toEqual({
      tipo: 'rechazado',
      mensaje: 'El lote ya tiene un tarro muestra registrado',
    });
  });

  test.each(['Inactivo', 'Recoleccion'] as const)(
    'rechaza la muestra si el lote está en modo %s',
    async (modo) => {
      mockObtenerLotePorId.mockResolvedValue(crearLote({ modo_captura: modo }));
      const resultado = await registrarMuestraDelSensor(1, '#7850C8');
      expect(resultado).toEqual({
        tipo: 'rechazado',
        mensaje: `El lote no está en modo Muestra (modo actual: ${modo}); actívalo desde la web antes de registrar la muestra`,
      });
      expect(ejecutarEnTransaccion).not.toHaveBeenCalled();
    }
  );

  test('rechaza si otra petición sacó al lote del modo Muestra antes de registrar', async () => {
    mockFinalizarModoMuestra.mockResolvedValue(false);
    const resultado = await registrarMuestraDelSensor(1, '#7850C8');
    expect(resultado).toMatchObject({ tipo: 'rechazado' });
    expect(repo.insertarTarro).not.toHaveBeenCalled();
  });
});

describe('registrarLecturaDelSensor', () => {
  beforeEach(() => {
    mockObtenerLotePorId.mockResolvedValue(crearLote());
    repo.buscarMuestraDeLote.mockResolvedValue(MUESTRA);
  });

  test('CP-01: una lectura con ΔE 0,80 se aprueba sin alerta ni consulta del patrón', async () => {
    const resultado = await registrarLecturaDelSensor(1, '#794FC8', [121, 79, 200]);

    expect(resultado).toMatchObject({ tipo: 'registrado' });
    expect(repo.insertarTarro).toHaveBeenCalledWith({
      loteId: 1,
      resultadoHex: '#794FC8',
      desviacionDeltaE: 0.8,
      resultado: 'Aprobado',
      esMuestra: false,
    });
    expect(repo.buscarUltimasDesviacionesDeLote).not.toHaveBeenCalled();
    expect(mockCrearAlerta).not.toHaveBeenCalled();
  });

  test('CP-02 y CP-05: una lectura con ΔE 0,81 sin patrón da solo alerta Amarilla', async () => {
    repo.buscarUltimasDesviacionesDeLote.mockResolvedValue([0.3, 0.3, 0.81]);

    await registrarLecturaDelSensor(1, '#764FC8', [118, 79, 200]);

    expect(repo.insertarTarro).toHaveBeenCalledWith(
      expect.objectContaining({ desviacionDeltaE: 0.81, resultado: 'No Aprobado' })
    );
    expect(repo.buscarUltimasDesviacionesDeLote).toHaveBeenCalledWith(1, 3);
    expect(mockCrearAlerta).toHaveBeenCalledWith(
      99,
      'Amarilla',
      'Desviación aislada de 0.81 ΔE',
      false
    );
    expect(mockPausarLote).not.toHaveBeenCalled();
  });

  test('CP-04: tres lecturas crecientes con la última fuera de tolerancia dan alerta Roja y pausan el lote', async () => {
    repo.buscarUltimasDesviacionesDeLote.mockResolvedValue([0.3, 0.6, 0.81]);

    await registrarLecturaDelSensor(1, '#764FC8', [118, 79, 200]);

    expect(mockCrearAlerta).toHaveBeenCalledWith(
      99,
      'Roja',
      'Desviación acumulativa detectada: revisar mezclador o posibles fugas',
      true
    );
    // pausarLote deja el lote Pausado y su modo de captura en Inactivo en la misma sentencia
    expect(mockPausarLote).toHaveBeenCalledWith(1);
  });

  test('responde loteInexistente si el lote no existe', async () => {
    mockObtenerLotePorId.mockResolvedValue(null);
    expect(await registrarLecturaDelSensor(1, '#794FC8', [121, 79, 200])).toEqual({
      tipo: 'loteInexistente',
    });
  });

  test('rechaza la lectura si el lote no tiene muestra', async () => {
    repo.buscarMuestraDeLote.mockResolvedValue(null);
    expect(await registrarLecturaDelSensor(1, '#794FC8', [121, 79, 200])).toEqual({
      tipo: 'rechazado',
      mensaje: 'El lote no tiene tarro muestra registrado',
    });
  });

  test('rechaza la lectura si el lote está pausado', async () => {
    mockObtenerLotePorId.mockResolvedValue(
      crearLote({ estado: 'Pausado', modo_captura: 'Inactivo' })
    );
    expect(await registrarLecturaDelSensor(1, '#794FC8', [121, 79, 200])).toEqual({
      tipo: 'rechazado',
      mensaje: 'El lote está pausado por una alerta roja y no acepta lecturas',
    });
    expect(repo.insertarTarro).not.toHaveBeenCalled();
  });

  test.each(['Inactivo', 'Muestra'] as const)(
    'rechaza la lectura si el lote está en modo %s',
    async (modo) => {
      mockObtenerLotePorId.mockResolvedValue(crearLote({ modo_captura: modo }));
      const resultado = await registrarLecturaDelSensor(1, '#794FC8', [121, 79, 200]);
      expect(resultado).toEqual({
        tipo: 'rechazado',
        mensaje: `El lote no está en modo Recoleccion (modo actual: ${modo}); actívalo desde la web antes de enviar lecturas`,
      });
    }
  );

  test('si falla la base de datos, el error llega a la ruta (que responde 500)', async () => {
    repo.insertarTarro.mockRejectedValue(new Error('conexión perdida'));
    await expect(registrarLecturaDelSensor(1, '#794FC8', [121, 79, 200])).rejects.toThrow(
      'conexión perdida'
    );
  });
});

describe('consultas', () => {
  test('obtenerHistorialTarros calcula el desplazamiento de la página', async () => {
    repo.buscarPaginaHistorial.mockResolvedValue([]);
    repo.contarLecturas.mockResolvedValue(13);

    expect(await obtenerHistorialTarros(3, 6)).toEqual({ tarros: [], totalTarros: 13 });
    expect(repo.buscarPaginaHistorial).toHaveBeenCalledWith(6, 12);
  });

  test('delegan en el repositorio', async () => {
    repo.buscarTarrosDeLote.mockResolvedValue([MUESTRA]);
    repo.buscarLecturasRecientesDeLote.mockResolvedValue([]);
    repo.buscarMuestraDeLote.mockResolvedValue(MUESTRA);

    expect(await obtenerTarrosDeLote(1)).toEqual([MUESTRA]);
    expect(await obtenerLecturasRecientesDeLote(1, 8)).toEqual([]);
    expect(repo.buscarLecturasRecientesDeLote).toHaveBeenCalledWith(1, 8);
    expect(await obtenerMuestraDeLote(1)).toBe(MUESTRA);
  });
});
