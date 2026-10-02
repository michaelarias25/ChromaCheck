# Estándares del equipo: ChromaCheck

Universidad Santo Tomás, Facultad de Ingeniería de Sistemas, Gerencia de Software, Grupo N°3
Docente: Stefany Gómez Riveros. Año 2026.

Proyecto: ChromaCheck, plataforma web de control de calidad e inventario para fábrica de pintura, con un prototipo IoT que mide la desviación de color (ΔE).
Repositorio: https://github.com/michaelarias25/ChromaCheck.
Tablero Kanban: Trello.
Vigencia: desde su publicación y durante el resto del semestre.

## Tecnologías del equipo

| Capa | Lenguaje y framework | Formateador y linter |
|---|---|---|
| Frontend y backend | Next.js (React), en un solo proyecto, carpeta `ChromaCheck` (antes `myBack`/`myapp`) | Prettier y ESLint |
| Base de datos | PostgreSQL 17 alojado en Neon, sin Neon Auth | No aplica |
| Microcontrolador | C++ sobre Arduino, con sensor de color | clang-format (estilo Google) |

El frontend y el backend conviven en el mismo proyecto Next.js: las pantallas están en la parte de React y los endpoints de la API en las rutas de servidor del mismo proyecto. No hay un servicio aparte.

Los archivos de configuración (`.prettierrc`, `eslint.config.mjs` o `.eslintrc.json`, `.clang-format`) viven en el repositorio. Cualquiera puede ejecutar los comandos de la sección 4 y obtener el mismo resultado.

---

## 1. Guía de estilo y nombres

### 1.1 Guías oficiales adoptadas

