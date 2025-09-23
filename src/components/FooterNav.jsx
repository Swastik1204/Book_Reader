import React from 'react'

export default function FooterNav({ page, pagesCount, onPrev, onNext }) {
  return (
    <footer className="sticky bottom-0 z-20 border-t border-neutral-200 dark:border-neutral-800 bg-white/80 dark:bg-neutral-900/80 backdrop-blur">
      <div className="mx-auto w-full max-w-screen-md px-3 sm:px-4 lg:px-6 py-2 flex items-center gap-3">
        <button onClick={onPrev} disabled={page === 0}
          className="px-3 py-2 rounded-md border border-neutral-300 dark:border-neutral-700 disabled:opacity-40 hover:bg-neutral-100 dark:hover:bg-neutral-800">
          Prev
        </button>
        <div className="text-sm text-neutral-600 dark:text-neutral-400">
          Page {Math.min(page + 1, Math.max(1, pagesCount))} / {Math.max(1, pagesCount)}
        </div>
        <button onClick={onNext} disabled={page >= pagesCount - 1}
          className="ml-auto px-3 py-2 rounded-md border border-neutral-300 dark:border-neutral-700 disabled:opacity-40 hover:bg-neutral-100 dark:hover:bg-neutral-800">
          Next
        </button>
      </div>
    </footer>
  )
}
