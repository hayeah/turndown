import { defineConfig } from 'vitest/config'

export default defineConfig({
  test: {
    browser: {
      enabled: true,
      name: 'chromium',
      provider: 'playwright',
      headless: true
    },
    include: ['**/*.test.browser.ts'],
    exclude: ['node_modules/**']
  }
})