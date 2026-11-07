"""Puente serial → API de ChromaCheck.

Lee las lecturas que el Arduino envía por el puerto serial con el formato
"LECTURA;R;G;B" y las reenvía al endpoint POST /api/tarros.
"""
import logging

import requests

PREFIJO_LECTURA = 'LECTURA;'
CANALES_POR_LECTURA = 3
VALOR_MAXIMO_CANAL = 255
RUTA_TARROS = '/api/tarros'
TIEMPO_ESPERA_API_SEGUNDOS = 5
LONGITUD_MAXIMA_MENSAJE = 200


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
