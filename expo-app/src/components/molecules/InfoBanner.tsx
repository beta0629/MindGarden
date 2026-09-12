/**
 * Apple G1.2 UGC (P2-C) — 24h 검토 안내 InfoBanner.
 *
 * <p>디자이너 시안 §B.4.1 InfoBanner molecule — 신고 시트·차단 목록 등 24h SLA 안내에서 재사용.
 * `bgSub` 배경 + 좌측 primary 4px 악센트 + Info 아이콘 + 본문 텍스트.</p>
 *
 * @author MindGarden
 * @since 2026-06-11
 */
import { StyleSheet, Text, View } from 'react-native';
import { Info } from 'lucide-react-native';
import { useTheme } from '@/theme';

const ACCENT_BAR_WIDTH = 4;
const ICON_SIZE = 18;

export type InfoBannerProps = {
  readonly message: string;
  readonly testID?: string;
};

/**
 * 정보 안내 배너 (24h 검토 SLA 등).
 *
 * @param props {@link InfoBannerProps}
 * @returns 안내 배너
 */
export function InfoBanner({ message, testID }: InfoBannerProps) {
  const theme = useTheme();

  return (
    <View
      accessibilityRole="alert"
      style={[
        styles.container,
        {
          backgroundColor: theme.colors.bgSub,
          borderRadius: theme.borderRadius.md,
          borderLeftColor: theme.colors.primary,
        },
      ]}
      testID={testID}
    >
      <Info size={ICON_SIZE} color={theme.colors.primary} />
      <Text
        style={[
          styles.message,
          {
            color: theme.colors.textSecondary,
          },
          theme.textStyles.caption,
        ]}
      >
        {message}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 8,
    padding: 12,
    borderLeftWidth: ACCENT_BAR_WIDTH,
  },
  message: {
    flex: 1,
    lineHeight: 18,
  },
});

export default InfoBanner;
