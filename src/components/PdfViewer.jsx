import React from 'react'

export default function PdfViewer({ url }) {
  return (
    <div className="w-full card bg-base-100 shadow">
      <div className="card-body p-0">
        <iframe title="PDF Viewer" src={url} className="w-full h-[65vh] sm:h-[70vh]" />
      </div>
    </div>
  )
}
