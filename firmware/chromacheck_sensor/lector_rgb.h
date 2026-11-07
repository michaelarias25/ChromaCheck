// Ruta: firmware/chromacheck_sensor/lector_rgb.h
// Responsabilidad: detectar si hay un tarro en el portamuestras, descartar lecturas
// falsas o vacías, convertir los pulsos calibrados a RGB 0-255 y emitir UNA sola
// línea "LECTURA;R;G;B" por tarro (contrato con puente-serial/).

#ifndef LECTOR_RGB_H
#define LECTOR_RGB_H

#include <Arduino.h>
#include "calibracion.h"

const uint8_t MUESTRAS_POR_CANAL = 9;
const uint8_t LECTURAS_ESTABLES_REQUERIDAS = 3;
const uint8_t TOLERANCIA_ESTABILIDAD_RGB = 4;  // diferencia máxima por canal entre lecturas
const uint8_t PORCENTAJE_PRESENCIA = 85;       // el claro debe bajar al 85 % del pulso vacío
const unsigned long INTERVALO_LECTURA_MS = 300UL;
const unsigned long TIEMPO_RETIRO_MS = 1500UL;  // vacío continuo para aceptar otro tarro
// true solo con el Monitor Serie: agrega líneas "DEPURACION;..." que el puente debe ignorar
const bool ES_MODO_DEPURACION = false;

struct ColorRgb {
  uint8_t rojo;
  uint8_t verde;
  uint8_t azul;
};

enum EstadoLector : uint8_t { ESPERANDO_MUESTRA, ESTABILIZANDO, ESPERANDO_RETIRO };
enum PresenciaMuestra : uint8_t { PRESENCIA_DESCONOCIDA, MUESTRA_PRESENTE, PORTAMUESTRAS_VACIO };

class LectorRgb {
 public:
  explicit LectorRgb(Calibracion& calibracionSensor) : calibracion(calibracionSensor) {}

  void reiniciar() {
    estado = ESPERANDO_MUESTRA;
    lecturasEstables = 0;
    estaContandoVacio = false;
  }

  // Se llama en cada loop(); solo mide cada INTERVALO_LECTURA_MS.
  void actualizar() {
    unsigned long ahoraMs = millis();
    if (ahoraMs - ultimaLecturaMs < INTERVALO_LECTURA_MS) {
      return;
    }
    ultimaLecturaMs = ahoraMs;

    PresenciaMuestra presencia = detectarPresencia();
    if (estado == ESPERANDO_MUESTRA) {
      atenderEsperaMuestra(presencia);
    } else if (estado == ESTABILIZANDO) {
      atenderEstabilizacion(presencia);
    } else {
      atenderEsperaRetiro(presencia, ahoraMs);
    }
  }

 private:
  Calibracion& calibracion;
  EstadoLector estado = ESPERANDO_MUESTRA;
  uint8_t lecturasEstables = 0;
  unsigned int sumaRojo = 0;
  unsigned int sumaVerde = 0;
  unsigned int sumaAzul = 0;
  ColorRgb ultimoColor = {0, 0, 0};
  unsigned long ultimaLecturaMs = 0;
  unsigned long inicioVacioMs = 0;
  bool estaContandoVacio = false;

  // Con el tarro puesto llega más luz al sensor, así que el pulso del filtro claro se acorta.
  PresenciaMuestra detectarPresencia() {
    MedicionPulso claro = calibracion.medirPulso(FILTRO_CLARO, MUESTRAS_POR_CANAL);
    if (!claro.esValida) {
      return PRESENCIA_DESCONOCIDA;
    }
    unsigned long umbral = calibracion.obtenerDatos().pulsoVacio * PORCENTAJE_PRESENCIA / 100;
    return claro.mediana <= umbral ? MUESTRA_PRESENTE : PORTAMUESTRAS_VACIO;
  }

  void atenderEsperaMuestra(PresenciaMuestra presencia) {
    if (presencia == MUESTRA_PRESENTE) {
      estado = ESTABILIZANDO;
      lecturasEstables = 0;
      imprimirDepuracion(F("MUESTRA_DETECTADA"));
    }
  }

  void atenderEstabilizacion(PresenciaMuestra presencia) {
    if (presencia == PORTAMUESTRAS_VACIO) {
      reiniciar();
      imprimirDepuracion(F("RETIRADA_ANTES_DE_LEER"));
      return;
    }
    ColorRgb color;
    if (presencia == PRESENCIA_DESCONOCIDA || !leerColor(color)) {
      lecturasEstables = 0;  // lectura falsa o vacía: se descarta y se vuelve a empezar
      imprimirDepuracion(F("LECTURA_DESCARTADA"));
      return;
    }
    acumularLectura(color);
    if (lecturasEstables >= LECTURAS_ESTABLES_REQUERIDAS) {
      emitirLectura(calcularPromedio());
      estado = ESPERANDO_RETIRO;
      estaContandoVacio = false;
    }
  }

