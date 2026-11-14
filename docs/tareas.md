# Tareas

Pasos para construir lo que piden las specs, en el orden en que se hacen. Cada tarea cabe en un commit o en un PR pequeño y dice qué spec cumple. Al terminar una tarea se marca aquí y se marcan las casillas de su spec en el mismo PR.

Las tareas ya terminadas antes de crear esta carpeta no se listan: su estado está en las casillas `[x]` de cada spec.

## 1. Documentación (rama `feature/carpeta-docs`)

- [x] 1.1 Crear la estructura de `docs/` y mover `api.md` y `autenticacion.md` a `docs/contratos/`
- [x] 1.2 Actualizar los enlaces a `docs/api.md` y `docs/autenticacion.md` (`README.md`, `docs/contratos/` y referencias de `puente-serial/`); lo de `puente-serial/` lo cierra Michael en la tarea 3.9
- [x] 1.3 Agregar la skill `.claude/skills/ui-componentes/SKILL.md`
- [ ] 1.4 Confirmar con el equipo las decisiones marcadas como **Propuesta** en `decisiones.md`

## 2. Identidad visual para mayores de 55 (todas las specs)

Migración visual (rama `feature/migracion-visual`), en este orden: 2.1 → 6.3 → 2.2 → 2.3 → 2.8 → 2.4 → 6.4 → 2.5 → 2.6 → 2.7 → 2.9 → 2.10. Los tokens nuevos conviven con los antiguos hasta la 2.10.

- [x] 2.1 Tokens de la paleta (tema claro y oscuro) y fuente Atkinson Hyperlegible Next en `app/globals.css` y `app/layout.tsx`; encabezado según el tema, con el logo de letras negras o blancas (F7)
- [x] 2.2 Componente `Boton` (`app/componentes/Boton.tsx`) con variantes principal, secundario y peligro, alto de 56 o 72 px y estado "enviando"
- [x] 2.3 Componente `CuadroColor` (`app/componentes/CuadroColor.tsx`): color de la pintura con borde y código hex debajo
- [x] 2.4 Encabezado y navegación según [Navegación](diseno/identidad-visual.md#navegación): "Lotes" como inicio, "Historial" como enlace secundario, "Cerrar sesión" a la derecha, todos de 56 px de alto y sin mayúsculas sostenidas; en `/login` solo el logo y "Fondo:"; "← Volver a lotes" en la pantalla del lote
- [x] 2.5 F1 · Pantalla de login con campos de 56 px, "Mostrar contraseña" y error visible
- [x] 2.6 F2 · Pantalla de lotes: botón principal "Agregar lote", tarjetas con 16 px mínimo donde destacan el código, el color y "Abrir lote", "⚠ Pausado", estado vacío
- [ ] 2.7 F6 · Historial: tabla en 18 px y paginación con botones de 56 px
- [x] 2.8 `InsigniaResultado` con la paleta nueva (verde, rojo) y tamaño de 18 px
- [ ] 2.9 Pantalla del lote (`app/lotes/[id]/page.tsx` y `ControlCaptura`) con la paleta nueva, sin la pantalla completa de la sección 3: botón principal "Tomar muestra patrón" o "Revisar tarros" con "■ El sensor está detenido"; mientras espera la muestra, "● Esperando el tarro…" con "Cancelar"; mientras revisa, "● Revisando tarros…" con "Terminar revisión"; `CuadroColor` en la comparación, tabla y alertas en 18 px; textos nuevos en `README.md`
- [ ] 2.10 Borrar los tokens antiguos (`surface-*`, `primary-*`, `secondary-*`, `tertiary-*`, `outline`) y las fuentes Inter y Montserrat

## 3. Pantalla completa de captura (F3, F4, F5)

- [ ] 3.1 Componente `PantallaCaptura` (`app/componentes/PantallaCaptura.tsx`): diálogo a pantalla completa, opaco, con `role="dialog"`, Esc y foco de vuelta al botón que la abrió
- [ ] 3.2 F3 · Estado "Esperando la muestra" con "Cancelar"; se abre al pulsar "Tomar muestra patrón" o al recargar con el lote en modo `Muestra`
- [ ] 3.3 F3 · Estado "Muestra patrón guardada" con el color y "Continuar"
- [ ] 3.4 F4 · Estado "Revisando tarros": muestra patrón y último tarro, dictamen de 60 px, ΔE y contador
- [ ] 3.5 F5 · `POST /api/lotes/[id]/reanudar`: regla en `lib/modulos/lotes/reglas.ts`, servicio, repositorio (lote a `Activo` y `Recoleccion` en la misma sentencia) y pruebas; actualizar `contratos/api.md`
- [ ] 3.6 F5 · Estados de alerta amarilla (dorado) y lote pausado (rojo): 5 segundos sin botones y después "Reanudar revisión" y "Entendido"
- [ ] 3.7 F5 · "Reanudar revisión" como acción principal en la pantalla de un lote pausado
- [ ] 3.8 Reemplazar `ControlCaptura` por el botón principal + `PantallaCaptura` en `app/lotes/[id]/page.tsx`; ocultar el encabezado mientras está abierta
- [ ] 3.9 Actualizar los textos de los botones en `README.md` y pedir a Michael que los actualice en `puente-serial/README.md`
- [ ] 3.10 Prueba rápida con dos personas del taller: que tomen la muestra y revisen 3 tarros sin ayuda (ensayo de ACQ-01); anotar lo que no entendieron

## 4. Validación del objetivo del MVP

- [ ] 4.1 Prueba de coincidencia: revisar 20 tarros con el sistema, anotar para cada uno el dictamen del sistema y el juicio visual de una persona experimentada, y calcular el porcentaje de coincidencia (meta ≥ 90 %, ver [producto.md](producto.md)); comparar con el historial (F6)

## 5. Deuda técnica encontrada

- [ ] 5.1 `lib/modulos/auth/servicio.ts` hace SQL: mover las consultas a `lib/modulos/auth/repositorio.ts`
- [ ] 5.2 Proteger `POST /api/tarros` y `GET /api/captura/activa` con una clave compartida del puente (encabezado + variable de entorno), coordinado con Michael

## 6. Fondo claro u oscuro (F7)

- [x] 6.1 `app/layout.tsx` usa `/logo.png`: usar `logo-negro.png` con fondo claro y `logo-blanco.png` con fondo oscuro
- [x] 6.2 Excluir `logo-blanco.png` y `logo-negro.png` en el `matcher` de `proxy.ts` para que el logo se vea en `/login` sin sesión
- [x] 6.3 Recortar `public/logo-negro.png` a la misma proporción que `logo-blanco.png` (1920 × 540) con `sharp` (ya viene con Next, sin dependencias nuevas) y dejarlo en 142 × 40 en `app/layout.tsx`
- [x] 6.4 Selector "Fondo:" con los botones "Claro" y "Oscuro" en el encabezado (`app/componentes/SelectorTema.tsx`): "✓" y `aria-pressed` en el elegido, cookie `tema` por 1 año y cambio de `data-tema` sin recargar
