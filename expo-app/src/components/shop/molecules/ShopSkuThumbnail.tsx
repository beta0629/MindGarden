/**
 * ShopSkuThumbnail — PLP·PDP 1:1 상품 이미지 (expo-image)
 *
 * @author MindGarden
 * @since 2026-05-19
 */
import { useEffect, useMemo, useState } from 'react';
import { StyleSheet, View, type ImageStyle, type ViewStyle } from 'react-native';
import { Image } from 'expo-image';
import { ImageIcon } from 'lucide-react-native';
import { useTheme } from '@/theme';
import { getApiBaseUrl } from '@/config/apiBaseUrl';
import { CLIENT_SHOP_TEST_IDS } from '@/constants/clientShopConstants';
import { useAuthStore } from '@/stores/useAuthStore';
import { useTenantStore } from '@/stores/useTenantStore';

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

export type ShopSkuThumbnailVariant = 'card' | 'hero';

interface ShopSkuThumbnailProps {
  readonly thumbnailUrl?: string | null;
  readonly variant?: ShopSkuThumbnailVariant;
  readonly testID?: string;
  readonly style?: ViewStyle;
}

export function ShopSkuThumbnail({
  thumbnailUrl,
  variant = 'card',
  testID = CLIENT_SHOP_TEST_IDS.SKU_CARD_THUMBNAIL,
  style,
}: ShopSkuThumbnailProps) {
  const theme = useTheme();
  const accessToken = useAuthStore((s) => s.accessToken);
  const tenantId = useTenantStore((s) => s.tenantId);
  const [imageFailed, setImageFailed] = useState(false);

  useEffect(() => {
    setImageFailed(false);
  }, [thumbnailUrl]);

  const imageSource = useMemo(() => {
    if (!thumbnailUrl || imageFailed) {
      return null;
    }
    const u = String(thumbnailUrl).trim();
    if (!u) {
      return null;
    }
    const needAuthHeaders = isSameOriginAsApi(u) && !!accessToken;
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
  }, [thumbnailUrl, accessToken, tenantId, imageFailed]);

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
          onError={() => setImageFailed(true)}
        />
      ) : (
        <View
          style={[styles.placeholder, { backgroundColor: theme.colors.surface }]}
          accessibilityElementsHidden
          importantForAccessibility="no-hide-descendants"
        >
          <ImageIcon
            size={variant === 'hero' ? 40 : 28}
            color={theme.colors.textSecondary}
          />
        </View>
      )}
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
  placeholder: {
    flex: 1,
    width: '100%',
    alignItems: 'center',
    justifyContent: 'center',
  },
});
