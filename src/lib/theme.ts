export type AppearanceMode = 'light' | 'dark' | 'system';

export function getStoredAppearanceMode(): AppearanceMode {
  const savedSettings = localStorage.getItem('traininglog_theme');
  if (savedSettings) {
    try {
      const parsed = JSON.parse(savedSettings);
      if (parsed.appearanceMode) {
        return parsed.appearanceMode as AppearanceMode;
      }
    } catch (e) {
      // ignore
    }
  }
  return 'light';
}

export function resolveAppearanceMode(mode: AppearanceMode): 'light' | 'dark' {
  if (mode === 'system') {
    return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
  }
  return mode;
}

export function applyAppearanceMode(mode: AppearanceMode) {
  const resolved = resolveAppearanceMode(mode);
  const root = window.document.documentElement;
  
  if (resolved === 'dark') {
    root.classList.add('dark');
  } else {
    root.classList.remove('dark');
  }
}

export function initializeTheme() {
  const currentMode = getStoredAppearanceMode();
  applyAppearanceMode(currentMode);

  window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', () => {
    if (getStoredAppearanceMode() === 'system') {
      applyAppearanceMode('system');
    }
  });
}
