# API de ChromaCheck

Todas las respuestas son JSON con el mismo formato:

```json
{ "exito": true, "datos": ... }
{ "exito": false, "error": "mensaje" }
```

Los errores 500 responden siempre `"Error interno del servidor"`; el detalle queda solo en el registro del servidor.

## Lotes

### `GET /api/lotes`

Lista todos los lotes, del más reciente al más antiguo. Cada lote trae `id`, `codigo`, `estado`, `modo_captura` y `fecha_inicio`.

| Código | Caso           |
| ------ | -------------- |
| 200    | Lista de lotes |

### `POST /api/lotes`

Crea un lote. La usa solo la web (botón **Agregar lote** de la pantalla principal), por eso exige la cookie `sesion` de un usuario con sesión iniciada (ver `docs/contratos/autenticacion.md`). El puente serial no la llama.

```json
{ "codigo": "#005_Azul_Cielo" }
```

| Campo    | Regla                                                                                                                                                        |
| -------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `codigo` | Texto obligatorio, de 1 a 50 caracteres sin contar los espacios de los extremos (se recortan). Único: `#005_azul` y `#005_Azul` cuentan como el mismo código |

| Código | Caso                                                                        |
| ------ | --------------------------------------------------------------------------- |
| 201    | Lote creado                                                                 |
| 400    | El cuerpo no es un objeto JSON, falta `codigo` o tiene más de 50 caracteres |
| 401    | No hay sesión válida                                                        |
| 409    | Ya existe un lote con ese código                                            |

## Captura del sensor

Hay un solo sensor, así que la web decide qué lote recibe sus lecturas y en qué modo. El modo se guarda en `lotes.modo_captura`:

| Modo          | Qué hace                                                                                                   |
| ------------- | ---------------------------------------------------------------------------------------------------------- |
| `Inactivo`    | El lote no recibe lecturas. Es el modo por defecto                                                         |
| `Muestra`     | El próximo tarro leído se registra como muestra del lote. Al registrarla, el lote vuelve solo a `Inactivo` |
| `Recoleccion` | Cada tarro leído se registra como lectura y se compara con la muestra                                      |

Solo un lote a la vez puede tener un modo distinto de `Inactivo`. Lo garantiza el índice único parcial `lotes_un_lote_capturando`, aunque lleguen dos peticiones al mismo tiempo. Si una alerta roja pausa el lote, su modo pasa a `Inactivo` en la misma sentencia.

### `PATCH /api/lotes/[id]/captura`

Cambia el modo de captura del lote. La usa solo la web, por eso exige la cookie `sesion`.

```json
{ "modo": "Recoleccion" }
```

| Modo pedido   | Se permite si                                                              |
| ------------- | -------------------------------------------------------------------------- |
| `Inactivo`    | Siempre (detiene la captura)                                               |
| `Muestra`     | El lote está `Activo`, no tiene muestra y ningún otro lote está capturando |
| `Recoleccion` | El lote está `Activo`, ya tiene muestra y ningún otro lote está capturando |

| Código | Caso                                                                                                                      |
| ------ | ------------------------------------------------------------------------------------------------------------------------- |
| 200    | Modo cambiado; devuelve el lote actualizado                                                                               |
| 400    | El id no es un entero positivo, el cuerpo no es un objeto JSON o `modo` no es `Inactivo`, `Muestra` ni `Recoleccion`      |
| 401    | No hay sesión válida                                                                                                      |
| 404    | El lote no existe                                                                                                         |
| 409    | Otro lote ya está capturando, el lote está `Pausado`, pide `Muestra` y ya tiene muestra, o pide `Recoleccion` sin muestra |

### `POST /api/lotes/[id]/reanudar`

**Pendiente de implementar** (tarea 3.5 de [tareas.md](../tareas.md)). Reanuda un lote `Pausado` por una alerta roja: en la misma sentencia pasa `estado` a `Activo` y `modo_captura` a `Recoleccion`, para que la revisión siga sin otro clic (ver [F5](../specs/F5-alertas-y-pausa.md)). La usa solo la web, por eso exige la cookie `sesion`. No lleva cuerpo.

