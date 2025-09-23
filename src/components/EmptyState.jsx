import React from 'react'

export default function EmptyState({ onRefresh, onUploadClick }) {
  return (
    <div className="card bg-base-100 shadow h-[65vh] sm:h-[70vh]">
      <div className="card-body items-center justify-center text-center gap-3">
        <h2 className="card-title">No books yet</h2>
        <p className="opacity-70">Add PDF files to your GitHub repo folder and click refresh to load them here.</p>
        <div className="card-actions justify-center mt-2">
          {onUploadClick && (
            <button className="btn btn-primary" onClick={onUploadClick}>Upload PDF</button>
          )}
          <button className="btn" onClick={onRefresh}>Refresh</button>
        </div>
      </div>
    </div>
  )
}
