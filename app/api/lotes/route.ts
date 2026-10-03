import { NextResponse } from 'next/server';
import { obtenerLotes, crearLote } from '@/lib/modulos/lotes/servicio';

export async function GET() {
  try {
    const lotes = await obtenerLotes();
    return NextResponse.json({ exito: true, datos: lotes });
  } catch (error) {
    return NextResponse.json({ exito: false, error: String(error) }, { status: 500 });
  }
}

export async function POST(peticion: Request) {
  try {
    const cuerpo = await peticion.json();
    const loteNuevo = await crearLote(cuerpo.codigo);
    return NextResponse.json({ exito: true, datos: loteNuevo }, { status: 201 });
  } catch (error) {
    return NextResponse.json({ exito: false, error: String(error) }, { status: 500 });
  }
}