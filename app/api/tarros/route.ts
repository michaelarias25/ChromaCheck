import { obtenerLotePorId } from '@/lib/modulos/lotes/servicio';
import {
  obtenerMuestraDeLote,
  obtenerTarrosDeLote,
  registrarLecturaTarro,
  registrarTarro,
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

export async function POST(peticion: Request) {
  try {
    const cuerpo = await leerCuerpoJson(peticion);
    if (!cuerpo) {
      return responderError('El cuerpo de la petición debe ser un objeto JSON', 400);
    }

    const { loteId, resultadoHex, rgb } = cuerpo;
    const esMuestra = cuerpo.esMuestra === true;

    if (!esEnteroPositivo(loteId)) {
      return responderError('El campo "loteId" debe ser un entero positivo', 400);
    }
    if (!esColorHexValido(resultadoHex)) {
      return responderError('El campo "resultadoHex" debe tener el formato #RRGGBB', 400);
    }

    const [lote, muestra] = await Promise.all([
      obtenerLotePorId(loteId),
      obtenerMuestraDeLote(loteId),
    ]);
    if (!lote) {
      return responderError(`El lote ${loteId} no existe`, 404);
    }

    if (esMuestra) {
      if (muestra) {
        return responderError('El lote ya tiene un tarro muestra registrado', 409);
      }
      const tarroMuestra = await registrarTarro(loteId, resultadoHex, null, 'Muestra', true);
      return responderExito(tarroMuestra, 201);
    }

    if (!esColorRgbValido(rgb)) {
      return responderError('El campo "rgb" debe ser un arreglo [r, g, b] de enteros entre 0 y 255', 400);
    }
    if (!coincidenColorHexYRgb(resultadoHex, rgb)) {
      return responderError('Los campos "resultadoHex" y "rgb" no representan el mismo color', 400);
    }
    if (!muestra) {
      return responderError('El lote no tiene tarro muestra registrado', 409);
    }
    // Una alerta roja pausa el lote: no se aceptan lecturas hasta revisar la línea
    if (lote.estado === 'Pausado') {
      return responderError('El lote está pausado por una alerta roja y no acepta lecturas', 409);
    }

    const tarroNuevo = await registrarLecturaTarro(loteId, resultadoHex, rgb);
    return responderExito(tarroNuevo, 201);
  } catch (error) {
    return responderErrorInterno(error);
  }
}
