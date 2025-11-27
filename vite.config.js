import { defineConfig } from 'vite';

export default defineConfig({
  build: {
    rollupOptions: {
      output: {
        entryFileNames: 'script.js',
        chunkFileNames: '[name].js',   // jangan pakai nama fix
        assetFileNames: (assetInfo) => {
          if (assetInfo.name && assetInfo.name.endsWith('.css')) {
            return 'style.css';
          }
          return assetInfo.name || '[name].[ext]';
        }
      }
    }
  }
});