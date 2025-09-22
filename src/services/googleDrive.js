// Google Drive integration using Google Identity Services (GIS) and plain fetch to Drive REST API
// Env: VITE_GOOGLE_CLIENT_ID is required

const CLIENT_ID = import.meta.env.VITE_GOOGLE_CLIENT_ID
const DRIVE_API_BASE = 'https://www.googleapis.com/drive/v3'
const UPLOAD_API_BASE = 'https://www.googleapis.com/upload/drive/v3'
const FOLDER_NAME = 'Book_Reader'

let tokenClient = null
let accessToken = null

function loadScript(src) {
  return new Promise((resolve, reject) => {
    const s = document.createElement('script')
    s.src = src
    s.async = true
    s.onload = () => resolve()
    s.onerror = (e) => reject(e)
    document.head.appendChild(s)
  })
}

export async function initAuth() {
  if (!CLIENT_ID) throw new Error('Missing VITE_GOOGLE_CLIENT_ID')
  if (!window.google || !window.google.accounts || !window.google.accounts.oauth2) {
    await loadScript('https://accounts.google.com/gsi/client')
  }
  if (!tokenClient) {
    tokenClient = window.google.accounts.oauth2.initTokenClient({
      client_id: CLIENT_ID,
      scope: '', // provided at request time
      callback: () => {},
    })
  }
}

export async function signIn(scopes = 'https://www.googleapis.com/auth/drive.readonly https://www.googleapis.com/auth/drive.file') {
  await initAuth()
  return new Promise((resolve, reject) => {
    tokenClient.callback = (resp) => {
      if (resp.error) {
        reject(resp)
        return
      }
      accessToken = resp.access_token
      resolve(accessToken)
    }
    tokenClient.requestAccessToken({ prompt: 'consent', scope: scopes })
  })
}

export function getAccessToken() {
  return accessToken
}

export function signOut() {
  return new Promise((resolve) => {
    if (!accessToken) return resolve()
    try {
      window.google.accounts.oauth2.revoke(accessToken, () => {
        accessToken = null
        resolve()
      })
    } catch {
      accessToken = null
      resolve()
    }
  })
}

async function driveFetch(path, params = {}, options = {}) {
  if (!accessToken) throw new Error('Not authenticated')
  const url = new URL(DRIVE_API_BASE + path)
  Object.entries(params).forEach(([k, v]) => {
    if (v !== undefined && v !== null) url.searchParams.set(k, v)
  })
  const res = await fetch(url.toString(), {
    ...options,
    headers: {
      Authorization: `Bearer ${accessToken}`,
      'Content-Type': 'application/json; charset=UTF-8',
      ...(options.headers || {}),
    },
  })
  if (!res.ok) throw new Error(`Drive error ${res.status}`)
  return res.json()
}

async function driveFetchBinary(path, params = {}) {
  if (!accessToken) throw new Error('Not authenticated')
  const url = new URL(DRIVE_API_BASE + path)
  Object.entries(params).forEach(([k, v]) => {
    if (v !== undefined && v !== null) url.searchParams.set(k, v)
  })
  const res = await fetch(url.toString(), {
    headers: { Authorization: `Bearer ${accessToken}` },
  })
  if (!res.ok) throw new Error(`Drive error ${res.status}`)
  return res.blob()
}

export async function findFolder() {
  const q = `name='${FOLDER_NAME}' and mimeType='application/vnd.google-apps.folder' and trashed=false`
  const data = await driveFetch('/files', {
    q,
    fields: 'files(id, name)',
    spaces: 'drive',
    pageSize: 1,
  })
  return data.files?.[0] || null
}

export async function ensureFolder() {
  const existing = await findFolder()
  if (existing) return existing
  const metadata = {
    name: FOLDER_NAME,
    mimeType: 'application/vnd.google-apps.folder',
  }
  const res = await fetch(DRIVE_API_BASE + '/files', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${accessToken}`,
      'Content-Type': 'application/json; charset=UTF-8',
    },
    body: JSON.stringify(metadata),
  })
  if (!res.ok) throw new Error('Failed to create folder')
  return res.json()
}

export async function listPdfs() {
  const folder = await findFolder()
  if (!folder) return []
  const q = `'${folder.id}' in parents and mimeType='application/pdf' and trashed=false`
  const data = await driveFetch('/files', {
    q,
    fields: 'files(id, name, size, modifiedTime)',
    orderBy: 'modifiedTime desc',
    pageSize: 100,
  })
  return data.files || []
}

export async function downloadPdfBlob(fileId) {
  const blob = await driveFetchBinary(`/files/${fileId}`, { alt: 'media' })
  return blob
}

export async function getPdfObjectUrl(fileId) {
  const blob = await downloadPdfBlob(fileId)
  return URL.createObjectURL(blob)
}

export async function uploadPdf(file) {
  const folder = await ensureFolder()
  const boundary = '-------314159265358979323846'
  const delimiter = `\r\n--${boundary}\r\n`
  const closeDelim = `\r\n--${boundary}--`

  const metadata = {
    name: file.name,
    mimeType: 'application/pdf',
    parents: [folder.id],
  }

  const reader = await file.arrayBuffer()
  const base64Data = btoa(String.fromCharCode(...new Uint8Array(reader)))

  const multipartBody =
    delimiter +
    'Content-Type: application/json; charset=UTF-8\r\n\r\n' +
    JSON.stringify(metadata) +
    delimiter +
    'Content-Type: application/pdf\r\n' +
    'Content-Transfer-Encoding: base64\r\n\r\n' +
    base64Data +
    closeDelim

  const res = await fetch(UPLOAD_API_BASE + '/files?uploadType=multipart', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${accessToken}`,
      'Content-Type': `multipart/related; boundary=${boundary}`,
    },
    body: multipartBody,
  })
  if (!res.ok) throw new Error('Upload failed')
  return res.json()
}
