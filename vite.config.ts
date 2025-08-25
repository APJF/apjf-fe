import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react-swc'
import tailwindcss from '@tailwindcss/vite'
import path from 'node:path'

// Vendor chunk helpers
function getVendorChunk(id: string): string | undefined {
  if (id.includes('react') && !id.includes('react-router')) return 'react-vendor'
  if (id.includes('react-router-dom')) return 'router-vendor'
  if (id.includes('lucide-react') || id.includes('@radix-ui')) return 'ui-vendor'
  if (id.includes('clsx') || id.includes('tailwind-merge') || id.includes('class-variance-authority')) return 'utils-vendor'
  if (id.includes('pdfjs-dist')) return 'pdf-vendor'
  if (id.includes('axios')) return 'api-vendor'
  if (id.includes('i18next') || id.includes('react-i18next')) return 'i18n-vendor'
  return undefined
}

function getPageChunk(id: string): string | undefined {
  if (id.includes('/pages/admin/')) return 'admin-pages'
  if (id.includes('/pages/auth/')) return 'auth-pages'
  if (id.includes('/pages/exam/')) return 'exam-pages'
  if (id.includes('/pages/learning-path/')) return 'learning-pages'
  if (id.includes('/pages/manager/')) return 'manager-pages'
  if (id.includes('/pages/staff/')) return 'staff-pages'
  if (id.includes('/pages/study/')) return 'study-pages'
  if (id.includes('/pages/')) return 'main-pages'
  return undefined
}

// Main chunk strategy function
function getManualChunk(id: string): string | undefined {
  // Node modules
  if (id.includes('node_modules')) {
    return getVendorChunk(id)
  }
  
  // App source code
  if (id.includes('/src/')) {
    if (id.includes('/services/')) return 'services-vendor'
    if (id.includes('/components/')) return 'components-vendor'
    return getPageChunk(id)
  }
  
  return undefined
}

// https://vite.dev/config/
export default defineConfig({
  plugins: [react(), tailwindcss()],
  resolve: {
    alias: {
      '@': path.resolve(process.cwd(), 'src'),
    },
  },
  build: {
    // Increase chunk size warning limit to 500kb
    chunkSizeWarningLimit: 500,
    rollupOptions: {
      output: {
        // Manual chunking strategy
        manualChunks: getManualChunk,
        
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
