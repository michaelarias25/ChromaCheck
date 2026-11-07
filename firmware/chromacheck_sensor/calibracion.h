// Ruta: firmware/chromacheck_sensor/calibracion.h
// Responsabilidad: controlar el sensor TCS3200 a bajo nivel y guardar/cargar la
// calibración (blanco, negro y vacío) en la EEPROM del Arduino Nano.

#ifndef CALIBRACION_H
#define CALIBRACION_H

#include <Arduino.h>
#include <EEPROM.h>

// ------------------------- Conexiones TCS3200 -> Nano -------------------------
// D0 y D1 no se usan: los ocupa el USB serial que lee el puente Python.
const uint8_t PIN_S0 = 4;
const uint8_t PIN_S1 = 5;
const uint8_t PIN_S2 = 6;
const uint8_t PIN_S3 = 7;
const uint8_t PIN_SALIDA = 8;

// ------------------------- Parámetros de medición ----------------------------
const unsigned long TIEMPO_ESPERA_PULSO_US = 50000UL;  // sin señal, pulseIn devuelve 0
const unsigned int ESPERA_CAMBIO_FILTRO_MS = 5;
const uint8_t MAXIMO_MUESTRAS = 25;
const uint8_t MUESTRAS_CALIBRACION = 25;
const uint8_t PORCENTAJE_DISPERSION_MAXIMA = 20;
const unsigned long DISPERSION_MINIMA_US = 4;  // margen por la resolución de pulseIn

// ------------------------- Persistencia ---------------------------------------
const int DIRECCION_EEPROM = 0;
const uint16_t FIRMA_CALIBRACION = 0xC0C1;  // cambiarla si cambia DatosCalibracion

enum FiltroColor : uint8_t { FILTRO_ROJO = 0, FILTRO_VERDE = 1, FILTRO_AZUL = 2, FILTRO_CLARO = 3 };
const uint8_t CANTIDAD_FILTROS = 4;

struct DatosCalibracion {
  uint16_t firma;
  unsigned long pulsoBlanco[CANTIDAD_FILTROS];  // índice = FiltroColor
  unsigned long pulsoNegro[CANTIDAD_FILTROS];
  unsigned long pulsoVacio;  // filtro claro con el portamuestras vacío
};

struct MedicionPulso {
  unsigned long mediana;
  bool esValida;
};

class Calibracion {
 public:
  void iniciar() {
    pinMode(PIN_S0, OUTPUT);
    pinMode(PIN_S1, OUTPUT);
    pinMode(PIN_S2, OUTPUT);
    pinMode(PIN_S3, OUTPUT);
    pinMode(PIN_SALIDA, INPUT);
    // Escala de frecuencia al 20 % (S0 alto, S1 bajo): rango estable para pulseIn
    digitalWrite(PIN_S0, HIGH);
    digitalWrite(PIN_S1, LOW);
    cargarDesdeEeprom();
  }

  // Toma varias muestras del filtro, descarta las vacías (0) y devuelve la mediana.
  // La medición es inválida si se pierden muchos pulsos o si las muestras no son estables.
  MedicionPulso medirPulso(FiltroColor filtro, uint8_t cantidad) {
    if (cantidad > MAXIMO_MUESTRAS) {
      cantidad = MAXIMO_MUESTRAS;
    }
    seleccionarFiltro(filtro);
    delay(ESPERA_CAMBIO_FILTRO_MS);

    unsigned long pulsos[MAXIMO_MUESTRAS];
    uint8_t validos = 0;
    for (uint8_t i = 0; i < cantidad; i++) {
      unsigned long pulso = pulseIn(PIN_SALIDA, LOW, TIEMPO_ESPERA_PULSO_US);
      if (pulso > 0) {
        pulsos[validos++] = pulso;
      }
    }
    return evaluarPulsos(pulsos, validos, cantidad);
  }

  bool estaCalibrado() const { return tieneCalibracionValida; }
  bool estaCalibrando() const { return estaEnModoCalibracion; }
  const DatosCalibracion& obtenerDatos() const { return datos; }

