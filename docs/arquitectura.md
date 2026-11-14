# Arquitectura

## Visión general

Monolito modular: un solo proyecto Next.js tiene las pantallas y la API; la lógica se divide en módulos dentro de `lib/modulos/`.

```text
Arduino Nano + TCS3200 ──USB serial, 9600 baudios──▶ puente-serial (Python, PC del taller)
                                                              │ HTTP (JSON)
                                                              ▼
                                         Next.js 16: pantallas (app/) + API (app/api/)
                                                              │ pg
                                                              ▼
                                                  PostgreSQL 17 en Neon
```

| Pieza     | Carpeta                                       | Responsable | Contrato                                                 |
| --------- | --------------------------------------------- | ----------- | -------------------------------------------------------- |
| Firmware  | `firmware/chromacheck_sensor/`                | Lauren      | [contratos/serial.md](contratos/serial.md)               |
| Puente    | `puente-serial/`                              | Michael     | [contratos/api.md](contratos/api.md)                     |
| Web y API | `app/`, `lib/`                                | Lauren      | [contratos/api.md](contratos/api.md)                     |
| Login     | `app/login/`, `lib/modulos/auth/`, `proxy.ts` | Michael     | [contratos/autenticacion.md](contratos/autenticacion.md) |

## Capas del back

Cada módulo de `lib/modulos/<modulo>/` separa tres archivos, y la ruta de la API queda delgada:

| Archivo               | Hace                                                        | No hace                                  |
| --------------------- | ----------------------------------------------------------- | ---------------------------------------- |
| `app/api/**/route.ts` | Valida el formato de la petición y la sesión, responde HTTP | Reglas de negocio ni SQL                 |
| `servicio.ts`         | Orquesta: pide datos al repositorio y aplica las reglas     | SQL                                      |
| `reglas.ts`           | Funciones puras (ΔE, dictamen, alertas, modos de captura)   | Base de datos, red ni fechas del sistema |
| `repositorio.ts`      | Consultas SQL parametrizadas                                | Decisiones de negocio                    |

Módulos: `lotes`, `tarros`, `alertas` y `auth`. Compartido: `lib/db.ts` (pool de conexiones), `lib/respuestas.ts` (formato `{ exito, datos | error }`), `lib/validacion.ts` y `lib/formato.ts`.

Esta separación permite probar las reglas sin base de datos y los servicios con el repositorio simulado. Pendiente: `auth/servicio.ts` todavía contiene SQL (ver [tareas.md](tareas.md)).

## Front

- Next.js App Router, React 19, TypeScript y Tailwind CSS 4. Los colores y la fuente se definen como tokens en `app/globals.css` (`@theme`).
- Pantallas: `/login`, `/` (lotes), `/lotes/[id]` (monitoreo y captura) y `/historial`.
- Las páginas son componentes de servidor: leen los datos llamando directamente a los servicios.
- Los componentes interactivos (`'use client'`) están en `app/componentes/` y llaman a la API con `fetch`.
- Mientras un lote captura, la pantalla se refresca cada 3 segundos (`router.refresh()`) para mostrar lo que envía el puente.
- La identidad visual y las reglas de accesibilidad están en [diseno/identidad-visual.md](diseno/identidad-visual.md).

## Datos

Tablas: `lotes`, `tarros`, `alertas` y `usuarios` (columnas en el `README.md` de la raíz).

- `lotes` 1 — N `tarros` (uno de ellos es la muestra patrón, `es_muestra = true`)
- `tarros` 1 — 0..1 `alertas` (cada lectura genera como máximo una alerta)

Reglas que garantiza la base:

- `lotes_codigo_unico`: el código del lote es único sin distinguir mayúsculas ni espacios de los extremos.
- `lotes_un_lote_capturando`: solo un lote a la vez puede tener `modo_captura` distinto de `Inactivo`, porque hay un solo sensor.

## Seguridad

- `proxy.ts` exige la cookie `sesion` (firmada con `AUTH_SECRET`) en todas las páginas; las rutas `/api/**` no pasan por él.
- `POST /api/lotes` y `PATCH /api/lotes/[id]/captura` verifican la sesión por su cuenta.
- `POST /api/tarros` y `GET /api/captura/activa` quedan abiertas para el puente serial. Antes de desplegar se debe proteger con una clave compartida del puente (ver [tareas.md](tareas.md)).

## Pruebas

| Qué                | Herramienta                                            | Dónde                                 |
| ------------------ | ------------------------------------------------------ | ------------------------------------- |
| Reglas y servicios | Jest, cobertura ≥ 80 % (ACQ-03)                        | `lib/modulos/<modulo>/*.test.ts`      |
| Puente serial      | pytest                                                 | `puente-serial/test_puente_serial.py` |
| Firmware           | PlatformIO + Unity (entorno nativo, hardware simulado) | Aún no está en `development`          |

## Despliegue

Web y API en AWS; la base sigue en Neon. Ver [operacion/despliegue.md](operacion/despliegue.md).
