import pool from '@/lib/db';
import { crearAlerta } from '@/lib/modulos/alertas/servicio';
import { actualizarEstadoLote } from '@/lib/modulos/lotes/servicio';

// Trae todos los tarros de un lote específico
export async function obtenerTarrosDeLote(loteId: number) {
  const resultado = await pool.query(
    'SELECT * FROM tarros WHERE lote_id = $1 ORDER BY timestamp ASC',
    [loteId]
  );
  return resultado.rows;
}

// Trae el tarro muestra (referencia) de un lote
export async function obtenerMuestraDeLote(loteId: number) {
  const resultado = await pool.query(
    'SELECT * FROM tarros WHERE lote_id = $1 AND es_muestra = true',
    [loteId]
  );
  return resultado.rows[0] || null;
}

// Trae todos los tarros con el código de su lote, para el historial general
export async function obtenerHistorialTarros() {
  const resultado = await pool.query(`
    SELECT
      t.id_tarro,
      t.resultado_hex,
      t.desviacion_delta_e,
      t.resultado,
      t.timestamp,
      l.codigo AS lote_codigo
    FROM tarros t
    JOIN lotes l ON l.id = t.lote_id
    WHERE t.es_muestra = false
    ORDER BY t.timestamp DESC
  `);
  return resultado.rows;
}

// Convierte un color RGB (0-255) a espacio Lab, paso previo para calcular deltaE
function convertirRgbALab(r: number, g: number, b: number) {
  const linearizar = (c: number) => {
    const valor = c / 255;
    return valor > 0.04045
      ? Math.pow((valor + 0.055) / 1.055, 2.4)
      : valor / 12.92;
  };

  const rLineal = linearizar(r);
  const gLineal = linearizar(g);
  const bLineal = linearizar(b);

  const x = (rLineal * 0.4124 + gLineal * 0.3576 + bLineal * 0.1805) / 0.95047;
  const y = (rLineal * 0.2126 + gLineal * 0.7152 + bLineal * 0.0722) / 1.0;
  const z = (rLineal * 0.0193 + gLineal * 0.1192 + bLineal * 0.9505) / 1.08883;

  const f = (t: number) =>
    t > 0.008856 ? Math.cbrt(t) : 7.787 * t + 16 / 116;

  const fx = f(x);
  const fy = f(y);
  const fz = f(z);

  const l = 116 * fy - 16;
  const a = 500 * (fx - fy);
  const bLab = 200 * (fy - fz);

  return { l, a, b: bLab };
}

// Calcula la desviación deltaE (CIE76) entre el color muestra y el color leído
export function calcularDesviacionDeltaE(
  rgbMuestra: [number, number, number],
  rgbTarro: [number, number, number]
): number {
  const labMuestra = convertirRgbALab(...rgbMuestra);
  const labTarro = convertirRgbALab(...rgbTarro);

  const deltaE = Math.sqrt(
    Math.pow(labMuestra.l - labTarro.l, 2) +
    Math.pow(labMuestra.a - labTarro.a, 2) +
    Math.pow(labMuestra.b - labTarro.b, 2)
  );

  return Math.round(deltaE * 100) / 100;
}

// Determina si una desviación deltaE supera el límite de tolerancia (0.8 por defecto)
export function excedeToleranciaDeltaE(desviacionDeltaE: number, limite = 0.8): boolean {
  return desviacionDeltaE > limite;
}

// Registra un tarro nuevo (muestra o lectura normal) en un lote
export async function registrarTarro(
  loteId: number,
  resultadoHex: string,
  desviacionDeltaE: number | null,
  resultado: string,
  esMuestra: boolean
) {
  const respuesta = await pool.query(
    `INSERT INTO tarros (lote_id, resultado_hex, desviacion_delta_e, resultado, es_muestra)
     VALUES ($1, $2, $3, $4, $5) RETURNING *`,
    [loteId, resultadoHex, desviacionDeltaE, resultado, esMuestra]
  );
  return respuesta.rows[0];
}

// Revisa si los últimos tarros del lote muestran una desviación en aumento sostenido
export async function detectarPatronAcumulativo(loteId: number): Promise<boolean> {
  const resultado = await pool.query(
    `SELECT desviacion_delta_e FROM tarros
     WHERE lote_id = $1 AND es_muestra = false
     ORDER BY timestamp DESC LIMIT 3`,
    [loteId]
  );

  if (resultado.rows.length < 3) return false;

  const valores = resultado.rows.map((fila) => Number(fila.desviacion_delta_e)).reverse();

  const estaAumentando = valores[0] < valores[1] && valores[1] < valores[2];
  const ultimoExcedeTolerancia = valores[2] > 0.8;

  return estaAumentando && ultimoExcedeTolerancia;
}

// Convierte un color hex (#RRGGBB) a un arreglo RGB
function convertirHexARgb(hex: string): [number, number, number] {
  const valor = hex.replace('#', '');
  return [
    parseInt(valor.substring(0, 2), 16),
    parseInt(valor.substring(2, 4), 16),
    parseInt(valor.substring(4, 6), 16),
  ];
}

// Orquesta el registro completo de una lectura: calcula deltaE, decide resultado y genera alerta si aplica
export async function registrarLecturaTarro(
  loteId: number,
  resultadoHex: string,
  rgb: [number, number, number]
) {
  const muestra = await obtenerMuestraDeLote(loteId);
  if (!muestra) {
    throw new Error('El lote no tiene tarro muestra registrado');
  }

  const rgbMuestra = convertirHexARgb(muestra.resultado_hex);
  const desviacionDeltaE = calcularDesviacionDeltaE(rgbMuestra, rgb);
  const excedeTolerancia = excedeToleranciaDeltaE(desviacionDeltaE);
  const resultado = excedeTolerancia ? 'No Aprobado' : 'Aprobado';

  const tarroNuevo = await registrarTarro(loteId, resultadoHex, desviacionDeltaE, resultado, false);

  if (excedeTolerancia) {
    const esAcumulativo = await detectarPatronAcumulativo(loteId);

    if (esAcumulativo) {
      await crearAlerta(
        tarroNuevo.id_tarro,
        'Roja',
        'Desviación acumulativa detectada: revisar mezclador o posibles fugas',
        true
      );
      await actualizarEstadoLote(loteId, 'Pausado');
    } else {
      await crearAlerta(
        tarroNuevo.id_tarro,
        'Amarilla',
        `Desviación aislada de ${desviacionDeltaE} ΔE`,
        false
      );
    }
  }

  return tarroNuevo;
}