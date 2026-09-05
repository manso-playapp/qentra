import { fileURLToPath } from 'node:url'
import { defineConfig } from 'vitest/config'

export default defineConfig({
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./', import.meta.url)),
    },
  },
  test: {
    environment: 'node',
    // Sólo las pruebas de este checkout, sin duplicar worktrees de otros motores.
    include: ['lib/**/*.test.ts', 'app/**/*.test.ts', 'components/**/*.test.ts'],
  },
})
