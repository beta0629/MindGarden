/**
 * 상담사 홈 — 다음 상담 강조 카드 (P1)
 *
 * @author MindGarden
 * @since 2026-07-07
 * @see docs/design-system/SCREEN_SPEC_CONSULTANT_MOBILE_HOME.md §3.2
 */
import { Pressable, StyleSheet, Text, View, Platform } from 'react-native';
import * as Haptics from 'expo-haptics';
import { Calendar, FileText } from 'lucide-react-native';
import { useTheme } from '@/theme';
import { Badge } from '@/components/atoms/Badge';
import { SkeletonCard } from '@/components/atoms/SkeletonLoader';
import type { UpcomingPreparationSession } from '@/api/hooks/useConsultantHome';
import { CONSULTANT_HOME_COPY } from '@/constants/consultantHomeCopy';
import { buildConsultantNextSessionCardModel } from '@/utils/consultantHomeComponentUi';

interface ConsultantNextSessionCardProps {
  session: UpcomingPreparationSession | null;
  isLoading?: boolean;
  onPressDetail: (scheduleId: number) => void;
  onPressRecord: (scheduleId: number) => void;
}

export function ConsultantNextSessionCard({
  session,
  isLoading = false,
  onPressDetail,
  onPressRecord,
}: ConsultantNextSessionCardProps) {
  const theme = useTheme();
  const model = buildConsultantNextSessionCardModel(session, isLoading);

  if (model.kind === 'loading') {
    return <SkeletonCard />;
  }

  if (model.kind === 'empty') {
    return null;
  }

  const handleDetail = () => {
    if (Platform.OS !== 'web') {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
    onPressDetail(model.scheduleId);
  };

  const handleRecord = () => {
    if (Platform.OS !== 'web') {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
    onPressRecord(model.scheduleId);
  };

  return (
    <View
      style={[
        styles.card,
        {
          backgroundColor: theme.colors.surface,
          borderRadius: theme.borderRadius.xl,
          padding: theme.spacing.lg,
          marginTop: theme.spacing.lg,
          borderWidth: 1,
          borderColor: theme.colors.border,
        },
      ]}
      accessibilityRole="summary"
      accessibilityLabel={model.accessibilityLabel}
    >
      <View style={styles.header}>
        <View style={styles.titleRow}>
          <Calendar size={18} color={theme.colors.primary} />
          <Text
            style={{
              color: theme.colors.textMain,
              fontFamily: theme.fontFamily.semibold,
              fontSize: theme.fontSize.base,
              marginLeft: theme.spacing.sm,
            }}
          >
            {CONSULTANT_HOME_COPY.NEXT_SESSION_TITLE}
          </Text>
        </View>
        <Badge label={model.badgeLabel} variant="primary" size="md" />
      </View>

      <Text
        style={{
          color: theme.colors.textMain,
          fontFamily: theme.fontFamily.bold,
          fontSize: theme.fontSize.lg,
          marginTop: theme.spacing.md,
        }}
      >
        {model.timeRange}
      </Text>
      <Text
        style={{
          color: theme.colors.textSecondary,
          fontFamily: theme.fontFamily.regular,
          fontSize: theme.fontSize.sm,
          marginTop: theme.spacing.xs,
        }}
      >
        {model.sessionLine}
      </Text>

      <View style={[styles.actions, { marginTop: theme.spacing.lg, gap: theme.spacing.sm }]}>
        <Pressable
          onPress={handleRecord}
          style={[
            styles.actionButton,
            {
              backgroundColor: theme.colors.primary + '12',
              borderRadius: theme.borderRadius.lg,
              paddingVertical: theme.spacing.md,
            },
          ]}
          accessibilityRole="button"
          accessibilityLabel={model.recordCta}
        >
          <FileText size={16} color={theme.colors.primary} />
          <Text
            style={{
              color: theme.colors.primary,
              fontFamily: theme.fontFamily.semibold,
              fontSize: theme.fontSize.sm,
              marginLeft: theme.spacing.xs,
            }}
          >
            {model.recordCta}
          </Text>
        </Pressable>
        <Pressable
          onPress={handleDetail}
          style={[
            styles.actionButton,
            {
              backgroundColor: theme.colors.bgMain,
              borderRadius: theme.borderRadius.lg,
              paddingVertical: theme.spacing.md,
              borderWidth: 1,
              borderColor: theme.colors.border,
            },
          ]}
          accessibilityRole="button"
          accessibilityLabel={model.detailCta}
        >
          <Text
            style={{
              color: theme.colors.textMain,
              fontFamily: theme.fontFamily.medium,
              fontSize: theme.fontSize.sm,
            }}
          >
            {model.detailCta}
          </Text>
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {},
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  actions: {
    flexDirection: 'row',
  },
  actionButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 44,
  },
});
