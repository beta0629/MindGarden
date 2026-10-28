/**
 * ShopPaymentReturn — PortOne redirect 복귀 후 BE verify (P0 money).
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
import { fetchShopOrderForPayment } from '@/api/shopPayment';
import {
  buildShopOrderDetailPath,
  buildShopPaymentCompletePath,
  CLIENT_SHOP_ROUTES,
  SHOP_CHECKOUT_ERROR_COPY,
  SHOP_PAYMENT_RETURN_COPY,
} from '@/constants/clientShopConstants';
import {
  parseShopPaymentReturnQuery,
  resolveShopPaymentReturnPaymentId,
  resolveShopPaymentVerifyAmount,
} from '@/utils/clientShopPaymentReturn';
import { isPortOneUserCancel, resolvePortOneFailureReason } from '@/utils/shopPaymentCancel';
import { clearShopPendingPaymentVerify } from '@/utils/shopPendingPaymentVerify';
import { verifyShopPaymentWithRetry } from '@/utils/shopPaymentVerifyRetry';

export default function ShopPaymentReturnScreen() {
  const theme = useTheme();
  const router = useRouter();
  const params = useLocalSearchParams<{
    paymentId?: string;
    orderPublicId?: string;
    code?: string;
    message?: string;
    pgCode?: string;
    pgMessage?: string;
  }>();
  const [message, setMessage] = useState(SHOP_PAYMENT_RETURN_COPY.VERIFYING);
  const [error, setError] = useState(false);
  const [orderPublicId, setOrderPublicId] = useState<string | null>(null);
  const ranRef = useRef(false);

  useEffect(() => {
    if (ranRef.current) {
      return;
    }
    ranRef.current = true;

    const run = async () => {
      const query = parseShopPaymentReturnQuery(params);
      setOrderPublicId(query.orderPublicId);

      if (
        isPortOneUserCancel({
          code: query.code,
          pgCode: typeof params.pgCode === 'string' ? params.pgCode : null,
          message: query.message,
        })
      ) {
        setError(true);
        setMessage('결제가 취소되었습니다.');
        return;
      }

      if (query.code) {
        setError(true);
        setMessage(
          resolvePortOneFailureReason(
            {
              message: query.message,
              pgMessage: typeof params.pgMessage === 'string' ? params.pgMessage : null,
            },
            SHOP_CHECKOUT_ERROR_COPY.PAYMENT_LAUNCH_FAILED,
          ),
        );
        return;
      }

      const paymentId = resolveShopPaymentReturnPaymentId(query);
      if (!paymentId) {
        setError(true);
        setMessage(SHOP_PAYMENT_RETURN_COPY.MISSING_PAYMENT_ID);
        return;
      }

      setMessage(SHOP_PAYMENT_RETURN_COPY.VERIFYING);
      setError(false);

      try {
        const amount = await resolveShopPaymentVerifyAmount({
          paymentId,
          orderPublicId: query.orderPublicId,
          fetchOrder: fetchShopOrderForPayment,
        });
        await verifyShopPaymentWithRetry(paymentId, amount);
        clearShopPendingPaymentVerify();
        const detailId = query.orderPublicId;
        if (detailId) {
          router.replace(buildShopPaymentCompletePath(detailId));
          return;
        }
        router.replace(CLIENT_SHOP_ROUTES.ORDERS);
      } catch (e) {
        setError(true);
        setMessage(
          (e instanceof Error && e.message) || SHOP_CHECKOUT_ERROR_COPY.VERIFY_FAILED,
        );
      }
    };

    void run();
  }, [params, router]);

  return (
    <SafeAreaView
      style={[styles.safe, { backgroundColor: theme.colors.bgMain }]}
      edges={['top']}
    >
      <AppTopBar title={SHOP_PAYMENT_RETURN_COPY.TITLE} canGoBack />
      <View style={styles.body}>
        {!error ? <ActivityIndicator color={theme.colors.primary} /> : null}
        <Text
          style={[
            styles.message,
            {
              color: error ? theme.colors.error : theme.colors.textSecondary,
              fontFamily: theme.fontFamily.regular,
            },
          ]}
          accessibilityRole="alert"
        >
          {message}
        </Text>
        {error && orderPublicId ? (
          <Pressable
            onPress={() => router.replace(buildShopOrderDetailPath(orderPublicId))}
            accessibilityRole="link"
            accessibilityLabel={SHOP_PAYMENT_RETURN_COPY.ORDER_LINK}
          >
            <Text
              style={{
                color: theme.colors.primary,
                fontFamily: theme.fontFamily.medium,
                marginTop: 16,
              }}
            >
              {SHOP_PAYMENT_RETURN_COPY.ORDER_LINK}
            </Text>
          </Pressable>
        ) : null}
        {error && !orderPublicId ? (
          <Pressable
            onPress={() => router.replace(CLIENT_SHOP_ROUTES.ORDERS)}
            accessibilityRole="link"
            accessibilityLabel={SHOP_PAYMENT_RETURN_COPY.ORDERS_LINK}
          >
            <Text
              style={{
                color: theme.colors.primary,
                fontFamily: theme.fontFamily.medium,
                marginTop: 16,
              }}
            >
              {SHOP_PAYMENT_RETURN_COPY.ORDERS_LINK}
            </Text>
          </Pressable>
        ) : null}
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1 },
  body: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 24,
  },
  message: {
    marginTop: 16,
    fontSize: 15,
    lineHeight: 22,
    textAlign: 'center',
  },
});
