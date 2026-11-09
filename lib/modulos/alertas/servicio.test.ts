import * as repositorio from './repositorio';
import { crearAlerta, obtenerAlertasDeLote } from './servicio';

jest.mock('./repositorio');

const repo = jest.mocked(repositorio);

test('crearAlerta guarda la alerta del tarro con su nivel y si congela el registro', async () => {
  await crearAlerta(7, 'Roja', 'Desviación acumulativa', true);
  expect(repo.insertarAlerta).toHaveBeenCalledWith({
    tarroId: 7,
    nivel: 'Roja',
    mensaje: 'Desviación acumulativa',
    congelaRegistro: true,
  });
});

test('obtenerAlertasDeLote devuelve las alertas del lote', async () => {
  repo.buscarAlertasDeLote.mockResolvedValue([]);
  expect(await obtenerAlertasDeLote(3)).toEqual([]);
  expect(repo.buscarAlertasDeLote).toHaveBeenCalledWith(3);
});
