import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  test: {
    environment: 'jsdom',
    globals: true,
    setupFiles: './src/test/setup.ts',
    css: false,
    testTimeout: 15000,
  },
  build: {
    rollupOptions: {
      output: {
        manualChunks(id) {
          if (id.indexOf('node_modules') === -1) {
            return undefined;
          }
          if (id.indexOf('@mui') !== -1 || id.indexOf('@emotion') !== -1) {
            return 'mui-vendor';
          }
          return 'vendor';
        },
      },
    },
  },
  server: {
    port: 5174,
    strictPort: true,
  },
});
