import { defineConfig } from 'vite-plus';

export default defineConfig({
  test: { include: ['tests/e2e/**/*.e2e.ts'], testTimeout: 30000, disableConsoleIntercept: true },
});
