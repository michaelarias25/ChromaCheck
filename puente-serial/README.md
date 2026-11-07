# Puente serial

Lee las lecturas que el Arduino envía por el puerto serial (`LECTURA;R;G;B`, 9600 baudios, ver `firmware/chromacheck_sensor/`) y las reenvía a `POST /api/tarros`. Convierte el RGB a hex (`#RRGGBB`) antes de enviarlo.

## Instalación

Requiere Python 3.

```bash
cd puente-serial
python -m venv .venv
source .venv/bin/activate   # en Windows: .venv\Scripts\activate
pip install -r requirements.txt
```

## Uso

1. Con el servidor de ChromaCheck en marcha y el Arduino conectado, crear el lote (`POST /api/lotes`) y anotar su `id`.
2. Registrar el tarro muestra del lote. Es la primera lectura y el script termina al registrarla:

   ```bash
   python puente_serial.py --puerto COM3 --lote 1 --muestra
   ```

3. Registrar las lecturas de los demás tarros. El script queda escuchando hasta que se detenga con `Ctrl+C`:

   ```bash
   python puente_serial.py --puerto COM3 --lote 1
   ```

| Opción | Descripción |
| --- | --- |
| `--puerto` | Puerto del Arduino: `COM3` en Windows, `/dev/ttyUSB0` en Linux |
| `--lote` | Id del lote al que pertenecen las lecturas |
| `--url` | Dirección base de la API. Por defecto `http://localhost:3000` |
| `--muestra` | Registra la primera lectura como tarro muestra y termina |

## Comportamiento

- Solo se envían las líneas que empiezan con `LECTURA;` y tienen tres canales de 0 a 255. Los avisos (`AVISO;...`), la depuración y el ruido se ignoran.
- Al abrir el puerto el script espera 2 segundos, porque abrirlo reinicia el Arduino.
- Si la API responde con error o no está disponible, el script lo registra en consola y sigue leyendo.
- Si el puerto serial falla (por ejemplo, se desconecta el Arduino), el script termina con código 1.

## Pruebas

```bash
cd puente-serial
python -m unittest
```
