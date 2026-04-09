import { defineConfig } from 'vitest/config'

export default defineConfig({
  resolve: {
    tsconfigPaths: true,
  },
  test: {
    globals: true,
    environment: 'node',
    include: [
      'src/actions/**/*.{test,spec}.ts',
      'src/lib/**/*.{test,spec}.ts',
      'tests/**/*.{test,spec}.ts',
    ],
    exclude: ['**/node_modules/**', '**/.next/**', '**/generated/**'],
    coverage: {
      provider: 'v8',
      reporter: ['text', 'html'],
      include: ['src/actions/**/*.ts', 'src/lib/**/*.ts'],
      exclude: ['src/lib/mock-data.ts', 'src/lib/item-type-icons.ts'],
    },
  },
})
