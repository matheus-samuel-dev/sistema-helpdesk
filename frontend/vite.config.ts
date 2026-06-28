import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
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
