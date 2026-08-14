import { resolve } from 'node:path'
import { defineConfig } from 'vitest/config'

// Unit/integration tests run against pure logic + the file repository, so we
// deliberately avoid loading the TanStack Start / SSR Vite plugins here. We do
// need the `#/` path alias that the app code uses.
export default defineConfig({
  resolve: {
    alias: [{ find: /^#\//, replacement: `${resolve(process.cwd(), 'src')}/` }],
  },
  test: {
    environment: 'node',
    include: ['src/**/*.test.ts'],
  },
})
