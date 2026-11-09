import type { NextRequest } from 'next/server';
import { obtenerIdUsuarioDePeticion } from '@/lib/modulos/auth/sesion';
import { obtenerLotes, crearLote } from '@/lib/modulos/lotes/servicio';
import {
  leerCuerpoJson,
  responderError,
  responderErrorInterno,
  responderExito,
} from '@/lib/respuestas';
import { excedeLongitudCodigoLote, LONGITUD_MAXIMA_CODIGO_LOTE } from '@/lib/validacion';

export async function GET() {
  try {
    const lotes = await obtenerLotes();
    return responderExito(lotes);
  } catch (error) {
    return responderErrorInterno(error);
  }
}

// Solo la web crea lotes (el puente serial no usa esta ruta), así que exige sesión
export async function POST(peticion: NextRequest) {
  try {
    const idUsuario = await obtenerIdUsuarioDePeticion(peticion);
    if (!idUsuario) {
      return responderError('Inicia sesión para crear un lote', 401);
    }

    const cuerpo = await leerCuerpoJson(peticion);
    if (!cuerpo) {
      return responderError('El cuerpo de la petición debe ser un objeto JSON', 400);
    }

    const codigo = typeof cuerpo.codigo === 'string' ? cuerpo.codigo.trim() : '';
    if (!codigo) {
      return responderError('El campo "codigo" es obligatorio', 400);
    }
    if (excedeLongitudCodigoLote(codigo)) {
      return responderError(
        `El campo "codigo" no puede tener más de ${LONGITUD_MAXIMA_CODIGO_LOTE} caracteres`,
        400
      );
    }

    const loteNuevo = await crearLote(codigo);
    if (!loteNuevo) {
      return responderError(`Ya existe un lote con el código "${codigo}"`, 409);
    }
    return responderExito(loteNuevo, 201);
  } catch (error) {
    return responderErrorInterno(error);
  }
}
