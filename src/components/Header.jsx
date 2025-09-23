import React from 'react'

export default function Header({
  theme,
  setTheme,
  themes,
  onUploadClick,
  onRefresh,
  showInstall,
  onInstall,
}) {
  return (
    <div className="navbar bg-base-100 sticky top-0 z-30 border-b px-2 sm:px-4 lg:px-8">
      <div className="navbar-start gap-2">
        <label htmlFor="app-drawer" aria-label="toggle sidebar" className="btn btn-ghost btn-square">
          ☰
        </label>
        <a className="btn btn-ghost text-xl">Book Reader</a>
      </div>
      <div className="navbar-end gap-2 pr-2">
        <div className="dropdown dropdown-end tooltip tooltip-bottom" data-tip="Theme">
          <label tabIndex={0} className="btn btn-ghost gap-2" aria-label="Select theme">
            <span>🎨</span>
            <span className="capitalize">{theme}</span>
            <span>▾</span>
          </label>
          <ul tabIndex={0} className="dropdown-content menu bg-base-100 rounded-box z-10 w-44 p-2 shadow">
            {themes.map((t) => (
              <li key={t}>
                <a
                  className={`capitalize ${t === theme ? 'active' : ''}`}
                  onClick={(e) => {
                    setTheme(t)
                    // Close dropdown after selection
                    if (document.activeElement && document.activeElement instanceof HTMLElement) {
                      document.activeElement.blur()
                    }
                  }}
                >{t}</a>
              </li>
            ))}
          </ul>
        </div>
        {showInstall && (
          <div className="tooltip tooltip-bottom" data-tip="Install app">
            <button className="btn btn-outline" onClick={onInstall}>Install</button>
          </div>
        )}
        <div className="tooltip tooltip-bottom" data-tip="Upload PDF">
          <button className="btn btn-primary" onClick={onUploadClick}>Upload</button>
        </div>
        <div className="tooltip tooltip-bottom" data-tip="Refresh library">
      <button className="btn btn-outline" onClick={onRefresh}>Refresh</button>
        </div>
      </div>
    </div>
  )
}
