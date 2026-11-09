import { puedeRegistrarLectura, puedeRegistrarMuestra } from '@/lib/modulos/lotes/reglas';
import { obtenerLotePorId } from '@/lib/modulos/lotes/servicio';
import {
  obtenerMuestraDeLote,
  obtenerTarrosDeLote,
  registrarLecturaTarro,
  registrarMuestraDeLote,
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
      const mensajeSinModoMuestra = `El lote no está en modo Muestra (modo actual: ${lote.modo_captura}); actívalo desde la web antes de registrar la muestra`;
      if (!puedeRegistrarMuestra(lote.modo_captura)) {
        return responderError(mensajeSinModoMuestra, 409);
      }
      // Registra la muestra y deja el lote en modo Inactivo en la misma transacción
      const tarroMuestra = await registrarMuestraDeLote(loteId, resultadoHex);
      if (!tarroMuestra) {
        return responderError(mensajeSinModoMuestra, 409);
      }
      return responderExito(tarroMuestra, 201);
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
    if (!muestra) {
      return responderError('El lote no tiene tarro muestra registrado', 409);
    }
    // Una alerta roja pausa el lote: no se aceptan lecturas hasta revisar la línea
    if (lote.estado === 'Pausado') {
      return responderError('El lote está pausado por una alerta roja y no acepta lecturas', 409);
    }
    if (!puedeRegistrarLectura(lote.modo_captura)) {
      return responderError(
        `El lote no está en modo Recoleccion (modo actual: ${lote.modo_captura}); actívalo desde la web antes de enviar lecturas`,
        409
      );
    }

    const tarroNuevo = await registrarLecturaTarro(loteId, resultadoHex, rgb);
    return responderExito(tarroNuevo, 201);
  } catch (error) {
    return responderErrorInterno(error);
  }
}
