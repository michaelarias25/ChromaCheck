import { NextResponse } from 'next/server';
import {
  obtenerTarrosDeLote,
  obtenerMuestraDeLote,
  registrarTarro,
  calcularDesviacionDeltaE,
  excedeToleranciaDeltaE,
} from '@/lib/modulos/tarros/servicio';

// GET /api/tarros?loteId=1 — lista los tarros de un lote
export async function GET(peticion: Request) {
  try {
    const url = new URL(peticion.url);
    const loteId = Number(url.searchParams.get('loteId'));
    const tarros = await obtenerTarrosDeLote(loteId);
    return NextResponse.json({ exito: true, datos: tarros });
  } catch (error) {
    return NextResponse.json({ exito: false, error: String(error) }, { status: 500 });
  }
}

// POST /api/tarros — registra una lectura nueva, calculando deltaE si no es la muestra
export async function POST(peticion: Request) {
  try {
    const cuerpo = await peticion.json();
    const { loteId, resultadoHex, rgb, esMuestra } = cuerpo;

    if (esMuestra) {
      const tarroMuestra = await registrarTarro(loteId, resultadoHex, null, 'Muestra', true);
      return NextResponse.json({ exito: true, datos: tarroMuestra }, { status: 201 });
    }

    const muestra = await obtenerMuestraDeLote(loteId);
    if (!muestra) {
      return NextResponse.json(
        { exito: false, error: 'El lote no tiene tarro muestra registrado' },
        { status: 400 }
      );
    }

    const rgbMuestra = hexARgb(muestra.resultado_hex);
    const desviacionDeltaE = calcularDesviacionDeltaE(rgbMuestra, rgb);
    const resultado = excedeToleranciaDeltaE(desviacionDeltaE) ? 'No Aprobado' : 'Aprobado';

    const tarroNuevo = await registrarTarro(loteId, resultadoHex, desviacionDeltaE, resultado, false);
    return NextResponse.json({ exito: true, datos: tarroNuevo }, { status: 201 });
  } catch (error) {
    return NextResponse.json({ exito: false, error: String(error) }, { status: 500 });
  }
}

// Convierte un color hex (#RRGGBB) a un arreglo RGB
function hexARgb(hex: string): [number, number, number] {
  const valor = hex.replace('#', '');
  return [
    parseInt(valor.substring(0, 2), 16),
    parseInt(valor.substring(2, 4), 16),
    parseInt(valor.substring(4, 6), 16),
  ];
}