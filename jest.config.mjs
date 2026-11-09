// Configuración de Jest. next/jest compila TypeScript con SWC (el mismo compilador de Next.js)
// y carga las variables de .env; aquí se agregan el alias @/ y la cobertura de lib/modulos
import nextJest from 'next/jest.js';

const crearConfiguracionJest = nextJest({ dir: './' });

/** @type {import('jest').Config} */
const configuracion = {
  // Las pruebas son de lógica del servidor (reglas, servicios y repositorios), no de pantallas
  testEnvironment: 'node',
  moduleNameMapper: {
    '^@/(.*)$': '<rootDir>/$1',
  },
  testMatch: ['<rootDir>/lib/**/*.test.ts'],
  clearMocks: true,
  // ACQ-03: cobertura de pruebas unitarias de al menos 80 % sobre lib/modulos
  collectCoverageFrom: ['lib/modulos/**/*.ts', '!lib/modulos/**/*.test.ts'],
  coverageProvider: 'v8',
  coverageReporters: ['text', 'html'],
  coverageThreshold: {
    global: { statements: 80, branches: 80, functions: 80, lines: 80 },
  },
};

export default crearConfiguracionJest(configuracion);
