import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { existsSync, readFileSync, writeFileSync } from 'node:fs'
import { resolve } from 'node:path'

function nonBlockingStyles() {
  return {
    name: 'cinemapass-non-blocking-styles',
    closeBundle() {
      const htmlPath = resolve(process.cwd(), 'dist/index.html')
      if (!existsSync(htmlPath)) return

      let html = readFileSync(htmlPath, 'utf8')

      html = html.replace(
        /<link rel="stylesheet"([^>]*?)href="([^"]+)"([^>]*)>/g,
        (_match, beforeHref, href, afterHref) =>
          `<link rel="preload"${beforeHref}href="${href}"${afterHref} as="style" onload="this.onload=null;this.rel='stylesheet'">\n` +
          `<noscript><link rel="stylesheet"${beforeHref}href="${href}"${afterHref}></noscript>`
      )

      writeFileSync(htmlPath, html)
    },
  }
}

export default defineConfig({
  plugins: [react(), nonBlockingStyles()],

  server: {
    host: '0.0.0.0',
    port: 5173,

    watch: {
      ignored: [
        '**/backend/**',
        '**/bin/**',
        '**/obj/**',
      ],
    },
  },
})