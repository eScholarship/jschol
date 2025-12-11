import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { resolve } from 'path'

// https://vitejs.dev/config/
export default defineConfig(({ command, mode, isSsrBuild }) => {
  const isSSR = isSsrBuild || mode === 'ssr'
  const isProd = mode === 'production' || mode === 'ssr'
  
  return {
    plugins: [
      react({
        babel: {
          plugins: [
            ['@babel/plugin-proposal-decorators', { legacy: true }],
            '@babel/plugin-proposal-class-properties',
            '@babel/plugin-proposal-json-strings',
            '@babel/plugin-proposal-function-sent',
            '@babel/plugin-proposal-export-namespace-from',
            '@babel/plugin-proposal-numeric-separator',
            '@babel/plugin-proposal-throw-expressions',
          ]
        }
      })
    ],

    css: {
      preprocessorOptions: {
        scss: {
          // Make paths available to SCSS
          includePaths: ['app/scss', 'node_modules']
        }
      },
      postcss: './postcss.config.js'
    },

    resolve: {
      alias: {
        '@': resolve(__dirname, './app'),
      }
    },

    build: isSSR ? {
      // SSR Build Configuration
      ssr: true,
      outDir: 'app/js',
      emptyOutDir: false, // Don't delete client files
      rollupOptions: {
        input: resolve(__dirname, 'app/isomorphic-entry.jsx'),
        output: {
          format: 'cjs',
          entryFileNames: 'isomorphic-bundle.cjs',
          // Don't hash SSR bundle - we want consistent name
        },
        external: [
          // Don't bundle Node.js built-ins
          'express',
          'http',
          'url',
          'fs',
          'path',
          'body-parser',
          '@moebius/http-graceful-shutdown'
        ]
      },
      target: 'node18'
    } : {
      // Client Build Configuration
      outDir: 'app',
      emptyOutDir: false, // Don't wipe out on rebuild
      assetsDir: '', // Keep assets flat
      manifest: 'js/manifest.json', // Put manifest in js/
      cssCodeSplit: false, // Bundle all CSS into one file
      rollupOptions: {
        input: resolve(__dirname, 'main.jsx'),
        output: {
          // Match webpack's naming pattern for cache busting
          entryFileNames: 'js/app-bundle-[hash].js',
          chunkFileNames: 'js/[name]-bundle-[hash].js',
          assetFileNames: (assetInfo) => {
            // Put CSS in css/ directory, everything else in js/
            if (assetInfo.name && assetInfo.name.endsWith('.css')) {
              return 'css/[name]-[hash][extname]'
            }
            return 'js/[name]-[hash][extname]'
          },
          manualChunks: (id) => {
            // Separate vendor code (like webpack's splitChunks)
            if (id.includes('node_modules')) {
              return 'vendors~app'
            }
          }
        }
      },
      target: 'es2015',
      sourcemap: isProd ? true : 'inline'
    },

    // Development server config (for HMR during dev)
    server: {
      port: 5173,
      strictPort: false
    },

    // Make jQuery available globally (for trumbowyg and other plugins)
    define: isSSR ? {} : {
      'global': 'window',
      'process.env.NODE_ENV': JSON.stringify(mode)
    },

    optimizeDeps: {
      include: ['jquery', 'react', 'react-dom', 'react-router-dom']
    }
  }
})

