import 'dotenv/config'
import express from 'express'
import cors from 'cors'
import multer from 'multer'
import path from 'path'
import fs from 'fs'

// Server-side configuration via environment variables
const GH_OWNER = process.env.GH_OWNER || process.env.VITE_GH_OWNER
const GH_REPO = process.env.GH_REPO || process.env.VITE_GH_REPO
const GH_BRANCH = process.env.GH_BRANCH || process.env.VITE_GH_BRANCH || 'main'
const GH_PATH = process.env.GH_PATH || process.env.VITE_GH_PATH || 'pdfs'
const GH_TOKEN = process.env.GH_TOKEN

const app = express()
app.use(cors())

// Simple API request logger (only for /api/*)
app.use((req, _res, next) => {
  if (req.path.startsWith('/api/')) {
    console.log(`[api] ${req.method} ${req.path}`)
  }
  next()
})

// Serve static frontend (dist folder) if it exists (Render build step produced it)
const distDir = path.resolve(process.cwd(), 'dist')
if (fs.existsSync(distDir)) {
  app.use(express.static(distDir, { maxAge: '1h', extensions: ['html'] }))
}

const upload = multer({ limits: { fileSize: 1024 * 1024 * 50 } }) // 50MB cap

app.get('/api/health', (_req, res) => {
  res.json({ ok: true, repo: `${GH_OWNER}/${GH_REPO}`, branch: GH_BRANCH, path: GH_PATH, configured: !!GH_TOKEN })
})

app.get('/api/list', async (_req, res) => {
  try {
    if (!GH_OWNER || !GH_REPO) return res.status(400).json({ error: 'BadConfig', message: 'Missing owner/repo' })
    const treeUrl = `https://api.github.com/repos/${GH_OWNER}/${GH_REPO}/git/trees/${encodeURIComponent(GH_BRANCH)}?recursive=1`
    const headers = { Accept: 'application/vnd.github.v3+json' }
    if (GH_TOKEN) headers.Authorization = `Bearer ${GH_TOKEN}`
    const tres = await fetch(treeUrl, { headers })
    if (!tres.ok) {
      const txt = await tres.text().catch(() => '')
      return res.status(tres.status).send(txt)
    }
    const tdata = await tres.json()
    const files = Array.isArray(tdata?.tree)
      ? tdata.tree.filter(it => it.type === 'blob' && /\.pdf$/i.test(it.path)).map(it => ({
          id: it.path,
          path: it.path,
          name: it.path.split('/').pop(),
          url: `https://raw.githubusercontent.com/${GH_OWNER}/${GH_REPO}/${encodeURIComponent(GH_BRANCH)}/${it.path}`,
          size: it.size,
          sha: it.sha,
        }))
      : []
    res.json(files)
  } catch (e) {
    console.error(e)
    res.status(500).json({ error: 'ListError', message: e?.message || 'Unknown error' })
  }
})

