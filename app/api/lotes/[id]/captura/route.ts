import type { NextRequest } from 'next/server';
import { obtenerIdUsuarioDePeticion } from '@/lib/modulos/auth/sesion';
import { esModoCapturaValido, MODOS_CAPTURA } from '@/lib/modulos/lotes/reglas';
import { cambiarModoCaptura } from '@/lib/modulos/lotes/servicio';
import {
  leerCuerpoJson,
  responderError,
  responderErrorInterno,
  responderExito,
} from '@/lib/respuestas';
import { esEnteroPositivo } from '@/lib/validacion';

// Cambia el modo de captura de un lote. Solo lo usa la web, así que exige sesión
export async function PATCH(
  peticion: NextRequest,
  contexto: RouteContext<'/api/lotes/[id]/captura'>
) {
  try {
    const idUsuario = await obtenerIdUsuarioDePeticion(peticion);
    if (!idUsuario) {
      return responderError('Inicia sesión para cambiar el modo de captura', 401);
    }

    const { id } = await contexto.params;
    const loteId = Number(id);
    if (!esEnteroPositivo(loteId)) {
      return responderError('El id del lote debe ser un entero positivo', 400);
    }

    const cuerpo = await leerCuerpoJson(peticion);
    if (!cuerpo) {
      return responderError('El cuerpo de la petición debe ser un objeto JSON', 400);
    }
    if (!esModoCapturaValido(cuerpo.modo)) {
      return responderError(`El campo "modo" debe ser uno de: ${MODOS_CAPTURA.join(', ')}`, 400);
    }

    const resultado = await cambiarModoCaptura(loteId, cuerpo.modo);
    if (resultado.tipo === 'loteInexistente') {
      return responderError(`El lote ${loteId} no existe`, 404);
    }
    if (resultado.tipo === 'rechazado') {
      return responderError(resultado.mensaje, 409);
    }
    return responderExito(resultado.lote);
  } catch (error) {
    return responderErrorInterno(error);
  }
}
