"""Puente serial → API de ChromaCheck.

Lee las lecturas que el Arduino envía por el puerto serial con el formato
"LECTURA;R;G;B" y las reenvía al endpoint POST /api/tarros.

Uso:
    python puente_serial.py --puerto COM3 --automatico
    python puente_serial.py --puerto COM3 --lote 1
    python puente_serial.py --puerto COM3 --lote 1 --muestra

Con --automatico, el lote y el modo (muestra o recolección) los elige la web, y el
puente los consulta en GET /api/captura/activa antes de enviar cada lectura.
"""
import argparse
import logging
import sys
import time

import requests
import serial

PREFIJO_LECTURA = 'LECTURA;'
CANALES_POR_LECTURA = 3
VALOR_MAXIMO_CANAL = 255
RUTA_TARROS = '/api/tarros'
RUTA_CAPTURA_ACTIVA = '/api/captura/activa'
MODO_MUESTRA = 'Muestra'
MODO_RECOLECCION = 'Recoleccion'
MODOS_QUE_ENVIAN = (MODO_MUESTRA, MODO_RECOLECCION)
TIEMPO_ESPERA_API_SEGUNDOS = 5
LONGITUD_MAXIMA_MENSAJE = 200
VELOCIDAD_SERIAL = 9600  # contrato con firmware/chromacheck_sensor
PREFIJO_AVISO = 'AVISO;'
ESPERA_REINICIO_ARDUINO_SEGUNDOS = 2
URL_API_POR_DEFECTO = 'http://localhost:3000'
COMANDO_VER_CALIBRACION = b'CALIBRAR;VER\n'
PREFIJO_ESTADO_CALIBRACION = 'CALIBRACION;ESTADO;'
ESTADO_CALIBRACION_VALIDA = 'VALIDA'
ESTADO_SIN_CALIBRAR = 'SIN_CALIBRAR'
TIEMPO_ESPERA_CALIBRACION_SEGUNDOS = 3


def interpretar_linea(linea):
    """Devuelve (rojo, verde, azul) si la línea es una lectura válida; si no, None.

    Las líneas que no empiezan con "LECTURA;" (avisos, depuración, ruido) no son
    lecturas y se ignoran.
    """
    linea = linea.strip()
    if not linea.startswith(PREFIJO_LECTURA):
        return None

    partes = linea[len(PREFIJO_LECTURA):].split(';')
    if len(partes) != CANALES_POR_LECTURA:
        return None
    if not all(parte.isascii() and parte.isdigit() for parte in partes):
        return None

    rgb = tuple(int(parte) for parte in partes)
    if any(canal > VALOR_MAXIMO_CANAL for canal in rgb):
        return None
    return rgb


def convertir_rgb_a_hex(rgb):
    """Convierte (r, g, b) a un color hex con el formato #RRGGBB."""
    rojo, verde, azul = rgb
    return f'#{rojo:02X}{verde:02X}{azul:02X}'


def construir_cuerpo(lote_id, rgb, es_muestra=False):
    """Arma el cuerpo de POST /api/tarros: el tarro muestra o una lectura con su RGB.

    El hex se genera desde el mismo RGB, así la API siempre los recibe consistentes.
    """
    cuerpo = {'loteId': lote_id, 'resultadoHex': convertir_rgb_a_hex(rgb)}
    if es_muestra:
        cuerpo['esMuestra'] = True
    else:
        cuerpo['rgb'] = list(rgb)
    return cuerpo


def extraer_mensaje_error(respuesta):
    """Devuelve el mensaje de error de la API, o el inicio del texto si no es JSON."""
    try:
        return str(respuesta.json()['error'])
    except (ValueError, KeyError, TypeError):
        return respuesta.text[:LONGITUD_MAXIMA_MENSAJE]


def enviar_lectura(url_api, cuerpo):
    """Envía una lectura a la API. Devuelve True si quedó registrada.

    Nunca lanza una excepción por fallos de la API o de la red: los registra en
    consola y devuelve False, para que el script siga leyendo el puerto.
    """
    url = url_api.rstrip('/') + RUTA_TARROS
    try:
        respuesta = requests.post(url, json=cuerpo, timeout=TIEMPO_ESPERA_API_SEGUNDOS)
    except requests.RequestException as error:
        logging.error('No se pudo contactar la API en %s: %s', url, error)
        return False

    if respuesta.status_code != 201:
        logging.error('La API respondió %s: %s', respuesta.status_code,
                      extraer_mensaje_error(respuesta))
        return False

    logging.info('Lectura registrada: %s', cuerpo['resultadoHex'])
    return True


def extraer_lectura(linea):
    """Devuelve el RGB si la línea es una lectura, y registra en consola lo que interesa.

    Los avisos del Arduino (AVISO;...) se muestran; el resto de líneas que no son
    lecturas se ignora en silencio.
    """
    rgb = interpretar_linea(linea)
    if rgb is None:
        if linea.strip().startswith(PREFIJO_AVISO):
            logging.info('Arduino: %s', linea.strip())
        return None

    logging.info('Lectura recibida: RGB %s', rgb)
    return rgb


