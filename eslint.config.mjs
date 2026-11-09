import { defineConfig, globalIgnores } from 'eslint/config';
import nextVitals from 'eslint-config-next/core-web-vitals';
import nextTs from 'eslint-config-next/typescript';
import prettier from 'eslint-config-prettier/flat';

const eslintConfig = defineConfig([
  ...nextVitals,
  ...nextTs,
  // Desactiva las reglas de estilo que chocan con Prettier; va después de las demás configuraciones
  prettier,
  {
    rules: {
      // ACQ-03: complejidad ciclomática máxima de 10 por función. Queda como advertencia
      // hasta refactorizar POST de app/api/tarros/route.ts (15) y PaginaLote de
      // app/lotes/[id]/page.tsx (14); después pasará a 'error'
      complexity: ['warn', 10],
    },
  },
  // Override default ignores of eslint-config-next.
  globalIgnores([
    // Default ignores of eslint-config-next:
    '.next/**',
    'out/**',
    'build/**',
    'next-env.d.ts',
    // Entorno virtual de Python del puente serial (dependencias instaladas, no es código del proyecto)
    'puente-serial/.venv/**',
  ]),
]);

export default eslintConfig;
