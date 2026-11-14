# Producto · ChromaCheck

## Problema

En el taller JGC, aprobar un lote de pintura depende de un colorista experto que compara los colores a ojo. El proceso es lento, está expuesto al error humano y cuesta cada semana.

## Usuario

- **Operador del taller**: una sola persona, junto al sensor, abre el lote, toma la muestra patrón, revisa los tarros y consulta el historial. Entra con la cuenta del taller (una sola cuenta, sin roles).

Perfil: mayor de 55 años, trabaja de pie junto al sensor, no usa aplicaciones a diario y le cuesta leer letra pequeña. Un flujo con pasos de más le genera estrés en lugar de ayudarle. Por eso la interfaz usa letra grande, contraste alto, botones grandes, una sola acción principal por pantalla y muestra lo que hace el sensor en una pantalla completa (ver [diseno/identidad-visual.md](diseno/identidad-visual.md)).

## Objetivo del MVP

Que el operador, sin ayuda, abra un lote, tome la muestra patrón y revise sus tarros siguiendo un flujo de un botón por paso, y que el dictamen del sistema coincida con el juicio visual de una persona experimentada en al menos el 90 % de los tarros.

## Cómo funciona

Para el operador: **Abrir lote → Tomar muestra patrón → Revisar tarros**. El resultado de cada paso aparece en una pantalla completa, centrada y con letra grande.

Por dentro: el Arduino con el sensor TCS3200 lee el color de cada tarro, el puente serial lo envía a la API, la API calcula la diferencia de color (ΔE, fórmula CIE76) frente a la muestra patrón del lote, da el dictamen y genera las alertas. El detalle está en [arquitectura.md](arquitectura.md).

## Funcionalidades (ver `docs/specs/`)

1. **Entrar con la cuenta del taller**: [F1 · Iniciar sesión](specs/F1-iniciar-sesion.md)
2. **Abrir el lote del color**: [F2 · Ver y agregar lotes](specs/F2-lotes.md)
3. **Tomar la muestra patrón**: [F3 · Tomar la muestra patrón](specs/F3-tomar-muestra-patron.md)
4. **Revisar tarros con dictamen y alertas**: [F4 · Revisar tarros](specs/F4-revisar-tarros.md) y [F5 · Alertas y pausa del lote](specs/F5-alertas-y-pausa.md)
5. **Consultar el historial**, como consulta secundaria fuera del flujo principal: [F6 · Historial de tarros](specs/F6-historial.md)

## Fuera del MVP

Según las exclusiones del Acta de Constitución: módulo de contabilidad o facturación, aplicación móvil nativa, integración con sistemas ERP y pasarelas de pago. Tampoco entran: registro público de usuarios, varias cuentas o roles distintos, varios sensores al mismo tiempo y calibrar el sensor desde la web (la calibración se hace por el puerto serial, ver [contratos/serial.md](contratos/serial.md)).

## Cómo sabremos que funciona

| Qué                                                                                                                           | Umbral                     | Atributo |
| ----------------------------------------------------------------------------------------------------------------------------- | -------------------------- | -------- |
| Tarros en los que el dictamen del sistema coincide con el juicio visual de una persona experimentada (prueba de 20 tarros)    | ≥ 90 %                     | MVP      |
| Usuarios de prueba sin capacitación que toman la muestra y revisan tarros sin errores críticos, sin ayuda y en menos de 3 min | ≥ 80 % de 10 usuarios      | ACQ-01   |
| Lecturas por encima de la tolerancia que generan su alerta                                                                    | 100 %                      | ACQ-04   |
| Diferencia entre el ΔE del sistema y un cálculo manual con CIE76                                                              | ≤ 0,5 ΔE                   | ACQ-05   |
| Dependencia de la inspección del colorista en el piloto                                                                       | 80 % menos en la semana 16 | Acta     |

La tolerancia vigente es **ΔE > 8,0 → No aprobado** (ver la decisión del 2026-11-10 en [decisiones.md](decisiones.md)).
