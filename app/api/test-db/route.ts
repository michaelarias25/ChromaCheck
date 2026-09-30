import { NextResponse } from 'next/server';
import pool from '@/lib/db';

// Endpoint de prueba: consulta la tabla lotes y 
// confirma que la conexión a la base de datos funciona
export async function GET() {
  try {
    const result = await pool.query('SELECT * FROM lotes');
    return NextResponse.json({ success: true, data: result.rows });
  } catch (error) {
    return NextResponse.json({ success: false, error: String(error) }, { status: 500 });
  }
}