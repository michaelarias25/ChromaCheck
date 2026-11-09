import contextlib
import io
import json
import threading
import unittest
from http.server import BaseHTTPRequestHandler, HTTPServer
from unittest import mock

from puente_serial import (
    ErrorConsultaCaptura,
    construir_cuerpo,
    consultar_captura_activa,
    convertir_rgb_a_hex,
    ejecutar_puente,
    ejecutar_puente_automatico,
    enviar_lectura,
    interpretar_linea,
    leer_argumentos,
    procesar_linea,
    procesar_linea_automatica,
    verificar_calibracion,
)


class PruebasInterpretarLinea(unittest.TestCase):
    def test_lectura_valida(self):
        self.assertEqual(interpretar_linea('LECTURA;227;83;55'), (227, 83, 55))

    def test_ignora_fin_de_linea_del_firmware(self):
        self.assertEqual(interpretar_linea('LECTURA;0;128;255\r\n'), (0, 128, 255))

    def test_ignora_avisos_y_depuracion(self):
        lineas = ('AVISO;LISTO', 'DEPURACION;LECTURA_DESCARTADA', 'CALIBRACION;OK;GUARDADA', '')
        for linea in lineas:
            with self.subTest(linea=linea):
                self.assertIsNone(interpretar_linea(linea))

    def test_rechaza_lecturas_mal_formadas(self):
        lineas = (
            'LECTURA;1;2',
            'LECTURA;1;2;3;4',
            'LECTURA;a;2;3',
            'LECTURA;-1;2;3',
            'LECTURA;1.5;2;3',
            'LECTURA;;2;3',
            'LECTURA;256;0;0',
            'lectura;1;2;3',
        )
        for linea in lineas:
            with self.subTest(linea=linea):
                self.assertIsNone(interpretar_linea(linea))


class PruebasConvertirRgbAHex(unittest.TestCase):
    def test_convierte_a_hex_con_ceros_a_la_izquierda(self):
        self.assertEqual(convertir_rgb_a_hex((227, 83, 55)), '#E35337')
        self.assertEqual(convertir_rgb_a_hex((0, 5, 255)), '#0005FF')


class PruebasConstruirCuerpo(unittest.TestCase):
    def test_lectura_lleva_rgb_y_hex_del_mismo_color(self):
        self.assertEqual(
            construir_cuerpo(3, (227, 83, 55)),
            {'loteId': 3, 'resultadoHex': '#E35337', 'rgb': [227, 83, 55]},
        )

    def test_muestra_lleva_es_muestra_y_no_rgb(self):
        self.assertEqual(
            construir_cuerpo(3, (227, 83, 55), es_muestra=True),
            {'loteId': 3, 'resultadoHex': '#E35337', 'esMuestra': True},
        )


class ApiFalsa(BaseHTTPRequestHandler):
    """Servidor de prueba que responde con el estado y el cuerpo configurados."""

    estado = 201
    cuerpo_respuesta = b'{"exito": true, "datos": {}}'
    cuerpos_recibidos = []
    # Respuesta de GET /api/captura/activa (modo automático)
    estado_captura = 200
    captura_activa = None
    consultas_captura = 0

    def do_GET(self):
        ApiFalsa.consultas_captura += 1
        estado = ApiFalsa.estado_captura
        cuerpo = json.dumps({'exito': True, 'datos': ApiFalsa.captura_activa}).encode('utf-8')
        if self.path != '/api/captura/activa':
            estado, cuerpo = 404, b'{"exito": false, "error": "Ruta inexistente"}'
        self.send_response(estado)
        self.send_header('Content-Type', 'application/json')
        self.end_headers()
        self.wfile.write(cuerpo)

    def do_POST(self):
        largo = int(self.headers['Content-Length'])
        ApiFalsa.cuerpos_recibidos.append((self.path, json.loads(self.rfile.read(largo))))
        self.send_response(ApiFalsa.estado)
        self.send_header('Content-Type', 'application/json')
        self.end_headers()
        self.wfile.write(ApiFalsa.cuerpo_respuesta)

    def log_message(self, *argumentos):
        pass


