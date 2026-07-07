/**
 * 상담사 홈 — 활동 스냅샷 행 (메시지·급여, P1)
 *
 * @author MindGarden
 * @since 2026-07-07
 * @see docs/design-system/SCREEN_SPEC_CONSULTANT_MOBILE_HOME.md §3.1
 */
import { Pressable, StyleSheet, Text, View, Platform } from 'react-native';
import * as Haptics from 'expo-haptics';
import { MessageSquare, Wallet } from 'lucide-react-native';
import { useTheme } from '@/theme';
import { CONSULTANT_HOME_COPY } from '@/constants/consultantHomeCopy';
import { CONSULTANT_SALARY_SETTLEMENT_COPY } from '@/constants/consultantSalarySettlementCopy';
import { toDisplayString } from '@/utils/safeDisplay';

export interface ConsultantHomeSnapshotMessage {
  partnerName: string;
  lastMessage: string;
  partnerId: number;
}

export interface ConsultantHomeSnapshotSalary {
  periodLabel: string;
  netLabel: string;
}

interface ConsultantHomeSnapshotRowProps {
  message?: ConsultantHomeSnapshotMessage | null;
  salary?: ConsultantHomeSnapshotSalary | null;
  onPressMessage?: () => void;
  onPressSalary?: () => void;
}

function SnapshotTile({
  icon: Icon,
  title,
  subtitle,
  onPress,
  accessibilityLabel,
}: {
  icon: typeof MessageSquare;
  title: string;
  subtitle: string;
  onPress?: () => void;
  accessibilityLabel: string;
}) {
  const theme = useTheme();

  const handlePress = () => {
    if (Platform.OS !== 'web') {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
    onPress?.();
  };

  return (
    <Pressable
      onPress={handlePress}
      disabled={!onPress}
      style={[
        styles.tile,
        {
          backgroundColor: theme.colors.surface,
          borderRadius: theme.borderRadius.xl,
          padding: theme.spacing.lg,
          borderWidth: 1,
          borderColor: theme.colors.border,
        },
      ]}
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel}
    >
      <Icon size={18} color={theme.colors.primary} />
      <Text
        style={{
          color: theme.colors.textMain,
          fontFamily: theme.fontFamily.semibold,
          fontSize: theme.fontSize.sm,
          marginTop: theme.spacing.sm,
        }}
        numberOfLines={1}
      >
        {title}
      </Text>
      <Text
        style={{
          color: theme.colors.textSecondary,
          fontFamily: theme.fontFamily.regular,
          fontSize: theme.fontSize.xs,
          marginTop: theme.spacing.xs,
        }}
        numberOfLines={2}
      >
        {subtitle}
      </Text>
    </Pressable>
  );
}

export function ConsultantHomeSnapshotRow({
  message,
  salary,
  onPressMessage,
  onPressSalary,
}: ConsultantHomeSnapshotRowProps) {
  const theme = useTheme();

  if (!message && !salary) {
    return null;
  }

  return (
    <View style={[styles.row, { marginTop: theme.spacing.lg, gap: theme.spacing.md }]}>
      {message ? (
        <SnapshotTile
          icon={MessageSquare}
          title={CONSULTANT_HOME_COPY.SNAPSHOT_MESSAGE_TITLE}
          subtitle={CONSULTANT_HOME_COPY.SNAPSHOT_MESSAGE_PREVIEW(
            message.partnerName,
            message.lastMessage,
          )}
          onPress={onPressMessage}
          accessibilityLabel={CONSULTANT_HOME_COPY.SNAPSHOT_MESSAGE_A11Y(message.partnerName)}
        />
      ) : null}
      {salary ? (
        <SnapshotTile
          icon={Wallet}
          title={CONSULTANT_HOME_COPY.SNAPSHOT_SALARY_TITLE}
          subtitle={CONSULTANT_HOME_COPY.SNAPSHOT_SALARY_PREVIEW(
            salary.periodLabel,
            salary.netLabel,
          )}
          onPress={onPressSalary}
          accessibilityLabel={CONSULTANT_HOME_COPY.SNAPSHOT_SALARY_A11Y(salary.periodLabel)}
        />
      ) : (
        <SnapshotTile
          icon={Wallet}
          title={CONSULTANT_HOME_COPY.SNAPSHOT_SALARY_TITLE}
          subtitle={toDisplayString(
            CONSULTANT_SALARY_SETTLEMENT_COPY.EMPTY_PRIMARY,
            CONSULTANT_HOME_COPY.SNAPSHOT_SALARY_EMPTY,
          )}
          onPress={onPressSalary}
          accessibilityLabel={CONSULTANT_HOME_COPY.SNAPSHOT_SALARY_TITLE}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
  },
  tile: {
    flex: 1,
    minHeight: 96,
  },
});
