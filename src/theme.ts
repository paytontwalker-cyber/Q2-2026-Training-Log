export type ThemeMode = 'light' | 'dark';

export interface ThemeSecondaryOption {
  label: string;
  value: string;
}

export interface ThemePreset {
  name: string;
  primary: string;
  primaryLight: string;
  secondaryOptions: ThemeSecondaryOption[];
}

export const THEME_PRESETS: ThemePreset[] = [
  {
    name: 'Default Red',
    primary: '#800000',
    primaryLight: '#a52a2a',
    secondaryOptions: [
      { label: 'Gold', value: '#D4AF37' },
      { label: 'Yellow', value: '#f1c40f' },
      { label: 'Cream', value: '#fef3c7' },
    ],
  },
  {
    name: 'Blue',
    primary: '#2563eb',
    primaryLight: '#3b82f6',
    secondaryOptions: [
      { label: 'Slate', value: '#64748b' },
      { label: 'Cyan', value: '#06b6d4' },
      { label: 'Light Blue', value: '#93c5fd' },
    ],
  },
  {
    name: 'Forest Green',
    primary: '#15803d',
    primaryLight: '#22c55e',
    secondaryOptions: [
      { label: 'Olive', value: '#65a30d' },
      { label: 'Slate', value: '#475569' },
      { label: 'Teal', value: '#2dd4bf' },
    ],
  },
  {
    name: 'Crimson',
    primary: '#dc2626',
    primaryLight: '#ef4444',
    secondaryOptions: [
      { label: 'Rose', value: '#e11d48' },
      { label: 'Slate', value: '#475569' },
      { label: 'Amber', value: '#f59e0b' },
    ],
  },
  {
    name: 'Purple',
    primary: '#7c3aed',
    primaryLight: '#a78bfa',
    secondaryOptions: [
      { label: 'Fuchsia', value: '#c026d3' },
      { label: 'Slate', value: '#475569' },
      { label: 'Violet', value: '#a855f7' },
    ],
  },
  {
    name: 'Slate',
    primary: '#334155',
    primaryLight: '#64748b',
    secondaryOptions: [
      { label: 'Light Slate', value: '#94a3b8' },
      { label: 'Dark Slate', value: '#1e293b' },
      { label: 'Blue Gray', value: '#64748b' },
    ],
  },
];
