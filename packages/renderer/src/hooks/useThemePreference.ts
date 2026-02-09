import { useEffect, useMemo, useState } from 'react'

const THEME_PREFERENCE_KEY = 'app-theme-preference'
const MEDIA_QUERY = '(prefers-color-scheme: dark)'

type ThemePreference = 'light' | 'dark' | 'system'

const getStoredPreference = (): ThemePreference => {
  if (typeof window === 'undefined') {
    return 'system'
  }

  const stored = localStorage.getItem(THEME_PREFERENCE_KEY)

  if (stored === 'light' || stored === 'dark' || stored === 'system') {
    return stored
  }

  return 'system'
}

const getSystemTheme = () =>
  window.matchMedia(MEDIA_QUERY).matches ? 'dark' : 'light'

const applyTheme = (resolvedTheme: 'light' | 'dark') => {
  if (typeof document === 'undefined') {
    return
  }

  const root = document.documentElement
  root.classList.toggle('dark', resolvedTheme === 'dark')
  root.dataset.theme = resolvedTheme
  root.dataset.colorScheme = resolvedTheme
}

const useThemePreference = () => {
  const [preference, setPreference] = useState<ThemePreference>(() =>
    getStoredPreference(),
  )
  const [systemTheme, setSystemTheme] = useState<'light' | 'dark'>(() => {
    if (typeof window === 'undefined') {
      return 'light'
    }

    return getSystemTheme()
  })

  useEffect(() => {
    if (typeof window === 'undefined') {
      return
    }

    localStorage.setItem(THEME_PREFERENCE_KEY, preference)
  }, [preference])

  useEffect(() => {
    if (typeof window === 'undefined') {
      return
    }

    const media = window.matchMedia(MEDIA_QUERY)
    const updateSystemTheme = () => {
      setSystemTheme(media.matches ? 'dark' : 'light')
    }

    updateSystemTheme()
    media.addEventListener('change', updateSystemTheme)

    return () => {
      media.removeEventListener('change', updateSystemTheme)
    }
  }, [])

  const resolvedTheme = useMemo(() => {
    return preference === 'system' ? systemTheme : preference
  }, [preference, systemTheme])

  useEffect(() => {
    applyTheme(resolvedTheme)
  }, [resolvedTheme])

  const isDark = resolvedTheme === 'dark'

  const setLight = () => setPreference('light')
  const setDark = () => setPreference('dark')
  const toggle = () => setPreference(isDark ? 'light' : 'dark')

  return {
    preference,
    theme: resolvedTheme,
    isDark,
    setLight,
    setDark,
    toggle,
  }
}

export default useThemePreference