- Next.js, React, HTML, CSS y JavaScript: reglas de ESLint con la configuración oficial de Next.js (`next/core-web-vitals`) y formato automático con Prettier. Clases CSS en `kebab-case`.
- C++ y Arduino: [Google C++ Style Guide](https://google.github.io/styleguide/cppguide.html), aplicada con clang-format.

### 1.2 Idioma del código

Todo en español: nombres de variables, funciones, componentes, comentarios, mensajes de commit y documentación.
Se admiten sin traducir los términos propios de las tecnologías (`route`, `request`, `commit`, `pull request`, `Next.js`, `setup`, `loop`, nombres de librerías y palabras reservadas del lenguaje). La sigla ΔE se escribe `deltaE` en los identificadores.

### 1.3 Formateador configurado

Prettier, ESLint y clang-format, con sus archivos de configuración versionados en el repositorio. Un archivo que no pase la verificación (sección 4) no se fusiona.

### 1.4 Tres reglas propias de nombres

1. Booleano = pregunta sí/no. El nombre se lee como una pregunta que se responde con sí o no. Ejemplos: `esMuestra`, `tieneError`.
2. Función = empieza con verbo en infinitivo. Ejemplos: `leerSensor`, `guardarLote`.
3. Unidad dentro del nombre. Toda magnitud lleva su unidad en el nombre. Ejemplo: `desviacionPorcentaje`.

Además: `camelCase` para variables y funciones, `PascalCase` para componentes de React y clases, y `MAYUSCULAS_CON_GUION_BAJO` para constantes.

---

## 2. Convención de commits y ramas

### 2.1 Formato del mensaje

Basado en [Conventional Commits](https://www.conventionalcommits.org/es/v1.0.0/):

```
<tipo>: <descripción en infinitivo, minúscula, sin punto final>
```

### 2.2 Tipos permitidos

| Tipo | Uso |
|---|---|
| `feat` | Funcionalidad nueva |
| `fix` | Corrección de un defecto |
| `docs` | Solo documentación |
| `style` | Formato, sin cambio de lógica |
| `refactor` | Reestructuración sin cambio de comportamiento |
| `test` | Agregar o corregir pruebas |

Cualquier otro tipo es inválido.

### 2.3 Esquema de ramas

- `main`: siempre estable y entregable. Nadie hace commit directo; solo se actualiza mediante Pull Request aprobado.
- Ramas de trabajo, creadas desde `main`: `<tipo>/<resumen>` con los mismos tipos de 2.2, en minúscula y con guiones. Ejemplos: `feat/calculo-delta-e`, `fix/reconexion-sensor`, `docs/estandares`.
- La rama se elimina después de fusionarse.

---

## 3. Definition of Ready (DoR)

Una tarjeta del tablero Kanban puede pasar a "En progreso" solo si cumple todas estas condiciones:

1. Tiene un título en infinitivo y una descripción de qué se debe lograr, escrita en la tarjeta de Trello.
2. Tiene criterios de aceptación escritos como lista de verificación dentro de la tarjeta (mínimo dos).
3. Indica a qué parte pertenece mediante una etiqueta: `frontend`, `backend`, `firmware` o `bd`.
4. Tiene un responsable asignado (Lauren Castro o Michael Arias).
5. No depende de una tarjeta sin terminar; si depende de otra, la tarjeta bloqueante está enlazada en la descripción.
6. No contradice las exclusiones del Acta de Constitución (sin contabilidad, sin app móvil nativa, sin integración ERP, sin pasarelas de pago). Si lo hiciera, se rechaza.

---

## 4. Definition of Done (DoD)

Una tarjeta pasa a "Hecho" solo si se cumplen todas las condiciones. Cada una se comprueba abriendo el repositorio, el Pull Request o el tablero, sin preguntarle nada al autor.

| # | Condición | Cómo la verifica un tercero |
|---|---|---|
| 1 | El cambio está fusionado en `main` mediante un Pull Request. | En GitHub, el PR aparece como *Merged* y el historial de `main` contiene el cambio. |
| 2 | El PR tiene al menos una aprobación del otro integrante. | La pestaña *Conversation* del PR muestra el estado *Approved*. |
| 3 | El formato pasa sin errores: `npx prettier --check .`, `npm run lint` y, si el PR toca firmware, `clang-format --dry-run --Werror` sobre los archivos `.ino`, `.cpp` y `.h`. | Se ejecutan los comandos en un clon limpio y todos terminan con código de salida 0. |
| 4 | El proyecto compila: `npm run build` termina sin errores. | Se ejecuta el comando en un clon limpio, con las variables de `.env.example` completadas, y termina con código 0. |
| 5 | Todos los mensajes de commit y el título del PR cumplen la convención de la sección 2. | Se leen en `git log` o en la pestaña *Commits* del PR. |
| 6 | Si el cambio altera una ruta de la API, el esquema de la base de datos, una conexión del circuito o una variable de entorno, el `README.md` o la carpeta `docs/` se actualizó en el mismo PR. | El PR incluye el diff de `README.md` o `docs/`. |
| 7 | No hay secretos (contraseñas, cadena de conexión a Neon, credenciales WiFi, tokens) en el código ni en el historial. Los valores sensibles se leen de variables de entorno guardadas en `.env.local`, ignorado por `.gitignore`. | Se busca en el diff del PR; el repositorio contiene `.env.example` sin valores reales y `.gitignore` incluye `.env.local`. |
| 8 | La tarjeta de Trello tiene enlazado el PR, todos los ítems de sus criterios de aceptación marcados y está en la columna "Hecho". | Se abre la tarjeta y se ve el enlace, la lista completa marcada y la columna. |

---

## 5. Política de revisión

### 5.1 Quién revisa

Al ser un equipo de dos personas, la revisión es cruzada: el autor del PR nunca aprueba el suyo; lo revisa el otro integrante. El autor asigna al revisor en GitHub al abrir el PR.

### 5.2 Plazo

El revisor responde (aprueba, solicita cambios o comenta) en un máximo de 72 horas desde que se le asigna el PR.
Si el plazo vence sin respuesta, el autor escribe al revisor por el canal del equipo. Pasadas 24 horas más, puede fusionar si la ausencia es justificada y lo deja anotado en el PR. Esta excepción no aplica si se incumple alguna causal de bloqueo.

### 5.3 Qué bloquea la aprobación

El revisor debe solicitar cambios, y el PR no se fusiona, si ocurre cualquiera de estas:

1. Falla `prettier`, `eslint` o `clang-format` (DoD 3).
2. Falla `npm run build` (DoD 4).
3. Hay un secreto, credencial o cadena de conexión en el diff (DoD 7).
4. Implementa algo listado en las exclusiones del Acta de Constitución.
5. Los commits o el título del PR no cumplen la convención de la sección 2.
6. El PR no corresponde a ninguna tarjeta de Trello que cumpla el DoR.
7. El cambio introduce una vulnerabilidad evidente, como una consulta SQL armada concatenando texto que escribió el usuario, o un endpoint de escritura sin autenticación.

### 5.4 Qué no bloquea

Se comenta, pero no impide la aprobación:

- Preferencias de estilo que el formateador ya acepta.
- Sugerencias de nombres alternativos cuando el nombre actual cumple las reglas de la sección 1.4.
- Ideas de refactor o mejoras futuras, que se registran como nueva tarjeta en Trello.
- Errores ortográficos en comentarios o documentación, salvo que cambien el sentido.
- Optimizaciones de rendimiento sin un problema medido.

### 5.5 Cómo se comenta

- Los comentarios se escriben en el PR, sobre la línea concreta del código.
- Cada comentario inicia con una etiqueta: `[bloqueante]` (corresponde a una causal de 5.3 y cita su número) o `[sugerencia]` (no bloquea, ver 5.4).
- Se describe el problema y se propone una alternativa. No se critica a la persona.
- El autor responde a cada `[bloqueante]` con el commit que lo corrige, y el revisor marca el hilo como resuelto.
- El revisor aprueba únicamente cuando no quedan hilos `[bloqueante]` sin resolver.

---

## 6. Aceptación

| Nombre completo | Declaración |
|---|---|
| Lauren Camila Castro Vera | Conozco y acepto estos estándares. |
| Michael David Arias Torres | Conozco y acepto estos estándares. |
