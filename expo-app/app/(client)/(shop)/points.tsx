/**
 * ShopPoints — 내 포인트 잔액·최근 원장
 *
 * @author MindGarden
 * @since 2026-05-19
 */
import { useCallback } from 'react';
import {
  ActivityIndicator,
  Platform,
  Pressable,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import * as Haptics from 'expo-haptics';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { useTheme } from '@/theme';
import { AppTopBar } from '@/components/app-chrome/AppTopBar';
import { EmptyState } from '@/components/atoms/EmptyState';
import { PointBalanceHeader } from '@/components/shop/organisms/PointBalanceHeader';
import { LedgerListItem } from '@/components/shop/molecules/LedgerListItem';
import { useClientShopPoints } from '@/api/hooks/useClientShopPoints';
import {
  buildShopOrderDetailPath,
  CLIENT_SHOP_ROUTES,
} from '@/constants/clientShopConstants';

export default function ShopPointsScreen() {
  const theme = useTheme();
  const router = useRouter();
  const { balance, ledger, isLoading, isRefetching, refetch } = useClientShopPoints();

  const handleRefresh = useCallback(async () => {
    await refetch();
  }, [refetch]);

  const navigateOrders = () => {
    if (Platform.OS !== 'web') {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
    router.push(CLIENT_SHOP_ROUTES.ORDERS);
  };

  return (
    <SafeAreaView
      style={[styles.safe, { backgroundColor: theme.colors.bgMain }]}
      edges={['top']}
    >
      <AppTopBar title="내 포인트" canGoBack />

      <ScrollView
        contentContainerStyle={styles.scroll}
        refreshControl={
          <RefreshControl
            refreshing={isRefetching && !isLoading}
            onRefresh={handleRefresh}
            tintColor={theme.colors.primary}
          />
        }
      >
        <PointBalanceHeader
          availableMinor={balance.availableMinor}
          heldMinor={balance.heldMinor}
        />

        <View style={styles.sectionHeader}>
          <View style={styles.sectionTitleRow}>
            <Text
              style={[
                styles.sectionTitle,
                {
                  color: theme.colors.textMain,
                  fontFamily: theme.fontFamily.semibold,
                  fontSize: theme.fontSize.base,
                },
              ]}
            >
              포인트 내역
            </Text>
            <Pressable
              onPress={navigateOrders}
              style={styles.ordersLink}
              accessibilityRole="link"
              accessibilityLabel="내 구매 전체 보기"
              hitSlop={8}
            >
              <Text
                style={[
                  styles.ordersLinkText,
                  {
                    color: theme.colors.primary,
                    fontFamily: theme.fontFamily.medium,
                    fontSize: theme.fontSize.sm,
                  },
                ]}
              >
                내 구매
              </Text>
            </Pressable>
          </View>
        </View>

        {isLoading && ledger.length === 0 ? (
          <View style={styles.loadingWrap}>
            <ActivityIndicator color={theme.colors.primary} />
            <Text
              style={[
                styles.loadingText,
                {
                  color: theme.colors.textSecondary,
                  fontFamily: theme.fontFamily.regular,
                  fontSize: theme.fontSize.sm,
                },
              ]}
            >
              불러오는 중…
            </Text>
          </View>
        ) : null}

        {!isLoading && ledger.length === 0 ? (
          <EmptyState
            title="포인트 내역이 없습니다"
            description="포인트 적립·사용 시 여기에 표시됩니다."
            style={styles.empty}
          />
        ) : (
          <View
            style={[
              styles.list,
              {
                backgroundColor: theme.colors.surface,
                borderColor: theme.colors.border,
                borderRadius: theme.borderRadius.xl,
              },
            ]}
          >
            {ledger.map((entry, index) => (
              <LedgerListItem
                key={`${entry.type}-${entry.createdAt ?? index}-${entry.orderPublicId ?? index}`}
                entry={entry}
                onPressDetail={
                  entry.orderPublicId
                    ? () =>
                        router.push(buildShopOrderDetailPath(entry.orderPublicId!) as never)
                    : undefined
                }
              />
            ))}
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1 },
  scroll: { paddingBottom: 32 },
  sectionHeader: {
    marginHorizontal: 16,
    marginTop: 8,
    marginBottom: 8,
    gap: 6,
  },
  sectionTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 8,
  },
  sectionTitle: { lineHeight: 22, flex: 1 },
  ordersLink: {
    minHeight: 44,
    justifyContent: 'center',
    paddingHorizontal: 4,
  },
  ordersLinkText: { lineHeight: 20 },
  loadingWrap: {
    alignItems: 'center',
    paddingVertical: 32,
    gap: 12,
  },
  loadingText: { lineHeight: 20 },
  empty: { marginTop: 16 },
  list: {
    marginHorizontal: 16,
    borderWidth: StyleSheet.hairlineWidth,
    overflow: 'hidden',
  },
});
