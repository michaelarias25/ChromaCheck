# F3 · Tomar la muestra patrón

## Historia

Como operario, quiero registrar el tarro patrón del lote con un solo botón y ver claramente que el sensor lo está esperando, para que el sistema tenga contra qué comparar los demás tarros.

## Relación

Pantalla `/lotes/[id]`. API: `PATCH /api/lotes/[id]/captura` con `{ "modo": "Muestra" }` y `POST /api/tarros` con `esMuestra: true` (lo envía el puente). Diseño: [pantalla completa de captura](../diseno/identidad-visual.md#pantalla-completa-de-captura). Atributo ACQ-01.

## Comportamiento

1. En la pantalla de un lote Activo, sin muestra y con el sensor libre, la acción principal es el botón "Tomar muestra patrón".
2. Al pulsarlo, el lote pasa a modo `Muestra` y se abre la pantalla completa: "Coloque el tarro patrón frente al sensor", "● Esperando el tarro…" y el botón "Cancelar".
3. Cuando el puente envía la lectura, la pantalla completa cambia a "✓ Muestra patrón guardada", con el cuadro grande del color leído, su código hex y el botón "Continuar".
4. "Continuar" cierra la pantalla completa. En la pantalla del lote, el color aparece en "Muestra patrón" y la acción principal pasa a ser "Revisar tarros" (F4), en el mismo lugar.
5. "Cancelar", "✕ Cerrar" o la tecla Esc devuelven el lote a `Inactivo`, cierran la pantalla completa y el foco vuelve al botón "Tomar muestra patrón".

## Criterios de aceptación

Ya en `development`:

- [x] Solo se puede pasar a modo `Muestra` si el lote está Activo, no tiene muestra y ningún otro lote usa el sensor; si no, la API responde 409 con el motivo.
- [x] Al registrarse la muestra, el lote vuelve solo a `Inactivo`.
- [x] Si otro lote usa el sensor, la pantalla dice cuál, con enlace a ese lote, y no permite empezar.
- [x] Mientras espera, la pantalla se refresca cada 3 segundos.

Pendientes (pantalla completa):

- [ ] La pantalla completa cubre todo el viewport con fondo opaco; mientras está abierta no se puede usar lo que hay detrás.
- [ ] Título de 48 px, una sola instrucción y botones de 72 px de alto.
- [ ] Se cierra con un botón con texto o con Esc; nunca se cierra sola mientras espera.
- [ ] Cerrarla devuelve el lote a `Inactivo`.
- [ ] Al cerrarla, el foco vuelve al botón que la abrió, con el mismo texto y en el mismo lugar.
- [ ] Al recargar la página con el lote en modo `Muestra`, la pantalla completa aparece abierta.
- [x] Mientras se envía el cambio de modo, el botón dice "Abriendo…" y no admite un segundo clic.
- [ ] Si la API rechaza el cambio, el motivo se muestra en texto de 18 px con "⚠" y lo que hay que hacer.
- [ ] Usa `role="dialog"`, `aria-modal="true"` y `aria-labelledby` apuntando al título; el estado "Esperando el tarro…" usa `role="status"`.

## Fuera de alcance

Cambiar la muestra de un lote que ya la tiene, calibrar el sensor desde la web.