  // Devuelve true si el texto era un comando "CALIBRAR;...", aunque haya fallado.
  bool procesarComando(const char* comando) {
    if (strncmp(comando, "CALIBRAR;", 9) != 0) {
      return false;
    }
    const char* paso = comando + 9;
    if (strcmp(paso, "BLANCO") == 0) {
      registrarReferencia(datosTemporales.pulsoBlanco, F("BLANCO"), seMidioBlanco);
    } else if (strcmp(paso, "NEGRO") == 0) {
      registrarReferencia(datosTemporales.pulsoNegro, F("NEGRO"), seMidioNegro);
    } else if (strcmp(paso, "VACIO") == 0) {
      registrarVacio();
    } else if (strcmp(paso, "GUARDAR") == 0) {
      guardarCalibracion();
    } else if (strcmp(paso, "CANCELAR") == 0) {
      reiniciarPasos();
      Serial.println(F("CALIBRACION;OK;CANCELADA"));
    } else if (strcmp(paso, "VER") == 0) {
      mostrarCalibracion();
    } else if (strcmp(paso, "BORRAR") == 0) {
      borrarCalibracion();
    } else {
      Serial.println(F("CALIBRACION;ERROR;COMANDO_DESCONOCIDO"));
    }
    return true;
  }

 private:
  DatosCalibracion datos = {};
  DatosCalibracion datosTemporales = {};
  bool tieneCalibracionValida = false;
  bool estaEnModoCalibracion = false;
  bool seMidioBlanco = false;
  bool seMidioNegro = false;
  bool seMidioVacio = false;

  // Tabla del TCS3200 (S2/S3): LL rojo, HH verde, LH azul, HL claro (sin filtro)
  static void seleccionarFiltro(FiltroColor filtro) {
    bool esS2Alto = (filtro == FILTRO_VERDE || filtro == FILTRO_CLARO);
    bool esS3Alto = (filtro == FILTRO_VERDE || filtro == FILTRO_AZUL);
    digitalWrite(PIN_S2, esS2Alto ? HIGH : LOW);
    digitalWrite(PIN_S3, esS3Alto ? HIGH : LOW);
  }

  static void ordenarPulsos(unsigned long pulsos[], uint8_t cantidad) {
    for (uint8_t i = 1; i < cantidad; i++) {
      unsigned long actual = pulsos[i];
      int8_t j = i - 1;
      while (j >= 0 && pulsos[j] > actual) {
        pulsos[j + 1] = pulsos[j];
        j--;
      }
      pulsos[j + 1] = actual;
    }
  }

  static MedicionPulso evaluarPulsos(unsigned long pulsos[], uint8_t validos, uint8_t cantidad) {
    MedicionPulso resultado = {0, false};
    // Menos de 2/3 de pulsos útiles: sensor desconectado, tapado o sin luz
    if (validos == 0 || validos * 3 < cantidad * 2) {
      return resultado;
    }
    ordenarPulsos(pulsos, validos);
    resultado.mediana = pulsos[validos / 2];

    // Se ignoran los dos extremos y se mide la dispersión del resto
    unsigned long bajo = pulsos[validos > 2 ? 1 : 0];
    unsigned long alto = pulsos[validos > 2 ? validos - 2 : validos - 1];
    unsigned long dispersionPermitida = resultado.mediana * PORCENTAJE_DISPERSION_MAXIMA / 100;
    if (dispersionPermitida < DISPERSION_MINIMA_US) {
      dispersionPermitida = DISPERSION_MINIMA_US;
    }
    resultado.esValida = (alto - bajo) <= dispersionPermitida;
    return resultado;
  }

  // Más luz = pulso más corto: blanco < negro en todos los filtros y el vacío
  // refleja menos luz que el blanco.
  static bool sonDatosCoherentes(const DatosCalibracion& candidatos) {
    for (uint8_t f = 0; f < CANTIDAD_FILTROS; f++) {
      if (candidatos.pulsoBlanco[f] == 0 || candidatos.pulsoNegro[f] <= candidatos.pulsoBlanco[f]) {
        return false;
      }
    }
    return candidatos.pulsoVacio > candidatos.pulsoBlanco[FILTRO_CLARO];
  }

