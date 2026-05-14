/**
 * 테마 공급자 — role에 따라 client/consultant 테마 주입
 *
 * @author MindGarden
 * @since 2026-05-12
 *
 * @example
 * <ThemeProvider role="client">
 *   <App />
 * </ThemeProvider>
 *
 * // 컴포넌트 내부
 * const theme = useTheme();
 * <View style={{ backgroundColor: theme.colors.bgMain }} />
 */
import React, { createContext, useContext, useMemo } from 'react';
import type { AppTheme } from './client-theme';
import { clientTheme } from './client-theme';
import { consultantTheme } from './consultant-theme';

const ThemeContext = createContext<AppTheme>(clientTheme);

export function useTheme(): AppTheme {
  return useContext(ThemeContext);
}

interface ThemeProviderProps {
  role: 'client' | 'consultant';
  children: React.ReactNode;
}

export function ThemeProvider({ role, children }: ThemeProviderProps) {
  const theme = useMemo(() => (role === 'consultant' ? consultantTheme : clientTheme), [role]);

  return <ThemeContext.Provider value={theme}>{children}</ThemeContext.Provider>;
}
