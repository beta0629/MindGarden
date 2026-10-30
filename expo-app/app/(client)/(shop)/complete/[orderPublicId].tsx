/**
 * ShopPaymentComplete — 결제 완료 확인 화면.
 *
 * @author MindGarden
 * @since 2026-05-20
 */
import { useEffect, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useTheme } from '@/theme';
import { AppTopBar } from '@/components/app-chrome/AppTopBar';
import { useClientShopOrder } from '@/api/hooks/useClientShopOrders';
import {
  buildShopOrderDetailPath,
  CLIENT_SHOP_ROUTES,
  SHOP_PAYMENT_COMPLETE_COPY,
} from '@/constants/clientShopConstants';
import { formatShopMoney } from '@/utils/clientShopFormat';
import { toDisplayString } from '@/utils/toDisplayString';

const PAID_STATUS = 'PAID';

export default function ShopPaymentCompleteScreen() {
  const theme = useTheme();
  const router = useRouter();
  const { orderPublicId } = useLocalSearchParams<{ orderPublicId: string }>();
  const orderId =
    typeof orderPublicId === 'string' ? decodeURIComponent(orderPublicId) : '';
  const orderQuery = useClientShopOrder(orderId);
  const [failed, setFailed] = useState(false);
  const ranRef = useRef(false);

  const order = orderQuery.data ?? null;

  useEffect(() => {
    if (orderQuery.isLoading || ranRef.current || !orderId) {
      return;
    }
    if (orderQuery.isError) {
      setFailed(true);
      return;
    }
    if (!order) {
      return;
    }
    ranRef.current = true;
    if (order.status !== PAID_STATUS) {
      router.replace(buildShopOrderDetailPath(orderId));
    }
  }, [order, orderId, orderQuery.isError, orderQuery.isLoading, router]);

  if (orderQuery.isLoading) {
    return (
      <SafeAreaView
        style={[styles.safe, { backgroundColor: theme.colors.bgMain }]}
        edges={['top']}
      >
        <AppTopBar title={SHOP_PAYMENT_COMPLETE_COPY.TITLE} canGoBack />
        <View style={styles.center}>
          <ActivityIndicator color={theme.colors.primary} />
          <Text
            style={{
              marginTop: 12,
              color: theme.colors.textSecondary,
              fontFamily: theme.fontFamily.regular,
            }}
          >
            {SHOP_PAYMENT_COMPLETE_COPY.LOADING}
          </Text>
        </View>
      </SafeAreaView>
    );
  }

  if (failed || !order || order.status !== PAID_STATUS) {
    return (
      <SafeAreaView
        style={[styles.safe, { backgroundColor: theme.colors.bgMain }]}
        edges={['top']}
      >
        <AppTopBar title={SHOP_PAYMENT_COMPLETE_COPY.TITLE} canGoBack />
        <View style={styles.center}>
          <Text
            style={{
              color: theme.colors.error,
              fontFamily: theme.fontFamily.regular,
              textAlign: 'center',
            }}
          >
            {SHOP_PAYMENT_COMPLETE_COPY.FAILED}
          </Text>
          {orderId ? (
            <Pressable
              onPress={() => router.replace(buildShopOrderDetailPath(orderId))}
              style={styles.link}
            >
              <Text style={{ color: theme.colors.primary, fontFamily: theme.fontFamily.medium }}>
                {SHOP_PAYMENT_COMPLETE_COPY.ORDER_DETAIL_CTA}
              </Text>
            </Pressable>
          ) : null}
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView
      style={[styles.safe, { backgroundColor: theme.colors.bgMain }]}
      edges={['top']}
    >
      <AppTopBar title={SHOP_PAYMENT_COMPLETE_COPY.TITLE} canGoBack />
      <View style={styles.body}>
        <Text
          style={[
            styles.title,
            {
              color: theme.colors.textMain,
              fontFamily: theme.fontFamily.semibold,
              fontSize: theme.fontSize.xl,
            },
          ]}
        >
          {SHOP_PAYMENT_COMPLETE_COPY.TITLE}
        </Text>
        <Text
          style={{
            color: theme.colors.textSecondary,
            fontFamily: theme.fontFamily.regular,
            marginTop: 8,
          }}
        >
          주문번호 {toDisplayString(order.orderPublicId, orderId)}
        </Text>
        <Text
          style={{
            color: theme.colors.textMain,
            fontFamily: theme.fontFamily.medium,
            marginTop: 16,
            fontSize: theme.fontSize.base,
          }}
        >
          결제 금액 {formatShopMoney(order.cashDueMinor)}
        </Text>

        <Pressable
          onPress={() => router.replace(CLIENT_SHOP_ROUTES.ORDERS)}
          style={({ pressed }) => [
            styles.cta,
            {
              backgroundColor: pressed ? theme.colors.primaryDark : theme.colors.primary,
              borderRadius: theme.borderRadius.lg,
            },
          ]}
          accessibilityRole="button"
          accessibilityLabel={SHOP_PAYMENT_COMPLETE_COPY.ORDERS_CTA}
        >
          <Text
            style={{
              color: theme.colors.textOnPrimary,
              fontFamily: theme.fontFamily.semibold,
              fontSize: theme.fontSize.base,
            }}
          >
            {SHOP_PAYMENT_COMPLETE_COPY.ORDERS_CTA}
          </Text>
        </Pressable>

        <Pressable
          onPress={() => router.replace(buildShopOrderDetailPath(orderId))}
          style={styles.link}
          accessibilityRole="link"
        >
          <Text style={{ color: theme.colors.primary, fontFamily: theme.fontFamily.medium }}>
            {SHOP_PAYMENT_COMPLETE_COPY.ORDER_DETAIL_CTA}
          </Text>
        </Pressable>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1 },
  center: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 24,
  },
  body: {
    paddingHorizontal: 24,
    paddingTop: 32,
  },
  title: {
    lineHeight: 32,
  },
  cta: {
    marginTop: 32,
    minHeight: 48,
    alignItems: 'center',
    justifyContent: 'center',
  },
  link: {
    marginTop: 16,
    minHeight: 44,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
