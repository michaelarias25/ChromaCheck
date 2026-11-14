# F6 · Historial de tarros

## Historia

Como operario, quiero consultar todos los tarros revisados con su lote, color, ΔE y dictamen, para comparar el dictamen del sistema con el juicio visual y tener la trazabilidad de cada lote.

Es una consulta secundaria: se abre desde el enlace "Historial" del encabezado y no forma parte del flujo principal (abrir lote → tomar muestra patrón → revisar tarros).

## Relación

Pantalla `/historial`. Historia HU-H7; caso CP-10.

## Comportamiento

1. La tabla muestra los tarros del más reciente al más antiguo: tarro, lote, color medido, ΔE y resultado.
2. Muestra 6 tarros por página, con botones para pasar de página.

## Criterios de aceptación

Ya en `development`:

- [x] El primer tarro de la lista es el de fecha y hora más reciente.
- [x] 6 tarros por página (`?pagina=N`).
- [x] ΔE con 2 decimales ("—" si no está calculado) y resultado con símbolo y palabra.

Pendientes (identidad visual):

- [ ] Encabezados de tabla en 16 px negrita, sin mayúsculas sostenidas; filas en 18 px.
- [ ] Botones "Página anterior" y "Página siguiente" de 56 px con texto, y "Página 2 de 5" visible.
- [ ] El cuadro del color medido mide al menos 32 px y tiene borde.

## Fuera de alcance

Exportar a Excel o PDF, filtros por fecha o por lote.
