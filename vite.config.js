import { defineConfig } from 'vite';

export default defineConfig({
  server: {
    port: 5173,
    strictPort: true,   // origine stable : localStorage/IndexedDB/permissions persistants
    open: true,
  },
  build: {
    target: 'es2020',
  },
});
