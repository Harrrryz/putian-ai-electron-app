import { Switch } from '@heroui/react'
import useThemePreference from '../hooks/useThemePreference'

const ThemeToggle = () => {
  const { isDark, setDark, setLight } = useThemePreference()

  return (
    <Switch
      size="sm"
      color="success"
      isSelected={isDark}
      onValueChange={(selected) => (selected ? setDark() : setLight())}
      aria-label="切换明暗主题"
      classNames={{
        base: 'gap-2',
        label: 'text-[10px] uppercase tracking-[0.2em] text-[var(--ink-soft)]',
      }}
    >
      {isDark ? '暗色' : '浅色'}
    </Switch>
  )
}

export default ThemeToggle
