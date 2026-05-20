/**
 * ShopCart — 장바구니
 *
 * @author MindGarden
 * @since 2026-05-19
 */
import { useCallback, useState } from 'react';
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
import { AppTopBar } from '@/components/app-chrome/AppTopBar';
import { EmptyState } from '@/components/atoms/EmptyState';
import { PriceText } from '@/components/shop/atoms/PriceText';
import { useClientShopCart } from '@/api/hooks/useClientShopCart';
import { mergeCartLine } from '@/utils/clientShopCart';
import { formatShopMoney } from '@/utils/clientShopFormat';
import { CLIENT_SHOP_ROUTES } from '@/constants/clientShopConstants';
import { toDisplayString } from '@/utils/toDisplayString';

export default function ShopCartScreen() {
  const theme = useTheme();
  const router = useRouter();
  const [message, setMessage] = useState('');

  const { data: cart, isLoading, isRefetching, refetch, replaceCart, isReplacing } =
    useClientShopCart();

  const lines = cart?.lines ?? [];
  const subtotalMinor = cart?.subtotalMinor ?? 0;
  const isEmpty = lines.length === 0;
  const loading = isLoading || isReplacing;

  const handleRefresh = useCallback(async () => {
    await refetch();
  }, [refetch]);

  const updateQuantity = async (skuCode: string, delta: number) => {
    try {
      setMessage('');
      const nextLines = mergeCartLine(lines, skuCode, delta);
      await replaceCart(nextLines);
    } catch (e) {
      const errMsg = e instanceof Error ? e.message : '수량 변경에 실패했습니다.';
      setMessage(errMsg);
    }
  };

  const goCheckout = () => {
    if (Platform.OS !== 'web') {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
    router.push(CLIENT_SHOP_ROUTES.CHECKOUT);
  };

  const goCatalog = () => {
    router.push(CLIENT_SHOP_ROUTES.CATALOG);
  };

  return (
    <SafeAreaView
      style={[styles.safe, { backgroundColor: theme.colors.bgMain }]}
      edges={['top']}
    >
      <AppTopBar title="장바구니" canGoBack />

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
        {message ? (
          <Text
            style={[
              styles.message,
              { color: theme.colors.error, fontFamily: theme.fontFamily.regular },
            ]}
            accessibilityRole="alert"
          >
            {message}
          </Text>
        ) : null}

        {loading && isEmpty ? (
          <View style={styles.loadingWrap}>
            <ActivityIndicator color={theme.colors.primary} />
          </View>
        ) : null}

        {isEmpty && !loading ? (
          <EmptyState
            title="장바구니가 비어 있습니다"
            description="원하는 상품을 담아 보세요."
            actionLabel="상품 보러 가기"
            onAction={goCatalog}
            style={styles.empty}
          />
        ) : null}

        {!isEmpty ? (
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
              {lines.map((line) => (
                <View
                  key={line.skuCode}
                  style={[styles.line, { borderBottomColor: theme.colors.divider }]}
                >
                  <View style={styles.lineInfo}>
                    <Text
                      style={[
                        styles.lineTitle,
                        {
                          color: theme.colors.textMain,
                          fontFamily: theme.fontFamily.semibold,
                          fontSize: theme.fontSize.base,
                        },
                      ]}
                    >
                      {toDisplayString(line.title, line.skuCode)}
                    </Text>
                    <PriceText amountMinor={line.unitPriceMinor} />
                  </View>
                  <View style={styles.qtyRow}>
                    <Pressable
                      onPress={() => updateQuantity(line.skuCode, -1)}
                      disabled={loading}
                      style={({ pressed }) => [
                        styles.qtyBtn,
                        {
                          borderColor: theme.colors.border,
                          backgroundColor: pressed ? theme.colors.accentSoft : theme.colors.surface,
                          opacity: loading ? 0.5 : 1,
                        },
                      ]}
                      accessibilityRole="button"
                      accessibilityLabel="수량 감소"
                    >
                      <Text style={{ color: theme.colors.textMain, fontSize: 18 }}>−</Text>
                    </Pressable>
                    <Text
                      style={[
                        styles.qtyText,
                        {
                          color: theme.colors.textMain,
                          fontFamily: theme.fontFamily.medium,
                        },
                      ]}
                    >
                      {line.quantity}
                    </Text>
                    <Pressable
                      onPress={() => updateQuantity(line.skuCode, 1)}
                      disabled={loading}
                      style={({ pressed }) => [
                        styles.qtyBtn,
                        {
                          borderColor: theme.colors.border,
                          backgroundColor: pressed ? theme.colors.accentSoft : theme.colors.surface,
                          opacity: loading ? 0.5 : 1,
                        },
                      ]}
                      accessibilityRole="button"
                      accessibilityLabel="수량 증가"
                    >
                      <Text style={{ color: theme.colors.textMain, fontSize: 18 }}>+</Text>
                    </Pressable>
                  </View>
                  <Text
                    style={[
                      styles.lineTotal,
                      {
                        color: theme.colors.textMain,
                        fontFamily: theme.fontFamily.semibold,
                        fontSize: theme.fontSize.base,
                      },
                    ]}
                  >
                    {formatShopMoney(line.lineTotalMinor)}
                  </Text>
                </View>
              ))}
            </View>

            <View style={styles.summaryRow}>
              <Text
                style={[
                  styles.summaryLabel,
                  {
                    color: theme.colors.textMain,
                    fontFamily: theme.fontFamily.semibold,
                    fontSize: theme.fontSize.lg,
                  },
                ]}
              >
                합계
              </Text>
              <Text
                style={[
                  styles.summaryValue,
                  {
                    color: theme.colors.primary,
                    fontFamily: theme.fontFamily.bold,
                    fontSize: theme.fontSize.xl,
                  },
                ]}
              >
                {formatShopMoney(subtotalMinor)}
              </Text>
            </View>

            <Pressable
              onPress={goCheckout}
              disabled={loading}
              style={({ pressed }) => [
                styles.checkoutBtn,
                {
                  backgroundColor: pressed ? theme.colors.primaryDark : theme.colors.primary,
                  borderRadius: theme.borderRadius.lg,
                  opacity: loading ? 0.6 : 1,
                },
              ]}
              accessibilityRole="button"
              accessibilityLabel="결제하기"
            >
              <Text
                style={[
                  styles.checkoutText,
                  {
                    color: theme.colors.textOnPrimary,
                    fontFamily: theme.fontFamily.semibold,
                    fontSize: theme.fontSize.base,
                  },
                ]}
              >
                결제하기
              </Text>
            </Pressable>
          </>
        ) : null}
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
  loadingWrap: {
    paddingVertical: 48,
    alignItems: 'center',
  },
  empty: { marginTop: 24 },
  section: {
    marginHorizontal: 16,
    marginTop: 12,
    borderWidth: StyleSheet.hairlineWidth,
    overflow: 'hidden',
  },
  line: {
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderBottomWidth: StyleSheet.hairlineWidth,
    gap: 10,
  },
  lineInfo: { gap: 4 },
  lineTitle: { lineHeight: 22 },
  qtyRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  qtyBtn: {
    minWidth: 44,
    minHeight: 44,
    borderWidth: StyleSheet.hairlineWidth,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  qtyText: {
    minWidth: 28,
    textAlign: 'center',
    fontSize: 16,
  },
  lineTotal: {
    alignSelf: 'flex-end',
    lineHeight: 22,
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginHorizontal: 16,
    marginTop: 20,
    paddingHorizontal: 4,
  },
  summaryLabel: { lineHeight: 28 },
  summaryValue: { lineHeight: 32 },
  checkoutBtn: {
    marginHorizontal: 16,
    marginTop: 16,
    minHeight: 48,
    alignItems: 'center',
    justifyContent: 'center',
  },
  checkoutText: { lineHeight: 22 },
});
