"""Puente serial → API de ChromaCheck.

Lee las lecturas que el Arduino envía por el puerto serial con el formato
"LECTURA;R;G;B" y las reenvía al endpoint POST /api/tarros.
"""

PREFIJO_LECTURA = 'LECTURA;'
CANALES_POR_LECTURA = 3
VALOR_MAXIMO_CANAL = 255


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
