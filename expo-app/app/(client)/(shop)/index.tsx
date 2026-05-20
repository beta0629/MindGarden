/**
 * ShopCatalog — PLP (상품 목록)
 *
 * @author MindGarden
 * @since 2026-05-19
 */
import { useCallback, useMemo, useState } from 'react';
import {
  ActivityIndicator,
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
import * as Haptics from 'expo-haptics';
import { ShoppingBag, Coins } from 'lucide-react-native';
import { useTheme } from '@/theme';
import { AppTopBar } from '@/components/app-chrome/AppTopBar';
import { EmptyState } from '@/components/atoms/EmptyState';
import { ShopTenantBanner } from '@/components/shop/organisms/ShopTenantBanner';
import { ShopCategoryTabs } from '@/components/shop/molecules/ShopCategoryTabs';
import { SkuCard } from '@/components/shop/molecules/SkuCard';
import { useClientShopCatalog, type ShopCatalogSku } from '@/api/hooks/useClientShopCatalog';
import { useClientShopCart } from '@/api/hooks/useClientShopCart';
import { mergeCartLine } from '@/utils/clientShopCart';
import { extractApiErrorMessage } from '@/utils/extractApiErrorMessage';
import {
  buildShopSkuDetailPath,
  CLIENT_SHOP_ROUTES,
  CLIENT_SHOP_TEST_IDS,
  SHOP_CATALOG_CATEGORY,
  type ShopCatalogCategory,
} from '@/constants/clientShopConstants';
import { useTenantStore } from '@/stores/useTenantStore';

export default function ShopCatalogScreen() {
  const theme = useTheme();
  const router = useRouter();
  const tenantName = useTenantStore((s) => s.tenantName);
  const [activeCategory, setActiveCategory] = useState<ShopCatalogCategory>(
    SHOP_CATALOG_CATEGORY.CONSULTATION,
  );
  const [message, setMessage] = useState('');

  const catalogQuery = useClientShopCatalog();
  const { replaceCart, isReplacing, refetch: refetchCart } = useClientShopCart();

  const catalog = catalogQuery.data ?? [];

  const filteredCatalog = useMemo(
    () => catalog.filter((row) => row.catalogCategory === activeCategory),
    [catalog, activeCategory],
  );

  const handleRefresh = useCallback(async () => {
    await catalogQuery.refetch();
  }, [catalogQuery]);

  const handleAddToCart = useCallback(
    async (skuCode: string) => {
      try {
        setMessage('');
        const cartRes = await refetchCart();
        const lines = mergeCartLine(cartRes.data?.lines, skuCode, 1);
        await replaceCart(lines);
        router.push(CLIENT_SHOP_ROUTES.CART);
      } catch (e) {
        setMessage(extractApiErrorMessage(e, '장바구니에 담지 못했습니다.'));
      }
    },
    [refetchCart, replaceCart, router],
  );

  const navigatePoints = () => {
    if (Platform.OS !== 'web') {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
    router.push(CLIENT_SHOP_ROUTES.POINTS);
  };

  const navigateCart = () => {
    if (Platform.OS !== 'web') {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
    router.push(CLIENT_SHOP_ROUTES.CART);
  };

  const loading = catalogQuery.isLoading || isReplacing;

  const renderItem = useCallback(
    ({ item }: { item: ShopCatalogSku }) => (
      <View style={styles.listItem}>
        <SkuCard
          sku={item}
          loading={loading}
          onPressDetail={() => router.push(buildShopSkuDetailPath(item.skuCode) as never)}
          onAddToCart={() => handleAddToCart(item.skuCode)}
        />
      </View>
    ),
    [handleAddToCart, loading, router],
  );

  const listHeader = useMemo(
    () => (
      <View>
        <ShopTenantBanner tenantLabel={tenantName} />
        <ShopCategoryTabs activeKey={activeCategory} onChange={setActiveCategory} />

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

        {loading && catalog.length === 0 ? (
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
      </View>
    ),
    [
      activeCategory,
      catalog.length,
      loading,
      message,
      tenantName,
      theme.colors.error,
      theme.colors.primary,
      theme.colors.textSecondary,
      theme.fontFamily.regular,
    ],
  );

  const listEmpty = useMemo(() => {
    if (loading) {
      return null;
    }
    return (
      <EmptyState
        title="등록된 상품이 없습니다"
        description="이 카테고리에 노출된 상품이 없습니다."
        style={styles.empty}
      />
    );
  }, [loading]);

  return (
    <SafeAreaView
      style={[styles.safe, { backgroundColor: theme.colors.bgMain }]}
      edges={['top']}
      testID={CLIENT_SHOP_TEST_IDS.CATALOG_PAGE}
    >
      <AppTopBar
        title="상품 둘러보기"
        canGoBack
        rightAction={
          <View style={styles.topActions}>
            <Pressable
              onPress={navigatePoints}
              style={styles.iconBtn}
              accessibilityRole="button"
              accessibilityLabel="내 포인트"
              hitSlop={8}
            >
              <Coins size={22} color={theme.colors.textMain} />
            </Pressable>
            <Pressable
              onPress={navigateCart}
              style={styles.iconBtn}
              accessibilityRole="button"
              accessibilityLabel="장바구니"
              hitSlop={8}
            >
              <ShoppingBag size={22} color={theme.colors.textMain} />
            </Pressable>
          </View>
        }
      />

      <View style={styles.listContainer}>
        <FlashList
          data={filteredCatalog}
          renderItem={renderItem}
          keyExtractor={(item) => item.skuCode}
          contentContainerStyle={styles.listContent}
          ListHeaderComponent={listHeader}
          ListEmptyComponent={listEmpty}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl
              refreshing={catalogQuery.isRefetching && !catalogQuery.isLoading}
              onRefresh={handleRefresh}
              tintColor={theme.colors.primary}
            />
          }
        />
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
  },
  listContainer: {
    flex: 1,
  },
  listContent: {
    paddingBottom: 32,
    paddingHorizontal: 16,
  },
  listItem: {
    marginTop: 12,
  },
  topActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  iconBtn: {
    minWidth: 44,
    minHeight: 44,
    alignItems: 'center',
    justifyContent: 'center',
  },
  message: {
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
  empty: {
    marginTop: 24,
  },
});
