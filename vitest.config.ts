import { defineConfig } from 'vitest/config'

// Unit tests run against pure logic (scoring, repository), so we deliberately
// avoid loading the TanStack Start / SSR Vite plugins here.
export default defineConfig({
  test: {
    environment: 'node',
    include: ['src/**/*.test.ts'],
  },
})
