import { useEffect, useState } from 'react'

export function usePwaInstall() {
  const [installPrompt, setInstallPrompt] = useState(null)
  const [installed, setInstalled] = useState(false)

  useEffect(() => {
    const onBip = (e) => {
      e.preventDefault()
      setInstallPrompt(e)
    }
    const onInstalled = () => setInstalled(true)
    window.addEventListener('beforeinstallprompt', onBip)
    window.addEventListener('appinstalled', onInstalled)
    return () => {
      window.removeEventListener('beforeinstallprompt', onBip)
      window.removeEventListener('appinstalled', onInstalled)
    }
  }, [])

  const promptInstall = async () => {
    if (!installPrompt) return
    try {
      const ev = installPrompt
      setInstallPrompt(null)
      await ev.prompt?.()
    } catch (err) {
      console.error('install prompt error', err)
    }
  }

  return { installPrompt, installed, promptInstall }
}
