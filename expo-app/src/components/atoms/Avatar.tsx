/**
 * Avatar — 프로필 사진 또는 이니셜 표시 atom
 *
 * API 호스트의 보호된 이미지 URL은 별도 HTTP 요청이므로 Axios 인터셉터가 적용되지 않음.
 * 동일 API 오리진이면 Bearer·테넌트 헤더를 expo-image source에 포함한다.
 *
 * P0 핫픽스 (2026-06-09): BE 가 DB 에 저장하는 프로필 이미지 URL 은 상대 path
 * (`/api/v1/files/profile-images/...`) 이다. React Native 의 `expo-image` 는
 * origin 이 없는 상대 path 를 자동으로 보강하지 않으므로, 본 atom 에서
 * `getApiBaseUrl()` 을 prefix 하여 절대 URL 로 정규화한다.
 *
 * @author MindGarden
 * @since 2026-05-12
 */
import { useEffect, useMemo, useState } from 'react';
import { StyleSheet, Text, View, type ViewStyle, type ImageStyle } from 'react-native';
import { Image } from 'expo-image';
import { User } from 'lucide-react-native';
import { useTheme } from '@/theme';
import { getApiBaseUrl } from '@/config/apiBaseUrl';
import { resolveAvatarSourceUri } from '@/utils/resolveAvatarSourceUri';
import { useAuthStore } from '@/stores/useAuthStore';
import { useTenantStore } from '@/stores/useTenantStore';

/** 프로필 이미지가 우리 API와 같은 오리진이면 네이티브 Image 요청에도 인증이 필요할 수 있음 */
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

type AvatarSize = 'sm' | 'md' | 'lg' | 'xl';

const SIZE_MAP: Record<AvatarSize, number> = {
  sm: 32,
  md: 40,
  lg: 48,
  xl: 64,
};

interface AvatarProps {
  readonly uri?: string | null;
  readonly name?: string;
  readonly size?: AvatarSize;
  readonly style?: ViewStyle;
}

export function Avatar({ uri, name, size = 'md', style }: AvatarProps) {
  const theme = useTheme();
  const dimension = SIZE_MAP[size];
  const accessToken = useAuthStore((s) => s.accessToken);
  const tenantId = useTenantStore((s) => s.tenantId);
  const [imageLoadFailed, setImageLoadFailed] = useState(false);

  useEffect(() => {
    setImageLoadFailed(false);
  }, [uri]);

  const containerStyle: ViewStyle = {
    width: dimension,
    height: dimension,
    borderRadius: dimension / 2,
    backgroundColor: theme.colors.accentSoft,
    borderWidth: 1,
    borderColor: theme.colors.border,
  };

  const imageSource = useMemo(() => {
    if (!uri || imageLoadFailed) {
      return null;
    }
    const resolved = resolveAvatarSourceUri(uri, getApiBaseUrl());
    if (!resolved) {
      return null;
    }
    const needAuthHeaders = isSameOriginAsApi(resolved) && !!accessToken;
    if (needAuthHeaders) {
      const headers: Record<string, string> = {
        Authorization: `Bearer ${accessToken}`,
      };
      if (tenantId) {
        headers['X-Tenant-Id'] = tenantId;
      }
      return { uri: resolved, headers };
    }
    return { uri: resolved };
  }, [uri, accessToken, tenantId, imageLoadFailed]);

  if (imageSource) {
    return (
      <Image
        source={imageSource}
        style={[containerStyle as ImageStyle, style as ImageStyle]}
        contentFit="cover"
        transition={200}
        onError={() => setImageLoadFailed(true)}
        accessibilityLabel={name ? `${name} 프로필 사진` : '프로필 사진'}
      />
    );
  }

  const initial = name?.charAt(0)?.toUpperCase() ?? '';

  return (
    <View
      style={[containerStyle, styles.fallback, style]}
      accessibilityLabel={name ? `${name} 아바타` : '아바타'}
    >
      {initial ? (
        <Text
          style={{
            fontFamily: theme.fontFamily.semibold,
            fontSize: dimension * 0.4,
            color: theme.colors.textSecondary,
          }}
        >
          {initial}
        </Text>
      ) : (
        <User size={dimension * 0.5} color={theme.colors.textSecondary} />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  fallback: {
    alignItems: 'center',
    justifyContent: 'center',
  },
});
