import { useMemo } from 'react';
import { Platform, StyleSheet } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import type { AppTheme } from '@/theme/client-theme';

/**
 * Android 제스처/3버튼 내비게이션 바와 겹치지 않도록 하단 인셋을 탭 바에 반영한다.
 * iOS 홈 인디케이터 영역도 동일 규칙으로 처리한다.
 */
export function useBottomTabNavigatorOptions(theme: AppTheme) {
  const insets = useSafeAreaInsets();

  return useMemo(() => {
    const paddingTop = 8;
    const contentMin = 48;
    const bottomPad =
      Platform.OS === 'android'
        ? Math.max(insets.bottom, 12) + 6
        : Math.max(insets.bottom, 20);
    const height = paddingTop + contentMin + bottomPad;

    return {
      headerShown: false,
      /** Clinic-OS: 선택=ink weight 감 · primary(teal)도 허용 — inactive=mute */
      tabBarActiveTintColor: theme.colors.textMain,
      tabBarInactiveTintColor: theme.colors.mute ?? theme.colors.gray[400],
      tabBarStyle: {
        /** inset-bottom ON the bar — FAB·바 위 빈 띠 금지 */
        backgroundColor: theme.colors.surface,
        borderTopColor: theme.colors.lineWarm ?? theme.colors.border,
        borderTopWidth: StyleSheet.hairlineWidth,
        height,
        paddingTop,
        paddingBottom: bottomPad,
      },
      tabBarLabelStyle: {
        fontFamily: theme.fontFamily.medium,
        fontSize: theme.fontSize.xs,
      },
    };
  }, [theme, insets.bottom]);
}
