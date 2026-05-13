/**
 * 회기 사용 이력 타임라인 화면
 * 날짜, 상담사, 유형(사용/충전/환불), 잔여 회기 변화
 *
 * @author MindGarden
 * @since 2026-05-12
 */
import React, { useMemo } from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Animated, { FadeInDown } from 'react-native-reanimated';
import {
  ArrowDownCircle,
  ArrowUpCircle,
  MinusCircle,
  RotateCcw,
} from 'lucide-react-native';
import { useTheme } from '@/theme';
import { useAuthStore } from '@/stores/useAuthStore';
import {
  useSessionUsageHistory,
  type SessionUsageItem,
  type UsageType,
} from '@/api/hooks/usePayments';
import { Badge } from '@/components/atoms/Badge';
import { EmptyState } from '@/components/atoms/EmptyState';
import { SkeletonCard } from '@/components/atoms/SkeletonLoader';

const USAGE_TYPE_CONFIG: Record<
  UsageType,
  {
    label: string;
    variant: 'primary' | 'success' | 'error';
    icon: typeof ArrowDownCircle;
    prefix: string;
  }
> = {
  USED: {
    label: '사용',
    variant: 'primary',
    icon: MinusCircle,
    prefix: '-',
  },
  CHARGED: {
    label: '충전',
    variant: 'success',
    icon: ArrowUpCircle,
    prefix: '+',
  },
  REFUNDED: {
    label: '환불',
    variant: 'error',
    icon: RotateCcw,
    prefix: '+',
  },
};

interface GroupedUsage {
  date: string;
  items: SessionUsageItem[];
}

function groupByDate(items: SessionUsageItem[]): GroupedUsage[] {
  const map = new Map<string, SessionUsageItem[]>();

  for (const item of items) {
    const dateKey = item.date;
    const group = map.get(dateKey);
    if (group) {
      group.push(item);
    } else {
      map.set(dateKey, [item]);
    }
  }

  return Array.from(map, ([date, groupItems]) => ({ date, items: groupItems }));
}

