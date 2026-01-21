import { defineConfig } from 'vitest/config'

export default defineConfig({
  test: {
    environment: 'jsdom',
    globals: true,
    setupFiles: ['./setupTests.ts'], // ou ./src/setupTests.ts selon ton choix
    coverage: {
      provider: 'v8',
      reporter: ['lcov', 'text'],
    },
  },
})
