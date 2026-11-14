# F7 · Fondo claro u oscuro

## Historia

Como operario, quiero elegir entre fondo claro y fondo oscuro para trabajar con el brillo que me resulte más cómodo en el puesto del sensor.

## Relación

Todas las pantallas. `app/layout.tsx` (lee la cookie `tema`, pone `data-tema` en `<html>` y elige el logo), `app/globals.css` (valores de los tokens para cada tema), `public/logo-negro.png` y `public/logo-blanco.png`, y el `matcher` de `proxy.ts` (los logos deben verse sin sesión). Diseño: [Tema oscuro](../diseno/identidad-visual.md#tema-oscuro). Antes de usar `cookies()`, leer la guía de Next.js 16 en `node_modules/next/dist/docs/` (ver `AGENTS.md`).

## Comportamiento

1. El encabezado muestra la etiqueta "Fondo:" y dos botones con texto: "Claro" y "Oscuro".
2. Sin cookie `tema`, la aplicación usa fondo claro (decisión del 2026-11-13).
3. Al pulsar un botón, el fondo y el logo cambian en ese momento, el botón elegido muestra "✓" y la elección se guarda en la cookie `tema` por 1 año.
4. En cada carga, el servidor lee la cookie y envía `<html data-tema="claro">` o `<html data-tema="oscuro">`, así la página llega ya con su tema y su logo y no parpadea.
5. El encabezado sigue el tema: con fondo claro es blanco y muestra el logo de letras negras (`logo-negro.png`); con fondo oscuro es `#101418` y muestra el logo de letras blancas (`logo-blanco.png`). En los dos temas lleva un borde inferior de 2 px.
6. El color real de la pintura (`resultado_hex`) se muestra igual en los dos temas.

## Criterios de aceptación

Pendientes:

- [ ] El encabezado muestra "Fondo:" seguido de los botones "Claro" y "Oscuro", con texto y sin mayúsculas sostenidas.
- [ ] Los dos botones miden 56 px de alto.
- [ ] El botón del tema activo muestra "✓" y tiene `aria-pressed="true"`; el otro tiene `aria-pressed="false"`.
- [ ] Sin la cookie `tema` (ventana privada), la aplicación se ve con fondo claro.
- [ ] Al pulsar "Oscuro", el fondo cambia sin recargar la página.
- [ ] Después de elegir "Oscuro", la cookie `tema` vale `oscuro` y vence en 1 año.
- [ ] Al recargar con fondo oscuro, la página no muestra el fondo claro ni por un instante.
- [x] El código fuente de la página (Ver código fuente) ya trae `data-tema` en `<html>`.
- [ ] El control y el tema elegido se ven en `/login`, `/`, `/lotes/[id]` y `/historial`.
- [ ] La pantalla completa de captura usa el tema elegido.
- [x] Con fondo claro, el encabezado es blanco y muestra el logo de letras negras.
- [x] Con fondo oscuro, el encabezado es `#101418` y muestra el logo de letras blancas.
- [x] En los dos temas, el encabezado tiene un borde inferior de 2 px.
- [ ] Al pulsar "Claro" u "Oscuro", el logo cambia sin recargar la página.
- [ ] Al recargar, no aparece el logo del otro tema ni por un instante.
- [x] En `/login`, sin sesión, el logo se ve en los dos temas (no aparece una imagen rota).
- [ ] El cuadro de color de un tarro muestra el mismo hex en los dos temas.
- [ ] Un cuadro de color oscuro (por ejemplo `#101418`) se distingue del fondo oscuro gracias a su borde.
- [ ] Con la herramienta de contraste del navegador, todo el texto da 7:1 o más en los dos temas.
- [ ] A 390 px de ancho, el control no se corta ni provoca desplazamiento horizontal.

## Fuera de alcance

Seguir el tema del sistema operativo (`prefers-color-scheme`), más de dos temas, guardar la preferencia en la base de datos.
