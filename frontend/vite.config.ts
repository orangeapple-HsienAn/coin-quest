import { defineConfig, type PluginOption } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import path from 'path'
import { createReadStream, statSync } from 'fs'

/**
 * Dev-only plugin：把 ../data/cms-snapshot/ 掛在 /cms-snapshot 路徑
 * 讓前端可以直接 fetch / <img src> / <audio src> 讀本機 CMS 課程資料
 */
function cmsSnapshotPlugin(): PluginOption {
  const root = path.resolve(__dirname, '../data/cms-snapshot')
  const mimeMap: Record<string, string> = {
    '.json': 'application/json',
    '.png': 'image/png',
    '.jpg': 'image/jpeg',
    '.jpeg': 'image/jpeg',
    '.gif': 'image/gif',
    '.webp': 'image/webp',
    '.wav': 'audio/wav',
    '.mp3': 'audio/mpeg',
    '.html': 'text/html',
  }
  return {
    name: 'serve-cms-snapshot',
    configureServer(server) {
      server.middlewares.use('/cms-snapshot', (req, res) => {
        // 此 middleware 認領 /cms-snapshot/* 全部路徑：檔案存在則回傳，否則明確 404。
        // 不能 call next() — Vite 的 SPA fallback 會把 404 變成 index.html (200)，
        // 導致 fetch HEAD 永遠 ok，無法偵測檔案是否存在。
        const urlPath = decodeURIComponent((req.url || '').split('?')[0])
        const filePath = path.join(root, urlPath)
        if (!filePath.startsWith(root)) {
          res.statusCode = 403
          res.end('Forbidden')
          return
        }
        try {
          const stat = statSync(filePath)
          if (!stat.isFile()) {
            res.statusCode = 404
            res.end('Not found')
            return
          }
          const ext = path.extname(filePath).toLowerCase()
          res.setHeader('Content-Type', mimeMap[ext] ?? 'application/octet-stream')
          res.setHeader('Cache-Control', 'public, max-age=3600')
          res.setHeader('Access-Control-Allow-Origin', '*')
          createReadStream(filePath).pipe(res)
        } catch {
          res.statusCode = 404
          res.end('Not found')
        }
      })
    },
  }
}

// https://vite.dev/config/
export default defineConfig({
  plugins: [react(), tailwindcss(), cmsSnapshotPlugin()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
})
