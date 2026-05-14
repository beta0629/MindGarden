/**
 * 앱 내 약관·개인정보 등 법적 문서 WebView
 *
 * @author MindGarden
 * @since 2026-05-14
 */
import { useCallback, useMemo, useState } from 'react';
import { ActivityIndicator, Pressable, StyleSheet, Text, View } from 'react-native';
import { WebView } from 'react-native-webview';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTheme } from '@/theme';
import { fontSize as fontSizeTokens } from '@/theme/typography';

function firstParam(v: string | string[] | undefined): string {
  if (Array.isArray(v)) return v[0] ?? '';
  return v ?? '';
}

/** 라우트에서 `encodeURIComponent`로 넘긴 값을 한 번만 복원한다. */
function decodeUrlParamOnce(raw: string): string {
  const trimmed = raw.trim();
  if (!trimmed) return '';
  try {
    return decodeURIComponent(trimmed);
  } catch {
    return '';
  }
}

function isHttpsUrl(url: string): boolean {
  try {
    const u = new URL(url);
    return u.protocol === 'https:';
  } catch {
    return false;
  }
}

export default function LegalWebViewScreen() {
  const theme = useTheme();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const params = useLocalSearchParams<{ url?: string | string[]; title?: string | string[] }>();

  const rawUrl = useMemo(() => firstParam(params.url), [params.url]);
  const decodedUrl = useMemo(() => decodeUrlParamOnce(rawUrl), [rawUrl]);
  const titleParam = useMemo(() => firstParam(params.title), [params.title]);
  const headerTitle = titleParam.trim() || '문서';

  const urlValid = useMemo(
    () => decodedUrl.length > 0 && isHttpsUrl(decodedUrl),
    [decodedUrl],
  );

  const [webLoading, setWebLoading] = useState(urlValid);
  const [loadError, setLoadError] = useState<string | null>(null);

  const onLoadStart = useCallback(() => {
    setLoadError(null);
    setWebLoading(true);
  }, []);

  const onLoadEnd = useCallback(() => {
    setWebLoading(false);
  }, []);

  const onError = useCallback(() => {
    setWebLoading(false);
    setLoadError('페이지를 불러오지 못했습니다.');
  }, []);

  const onHttpError = useCallback(() => {
    setWebLoading(false);
    setLoadError('페이지를 불러오지 못했습니다.');
  }, []);

  return (
    <View style={[styles.root, { backgroundColor: theme.colors.bgMain }]}>
      <View
        style={[
          styles.header,
          {
            paddingTop: insets.top + 8,
            paddingBottom: 12,
            borderBottomColor: theme.colors.border,
            backgroundColor: theme.colors.bgMain,
          },
        ]}
      >
        <Pressable
          onPress={() => router.back()}
          hitSlop={12}
          style={styles.headerSide}
          accessibilityRole="button"
          accessibilityLabel="뒤로"
        >
          <Text style={{ color: theme.colors.primary, fontSize: fontSizeTokens.base, fontWeight: '600' }}>
            뒤로
          </Text>
        </Pressable>
        <Text
          style={[styles.headerTitle, { color: theme.colors.textMain }]}
          numberOfLines={1}
        >
          {headerTitle}
        </Text>
        <View style={styles.headerSide} />
      </View>

      {!urlValid && (
        <View style={styles.fallback}>
          <Text style={[styles.fallbackText, { color: theme.colors.textSecondary }]}>
            주소가 없거나 HTTPS가 아닙니다. 관리자 설정을 확인해 주세요.
          </Text>
        </View>
      )}

      {urlValid && (
        <View style={styles.webWrap}>
          {loadError ? (
            <View style={styles.errorBox}>
              <Text style={[styles.errorText, { color: theme.colors.error }]}>{loadError}</Text>
            </View>
          ) : null}
          {webLoading && !loadError ? (
            <View style={styles.loadingOverlay} pointerEvents="none">
              <ActivityIndicator size="large" color={theme.colors.primary} />
            </View>
          ) : null}
          <WebView
            source={{ uri: decodedUrl }}
            onLoadStart={onLoadStart}
            onLoadEnd={onLoadEnd}
            onError={onError}
            onHttpError={onHttpError}
            style={styles.webview}
          />
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    borderBottomWidth: StyleSheet.hairlineWidth,
    paddingHorizontal: 8,
  },
  headerSide: { minWidth: 56, justifyContent: 'center' },
  headerTitle: {
    flex: 1,
    textAlign: 'center',
    fontSize: fontSizeTokens.base,
    fontWeight: '600',
  },
  fallback: { flex: 1, padding: 24, justifyContent: 'center' },
  fallbackText: { fontSize: fontSizeTokens.sm, textAlign: 'center', lineHeight: 22 },
  webWrap: { flex: 1 },
  webview: { flex: 1 },
  loadingOverlay: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: 'center',
    alignItems: 'center',
  },
  errorBox: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    alignItems: 'center',
  },
  errorText: { fontSize: fontSizeTokens.sm, textAlign: 'center' },
});
