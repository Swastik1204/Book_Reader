import { useEffect, useState } from 'react'

export default function Toasts() {
  const [toasts, setToasts] = useState([])

  useEffect(() => {
    const onToast = (e) => {
      const { message, type = 'info', timeout = 2500 } = e.detail || {}
      const id = Math.random().toString(36).slice(2)
      setToasts((t) => [...t, { id, message, type }])
      setTimeout(() => setToasts((t) => t.filter((x) => x.id !== id)), timeout)
    }
    document.addEventListener('toast', onToast)
    return () => document.removeEventListener('toast', onToast)
  }, [])

  if (toasts.length === 0) return null

  return (
    <div className="toast toast-top toast-end z-50">
      {toasts.map(t => (
        <div key={t.id} className={`alert ${t.type === 'error' ? 'alert-error' : t.type === 'success' ? 'alert-success' : 'alert-info'}`}>
          <span>{t.message}</span>
        </div>
      ))}
    </div>
  )
}
