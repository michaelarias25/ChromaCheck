import { obtenerLotes, crearLote } from '@/lib/modulos/lotes/servicio';
import {
  leerCuerpoJson,
  responderError,
  responderErrorInterno,
  responderExito,
} from '@/lib/respuestas';

export async function GET() {
  try {
    const lotes = await obtenerLotes();
    return responderExito(lotes);
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

    const codigo = typeof cuerpo.codigo === 'string' ? cuerpo.codigo.trim() : '';
    if (!codigo) {
      return responderError('El campo "codigo" es obligatorio', 400);
    }

    const loteNuevo = await crearLote(codigo);
    return responderExito(loteNuevo, 201);
  } catch (error) {
    return responderErrorInterno(error);
  }
}