Las alertas y las lecturas anteriores se conservan. Si la desviación sigue en aumento, la siguiente lectura vuelve a pausar el lote.

| Código | Caso                                                    |
| ------ | ------------------------------------------------------- |
| 200    | Lote reanudado; devuelve el lote actualizado            |
| 400    | El id no es un entero positivo                          |
| 401    | No hay sesión válida                                    |
| 404    | El lote no existe                                       |
| 409    | El lote no está `Pausado` u otro lote está capturando   |

### `GET /api/captura/activa`

Indica qué lote está capturando. Está abierta (sin sesión) porque la consulta el puente serial.

```json
{ "exito": true, "datos": { "loteId": 1, "codigo": "#001_Terracota", "modo": "Recoleccion" } }
{ "exito": true, "datos": null }
```

`datos` es `null` cuando ningún lote está capturando.

| Código | Caso                     |
| ------ | ------------------------ |
| 200    | Captura activa, o `null` |

### Contrato con el puente serial

El puente lo sigue cuando se ejecuta con `--automatico` (ver `puente-serial/README.md`). Por cada `LECTURA;R;G;B` que recibe del Arduino:

1. Consultar `GET /api/captura/activa`.
2. Si `datos` es `null`, descartar la lectura sin enviarla.
3. Si `modo` es `Muestra`, enviar `POST /api/tarros` con `{ loteId, resultadoHex, esMuestra: true }`.
4. Si `modo` es `Recoleccion`, enviar `POST /api/tarros` con `{ loteId, resultadoHex, rgb }`.
5. Si la API responde 409 (por ejemplo, porque la web cambió el modo entre la consulta y el envío), registrar el mensaje y seguir leyendo.

## Tarros

### `GET /api/tarros?loteId=N`

Lista todos los tarros de un lote (muestra incluida), del más antiguo al más reciente.

| Código | Caso                              |
| ------ | --------------------------------- |
| 200    | Lista de tarros                   |
| 400    | `loteId` no es un entero positivo |

### `POST /api/tarros`

Registra el tarro muestra de un lote o una lectura del sensor. Sigue abierta (sin sesión) para el puente serial, pero depende del modo de captura del lote (ver [Captura del sensor](#captura-del-sensor)):

- La muestra solo se acepta si el lote está en modo `Muestra`. Al registrarla, el lote vuelve a `Inactivo` en la misma transacción.
- Las lecturas solo se aceptan si el lote está en modo `Recoleccion`.

Tarro muestra (uno por lote):

```json
{ "loteId": 1, "resultadoHex": "#E35336", "esMuestra": true }
```

Lectura del sensor (calcula deltaE frente a la muestra y genera alertas):

```json
{ "loteId": 1, "resultadoHex": "#E35337", "rgb": [227, 83, 55] }
```

| Campo          | Regla                                                                                   |
| -------------- | --------------------------------------------------------------------------------------- |
| `loteId`       | Entero positivo de un lote existente                                                    |
| `resultadoHex` | Color con formato `#RRGGBB`                                                             |
| `rgb`          | Solo en lecturas: `[r, g, b]` con enteros de 0 a 255, el mismo color que `resultadoHex` |
| `esMuestra`    | Opcional; `true` registra el tarro muestra                                              |

| Código | Caso                                                                                                                                                                                      |
| ------ | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 201    | Tarro registrado                                                                                                                                                                          |
| 400    | Cuerpo inválido, o `loteId`, `resultadoHex` o `rgb` con formato incorrecto, o `rgb` distinto de `resultadoHex`                                                                            |
| 404    | El lote no existe                                                                                                                                                                         |
| 409    | El lote ya tiene muestra (al registrar otra) o no está en modo `Muestra`; no tiene muestra (al registrar una lectura), está `Pausado` por una alerta roja o no está en modo `Recoleccion` |

## Autenticación

El login (`POST /api/auth/login`, `POST /api/auth/logout`) y la protección de páginas con `proxy.ts` están documentados en `docs/contratos/autenticacion.md`.
