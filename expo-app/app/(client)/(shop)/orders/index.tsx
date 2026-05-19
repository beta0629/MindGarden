/**
 * ShopOrders — 내 구매 목록 (Phase 2a)
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
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import * as Haptics from 'expo-haptics';
import { useTheme } from '@/theme';
import { AppTopBar } from '@/components/templates/AppTopBar';
import { EmptyState } from '@/components/atoms/EmptyState';
import { useClientShopOrders } from '@/api/hooks/useClientShopOrders';
import {
  buildShopOrderDetailPath,
  CLIENT_SHOP_ROUTES,
  SHOP_ORDER_STATUS_LABELS,
} from '@/constants/clientShopConstants';
import {
  formatShopDateTime,
  formatShopMoney,
  formatShopPoints,
} from '@/utils/clientShopFormat';

export default function ShopOrdersScreen() {
  const theme = useTheme();
  const router = useRouter();
  const ordersQuery = useClientShopOrders(0, 20);
  const orders = ordersQuery.data ?? [];

  const handleRefresh = useCallback(async () => {
    await ordersQuery.refetch();
  }, [ordersQuery]);

  const navigateDetail = (orderPublicId: string) => {
    if (Platform.OS !== 'web') {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
    router.push(buildShopOrderDetailPath(orderPublicId) as never);
  };

  const navigateCatalog = () => {
    router.push(CLIENT_SHOP_ROUTES.CATALOG);
  };

  return (
    <SafeAreaView
      style={[styles.safe, { backgroundColor: theme.colors.bgMain }]}
      edges={['top']}
    >
      <AppTopBar title="내 구매" canGoBack />

      <ScrollView
        contentContainerStyle={styles.scroll}
        refreshControl={
          <RefreshControl
            refreshing={ordersQuery.isRefetching && !ordersQuery.isLoading}
            onRefresh={handleRefresh}
            tintColor={theme.colors.primary}
          />
        }
      >
        {ordersQuery.isError ? (
          <Text
            style={[
              styles.message,
              styles.messageError,
              { color: theme.colors.error, fontFamily: theme.fontFamily.regular },
            ]}
            accessibilityRole="alert"
          >
            {ordersQuery.error instanceof Error
              ? ordersQuery.error.message
              : '주문 목록을 불러오지 못했습니다.'}
          </Text>
        ) : null}

        {ordersQuery.isLoading && orders.length === 0 ? (
          <View style={styles.loadingWrap}>
            <ActivityIndicator color={theme.colors.primary} />
            <Text
              style={[
                styles.message,
                { color: theme.colors.textSecondary, fontFamily: theme.fontFamily.regular },
              ]}
            >
              불러오는 중…
            </Text>
          </View>
        ) : null}

        {!ordersQuery.isLoading && orders.length === 0 ? (
          <EmptyState
            title="주문 내역이 없습니다"
            description="쇼핑몰에서 주문하면 여기에 표시됩니다."
            actionLabel="상품 보러 가기"
            onAction={navigateCatalog}
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
            {orders.map((order, index) => {
              const statusLabel = SHOP_ORDER_STATUS_LABELS[order.status] ?? order.status;
              const isLast = index === orders.length - 1;
              return (
                <Pressable
                  key={order.orderPublicId}
                  onPress={() => navigateDetail(order.orderPublicId)}
                  style={({ pressed }) => [
                    styles.orderCard,
                    {
                      borderBottomColor: theme.colors.divider,
                      borderBottomWidth: isLast ? 0 : StyleSheet.hairlineWidth,
                      backgroundColor: pressed ? theme.colors.bgSub : theme.colors.surface,
                    },
                  ]}
                  accessibilityRole="button"
                  accessibilityLabel={`주문 ${order.orderPublicId}, ${statusLabel}`}
                >
                  <View style={styles.orderMain}>
                    <Text
                      style={[
                        styles.status,
                        {
                          color: theme.colors.textMain,
                          fontFamily: theme.fontFamily.semibold,
                          fontSize: theme.fontSize.base,
                        },
                      ]}
                    >
                      {statusLabel}
                    </Text>
                    <Text
                      style={[
                        styles.orderId,
                        {
                          color: theme.colors.textSecondary,
                          fontFamily: theme.fontFamily.regular,
                          fontSize: theme.fontSize.sm,
                        },
                      ]}
                    >
                      주문 {order.orderPublicId}
                    </Text>
                    {order.createdAt ? (
                      <Text
                        style={[
                          styles.date,
                          {
                            color: theme.colors.textSecondary,
                            fontFamily: theme.fontFamily.regular,
                            fontSize: theme.fontSize.xs,
                          },
                        ]}
                      >
                        {formatShopDateTime(order.createdAt)}
                      </Text>
                    ) : null}
                  </View>
                  <View style={styles.orderAmount}>
                    {order.pointsRedeemMinor > 0 ? (
                      <Text
                        style={[
                          styles.points,
                          {
                            color: theme.colors.textMain,
                            fontFamily: theme.fontFamily.medium,
                            fontSize: theme.fontSize.sm,
                          },
                        ]}
                      >
                        - {formatShopPoints(order.pointsRedeemMinor)}
                      </Text>
                    ) : null}
                    <Text
                      style={[
                        styles.cash,
                        {
                          color: theme.colors.primary,
                          fontFamily: theme.fontFamily.semibold,
                          fontSize: theme.fontSize.base,
                        },
                      ]}
                    >
                      {formatShopMoney(order.cashDueMinor ?? order.subtotalMinor)}
                    </Text>
                  </View>
                </Pressable>
              );
            })}
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1 },
  scroll: { paddingBottom: 32 },
  message: {
    marginHorizontal: 16,
    marginTop: 12,
    fontSize: 14,
    lineHeight: 20,
  },
  messageError: {},
  loadingWrap: {
    alignItems: 'center',
    paddingVertical: 32,
    gap: 12,
  },
  empty: { marginTop: 24 },
  list: {
    marginHorizontal: 16,
    marginTop: 8,
    borderWidth: StyleSheet.hairlineWidth,
    overflow: 'hidden',
  },
  orderCard: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    paddingVertical: 14,
    paddingHorizontal: 16,
    gap: 12,
    minHeight: 44,
  },
  orderMain: { flex: 1, gap: 4 },
  orderAmount: { alignItems: 'flex-end', gap: 4 },
  status: { lineHeight: 22 },
  orderId: { lineHeight: 20 },
  date: { lineHeight: 18 },
  points: { lineHeight: 20 },
  cash: { lineHeight: 22 },
});