app.post('/api/upload', upload.single('file'), async (req, res) => {
  try {
    if (!GH_TOKEN) return res.status(500).json({ error: 'ServerNotConfigured', message: 'Missing GH_TOKEN on server' })
    if (!GH_OWNER || !GH_REPO) return res.status(400).json({ error: 'BadConfig', message: 'Missing owner/repo' })
    const file = req.file
    if (!file) return res.status(400).json({ error: 'NoFile', message: 'No file provided' })

    const safeName = (file.originalname || 'document.pdf').replace(/\s+/g, '_')
    const basePath = (GH_PATH ? GH_PATH.replace(/\/$/, '') + '/' : '')
    const targetPath = basePath + safeName

    // Convert buffer to base64
    const b64 = file.buffer.toString('base64')

    // Check if file exists to get sha
    const checkUrl = `https://api.github.com/repos/${GH_OWNER}/${GH_REPO}/contents/${encodeURIComponent(targetPath)}?ref=${encodeURIComponent(GH_BRANCH)}`
    let sha
    {
      const resp = await fetch(checkUrl, { headers: { Accept: 'application/vnd.github.v3+json', Authorization: `Bearer ${GH_TOKEN}` } })
      if (resp.ok) {
        const j = await resp.json()
        sha = j.sha
      }
    }

    const putUrl = `https://api.github.com/repos/${GH_OWNER}/${GH_REPO}/contents/${encodeURIComponent(targetPath)}`
    const body = {
      message: sha ? `Update ${safeName}` : `Upload ${safeName}`,
      content: b64,
      branch: GH_BRANCH,
      ...(sha ? { sha } : {}),
    }
    const putResp = await fetch(putUrl, {
      method: 'PUT',
      headers: {
        Accept: 'application/vnd.github.v3+json',
        Authorization: `Bearer ${GH_TOKEN}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(body),
    })
    const txt = await putResp.text()
    if (!putResp.ok) return res.status(putResp.status).send(txt)
    const json = JSON.parse(txt)
    return res.json({
      path: json.content?.path || targetPath,
      url: `https://raw.githubusercontent.com/${GH_OWNER}/${GH_REPO}/${encodeURIComponent(GH_BRANCH)}/${targetPath}`,
      sha: json.content?.sha,
    })
  } catch (e) {
    console.error(e)
    res.status(500).json({ error: 'UploadError', message: e?.message || 'Unknown error' })
  }
})

// PDF proxy: serve GitHub raw content with inline headers for iframe viewing
app.get('/api/pdf', async (req, res) => {
  try {
    const p = (req.query.path || '').toString()
    if (!p) return res.status(400).json({ error: 'BadRequest', message: 'Missing path query parameter' })
    if (p.includes('..')) return res.status(400).json({ error: 'BadPath', message: 'Invalid path' })

    // Encode each path segment to preserve slashes while handling spaces etc.
    const safePath = p.split('/').map(encodeURIComponent).join('/')
    const rawUrl = `https://raw.githubusercontent.com/${GH_OWNER}/${GH_REPO}/${encodeURIComponent(GH_BRANCH)}/${safePath}`

    const headers = { Accept: 'application/octet-stream' }
    if (req.headers.range) headers.Range = req.headers.range

    const upstream = await fetch(rawUrl, { headers })

    // Forward status; set headers conducive to inline PDF rendering
    res.status(upstream.status)

    // Copy relevant headers if present
    const passHeaders = ['content-length', 'content-range', 'accept-ranges', 'etag', 'last-modified']
    passHeaders.forEach((h) => {
      const v = upstream.headers.get(h)
      if (v) res.setHeader(h, v)
    })

    const name = p.split('/').pop() || 'document.pdf'
    res.setHeader('Content-Type', 'application/pdf')
    res.setHeader('Content-Disposition', `inline; filename="${name.replace(/"/g, '')}"`)

    if (!upstream.body) {
      return res.end()
    }
    // Stream the body to the client
    upstream.body.pipe(res)
  } catch (e) {
    console.error(e)
    res.status(500).json({ error: 'PdfProxyError', message: e?.message || 'Unknown error' })
  }
})

// Unknown API route handler (must come after known routes)
app.use('/api', (req, res, next) => {
  if (req.path === '/' || req.path === '') return next()
  res.status(404).json({ error: 'NotFound', path: req.originalUrl })
})

// SPA fallback: for any non-API GET request, serve index.html (only if dist exists)
app.get(/^(?!\/api\/).*/, (req, res, next) => {
  if (!fs.existsSync(distDir)) return next()
  const indexFile = path.join(distDir, 'index.html')
  if (fs.existsSync(indexFile)) return res.sendFile(indexFile)
  next()
})

const port = process.env.PORT || 8787
app.listen(port, () => {
  console.log(`Upload server listening on http://localhost:${port}`)
  if (!fs.existsSync(distDir)) {
    console.warn('Warning: dist folder not found. Root URL will 404 until frontend is built.')
  }
})
