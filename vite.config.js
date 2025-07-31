import { defineConfig } from 'vite'
import { fileURLToPath, URL } from 'node:url'

export default defineConfig({
  // Configuración del servidor de desarrollo
  server: {
    host: 'localhost',
    port: 5173,
    open: true,  // Abre automáticamente el navegador
    cors: true,
    strictPort: false  // Si el puerto está ocupado, busca el siguiente disponible
  },

  // Resolución de paths y alias
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url)),
      '@core': fileURLToPath(new URL('./src/core', import.meta.url)),
      '@ui': fileURLToPath(new URL('./src/ui', import.meta.url)),
      '@utils': fileURLToPath(new URL('./src/utils', import.meta.url)),
      '@styles': fileURLToPath(new URL('./src/styles', import.meta.url))
    }
  },

  // Configuración CSS y Sass
  css: {
    preprocessorOptions: {
      scss: {
        // Variables globales disponibles en todos los archivos .scss
        additionalData: `@use "@styles/base/variables" as *;`,
        // Configuraciones de compilación Sass
        api: 'modern-compiler',  // Usa el compilador moderno de Sass
        silenceDeprecations: ['legacy-js-api']
      }
    },
    // Habilitar source maps en desarrollo
    devSourcemap: true
  },

  // Variables de entorno globales
  define: {
    __APP_VERSION__: JSON.stringify(process.env.npm_package_version || '0.1.0'),
    __DEV__: JSON.stringify(process.env.NODE_ENV === 'development')
  },

  // Configuración de build para producción
  build: {
    target: 'baseline-widely-available',  // Compatibilidad con navegadores modernos
    outDir: 'dist',
    assetsDir: 'assets',
    sourcemap: true,  // Source maps para debugging en producción
    minify: 'esbuild',  // Minificación rápida con esbuild
    
    // Configuración de chunks para optimizar carga
    rollupOptions: {
      output: {
        manualChunks: {
          // Separar dependencias de terceros en chunks independientes
          vendor: ['vite']
        }
      }
    },
    
    // Optimización de assets
    assetsInlineLimit: 4096,  // Inline assets < 4kb como base64
    chunkSizeWarningLimit: 500,  // Aviso si chunks > 500kb
    
    // CSS minification
    cssMinify: true
  },

  // Configuración de preview (para probar build de producción)
  preview: {
    host: 'localhost',
    port: 4173,
    open: true
  },

  // Configuración para optimización de dependencias
  optimizeDeps: {
    include: [
      // Pre-bundle dependencias que puedan causar problemas
    ],
    exclude: [
      // Excluir dependencias que no necesiten pre-bundling
    ]
  },

  // Configuración de plugins (por ahora vacío, pero listo para extensiones)
  plugins: [
    // Aquí irían plugins como el futuro SVG linter plugin
  ],

  // Configuración para modo desarrollo vs producción
  ...(process.env.NODE_ENV === 'development' && {
    // Configuraciones específicas de desarrollo
    esbuild: {
      drop: []  // No eliminar console.log en desarrollo
    }
  }),

  ...(process.env.NODE_ENV === 'production' && {
    // Configuraciones específicas de producción
    esbuild: {
      drop: ['console', 'debugger']  // Eliminar console.log en producción
    }
  })
})
