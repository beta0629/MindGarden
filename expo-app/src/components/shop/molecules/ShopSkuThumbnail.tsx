/**
 * ShopSkuThumbnail — PLP·PDP 1:1 상품 이미지 (expo-image, 생성형 placeholder)
 *
 * @author MindGarden
 * @since 2026-05-19
 */
import { useEffect, useMemo, useState } from 'react';
import { StyleSheet, View, type ImageStyle, type ViewStyle } from 'react-native';
import { Image } from 'expo-image';
import { useTheme } from '@/theme';
import { getApiBaseUrl } from '@/config/apiBaseUrl';
import { CLIENT_SHOP_TEST_IDS } from '@/constants/clientShopConstants';
import { useAuthStore } from '@/stores/useAuthStore';
import { useTenantStore } from '@/stores/useTenantStore';
import {
  generateShopCatalogPlaceholderDataUri,
  resolveShopCatalogDisplayImageUrl,
  type ShopCatalogImageSku,
} from '@/utils/shopCatalogThumbnail';

const PUBLIC_API_FILES_PATH_PREFIX = '/api/v1/files';

function isSameOriginAsApi(uri: string): boolean {
  try {
    const base = getApiBaseUrl().replace(/\/$/, '');
    const apiOrigin = new URL(base.startsWith('http') ? base : `https://${base}`).origin;
    const imgOrigin = new URL(uri).origin;
    return apiOrigin === imgOrigin;
  } catch {
    return false;
  }
}

/** FileController 공개 경로 — Bearer 없이 로드 (TenantContextFilter 화이트리스트) */
function isPublicApiFileUrl(uri: string): boolean {
  try {
    const pathname = new URL(uri).pathname;
    return pathname.startsWith(PUBLIC_API_FILES_PATH_PREFIX);
  } catch {
    return uri.includes(PUBLIC_API_FILES_PATH_PREFIX);
  }
}

export type ShopSkuThumbnailVariant = 'card' | 'hero';

interface ShopSkuThumbnailProps {
  readonly sku?: ShopCatalogImageSku | null;
  readonly variant?: ShopSkuThumbnailVariant;
  readonly testID?: string;
  readonly style?: ViewStyle;
}

export function ShopSkuThumbnail({
  sku,
  variant = 'card',
  testID = CLIENT_SHOP_TEST_IDS.SKU_CARD_THUMBNAIL,
  style,
}: ShopSkuThumbnailProps) {
  const theme = useTheme();
  const accessToken = useAuthStore((s) => s.accessToken);
  const tenantId = useTenantStore((s) => s.tenantId);
  const [displayUri, setDisplayUri] = useState(() => resolveShopCatalogDisplayImageUrl(sku));

  const fallbackDataUri = useMemo(
    () =>
      generateShopCatalogPlaceholderDataUri({
        title: sku?.title,
        catalogCategory: sku?.catalogCategory,
      }),
    [sku?.title, sku?.catalogCategory],
  );

  useEffect(() => {
    setDisplayUri(resolveShopCatalogDisplayImageUrl(sku));
  }, [sku]);

  const imageSource = useMemo(() => {
    const u = String(displayUri || '').trim();
    if (!u) {
      return null;
    }
    if (u.startsWith('data:')) {
      return { uri: u };
    }
    const needAuthHeaders =
      isSameOriginAsApi(u) && !!accessToken && !isPublicApiFileUrl(u);
    if (needAuthHeaders) {
      const headers: Record<string, string> = {
        Authorization: `Bearer ${accessToken}`,
      };
      if (tenantId) {
        headers['X-Tenant-Id'] = tenantId;
      }
      return { uri: u, headers };
    }
    return { uri: u };
  }, [displayUri, accessToken, tenantId]);

  const handleError = () => {
    setDisplayUri(fallbackDataUri);
  };

  const placeholderBg = theme.colors.bgMain;

  return (
    <View
      style={[
        styles.wrapper,
        variant === 'hero' ? styles.wrapperHero : styles.wrapperCard,
        { backgroundColor: placeholderBg },
        style,
      ]}
      testID={testID}
      accessibilityRole="image"
      accessibilityLabel="상품 이미지"
    >
      {imageSource ? (
        <Image
          source={imageSource}
          style={styles.image as ImageStyle}
          contentFit="cover"
          transition={200}
          onError={handleError}
        />
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    width: '100%',
    overflow: 'hidden',
  },
  wrapperCard: {
    aspectRatio: 1,
  },
  wrapperHero: {
    aspectRatio: 1,
  },
  image: {
    width: '100%',
    height: '100%',
  },
});