class PruebasEnviarLectura(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        cls.servidor = HTTPServer(('127.0.0.1', 0), ApiFalsa)
        cls.url = f'http://127.0.0.1:{cls.servidor.server_port}'
        threading.Thread(target=cls.servidor.serve_forever, daemon=True).start()

    @classmethod
    def tearDownClass(cls):
        cls.servidor.shutdown()
        cls.servidor.server_close()

    def setUp(self):
        ApiFalsa.estado = 201
        ApiFalsa.cuerpo_respuesta = b'{"exito": true, "datos": {}}'
        ApiFalsa.cuerpos_recibidos = []

    def test_envia_la_lectura_a_api_tarros(self):
        cuerpo = construir_cuerpo(1, (227, 83, 55))
        self.assertTrue(enviar_lectura(self.url, cuerpo))
        self.assertEqual(ApiFalsa.cuerpos_recibidos, [('/api/tarros', cuerpo)])

    def test_error_de_la_api_se_registra_sin_lanzar_excepcion(self):
        ApiFalsa.estado = 409
        ApiFalsa.cuerpo_respuesta = b'{"exito": false, "error": "El lote no tiene muestra"}'
        with self.assertLogs(level='ERROR') as registro:
            self.assertFalse(enviar_lectura(self.url, construir_cuerpo(1, (1, 2, 3))))
        self.assertIn('409', registro.output[0])
        self.assertIn('El lote no tiene muestra', registro.output[0])

    def test_respuesta_que_no_es_json_se_registra_sin_lanzar_excepcion(self):
        ApiFalsa.estado = 500
        ApiFalsa.cuerpo_respuesta = b'<html>Error</html>'
        with self.assertLogs(level='ERROR') as registro:
            self.assertFalse(enviar_lectura(self.url, construir_cuerpo(1, (1, 2, 3))))
        self.assertIn('500', registro.output[0])

    def test_api_apagada_se_registra_sin_lanzar_excepcion(self):
        with self.assertLogs(level='ERROR'):
            self.assertFalse(enviar_lectura('http://127.0.0.1:9', construir_cuerpo(1, (1, 2, 3))))

    def test_procesar_linea_envia_solo_las_lecturas(self):
        self.assertIsNone(procesar_linea('AVISO;LISTO', 1, self.url))
        self.assertEqual(ApiFalsa.cuerpos_recibidos, [])

        self.assertTrue(procesar_linea('LECTURA;227;83;55\r\n', 1, self.url))
        self.assertEqual(ApiFalsa.cuerpos_recibidos[0][1]['rgb'], [227, 83, 55])

    def test_procesar_linea_como_muestra_no_envia_rgb(self):
        self.assertTrue(procesar_linea('LECTURA;227;83;55', 1, self.url, es_muestra=True))
        self.assertEqual(
            ApiFalsa.cuerpos_recibidos[0][1],
            {'loteId': 1, 'resultadoHex': '#E35337', 'esMuestra': True},
        )

    def test_procesar_linea_sigue_tras_un_error_de_la_api(self):
        ApiFalsa.estado = 500
        with self.assertLogs(level='ERROR'):
            self.assertFalse(procesar_linea('LECTURA;1;2;3', 1, self.url))
        ApiFalsa.estado = 201
        self.assertTrue(procesar_linea('LECTURA;1;2;3', 1, self.url))


class PruebasModoAutomatico(unittest.TestCase):
    """Contrato de docs/api.md: por cada lectura, consultar la captura activa y enviar."""

    @classmethod
    def setUpClass(cls):
        cls.servidor = HTTPServer(('127.0.0.1', 0), ApiFalsa)
        cls.url = f'http://127.0.0.1:{cls.servidor.server_port}'
        threading.Thread(target=cls.servidor.serve_forever, daemon=True).start()

    @classmethod
    def tearDownClass(cls):
        cls.servidor.shutdown()
        cls.servidor.server_close()

    def setUp(self):
        ApiFalsa.estado = 201
        ApiFalsa.cuerpo_respuesta = b'{"exito": true, "datos": {}}'
        ApiFalsa.cuerpos_recibidos = []
        ApiFalsa.estado_captura = 200
        ApiFalsa.captura_activa = None
        ApiFalsa.consultas_captura = 0

    def poner_captura(self, modo):
        ApiFalsa.captura_activa = {'loteId': 7, 'codigo': '#007_Prueba', 'modo': modo}

    def test_linea_que_no_es_lectura_no_consulta_la_api(self):
        self.assertIsNone(procesar_linea_automatica('AVISO;LISTO', self.url))
        self.assertEqual(ApiFalsa.consultas_captura, 0)

    def test_sin_captura_activa_descarta_la_lectura_y_lo_registra(self):
        with self.assertLogs(level='WARNING') as registro:
            self.assertFalse(procesar_linea_automatica('LECTURA;1;2;3', self.url))
        self.assertIn('ningún lote está capturando', registro.output[0])
        self.assertEqual(ApiFalsa.cuerpos_recibidos, [])

    def test_modo_muestra_envia_la_muestra_del_lote_activo(self):
        self.poner_captura('Muestra')
        self.assertTrue(procesar_linea_automatica('LECTURA;227;83;55', self.url))
        self.assertEqual(
            ApiFalsa.cuerpos_recibidos,
            [('/api/tarros', {'loteId': 7, 'resultadoHex': '#E35337', 'esMuestra': True})],
        )

    def test_modo_recoleccion_envia_la_lectura_con_rgb(self):
        self.poner_captura('Recoleccion')
        self.assertTrue(procesar_linea_automatica('LECTURA;227;83;55', self.url))
        self.assertEqual(
            ApiFalsa.cuerpos_recibidos,
            [('/api/tarros', {'loteId': 7, 'resultadoHex': '#E35337', 'rgb': [227, 83, 55]})],
        )

    def test_consulta_la_captura_en_cada_lectura(self):
        self.poner_captura('Muestra')
        self.assertTrue(procesar_linea_automatica('LECTURA;1;2;3', self.url))
        self.poner_captura('Recoleccion')
        self.assertTrue(procesar_linea_automatica('LECTURA;4;5;6', self.url))
        self.assertEqual(ApiFalsa.consultas_captura, 2)
        self.assertIn('esMuestra', ApiFalsa.cuerpos_recibidos[0][1])
        self.assertIn('rgb', ApiFalsa.cuerpos_recibidos[1][1])

    def test_409_de_la_api_se_registra_y_sigue_leyendo(self):
        self.poner_captura('Recoleccion')
        ApiFalsa.estado = 409
        ApiFalsa.cuerpo_respuesta = (
            '{"exito": false, "error": "El lote está pausado por una alerta roja"}'.encode())
        with self.assertLogs(level='ERROR') as registro:
            self.assertFalse(procesar_linea_automatica('LECTURA;1;2;3', self.url))
        self.assertIn('409', registro.output[0])
        self.assertIn('pausado', registro.output[0])

        ApiFalsa.estado = 201
        self.assertTrue(procesar_linea_automatica('LECTURA;1;2;3', self.url))

    def test_api_caida_se_registra_sin_lanzar_excepcion(self):
        with self.assertLogs(level='ERROR') as registro:
            self.assertFalse(procesar_linea_automatica('LECTURA;1;2;3', 'http://127.0.0.1:9'))
        self.assertIn('no se pudo consultar la captura activa', registro.output[0])

    def test_error_al_consultar_la_captura_descarta_la_lectura(self):
        ApiFalsa.estado_captura = 500
        with self.assertLogs(level='ERROR') as registro:
            self.assertFalse(procesar_linea_automatica('LECTURA;1;2;3', self.url))
        self.assertIn('500', registro.output[0])
        self.assertEqual(ApiFalsa.cuerpos_recibidos, [])

    def test_modo_desconocido_descarta_la_lectura(self):
        self.poner_captura('Inactivo')
        with self.assertLogs(level='ERROR'):
            self.assertFalse(procesar_linea_automatica('LECTURA;1;2;3', self.url))
        self.assertEqual(ApiFalsa.cuerpos_recibidos, [])

    def test_consultar_captura_activa_devuelve_none_sin_captura(self):
        self.assertIsNone(consultar_captura_activa(self.url))

    def test_consultar_captura_activa_rechaza_formato_inesperado(self):
        ApiFalsa.captura_activa = {'loteId': '7', 'modo': 'Muestra'}
        with self.assertRaises(ErrorConsultaCaptura):
            consultar_captura_activa(self.url)


class PuertoSimulado:
    """Imita el puerto serial: entrega las líneas configuradas y guarda lo que se escribe.

    Cuando se acaban las líneas, readline devuelve b'' como un puerto real al
    agotar su espera; con al_terminar se puede lanzar una excepción para cortar
    los bucles infinitos del puente.
    """

    def __init__(self, lineas, al_terminar=None):
        self.lineas = [linea.encode('utf-8') + b'\r\n' for linea in lineas]
        self.escrito = b''
        self.al_terminar = al_terminar

    def write(self, datos):
        self.escrito += datos

    def flush(self):
        pass

    def readline(self):
        if self.lineas:
            return self.lineas.pop(0)
        if self.al_terminar:
            raise self.al_terminar
        return b''

    def __enter__(self):
        return self

    def __exit__(self, *argumentos):
        return False


class PruebasVerificarCalibracion(unittest.TestCase):
    def test_envia_calibrar_ver(self):
        puerto = PuertoSimulado(['CALIBRACION;ESTADO;VALIDA'])
        verificar_calibracion(puerto, tiempo_espera=1)
        self.assertEqual(puerto.escrito, b'CALIBRAR;VER\n')

    def test_sensor_calibrado_se_informa(self):
        puerto = PuertoSimulado(['CALIBRACION;ESTADO;VALIDA', 'CALIBRACION;BLANCO;1;2;3;4'])
        with self.assertLogs(level='INFO') as registro:
            self.assertEqual(verificar_calibracion(puerto, tiempo_espera=1), 'VALIDA')
        self.assertIn('válida', registro.output[0])

    def test_sensor_sin_calibrar_muestra_un_aviso_claro(self):
        puerto = PuertoSimulado(['AVISO;LISTO', 'CALIBRACION;ESTADO;SIN_CALIBRAR'])
        with self.assertLogs(level='WARNING') as registro:
            self.assertEqual(verificar_calibracion(puerto, tiempo_espera=1), 'SIN_CALIBRAR')
        self.assertEqual(len(registro.records), 1)
        self.assertIn('NO ESTÁ CALIBRADO', registro.output[0])
        self.assertIn('CALIBRAR;GUARDAR', registro.output[0])

    def test_sin_respuesta_avisa_y_no_bloquea(self):
        with self.assertLogs(level='WARNING') as registro:
            self.assertIsNone(verificar_calibracion(PuertoSimulado([]), tiempo_espera=0.1))
        self.assertIn('no respondió a CALIBRAR;VER', registro.output[0])

    def test_lectura_durante_la_verificacion_se_descarta_con_aviso(self):
        puerto = PuertoSimulado(['LECTURA;1;2;3', 'CALIBRACION;ESTADO;VALIDA'])
        with self.assertLogs(level='WARNING') as registro:
            self.assertEqual(verificar_calibracion(puerto, tiempo_espera=1), 'VALIDA')
        self.assertIn('LECTURA;1;2;3', registro.output[0])


class PruebasLeerArgumentos(unittest.TestCase):
    def leer_con_error(self, argumentos):
        with contextlib.redirect_stderr(io.StringIO()), self.assertRaises(SystemExit):
            leer_argumentos(argumentos)

    def test_modo_automatico_no_necesita_lote(self):
        leidos = leer_argumentos(['--puerto', 'COM3', '--automatico'])
        self.assertTrue(leidos.automatico)
        self.assertIsNone(leidos.lote)
        self.assertFalse(leidos.muestra)

    def test_modos_manuales_siguen_igual(self):
        leidos = leer_argumentos(['--puerto', 'COM3', '--lote', '1'])
        self.assertEqual((leidos.lote, leidos.muestra, leidos.automatico), (1, False, False))
        leidos = leer_argumentos(['--puerto', 'COM3', '--lote', '1', '--muestra'])
        self.assertEqual((leidos.lote, leidos.muestra), (1, True))

    def test_exige_lote_o_automatico(self):
        self.leer_con_error(['--puerto', 'COM3'])
        self.leer_con_error(['--puerto', 'COM3', '--muestra'])

    def test_automatico_excluye_lote_y_muestra(self):
        self.leer_con_error(['--puerto', 'COM3', '--automatico', '--lote', '1'])
        self.leer_con_error(['--puerto', 'COM3', '--automatico', '--muestra'])


class PruebasEjecutarPuente(unittest.TestCase):
    """Bucle completo con un puerto simulado: calibración, lectura y envío a la API falsa."""

    @classmethod
    def setUpClass(cls):
        cls.servidor = HTTPServer(('127.0.0.1', 0), ApiFalsa)
        cls.url = f'http://127.0.0.1:{cls.servidor.server_port}'
        threading.Thread(target=cls.servidor.serve_forever, daemon=True).start()

    @classmethod
    def tearDownClass(cls):
        cls.servidor.shutdown()
        cls.servidor.server_close()

    def setUp(self):
        ApiFalsa.estado = 201
        ApiFalsa.cuerpo_respuesta = b'{"exito": true, "datos": {}}'
        ApiFalsa.cuerpos_recibidos = []
        ApiFalsa.estado_captura = 200
        ApiFalsa.captura_activa = None
        ApiFalsa.consultas_captura = 0

    def test_lote_con_muestra_sigue_terminando_tras_la_primera_lectura(self):
        puerto = PuertoSimulado([
            'CALIBRACION;ESTADO;VALIDA', 'AVISO;LISTO', 'LECTURA;227;83;55', 'LECTURA;1;2;3'])
        with mock.patch('puente_serial.abrir_puerto', return_value=puerto), \
                self.assertLogs(level='INFO'):
            self.assertTrue(ejecutar_puente('COM3', 4, self.url, es_muestra=True))
        self.assertEqual(puerto.escrito, b'CALIBRAR;VER\n')
        self.assertEqual(
            ApiFalsa.cuerpos_recibidos,
            [('/api/tarros', {'loteId': 4, 'resultadoHex': '#E35337', 'esMuestra': True})],
        )
        self.assertEqual(ApiFalsa.consultas_captura, 0)

    def test_lote_sin_muestra_sigue_enviando_lecturas_al_lote_fijo(self):
        puerto = PuertoSimulado(
            ['CALIBRACION;ESTADO;VALIDA', 'LECTURA;1;2;3', 'LECTURA;4;5;6'],
            al_terminar=KeyboardInterrupt())
        with mock.patch('puente_serial.abrir_puerto', return_value=puerto), \
                self.assertLogs(level='INFO'), self.assertRaises(KeyboardInterrupt):
            ejecutar_puente('COM3', 4, self.url)
        self.assertEqual([cuerpo['loteId'] for _, cuerpo in ApiFalsa.cuerpos_recibidos], [4, 4])
        self.assertEqual(ApiFalsa.consultas_captura, 0)

    def test_automatico_avisa_sin_calibrar_y_envia_segun_la_captura(self):
        ApiFalsa.captura_activa = {'loteId': 9, 'codigo': '#009', 'modo': 'Recoleccion'}
        puerto = PuertoSimulado(
            ['CALIBRACION;ESTADO;SIN_CALIBRAR', 'LECTURA;1;2;3'],
            al_terminar=KeyboardInterrupt())
        with mock.patch('puente_serial.abrir_puerto', return_value=puerto), \
                self.assertLogs(level='INFO') as registro, self.assertRaises(KeyboardInterrupt):
            ejecutar_puente_automatico('COM3', self.url)
        self.assertTrue(any('NO ESTÁ CALIBRADO' in linea for linea in registro.output))
        self.assertEqual(
            ApiFalsa.cuerpos_recibidos,
            [('/api/tarros', {'loteId': 9, 'resultadoHex': '#010203', 'rgb': [1, 2, 3]})],
        )


if __name__ == '__main__':
    unittest.main()
