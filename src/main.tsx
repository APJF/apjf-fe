import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.tsx'

// Import debug utilities (dev only)
if (import.meta.env.DEV) {
  import('./utils/tokenDebug.ts');
  import('./utils/tokenCleanup.ts');
}

createRoot(document.getElementById('root')!).render(
  <App />
)
