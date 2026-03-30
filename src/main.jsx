import React from 'react'
import ReactDOM from 'react-dom/client'
import { Toaster } from 'react-hot-toast'
import App from './App'
import './index.css'

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <App />
    <Toaster
      position="bottom-right"
      toastOptions={{
        duration: 3500,
        style: { fontSize: '14px', borderRadius: '10px', padding: '10px 14px' },
        success: { iconTheme: { primary: '#378ADD', secondary: '#fff' } },
      }}
    />
  </React.StrictMode>
)
