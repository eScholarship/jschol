import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import legacy from '@vitejs/plugin-legacy'; // handle older browsers
import path from 'path';
import commonjs from 'vite-plugin-commonjs'; // handle existing 'require' syntax
import inject from "@rollup/plugin-inject"; // used to inject jquery globally, so we can use jquery plugins like Trumbowyg 
import autoprefixer from 'autoprefixer';
import assets from 'postcss-assets';


export default defineConfig({
  plugins: [
    react(),
    commonjs(),
    legacy({
      targets: ['defaults', 'not IE 11'],
    }),
    inject({
      $: 'jquery',
      jQuery: 'jquery',
      _: 'lodash'
    })
  ],
  css: {
    postcss: {
      plugins: [
        autoprefixer,
        assets({
          loadPaths: ['public/images', 'public/fonts'],
          basePath: path.resolve(__dirname, 'public'), 
          relative: true, 
        })
      ],
    },
  },
  // optimizeDeps: {
  //   include: ['react-sortable-tree', 'react-virtualized']
  // },
  // ssr: {
  //   noExternal: ['react-sortable-tree', 'react-virtualized']
  // },
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
    open: true,
    proxy: {
      '/api': {
        target: 'http://localhost:18880', 
        changeOrigin: true,
      },
      '/cms-assets': {
        target: 'http://localhost:18880',
        changeOrigin: true,
      },
      '/content': {
        target: 'http://localhost:18880',
        changeOrigin: true,
      }
    },
  },
})
