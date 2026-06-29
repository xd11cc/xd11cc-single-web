import { CacheKey } from '@@/constants/cache-key'

type Theme = 'light' | 'dark'

const STORAGE_KEY = CacheKey.THEME
const MEDIA_QUERY = '(prefers-color-scheme: dark)'

function getSystemTheme(): Theme {
  return window.matchMedia(MEDIA_QUERY).matches ? 'dark' : 'light'
}

function getStoredTheme(): Theme | null {
  const stored = localStorage.getItem(STORAGE_KEY)
  if (stored === 'light' || stored === 'dark') return stored
  return null
}

function applyTheme(theme: Theme) {
  document.documentElement.dataset.theme = theme
}

const theme = ref<Theme>(getStoredTheme() || getSystemTheme())

applyTheme(theme.value)

const isDark = computed(() => theme.value === 'dark')

function toggleTheme(event?: MouseEvent) {
  const newTheme: Theme = theme.value === 'dark' ? 'light' : 'dark'

  // 尝试使用 View Transition API 实现圆形扩散
  if (event && (document as any).startViewTransition) {
    const x = event.clientX
    const y = event.clientY
    const endRadius = Math.hypot(
      Math.max(x, window.innerWidth - x),
      Math.max(y, window.innerHeight - y),
    )

    const transition = (document as any).startViewTransition(() => {
      theme.value = newTheme
      applyTheme(newTheme)
      localStorage.setItem(STORAGE_KEY, newTheme)
    })

    transition.ready.then(() => {
      document.documentElement.animate(
        {
          clipPath: [
            `circle(0px at ${x}px ${y}px)`,
            `circle(${endRadius}px at ${x}px ${y}px)`,
          ],
        },
        {
          duration: 800,
          easing: 'cubic-bezier(0.4, 0, 0.2, 1)',
          pseudoElement: '::view-transition-new(root)',
        },
      )
    })
  } else {
    theme.value = newTheme
  }
}

function setTheme(value: Theme) {
  theme.value = value
}

watch(theme, (val) => {
  applyTheme(val)
  localStorage.setItem(STORAGE_KEY, val)
})

export function useTheme() {
  return { theme, isDark, toggleTheme, setTheme }
}
