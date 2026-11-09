# Autenticación

## Tabla `usuarios`

Probar primero en el SQL Editor de Neon:

```sql
CREATE TABLE usuarios (
  id SERIAL PRIMARY KEY,
  nombre_usuario VARCHAR(50) NOT NULL UNIQUE,
  contrasena_hash TEXT NOT NULL,
  fecha_creacion TIMESTAMP NOT NULL DEFAULT NOW()
);
```

La contraseña nunca se guarda en texto plano: se guarda el hash `sal:hash` generado con scrypt (`lib/modulos/auth/contrasenas.ts`).

## Variables de entorno (`.env.local`)

| Variable | Uso |
|---|---|
| `AUTH_SECRET` | Clave para firmar la cookie de sesión. Mínimo 32 caracteres. |

## Rutas de la API

### `POST /api/auth/login`

Cuerpo: `{ "nombreUsuario": string, "contrasena": string }`

| Caso | Respuesta |
|---|---|
| Credenciales correctas | `200` `{ exito: true, datos: { id, nombreUsuario } }` y cookie `sesion` (HttpOnly) |
| Faltan campos | `400` `{ exito: false, error: "Ingresa usuario y contraseña" }` |
| El cuerpo no es un objeto JSON | `400` `{ exito: false, error: "El cuerpo de la petición debe ser un objeto JSON" }` |
| Credenciales incorrectas | `401` `{ exito: false, error: "Usuario o contraseña incorrectos" }` (no indica cuál campo falló) |

### `POST /api/auth/logout`

Elimina la cookie `sesion`. Responde `200` `{ exito: true, datos: null }`.

Los errores internos responden `500` con `"Error interno del servidor"`, igual que el resto de la API (ver `docs/api.md`).

## Protección de rutas

`proxy.ts` revisa la cookie `sesion` en cada página. Sin sesión válida redirige a `/login`. Las rutas `/api/**` no pasan por el proxy: el script de Python que envía las lecturas del sensor (historia 06) no inicia sesión. Los endpoints de escritura que usa solo la web verifican la sesión por su cuenta con `verificarTokenSesion` y responden `401` sin ella; hoy es el caso de `POST /api/lotes`.

## Crear un usuario

No hay registro público. Los usuarios los crea el equipo desde la terminal:

```bash
node --env-file=.env.local --experimental-strip-types scripts/crear-usuario.ts <nombre_usuario> <contrasena>
```
