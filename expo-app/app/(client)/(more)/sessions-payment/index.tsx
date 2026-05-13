/**
 * 회기·결제 메인 화면
 * 보유 회기 카드 + 결제 내역 (필터·당겨서 새로고침)
 *
 * @author MindGarden
 * @since 2026-05-12
 */
import React, { useCallback, useMemo, useState } from 'react';
import {
  Platform,
  Pressable,
  RefreshControl,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { FlashList } from '@shopify/flash-list';
import { LinearGradient } from 'expo-linear-gradient';
import * as Haptics from 'expo-haptics';
import Animated, {
  FadeInDown,
  useAnimatedStyle,
  useSharedValue,
} from 'react-native-reanimated';
import {
  ChevronRight,
  CreditCard,
  History,
  Plus,
  RotateCcw,
} from 'lucide-react-native';
import { useTheme } from '@/theme';
import { useAuthStore } from '@/stores/useAuthStore';
import {
  useSessionBalance,
  usePaymentHistory,
  type PaymentFilter,
  type PaymentItem,
} from '@/api/hooks/usePayments';
import { Badge } from '@/components/atoms/Badge';
import { EmptyState } from '@/components/atoms/EmptyState';
import { SkeletonCard, SkeletonLoader } from '@/components/atoms/SkeletonLoader';

const FILTER_OPTIONS: { key: PaymentFilter; label: string }[] = [
  { key: 'ALL', label: '전체' },
  { key: 'COMPLETED', label: '결제완료' },
  { key: 'REFUNDED', label: '환불' },
];

const STATUS_BADGE_MAP: Record<string, { label: string; variant: 'success' | 'warning' | 'error' | 'gray' | 'info' }> = {
  COMPLETED: { label: '완료', variant: 'success' },
  PENDING: { label: '대기', variant: 'warning' },
  FAILED: { label: '실패', variant: 'error' },
  CANCELLED: { label: '취소', variant: 'gray' },
  REFUNDED: { label: '환불', variant: 'info' },
};

const LOW_SESSION_THRESHOLD = 3;

function formatCurrency(amount: number): string {
  return `₩${Number(amount || 0).toLocaleString()}`;
}

export default function SessionsPaymentIndex() {
  const theme = useTheme();
  const router = useRouter();
  const user = useAuthStore((s) => s.user);
  const clientId = user?.id;

  const [activeFilter, setActiveFilter] = useState<PaymentFilter>('ALL');

  const {
    data: balance,
    isLoading: balanceLoading,
    refetch: refetchBalance,
    isRefetching: balanceRefetching,
  } = useSessionBalance(clientId);

  const {
    data: paymentList,
    isLoading: paymentsLoading,
    refetch: refetchPayments,
    isRefetching: paymentsRefetching,
  } = usePaymentHistory(clientId, activeFilter);

  const payments = useMemo(() => {
    const pl = paymentList as
      | { content?: PaymentItem[]; pages?: { content?: PaymentItem[] }[] }
      | undefined;
    let rows: PaymentItem[] = [];
    if (pl && Array.isArray(pl.content)) {
      rows = pl.content;
    } else if (pl && Array.isArray(pl.pages)) {
      rows = pl.pages.flatMap((p) =>
        Array.isArray(p?.content) ? p.content! : [],
      );
    }
    return rows.filter(
      (x): x is PaymentItem => x != null && typeof x.id === 'number',
    );
  }, [paymentList]);

  const emptyPaymentsCopy = useMemo(() => {
    switch (activeFilter) {
      case 'REFUNDED':
        return {
          title: '환불 내역이 없습니다',
          description: '환불이 완료된 건이 여기에 표시됩니다. 아래로 당겨 새로고침해 보세요.',
          icon: 'refund' as const,
        };
      case 'COMPLETED':
        return {
          title: '결제 완료 내역이 없습니다',
          description:
            '입금·결제가 완료된 패키지가 여기에 표시됩니다. 아래로 당겨 새로고침해 보세요.',
          icon: 'card' as const,
        };
      default:
        return {
          title: '결제 내역이 없습니다',
          description:
            '패키지 결제·회기 연장 내역이 여기에 표시됩니다. 아래로 당겨 새로고침해 보세요.',
          icon: 'card' as const,
        };
    }
  }, [activeFilter]);

  const isLowSessions = (balance?.remainingSessions ?? 0) <= LOW_SESSION_THRESHOLD;

  const handleRefresh = useCallback(async () => {
    await Promise.all([refetchBalance(), refetchPayments()]);
  }, [refetchBalance, refetchPayments]);

  const handleFilterPress = useCallback((key: PaymentFilter) => {
    if (Platform.OS !== 'web') {
      Haptics.selectionAsync();
    }
    setActiveFilter(key);
  }, []);

  const renderPaymentItem = useCallback(
    ({ item, index }: { item: PaymentItem; index: number }) => (
      <PaymentListItem
        item={item}
        index={index}
        onPress={() =>
          router.push(`/(client)/(more)/sessions-payment/${item.id}`)
        }
      />
    ),
    [router],
  );

  if (balanceLoading) {
    return (
      <SafeAreaView
        style={[styles.safeArea, { backgroundColor: theme.colors.bgMain }]}
        edges={['bottom']}
      >
        <View style={styles.skeletonContainer}>
          <SkeletonLoader width="100%" height={160} borderRadius={20} />
          <SkeletonCard lines={2} style={styles.skeletonCard} />
          <SkeletonCard lines={2} style={styles.skeletonCard} />
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView
      style={[styles.safeArea, { backgroundColor: theme.colors.bgMain }]}
      edges={['bottom']}
    >
      <FlashList
        data={payments}
        renderItem={renderPaymentItem}
        keyExtractor={(item, index) => String(item?.id ?? `fallback-${index}`)}
        refreshControl={
          <RefreshControl
            refreshing={balanceRefetching || paymentsRefetching}
            onRefresh={handleRefresh}
            tintColor={theme.colors.primary}
          />
        }
        ListHeaderComponent={
          <View>
            <SessionBalanceCard
              remaining={balance?.remainingSessions ?? 0}
              total={balance?.totalSessions ?? 0}
              used={balance?.usedSessions ?? 0}
              isLow={isLowSessions}
              onExtend={() => router.push('/(client)/(more)/sessions-payment/extend')}
              onUsageHistory={() =>
                router.push('/(client)/(more)/sessions-payment/usage')
              }
            />
            <FilterBar
              active={activeFilter}
              onSelect={handleFilterPress}
            />
          </View>
        }
        ListEmptyComponent={
          paymentsLoading ? (
            <View style={styles.listLoading}>
              <SkeletonCard lines={2} style={styles.skeletonCard} />
              <SkeletonCard lines={2} style={styles.skeletonCard} />
            </View>
          ) : (
            <EmptyState
              icon={
                emptyPaymentsCopy.icon === 'refund' ? (
                  <RotateCcw size={32} color={theme.colors.textTertiary} />
                ) : (
                  <CreditCard size={32} color={theme.colors.textTertiary} />
                )
              }
              title={emptyPaymentsCopy.title}
              description={emptyPaymentsCopy.description}
            />
          )
        }
        contentContainerStyle={styles.listContent}
      />
    </SafeAreaView>
  );
}

interface SessionBalanceCardProps {
  remaining: number;
  total: number;
  used: number;
  isLow: boolean;
  onExtend: () => void;
  onUsageHistory: () => void;
}

function SessionBalanceCard({
  remaining,
  total,
  used,
  isLow,
  onExtend,
  onUsageHistory,
}: SessionBalanceCardProps) {
  const theme = useTheme();
  const progress = total > 0 ? used / total : 0;
  const scale = useSharedValue(1);

  const handleExtendPress = () => {
    if (Platform.OS !== 'web') {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    }
    onExtend();
  };

  const animatedCardStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  return (
    <Animated.View
      entering={FadeInDown.duration(500).springify()}
      style={[styles.balanceCardWrapper, animatedCardStyle]}
    >
      <LinearGradient
        colors={[theme.colors.primary, theme.colors.primaryDark]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={[styles.balanceCard, { borderRadius: theme.borderRadius['2xl'] }]}
      >
        <View style={styles.balanceHeader}>
          <Text
            style={[
              styles.balanceLabel,
              {
                color: theme.colors.textOnPrimary,
                fontFamily: theme.fontFamily.medium,
                fontSize: theme.fontSize.sm,
              },
            ]}
          >
            보유 회기
          </Text>
          {isLow && (
            <Badge label="소진 임박" variant="warning" size="sm" />
          )}
        </View>

        <Text
          style={[
            styles.balanceNumber,
            {
              color: theme.colors.textOnPrimary,
              fontFamily: theme.fontFamily.bold,
              fontSize: theme.fontSize['5xl'],
            },
          ]}
          accessibilityLabel={`잔여 ${remaining}회기`}
        >
          {remaining}
          <Text
            style={[
              styles.balanceUnit,
              {
                color: theme.colors.textOnPrimary,
                fontFamily: theme.fontFamily.regular,
                fontSize: theme.fontSize.lg,
              },
            ]}
          >
            {' '}회기
          </Text>
        </Text>

        <View style={styles.progressContainer}>
          <View
            style={[
              styles.progressTrack,
              { backgroundColor: `${theme.colors.textOnPrimary}30` },
            ]}
          >
            <View
              style={[
                styles.progressFill,
                {
                  width: `${progress * 100}%`,
                  backgroundColor: isLow
                    ? theme.colors.warning
                    : theme.colors.textOnPrimary,
                },
              ]}
            />
          </View>
          <Text
            style={[
              styles.progressText,
              {
                color: `${theme.colors.textOnPrimary}CC`,
                fontFamily: theme.fontFamily.regular,
                fontSize: theme.fontSize.xs,
              },
            ]}
          >
            {used}회 사용 / 전체 {total}회
          </Text>
        </View>

        <View style={styles.balanceActions}>
          <Pressable
            onPress={handleExtendPress}
            style={({ pressed }) => [
              styles.extendButton,
              {
                backgroundColor: theme.colors.textOnPrimary,
                opacity: pressed ? 0.85 : 1,
                borderRadius: theme.borderRadius.lg,
              },
            ]}
            accessibilityRole="button"
            accessibilityLabel="회기 연장"
          >
            <Plus size={16} color={theme.colors.primary} />
            <Text
              style={[
                styles.extendButtonText,
                {
                  color: theme.colors.primary,
                  fontFamily: theme.fontFamily.semibold,
                  fontSize: theme.fontSize.sm,
                },
              ]}
            >
              회기 연장
            </Text>
          </Pressable>

          <Pressable
            onPress={onUsageHistory}
            style={({ pressed }) => [
              styles.historyButton,
              {
                borderColor: `${theme.colors.textOnPrimary}60`,
                opacity: pressed ? 0.85 : 1,
                borderRadius: theme.borderRadius.lg,
              },
            ]}
            accessibilityRole="button"
            accessibilityLabel="사용 이력"
          >
            <History size={16} color={theme.colors.textOnPrimary} />
            <Text
              style={[
                styles.historyButtonText,
                {
                  color: theme.colors.textOnPrimary,
                  fontFamily: theme.fontFamily.medium,
                  fontSize: theme.fontSize.sm,
                },
              ]}
            >
              사용 이력
            </Text>
          </Pressable>
        </View>
      </LinearGradient>
    </Animated.View>
  );
}

interface FilterBarProps {
  active: PaymentFilter;
  onSelect: (key: PaymentFilter) => void;
}

function FilterBar({ active, onSelect }: FilterBarProps) {
  const theme = useTheme();

  return (
    <View style={styles.filterContainer}>
      <Text
        style={[
          styles.sectionTitle,
          {
            color: theme.colors.textMain,
            fontFamily: theme.fontFamily.semibold,
            fontSize: theme.fontSize.lg,
          },
        ]}
      >
        결제 내역
      </Text>
      <View style={styles.filterRow}>
        {FILTER_OPTIONS.map((option) => {
          const isActive = active === option.key;
          return (
            <Pressable
              key={option.key}
              onPress={() => onSelect(option.key)}
              style={[
                styles.filterChip,
                {
                  backgroundColor: isActive
                    ? theme.colors.primary
                    : theme.colors.surface,
                  borderColor: isActive
                    ? theme.colors.primary
                    : theme.colors.border,
                  borderRadius: theme.borderRadius.full,
                },
              ]}
              accessibilityRole="button"
              accessibilityState={{ selected: isActive }}
              accessibilityLabel={`${option.label} 필터`}
            >
              <Text
                style={{
                  color: isActive
                    ? theme.colors.textOnPrimary
                    : theme.colors.textSecondary,
                  fontFamily: isActive
                    ? theme.fontFamily.semibold
                    : theme.fontFamily.medium,
                  fontSize: theme.fontSize.sm,
                }}
              >
                {option.label}
              </Text>
            </Pressable>
          );
        })}
      </View>
    </View>
  );
}

interface PaymentListItemProps {
  item: PaymentItem;
  index: number;
  onPress: () => void;
}

function PaymentListItem({ item, index, onPress }: PaymentListItemProps) {
  const theme = useTheme();
  const badge = STATUS_BADGE_MAP[item.status] ?? {
    label: item.status,
    variant: 'gray' as const,
  };

  return (
    <Animated.View entering={FadeInDown.delay(index * 40).duration(300)}>
      <Pressable
        onPress={onPress}
        style={({ pressed }) => [
          styles.paymentItem,
          {
            backgroundColor: pressed
              ? theme.colors.accentSoft
              : theme.colors.surface,
            borderRadius: theme.borderRadius.lg,
          },
        ]}
        accessibilityRole="button"
        accessibilityLabel={`${item.paymentDate} 결제 ${formatCurrency(item.amount)}`}
      >
        <View style={styles.paymentItemLeft}>
          <Text
            style={{
              color: theme.colors.textTertiary,
              fontFamily: theme.fontFamily.regular,
              fontSize: theme.fontSize.xs,
            }}
          >
            {item.paymentDate}
          </Text>
          <Text
            style={{
              color: theme.colors.textMain,
              fontFamily: theme.fontFamily.medium,
              fontSize: theme.fontSize.base,
              marginTop: 2,
            }}
            numberOfLines={1}
          >
            {item.description || item.packageName || '상담 결제'}
          </Text>
        </View>
        <View style={styles.paymentItemRight}>
          <Text
            style={{
              color: theme.colors.textMain,
              fontFamily: theme.fontFamily.semibold,
              fontSize: theme.fontSize.base,
            }}
          >
            {formatCurrency(item.amount)}
          </Text>
          <View style={styles.paymentItemMeta}>
            <Badge label={badge.label} variant={badge.variant} size="sm" />
            <ChevronRight
              size={16}
              color={theme.colors.gray[400]}
              style={styles.chevron}
            />
          </View>
        </View>
      </Pressable>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
  },
  skeletonContainer: {
    padding: 16,
    gap: 12,
  },
  skeletonCard: {
    marginTop: 8,
  },
  listContent: {
    paddingBottom: 32,
  },
  balanceCardWrapper: {
    paddingHorizontal: 16,
    paddingTop: 8,
    paddingBottom: 4,
  },
  balanceCard: {
    padding: 24,
  },
  balanceHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  balanceLabel: {},
  balanceNumber: {
    marginTop: 8,
  },
  balanceUnit: {},
  progressContainer: {
    marginTop: 16,
  },
  progressTrack: {
    height: 6,
    borderRadius: 3,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    borderRadius: 3,
  },
  progressText: {
    marginTop: 6,
  },
  balanceActions: {
    flexDirection: 'row',
    gap: 10,
    marginTop: 20,
  },
  extendButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    gap: 6,
  },
  extendButtonText: {},
  historyButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    borderWidth: 1,
    gap: 6,
  },
  historyButtonText: {},
  filterContainer: {
    paddingHorizontal: 16,
    paddingTop: 24,
    paddingBottom: 8,
  },
  sectionTitle: {
    marginBottom: 12,
  },
  filterRow: {
    flexDirection: 'row',
    gap: 8,
  },
  filterChip: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderWidth: 1,
  },
  paymentItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    marginHorizontal: 16,
    marginTop: 8,
  },
  paymentItemLeft: {
    flex: 1,
    marginRight: 12,
  },
  paymentItemRight: {
    alignItems: 'flex-end',
  },
  paymentItemMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 4,
  },
  chevron: {
    marginLeft: 4,
  },
  footerLoading: {
    padding: 16,
  },
  listLoading: {
    paddingHorizontal: 16,
    gap: 8,
  },
});