export default function UsageHistoryScreen() {
  const theme = useTheme();
  const user = useAuthStore((s) => s.user);
  const clientId =
    user?.id != null && !Number.isNaN(Number(user.id))
      ? Number(user.id)
      : undefined;

  const { data, isLoading } = useSessionUsageHistory(clientId);

  const usageHistory = data?.items ?? [];
  const isDerivedFromMappings = data?.isDerivedFromMappings ?? false;

  const groupedData = useMemo(
    () => groupByDate(usageHistory),
    [usageHistory],
  );

  if (isLoading) {
    return (
      <SafeAreaView
        style={[styles.safeArea, { backgroundColor: theme.colors.bgMain }]}
        edges={['bottom']}
      >
        <View style={styles.loadingContainer}>
          <SkeletonCard lines={3} />
          <SkeletonCard lines={3} style={styles.skeletonGap} />
          <SkeletonCard lines={3} style={styles.skeletonGap} />
        </View>
      </SafeAreaView>
    );
  }

  if (!usageHistory.length) {
    return (
      <SafeAreaView
        style={[styles.safeArea, { backgroundColor: theme.colors.bgMain }]}
        edges={['bottom']}
      >
        <EmptyState
          title="사용 이력이 없습니다"
          description="상담 이용 시 회기 사용 이력이 여기에 표시됩니다. 결제·매칭 정보가 없으면 여기에 표시할 항목이 없습니다."
        />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView
      style={[styles.safeArea, { backgroundColor: theme.colors.bgMain }]}
      edges={['bottom']}
    >
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {isDerivedFromMappings ? (
          <View style={{ marginBottom: theme.spacing.md, paddingHorizontal: 4 }}>
            <Text
              style={{
                color: theme.colors.textSecondary,
                fontFamily: theme.fontFamily.regular,
                fontSize: theme.fontSize.xs,
                lineHeight: theme.fontSize.sm * 1.4,
              }}
            >
              서버의 상세 사용 이력이 비어 있어, 회기 매칭 정보를 바탕으로 한 요약만
              표시합니다.
            </Text>
          </View>
        ) : null}
        {groupedData.map((group, groupIndex) => (
          <Animated.View
            key={group.date}
            entering={FadeInDown.delay(groupIndex * 80).duration(400)}
          >
            <Text
              style={[
                styles.dateHeader,
                {
                  color: theme.colors.textSecondary,
                  fontFamily: theme.fontFamily.semibold,
                  fontSize: theme.fontSize.sm,
                },
              ]}
            >
              {group.date}
            </Text>

            <View
              style={[
                styles.dateGroup,
                {
                  backgroundColor: theme.colors.surface,
                  borderRadius: theme.borderRadius.xl,
                  ...theme.shadows.sm,
                },
              ]}
            >
              {group.items.map((item, itemIndex) => (
                <UsageTimelineItem
                  key={item.id}
                  item={item}
                  isLast={itemIndex === group.items.length - 1}
                />
              ))}
            </View>
          </Animated.View>
        ))}
      </ScrollView>
    </SafeAreaView>
  );
}

interface UsageTimelineItemProps {
  item: SessionUsageItem;
  isLast: boolean;
}

function UsageTimelineItem({ item, isLast }: UsageTimelineItemProps) {
  const theme = useTheme();
  const config = USAGE_TYPE_CONFIG[item.type];
  const Icon = config.icon;

  const changeColor =
    item.type === 'USED' ? theme.colors.error : theme.colors.success;

  return (
    <View
      style={[
        styles.timelineItem,
        !isLast && {
          borderBottomWidth: StyleSheet.hairlineWidth,
          borderBottomColor: theme.colors.divider,
        },
      ]}
    >
      <View style={styles.timelineLeft}>
        <View
          style={[
            styles.iconCircle,
            { backgroundColor: `${changeColor}15` },
          ]}
        >
          <Icon size={18} color={changeColor} />
        </View>

        {!isLast && (
          <View
            style={[
              styles.timelineLine,
              { backgroundColor: theme.colors.divider },
            ]}
          />
        )}
      </View>

      <View style={styles.timelineContent}>
        <View style={styles.timelineRow}>
          <View style={styles.timelineInfo}>
            <Text
              style={{
                color: theme.colors.textMain,
                fontFamily: theme.fontFamily.medium,
                fontSize: theme.fontSize.sm,
              }}
              numberOfLines={1}
            >
              {item.description}
            </Text>
            {item.consultantName && (
              <Text
                style={{
                  color: theme.colors.textTertiary,
                  fontFamily: theme.fontFamily.regular,
                  fontSize: theme.fontSize.xs,
                  marginTop: 2,
                }}
              >
                {item.consultantName}
              </Text>
            )}
          </View>

          <View style={styles.timelineRight}>
            <Text
              style={{
                color: changeColor,
                fontFamily: theme.fontFamily.bold,
                fontSize: theme.fontSize.base,
              }}
            >
              {config.prefix}{Math.abs(item.sessionChange)}회
            </Text>
            <Badge label={config.label} variant={config.variant} size="sm" />
          </View>
        </View>

        <View style={styles.remainingRow}>
          <ArrowDownCircle size={12} color={theme.colors.textTertiary} />
          <Text
            style={{
              color: theme.colors.textTertiary,
              fontFamily: theme.fontFamily.regular,
              fontSize: theme.fontSize.xs,
              marginLeft: 4,
            }}
          >
            잔여 {item.remainingAfter}회
          </Text>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
  },
  loadingContainer: {
    padding: 16,
    gap: 12,
  },
  skeletonGap: {
    marginTop: 8,
  },
  scrollContent: {
    padding: 16,
    paddingBottom: 40,
    gap: 16,
  },
  dateHeader: {
    marginBottom: 8,
    marginLeft: 4,
  },
  dateGroup: {
    overflow: 'hidden',
  },
  timelineItem: {
    flexDirection: 'row',
    padding: 14,
  },
  timelineLeft: {
    alignItems: 'center',
    marginRight: 12,
  },
  iconCircle: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
  timelineLine: {
    width: 2,
    flex: 1,
    marginTop: 6,
  },
  timelineContent: {
    flex: 1,
  },
  timelineRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  timelineInfo: {
    flex: 1,
    marginRight: 12,
  },
  timelineRight: {
    alignItems: 'flex-end',
    gap: 4,
  },
  remainingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 8,
  },
});
