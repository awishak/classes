import React from 'react'
import ReactDOM from 'react-dom/client'
import './storage-shim.js'
import App from './App.jsx'
import { baseCSS } from './engine/themes.js'

// The design tokens, as CSS variables, on every route. See baseCSS.
ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <style>{baseCSS()}</style>
    <App />
  </React.StrictMode>,
)
