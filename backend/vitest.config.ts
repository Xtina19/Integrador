import { defineConfig } from 'vitest/config'

export default defineConfig({
  test: {
    include: ['src/**/*.test.ts'],
    environment: 'node',
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json-summary', 'html'],
      include: ['src/modules/inventario/**/*.ts'],
      exclude: [
        'src/modules/inventario/**/*.test.ts',
        'src/modules/inventario/docs/**',
        'src/modules/inventario/infrastructure/api/openapi/**',
      ],
    },
  },
})
