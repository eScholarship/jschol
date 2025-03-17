import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import legacy from '@vitejs/plugin-legacy';
import path from 'path';
import commonjs from 'vite-plugin-commonjs';

export default defineConfig({
  plugins: [
    react(),
    commonjs(),
    legacy({
      targets: ['defaults', 'not IE 11'],
    }),
  ],
  resolve: {
    alias: {
      'pdfjs-lib': path.resolve(__dirname, 'node_modules/pdfjs-embed2/src/pdf.js'),
    },
  },
  build: {
    outDir: 'dist',
    sourcemap: true,
    manifest: true,
    minify: 'esbuild',
  },
  server: {
    port: 18880,
    open: true,
    proxy: {
      '/api': {
        target: 'http://localhost:18880', 
        changeOrigin: true,
      }
    },
  },
})
