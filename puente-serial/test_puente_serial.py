import json
import threading
import unittest
from http.server import BaseHTTPRequestHandler, HTTPServer

from puente_serial import (
    construir_cuerpo,
    convertir_rgb_a_hex,
    enviar_lectura,
    interpretar_linea,
    procesar_linea,
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


if __name__ == '__main__':
    unittest.main()
