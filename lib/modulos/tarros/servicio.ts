import { ejecutarEnTransaccion } from '@/lib/db';
import { crearAlerta } from '@/lib/modulos/alertas/servicio';
import { finalizarModoMuestra, pausarLote } from '@/lib/modulos/lotes/servicio';
import {
  buscarLecturasRecientesDeLote,
  buscarMuestraDeLote,
  buscarPaginaHistorial,
  buscarTarrosDeLote,
  buscarUltimasDesviacionesDeLote,
  contarLecturas,
  insertarTarro,
} from './repositorio';
import {
  calcularDesviacionDeltaE,
  construirAlerta,
  convertirHexARgb,
  formanPatronAcumulativo,
  LECTURAS_PATRON_ACUMULATIVO,
  obtenerNivelAlerta,
  obtenerResultadoLectura,
  RESULTADO_MUESTRA,
  type ColorRgb,
} from './reglas';

// Trae todos los tarros de un lote específico
export async function obtenerTarrosDeLote(loteId: number) {
  return buscarTarrosDeLote(loteId);
}

// Trae las lecturas más recientes de un lote (sin la muestra), de la más nueva a la más antigua
export async function obtenerLecturasRecientesDeLote(loteId: number, cantidad: number) {
  return buscarLecturasRecientesDeLote(loteId, cantidad);
}

// Trae el tarro muestra (referencia) de un lote
export async function obtenerMuestraDeLote(loteId: number) {
  return buscarMuestraDeLote(loteId);
}

// Trae una página del historial general de tarros con el código de su lote,
// junto con el total de tarros para calcular cuántas páginas hay
export async function obtenerHistorialTarros(pagina: number, tarrosPorPagina: number) {
  const desplazamiento = (pagina - 1) * tarrosPorPagina;
  const [tarros, totalTarros] = await Promise.all([
    buscarPaginaHistorial(tarrosPorPagina, desplazamiento),
    contarLecturas(),
  ]);
  return { tarros, totalTarros };
}

// Registra el tarro muestra y deja el lote en modo 'Inactivo', en una sola transacción.
// Devuelve null si el lote no está en modo 'Muestra' (por ejemplo, otra petición ya registró la muestra)
export async function registrarMuestraDeLote(loteId: number, resultadoHex: string) {
  return ejecutarEnTransaccion(async (cliente) => {
    const estabaEnModoMuestra = await finalizarModoMuestra(cliente, loteId);
    if (!estabaEnModoMuestra) return null;
    return insertarTarro(
      {
        loteId,
        resultadoHex,
        desviacionDeltaE: null,
        resultado: RESULTADO_MUESTRA,
        esMuestra: true,
      },
      cliente
    );
  });
}

// Orquesta el registro completo de una lectura: calcula deltaE, decide resultado y genera alerta si aplica
export async function registrarLecturaTarro(loteId: number, resultadoHex: string, rgb: ColorRgb) {
  const muestra = await buscarMuestraDeLote(loteId);
  if (!muestra) {
    throw new Error('El lote no tiene tarro muestra registrado');
  }

  const desviacionDeltaE = calcularDesviacionDeltaE(convertirHexARgb(muestra.resultado_hex), rgb);
  const tarroNuevo = await insertarTarro({
    loteId,
    resultadoHex,
    desviacionDeltaE,
    resultado: obtenerResultadoLectura(desviacionDeltaE),
    esMuestra: false,
  });

  await registrarAlertaSiCorresponde(loteId, tarroNuevo.id_tarro, desviacionDeltaE);
  return tarroNuevo;
}

// Si la lectura está fuera de tolerancia, registra la alerta: Roja (y pausa el lote) si las
// últimas lecturas forman un patrón acumulativo, o Amarilla si es una desviación aislada
async function registrarAlertaSiCorresponde(
  loteId: number,
  tarroId: number,
  desviacionDeltaE: number
) {
  // Sin desviación fuera de tolerancia no hay alerta: no hace falta revisar el patrón
  if (!obtenerNivelAlerta(desviacionDeltaE, false)) return;

  const desviaciones = await buscarUltimasDesviacionesDeLote(loteId, LECTURAS_PATRON_ACUMULATIVO);
  const nivel = obtenerNivelAlerta(desviacionDeltaE, formanPatronAcumulativo(desviaciones));
  if (!nivel) return;

  const alerta = construirAlerta(nivel, desviacionDeltaE);
  await crearAlerta(tarroId, alerta.nivel, alerta.mensaje, alerta.congelaRegistro);
  if (nivel === 'Roja') {
    // Pausar también detiene la captura: el lote deja de recibir lecturas del sensor
    await pausarLote(loteId);
  }
}
