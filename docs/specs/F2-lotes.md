# F2 · Ver y agregar lotes

## Historia

Como operario, quiero encontrar el lote del color que voy a revisar y abrirlo con un clic, y agregar uno nuevo cuando llega otra mezcla, para empezar la revisión sin buscar.

## Relación

Pantalla `/`. API: `GET /api/lotes`, `POST /api/lotes` ([contratos/api.md](../contratos/api.md)). Historias HU-H3 y HU-H6; casos CP-06, CP-07, CP-08 y CP-09.

## Comportamiento

1. La pantalla muestra los lotes del más reciente al más antiguo, uno por tarjeta.
2. Cada tarjeta muestra el código, el estado (Activo o Pausado), el color de la muestra patrón, la desviación promedio y si el lote está usando el sensor.
3. "Agregar lote" abre un formulario con el código; al crearlo, la tarjeta nueva aparece en la lista.
4. "Abrir lote" en la tarjeta lleva a la pantalla del lote (F3, F4, F5).

## Criterios de aceptación

Ya en `development`:

- [x] Los lotes se ordenan por fecha de inicio, del más reciente al más antiguo.
- [x] El código es obligatorio, de 1 a 50 caracteres (sin contar los espacios de los extremos) y único sin distinguir mayúsculas; si se repite, el mensaje lo dice.
- [x] Un lote sin lecturas muestra la desviación como "—", no un error.
- [x] La tarjeta indica en texto "Esperando muestra" o "Recolectando lecturas" cuando el lote usa el sensor.
- [x] Crear un lote exige sesión iniciada.

Pendientes (identidad visual):

- [x] "Agregar lote" es el botón principal de la pantalla (72 px), debajo del título.
- [x] Los textos de la tarjeta usan 16 px como mínimo y sin mayúsculas sostenidas; los textos de captura usan las palabras nuevas ("Esperando muestra patrón", "Revisando tarros").
- [x] El estado Pausado se distingue con "⚠ Pausado" en rojo, no solo con el color.
- [x] El cuadro de color tiene borde y su código hex va debajo, no encima del color.
- [x] El enlace de la tarjeta dice "Abrir lote", en texto normal (sin mayúsculas sostenidas).
- [x] Sin lotes, la pantalla dice "Todavía no hay lotes" y muestra el botón "Agregar lote".
- [x] En la tarjeta, el código, el cuadro de color y "Abrir lote" son lo más visible; la desviación promedio y el estado del sensor van en texto secundario de 16 px.

## Fuera de alcance

Renombrar o borrar lotes, filtrar o buscar lotes.