def procesar_linea(linea, lote_id, url_api, es_muestra=False):
    """Procesa una línea del puerto serial para un lote fijo (--lote).

    Devuelve None si la línea no es una lectura; si lo es, devuelve True o False
    según la API la haya registrado o no.
    """
    rgb = extraer_lectura(linea)
    if rgb is None:
        return None
    return enviar_lectura(url_api, construir_cuerpo(lote_id, rgb, es_muestra))


class ErrorConsultaCaptura(Exception):
    """La API no respondió o no devolvió la captura activa con el formato esperado."""


def consultar_captura_activa(url_api):
    """Consulta GET /api/captura/activa: qué lote captura y en qué modo.

    Devuelve {'loteId', 'codigo', 'modo'}, o None si ningún lote está capturando.
    Lanza ErrorConsultaCaptura si la API no responde o la respuesta no es la esperada.
    """
    url = url_api.rstrip('/') + RUTA_CAPTURA_ACTIVA
    try:
        respuesta = requests.get(url, timeout=TIEMPO_ESPERA_API_SEGUNDOS)
    except requests.RequestException as error:
        raise ErrorConsultaCaptura(f'No se pudo contactar la API en {url}: {error}') from error

    if respuesta.status_code != 200:
        raise ErrorConsultaCaptura(
            f'La API respondió {respuesta.status_code}: {extraer_mensaje_error(respuesta)}')

    try:
        captura = respuesta.json()['datos']
    except (ValueError, KeyError, TypeError) as error:
        raise ErrorConsultaCaptura('La API devolvió una respuesta inesperada') from error

    if captura is None:
        return None
    es_captura_valida = (isinstance(captura, dict)
                         and isinstance(captura.get('loteId'), int)
                         and isinstance(captura.get('modo'), str))
    if not es_captura_valida:
        raise ErrorConsultaCaptura(f'La captura activa no tiene el formato esperado: {captura}')
    return captura


def procesar_linea_automatica(linea, url_api):
    """Procesa una línea en modo automático: la web decide el lote y el modo.

    Sigue el contrato de docs/api.md: por cada lectura consulta la captura activa
    y la envía como muestra o como lectura. Devuelve None si la línea no es una
    lectura; si lo es, True o False según haya quedado registrada.
    """
    rgb = extraer_lectura(linea)
    if rgb is None:
        return None

    try:
        captura = consultar_captura_activa(url_api)
    except ErrorConsultaCaptura as error:
        logging.error('Lectura descartada: no se pudo consultar la captura activa. %s', error)
        return False

    if captura is None:
        logging.warning('Lectura descartada: ningún lote está capturando. Elige el lote y el '
                        'modo en la pantalla del lote (/lotes/<id>).')
        return False

    modo = captura['modo']
    if modo not in MODOS_QUE_ENVIAN:
        logging.error('Lectura descartada: modo de captura desconocido "%s"', modo)
        return False

    es_muestra = modo == MODO_MUESTRA
    logging.info('Lote %s (%s), modo %s', captura['loteId'], captura.get('codigo', '?'), modo)
    return enviar_lectura(url_api, construir_cuerpo(captura['loteId'], rgb, es_muestra))


def abrir_puerto(puerto):
    """Abre el puerto serial y espera a que el Arduino termine de reiniciarse.

    Abrir el puerto reinicia el Nano por la línea DTR, y lo que se envíe antes
    de que arranque se pierde.
    """
    conexion = serial.Serial(puerto, VELOCIDAD_SERIAL, timeout=1)
    time.sleep(ESPERA_REINICIO_ARDUINO_SEGUNDOS)
    conexion.reset_input_buffer()
    return conexion


def leer_linea(conexion):
    """Lee una línea del puerto como texto ('' si se agotó la espera sin datos)."""
    return conexion.readline().decode('utf-8', errors='replace')


def consultar_estado_calibracion(conexion, tiempo_espera=TIEMPO_ESPERA_CALIBRACION_SEGUNDOS):
    """Envía "CALIBRAR;VER" y devuelve el estado que responde el Arduino.

    Devuelve 'VALIDA', 'SIN_CALIBRAR' (u otro estado que informe el firmware), o
    None si no llega la respuesta a tiempo. Las demás líneas que lleguen mientras
    tanto se descartan; el firmware reinicia la lectura en curso al recibir el comando.
    """
    conexion.write(COMANDO_VER_CALIBRACION)
    conexion.flush()
    limite = time.monotonic() + tiempo_espera
    while time.monotonic() < limite:
        linea = leer_linea(conexion).strip()
        if linea.startswith(PREFIJO_ESTADO_CALIBRACION):
            return linea[len(PREFIJO_ESTADO_CALIBRACION):]
        if linea.startswith(PREFIJO_LECTURA):
            logging.warning('Lectura descartada mientras se verificaba la calibración: %s', linea)
    return None


