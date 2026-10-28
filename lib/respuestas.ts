// Respuestas JSON con el formato común de la API: { exito, datos } o { exito, error }
import { NextResponse } from 'next/server';

// Responde con los datos solicitados o creados
export function responderExito(datos: unknown, estado = 200) {
  return NextResponse.json({ exito: true, datos }, { status: estado });
}

// Responde con un error causado por la petición (datos inválidos, recurso inexistente, etc.)
export function responderError(mensaje: string, estado: number) {
  return NextResponse.json({ exito: false, error: mensaje }, { status: estado });
}

// Registra el error real en el servidor y responde un mensaje genérico,
// para no exponer detalles de la base de datos al cliente
export function responderErrorInterno(error: unknown) {
  console.error(error);
  return responderError('Error interno del servidor', 500);
}

// Lee el cuerpo JSON de la petición; devuelve null si no es un objeto JSON válido
export async function leerCuerpoJson(peticion: Request): Promise<Record<string, unknown> | null> {
  try {
    const cuerpo = await peticion.json();
    return typeof cuerpo === 'object' && cuerpo !== null && !Array.isArray(cuerpo) ? cuerpo : null;
  } catch {
    return null;
  }
}
