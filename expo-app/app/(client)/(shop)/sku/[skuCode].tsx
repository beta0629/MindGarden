/**
 * ShopSkuDetail — SKU 상세 PDP (Phase 2a)
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
import { useLocalSearchParams, useRouter } from 'expo-router';
import * as Haptics from 'expo-haptics';
import { Coins } from 'lucide-react-native';
import { useTheme } from '@/theme';
import { AppTopBar } from '@/components/templates/AppTopBar';
import { AccentBar } from '@/components/shop/atoms/AccentBar';
import { PriceText } from '@/components/shop/atoms/PriceText';
import { ShopSkuThumbnail } from '@/components/shop/molecules/ShopSkuThumbnail';
import { useClientShopCatalogSku } from '@/api/hooks/useClientShopOrders';
import { useClientShopCart } from '@/api/hooks/useClientShopCart';
import {
  CLIENT_SHOP_ROUTES,
  CLIENT_SHOP_TEST_IDS,
  SHOP_CATEGORY_TABS,
  normalizeShopCatalogCategory,
} from '@/constants/clientShopConstants';
import { mergeCartLine } from '@/utils/clientShopCart';
import { extractApiErrorMessage } from '@/utils/extractApiErrorMessage';
import { toDisplayString } from '@/utils/toDisplayString';

export default function ShopSkuDetailScreen() {
  const theme = useTheme();
  const router = useRouter();
  const { skuCode } = useLocalSearchParams<{ skuCode: string }>();
  const codeParam = typeof skuCode === 'string' ? skuCode : '';

  const { sku, isLoading, isRefetching, refetch } = useClientShopCatalogSku(codeParam);
  const { replaceCart, isReplacing, refetch: refetchCart } = useClientShopCart();
  const [message, setMessage] = useState('');

  const loading = isLoading || isReplacing;

  const handleRefresh = useCallback(async () => {
    await refetch();
  }, [refetch]);

  const navigateCatalog = () => {
    router.push(CLIENT_SHOP_ROUTES.CATALOG);
  };

  const handleAddToCart = async () => {
    if (!sku?.skuCode) {
      return;
    }
    try {
      setMessage('');
      const cartRes = await refetchCart();
      const lines = mergeCartLine(cartRes.data?.lines, sku.skuCode, 1);
      await replaceCart(lines);
      if (Platform.OS !== 'web') {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      }
      router.push(CLIENT_SHOP_ROUTES.CART);
    } catch (e) {
      setMessage(extractApiErrorMessage(e, '장바구니에 담지 못했습니다.'));
    }
  };

  return (
    <SafeAreaView
      style={[styles.safe, { backgroundColor: theme.colors.bgMain }]}
      edges={['top']}
    >
      <AppTopBar title="상품 상세" canGoBack />

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
        <Pressable
          onPress={navigateCatalog}
          style={styles.backLink}
          accessibilityRole="link"
          accessibilityLabel="상품 목록으로"
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
            ← 상품 목록
          </Text>
        </Pressable>

        {loading && !sku ? (
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
              styles.messageError,
              { color: theme.colors.error, fontFamily: theme.fontFamily.regular },
            ]}
            accessibilityRole="alert"
          >
            {message}
          </Text>
        ) : null}

        {!loading && !sku && codeParam ? (
          <Text
            style={[
              styles.message,
              styles.messageError,
              { color: theme.colors.error, fontFamily: theme.fontFamily.regular },
            ]}
            accessibilityRole="alert"
          >
            상품을 찾을 수 없거나 노출되지 않습니다.
          </Text>
        ) : null}

        {sku ? (
          <View
            style={[
              styles.pdp,
              {
                backgroundColor: theme.colors.surface,
                borderColor: theme.colors.border,
                borderRadius: theme.borderRadius.lg,
              },
            ]}
            accessibilityLabel={`상품 ${sku.title}`}
            testID={CLIENT_SHOP_TEST_IDS.PDP}
          >
            <ShopSkuThumbnail thumbnailUrl={sku.thumbnailUrl} variant="hero" />
            <View style={styles.pdpInner}>
              <AccentBar />
              <View style={styles.pdpBody}>
              <Text
                style={[
                  styles.categoryBadge,
                  {
                    color: theme.colors.textSecondary,
                    fontFamily: theme.fontFamily.medium,
                    fontSize: theme.fontSize.sm,
                  },
                ]}
              >
                {SHOP_CATEGORY_TABS.find(
                  (tab) => tab.key === normalizeShopCatalogCategory(sku.catalogCategory),
                )?.label ?? sku.catalogCategory}
              </Text>
              <Text
                style={[
                  styles.title,
                  {
                    color: theme.colors.textMain,
                    fontFamily: theme.fontFamily.semibold,
                    fontSize: theme.fontSize.lg,
                  },
                ]}
              >
                {toDisplayString(sku.title, '상품')}
              </Text>
              {sku.descriptionText ? (
                <Text
                  style={[
                    styles.desc,
                    {
                      color: theme.colors.textSecondary,
                      fontFamily: theme.fontFamily.regular,
                      fontSize: theme.fontSize.base,
                    },
                  ]}
                >
                  {sku.descriptionText}
                </Text>
              ) : null}
              <View style={styles.priceRow}>
                <PriceText amountMinor={sku.unitPriceMinor} currency={sku.currency} />
                <Coins
                  size={20}
                  color={theme.colors.accent}
                  accessibilityLabel="포인트 사용 가능"
                />
              </View>
              <Pressable
                onPress={handleAddToCart}
                disabled={loading}
                testID={CLIENT_SHOP_TEST_IDS.PDP_ADD_TO_CART}
                style={({ pressed }) => [
                  styles.cta,
                  {
                    backgroundColor: pressed ? theme.colors.primaryDark : theme.colors.primary,
                    borderRadius: theme.borderRadius.lg,
                    opacity: loading ? 0.5 : 1,
                  },
                ]}
                accessibilityRole="button"
                accessibilityLabel="장바구니에 담기"
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
                  장바구니에 담기
                </Text>
              </Pressable>
              </View>
            </View>
          </View>
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
  messageError: {},
  pdp: {
    marginHorizontal: 16,
    marginTop: 8,
    flexDirection: 'column',
    borderWidth: StyleSheet.hairlineWidth,
    overflow: 'hidden',
  },
  pdpInner: {
    flexDirection: 'row',
    flex: 1,
    minHeight: 0,
  },
  pdpBody: {
    flex: 1,
    padding: 16,
    gap: 10,
  },
  categoryBadge: {
    lineHeight: 20,
  },
  title: { lineHeight: 28 },
  desc: { lineHeight: 22 },
  priceRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 8,
    gap: 8,
  },
  cta: {
    marginTop: 16,
    minHeight: 48,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 16,
  },
  ctaText: { lineHeight: 22 },
});
