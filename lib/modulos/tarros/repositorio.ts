// Consultas SQL de la tabla tarros
import pool, { type EjecutorConsultas } from '@/lib/db';

export interface Tarro {
  id_tarro: number;
  lote_id: number;
  resultado_hex: string;
  // PostgreSQL devuelve las columnas NUMERIC como texto; null en el tarro muestra
  desviacion_delta_e: string | null;
  resultado: string;
  es_muestra: boolean;
  timestamp: Date;
}

export interface FilaHistorialTarro {
  id_tarro: number;
  resultado_hex: string;
  desviacion_delta_e: string | null;
  resultado: string;
  timestamp: Date;
  lote_codigo: string;
}

export interface DatosTarroNuevo {
  loteId: number;
  resultadoHex: string;
  desviacionDeltaE: number | null;
  resultado: string;
  esMuestra: boolean;
}

// Trae todos los tarros de un lote, del más antiguo al más reciente
export async function buscarTarrosDeLote(loteId: number): Promise<Tarro[]> {
  const resultado = await pool.query<Tarro>(
    'SELECT * FROM tarros WHERE lote_id = $1 ORDER BY timestamp ASC',
    [loteId]
  );
  return resultado.rows;
}

// Trae las lecturas más recientes de un lote (sin la muestra), de la más nueva a la más antigua
export async function buscarLecturasRecientesDeLote(
  loteId: number,
  cantidad: number
): Promise<Tarro[]> {
  const resultado = await pool.query<Tarro>(
    `SELECT * FROM tarros
     WHERE lote_id = $1 AND es_muestra = false
     ORDER BY timestamp DESC, id_tarro DESC
     LIMIT $2`,
    [loteId, cantidad]
  );
  return resultado.rows;
}

// Trae el tarro muestra (referencia) de un lote; null si aún no tiene
export async function buscarMuestraDeLote(loteId: number): Promise<Tarro | null> {
  const resultado = await pool.query<Tarro>(
    'SELECT * FROM tarros WHERE lote_id = $1 AND es_muestra = true',
    [loteId]
  );
  return resultado.rows[0] || null;
}

// Trae una página de lecturas de todos los lotes con el código de su lote, de la más reciente
export async function buscarPaginaHistorial(
  cantidad: number,
  desplazamiento: number
): Promise<FilaHistorialTarro[]> {
  const resultado = await pool.query<FilaHistorialTarro>(
    `SELECT
       t.id_tarro,
       t.resultado_hex,
       t.desviacion_delta_e,
       t.resultado,
       t.timestamp,
       l.codigo AS lote_codigo
     FROM tarros t
     JOIN lotes l ON l.id = t.lote_id
     WHERE t.es_muestra = false
     ORDER BY t.timestamp DESC, t.id_tarro DESC
     LIMIT $1 OFFSET $2`,
    [cantidad, desplazamiento]
  );
  return resultado.rows;
}

// Cuenta las lecturas de todos los lotes (sin las muestras)
export async function contarLecturas(): Promise<number> {
  const resultado = await pool.query(
    'SELECT COUNT(*) AS total FROM tarros WHERE es_muestra = false'
  );
  return Number(resultado.rows[0].total);
}

// Inserta un tarro (muestra o lectura). Recibe el cliente de una transacción cuando forma
// parte de una operación mayor
export async function insertarTarro(
  datos: DatosTarroNuevo,
  ejecutor: EjecutorConsultas = pool
): Promise<Tarro> {
  const resultado = await ejecutor.query<Tarro>(
    `INSERT INTO tarros (lote_id, resultado_hex, desviacion_delta_e, resultado, es_muestra)
     VALUES ($1, $2, $3, $4, $5) RETURNING *`,
    [datos.loteId, datos.resultadoHex, datos.desviacionDeltaE, datos.resultado, datos.esMuestra]
  );
  return resultado.rows[0];
}

// Trae el deltaE de las últimas lecturas del lote, ordenadas de la más antigua a la más reciente
export async function buscarUltimasDesviacionesDeLote(
  loteId: number,
  cantidad: number
): Promise<number[]> {
  const resultado = await pool.query<{ desviacion_delta_e: string }>(
    `SELECT desviacion_delta_e FROM tarros
     WHERE lote_id = $1 AND es_muestra = false
     ORDER BY timestamp DESC LIMIT $2`,
    [loteId, cantidad]
  );
  return resultado.rows.map((fila) => Number(fila.desviacion_delta_e)).reverse();
}
