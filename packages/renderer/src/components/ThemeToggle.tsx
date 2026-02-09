import { Label, Switch } from '@heroui/react'
import useThemePreference from '../hooks/useThemePreference'

const ThemeToggle = () => {
  const { isDark, setDark, setLight } = useThemePreference()

  return (
    <Switch
      size="sm"
      isSelected={isDark}
      onChange={(selected) => (selected ? setDark() : setLight())}
      aria-label="切换明暗主题"
      className="gap-2"
    >
      <Switch.Control>
        <Switch.Thumb />
      </Switch.Control>
      <Label className="text-[10px] uppercase tracking-[0.2em] text-[var(--ink-soft)]">
        {isDark ? '暗色' : '浅色'}
      </Label>
    </Switch>
  )
}

export default ThemeToggle
