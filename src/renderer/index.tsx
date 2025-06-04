import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App'
import './index.css'

// Global type declaration for Electron API
declare global {
  interface Window {
    electronAPI: import('../preload/preload').ElectronAPI
  }
}

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
)
