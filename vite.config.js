import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import legacy from '@vitejs/plugin-legacy'; // handle older browsers
import path from 'path';
import commonjs from 'vite-plugin-commonjs'; // handle existing 'require' syntax
import inject from "@rollup/plugin-inject"; // used to inject jquery globally, so we can use jquery plugins like Trumbowyg 
import autoprefixer from 'autoprefixer';
import assets from 'postcss-assets';
import { visualizer } from 'rollup-plugin-visualizer';

// this is an attempt to mimic how code-splitting was done in our prior webpack set-up
// these libraries dont need to be included in the main bundle 
// split them into their own chunks and load asynchronously 
const dynamicLibs = ['klaro', 'downloadjs', 'react-sortable-tree', 'react-sidebar', 'trumbowyg']

export default defineConfig({
  plugins: [
    react(),
    commonjs(),
    // uncomment to visualize chunking 
    // visualizer({ open: true }),
    legacy({
      targets: ['defaults', 'not IE 11'],
    }),
    inject({
      $: 'jquery',
      jQuery: 'jquery',
      _: 'lodash',
      include: ['**/*.js', '**/*.jsx']
    })
  ],
  css: {
    devSourcemap: true,
    postcss: {
      plugins: [
        autoprefixer({
          overrideBrowserslist: ['last 2 versions'],
          flexbox: 'no-2009',
          grid: false,
        }),
        assets({
          loadPaths: ['images', 'fonts'],
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
    // sourcemap: true,
    // manifest: true,
    minify: 'esbuild',
    rollupOptions: {
      output: {
        manualChunks(id) {
          if (id.includes('node_modules')) {
            if (dynamicLibs.some(lib => id.includes(lib))) return; // skip chunking 

            // return vendor otherwise 
            return 'vendor';
          }
        }
      }
    }
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
