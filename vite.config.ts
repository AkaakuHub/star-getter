import { defineConfig } from 'vite-plus';

export default defineConfig({
  build: { target: 'es2023', chunkSizeWarningLimit: 250 },
  lint: {
    options: { typeAware: true, typeCheck: true },
    rules: {
      'typescript/no-explicit-any': 'error',
      'max-lines': ['error', { max: 350, skipBlankLines: true }],
    },
  },
  fmt: { singleQuote: true, ignorePatterns: ['pnpm-lock.yaml', 'dist/**'] },
  test: { include: ['tests/**/*.test.ts'] },
});
