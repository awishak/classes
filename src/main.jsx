import React from 'react'
import ReactDOM from 'react-dom/client'
import './storage-shim.js'
import App from './App.jsx'
import { baseCSS, CARD_CSS } from './engine/themes.js'

// clarisa.app is this same site under its own name. Until the real classes
// move there (January), its front door is the class anyone can look at:
// the root opens COMM 222. Every other path is the same path as here.
if (/(^|\.)clarisa\.app$/i.test(window.location.hostname) && /^\/?$/.test(window.location.pathname)) {
  window.history.replaceState({}, '', '/comm222' + window.location.search)
}

// The design tokens, as CSS variables, and the one card rule that reads them,
// on every route. See baseCSS and CARD_CSS.
ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <style>{baseCSS() + CARD_CSS}</style>
    <App />
  </React.StrictMode>,
)
