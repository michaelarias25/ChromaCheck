import {
  obtenerTarrosDeLote,
  registrarLecturaDelSensor,
  registrarMuestraDelSensor,
  type ResultadoRegistroTarro,
} from '@/lib/modulos/tarros/servicio';
import {
  leerCuerpoJson,
  responderError,
  responderErrorInterno,
  responderExito,
} from '@/lib/respuestas';
import {
  coincidenColorHexYRgb,
  esColorHexValido,
  esColorRgbValido,
  esEnteroPositivo,
} from '@/lib/validacion';

export async function GET(peticion: Request) {
  try {
    const url = new URL(peticion.url);
    const loteId = Number(url.searchParams.get('loteId'));
    if (!esEnteroPositivo(loteId)) {
      return responderError('El parámetro "loteId" debe ser un entero positivo', 400);
    }

    const tarros = await obtenerTarrosDeLote(loteId);
    return responderExito(tarros);
  } catch (error) {
    return responderErrorInterno(error);
  }
}

// Registra el tarro muestra de un lote o una lectura del sensor. Las reglas (modo de captura,
// lote pausado, muestra única) las aplica el servicio; aquí solo se valida el formato
export async function POST(peticion: Request) {
  try {
    const cuerpo = await leerCuerpoJson(peticion);
    if (!cuerpo) {
      return responderError('El cuerpo de la petición debe ser un objeto JSON', 400);
    }

    const { loteId, resultadoHex, rgb } = cuerpo;
    if (!esEnteroPositivo(loteId)) {
      return responderError('El campo "loteId" debe ser un entero positivo', 400);
    }
    if (!esColorHexValido(resultadoHex)) {
      return responderError('El campo "resultadoHex" debe tener el formato #RRGGBB', 400);
    }

    if (cuerpo.esMuestra === true) {
      return responderRegistro(await registrarMuestraDelSensor(loteId, resultadoHex), loteId);
    }

    if (!esColorRgbValido(rgb)) {
      return responderError(
        'El campo "rgb" debe ser un arreglo [r, g, b] de enteros entre 0 y 255',
        400
      );
    }
    if (!coincidenColorHexYRgb(resultadoHex, rgb)) {
      return responderError('Los campos "resultadoHex" y "rgb" no representan el mismo color', 400);
    }

    return responderRegistro(await registrarLecturaDelSensor(loteId, resultadoHex, rgb), loteId);
  } catch (error) {
    return responderErrorInterno(error);
  }
}

// Traduce el resultado del registro a la respuesta HTTP
function responderRegistro(resultado: ResultadoRegistroTarro, loteId: number) {
  if (resultado.tipo === 'loteInexistente') {
    return responderError(`El lote ${loteId} no existe`, 404);
  }
  if (resultado.tipo === 'rechazado') {
    return responderError(resultado.mensaje, 409);
  }
  return responderExito(resultado.tarro, 201);
}
