# Identidad visual · ChromaCheck

## Para quién diseñamos

Personas mayores de 55 años que trabajan de pie en el taller, junto al sensor, a veces con guantes o con las manos ocupadas, y que no usan aplicaciones a diario. De ahí salen todas las reglas de esta guía:

1. Letra grande y contraste alto.
2. Botones grandes, separados y con texto, nunca solo un icono.
3. Una sola acción principal por pantalla, siempre en el mismo lugar.
4. Nada se comunica solo con color: siempre símbolo y palabra.
5. Lo que hace el sensor se ve sin buscarlo (pantalla completa de captura).

Equipo supuesto: el computador del taller (pantalla de 1366 × 768 o más) a unos 60 cm; también debe funcionar en una tablet. Confirmar con el taller (ver [Preguntas abiertas](#preguntas-abiertas)).

## Tono

- Respetuoso y directo. Trata de **usted**.
- Frases cortas que dicen qué hacer: "Coloque el tarro patrón frente al sensor".
- Palabras del taller (tarro, lote, muestra patrón, color), no del sistema (modo, captura, `Recoleccion`, `modo_captura`).
- La acción conserva su nombre en todo el flujo: el botón "Tomar muestra patrón" termina en "Muestra patrón guardada".
- El ΔE se presenta como "Diferencia de color: 3,42 ΔE".
- Los errores dicen qué pasó y qué hacer, sin disculpas: "El sensor está ocupado con el lote #003. Termine esa revisión para usarlo aquí."

## Paleta

Este es el tema claro, el de por defecto y el recomendado: fondo claro y texto oscuro. El encabezado sigue el tema elegido (ver [Tema oscuro](#tema-oscuro)). Los acentos del logo (azul, dorado y rojo) se convierten en los colores de estado.

| Token                        | Hex       | Uso                                                | Contraste                        |
| ---------------------------- | --------- | -------------------------------------------------- | -------------------------------- |
| `fondo`                      | `#F4F5F7` | Fondo de las pantallas                             | —                                |
| `superficie`                 | `#FFFFFF` | Tarjetas, tablas, pantalla completa                | —                                |
| `encabezado`                 | `#FFFFFF` | Fondo del encabezado (logo de letras negras)       | —                                |
| `texto`                      | `#111418` | Texto principal                                    | 18,5:1 sobre `superficie`        |
| `texto-secundario`           | `#3D4450` | Etiquetas, fechas, ayudas                          | 9,8:1 sobre `superficie`         |
| `borde`                      | `#6B7280` | Bordes de tarjetas, inputs y cuadros de color      | 4,8:1 (mínimo 3:1)               |
| `accion`                     | `#1F4E79` | Botón principal, enlaces, foco, estado "Esperando" | 8,7:1 con `texto-sobre-accion`   |
| `texto-sobre-accion`         | `#FFFFFF` | Texto sobre `accion`                               | 8,7:1                            |
| `aprobado`                   | `#155C33` | Dictamen Aprobado, "Muestra guardada"              | 8,0:1 con `texto-sobre-aprobado` |
| `texto-sobre-aprobado`       | `#FFFFFF` | Texto sobre `aprobado`                             | 8,0:1                            |
| `aprobado-suave`             | `#E3F4E8` | Fondo de avisos de éxito                           | —                                |
| `texto-sobre-aprobado-suave` | `#14532D` | Texto sobre `aprobado-suave`                       | 8,0:1                            |
| `alerta`                     | `#B7860B` | Borde y franja de la alerta amarilla               | 3,3:1 (solo elemento gráfico)    |
| `alerta-suave`               | `#FFF4D6` | Fondo de la alerta amarilla                        | —                                |
| `texto-sobre-alerta-suave`   | `#5C4300` | Texto sobre `alerta-suave`                         | 8,5:1                            |
| `peligro`                    | `#9B1C13` | No aprobado, alerta roja, lote pausado, "Detener"  | 8,2:1 con `texto-sobre-peligro`  |
| `texto-sobre-peligro`        | `#FFFFFF` | Texto sobre `peligro`                              | 8,2:1                            |

Significado fijo de los colores:

| Color  | Significa                                    | Siempre va con         |
| ------ | -------------------------------------------- | ---------------------- |
| Azul   | Acción disponible o el sensor está esperando | Texto del botón o "●"  |
| Verde  | Aprobado o guardado                          | "✓" y la palabra       |
| Dorado | Alerta amarilla: desviación aislada          | "⚠" y la palabra       |
| Rojo   | No aprobado, alerta roja, lote pausado       | "✕" o "⚠" y la palabra |

El color de la pintura (`resultado_hex`) es el único color que no viene de la paleta. Como puede ser cualquiera, el cuadro de color lleva borde de 2 px `borde` y su texto va **debajo** del cuadro, nunca encima del color.

## Tema oscuro

El operario puede elegir fondo oscuro con el control "Fondo:" del encabezado ([F7](../specs/F7-fondo-claro-oscuro.md)). El tema claro es el de por defecto y sigue siendo el recomendado. Los tokens tienen los mismos nombres que en el tema claro; solo cambian sus valores, así los componentes no dependen del tema.

| Token                        | Hex       | Uso                                                | Contraste                         |
| ---------------------------- | --------- | -------------------------------------------------- | --------------------------------- |
| `fondo`                      | `#101418` | Fondo de las pantallas                             | —                                 |
| `superficie`                 | `#1C2025` | Tarjetas, tablas, pantalla completa                | —                                 |
| `encabezado`                 | `#101418` | Fondo del encabezado (logo de letras blancas)      | —                                 |
| `texto`                      | `#F4F5F7` | Texto principal                                    | 15,0:1 sobre `superficie`         |
| `texto-secundario`           | `#C9CED6` | Etiquetas, fechas, ayudas                          | 10,4:1 sobre `superficie`         |
| `borde`                      | `#8A929E` | Bordes de tarjetas, inputs y cuadros de color      | 5,2:1 (mínimo 3:1)                |
| `accion`                     | `#9CC3EE` | Botón principal, enlaces, foco, estado "Esperando" | 10,1:1 con `texto-sobre-accion`   |
| `texto-sobre-accion`         | `#101418` | Texto sobre `accion`                               | 10,1:1                            |
| `aprobado`                   | `#7EE2A8` | Dictamen Aprobado, "Muestra guardada"              | 11,7:1 con `texto-sobre-aprobado` |
| `texto-sobre-aprobado`       | `#101418` | Texto sobre `aprobado`                             | 11,7:1                            |
| `aprobado-suave`             | `#12301F` | Fondo de avisos de éxito                           | —                                 |
| `texto-sobre-aprobado-suave` | `#A7F3C1` | Texto sobre `aprobado-suave`                       | 11,1:1                            |
| `alerta`                     | `#E0B23A` | Borde y franja de la alerta amarilla               | 8,3:1 sobre `superficie`          |
| `alerta-suave`               | `#3A2E05` | Fondo de la alerta amarilla                        | —                                 |
| `texto-sobre-alerta-suave`   | `#FFE08A` | Texto sobre `alerta-suave`                         | 10,4:1                            |
| `peligro`                    | `#FF9C94` | No aprobado, alerta roja, lote pausado, "Detener"  | 9,2:1 con `texto-sobre-peligro`   |
| `texto-sobre-peligro`        | `#101418` | Texto sobre `peligro`                              | 9,2:1                             |

- El encabezado sigue el tema: en el claro es `encabezado` blanco con `logo-negro.png` (letras negras); en el oscuro, `#101418` con `logo-blanco.png` (letras blancas). En los dos lleva un borde inferior de 2 px `borde`. El logo cambia al pulsar "Claro" u "Oscuro", sin recargar y sin parpadeo.
- El color de la pintura (`resultado_hex`) no cambia con el tema; el borde de 2 px del cuadro lo separa del fondo aunque la pintura sea oscura.
- El significado de cada color (azul, verde, dorado, rojo) es el mismo en los dos temas, siempre con símbolo y palabra.
- Contrastes calculados con la fórmula de WCAG 2.2.

## Tipografía

**Atkinson Hyperlegible Next** (Google Fonts; en `next/font/google` se importa como `Atkinson_Hyperlegible_Next`). La diseñó el Braille Institute para personas con baja visión: distingue 1, l, I y 0, O. Una sola familia para todo; peso 400 para texto y 700 para títulos y botones. Los números de ΔE usan `tabular-nums` para que no bailen al cambiar.

| Uso                                   | Tamaño | Peso | Tailwind              |
| ------------------------------------- | ------ | ---- | --------------------- |
| Texto base                            | 18 px  | 400  | `text-lg`             |
| Mínimo absoluto (fechas, ayudas)      | 16 px  | 400  | `text-base`           |
| Encabezados de tabla y etiquetas      | 16 px  | 700  | `text-base font-bold` |
| Títulos de sección                    | 24 px  | 700  | `text-2xl`            |
| Título de pantalla                    | 30 px  | 700  | `text-3xl`            |
| Título de la pantalla completa        | 48 px  | 700  | `text-5xl`            |
| Dictamen y ΔE en la pantalla completa | 60 px  | 700  | `text-6xl`            |

- Nunca `text-xs` ni `text-sm`.
- Sin mayúsculas sostenidas (`uppercase`) ni espaciado entre letras (`tracking-*`): se escribe "Lotes en producción", no "LOTES EN PRODUCCIÓN". Las mayúsculas sostenidas se leen más lento.
- Interlineado de 1,5 en párrafos; líneas de máximo 70 caracteres.

## Botones y controles

| Tipo       | Aspecto                                            | Alto mínimo                                                             | Ejemplo                        |
| ---------- | -------------------------------------------------- | ----------------------------------------------------------------------- | ------------------------------ |
| Principal  | Relleno `accion`, texto `texto-sobre-accion` 700   | 56 px (`h-14`); 72 px (`h-18`) si es la acción principal de la pantalla | "Tomar muestra patrón"         |
| Secundario | Fondo `superficie`, borde 2 px `texto`             | 56 px                                                                   | "Cancelar", "Página siguiente" |
| Peligro    | Relleno `peligro`, texto `texto-sobre-peligro` 700 | 56 px                                                                   | "Terminar revisión"            |

- Texto del botón: verbo + objeto. Nada de "Aceptar" o "Enviar" sueltos.
- Solo un botón principal por pantalla.
- Separación mínima de 16 px (`gap-4`) entre botones.
- El icono va con palabra: "✕ Cerrar", no solo "✕".
- Estados del botón: normal, encima (se oscurece), foco (contorno de 4 px `accion` separado 3 px), enviando (cambia el texto: "Abriendo…") y deshabilitado (con una frase al lado que explica por qué).
- Campos de texto: alto 56 px, texto 18 px, etiqueta visible encima (el `placeholder` no reemplaza la etiqueta).

## Pantalla completa de captura

Es el elemento que define a ChromaCheck. Cuando el usuario pulsa "Tomar muestra patrón" o "Revisar tarros", toda la pantalla cambia para mostrar lo que hace el sensor.

```text
┌───────────────────────────────────────────────────────────────┐
│ Lote #005_Azul_Cielo                               ✕ Cerrar   │ ← franja del color del estado
├───────────────────────────────────────────────────────────────┤
│                                                               │
│   Coloque el tarro patrón frente al sensor          (48 px)   │
│                                                               │
│   ● Esperando el tarro…                                       │
│                                                               │
│              ┌───────────────────────────┐                    │
│              │         Cancelar          │  (72 px de alto)   │
│              └───────────────────────────┘                    │
└───────────────────────────────────────────────────────────────┘
```

```text
┌───────────────────────────────────────────────────────────────┐
│ Revisando tarros del lote #005_Azul_Cielo          ✕ Cerrar   │
├───────────────────────────────────────────────────────────────┤
│   Muestra patrón                 Último tarro                 │
│   ┌──────────────┐               ┌──────────────┐             │
│   │    color     │               │    color     │             │
│   └──────────────┘               └──────────────┘             │
│   #E35336                        #E35337                      │
│                                                               │
│   ✓ Aprobado                                        (60 px)   │
│   Diferencia de color: 3,42 ΔE                                │
│   Tarros revisados: 12. No aprobados: 1                       │
│                                                               │
│              ┌───────────────────────────┐                    │
│              │     Terminar revisión     │                    │
│              └───────────────────────────┘                    │
└───────────────────────────────────────────────────────────────┘
```

| Estado                     | Franja | Título                                   | Botón                                    |
| -------------------------- | ------ | ---------------------------------------- | ---------------------------------------- |
| Esperando la muestra       | Azul   | Coloque el tarro patrón frente al sensor | Cancelar                                 |
| Muestra guardada           | Verde  | ✓ Muestra patrón guardada                | Continuar                                |
| Revisando, último aprobado | Azul   | Revisando tarros del lote …              | Terminar revisión                        |
| Último con alerta amarilla | Dorado | ⚠ Alerta amarilla: desviación aislada    | Terminar revisión                        |
| Lote pausado (alerta roja) | Rojo   | ⚠ Lote pausado                           | Reanudar revisión y Entendido, a los 5 s |

Reglas:

- Cubre toda la pantalla con fondo opaco `superficie`; no es una ventanita que se pierde.
- Solo se abre cuando el usuario pulsa el botón, o al recargar la página si el lote ya estaba capturando: lo que se ve depende del modo guardado en la base.
- Se cierra solo con un botón con texto o con la tecla Esc. Nunca se cierra sola.
- Con el lote pausado, durante los primeros 5 segundos no hay botones y Esc no hace nada: el operario lee el motivo. Después aparecen "Reanudar revisión" (principal) y "Entendido" (secundario).
- Cerrar = detener la captura. Si la pantalla completa está cerrada, el sensor no está capturando para ese lote.
- Al cerrar, el foco vuelve al botón que la abrió, que sigue en el mismo lugar de la pantalla del lote.
- Mientras está abierta, el encabezado y la navegación no se ven.
- Aparece con un fundido de 150 ms; sin animación si el sistema pide movimiento reducido (`prefers-reduced-motion`).

## Navegación

El flujo principal es **Abrir lote → Tomar muestra patrón → Revisar tarros**. La navegación no compite con él.

```text
┌───────────────────────────────────────────────────────────────┐
│ [logo] ChromaCheck     Lotes    Historial      Cerrar sesión  │ ← encabezado (sigue el tema)
└───────────────────────────────────────────────────────────────┘
```

| Elemento        | Lugar                                | Aspecto                                                                                                                        |
| --------------- | ------------------------------------ | ------------------------------------------------------------------------------------------------------------------------------ |
| "Lotes"         | Encabezado, junto al logo            | Pantalla de inicio después de entrar; enlace de 56 px                                                                          |
| "Historial"     | Encabezado, después de Lotes         | Enlace secundario: 18 px, peso 400, sin relleno; alto de 56 px                                                                 |
| "Fondo:"        | Encabezado, antes de "Cerrar sesión" | Etiqueta y dos botones con texto, "Claro" y "Oscuro", de 56 px; el elegido lleva "✓" ([F7](../specs/F7-fondo-claro-oscuro.md)) |
| "Cerrar sesión" | Encabezado, a la derecha             | Enlace secundario de 56 px, separado de los demás                                                                              |

- El enlace de la pantalla actual se marca con subrayado de 4 px y la palabra en 700, no solo con color.
- La pantalla del lote tiene "← Volver a lotes" encima del título; no hay más niveles.
- Dentro de la pantalla completa de captura no hay navegación (ver arriba).

## Distribución de las pantallas

- Ancho máximo del contenido: 1200 px, centrado en la pantalla (`mx-auto`); el texto dentro va alineado a la izquierda.
- Debajo del título de la pantalla va la acción principal, siempre en el mismo lugar.
- 24 px entre bloques; tarjetas y botones con esquinas de 8 px; bordes de 1 a 2 px en lugar de sombras.
- Diseñar primero para 1366 × 768, verificar en 768 px (tablet) y que nada se corte en 390 px.

## Referencias

Pantallas de referencia de F7 y de la pantalla completa de captura (el logo negro es una aproximación):

- [Pantalla del lote con fondo claro](referencias/vista-previa-claro.png)
- [Pantalla del lote con fondo oscuro](referencias/vista-previa-oscuro.png)
- [Pantalla completa de captura con fondo claro](referencias/pantalla-completa-claro.png)
- [Pantalla completa de captura con fondo oscuro](referencias/pantalla-completa-oscuro.png)

## Fuentes

- W3C (2023). WCAG 2.2: criterios 1.4.6 (contraste mejorado, 7:1) y 2.5.5 (tamaño del objetivo, 44 px).
- Piepenbrock, C., Mayr, S., Mund, I. y Buchner, A. (2013). Positive display polarity is advantageous for both younger and older adults. _Ergonomics, 56_(7), 1116–1124.
- Braille Institute. Atkinson Hyperlegible.

## Preguntas abiertas

- ¿En qué equipo se usa la aplicación en el taller (computador, portátil, tablet) y a qué distancia del operario?
- ¿Qué palabras usa el taller: "muestra patrón" o "muestra de referencia"; "revisar tarros" o "comprobar tarros"?
