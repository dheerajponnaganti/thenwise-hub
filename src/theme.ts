export type Theme = 'auto' | 'light' | 'dark'
export const THEMES: Theme[] = ['auto', 'light', 'dark']

export function savedTheme(): Theme {
  try {
    const t = localStorage.getItem('hub-theme')
    return t === 'light' || t === 'dark' ? t : 'auto'
  } catch {
    return 'auto'
  }
}

export function applyTheme(t: Theme): void {
  if (t === 'auto') document.documentElement.removeAttribute('data-theme')
  else document.documentElement.setAttribute('data-theme', t)
  try {
    localStorage.setItem('hub-theme', t)
  } catch {
    // Storage can be blocked; the theme then lasts for this visit only.
  }
}
