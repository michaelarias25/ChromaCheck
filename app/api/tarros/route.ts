import { NextResponse } from 'next/server';
import { obtenerTarrosDeLote, registrarTarro, registrarLecturaTarro } from '@/lib/modulos/tarros/servicio';

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

export async function POST(peticion: Request) {
  try {
    const cuerpo = await peticion.json();
    const { loteId, resultadoHex, rgb, esMuestra } = cuerpo;

    if (esMuestra) {
      const tarroMuestra = await registrarTarro(loteId, resultadoHex, null, 'Muestra', true);
      return NextResponse.json({ exito: true, datos: tarroMuestra }, { status: 201 });
    }

    const tarroNuevo = await registrarLecturaTarro(loteId, resultadoHex, rgb);
    return NextResponse.json({ exito: true, datos: tarroNuevo }, { status: 201 });
  } catch (error) {
    return NextResponse.json({ exito: false, error: String(error) }, { status: 500 });
  }
}