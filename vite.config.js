import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// Two HTML entries, one app: index.html for everything, worktopia.html for
// /worktopia, which carries its own title, icon and link preview.
export default defineConfig({
  plugins: [react()],
  build: { rollupOptions: { input: { main: 'index.html', worktopia: 'worktopia.html' } } },
})
