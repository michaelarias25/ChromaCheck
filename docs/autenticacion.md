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
| Credenciales incorrectas | `401` `{ exito: false, error: "Usuario o contraseña incorrectos" }` (no indica cuál campo falló) |

### `POST /api/auth/logout`

Elimina la cookie `sesion`. Responde `200` `{ exito: true }`.
