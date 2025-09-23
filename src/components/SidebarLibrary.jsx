import React from 'react'

export default function SidebarLibrary({
  files,
  loading,
  filter,
  setFilter,
  selectedId,
  onSelect,
}) {
  return (
    <div className="h-full flex flex-col gap-3">
      <div className="flex items-center justify-between">
        <div className="font-semibold">Library</div>
        <div className="badge badge-ghost">{files.length}</div>
      </div>
      <div>
        <label className="form-control">
          <input type="text" placeholder="Search..." className="input input-bordered input-sm w-full" value={filter} onChange={(e) => setFilter(e.target.value)} />
        </label>
      </div>
      <div className="overflow-y-auto pr-1" style={{ maxHeight: 'calc(100vh - 11rem)' }}>
        {loading ? (
          <ul className="menu w-full">
            {Array.from({ length: 6 }).map((_, i) => (
              <li key={i}>
                <div className="flex items-center gap-2">
                  <div className="skeleton h-4 w-8"></div>
                  <div className="skeleton h-4 w-40"></div>
                </div>
              </li>
            ))}
          </ul>
        ) : files.length === 0 ? (
          <p className="text-sm opacity-60">No PDFs found in the configured repo path</p>
        ) : (
          <ul className="menu bg-base-100 rounded-box w-full">
            {files
              .filter(f => f.name.toLowerCase().includes(filter.toLowerCase()))
              .map(f => (
                <li key={f.id}>
                  <a className={`${selectedId === f.id ? 'active' : ''}`} onClick={() => onSelect(f)}>{f.name}</a>
                </li>
              ))}
          </ul>
        )}
      </div>
    </div>
  )
}