def verificar_calibracion(conexion, tiempo_espera=TIEMPO_ESPERA_CALIBRACION_SEGUNDOS):
    """Consulta la calibración del Arduino al abrir el puerto y avisa si falta.

    El aviso del arranque (AVISO;SIN_CALIBRAR) se pierde al limpiar el búfer de
    entrada, y sin calibración el firmware no envía lecturas: sin este aviso el
    puente quedaría en silencio. Devuelve el estado, o None si no hubo respuesta.
    """
    estado = consultar_estado_calibracion(conexion, tiempo_espera)
    if estado == ESTADO_CALIBRACION_VALIDA:
        logging.info('Calibración del sensor: válida')
    elif estado == ESTADO_SIN_CALIBRAR:
        logging.warning(
            'EL SENSOR NO ESTÁ CALIBRADO: el Arduino no enviará lecturas. Calíbralo con los '
            'comandos CALIBRAR;BLANCO, CALIBRAR;NEGRO, CALIBRAR;VACIO y CALIBRAR;GUARDAR '
            '(ver firmware/chromacheck_sensor) y vuelve a iniciar el puente.')
    elif estado is None:
        logging.warning('El Arduino no respondió a CALIBRAR;VER: revisa el puerto y que tenga '
                        'cargado el firmware de ChromaCheck.')
    else:
        logging.warning('Estado de calibración desconocido: %s', estado)
    return estado


def ejecutar_puente(puerto, lote_id, url_api, es_muestra=False):
    """Lee el puerto y reenvía cada lectura a la API hasta que se interrumpa.

    Con es_muestra termina tras la primera lectura y devuelve si quedó registrada.
    """
    with abrir_puerto(puerto) as conexion:
        verificar_calibracion(conexion)
        logging.info('Escuchando %s a %s baudios; lote %s; API %s',
                     puerto, VELOCIDAD_SERIAL, lote_id, url_api)
        while True:
            linea = leer_linea(conexion)
            registrada = procesar_linea(linea, lote_id, url_api, es_muestra)
            if es_muestra and registrada is not None:
                return registrada


def ejecutar_puente_automatico(puerto, url_api):
    """Lee el puerto y envía cada lectura al lote y modo que eligió la web.

    No termina solo: sigue escuchando hasta que se interrumpa con Ctrl+C.
    """
    with abrir_puerto(puerto) as conexion:
        verificar_calibracion(conexion)
        logging.info('Escuchando %s a %s baudios en modo automático (el lote y el modo se '
                     'eligen en la web); API %s', puerto, VELOCIDAD_SERIAL, url_api)
        while True:
            procesar_linea_automatica(leer_linea(conexion), url_api)


def leer_argumentos(argumentos=None):
    """Lee los argumentos de la línea de comandos (o la lista dada, en las pruebas)."""
    lector = argparse.ArgumentParser(
        description='Reenvía las lecturas del sensor (puerto serial) a la API de ChromaCheck.')
    lector.add_argument('--puerto', required=True,
                        help='puerto del Arduino, por ejemplo COM3 o /dev/ttyUSB0')
    destino = lector.add_mutually_exclusive_group(required=True)
    destino.add_argument('--automatico', action='store_true',
                         help='envía cada lectura al lote y modo de captura elegidos en la web')
    destino.add_argument('--lote', type=int,
                         help='id del lote al que pertenecen las lecturas (modo manual)')
    lector.add_argument('--url', default=URL_API_POR_DEFECTO,
                        help=f'dirección base de la API (por defecto {URL_API_POR_DEFECTO})')
    lector.add_argument('--muestra', action='store_true',
                        help='con --lote: registra la primera lectura como tarro muestra y termina')
    leidos = lector.parse_args(argumentos)
    if leidos.automatico and leidos.muestra:
        lector.error('--muestra no se usa con --automatico: el modo lo elige la web')
    return leidos


def main():
    logging.basicConfig(level=logging.INFO, format='%(asctime)s %(levelname)s %(message)s',
                        datefmt='%H:%M:%S')
    argumentos = leer_argumentos()
    try:
        if argumentos.automatico:
            registrada = ejecutar_puente_automatico(argumentos.puerto, argumentos.url)
        else:
            registrada = ejecutar_puente(argumentos.puerto, argumentos.lote, argumentos.url,
                                         argumentos.muestra)
    except serial.SerialException as error:
        logging.error('Falló el puerto serial %s: %s', argumentos.puerto, error)
        return 1
    except KeyboardInterrupt:
        logging.info('Puente detenido')
        return 0
    return 0 if registrada is not False else 1


if __name__ == '__main__':
    sys.exit(main())
