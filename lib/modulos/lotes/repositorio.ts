// Consultas SQL de la tabla lotes
import pool, { type EjecutorConsultas } from '@/lib/db';
import { MODO_CAPTURA_DETENIDO, type ModoCaptura } from './reglas';

// Código de error de PostgreSQL cuando se viola un índice o restricción única
const CODIGO_ERROR_VALOR_REPETIDO = '23505';
// Índice único parcial que impide que dos lotes capturen a la vez
const INDICE_UN_LOTE_CAPTURANDO = 'lotes_un_lote_capturando';

export interface Lote {
  id: number;
  codigo: string;
  estado: string;
  modo_captura: ModoCaptura;
  fecha_inicio: Date;
}

export interface LoteConMuestra extends Lote {
  tiene_muestra: boolean;
}

// Indica si el error de PostgreSQL es una violación de unicidad (opcionalmente, de un índice concreto)
function esViolacionDeUnicidad(error: unknown, nombreIndice?: string): boolean {
  if (typeof error !== 'object' || error === null) return false;
  const { code, constraint } = error as { code?: unknown; constraint?: unknown };
  return code === CODIGO_ERROR_VALOR_REPETIDO && (!nombreIndice || constraint === nombreIndice);
}

// Inserta un lote con el código dado. Devuelve null si el código ya existe
// (índice único lotes_codigo_unico, que ignora mayúsculas y espacios en los extremos)
export async function insertarLote(codigo: string): Promise<Lote | null> {
  try {
    const resultado = await pool.query<Lote>('INSERT INTO lotes (codigo) VALUES ($1) RETURNING *', [
      codigo,
    ]);
    return resultado.rows[0];
  } catch (error) {
    if (esViolacionDeUnicidad(error)) return null;
    throw error;
  }
}

// Trae un lote e indica si ya tiene tarro muestra registrado; null si no existe
export async function buscarLoteConMuestra(loteId: number): Promise<LoteConMuestra | null> {
  const resultado = await pool.query<LoteConMuestra>(
    `SELECT l.*,
       EXISTS (SELECT 1 FROM tarros t WHERE t.lote_id = l.id AND t.es_muestra = true) AS tiene_muestra
     FROM lotes l
     WHERE l.id = $1`,
    [loteId]
  );
  return resultado.rows[0] ?? null;
}

// Trae el lote que está capturando (modo distinto de 'Inactivo'); null si ninguno.
// El índice lotes_un_lote_capturando garantiza que hay como máximo uno
export async function buscarLoteCapturando(): Promise<Lote | null> {
  const resultado = await pool.query<Lote>('SELECT * FROM lotes WHERE modo_captura <> $1 LIMIT 1', [
    MODO_CAPTURA_DETENIDO,
  ]);
  return resultado.rows[0] ?? null;
}

// Cambia el modo de captura del lote. Devuelve null si otro lote ya está capturando
// (lo impide el índice lotes_un_lote_capturando, aunque dos peticiones lleguen a la vez)
export async function actualizarModoCaptura(
  loteId: number,
  modoCaptura: ModoCaptura
): Promise<Lote | null> {
  try {
    const resultado = await pool.query<Lote>(
      'UPDATE lotes SET modo_captura = $1 WHERE id = $2 RETURNING *',
      [modoCaptura, loteId]
    );
    return resultado.rows[0] ?? null;
  } catch (error) {
    if (esViolacionDeUnicidad(error, INDICE_UN_LOTE_CAPTURANDO)) return null;
    throw error;
  }
}

// Saca el lote del modo 'Muestra' para registrar su muestra. Bloquea la fila hasta que
// termine la transacción, así dos muestras simultáneas no pasan las dos.
// Devuelve false si el lote no estaba en modo 'Muestra' o no está Activo
export async function detenerCapturaDeMuestra(
  ejecutor: EjecutorConsultas,
  loteId: number
): Promise<boolean> {
  const resultado = await ejecutor.query(
    `UPDATE lotes SET modo_captura = $1
     WHERE id = $2 AND modo_captura = 'Muestra' AND estado = 'Activo'`,
    [MODO_CAPTURA_DETENIDO, loteId]
  );
  return resultado.rowCount === 1;
}

// Pausa el lote y detiene su captura en una sola sentencia (lo hace una alerta roja)
export async function pausarLoteYDetenerCaptura(loteId: number): Promise<Lote | null> {
  const resultado = await pool.query<Lote>(
    `UPDATE lotes SET estado = 'Pausado', modo_captura = $1
     WHERE id = $2 RETURNING *`,
    [MODO_CAPTURA_DETENIDO, loteId]
  );
  return resultado.rows[0] ?? null;
}
