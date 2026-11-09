@AGENTS.md

# Reglas del equipo ChromaCheck

## Idioma

- Todo en español: código (identificadores), comentarios, commits, ramas, títulos y descripciones de PR, y documentación.

## Ramas, commits y PR

- Las ramas nuevas son `feature/**` y salen de `development` actualizado (`git switch development`, `git pull`).
- La historia debe ser lineal: `development` no acepta commits de merge. Para traer cambios, usar rebase o cherry-pick, nunca merge.
- Commits pequeños con Conventional Commits en imperativo: `tipo(alcance): descripción`.
- Los PR van a `development` con revisor `michaelarias25`: `gh pr create --base development --reviewer michaelarias25`.
- Sin atribución de IA en commits ni en PR: nada de `Co-Authored-By` ni "Generated with Claude Code".
- Nunca aprobar ni fusionar PR: la aprobación es de Michael.
- Nunca hacer push a `main` ni force-push.

## Datos de prueba

- No insertar datos de prueba con SQL manual: crearlos con la API.
- Los datos de prueba llevan el prefijo `TEST_` (por ejemplo, el código del lote) y se borran al terminar.
- Todo cambio de tabla se prueba primero en el SQL Editor de Neon.

## Antes de abrir un PR

- `npx prettier --check .`, `npm run lint` y `npm run build` sin errores.
- Si cambia una ruta de la API o el esquema, actualizar `README.md` o `docs/` en el mismo PR.
