import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.tsx'
import './dev-setup'

createRoot(document.getElementById('root')!).render(
  <App />
)
