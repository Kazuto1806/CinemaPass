import { defineConfig, loadEnv } from 'vite'
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

function apiResourceHints(apiBase) {
  const apiOrigin = new URL(apiBase).origin

  return {
    name: 'cinemapass-api-resource-hints',
    transformIndexHtml: {
      order: 'pre',
      handler() {
        return [
          {
            tag: 'link',
            attrs: {
              rel: 'preconnect',
              href: apiOrigin,
              crossorigin: 'anonymous',
            },
            injectTo: 'head-prepend',
          },
          {
            tag: 'link',
            attrs: { rel: 'dns-prefetch', href: apiOrigin },
            injectTo: 'head-prepend',
          },
          {
            tag: 'link',
            attrs: {
              rel: 'preload',
              as: 'fetch',
              href: `${apiBase}/api/movies`,
              crossorigin: 'anonymous',
            },
            injectTo: 'head-prepend',
          },
        ]
      },
    },
  }
}

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), 'VITE_')
  const apiBase = (
    env.VITE_API_URL ||
    (mode === 'development'
      ? 'http://localhost:5000'
      : 'https://cinemapass.onrender.com')
  ).replace(/\/+$/, '')

  return {
    plugins: [react(), apiResourceHints(apiBase), nonBlockingStyles()],

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
  }
})