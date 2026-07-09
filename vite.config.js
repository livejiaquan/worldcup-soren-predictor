import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

function githubPagesSentinels() {
  return {
    name: 'github-pages-sentinels',
    generateBundle() {
      this.emitFile({ type: 'asset', fileName: 'CNAME', source: 'worldcup.kyasen.com\n' })
      this.emitFile({ type: 'asset', fileName: '.nojekyll', source: '' })
    },
  }
}

export default defineConfig({
  // Relative asset/data paths keep the site working both on:
  // - GitHub Pages project URL: /worldcup-soren-predictor/
  // - Custom domain root: https://worldcup.kyasen.com/
  base: './',
  build: { outDir: 'docs', emptyOutDir: true },
  plugins: [react(), githubPagesSentinels()],
})
