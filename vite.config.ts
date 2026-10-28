import { defineConfig } from 'vite-plus';
import tailwindcss from '@tailwindcss/vite';

export default defineConfig({
  plugins: [tailwindcss()],
  optimizeDeps: { exclude: ['@akaakuhub/suku-sute-core'] },
  build: { target: 'es2023', chunkSizeWarningLimit: 250 },
  lint: {
    ignorePatterns: ['vendor/**'],
    options: { typeAware: true, typeCheck: true },
    rules: {
      'typescript/no-explicit-any': 'error',
      'max-lines': ['error', { max: 350, skipBlankLines: true }],
    },
  },
  fmt: { singleQuote: true, ignorePatterns: ['pnpm-lock.yaml', 'dist/**', 'vendor/**'] },
  test: { include: ['tests/**/*.test.ts'] },
});
