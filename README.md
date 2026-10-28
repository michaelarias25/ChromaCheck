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

2. Copiar `.env.example` como `.env.local` y escribir la cadena de conexión de Neon en `DATABASE_URL`. El archivo `.env.local` no se sube al repositorio.

3. Iniciar el servidor de desarrollo:

   ```bash
   npm run dev
   ```

## Comandos

| Comando | Uso |
| --- | --- |
| `npm run dev` | Servidor de desarrollo en <http://localhost:3000> |
| `npm run build` | Compilación de producción |
| `npm run start` | Servidor de producción (después de `build`) |
| `npm run lint` | Revisión con ESLint |

## Rutas

| Ruta | Pantalla |
| --- | --- |
| `/` | Lotes en producción, con su color muestra y desviación promedio |
| `/lotes/[id]` | Monitoreo de un lote: muestra patrón, último tarro y últimas 8 lecturas |
| `/historial` | Historial de calidad de todos los tarros, 6 por página (`?pagina=N`) |

La API se documenta en [docs/api.md](docs/api.md).

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

| Tabla | Columnas |
| --- | --- |
| `lotes` | `id`, `codigo`, `estado` (por defecto `Activo`; `Pausado` tras una alerta roja), `fecha_inicio` |
| `tarros` | `id_tarro`, `lote_id` → `lotes.id`, `resultado_hex`, `desviacion_delta_e`, `resultado` (`Muestra`, `Aprobado`, `No Aprobado`), `es_muestra`, `timestamp` |
| `alertas` | `id`, `tarro_id` → `tarros.id_tarro`, `nivel` (`Amarilla`, `Roja`), `mensaje`, `congela_registro`, `timestamp` |
| `usuarios` | `id`, `nombre_usuario` (único), `contrasena_hash`, `fecha_creacion` |

## Integrantes

- Lauren Camila Castro Vera
- Michael David Arias Torres

## Materias involucradas

- Desarrollo Orientado a Servicios
- Gerencia de Software