  // Evita enviar el mismo tarro dos veces: exige el portamuestras vacío un tiempo continuo.
  void atenderEsperaRetiro(PresenciaMuestra presencia, unsigned long ahoraMs) {
    if (presencia != PORTAMUESTRAS_VACIO) {
      estaContandoVacio = false;
      return;
    }
    if (!estaContandoVacio) {
      estaContandoVacio = true;
      inicioVacioMs = ahoraMs;
      return;
    }
    if (ahoraMs - inicioVacioMs >= TIEMPO_RETIRO_MS) {
      reiniciar();
      imprimirDepuracion(F("LISTO_PARA_OTRO_TARRO"));
    }
  }

  bool leerColor(ColorRgb& color) {
    MedicionPulso rojo = calibracion.medirPulso(FILTRO_ROJO, MUESTRAS_POR_CANAL);
    MedicionPulso verde = calibracion.medirPulso(FILTRO_VERDE, MUESTRAS_POR_CANAL);
    MedicionPulso azul = calibracion.medirPulso(FILTRO_AZUL, MUESTRAS_POR_CANAL);
    if (!rojo.esValida || !verde.esValida || !azul.esValida) {
      return false;
    }
    color.rojo = convertirPulsoACanal(rojo.mediana, FILTRO_ROJO);
    color.verde = convertirPulsoACanal(verde.mediana, FILTRO_VERDE);
    color.azul = convertirPulsoACanal(azul.mediana, FILTRO_AZUL);
    return true;
  }

  // La reflectancia es proporcional a la FRECUENCIA (1/pulso), no al ancho del pulso:
  // por eso se normaliza en frecuencia entre el negro (0) y el blanco (255).
  uint8_t convertirPulsoACanal(unsigned long pulso, FiltroColor filtro) {
    const DatosCalibracion& referencia = calibracion.obtenerDatos();
    float frecuencia = 1.0f / pulso;
    float frecuenciaBlanco = 1.0f / referencia.pulsoBlanco[filtro];
    float frecuenciaNegro = 1.0f / referencia.pulsoNegro[filtro];
    float proporcion = (frecuencia - frecuenciaNegro) / (frecuenciaBlanco - frecuenciaNegro);
    proporcion = constrain(proporcion, 0.0f, 1.0f);
    return static_cast<uint8_t>(proporcion * 255.0f + 0.5f);
  }

  static bool sonColoresSimilares(const ColorRgb& a, const ColorRgb& b) {
    return abs(static_cast<int>(a.rojo) - b.rojo) <= TOLERANCIA_ESTABILIDAD_RGB &&
           abs(static_cast<int>(a.verde) - b.verde) <= TOLERANCIA_ESTABILIDAD_RGB &&
           abs(static_cast<int>(a.azul) - b.azul) <= TOLERANCIA_ESTABILIDAD_RGB;
  }

  // Si la lectura nueva se aleja de la anterior, el tarro se movió: se reinicia la cuenta.
  void acumularLectura(const ColorRgb& color) {
    bool esContinuacion = lecturasEstables > 0 && sonColoresSimilares(color, ultimoColor);
    if (!esContinuacion) {
      lecturasEstables = 0;
      sumaRojo = 0;
      sumaVerde = 0;
      sumaAzul = 0;
    }
    sumaRojo += color.rojo;
    sumaVerde += color.verde;
    sumaAzul += color.azul;
    lecturasEstables++;
    ultimoColor = color;
  }

  ColorRgb calcularPromedio() const {
    ColorRgb promedio;
    promedio.rojo = (sumaRojo + lecturasEstables / 2) / lecturasEstables;
    promedio.verde = (sumaVerde + lecturasEstables / 2) / lecturasEstables;
    promedio.azul = (sumaAzul + lecturasEstables / 2) / lecturasEstables;
    return promedio;
  }

  // Contrato con puente-serial: "LECTURA;R;G;B" + fin de línea, a 9600 baudios.
  static void emitirLectura(const ColorRgb& color) {
    Serial.print(F("LECTURA;"));
    Serial.print(color.rojo);
    Serial.print(';');
    Serial.print(color.verde);
    Serial.print(';');
    Serial.println(color.azul);
  }

  static void imprimirDepuracion(const __FlashStringHelper* mensaje) {
    if (!ES_MODO_DEPURACION) {
      return;
    }
    Serial.print(F("DEPURACION;"));
    Serial.println(mensaje);
  }
};

#endif  // LECTOR_RGB_H