// Ruta: firmware/chromacheck_sensor/chromacheck_sensor.ino
// Punto de entrada del firmware: solo conecta las piezas. La calibración vive en
// calibracion.h y la lógica que entrega el RGB en lector_rgb.h.

#include "calibracion.h"
#include "lector_rgb.h"

const unsigned long VELOCIDAD_SERIAL = 9600UL;  // contrato con puente-serial/
const uint8_t LONGITUD_MAXIMA_COMANDO = 24;

Calibracion calibracion;
LectorRgb lectorRgb(calibracion);
char comandoEntrante[LONGITUD_MAXIMA_COMANDO + 1];
uint8_t longitudComando = 0;

void setup() {
  Serial.begin(VELOCIDAD_SERIAL);
  calibracion.iniciar();
  anunciarEstadoInicial();
}

void loop() {
  atenderComandosSerial();
  bool puedeMedir = calibracion.estaCalibrado() && !calibracion.estaCalibrando();
  if (puedeMedir) {
    lectorRgb.actualizar();
  }
}

// Sin calibración no se emite ninguna LECTURA: un RGB sin calibrar daría un ΔE falso.
void anunciarEstadoInicial() {
  if (calibracion.estaCalibrado()) {
    Serial.println(F("AVISO;LISTO"));
  } else {
    Serial.println(F("AVISO;SIN_CALIBRAR"));
  }
}

// Lee comandos terminados en '\n' sin bloquear el loop (acepta también "\r\n").
void atenderComandosSerial() {
  while (Serial.available() > 0) {
    char caracter = static_cast<char>(Serial.read());
    if (caracter == '\n') {
      ejecutarComando();
    } else if (caracter != '\r' && longitudComando < LONGITUD_MAXIMA_COMANDO) {
      comandoEntrante[longitudComando++] = caracter;
    }
  }
}

void ejecutarComando() {
  comandoEntrante[longitudComando] = '\0';
  longitudComando = 0;
  if (comandoEntrante[0] == '\0') {
    return;
  }
  bool esComandoCalibracion = calibracion.procesarComando(comandoEntrante);
  if (esComandoCalibracion) {
    lectorRgb.reiniciar();
    return;
  }
  Serial.println(F("AVISO;COMANDO_DESCONOCIDO"));
}