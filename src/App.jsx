import { useEffect, useMemo, useRef, useState } from 'react'
import { initAuth, signIn, signOut, listPdfs, getPdfObjectUrl, uploadPdf } from './services/googleDrive'
import './App.css'

function App() {
  const [fontSize, setFontSize] = useState(18)
  const [lineHeight, setLineHeight] = useState(1.8)
  const [margin, setMargin] = useState(16)
  const [dark, setDark] = useState(false)
  const [text, setText] = useState(null)
  const [page, setPage] = useState(0)
  const [authed, setAuthed] = useState(false)
  const [files, setFiles] = useState([])
  const [currentUrl, setCurrentUrl] = useState(null)
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const containerRef = useRef(null)

  // Demo content (replace with file import/loader later)
  // Initialize GIS script early
  useEffect(() => { initAuth().catch(() => {}) }, [])

  // Demo fallback text if no PDF selected
  useEffect(() => {
    const sample = `Chapter 1\n\n` +
      `Welcome to Book Reader. Sign in with Google to access your Drive folder \n` +
      `Book_Reader and choose a PDF. You can also upload a PDF to that folder.\n\n`;
    setText(sample.repeat(8))
  }, [])

  const pages = useMemo(() => {
    if (!text) return []
    // Simple pagination by characters for demo; a real app should paginate by layout measurements.
    const approxCharsPerPage = Math.max(500, Math.floor((fontSize * 45) * (lineHeight)))
    const chunks = []
    for (let i = 0; i < text.length; i += approxCharsPerPage) {
      chunks.push(text.slice(i, i + approxCharsPerPage))
    }
    return chunks
  }, [text, fontSize, lineHeight])

  const next = () => setPage((p) => Math.min(p + 1, Math.max(0, pages.length - 1)))
  const prev = () => setPage((p) => Math.max(0, p - 1))

  useEffect(() => {
    const onKey = (e) => {
      if (e.key === 'ArrowRight') next()
      if (e.key === 'ArrowLeft') prev()
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [pages.length])

  const themeClasses = dark ? 'bg-neutral-900 text-neutral-100' : 'bg-white text-neutral-900'

  return (
    <div className={`min-h-screen ${themeClasses} flex flex-col`}> 
      {/* Top bar */}
      <header className="sticky top-0 z-30 backdrop-blur supports-[backdrop-filter]:bg-white/60 border-b border-neutral-200 dark:supports-[backdrop-filter]:bg-neutral-900/60 dark:border-neutral-800">
        <div className="mx-auto max-w-6xl px-3 sm:px-4 lg:px-6 py-2 flex items-center gap-3">
          <button onClick={() => setSidebarOpen((s) => !s)} aria-label="Toggle library"
            className="md:hidden inline-flex items-center justify-center w-9 h-9 rounded-md border border-neutral-300 dark:border-neutral-700 hover:bg-neutral-50 dark:hover:bg-neutral-800">
            ☰
          </button>
          <h1 className="text-base sm:text-lg font-semibold">Book Reader</h1>
          <div className="ml-auto flex items-center gap-2 sm:gap-3">
            {!authed ? (
              <button onClick={async () => { try { await signIn(); setAuthed(true); const list = await listPdfs(); setFiles(list) } catch (e) { console.error(e) } }}
                className="px-3 py-1.5 rounded-md text-sm border border-neutral-300 dark:border-neutral-700 hover:bg-neutral-50 dark:hover:bg-neutral-800">
                Sign in
              </button>
            ) : (
              <>
                <button onClick={async () => { const list = await listPdfs(); setFiles(list) }}
                  className="px-3 py-1.5 rounded-md text-sm border border-neutral-300 dark:border-neutral-700 hover:bg-neutral-50 dark:hover:bg-neutral-800">
                  Refresh
                </button>
                <button onClick={async () => { await signOut(); setAuthed(false); setFiles([]); setCurrentUrl(null) }}
                  className="px-3 py-1.5 rounded-md text-sm border border-neutral-300 dark:border-neutral-700 hover:bg-neutral-50 dark:hover:bg-neutral-800">
                  Sign out
                </button>
              </>
            )}
            <button onClick={() => setDark((d) => !d)}
              className="px-3 py-1.5 rounded-md text-sm border border-neutral-300 dark:border-neutral-700 hover:bg-neutral-50 dark:hover:bg-neutral-800">
              {dark ? 'Light' : 'Dark'}
            </button>
            <select value={fontSize} onChange={(e) => setFontSize(Number(e.target.value))}
              className="px-2 py-1.5 rounded-md text-sm border border-neutral-300 dark:border-neutral-700 bg-transparent">
              {[16,18,20,22,24].map(sz => <option key={sz} value={sz}>{sz}px</option>)}
            </select>
            <select value={lineHeight} onChange={(e) => setLineHeight(Number(e.target.value))}
              className="px-2 py-1.5 rounded-md text-sm border border-neutral-300 dark:border-neutral-700 bg-transparent">
              {[1.6,1.8,2.0].map(lh => <option key={lh} value={lh}>{lh}x</option>)}
            </select>
            <select value={margin} onChange={(e) => setMargin(Number(e.target.value))}
              className="px-2 py-1.5 rounded-md text-sm border border-neutral-300 dark:border-neutral-700 bg-transparent">
              {[12,16,20,24].map(m => <option key={m} value={m}>{m}px</option>)}
            </select>
          </div>
        </div>
      </header>

      {/* Reader area */}
      <main className="mx-auto w-full max-w-6xl flex-1 px-0 sm:px-4 lg:px-6 py-0 sm:py-4">
        <div className="flex min-h-[calc(100vh-7rem)]">
          {/* Sidebar */}
          <aside className={`fixed inset-y-0 left-0 z-40 w-72 transform bg-white dark:bg-neutral-900 border-r border-neutral-200 dark:border-neutral-800 p-3 transition-transform duration-200 ease-out md:relative md:translate-x-0 md:w-64 ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'}`}>
            <div className="flex items-center justify-between mb-2">
              <div className="font-semibold">Library</div>
              <button onClick={() => setSidebarOpen(false)} className="md:hidden px-2 py-1 rounded border text-sm">Close</button>
            </div>
            {!authed ? (
              <p className="text-sm text-neutral-600 dark:text-neutral-400">Sign in to access your Drive.</p>
            ) : (
              <>
                <div className="mb-2 flex items-center gap-2">
                  <label className="inline-flex items-center px-2 py-1 rounded border cursor-pointer text-sm">
                    Upload
                    <input type="file" accept="application/pdf" className="hidden" onChange={async (e) => {
                      const f = e.target.files?.[0]
                      if (f) {
                        try { await uploadPdf(f); const list = await listPdfs(); setFiles(list) } catch (err) { console.error(err) }
                      }
                    }} />
                  </label>
                  <button onClick={async () => { const list = await listPdfs(); setFiles(list) }} className="px-2 py-1 rounded border text-sm">Refresh</button>
                </div>
                <div className="overflow-y-auto pr-1" style={{ maxHeight: 'calc(100vh - 11rem)' }}>
                  {files.length === 0 ? (
                    <p className="text-sm text-neutral-500">No PDFs in Book_Reader</p>
                  ) : (
                    <ul className="space-y-1">
                      {files.map(f => (
                        <li key={f.id}>
                          <button
                            onClick={async () => { const url = await getPdfObjectUrl(f.id); setCurrentUrl(url); setSidebarOpen(false) }}
                            className="w-full text-left px-2 py-2 rounded hover:bg-neutral-50 dark:hover:bg-neutral-800 border border-transparent hover:border-neutral-200 dark:hover:border-neutral-700 text-sm truncate">
                            {f.name}
                          </button>
                        </li>
                      ))}
                    </ul>
                  )}
                </div>
              </>
            )}
          </aside>

          {/* Content area */}
          <section className="flex-1 min-w-0 md:ml-0 ml-0 md:pl-6 md:pr-0 p-3 sm:p-4 md:p-6 md:pl-6 md:ml-64">
            <div className="md:hidden sticky top-12 z-20 px-3 py-2">
              <button onClick={() => setSidebarOpen(true)} className="px-3 py-1.5 rounded border text-sm">Open Library</button>
            </div>
        {/* Single-column on phones; centered content with comfortable measure */}
            {currentUrl ? (
              <div className="w-full h-[70vh] sm:h-[78vh] border rounded-lg overflow-hidden">
                <iframe title="PDF Viewer" src={currentUrl} className="w-full h-full" />
              </div>
            ) : (
              <article
                ref={containerRef}
                className="max-w-none selection:bg-indigo-200/60 selection:text-indigo-900"
                style={{ fontSize: `${fontSize}px`, lineHeight: lineHeight, padding: `${margin}px` }}
              >
                <h2 className="text-xl sm:text-2xl mb-2">Chapter {page + 1}</h2>
                <p className="whitespace-pre-wrap">{pages[page] || ''}</p>
              </article>
            )}
          </section>
        </div>
      </main>

      {/* Bottom controls, mobile friendly */}
      <footer className="sticky bottom-0 z-20 border-t border-neutral-200 dark:border-neutral-800 bg-white/80 dark:bg-neutral-900/80 backdrop-blur">
        <div className="mx-auto max-w-4xl px-3 sm:px-4 lg:px-6 py-2 flex items-center gap-3">
          <button onClick={prev} disabled={page === 0}
            className="px-3 py-2 rounded-md border border-neutral-300 dark:border-neutral-700 disabled:opacity-40">
            Prev
          </button>
          <div className="text-sm text-neutral-600 dark:text-neutral-400">
            Page {Math.min(page + 1, Math.max(1, pages.length))} / {Math.max(1, pages.length)}
          </div>
          <button onClick={next} disabled={page >= pages.length - 1}
            className="ml-auto px-3 py-2 rounded-md border border-neutral-300 dark:border-neutral-700 disabled:opacity-40">
            Next
          </button>
        </div>
      </footer>
    </div>
  )
}

export default App
