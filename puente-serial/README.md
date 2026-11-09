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

1. Con el servidor de ChromaCheck en marcha y el Arduino conectado, crear el lote desde la app: iniciar sesión y usar el botón **Agregar lote** de la pantalla principal. `POST /api/lotes` exige sesión, así que ya no se crea con `curl`. El `id` del lote aparece en la dirección al abrir **Ver Monitoreo de Lote** (`/lotes/<id>`); también lo devuelve `GET /api/lotes`.
2. **Antes de usar `--lote`, poner el lote en el modo de captura correspondiente.** Hay un solo sensor: la API solo acepta la muestra si el lote está en modo `Muestra`, y las lecturas si está en modo `Recoleccion`. En cualquier otro caso responde 409 y el script solo registra el error en consola. Solo un lote a la vez puede estar capturando (ver `docs/api.md`, sección *Captura del sensor*).

   El modo se cambia desde la app, en la sección **Captura del sensor** de `/lotes/<id>`: **Registrar muestra** pone el lote en `Muestra`, **Iniciar recolección** en `Recoleccion`, y **Cancelar** o **Detener recolección** en `Inactivo`.

   Sin navegador, se puede usar `PATCH /api/lotes/<id>/captura`, que exige sesión, con `curl.exe` desde PowerShell (escribir `curl.exe`, no `curl`, que en PowerShell es otro comando). Primero se inicia sesión y la cookie se guarda en `cookies.txt`:

   ```powershell
   curl.exe -c cookies.txt -H "Content-Type: application/json" -d '{\"nombreUsuario\":\"<usuario>\",\"contrasena\":\"<contrasena>\"}' http://localhost:3000/api/auth/login
   curl.exe -b cookies.txt -X PATCH -H "Content-Type: application/json" -d '{\"modo\":\"Muestra\"}' http://localhost:3000/api/lotes/1/captura
   ```

   `GET /api/captura/activa` muestra qué lote está capturando y en qué modo. Al terminar, borrar `cookies.txt`.
3. Con el lote en modo `Muestra`, registrar el tarro muestra. Es la primera lectura y el script termina al registrarla. Al registrarse la muestra, el lote vuelve solo a `Inactivo`:

   ```bash
   python puente_serial.py --puerto COM3 --lote 1 --muestra
   ```

4. Poner el lote en modo `Recoleccion` (botón **Iniciar recolección**) y registrar las lecturas de los demás tarros. El script queda escuchando hasta que se detenga con `Ctrl+C`. Si una alerta roja pausa el lote, su modo pasa a `Inactivo` y las lecturas siguientes se rechazan:

   ```bash
   python puente_serial.py --puerto COM3 --lote 1
   ```

5. Al terminar, detener la captura (botón **Detener recolección**) para liberar el sensor.

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
