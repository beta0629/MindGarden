/**
 * 스케줄 카드 (Molecule)
 * 시간, 내담자명, 상태 Badge, 좌측 악센트 바, 액션 버튼
 *
 * @author MindGarden
 * @since 2026-05-12
 * @see docs/design-system/v2/CONSULTANT_CLIENT_COMPONENTS_SPEC.md §2
 * @see docs/design-system/v2/EXPO_APP_SCHEDULE_CARD_STATUS_SPEC.md
 */
import { View, Text, Pressable, StyleSheet, Platform } from 'react-native';
import * as Haptics from 'expo-haptics';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { useTheme } from '@/theme';
import type { AppTheme } from '@/theme';
import { getConsultantScheduleCardContainerVariant } from '@/utils/consultantScheduleCardUi';
import { toDisplayString } from '@/utils/safeDisplay';
import { Badge } from '../atoms/Badge';

type ScheduleStatus =
  | 'SCHEDULED'
  | 'BOOKED'
  | 'CONFIRMED'
  | 'IN_PROGRESS'
  | 'COMPLETED'
  | 'CANCELLED'
  | 'NO_SHOW';

interface ScheduleCardProps {
  readonly time: string;
  readonly clientName: string;
  readonly sessionType?: string;
  readonly status: ScheduleStatus;
  readonly onPress?: () => void;
  readonly onActionPress?: () => void;
  readonly actionLabel?: string;
  readonly footerHint?: string;
  readonly containerOpacity?: number;
  readonly index?: number;
}

const STATUS_LABEL: Record<ScheduleStatus, string> = {
  BOOKED: '예정',
  SCHEDULED: '예정',
  CONFIRMED: '예약확정',
  IN_PROGRESS: '진행중',
  COMPLETED: '완료',
  CANCELLED: '취소',
  NO_SHOW: '불참',
};

const STATUS_BADGE_VARIANT: Record<
  ScheduleStatus,
  'info' | 'warning' | 'success' | 'gray' | 'error'
> = {
  BOOKED: 'info',
  SCHEDULED: 'info',
  CONFIRMED: 'info',
  IN_PROGRESS: 'warning',
  COMPLETED: 'success',
  CANCELLED: 'gray',
  NO_SHOW: 'error',
};

function getAccentColor(status: ScheduleStatus, theme: AppTheme): string {
  const map: Record<ScheduleStatus, string> = {
    BOOKED: theme.colors.primary,
    SCHEDULED: theme.colors.primary,
    CONFIRMED: theme.colors.primary,
    IN_PROGRESS: theme.colors.warning,
    COMPLETED: theme.colors.success,
    CANCELLED: theme.colors.gray[300],
    NO_SHOW: theme.colors.error,
  };
  return map[status];
}

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

export function ScheduleCard({
  time,
  clientName,
  sessionType,
  status,
  onPress,
  onActionPress,
  actionLabel,
  footerHint,
  containerOpacity = 1,
  index = 0,
}: ScheduleCardProps) {
  const theme = useTheme();
  const containerVariant = getConsultantScheduleCardContainerVariant(status);
  const inProgressContainer = containerVariant === 'inProgress';
  const accentColor = getAccentColor(status, theme);
  const badgeVariant =
    footerHint && (status === 'BOOKED' || status === 'CONFIRMED' || status === 'SCHEDULED')
      ? 'warning'
      : STATUS_BADGE_VARIANT[status];

  const handlePress = () => {
    if (Platform.OS !== 'web') {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
    onPress?.();
  };

  const handleActionPress = () => {
    if (Platform.OS !== 'web') {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    }
    onActionPress?.();
  };

  return (
    <AnimatedPressable
      entering={FadeInDown.delay(index * 80).duration(300)}
      onPress={handlePress}
      style={[
        styles.container,
        {
          backgroundColor: inProgressContainer
            ? theme.colors.scheduleCardInProgressBackground
            : theme.colors.surface,
          borderRadius: theme.borderRadius.xl,
          padding: theme.spacing.lg,
          opacity: containerOpacity,
          borderWidth: inProgressContainer ? theme.spacing['2xs'] : 0,
          borderColor: inProgressContainer ? theme.colors.warning : theme.colors.surface,
          marginBottom: theme.spacing.md,
          ...theme.shadows.sm,
        },
      ]}
      accessibilityRole="button"
      accessibilityLabel={`${time} ${clientName} ${STATUS_LABEL[status]}`}
    >
      <View
        style={[
          styles.accent,
          {
            backgroundColor: accentColor,
            borderRadius: theme.borderRadius.sm,
          },
        ]}
      />

      <View style={styles.content}>
        <View style={styles.topRow}>
          <Text
            style={{
              color: theme.colors.textMain,
              fontFamily: theme.fontFamily.semibold,
              fontSize: theme.fontSize.lg,
            }}
            numberOfLines={1}
          >
            {time}
          </Text>
          <Badge variant={badgeVariant} label={STATUS_LABEL[status] ?? toDisplayString(status, '—')} />
        </View>

        <Text
          style={[
            styles.clientName,
            {
              color: theme.colors.textMain,
              fontFamily: theme.fontFamily.regular,
              fontSize: theme.fontSize.base,
              marginTop: theme.spacing.xs,
            },
          ]}
          numberOfLines={1}
        >
          {clientName}
        </Text>

        {sessionType ? (
          <Text
            style={{
              color: theme.colors.textSecondary,
              fontFamily: theme.fontFamily.regular,
              fontSize: theme.fontSize.xs,
              marginTop: theme.spacing['2xs'],
            }}
            numberOfLines={1}
          >
            {toDisplayString(sessionType, '')}
          </Text>
        ) : null}

        {footerHint ? (
          <Text
            style={{
              color: theme.colors.warning,
              fontFamily: theme.fontFamily.medium,
              fontSize: theme.fontSize.xs,
              marginTop: theme.spacing.sm,
            }}
            numberOfLines={2}
          >
            {footerHint}
          </Text>
        ) : null}

        {actionLabel && onActionPress ? (
          <Pressable
            onPress={handleActionPress}
            style={[
              styles.actionButton,
              {
                backgroundColor: theme.colors.primary,
                borderRadius: theme.borderRadius.lg,
                paddingHorizontal: theme.spacing.lg,
                paddingVertical: theme.spacing.sm,
                marginTop: theme.spacing.md,
              },
            ]}
            accessibilityRole="button"
            accessibilityLabel={actionLabel}
          >
            <Text
              style={{
                color: theme.colors.textOnPrimary,
                fontFamily: theme.fontFamily.semibold,
                fontSize: theme.fontSize.sm,
              }}
            >
              {actionLabel}
            </Text>
          </Pressable>
        ) : null}
      </View>
    </AnimatedPressable>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    overflow: 'hidden',
  },
  accent: {
    width: 4,
    marginRight: 12,
    alignSelf: 'stretch',
  },
  content: {
    flex: 1,
  },
  topRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  clientName: {
    lineHeight: 22,
  },
  actionButton: {
    alignSelf: 'flex-start',
  },
});
