import { ejecutarEnTransaccion } from '@/lib/db';
import { crearAlerta } from '@/lib/modulos/alertas/servicio';
import { finalizarModoMuestra, obtenerLotePorId, pausarLote } from '@/lib/modulos/lotes/servicio';
import {
  buscarLecturasRecientesDeLote,
  buscarMuestraDeLote,
  buscarPaginaHistorial,
  buscarTarrosDeLote,
  buscarUltimasDesviacionesDeLote,
  contarLecturas,
  insertarTarro,
  type Tarro,
} from './repositorio';
import {
  calcularDesviacionDeltaE,
  construirAlerta,
  convertirHexARgb,
  crearMensajeSinModoMuestra,
  formanPatronAcumulativo,
  LECTURAS_PATRON_ACUMULATIVO,
  obtenerMotivoRechazoLectura,
  obtenerMotivoRechazoMuestra,
  obtenerNivelAlerta,
  obtenerResultadoLectura,
  RESULTADO_MUESTRA,
  type ColorRgb,
} from './reglas';

export type ResultadoRegistroTarro =
  | { tipo: 'loteInexistente' }
  | { tipo: 'rechazado'; mensaje: string }
  | { tipo: 'registrado'; tarro: Tarro };

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

// Trae el lote y su muestra para decidir si acepta un tarro; null si el lote no existe
async function buscarLoteYMuestra(loteId: number) {
  const [lote, muestra] = await Promise.all([
    obtenerLotePorId(loteId),
    buscarMuestraDeLote(loteId),
  ]);
  if (!lote) return null;
  const loteParaRegistro = {
    estado: lote.estado,
    modoCaptura: lote.modo_captura,
    tieneMuestra: Boolean(muestra),
  };
  return { loteParaRegistro, muestra };
}

// Registra el tarro muestra que envía el sensor (POST /api/tarros con esMuestra), si el lote
// está en modo Muestra y aún no tiene muestra
export async function registrarMuestraDelSensor(
  loteId: number,
  resultadoHex: string
): Promise<ResultadoRegistroTarro> {
  const datos = await buscarLoteYMuestra(loteId);
  if (!datos) return { tipo: 'loteInexistente' };

  const motivoRechazo = obtenerMotivoRechazoMuestra(datos.loteParaRegistro);
  if (motivoRechazo) return { tipo: 'rechazado', mensaje: motivoRechazo };

  // Registra la muestra y deja el lote en modo Inactivo en la misma transacción
  const tarro = await registrarMuestraDeLote(loteId, resultadoHex);
  if (!tarro) {
    // Otra petición registró la muestra o cambió el modo entre la revisión y el registro
    return {
      tipo: 'rechazado',
      mensaje: crearMensajeSinModoMuestra(datos.loteParaRegistro.modoCaptura),
    };
  }
  return { tipo: 'registrado', tarro };
}

// Registra una lectura que envía el sensor, si el lote tiene muestra, está Activo y en modo
// Recoleccion: calcula deltaE, decide el resultado y genera la alerta si aplica
export async function registrarLecturaDelSensor(
  loteId: number,
  resultadoHex: string,
  rgb: ColorRgb
): Promise<ResultadoRegistroTarro> {
  const datos = await buscarLoteYMuestra(loteId);
  if (!datos) return { tipo: 'loteInexistente' };

  const motivoRechazo = obtenerMotivoRechazoLectura(datos.loteParaRegistro);
  if (motivoRechazo || !datos.muestra) {
    return {
      tipo: 'rechazado',
      mensaje: motivoRechazo ?? 'El lote no tiene tarro muestra registrado',
    };
  }

  const tarro = await registrarLectura(loteId, resultadoHex, rgb, datos.muestra.resultado_hex);
  return { tipo: 'registrado', tarro };
}

// Guarda la lectura con su deltaE y su dictamen, y registra la alerta si corresponde
async function registrarLectura(
  loteId: number,
  resultadoHex: string,
  rgb: ColorRgb,
  muestraHex: string
) {
  const desviacionDeltaE = calcularDesviacionDeltaE(convertirHexARgb(muestraHex), rgb);
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
