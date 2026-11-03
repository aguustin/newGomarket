import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import './api/http.js' //token de sesion en cada pedido al backend
import App from './App.jsx'

createRoot(document.getElementById('root')).render(
  //<StrictMode>
    <App />
  //</StrictMode>
)
