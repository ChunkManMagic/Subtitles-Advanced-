import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    // Warmup frequently used files to speed up initial load in the browser during dev
    warmup: {
      clientFiles: [
        './src/main.tsx',
        './src/App.tsx',
        './src/store.ts',
        './src/types.ts',
      ],
    },
  },
  build: {
    // Enable source map for production debugging
    sourcemap: true,
    // Optimize rollup options for efficient asset delivery and code splitting
    rollupOptions: {
      output: {
        manualChunks(id) {
          // Put standard node_modules like react and state management into a vendor chunk
          if (id.includes('node_modules')) {
            if (id.includes('react') || id.includes('react-dom')) {
              return 'vendor-react';
            }
            if (id.includes('lucide-react')) {
              return 'vendor-icons';
            }
            return 'vendor';
          }
        },
      },
    },
    // Keep bundle size warning to standard limits
    chunkSizeWarningLimit: 1000,
  },
});
