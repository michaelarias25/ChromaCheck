// Reglas de calidad de los tarros: cálculo de deltaE (CIE76), dictamen, alertas y cuándo
// se acepta registrar un tarro. Funciones puras, sin acceso a la base de datos
import { puedeRegistrarLectura, puedeRegistrarMuestra } from '@/lib/modulos/lotes/reglas';

export type ColorRgb = [number, number, number];

export type ResultadoLectura = 'Aprobado' | 'No Aprobado';

export type NivelAlerta = 'Amarilla' | 'Roja';

export interface AlertaCalculada {
  nivel: NivelAlerta;
  mensaje: string;
  congelaRegistro: boolean;
}

// Lo que hace falta saber del lote para decidir si acepta un tarro
export interface LoteParaRegistro {
  estado: string;
  modoCaptura: string;
  tieneMuestra: boolean;
}

// ACQ-04: una lectura con deltaE mayor que este valor no se aprueba
export const UMBRAL_TOLERANCIA_DELTA_E = 0.8;

// Cantidad de lecturas seguidas que se revisan para detectar una desviación acumulativa
export const LECTURAS_PATRON_ACUMULATIVO = 3;

export const RESULTADO_MUESTRA = 'Muestra';

const MENSAJE_ALERTA_ROJA = 'Desviación acumulativa detectada: revisar mezclador o posibles fugas';

// Convierte un color RGB (0-255) a espacio Lab, paso previo para calcular deltaE
export function convertirRgbALab(r: number, g: number, b: number) {
  const linearizar = (canal: number) => {
    const valor = canal / 255;
    return valor > 0.04045 ? Math.pow((valor + 0.055) / 1.055, 2.4) : valor / 12.92;
  };

  const rLineal = linearizar(r);
  const gLineal = linearizar(g);
  const bLineal = linearizar(b);

  const x = (rLineal * 0.4124 + gLineal * 0.3576 + bLineal * 0.1805) / 0.95047;
  const y = (rLineal * 0.2126 + gLineal * 0.7152 + bLineal * 0.0722) / 1.0;
  const z = (rLineal * 0.0193 + gLineal * 0.1192 + bLineal * 0.9505) / 1.08883;

  // Función f(t) de la norma CIE: raíz cúbica, o aproximación lineal cerca de cero
  const comprimirComponente = (componente: number) =>
    componente > 0.008856 ? Math.cbrt(componente) : 7.787 * componente + 16 / 116;

  const xComprimido = comprimirComponente(x);
  const yComprimido = comprimirComponente(y);
  const zComprimido = comprimirComponente(z);

  const l = 116 * yComprimido - 16;
  const a = 500 * (xComprimido - yComprimido);
  const bLab = 200 * (yComprimido - zComprimido);

  return { l, a, b: bLab };
}

// Calcula la desviación deltaE (CIE76) entre el color muestra y el color leído
export function calcularDesviacionDeltaE(rgbMuestra: ColorRgb, rgbTarro: ColorRgb): number {
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
export function excedeToleranciaDeltaE(
  desviacionDeltaE: number,
  limite = UMBRAL_TOLERANCIA_DELTA_E
): boolean {
  return desviacionDeltaE > limite;
}

// Dictamen de una lectura según su deltaE
export function obtenerResultadoLectura(desviacionDeltaE: number): ResultadoLectura {
  return excedeToleranciaDeltaE(desviacionDeltaE) ? 'No Aprobado' : 'Aprobado';
}

// Convierte un color hex (#RRGGBB) a un arreglo RGB
export function convertirHexARgb(hex: string): ColorRgb {
  const valor = hex.replace('#', '');
  return [
    parseInt(valor.substring(0, 2), 16),
    parseInt(valor.substring(2, 4), 16),
    parseInt(valor.substring(4, 6), 16),
  ];
}

// Indica si las últimas lecturas (de la más antigua a la más reciente) muestran una desviación
// en aumento sostenido: 3 valores estrictamente crecientes con el último fuera de tolerancia
export function formanPatronAcumulativo(desviacionesCronologicas: number[]): boolean {
  if (desviacionesCronologicas.length < LECTURAS_PATRON_ACUMULATIVO) return false;

  const [primera, segunda, tercera] = desviacionesCronologicas.slice(-LECTURAS_PATRON_ACUMULATIVO);
  const estaAumentando = primera < segunda && segunda < tercera;
  return estaAumentando && excedeToleranciaDeltaE(tercera);
}

// Nivel de alerta de una lectura: ninguna si está en tolerancia, Roja si forma un patrón
// acumulativo, y Amarilla si es una desviación aislada
export function obtenerNivelAlerta(
  desviacionDeltaE: number,
  esPatronAcumulativo: boolean
): NivelAlerta | null {
  if (!excedeToleranciaDeltaE(desviacionDeltaE)) return null;
  return esPatronAcumulativo ? 'Roja' : 'Amarilla';
}

// Arma la alerta que se registra para el nivel dado. La roja congela el registro (pausa el lote)
export function construirAlerta(nivel: NivelAlerta, desviacionDeltaE: number): AlertaCalculada {
  if (nivel === 'Roja') {
    return { nivel, mensaje: MENSAJE_ALERTA_ROJA, congelaRegistro: true };
  }
  return {
    nivel,
    mensaje: `Desviación aislada de ${desviacionDeltaE} ΔE`,
    congelaRegistro: false,
  };
}

// Revisa si el lote acepta su tarro muestra. Devuelve el motivo del rechazo, o null si lo acepta
export function obtenerMotivoRechazoMuestra(lote: LoteParaRegistro): string | null {
  if (lote.tieneMuestra) {
    return 'El lote ya tiene un tarro muestra registrado';
  }
  if (!puedeRegistrarMuestra(lote.modoCaptura)) {
    return crearMensajeSinModoMuestra(lote.modoCaptura);
  }
  return null;
}

// Mensaje cuando el lote no está en modo Muestra al llegar su tarro muestra
export function crearMensajeSinModoMuestra(modoCaptura: string): string {
  return `El lote no está en modo Muestra (modo actual: ${modoCaptura}); actívalo desde la web antes de registrar la muestra`;
}

// Revisa si el lote acepta una lectura. Devuelve el motivo del rechazo, o null si la acepta
export function obtenerMotivoRechazoLectura(lote: LoteParaRegistro): string | null {
  if (!lote.tieneMuestra) {
    return 'El lote no tiene tarro muestra registrado';
  }
  // Una alerta roja pausa el lote: no se aceptan lecturas hasta revisar la línea
  if (lote.estado === 'Pausado') {
    return 'El lote está pausado por una alerta roja y no acepta lecturas';
  }
  if (!puedeRegistrarLectura(lote.modoCaptura)) {
    return `El lote no está en modo Recoleccion (modo actual: ${lote.modoCaptura}); actívalo desde la web antes de enviar lecturas`;
  }
  return null;
}
