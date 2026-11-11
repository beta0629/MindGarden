/**
 * API 환경(개발 Metro / 개발 서버 / 운영) 상단 띠 — 레이아웃 플로우에서 Stack 을 아래로 민다.
 * `pointerEvents="none"` 으로 하단 화면 터치를 가리지 않음.
 * 절대 오버레이가 아니며, `ApiEnvironmentChrome` 이 top inset 을 소비한 뒤 하위에 top:0 을 넘긴다.
 */
import { StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useMemo } from 'react';
import { useTheme } from '@/theme';
import type { AppTheme } from '@/theme/client-theme';
import {
  getApiDeploymentUi,
  shouldShowApiEnvironmentBanner,
  type ApiDeploymentKind,
} from '@/config/apiEnvironment';

function bannerPalette(theme: AppTheme, kind: ApiDeploymentKind): { bg: string; fg: string } {
  switch (kind) {
    case 'prod':
      return { bg: theme.colors.gray[700], fg: theme.colors.textOnPrimary };
    case 'dev-metro':
      return { bg: theme.colors.primaryDark, fg: theme.colors.textOnPrimary };
    case 'dev-api':
      return { bg: theme.colors.warning, fg: theme.colors.textMain };
    default: {
      const _exhaustive: never = kind;
      return _exhaustive;
    }
  }
}

export function ApiEnvironmentBanner() {
  const theme = useTheme();
  const insets = useSafeAreaInsets();
  const ui = useMemo(() => getApiDeploymentUi(), []);
  const show = useMemo(() => shouldShowApiEnvironmentBanner(), []);

  if (!show) {
    return null;
  }

  const { bg, fg } = bannerPalette(theme, ui.kind);
  const line = `${ui.headline} · ${ui.detail}`;

  return (
    <View
      pointerEvents="none"
      style={[
        styles.wrap,
        {
          backgroundColor: bg,
          paddingTop: insets.top + theme.spacing.xs,
          paddingBottom: theme.spacing.xs,
          paddingHorizontal: theme.spacing.md,
        },
      ]}
      accessibilityRole="header"
      accessibilityLabel={line}
    >
      <Text
        style={[
          styles.line,
          {
            color: fg,
            fontFamily: theme.fontFamily.semibold,
            fontSize: theme.fontSize['2xs'],
          },
        ]}
        numberOfLines={1}
      >
        {line}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    alignSelf: 'stretch',
    alignItems: 'center',
  },
  line: {
    textAlign: 'center',
  },
});
