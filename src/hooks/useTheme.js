import { useEffect, useState, useCallback } from 'react'

const THEME_KEY = 'br_theme'
const THEMES = ['retro', 'night', 'cupcake']

function getInitialTheme() {
  try {
    const saved = localStorage.getItem(THEME_KEY)
    if (saved && THEMES.includes(saved)) return saved
  } catch {}
  const current = document.documentElement.getAttribute('data-theme')
  if (current && THEMES.includes(current)) return current
  return 'retro'
}

function updateThemeMetaColor() {
  try {
    const meta = document.querySelector('meta[name="theme-color"]')
    if (!meta) return
    // daisyUI exposes --b1 for base background color
    const cs = getComputedStyle(document.documentElement)
    const b1 = cs.getPropertyValue('--b1').trim()
    if (b1) meta.setAttribute('content', b1)
  } catch {}
}

export function useTheme() {
  const [theme, setThemeState] = useState(getInitialTheme)

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme)
    try { localStorage.setItem(THEME_KEY, theme) } catch {}
    // Update the browser UI color to match the theme
    updateThemeMetaColor()
  }, [theme])

  const setTheme = useCallback((t) => {
    if (THEMES.includes(t)) setThemeState(t)
  }, [])

  return { theme, setTheme, themes: THEMES }
}
