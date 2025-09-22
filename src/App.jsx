import { useEffect, useMemo, useRef, useState } from 'react'
import './App.css'

function App() {
  const [fontSize, setFontSize] = useState(18)
  const [lineHeight, setLineHeight] = useState(1.8)
  const [margin, setMargin] = useState(16)
  const [dark, setDark] = useState(false)
  const [text, setText] = useState(null)
  const [page, setPage] = useState(0)
  const containerRef = useRef(null)

  // Demo content (replace with file import/loader later)
  useEffect(() => {
    const sample = `Chapter 1\n\n` +
      `It was a bright cold day in April, and the clocks were striking thirteen. ` +
      `Winston Smith, his chin nuzzled into his breast in an effort to escape the vile wind, ` +
      `slipped quickly through the glass doors of Victory Mansions...`;
    setText(sample.repeat(12))
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
      <header className="sticky top-0 z-20 backdrop-blur supports-[backdrop-filter]:bg-white/60 border-b border-neutral-200 dark:supports-[backdrop-filter]:bg-neutral-900/60 dark:border-neutral-800">
        <div className="mx-auto max-w-4xl px-3 sm:px-4 lg:px-6 py-2 flex items-center gap-3">
          <h1 className="text-base sm:text-lg font-semibold">Book Reader</h1>
          <div className="ml-auto flex items-center gap-2 sm:gap-3">
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
      <main className="mx-auto w-full max-w-4xl flex-1 px-3 sm:px-4 lg:px-6 py-2 sm:py-4 grid">
        {/* Single-column on phones; centered content with comfortable measure */}
        <article
          ref={containerRef}
          className="max-w-none selection:bg-indigo-200/60 selection:text-indigo-900"
          style={{
            fontSize: `${fontSize}px`,
            lineHeight: lineHeight,
            padding: `${margin}px`,
          }}
        >
          <h2 className="text-xl sm:text-2xl mb-2">Chapter {page + 1}</h2>
          <p className="whitespace-pre-wrap">
            {pages[page] || ''}
          </p>
        </article>
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
