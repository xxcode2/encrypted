import { defineConfig } from 'vite';

export default defineConfig({
  build: {
    rollupOptions: {
      output: {
        entryFileNames: 'script.js',  // Forces script.js name
        chunkFileNames: 'script.js',
        assetFileNames: ({name}) => {
          if (/\.css$/.test(name ?? '')) {
            return 'style.css';  // Forces style.css name
          }
          return name;  // Other assets keep original names
        }
      }
    }
  }
});