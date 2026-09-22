import React from 'react'
import ReactDOM from 'react-dom/client'
import './storage-shim.js'
import App from './App.jsx'
import { baseCSS, CARD_CSS } from './engine/themes.js'

// The design tokens, as CSS variables, and the one card rule that reads them,
// on every route. See baseCSS and CARD_CSS.
ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <style>{baseCSS() + CARD_CSS}</style>
    <App />
  </React.StrictMode>,
)
