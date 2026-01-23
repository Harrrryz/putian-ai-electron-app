import { ThemeProps, useTheme } from '@heroui/use-theme'
import { useEffect, useMemo, useState } from 'react'

const THEME_PREFERENCE_KEY = 'app-theme-preference'
const MEDIA_QUERY = '(prefers-color-scheme: dark)'

type ThemePreference = 'light' | 'dark' | 'system'

const getStoredPreference = (): ThemePreference => {
  if (typeof window === 'undefined') {
    return ThemeProps.SYSTEM
  }

  const stored = localStorage.getItem(THEME_PREFERENCE_KEY)

  if (
    stored === ThemeProps.LIGHT ||
    stored === ThemeProps.DARK ||
    stored === ThemeProps.SYSTEM
  ) {
    return stored
  }

  return ThemeProps.SYSTEM
}

const getSystemTheme = () =>
  window.matchMedia(MEDIA_QUERY).matches ? ThemeProps.DARK : ThemeProps.LIGHT

const useThemePreference = () => {
  const [preference, setPreference] = useState<ThemePreference>(() =>
    getStoredPreference(),
  )
  const { theme, setTheme } = useTheme(
    preference === ThemeProps.SYSTEM ? ThemeProps.SYSTEM : preference,
  )

  useEffect(() => {
    if (typeof window === 'undefined') {
      return
    }

    localStorage.setItem(THEME_PREFERENCE_KEY, preference)
  }, [preference])

  useEffect(() => {
    if (preference === ThemeProps.SYSTEM) {
      setTheme(ThemeProps.SYSTEM)
      return
    }

    setTheme(preference)
  }, [preference, setTheme])

  const resolvedTheme = useMemo(() => {
    if (theme === ThemeProps.SYSTEM) {
      if (typeof window === 'undefined') {
        return ThemeProps.LIGHT
      }

      return getSystemTheme()
    }

    return theme
  }, [theme])

  const isDark = resolvedTheme === ThemeProps.DARK

  const setLight = () => setPreference(ThemeProps.LIGHT)
  const setDark = () => setPreference(ThemeProps.DARK)
  const toggle = () => setPreference(isDark ? ThemeProps.LIGHT : ThemeProps.DARK)

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
