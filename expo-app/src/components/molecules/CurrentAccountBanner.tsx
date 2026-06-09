/**
 * CurrentAccountBanner — 현재 로그인 계정을 영구 표시하는 경량 배너 (molecule)
 *
 * 사용자가 여러 계정을 가진 상황에서 동기화 오해를 방지하기 위해
 * 마이페이지 상단에 항상 노출된다. 디자인 토큰만 사용하고 표시 경계
 * (`buildCurrentAccountDisplay`)를 통과한 스칼라 문자열만 렌더한다.
 *
 * 참조:
 *  - docs/project-management/COMMON_DISPLAY_BOUNDARY_MEETING_20260322.md
 *  - docs/standards/COMPONENT_STRUCTURE_STANDARD.md
 *
 * @author MindGarden
 * @since 2026-06-09
 */
import { StyleSheet, Text, View } from 'react-native';
import { UserCircle } from 'lucide-react-native';
import { useTheme } from '@/theme';
import { buildCurrentAccountDisplay } from '@/utils/currentAccountDisplay';

interface CurrentAccountBannerProps {
  email?: string | null;
  socialProvider?: string | null;
  userId?: number | string | null;
}

export function CurrentAccountBanner({
  email,
  socialProvider,
  userId,
}: CurrentAccountBannerProps) {
  const theme = useTheme();
  const display = buildCurrentAccountDisplay({ email, socialProvider, userId });

  return (
    <View
      style={[
        styles.container,
        {
          backgroundColor: theme.colors.surfaceAlt,
          borderColor: theme.colors.border,
          borderRadius: theme.borderRadius.md,
        },
      ]}
      accessibilityRole="text"
      accessibilityLabel={display.oneLine}
      testID="current-account-banner"
    >
      <UserCircle size={14} color={theme.colors.textSecondary} />
      <Text
        style={[
          styles.text,
          {
            color: theme.colors.textSecondary,
            fontFamily: theme.fontFamily.regular,
            fontSize: theme.fontSize.xs,
          },
        ]}
        numberOfLines={1}
        ellipsizeMode="middle"
      >
        {display.oneLine}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 8,
    marginHorizontal: 16,
    marginTop: 8,
    borderWidth: 1,
    gap: 6,
  },
  text: {
    flex: 1,
    lineHeight: 16,
  },
});
