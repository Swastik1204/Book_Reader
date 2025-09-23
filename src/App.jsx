import { useEffect, useRef, useState } from 'react'
import { listPdfs, getPdfUrl } from './services/githubLibrary'
import Header from './components/Header'
import SidebarLibrary from './components/SidebarLibrary'
import PdfViewer from './components/PdfViewer'
import EmptyState from './components/EmptyState'
import { usePwaInstall } from './hooks/usePwaInstall'
import { useTheme } from './hooks/useTheme'
import Toasts from './components/Toasts'

function App() {
  // Use explicit API base if provided; otherwise in dev default to the local upload server
  const API_BASE = (import.meta.env.VITE_API_BASE && import.meta.env.VITE_API_BASE.trim())
    || (import.meta.env.DEV ? 'http://localhost:8787' : '')
  const { theme, setTheme, themes } = useTheme()
  const [files, setFiles] = useState([])
  const [loading, setLoading] = useState(true)
  const [currentUrl, setCurrentUrl] = useState(null)
  const [selectedId, setSelectedId] = useState(null)
  const [filter, setFilter] = useState('')
  const [uploadPct, setUploadPct] = useState(0)
  const fileInputRef = useRef(null)
  const { installPrompt, installed, promptInstall } = usePwaInstall()
  // No upload when using GitHub repo static files

  // keyboard nav
  useEffect(() => {
    const onKey = (e) => {
      // reserved for future shortcuts
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [])

  // Load library on mount
  useEffect(() => {
    listPdfs()
      .then(setFiles)
      .catch(console.error)
      .finally(() => setLoading(false))
  }, [])

  async function refreshList() {
    setLoading(true)
    try {
      const list = await listPdfs()
      setFiles(list)
      document.dispatchEvent(new CustomEvent('toast', { detail: { message: 'Library refreshed', type: 'info' } }))
    } catch (e) {
      console.error(e)
      document.dispatchEvent(new CustomEvent('toast', { detail: { message: 'Failed to refresh', type: 'error' } }))
    } finally {
      setLoading(false)
    }
  }

  async function onUploadClick() { fileInputRef.current?.click() }

  async function onFileChosen(e) {
    const file = e.target.files?.[0]
    if (!file) return
    try {
      document.dispatchEvent(new CustomEvent('toast', { detail: { message: `Uploading ${file.name}...`, type: 'info' } }))
      setUploadPct(1)
      await uploadWithProgress(file, (pct) => setUploadPct(pct))
      document.dispatchEvent(new CustomEvent('toast', { detail: { message: 'Upload complete', type: 'success' } }))
      await refreshList()
    } catch (err) {
      console.error(err)
      document.dispatchEvent(new CustomEvent('toast', { detail: { message: 'Upload failed', type: 'error' } }))
    } finally {
      e.target.value = ''
      setTimeout(() => setUploadPct(0), 400)
    }
  }

  function uploadWithProgress(file, onProgress) {
    return new Promise((resolve, reject) => {
      const form = new FormData()
      form.append('file', file)
  const xhr = new XMLHttpRequest()
  xhr.open('POST', `${API_BASE}/api/upload`)
      xhr.upload.onprogress = (evt) => {
        if (evt.lengthComputable) {
          const pct = Math.max(1, Math.min(99, Math.round((evt.loaded / evt.total) * 100)))
          onProgress?.(pct)
        }
      }
      xhr.onload = () => {
        if (xhr.status >= 200 && xhr.status < 300) {
          onProgress?.(100)
          resolve()
        } else {
          reject(new Error(`Upload failed ${xhr.status}`))
        }
      }
      xhr.onerror = () => reject(new Error('Network error'))
      xhr.send(form)
    })
  }

  return (
    <div className="min-h-screen flex flex-col bg-base-200 text-base-content">
      <Header
        theme={theme}
        setTheme={setTheme}
        themes={themes}
        onUploadClick={onUploadClick}
        onRefresh={refreshList}
        showInstall={!installed && !!installPrompt}
        onInstall={promptInstall}
      />

      {/* Hidden file input for uploads */}
      <input
        ref={fileInputRef}
        type="file"
        accept="application/pdf"
        className="hidden"
        onChange={onFileChosen}
      />

      <div className="drawer lg:drawer-open flex-1 h-[calc(100vh-3.5rem)]">
        <input id="app-drawer" type="checkbox" className="drawer-toggle lg:checked" />
        <div className="drawer-content">
          <main className="container mx-auto px-2 sm:px-4 lg:px-8 py-2">
            {/* No upload progress when using GitHub */}
            {uploadPct > 0 && (
              <progress className="progress progress-primary w-full" value={uploadPct} max="100"></progress>
            )}
            <section className="min-w-0 p-3 sm:p-4 md:p-6 space-y-3">
              <div className="hidden lg:flex items-center justify-between">
                <h3 className="text-sm opacity-60">Reader</h3>
                <div className="tooltip tooltip-left" data-tip="Files in Library">
                  <div className="badge badge-ghost">{files.length}</div>
                </div>
              </div>
              {currentUrl ? (
                <PdfViewer url={currentUrl} />
              ) : (
                <EmptyState
                  onUploadClick={onUploadClick}
                  onRefresh={refreshList}
                />
              )}
            </section>
          </main>
        </div>
        <div className="drawer-side">
          <label htmlFor="app-drawer" aria-label="close sidebar" className="drawer-overlay"></label>
          <aside className="w-full max-w-xs lg:w-80 bg-base-100 border-r p-3 h-full overflow-y-auto">
            <div className="lg:hidden mb-2">
              <label htmlFor="app-drawer" className="btn btn-ghost btn-sm">Close</label>
            </div>
              <SidebarLibrary
              files={files}
              loading={loading}
              filter={filter}
              setFilter={setFilter}
              selectedId={selectedId}
              onSelect={async (f) => {
                  const url = await getPdfUrl(f)
                setCurrentUrl(url)
                setSelectedId(f.id)
                document.getElementById('app-drawer')?.click() // close on mobile after select
              }}
            />
          </aside>
        </div>
      </div>
      <Toasts />
    </div>
  )
}

export default App
