/**
 * 역할별 테마 객체 선택 — ThemeProvider·단위 테스트 SSOT
 *
 * @author MindGarden
 * @since 2026-05-18
 */
import type { AppTheme } from './client-theme';
import { clientTheme } from './client-theme';
import { consultantTheme } from './consultant-theme';
import { adminTheme } from './admin-theme';
export type ThemeProviderRole = 'client' | 'consultant' | 'admin' | 'staff';

export function resolveThemeForRole(role: ThemeProviderRole): AppTheme {
  if (role === 'admin' || role === 'staff') {
    return adminTheme;
  }
  if (role === 'consultant') {
    return consultantTheme;
  }
  return clientTheme;
}
