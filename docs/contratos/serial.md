# Contrato serial · Arduino ↔ puente

Comunicación por USB entre el firmware (`firmware/chromacheck_sensor/`, Lauren) y el puente (`puente-serial/`, Michael). Lo que el puente hace después con cada lectura está en [api.md](api.md#contrato-con-el-puente-serial).

## Conexión

- 9600 baudios.
- Cada mensaje es una línea de texto terminada en `\n`. El firmware acepta también `\r\n`.
- Al abrir el puerto, el Arduino se reinicia (señal DTR): el puente espera unos 2 segundos antes de enviar o leer.
- El puente aplica `strip()` a cada línea antes de interpretarla.

## Del Arduino al puente

| Línea                       | Cuándo                                                                                         | Qué hace el puente                 |
| --------------------------- | ---------------------------------------------------------------------------------------------- | ---------------------------------- |
| `LECTURA;R;G;B`             | Una sola vez por tarro, con la lectura estable. R, G y B son enteros de 0 a 255, ya calibrados | La procesa según la captura activa |
| `AVISO;LISTO`               | Al encender, si hay calibración válida guardada en la EEPROM                                   | Lo muestra en consola              |
| `AVISO;SIN_CALIBRAR`        | Al encender, sin calibración: no se emitirá ninguna `LECTURA`                                  | Avisa que hay que calibrar         |
| `AVISO;COMANDO_DESCONOCIDO` | Recibió una línea que no es un comando                                                         | Lo muestra en consola              |
| `CALIBRACION;...`           | Respuestas a los comandos `CALIBRAR;...`                                                       | Las muestra en consola             |
| `DEPURACION;...`            | Solo si el firmware se compila con `ES_MODO_DEPURACION = true`                                 | Las ignora                         |

Regla para el puente: toda línea que no empiece con `LECTURA;` no es una lectura.

## Del puente (o del monitor serial) al Arduino

| Comando             | Qué hace                                                   |
| ------------------- | ---------------------------------------------------------- |
| `CALIBRAR;BLANCO`   | Mide la referencia blanca                                  |
| `CALIBRAR;NEGRO`    | Mide la referencia negra                                   |
| `CALIBRAR;VACIO`    | Mide el sensor sin tarro (para detectar la presencia)      |
| `CALIBRAR;GUARDAR`  | Valida los tres pasos y guarda la calibración en la EEPROM |
| `CALIBRAR;CANCELAR` | Descarta los pasos medidos sin guardar                     |
| `CALIBRAR;VER`      | Muestra si hay calibración válida y sus valores            |
| `CALIBRAR;BORRAR`   | Borra la calibración guardada                              |

Respuestas de error: `CALIBRACION;ERROR;LECTURA_INESTABLE;...`, `CALIBRACION;ERROR;FALTAN_PASOS`, `CALIBRACION;ERROR;DATOS_INCOHERENTES` y `CALIBRACION;ERROR;COMANDO_DESCONOCIDO`.

## Por qué la calibración vive en el firmware

La API solo valida que R, G y B sean tres enteros de 0 a 255: no puede saber si el sensor está mal calibrado. Por eso, sin calibración válida el Arduino no emite lecturas.