  void cargarDesdeEeprom() {
    EEPROM.get(DIRECCION_EEPROM, datos);
    // Una EEPROM nueva viene en 0xFF: la firma no coincide y queda sin calibrar
    tieneCalibracionValida = (datos.firma == FIRMA_CALIBRACION) && sonDatosCoherentes(datos);
  }

  void registrarReferencia(unsigned long destino[], const __FlashStringHelper* nombre,
                           bool& seMidio) {
    estaEnModoCalibracion = true;
    unsigned long medidos[CANTIDAD_FILTROS];
    for (uint8_t f = 0; f < CANTIDAD_FILTROS; f++) {
      MedicionPulso medicion = medirPulso(static_cast<FiltroColor>(f), MUESTRAS_CALIBRACION);
      if (!medicion.esValida) {
        Serial.print(F("CALIBRACION;ERROR;LECTURA_INESTABLE;"));
        Serial.println(nombre);
        return;
      }
      medidos[f] = medicion.mediana;
    }
    for (uint8_t f = 0; f < CANTIDAD_FILTROS; f++) {
      destino[f] = medidos[f];
    }
    seMidio = true;
    imprimirReferencia(nombre, destino);
  }

  void registrarVacio() {
    estaEnModoCalibracion = true;
    MedicionPulso medicion = medirPulso(FILTRO_CLARO, MUESTRAS_CALIBRACION);
    if (!medicion.esValida) {
      Serial.println(F("CALIBRACION;ERROR;LECTURA_INESTABLE;VACIO"));
      return;
    }
    datosTemporales.pulsoVacio = medicion.mediana;
    seMidioVacio = true;
    Serial.print(F("CALIBRACION;VACIO;"));
    Serial.println(datosTemporales.pulsoVacio);
  }

  void guardarCalibracion() {
    if (!seMidioBlanco || !seMidioNegro || !seMidioVacio) {
      Serial.println(F("CALIBRACION;ERROR;FALTAN_PASOS"));
      return;
    }
    if (!sonDatosCoherentes(datosTemporales)) {
      Serial.println(F("CALIBRACION;ERROR;DATOS_INCOHERENTES"));
      return;
    }
    datosTemporales.firma = FIRMA_CALIBRACION;
    EEPROM.put(DIRECCION_EEPROM, datosTemporales);
    datos = datosTemporales;
    tieneCalibracionValida = true;
    reiniciarPasos();
    Serial.println(F("CALIBRACION;OK;GUARDADA"));
  }

  void borrarCalibracion() {
    datos.firma = 0;
    EEPROM.put(DIRECCION_EEPROM, datos);
    tieneCalibracionValida = false;
    reiniciarPasos();
    Serial.println(F("CALIBRACION;OK;BORRADA"));
  }

  void reiniciarPasos() {
    estaEnModoCalibracion = false;
    seMidioBlanco = false;
    seMidioNegro = false;
    seMidioVacio = false;
  }

  void mostrarCalibracion() {
    Serial.println(tieneCalibracionValida ? F("CALIBRACION;ESTADO;VALIDA")
                                          : F("CALIBRACION;ESTADO;SIN_CALIBRAR"));
    imprimirReferencia(F("BLANCO"), datos.pulsoBlanco);
    imprimirReferencia(F("NEGRO"), datos.pulsoNegro);
    Serial.print(F("CALIBRACION;VACIO;"));
    Serial.println(datos.pulsoVacio);
  }

  // Formato: CALIBRACION;NOMBRE;rojo;verde;azul;claro (anchos de pulso en µs)
  static void imprimirReferencia(const __FlashStringHelper* nombre, const unsigned long pulsos[]) {
    Serial.print(F("CALIBRACION;"));
    Serial.print(nombre);
    for (uint8_t f = 0; f < CANTIDAD_FILTROS; f++) {
      Serial.print(';');
      Serial.print(pulsos[f]);
    }
    Serial.println();
  }
};

#endif  // CALIBRACION_H