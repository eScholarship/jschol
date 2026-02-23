import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { resolve } from 'path'
import inject from '@rollup/plugin-inject';

// https://vitejs.dev/config/
export default defineConfig(({ command, mode, isSsrBuild }) => {
  const isSSR = isSsrBuild || mode === 'ssr'
  const isProd = mode === 'production'
  
  console.log(`Vite build mode: ${mode}, isSSR: ${isSSR}`)
  
  return {
    plugins: [
      react({
        jsxRuntime: 'classic', // Required for React 16 - uses React.createElement
      }),
      inject({
        $: 'jquery',
        jQuery: 'jquery',
        _: 'lodash',
        include: ['**/*.js', '**/*.jsx']
      })
    ],

    css: {
      preprocessorOptions: {
        scss: {
          // Use modern Sass API instead of legacy
          api: 'modern-compiler',
          // Make paths available to SCSS
          includePaths: ['app/scss', 'node_modules'],
          // TODO: remove this once we've migrated to modern Sass API
          silenceDeprecations: ['import', 'global-builtin', 'color-functions'] 
        }
      },
      postcss: './postcss.config.js'
    },

    resolve: {
      alias: {
        '@': resolve(__dirname, './app'),
      }
    },
    publicDir: false,
    build: isSSR ? {
      // SSR Build Configuration
      ssr: true,
      outDir: 'app/js',
      emptyOutDir: false, // Don't delete client files
      minify: isProd, // Only minify SSR in production
      sourcemap: !isProd, // Only generate source maps in development
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
    } : {
      // Client Build Configuration
      outDir: 'app',
      emptyOutDir: false, // Don't wipe out on rebuild
      assetsDir: '', // Keep assets flat
      manifest: 'js/manifest.json', // Put manifest in js/
      cssCodeSplit: false, // Bundle all CSS into one file
      minify: isProd ? 'esbuild' : false, // Minify only in production for debuggable dev builds
      sourcemap: !isProd, // Only generate source maps in development
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
            if (id.includes('node_modules')) {
              // CMS-only packages: let Rollup code-split these naturally
              // only loaded for logged in CMS users
              if (id.includes('react-sidebar') ||
                  id.includes('react-sortable-tree') ||
                  id.includes('trumbowyg')) {
                return undefined
              }
              return 'vendors~app'
            }
          }
        }
      },
      target: 'es2015',
    },

    // Development server config (for HMR during dev)
    server: {
      port: 18880,
      strictPort: false
    },

    // Make jQuery available globally (for trumbowyg and other plugins)
    define: isSSR ? {} : {
      'global': 'window',
      'process.env.NODE_ENV': JSON.stringify(mode)
    },

    // optimizeDeps: {
    //   include: ['jquery', 'react', 'react-dom', 'react-router-dom']
    // }
  }
})

