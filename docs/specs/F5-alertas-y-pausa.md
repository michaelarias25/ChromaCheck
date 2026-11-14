# F5 · Alertas y pausa del lote

## Historia

Como operario, quiero que el sistema avise cuando un tarro se desvía y que detenga el lote cuando la desviación va en aumento, para corregir la mezcla antes de producir más tarros malos.

## Relación

Reglas en `lib/modulos/tarros/reglas.ts`; registro en `lib/modulos/alertas/`. Historia HU-H5; casos CP-04 y CP-05 (tabla de decisión de las alertas). Atributo ACQ-04.

## Comportamiento

| Situación de la lectura                                          | Dictamen    | Alerta   | Lote               |
| ---------------------------------------------------------------- | ----------- | -------- | ------------------ |
| ΔE de 8,0 o menos                                                | Aprobado    | Ninguna  | Sigue Activo       |
| ΔE mayor que 8,0, sin patrón acumulativo                         | No aprobado | Amarilla | Sigue Activo       |
| Tres últimas lecturas estrictamente crecientes y la última > 8,0 | No aprobado | Roja     | Pausado e Inactivo |

1. Con alerta amarilla, la pantalla completa de F4 cambia la franja a dorado, muestra "⚠ Alerta amarilla: desviación aislada" y la revisión sigue.
2. Con alerta roja, la pantalla completa cambia a rojo: "⚠ Lote pausado", el motivo y la hora. El lote ya no acepta lecturas.
3. Durante 5 segundos la pantalla completa solo muestra el aviso, para que el operario lea el motivo. Después aparecen el botón principal "Reanudar revisión" y el secundario "Entendido".
4. "Reanudar revisión" devuelve el lote a Activo y a modo `Recoleccion` en una sola operación, y la pantalla completa vuelve a "Revisando tarros del lote …". Si la desviación sigue en aumento, la siguiente lectura vuelve a pausar el lote.
5. "Entendido" cierra la pantalla completa y deja el lote pausado; la pantalla del lote muestra el aviso de lote pausado arriba, la lista de alertas y, como acción principal, "Reanudar revisión" (sin la espera de 5 segundos).

## Criterios de aceptación

Ya en `development`:

- [x] El 100 % de las lecturas con ΔE mayor que 8,0 registran una alerta (amarilla o roja).
- [x] La alerta roja pausa el lote y pone su captura en `Inactivo` en la misma sentencia.
- [x] Un lote pausado rechaza lecturas (409) y no muestra botones de captura.
- [x] La pantalla del lote muestra el aviso de pausa con el motivo y la lista de alertas, de la más reciente a la más antigua.

Pendientes (identidad visual):

- [ ] Estados dorado y rojo de la pantalla completa, con "⚠" y palabra.
- [ ] La alerta roja no se cierra sola: espera "Reanudar revisión" o "Entendido".
- [x] Alertas de la lista con 18 px, nivel escrito ("Alerta roja", "Alerta amarilla") y hora.

Pendientes (reanudar el lote):

- [ ] Los botones "Reanudar revisión" y "Entendido" aparecen 5 segundos después de la alerta roja, no antes.
- [ ] `POST /api/lotes/[id]/reanudar` pasa el lote a Activo y a `Recoleccion` en la misma sentencia (ver [contratos/api.md](../contratos/api.md)).
- [ ] Si otro lote usa el sensor, "Reanudar revisión" no se permite y la pantalla dice cuál lote lo usa.
- [ ] En la pantalla de un lote pausado, "Reanudar revisión" es la acción principal y abre la pantalla completa de F4.

## Fuera de alcance

Avisos por correo o mensaje de texto.
