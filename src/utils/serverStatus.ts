import type { ThemeColors } from '../theme';
import type { ServerStatus } from '../models';

export function getStatusColor(status: ServerStatus, colors: ThemeColors): string {
  switch (status) {
    case 'running': return colors.success;
    case 'off': return colors.textMuted;
    case 'starting':
    case 'stopping': return colors.warning;
    case 'rebuilding':
    case 'migrating': return colors.info;
    default: return colors.textMuted;
  }
}

export function capitalizeFirst(s: string): string {
  return s.charAt(0).toUpperCase() + s.slice(1);
}
