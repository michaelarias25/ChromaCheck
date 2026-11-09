import { obtenerCapturaActiva } from '@/lib/modulos/lotes/servicio';
import { responderErrorInterno, responderExito } from '@/lib/respuestas';

// Indica qué lote está capturando y en qué modo. Abierto: lo consulta el puente serial
export async function GET() {
  try {
    const capturaActiva = await obtenerCapturaActiva();
    return responderExito(capturaActiva);
  } catch (error) {
    return responderErrorInterno(error);
  }
}
