// Single source for colours used outside Tailwind classes (charts, inline styles).
export const colors = {
  primary: '#0F766E',
  primaryLight: '#14B8A6',
  accent: '#F59E0B',
  background: '#F8FAFC',
  card: '#FFFFFF',
  border: '#E2E8F0',
  text: '#0F172A',
  muted: '#64748B',
  danger: '#DC2626',
  success: '#16A34A',
}

// Order matters: budget categories are always drawn in this sequence.
export const chartColors = [colors.primary, colors.primaryLight, colors.accent, '#8B5CF6', '#0EA5E9']
