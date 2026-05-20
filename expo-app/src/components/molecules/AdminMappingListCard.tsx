/**
 * 어드민 매칭 목록 카드 — 스케줄 허브 매칭 탭
 *
 * @author MindGarden
 * @since 2026-05-18
 */
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { ExternalLink, Link2 } from 'lucide-react-native';
import { useTheme } from '@/theme';
import { ADMIN_MIN_TOUCH_TARGET } from '@/theme/tokens';
import { Badge } from '@/components/atoms/Badge';
import type { AdminMappingListItem } from '@/api/hooks/useAdminMappings';
import {
  ADMIN_MAPPING_COPY,
  ADMIN_MAPPING_STATUS_LABELS,
} from '@/constants/adminMappingCopy';
import { toDisplayString } from '@/utils/safeDisplay';
import { openAdminWebIntegratedSchedule } from '@/utils/openAdminWebMappingPayment';
import {
  canScheduleAdminMapping,
  getAdminMappingPrimaryActionKind,
  getAdminMappingPrimaryCtaLabel,
  getScheduleBlockedPaymentHint,
  getWebPaymentCtaLabel,
  shouldShowAdminMappingPrimaryCta,
  shouldShowWebPaymentCta,
} from '@/utils/adminMappingSettlement';

export type AdminMappingListCardProps = {
  readonly item: AdminMappingListItem;
  readonly index: number;
  readonly canManageMappings: boolean;
  readonly onSchedule: (mapping: AdminMappingListItem) => void;
};

function mappingStatusLabel(status: string): string {
  const key = status.trim().toUpperCase();
  return ADMIN_MAPPING_STATUS_LABELS[key] ?? toDisplayString(status, '—');
}

export function AdminMappingListCard({
  item,
  index,
  canManageMappings,
  onSchedule,
}: AdminMappingListCardProps) {
  const theme = useTheme();
  const status = item.status.trim().toUpperCase();
  const scheduleAllowed = canScheduleAdminMapping(item);
  const primaryKind = getAdminMappingPrimaryActionKind(status);
  const showPrimary = shouldShowAdminMappingPrimaryCta(status, canManageMappings);
  const showWebPayment = canManageMappings && shouldShowWebPaymentCta(status);
  const variant =
    status === 'ACTIVE'
      ? 'success'
      : status === 'PENDING_PAYMENT' || status === 'DEPOSIT_PENDING'
        ? 'warning'
        : status === 'TERMINATED' || status === 'SESSIONS_EXHAUSTED'
          ? 'gray'
          : 'info';

  return (
    <View
      style={[
        styles.mappingCard,
        {
          backgroundColor: theme.colors.surface,
          borderColor: theme.colors.border,
          marginTop: index === 0 ? 0 : theme.spacing.md,
        },
      ]}
    >
      <View style={styles.mappingCardHeader}>
        <Text
          style={{
            flex: 1,
            color: theme.colors.textMain,
            fontFamily: theme.fontFamily.semibold,
            fontSize: theme.fontSize.base,
          }}
        >
          {toDisplayString(item.consultantName, '상담사')} · {toDisplayString(item.clientName, '내담자')}
        </Text>
        <Badge label={mappingStatusLabel(item.status)} variant={variant} />
      </View>
      <Text
        style={{
          marginTop: theme.spacing.sm,
          color: theme.colors.textSecondary,
          fontFamily: theme.fontFamily.regular,
          fontSize: theme.fontSize.sm,
        }}
      >
        {ADMIN_MAPPING_COPY.REMAINING_SESSIONS(item.remainingSessions)}
        {item.packageName.trim() !== ''
          ? ` · ${toDisplayString(item.packageName, '패키지')}`
          : ''}
      </Text>
      {!scheduleAllowed ? (
        <Text
          style={{
            marginTop: theme.spacing.sm,
            color: theme.colors.textTertiary,
            fontFamily: theme.fontFamily.regular,
            fontSize: theme.fontSize.xs,
          }}
        >
          {getScheduleBlockedPaymentHint(item)}
        </Text>
      ) : null}
      <View style={[styles.mappingActionsRow, { marginTop: theme.spacing.sm }]}>
        {showPrimary && primaryKind === 'schedule' ? (
          <Pressable
            onPress={() => onSchedule(item)}
            disabled={!scheduleAllowed}
            style={({ pressed }) => [
              styles.mappingAction,
              styles.mappingActionPrimary,
              {
                borderColor: theme.colors.primary,
                backgroundColor: theme.colors.primary,
                opacity: !scheduleAllowed ? 0.6 : pressed ? 0.85 : 1,
              },
            ]}
            accessibilityRole="button"
            accessibilityLabel={getAdminMappingPrimaryCtaLabel(primaryKind)}
          >
            <Text
              style={{
                color: theme.colors.textOnPrimary,
                fontFamily: theme.fontFamily.semibold,
                fontSize: theme.fontSize.sm,
              }}
            >
              {getAdminMappingPrimaryCtaLabel(primaryKind)}
            </Text>
          </Pressable>
        ) : null}
        {showWebPayment ? (
          <Pressable
            onPress={() => void openAdminWebIntegratedSchedule()}
            style={({ pressed }) => [
              styles.mappingAction,
              showPrimary ? styles.mappingActionSecondary : styles.mappingActionPrimary,
              {
                borderColor: theme.colors.primary,
                opacity: pressed ? 0.7 : 1,
              },
            ]}
            accessibilityRole="button"
            accessibilityLabel={ADMIN_MAPPING_COPY.OPEN_WEB_PAYMENT_A11Y}
          >
            <ExternalLink size={16} color={theme.colors.primary} />
            <Text
              style={{
                color: theme.colors.primary,
                fontFamily: theme.fontFamily.medium,
                fontSize: theme.fontSize.sm,
                marginLeft: theme.spacing.sm,
              }}
            >
              {getWebPaymentCtaLabel(status)}
            </Text>
          </Pressable>
        ) : null}
        {!showPrimary && scheduleAllowed ? (
          <Pressable
            onPress={() => onSchedule(item)}
            style={({ pressed }) => [
              styles.mappingAction,
              styles.mappingActionPrimary,
              {
                borderColor: theme.colors.primary,
                opacity: pressed ? 0.7 : 1,
              },
            ]}
            accessibilityRole="button"
            accessibilityLabel={ADMIN_MAPPING_COPY.ACTION_SCHEDULE_FROM_MAPPING}
          >
            <Link2 size={16} color={theme.colors.primary} />
            <Text
              style={{
                color: theme.colors.primary,
                fontFamily: theme.fontFamily.medium,
                fontSize: theme.fontSize.sm,
                marginLeft: theme.spacing.sm,
              }}
            >
              {ADMIN_MAPPING_COPY.ACTION_SCHEDULE_FROM_MAPPING}
            </Text>
          </Pressable>
        ) : null}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  mappingCard: {
    borderWidth: 1,
    borderRadius: 16,
    padding: 14,
  },
  mappingCardHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 8,
  },
  mappingActionsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  mappingAction: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderRadius: 10,
    paddingHorizontal: 10,
    minHeight: ADMIN_MIN_TOUCH_TARGET,
  },
  mappingActionPrimary: {
    flex: 1,
    minWidth: 120,
  },
  mappingActionSecondary: {
    flex: 1,
    minWidth: 120,
  },
});
