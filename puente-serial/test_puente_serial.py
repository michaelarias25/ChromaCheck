import unittest

from puente_serial import convertir_rgb_a_hex, interpretar_linea


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


if __name__ == '__main__':
    unittest.main()
