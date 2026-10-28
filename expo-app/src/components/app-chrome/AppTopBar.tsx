/**
 * AppTopBar — 앱 상단 네비게이션 바
 * 타이틀 + 선택적 뒤로가기 버튼
 * 알림 affordance: cream+slate text pill (gold/bell 아이콘 금지 · amber≠알림)
 *
 * @author MindGarden
 * @since 2026-05-13
 */
import { Pressable, StyleSheet, Text, View, Platform } from 'react-native';
import { useRouter } from 'expo-router';
import * as Haptics from 'expo-haptics';
import { ChevronLeft } from 'lucide-react-native';
import { useTheme } from '@/theme';
import { ADMIN_MIN_TOUCH_TARGET } from '@/theme/tokens';

interface AppTopBarProps {
  title: string;
  canGoBack?: boolean;
  rightAction?: React.ReactNode;
}

interface AppTopBarNotificationPillProps {
  readonly onPress: () => void;
  readonly unreadCount?: number;
  readonly label?: string;
}

/**
 * 홈 TopBar 알림 — cream + slate 텍스트 필.
 * unread는 slate/ink 점만 허용 (amber 금지).
 */
export function AppTopBarNotificationPill({
  onPress,
  unreadCount = 0,
  label = '알림',
}: AppTopBarNotificationPillProps) {
  const theme = useTheme();

  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={unreadCount > 0 ? `${label}, 읽지 않음 ${unreadCount}` : label}
      hitSlop={8}
      style={({ pressed }) => [
        styles.notifPill,
        {
          backgroundColor: theme.colors.chipCream,
          borderColor: theme.colors.lineWarm,
          opacity: pressed ? 0.85 : 1,
          minHeight: ADMIN_MIN_TOUCH_TARGET - 8,
        },
      ]}
    >
      <Text
        style={{
          fontFamily: theme.fontFamily.semibold,
          fontSize: theme.fontSize.sm,
          color: theme.colors.slate,
          letterSpacing: -0.13,
        }}
      >
        {label}
      </Text>
      {unreadCount > 0 ? (
        <View
          style={[styles.unreadDot, { backgroundColor: theme.colors.textMain }]}
          accessibilityElementsHidden
          importantForAccessibility="no"
        />
      ) : null}
    </Pressable>
  );
}

export function AppTopBar({ title, canGoBack, rightAction }: AppTopBarProps) {
  const theme = useTheme();
  const router = useRouter();

  const handleBack = () => {
    if (Platform.OS !== 'web') {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
    router.back();
  };

  return (
    <View
      style={[
        styles.container,
        {
          borderBottomColor: theme.colors.lineWarm,
          backgroundColor: theme.colors.surface,
        },
      ]}
      accessibilityRole="header"
    >
      {canGoBack ? (
        <Pressable
          onPress={handleBack}
          style={styles.backButton}
          accessibilityLabel="뒤로 가기"
          accessibilityRole="button"
          hitSlop={8}
        >
          <ChevronLeft size={24} color={theme.colors.textMain} />
        </Pressable>
      ) : (
        <View style={styles.sidePlaceholder} />
      )}

      <Text
        style={[
          styles.title,
          {
            fontFamily: theme.fontFamily.semibold,
            fontSize: theme.fontSize.lg,
            color: theme.colors.textMain,
          },
        ]}
        numberOfLines={1}
      >
        {title}
      </Text>

      {rightAction ? (
        <View style={styles.rightSlot}>{rightAction}</View>
      ) : (
        <View style={styles.sidePlaceholder} />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    height: 52,
    paddingHorizontal: 16,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  backButton: {
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  sidePlaceholder: {
    minWidth: 40,
  },
  title: {
    flex: 1,
    textAlign: 'center',
  },
  /** cream+slate 「알림」필이 들어가도록 고정 40 폭 제거 */
  rightSlot: {
    minWidth: 56,
    maxWidth: 120,
    alignItems: 'flex-end',
    justifyContent: 'center',
    flexShrink: 0,
  },
  notifPill: {
    minWidth: 36,
    paddingHorizontal: 12,
    borderRadius: 18,
    borderWidth: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
  },
  unreadDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
});
