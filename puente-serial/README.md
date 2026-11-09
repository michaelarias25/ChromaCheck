# Puente serial

Lee las lecturas que el Arduino envía por el puerto serial (`LECTURA;R;G;B`, 9600 baudios, ver `firmware/chromacheck_sensor/`) y las reenvía a `POST /api/tarros`. Convierte el RGB a hex (`#RRGGBB`) antes de enviarlo.

## Instalación

Requiere Python 3.12.

En Windows (PowerShell):

```powershell
cd puente-serial
python -m venv .venv
.venv\Scripts\Activate.ps1
pip install -r requirements.txt
```

Si PowerShell bloquea la activación con un error como "la ejecución de scripts está deshabilitada en este sistema", permitir los scripts locales solo para el usuario actual y volver a activar:

```powershell
Set-ExecutionPolicy -Scope CurrentUser RemoteSigned
.venv\Scripts\Activate.ps1
```

En Linux o macOS:

```bash
cd puente-serial
python -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt
```

## Uso: modo automático (recomendado)

Con `--automatico`, el lote y el modo de captura se eligen en la web y el puente los sigue solo. No hace falta reiniciarlo para pasar de la muestra a la recolección ni para cambiar de lote.

1. Con el servidor de ChromaCheck en marcha y el Arduino conectado, iniciar el puente y dejarlo abierto:

   ```powershell
   python puente_serial.py --puerto COM3 --automatico
   ```

   Al abrir el puerto, el puente pregunta al Arduino si está calibrado (`CALIBRAR;VER`). Si no lo está, muestra en consola **EL SENSOR NO ESTÁ CALIBRADO**: sin calibración el Arduino no envía lecturas. Ver [Calibración](#calibración).
2. En la app, crear el lote con **Agregar lote** y abrir **Ver Monitoreo de Lote**.
3. En la sección **Captura del sensor**, pulsar **Registrar muestra** y poner el tarro muestra frente al sensor. El puente la envía como muestra, y el lote vuelve solo a `Inactivo`.
4. Pulsar **Iniciar recolección** y pasar los demás tarros. Cada lectura se envía como lectura del lote.
5. Al terminar, pulsar **Detener recolección** para liberar el sensor, y detener el puente con `Ctrl+C`.

Por cada `LECTURA` el puente consulta `GET /api/captura/activa` y sigue el contrato de `docs/api.md` (sección *Contrato con el puente serial*):

| Captura activa | Qué hace el puente |
| --- | --- |
| Ningún lote capturando (`datos: null`) | Descarta la lectura y lo dice en consola |
| Modo `Muestra` | La envía como tarro muestra del lote (`esMuestra: true`) |
| Modo `Recoleccion` | La envía como lectura del lote (con `rgb`) |
| La API responde 409 o no responde | Lo registra en consola y sigue leyendo |

Si una alerta roja pausa el lote, la API detiene su captura y las lecturas siguientes se descartan hasta que se elija otro lote.

## Uso: lote fijo (manual)

Sigue funcionando como antes. El lote debe estar en el modo que corresponde (botones de **Captura del sensor**); si no, la API responde 409 y el script solo lo registra en consola.

```powershell
# Con el lote en modo Muestra: registra la primera lectura como muestra y termina
python puente_serial.py --puerto COM3 --lote 1 --muestra

# Con el lote en modo Recoleccion: envía cada lectura al lote 1 hasta Ctrl+C
python puente_serial.py --puerto COM3 --lote 1
```

Sin navegador, el modo se puede cambiar con `PATCH /api/lotes/<id>/captura`, que exige sesión, usando `curl.exe` desde PowerShell. Hay que escribir `curl.exe`, no `curl`, que en PowerShell es otro comando. Primero se inicia sesión y la cookie se guarda en `cookies.txt`; al terminar, borrar `cookies.txt`:

```powershell
curl.exe -c cookies.txt -H "Content-Type: application/json" -d '{\"nombreUsuario\":\"<usuario>\",\"contrasena\":\"<contrasena>\"}' http://localhost:3000/api/auth/login
curl.exe -b cookies.txt -X PATCH -H "Content-Type: application/json" -d '{\"modo\":\"Muestra\"}' http://localhost:3000/api/lotes/1/captura
```

## Opciones

| Opción | Descripción |
| --- | --- |
| `--puerto` | Puerto del Arduino: `COM3` en Windows, `/dev/ttyUSB0` en Linux. Obligatoria |
| `--automatico` | Envía cada lectura al lote y modo elegidos en la web. No se combina con `--lote` ni `--muestra` |
| `--lote` | Id del lote al que pertenecen las lecturas (modo manual). Se usa `--lote` o `--automatico`, no los dos |
| `--muestra` | Solo con `--lote`: registra la primera lectura como tarro muestra y termina |
| `--url` | Dirección base de la API. Por defecto `http://localhost:3000` |

## Calibración

Al abrir el puerto, el Arduino se reinicia y avisa si no está calibrado. El puente limpia ese aviso junto con el resto del búfer de entrada, por eso después envía `CALIBRAR;VER` y lee la respuesta:

| Respuesta del Arduino | Consola del puente |
| --- | --- |
| `CALIBRACION;ESTADO;VALIDA` | `Calibración del sensor: válida` |
| `CALIBRACION;ESTADO;SIN_CALIBRAR` | Aviso **EL SENSOR NO ESTÁ CALIBRADO**: el Arduino no enviará lecturas |
| Nada en 3 segundos | Aviso de que el Arduino no respondió: revisar el puerto y el firmware |

Para calibrar, detener el puente (el puerto solo lo puede usar un programa a la vez), abrir el Monitor Serie de Arduino a 9600 baudios con fin de línea "Nueva línea" y enviar `CALIBRAR;BLANCO`, `CALIBRAR;NEGRO`, `CALIBRAR;VACIO` y `CALIBRAR;GUARDAR` según `firmware/chromacheck_sensor/`. Después, volver a iniciar el puente.

## Comportamiento

- Solo se envían las líneas que empiezan con `LECTURA;` y tienen tres canales de 0 a 255. Los avisos (`AVISO;...`) se muestran en consola. La depuración y el ruido se ignoran.
- Al abrir el puerto el script espera 2 segundos, porque abrirlo reinicia el Arduino, y luego verifica la calibración.
- Si la API responde con error o no está disponible, el script lo registra en consola y sigue leyendo.
- Si el puerto serial falla (por ejemplo, se desconecta el Arduino), el script termina con código 1.

## Pruebas

```powershell
cd puente-serial
python -m unittest
```

Usan una API falsa local y un puerto serial simulado. No necesitan el Arduino ni el servidor de ChromaCheck.
