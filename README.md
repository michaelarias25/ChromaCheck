# ChromaCheck

Plataforma web de control de calidad para una fábrica de pintura. Un prototipo IoT (Arduino con sensor TCS3200) lee el color de cada tarro, el sistema calcula su desviación de color (ΔE) frente al tarro muestra del lote y genera alertas cuando la desviación supera la tolerancia.

## Tecnologías

- Next.js 16 (App Router), React 19 y TypeScript: pantallas y API en un solo proyecto.
- Tailwind CSS 4.
- PostgreSQL 17 alojado en Neon, con el paquete `pg`.

## Para iniciar el proyecto

1. Instalar las dependencias:

   ```bash
   npm install
   ```

2. Copiar `.env.example` como `.env.local` y completar:
   - `DATABASE_URL`: la cadena de conexión de Neon.
   - `AUTH_SECRET`: la clave para firmar la cookie de sesión, de mínimo 32 caracteres. Para generar una:

     ```bash
     node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
     ```

   El archivo `.env.local` no se sube al repositorio.

3. Iniciar el servidor de desarrollo:

   ```bash
   npm run dev
   ```

## Comandos

| Comando                   | Uso                                                                     |
| ------------------------- | ----------------------------------------------------------------------- |
| `npm run dev`             | Servidor de desarrollo en <http://localhost:3000>                       |
| `npm run build`           | Compilación de producción                                               |
| `npm run start`           | Servidor de producción (después de `build`)                             |
| `npm run lint`            | Revisión con ESLint                                                     |
| `npm run formato`         | Aplica el formato de Prettier                                           |
| `npm run formato:revisar` | Revisa el formato sin cambiar archivos (lo exige la Definition of Done) |

### Crear un usuario

No hay registro público: los usuarios se crean desde la terminal con `scripts/crear-usuario.ts` (detalles en [docs/autenticacion.md](docs/autenticacion.md)):

```bash
node --env-file=.env.local --experimental-strip-types scripts/crear-usuario.ts <nombre_usuario> <contrasena>
```

Requiere **Node 22.6 o superior**: es la primera versión con `--experimental-strip-types`, que permite ejecutar el archivo TypeScript sin compilarlo.

## Rutas

| Ruta          | Pantalla                                                                                                                                                                                                                                                   |
| ------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `/`           | Lotes en producción, con su color muestra y desviación promedio. El botón **Agregar lote** crea un lote nuevo con su código. La tarjeta indica en texto si el lote está **Esperando muestra** o **Recolectando lecturas**                                  |
| `/lotes/[id]` | Monitoreo de un lote: muestra patrón, último tarro, últimas 8 lecturas y alertas del lote (de la más reciente a la más antigua). Si el lote está pausado, muestra un aviso con el motivo. La sección **Captura del sensor** controla el sensor (ver abajo) |
| `/historial`  | Historial de calidad de todos los tarros, 6 por página (`?pagina=N`)                                                                                                                                                                                       |

En ambas pantallas el ΔE se muestra con 2 decimales (`—` si no está calculado) y el resultado de cada tarro con texto y símbolo: **Aprobado**, **No aprobado** o **Sin calcular**.

### Captura del sensor

En `/lotes/[id]`, un lote `Activo` decide qué hace el único sensor:

| Situación            | Qué se ve                                                                                                                                                                                |
| -------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Sin muestra          | Botón **Registrar muestra**. Mientras espera muestra "Coloca el tarro muestra frente al sensor" y el botón **Cancelar**. Cuando llega la muestra, aparece su color en **Muestra Patrón** |
| Con muestra          | Botón **Iniciar recolección**, que cambia a **Detener recolección**, con el estado en texto: **Recolectando lecturas** o **Detenido**                                                    |
| Otro lote capturando | El código de ese lote con enlace a su página; no se puede iniciar                                                                                                                        |
| Lote `Pausado`       | Sin botones de captura; solo el aviso con el motivo                                                                                                                                      |

Mientras el lote espera la muestra o recolecta, la página se refresca cada 3 segundos para mostrar la muestra, las lecturas y las alertas nuevas. Si la API rechaza un cambio, el mensaje aparece en texto.

Los lotes se crean desde la pantalla principal; no se renombran. La API se documenta en [docs/api.md](docs/api.md). `POST /api/lotes` exige sesión iniciada; las demás rutas de la API quedan abiertas para el puente serial.

## Estructura

```text
app/                  Pantallas (page.tsx) y endpoints de la API (api/**/route.ts)
lib/db.ts             Pool de conexiones a PostgreSQL
lib/modulos/lotes     Consultas y reglas de los lotes
lib/modulos/tarros    Registro de tarros, cálculo de deltaE y patrón acumulativo
lib/modulos/alertas   Registro y consulta de alertas
public/               Logo e imágenes
```

## Base de datos

| Tabla      | Columnas                                                                                                                                                                                                                                                                                 |
| ---------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `lotes`    | `id`, `codigo` (único, sin distinguir mayúsculas ni espacios en los extremos; máximo 50 caracteres), `estado` (por defecto `Activo`; `Pausado` tras una alerta roja), `modo_captura` (`Inactivo` por defecto, `Muestra` o `Recoleccion`; ver [docs/api.md](docs/api.md)), `fecha_inicio` |
| `tarros`   | `id_tarro`, `lote_id` → `lotes.id`, `resultado_hex`, `desviacion_delta_e`, `resultado` (`Muestra`, `Aprobado`, `No Aprobado`), `es_muestra`, `timestamp`                                                                                                                                 |
| `alertas`  | `id`, `tarro_id` → `tarros.id_tarro`, `nivel` (`Amarilla`, `Roja`), `mensaje`, `congela_registro`, `timestamp`                                                                                                                                                                           |
| `usuarios` | `id`, `nombre_usuario` (único), `contrasena_hash`, `fecha_creacion`                                                                                                                                                                                                                      |

El código único de `lotes` se garantiza con este índice (probado primero en el SQL Editor de Neon):

```sql
CREATE UNIQUE INDEX lotes_codigo_unico ON lotes (LOWER(TRIM(codigo)));
```

El modo de captura (qué lote recibe las lecturas del único sensor) se agregó así, también probado primero en el SQL Editor de Neon:

```sql
ALTER TABLE lotes
  ADD COLUMN modo_captura VARCHAR(20) NOT NULL DEFAULT 'Inactivo'
  CONSTRAINT lotes_modo_captura_valido
    CHECK (modo_captura IN ('Inactivo', 'Muestra', 'Recoleccion'));

-- Solo un lote a la vez puede tener un modo distinto de 'Inactivo'
CREATE UNIQUE INDEX lotes_un_lote_capturando
  ON lotes ((true))
  WHERE modo_captura <> 'Inactivo';
```

## Integrantes

- Lauren Camila Castro Vera
- Michael David Arias Torres

## Materias involucradas

- Desarrollo Orientado a Servicios
- Gerencia de Software
