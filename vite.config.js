import { rm } from 'node:fs/promises'
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

// docs/ is both the GitHub Pages output and the home of project docs (docs/*.md,
// docs/screenshots/). Instead of wiping the whole folder on every build, only remove the
// hashed bundle directory so stale JS/CSS never accumulates; everything else is overwritten.
function cleanHashedAssets(outDir) {
  return {
    name: 'clean-hashed-assets',
    apply: 'build',
    async buildStart() {
      await rm(`${outDir}/assets`, { recursive: true, force: true })
    },
  }
}

const outDir = 'docs'

export default defineConfig({
  // Relative asset/data paths keep the site working both on:
  // - GitHub Pages project URL: /worldcup-soren-predictor/
  // - Custom domain root: https://worldcup.kyasen.com/
  base: './',
  build: { outDir, emptyOutDir: false },
  plugins: [react(), githubPagesSentinels(), cleanHashedAssets(outDir)],
})
