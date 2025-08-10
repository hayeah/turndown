import { defineConfig } from 'vitest/config'

export default defineConfig({
  test: {
    globals: true,
    environment: 'jsdom',
    include: ['**/*.test.ts'],
    exclude: ['**/*.test.browser.ts', 'node_modules/**']
  }
})