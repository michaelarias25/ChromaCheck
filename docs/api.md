# API de ChromaCheck

Todas las respuestas son JSON con el mismo formato:

```json
{ "exito": true, "datos": ... }
{ "exito": false, "error": "mensaje" }
```

Los errores 500 responden siempre `"Error interno del servidor"`; el detalle queda solo en el registro del servidor.

## Lotes

### `GET /api/lotes`

Lista todos los lotes, del más reciente al más antiguo.

| Código | Caso |
| --- | --- |
| 200 | Lista de lotes |

### `POST /api/lotes`

Crea un lote.

```json
{ "codigo": "#005_Azul_Cielo" }
```

| Código | Caso |
| --- | --- |
| 201 | Lote creado |
| 400 | El cuerpo no es un objeto JSON o falta `codigo` |

## Tarros

### `GET /api/tarros?loteId=N`

Lista todos los tarros de un lote (muestra incluida), del más antiguo al más reciente.

| Código | Caso |
| --- | --- |
| 200 | Lista de tarros |
| 400 | `loteId` no es un entero positivo |

### `POST /api/tarros`

Registra el tarro muestra de un lote o una lectura del sensor.

Tarro muestra (uno por lote):

```json
{ "loteId": 1, "resultadoHex": "#E35336", "esMuestra": true }
```

Lectura del sensor (calcula deltaE frente a la muestra y genera alertas):

```json
{ "loteId": 1, "resultadoHex": "#E35337", "rgb": [227, 83, 55] }
```

| Campo | Regla |
| --- | --- |
| `loteId` | Entero positivo de un lote existente |
| `resultadoHex` | Color con formato `#RRGGBB` |
| `rgb` | Solo en lecturas: `[r, g, b]` con enteros de 0 a 255, el mismo color que `resultadoHex` |
| `esMuestra` | Opcional; `true` registra el tarro muestra |

| Código | Caso |
| --- | --- |
| 201 | Tarro registrado |
| 400 | Cuerpo inválido, o `loteId`, `resultadoHex` o `rgb` con formato incorrecto, o `rgb` distinto de `resultadoHex` |
| 404 | El lote no existe |
| 409 | El lote ya tiene muestra (al registrar otra), no tiene muestra (al registrar una lectura) o está `Pausado` por una alerta roja |
