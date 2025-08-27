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
    // Ensure React is resolved correctly
    dedupe: ['react', 'react-dom'],
  },
  define: {
    // Ensure React DevTools work in production
    __DEV__: process.env.NODE_ENV === 'development',
  },
  build: {
    // Increase chunk size warning limit to 1MB
    chunkSizeWarningLimit: 1000,
    rollupOptions: {
      output: {
        // Simplified chunking to avoid context issues
        manualChunks: {
          vendor: ['react', 'react-dom', 'react-router-dom'],
          ui: ['lucide-react', '@radix-ui/react-dialog', '@radix-ui/react-select', '@radix-ui/react-avatar'],
          charts: ['recharts'],
          utils: ['axios', 'clsx', 'tailwind-merge']
        }
      }
    },
    
    // Target modern browsers for better compression
    target: 'es2020',
    
    // Enable minification
    minify: 'esbuild',
    
    // Enable source maps for debugging in production
    sourcemap: true
  }
})
