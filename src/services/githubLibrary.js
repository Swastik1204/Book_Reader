// GitHub library helpers: list PDFs and upload via GitHub APIs
// - Listing prefers the Git Trees API (recursive) so PDFs can be anywhere
// - Upload uses the Contents API (requires a Personal Access Token)
// Config via env or localStorage fallbacks

const LS_KEY = 'gh_lib_cfg'
const TOKEN_LS_KEY = 'gh_pat'

function readConfig() {
  const env = {
    owner: import.meta.env.VITE_GH_OWNER,
    repo: import.meta.env.VITE_GH_REPO,
    branch: import.meta.env.VITE_GH_BRANCH || 'main',
    path: import.meta.env.VITE_GH_PATH || 'pdfs',
  }
  let ls = {}
  try { ls = JSON.parse(localStorage.getItem(LS_KEY) || '{}') } catch {}
  const isPlaceholder = (v) => typeof v === 'string' && /your-github-username|your-repo-name/i.test(v)
  const owner = ls.owner || (isPlaceholder(env.owner) ? undefined : env.owner)
  const repo = ls.repo || (isPlaceholder(env.repo) ? undefined : env.repo)
  return {
    owner: owner || 'Swastik1204',
    repo: repo || 'Book_Reader',
    branch: ls.branch || env.branch || 'main',
    path: ls.path || env.path || 'pdfs',
  }
}

export function setGitHubConfig(cfg) {
  const cur = readConfig()
  const next = { ...cur, ...cfg }
  try { localStorage.setItem(LS_KEY, JSON.stringify(next)) } catch {}
}

export function setGitHubToken(token) {
  try {
    if (token) localStorage.setItem(TOKEN_LS_KEY, token)
    else localStorage.removeItem(TOKEN_LS_KEY)
  } catch {}
}

function getGitHubToken() {
  try { return localStorage.getItem(TOKEN_LS_KEY) || '' } catch { return '' }
}

export async function listPdfs() {
  const { owner, repo, branch, path } = readConfig()
  // Public repo: call GitHub APIs directly
  // Use Git Trees API (recursive listing across repo) to avoid multiple 404s
  try {
    const treeUrl = `https://api.github.com/repos/${owner}/${repo}/git/trees/${encodeURIComponent(branch)}?recursive=1`
    const tres = await fetch(treeUrl, { headers: { Accept: 'application/vnd.github.v3+json' } })
    if (tres.ok) {
      const tdata = await tres.json()
      if (Array.isArray(tdata?.tree)) {
        const list = tdata.tree
          .filter(it => it.type === 'blob' && /\.pdf$/i.test(it.path))
          .map(it => ({
            id: it.path,
            path: it.path,
            name: it.path.split('/').pop(),
            url: `https://raw.githubusercontent.com/${owner}/${repo}/${encodeURIComponent(branch)}/${it.path}`,
            size: it.size,
            sha: it.sha,
          }))
        return list
      }
    }
  } catch (e) {
    console.warn('Git trees listing failed, falling back to contents API.', e)
  }

  // Optional fallback to a single explicit contents path if provided.
  const fallbackEnabled = (import.meta.env.VITE_GH_ALLOW_CONTENTS_FALLBACK || '').toString() === 'true'
  if (fallbackEnabled && path) {
    const url = `https://api.github.com/repos/${owner}/${repo}/contents/${encodeURIComponent(path)}?ref=${encodeURIComponent(branch)}`
    const res = await fetch(url, { headers: { Accept: 'application/vnd.github.v3+json' } })
    if (res.ok) {
      const data = await res.json()
      if (Array.isArray(data)) {
        return data
          .filter(it => it.type === 'file' && /\.pdf$/i.test(it.name))
          .map(it => ({
            id: it.path,
            path: it.path,
            name: it.name,
            url: it.download_url,
            size: it.size,
            sha: it.sha,
          }))
      }
    }
  }
  return []
}

export async function getPdfUrl(item) {
  // item.url already points to raw content
  return item.url
}

export async function uploadPdf(file) {
  const token = getGitHubToken()
  if (!token) {
    const err = new Error('MissingGitHubToken')
    err.code = 'MissingGitHubToken'
    throw err
  }
  const { owner, repo, branch, path } = readConfig()
  const name = (file?.name || 'document.pdf').replace(/\s+/g, '_')
  const targetPath = (path ? `${path.replace(/\/$/, '')}/` : '') + name

  // Read file and base64 encode
  const buf = await file.arrayBuffer()
  const b64 = arrayBufferToBase64(buf)

  // Check if file exists to include sha
  let sha
  const checkUrl = `https://api.github.com/repos/${owner}/${repo}/contents/${encodeURIComponent(targetPath)}?ref=${encodeURIComponent(branch)}`
  const checkRes = await fetch(checkUrl, { headers: { Accept: 'application/vnd.github.v3+json', Authorization: `Bearer ${token}` } })
  if (checkRes.ok) {
    const j = await checkRes.json()
    sha = j.sha
  }

  const putUrl = `https://api.github.com/repos/${owner}/${repo}/contents/${encodeURIComponent(targetPath)}`
  const body = {
    message: sha ? `Update ${name}` : `Upload ${name}`,
    content: b64,
    branch,
    ...(sha ? { sha } : {}),
  }
  const putRes = await fetch(putUrl, {
    method: 'PUT',
    headers: {
      Accept: 'application/vnd.github.v3+json',
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(body),
  })
  if (!putRes.ok) {
    const txt = await putRes.text().catch(() => '')
    throw new Error(`GitHub upload failed ${putRes.status}: ${txt}`)
  }
  const result = await putRes.json()
  return {
    path: result.content?.path || targetPath,
    name,
    url: `https://raw.githubusercontent.com/${owner}/${repo}/${encodeURIComponent(branch)}/${targetPath}`,
    sha: result.content?.sha,
  }
}

function arrayBufferToBase64(buffer) {
  let binary = ''
  const bytes = new Uint8Array(buffer)
  const chunkSize = 0x8000
  for (let i = 0; i < bytes.length; i += chunkSize) {
    const chunk = bytes.subarray(i, i + chunkSize)
    binary += String.fromCharCode.apply(null, chunk)
  }
  return btoa(binary)
}
