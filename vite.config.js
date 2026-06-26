import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  base: process.env.GITHUB_REPOSITORY ? '/worldcup-soren-predictor/' : '/',
  build: { outDir: 'docs', emptyOutDir: true },
  plugins: [react()],
})
