/**
 * ShopOrderDetail — 주문 상세 + 미결제 시 결제 준비 (Phase 2a)
 *
 * @author MindGarden
 * @since 2026-05-19
 */
import { useCallback, useState } from 'react';
import {
  ActivityIndicator,
  Linking,
  Platform,
  Pressable,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useLocalSearchParams, useRouter } from 'expo-router';
import * as Haptics from 'expo-haptics';
import { useTheme } from '@/theme';
import { AppTopBar } from '@/components/app-chrome/AppTopBar';
import { FulfillmentLineList } from '@/components/shop/molecules/FulfillmentLineList';
import { CheckoutSummary } from '@/components/shop/organisms/CheckoutSummary';
import {
  useClientShopOrder,
  useClientShopPreparePayment,
} from '@/api/hooks/useClientShopOrders';
import {
  CLIENT_SHOP_ROUTES,
  isShopOrderAwaitingPayment,
  SHOP_ORDER_STATUS_LABELS,
} from '@/constants/clientShopConstants';
import { formatShopMoney } from '@/utils/clientShopFormat';
import { toDisplayString } from '@/utils/toDisplayString';

export default function ShopOrderDetailScreen() {
  const theme = useTheme();
  const router = useRouter();
  const { orderPublicId } = useLocalSearchParams<{ orderPublicId: string }>();
  const orderId = typeof orderPublicId === 'string' ? orderPublicId : '';

  const orderQuery = useClientShopOrder(orderId);
  const prepareMutation = useClientShopPreparePayment();
  const [message, setMessage] = useState('');
  const [paymentUrl, setPaymentUrl] = useState('');

  const order = orderQuery.data ?? null;
  const awaitingPayment = isShopOrderAwaitingPayment(order);
  const lines = order?.lines ?? [];
  const loading = orderQuery.isLoading || prepareMutation.isPending;

  const handleRefresh = useCallback(async () => {
    await orderQuery.refetch();
  }, [orderQuery]);

  const handlePreparePayment = async () => {
    if (!orderId) {
      return;
    }
    try {
      setMessage('');
      const result = await prepareMutation.mutateAsync(orderId);
      if (result?.paymentUrl) {
        setPaymentUrl(result.paymentUrl);
        await Linking.openURL(result.paymentUrl);
      }
      setMessage('결제 페이지를 열었습니다. 완료 후 아래로 당겨 새로고침해 주세요.');
      await orderQuery.refetch();
    } catch (e) {
      const errMsg = e instanceof Error ? e.message : '결제 준비에 실패했습니다.';
      setMessage(errMsg);
    }
  };

  const handleOpenPaymentUrl = async () => {
    if (!paymentUrl) {
      return;
    }
    await Linking.openURL(paymentUrl);
  };

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
      <AppTopBar title="주문 상세" canGoBack />

      <ScrollView
        contentContainerStyle={styles.scroll}
        refreshControl={
          <RefreshControl
            refreshing={orderQuery.isRefetching && !orderQuery.isLoading}
            onRefresh={handleRefresh}
            tintColor={theme.colors.primary}
          />
        }
      >
        <Pressable
          onPress={navigateOrders}
          style={styles.backLink}
          accessibilityRole="link"
          accessibilityLabel="내 구매 목록으로"
        >
          <Text
            style={[
              styles.backLinkText,
              {
                color: theme.colors.primary,
                fontFamily: theme.fontFamily.medium,
                fontSize: theme.fontSize.sm,
              },
            ]}
          >
            ← 내 구매 목록
          </Text>
        </Pressable>

        {loading && !order ? (
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

        {message ? (
          <Text
            style={[
              styles.message,
              order ? styles.messageInfo : styles.messageError,
              {
                color: order ? theme.colors.textSecondary : theme.colors.error,
                fontFamily: theme.fontFamily.regular,
              },
            ]}
            accessibilityRole={order ? 'text' : 'alert'}
          >
            {message}
          </Text>
        ) : null}

        {!loading && !order && orderQuery.isFetched ? (
          <Text
            style={[
              styles.message,
              styles.messageError,
              { color: theme.colors.error, fontFamily: theme.fontFamily.regular },
            ]}
            accessibilityRole="alert"
          >
            주문을 찾을 수 없습니다.
          </Text>
        ) : null}

        {order ? (
          <>
            <View
              style={[
                styles.section,
                {
                  backgroundColor: theme.colors.surface,
                  borderColor: theme.colors.border,
                  borderRadius: theme.borderRadius.xl,
                },
              ]}
            >
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
                주문 정보
              </Text>
              <View style={styles.summaryRow}>
                <Text
                  style={[
                    styles.label,
                    { color: theme.colors.textSecondary, fontFamily: theme.fontFamily.regular },
                  ]}
                >
                  상태
                </Text>
                <Text
                  style={[
                    styles.value,
                    { color: theme.colors.textMain, fontFamily: theme.fontFamily.medium },
                  ]}
                >
                  {SHOP_ORDER_STATUS_LABELS[order.status] ?? order.status}
                </Text>
              </View>
              <View style={styles.summaryRow}>
                <Text
                  style={[
                    styles.label,
                    { color: theme.colors.textSecondary, fontFamily: theme.fontFamily.regular },
                  ]}
                >
                  주문 번호
                </Text>
                <Text
                  style={[
                    styles.value,
                    { color: theme.colors.textMain, fontFamily: theme.fontFamily.medium },
                  ]}
                >
                  {order.orderPublicId}
                </Text>
              </View>
            </View>

            <FulfillmentLineList fulfillmentLines={order.fulfillmentLines} />

            <View
              style={[
                styles.section,
                {
                  backgroundColor: theme.colors.surface,
                  borderColor: theme.colors.border,
                  borderRadius: theme.borderRadius.xl,
                },
              ]}
            >
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
                주문 상품
              </Text>
              {lines.length === 0 ? (
                <Text
                  style={[
                    styles.emptyLines,
                    { color: theme.colors.textSecondary, fontFamily: theme.fontFamily.regular },
                  ]}
                >
                  상품 정보가 없습니다.
                </Text>
              ) : (
                lines.map((line) => (
                  <View
                    key={`${line.lineNo}-${line.skuCode}`}
                    style={[styles.summaryRow, { borderTopColor: theme.colors.divider }]}
                  >
                    <Text
                      style={[
                        styles.lineTitle,
                        { color: theme.colors.textMain, fontFamily: theme.fontFamily.regular },
                      ]}
                      numberOfLines={2}
                    >
                      {toDisplayString(line.title, '상품')} × {line.quantity}
                    </Text>
                    <Text
                      style={[
                        styles.value,
                        { color: theme.colors.textMain, fontFamily: theme.fontFamily.medium },
                      ]}
                    >
                      {formatShopMoney(line.lineTotalMinor)}
                    </Text>
                  </View>
                ))
              )}
            </View>

            <CheckoutSummary
              subtotalMinor={order.subtotalMinor}
              pointsRedeemMinor={order.pointsRedeemMinor}
              cashDueMinor={order.cashDueMinor}
            />

            {awaitingPayment ? (
              <>
                <Pressable
                  onPress={handlePreparePayment}
                  disabled={loading}
                  style={({ pressed }) => [
                    styles.cta,
                    {
                      backgroundColor: pressed ? theme.colors.primaryDark : theme.colors.primary,
                      borderRadius: theme.borderRadius.lg,
                      opacity: loading ? 0.5 : 1,
                    },
                  ]}
                  accessibilityRole="button"
                  accessibilityLabel={`${formatShopMoney(order.cashDueMinor)} 결제하기`}
                >
                  <Text
                    style={[
                      styles.ctaText,
                      {
                        color: theme.colors.textOnPrimary,
                        fontFamily: theme.fontFamily.semibold,
                        fontSize: theme.fontSize.base,
                      },
                    ]}
                  >
                    {formatShopMoney(order.cashDueMinor)} 결제하기
                  </Text>
                </Pressable>
                {paymentUrl ? (
                  <Pressable
                    onPress={handleOpenPaymentUrl}
                    style={styles.paymentLink}
                    accessibilityRole="link"
                  >
                    <Text
                      style={[
                        styles.paymentLinkText,
                        {
                          color: theme.colors.primary,
                          fontFamily: theme.fontFamily.medium,
                          fontSize: theme.fontSize.sm,
                        },
                      ]}
                    >
                      결제 페이지 다시 열기
                    </Text>
                  </Pressable>
                ) : null}
              </>
            ) : null}
          </>
        ) : null}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1 },
  scroll: { paddingBottom: 32 },
  backLink: {
    marginHorizontal: 16,
    marginTop: 8,
    minHeight: 44,
    justifyContent: 'center',
  },
  backLinkText: { lineHeight: 20 },
  loadingWrap: {
    alignItems: 'center',
    paddingVertical: 32,
    gap: 12,
  },
  message: {
    marginHorizontal: 16,
    marginTop: 12,
    fontSize: 14,
    lineHeight: 20,
  },
  messageInfo: {},
  messageError: {},
  section: {
    marginHorizontal: 16,
    marginTop: 12,
    padding: 16,
    borderWidth: StyleSheet.hairlineWidth,
    gap: 10,
  },
  sectionTitle: { lineHeight: 22, marginBottom: 4 },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    gap: 12,
    paddingTop: 8,
  },
  label: { fontSize: 14, lineHeight: 20, flex: 1 },
  value: { fontSize: 14, lineHeight: 20, textAlign: 'right' },
  lineTitle: { fontSize: 14, lineHeight: 20, flex: 1 },
  emptyLines: { fontSize: 14, lineHeight: 20 },
  cta: {
    marginHorizontal: 16,
    marginTop: 16,
    minHeight: 48,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 16,
  },
  ctaText: { lineHeight: 22 },
  paymentLink: {
    marginHorizontal: 16,
    marginTop: 12,
    minHeight: 44,
    justifyContent: 'center',
  },
  paymentLinkText: { lineHeight: 20 },
});
