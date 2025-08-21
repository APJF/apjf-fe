import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react-swc'
import tailwindcss from '@tailwindcss/vite'
import path from 'node:path'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react(), tailwindcss()],
  resolve: {
    alias: {
      '@': path.resolve(process.cwd(), 'src'),
    },
  },
  build: {
    // Increase chunk size warning limit to 1000kb
    chunkSizeWarningLimit: 1000,
    rollupOptions: {
      output: {
        // Manual chunking strategy
        manualChunks: {
          // React core libraries
          'react-vendor': ['react', 'react-dom', 'react-router-dom'],
          
          // UI component libraries
          'ui-vendor': ['lucide-react', '@radix-ui/react-dialog', '@radix-ui/react-select', '@radix-ui/react-avatar', '@radix-ui/react-label', '@radix-ui/react-separator', '@radix-ui/react-slot'],
          
          // Utility libraries
          'utils-vendor': ['clsx', 'tailwind-merge', 'class-variance-authority'],
          
          // PDF handling
          'pdf-vendor': ['pdfjs-dist'],
          
          // Authentication and API
          'api-vendor': ['axios'],
          
          // Internationalization
          'i18n-vendor': ['i18next', 'i18next-browser-languagedetector', 'i18next-http-backend', 'react-i18next'],
          
          // Drag and drop
          'dnd-vendor': ['@dnd-kit/core', '@dnd-kit/sortable', '@dnd-kit/utilities']
        },
        
        // Custom chunk naming
        chunkFileNames: () => {
          return `assets/js/[name]-[hash].js`;
        },
        
        entryFileNames: 'assets/js/[name]-[hash].js',
        assetFileNames: (assetInfo) => {
          const fileName = assetInfo.names?.[0] || 'asset';
          
          // Organize assets by type
          if (/\.(png|jpe?g|gif|svg|webp|ico)$/.test(fileName)) {
            return `assets/images/[name]-[hash].[ext]`;
          }
          if (/\.(woff2?|eot|ttf|otf)$/.test(fileName)) {
            return `assets/fonts/[name]-[hash].[ext]`;
          }
          if (fileName.endsWith('.css')) {
            return `assets/css/[name]-[hash].[ext]`;
          }
          
          return `assets/[name]-[hash].[ext]`;
        }
      }
    },
    
    // Target modern browsers for better compression
    target: 'es2020',
    
    // Enable minification
    minify: 'esbuild',
    
    // Source maps for debugging (optional, disable in production)
    sourcemap: false
  }
})
