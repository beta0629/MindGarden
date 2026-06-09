/**
 * 테넌트 선택 화면 — MindGarden 나비 로고 + 파스텔 배경 + 검색 + QR + 카드 리스트.
 *
 * 로그인 화면(`(auth)/login.tsx`)과 동일한 비주얼 톤을 유지한다:
 *  - {@link AnimatedPastelBackground} 동일 그라데이션 + drift
 *  - {@link BreathingButterflyLogo} 동일 fade-in + breathing
 *  - {@link useReduceMotion} + {@link resolveLoginAnimationConfig} 단일 분기
 *
 * 정책 — "코어솔루션 = 솔루션 제공사, 테넌트 아님" (사용자 정정 2026-06-10):
 *  - "코어솔루션" 은 본 앱·웹을 개발/제공하는 솔루션 회사 이며, 테넌트(고객사)가 아니다.
 *  - 따라서 본 화면(테넌트 선택 리스트)에는 절대 노출하지 않는다.
 *  - 솔루션 제공사 브랜딩(예: "Powered by 코어솔루션") 표시는 별도 위치(footer/About 등)
 *    에서 별도 지시 후 추가한다.
 *
 * SSOT 모션·레이아웃: docs/design-system/EXPO_APP_LOGIN_SCREEN_REDESIGN_SPEC_20260609.md.
 *
 * @author MindGarden
 * @since 2026-05-12
 * @updated 2026-06-10 — 로그인 페이지와 비주얼 통합 (코어솔루션 가상 카드는 정책에 따라 제거)
 */
import { useState, useCallback, useEffect, useMemo } from 'react';
import {
  View,
  Text,
  TextInput,
  Pressable,
  FlatList,
  StyleSheet,
  Alert,
  ActivityIndicator,
  RefreshControl,
  useWindowDimensions,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router, type Href } from 'expo-router';
import { CameraView, useCameraPermissions } from 'expo-camera';
import * as Haptics from 'expo-haptics';
import Animated, { FadeIn, FadeInDown, SlideInDown } from 'react-native-reanimated';
import { Building2, ChevronRight, QrCode, RefreshCw, Search, X } from 'lucide-react-native';
import { useTheme } from '../../src/theme';
import { fontFamily, fontSize as fontSizeTokens } from '../../src/theme/typography';
import { BreathingButterflyLogo } from '../../src/components/molecules/BreathingButterflyLogo';
import { AnimatedPastelBackground } from '../../src/components/organisms/login/AnimatedPastelBackground';
import {
  CONTENT_HORIZONTAL_PADDING_MOBILE,
  CONTENT_HORIZONTAL_PADDING_TABLET,
  CONTENT_MAX_WIDTH_TABLET,
  LAYOUT_TABLET_DEVICE_WIDTH,
  LOGO_SIZE_MIN,
  TITLE_FADE_IN_DELAY_MS,
  TITLE_FADE_IN_DURATION_MS,
  computeButtonFadeInDelayMs,
  resolveLoginAnimationConfig,
} from '../../src/components/organisms/login/loginAnimationConstants';
import { useReduceMotion } from '../../src/hooks/useReduceMotion';
import { useTenantStore } from '../../src/stores/useTenantStore';
import { apiGet } from '../../src/api/client';
import { TENANT_API } from '../../src/api/endpoints';

interface TenantInfo {
  tenantId: string;
  name: string;
  businessType: string;
  subdomain: string;
}

interface TenantListResponse {
  success: boolean;
  data: {
    tenants: TenantInfo[];
    count: number;
  };
}

interface TenantBySubdomainResponse {
  success: boolean;
  data: {
    tenant: TenantInfo | null;
    found: boolean;
    message?: string;
  };
}

/** 헤더 → 검색 입력 gap */
const HEADER_TO_LIST_GAP = 28;
/** 테넌트 선택용 로고 크기 — 로그인보다 살짝 작게 (입력 영역 확보) */
const TENANT_LOGO_SIZE = LOGO_SIZE_MIN;

export default function TenantSelectScreen() {
  const theme = useTheme();
  const { setTenant } = useTenantStore();
  const { width: windowWidth } = useWindowDimensions();
  const reduceMotion = useReduceMotion();
  const config = useMemo(() => resolveLoginAnimationConfig(reduceMotion), [reduceMotion]);

  const [tenants, setTenants] = useState<TenantInfo[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [showScanner, setShowScanner] = useState(false);
  const [permission, requestPermission] = useCameraPermissions();

  const isTablet = windowWidth >= LAYOUT_TABLET_DEVICE_WIDTH;
  const contentHorizontalPadding = isTablet
    ? CONTENT_HORIZONTAL_PADDING_TABLET
    : CONTENT_HORIZONTAL_PADDING_MOBILE;

  const filteredTenants = useMemo(() => {
    if (!searchQuery.trim()) return tenants;
    const query = searchQuery.trim().toLowerCase();
    return tenants.filter(
      (t) => t.name.toLowerCase().includes(query) || t.subdomain.toLowerCase().includes(query),
    );
  }, [tenants, searchQuery]);

  const fetchTenants = useCallback(async (showRefreshIndicator = false) => {
    if (showRefreshIndicator) {
      setIsRefreshing(true);
    } else {
      setIsLoading(true);
    }
    setErrorMessage(null);

    try {
      const response = await apiGet<TenantListResponse>(TENANT_API.LIST_ACTIVE);
      const body = response as unknown as TenantListResponse;
      setTenants(body?.data?.tenants ?? []);
    } catch {
      setErrorMessage('기관 목록을 불러올 수 없습니다.');
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  }, []);

  useEffect(() => {
    fetchTenants();
  }, [fetchTenants]);

  const handleTenantSelect = useCallback(
    async (tenant: TenantInfo) => {
      await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      setTenant(tenant.subdomain, tenant.tenantId, tenant.name);
      router.replace('/(auth)/login' as Href);
    },
    [setTenant],
  );

  const handleQrScan = useCallback(
    async (data: string) => {
      setShowScanner(false);
      const tenantCode = data.replace(/^coresolution:\/\/tenant\//, '').trim();
      if (!tenantCode) return;

      setIsLoading(true);
      setErrorMessage(null);

      try {
        const response = await apiGet<TenantBySubdomainResponse>(TENANT_API.BY_SUBDOMAIN, {
          subdomain: tenantCode,
        });
        const body = response as unknown as TenantBySubdomainResponse;
        const tenantData = body?.data?.tenant;

        if (body?.data?.found && tenantData?.tenantId && tenantData?.name) {
          await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
          setTenant(tenantCode, tenantData.tenantId, tenantData.name);
          router.replace('/(auth)/login' as Href);
        } else {
          setErrorMessage('QR 코드의 기관 정보를 확인할 수 없습니다.');
          await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
        }
      } catch {
        setErrorMessage('QR 코드 인증에 실패했습니다. 다시 시도해주세요.');
        await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      } finally {
        setIsLoading(false);
      }
    },
    [setTenant],
  );

  const openScanner = async () => {
    if (!permission?.granted) {
      const result = await requestPermission();
      if (!result.granted) {
        Alert.alert('카메라 권한 필요', 'QR 스캔을 위해 카메라 접근을 허용해주세요.');
        return;
      }
    }
    setShowScanner(true);
  };

  const renderTenantCard = useCallback(
    ({ item, index }: { item: TenantInfo; index: number }) => {
      const entryDelay = computeButtonFadeInDelayMs(index, config);
      const entryDuration = TITLE_FADE_IN_DURATION_MS;

      return (
        <Animated.View entering={FadeInDown.delay(entryDelay).duration(entryDuration)}>
          <Pressable
            style={({ pressed }) => [
              styles.tenantCard,
              {
                backgroundColor: pressed ? theme.colors.primaryLight : theme.colors.surface,
                ...theme.shadows.sm,
              },
            ]}
            onPress={() => handleTenantSelect(item)}
            accessibilityLabel={`${item.name} 기관 선택`}
            accessibilityRole="button"
            accessibilityHint={`${item.subdomain} 서브도메인으로 진행합니다.`}
            testID={`tenant-card-${item.subdomain}`}
          >
            <View
              style={[styles.tenantIconWrapper, { backgroundColor: theme.colors.primaryLight }]}
            >
              <Building2 size={22} color={theme.colors.primary} />
            </View>
            <View style={styles.tenantInfo}>
              <Text
                style={[styles.tenantName, { color: theme.colors.textMain }]}
                numberOfLines={1}
                maxFontSizeMultiplier={1.6}
                allowFontScaling
              >
                {item.name}
              </Text>
              <Text
                style={[styles.tenantSubdomain, { color: theme.colors.textTertiary }]}
                numberOfLines={1}
                maxFontSizeMultiplier={1.6}
                allowFontScaling
              >
                {item.subdomain}
              </Text>
            </View>
            <ChevronRight size={18} color={theme.colors.textTertiary} />
          </Pressable>
        </Animated.View>
      );
    },
    [
      config,
      handleTenantSelect,
      theme.colors.primary,
      theme.colors.primaryLight,
      theme.colors.surface,
      theme.colors.textMain,
      theme.colors.textTertiary,
      theme.shadows.sm,
    ],
  );

  const renderListContent = () => {
    if (isLoading && !isRefreshing) {
      return (
        <View style={styles.centerState}>
          <ActivityIndicator size="large" color={theme.colors.primary} />
          <Text style={[styles.stateText, { color: theme.colors.textSecondary }]}>
            기관 목록을 불러오는 중...
          </Text>
        </View>
      );
    }

    if (errorMessage && tenants.length === 0) {
      return (
        <View style={styles.centerState}>
          <Text style={[styles.errorText, { color: theme.colors.error }]}>{errorMessage}</Text>
          <Pressable
            style={[styles.retryButton, { borderColor: theme.colors.primary }]}
            onPress={() => fetchTenants()}
            accessibilityLabel="다시 시도"
            accessibilityRole="button"
          >
            <RefreshCw size={16} color={theme.colors.primary} />
            <Text style={[styles.retryButtonText, { color: theme.colors.primary }]}>다시 시도</Text>
          </Pressable>
        </View>
      );
    }

    const emptyMessage = searchQuery.trim() ? '검색 결과가 없습니다.' : '등록된 기관이 없습니다.';

    return (
      <FlatList
        data={filteredTenants}
        keyExtractor={(tenant) => tenant.tenantId}
        renderItem={renderTenantCard}
        contentContainerStyle={styles.listContent}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={isRefreshing}
            onRefresh={() => fetchTenants(true)}
            tintColor={theme.colors.primary}
          />
        }
        ListEmptyComponent={
          <View style={styles.centerState}>
            <Text style={[styles.stateText, { color: theme.colors.textSecondary }]}>
              {emptyMessage}
            </Text>
          </View>
        }
      />
    );
  };

  if (showScanner) {
    return (
      <View style={[styles.scannerContainer, { backgroundColor: theme.colors.bgMain }]}>
        <CameraView
          style={styles.camera}
          facing="back"
          barcodeScannerSettings={{ barcodeTypes: ['qr'] }}
          onBarcodeScanned={(result) => handleQrScan(result.data)}
        />
        <Pressable
          style={[
            styles.closeScannerButton,
            { backgroundColor: theme.colors.surface, ...theme.shadows.md },
          ]}
          onPress={() => setShowScanner(false)}
          accessibilityLabel="스캐너 닫기"
          accessibilityRole="button"
        >
          <X size={24} color={theme.colors.textMain} />
        </Pressable>
        <View style={styles.scannerOverlay}>
          <Text style={[styles.scannerText, { color: theme.colors.textOnPrimary }]}>
            QR 코드를 스캔해주세요
          </Text>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <AnimatedPastelBackground config={config} testID="tenant-select-pastel-bg" />
      <SafeAreaView style={styles.safeArea} edges={['top', 'bottom']}>
        <Animated.View
          entering={FadeIn.duration(600)}
          style={[
            styles.content,
            {
              paddingHorizontal: contentHorizontalPadding,
              maxWidth: isTablet ? CONTENT_MAX_WIDTH_TABLET : undefined,
              alignSelf: isTablet ? 'center' : 'stretch',
              width: isTablet ? '100%' : undefined,
            },
          ]}
        >
          <View style={styles.header}>
            <BreathingButterflyLogo
              config={config}
              size={TENANT_LOGO_SIZE}
              style={{ marginBottom: theme.spacing.md }}
              testID="tenant-select-butterfly-logo"
            />
            <Animated.Text
              entering={FadeInDown.delay(TITLE_FADE_IN_DELAY_MS).duration(
                TITLE_FADE_IN_DURATION_MS,
              )}
              style={[styles.subtitle, { color: theme.colors.textSecondary }]}
              maxFontSizeMultiplier={1.6}
              allowFontScaling
              accessibilityRole="header"
            >
              소속 기관을 선택해주세요
            </Animated.Text>
          </View>

          <Animated.View entering={SlideInDown.delay(300).duration(500)} style={styles.listSection}>
            <View
              style={[
                styles.searchContainer,
                { backgroundColor: theme.colors.surface, borderColor: theme.colors.border },
              ]}
            >
              <Search size={18} color={theme.colors.textTertiary} />
              <TextInput
                style={[styles.searchInput, { color: theme.colors.textMain }]}
                placeholder="기관명 또는 서브도메인 검색"
                placeholderTextColor={theme.colors.textTertiary}
                value={searchQuery}
                onChangeText={setSearchQuery}
                autoCapitalize="none"
                autoCorrect={false}
                returnKeyType="search"
                accessibilityLabel="기관 검색"
                testID="tenant-select-search-input"
              />
              {searchQuery.length > 0 && (
                <Pressable
                  onPress={() => setSearchQuery('')}
                  accessibilityLabel="검색어 지우기"
                  accessibilityRole="button"
                  hitSlop={8}
                >
                  <X size={16} color={theme.colors.textTertiary} />
                </Pressable>
              )}
            </View>

            {renderListContent()}
          </Animated.View>

          <Animated.View entering={FadeInDown.delay(500).duration(400)} style={styles.qrSection}>
            <View style={styles.dividerRow}>
              <View style={[styles.dividerLine, { backgroundColor: theme.colors.divider }]} />
              <Text style={[styles.dividerText, { color: theme.colors.textTertiary }]}>또는</Text>
              <View style={[styles.dividerLine, { backgroundColor: theme.colors.divider }]} />
            </View>

            <Pressable
              style={[
                styles.qrButton,
                {
                  borderColor: theme.colors.border,
                  backgroundColor: theme.colors.surface,
                },
              ]}
              onPress={openScanner}
              accessibilityLabel="QR 코드 스캔"
              accessibilityRole="button"
            >
              <QrCode size={20} color={theme.colors.primary} />
              <Text style={[styles.qrButtonText, { color: theme.colors.primary }]}>
                QR 코드로 기관 연결
              </Text>
            </Pressable>
          </Animated.View>
        </Animated.View>
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  safeArea: {
    flex: 1,
  },
  content: {
    flex: 1,
    paddingTop: 24,
    paddingBottom: 24,
  },
  header: {
    alignItems: 'center',
    marginBottom: HEADER_TO_LIST_GAP,
  },
  subtitle: {
    fontFamily: fontFamily.medium,
    fontSize: fontSizeTokens.base,
    textAlign: 'center',
  },
  listSection: {
    flex: 1,
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 10,
    gap: 10,
    marginBottom: 12,
  },
  searchInput: {
    flex: 1,
    fontFamily: fontFamily.regular,
    fontSize: fontSizeTokens.sm,
    paddingVertical: 0,
  },
  listContent: {
    paddingBottom: 8,
    gap: 8,
  },
  tenantCard: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 12,
    padding: 14,
    gap: 12,
  },
  tenantIconWrapper: {
    width: 42,
    height: 42,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  tenantInfo: {
    flex: 1,
    gap: 2,
  },
  tenantName: {
    fontFamily: fontFamily.semibold,
    fontSize: fontSizeTokens.sm,
  },
  tenantSubdomain: {
    fontFamily: fontFamily.regular,
    fontSize: fontSizeTokens.xs,
  },
  centerState: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 48,
    gap: 12,
  },
  stateText: {
    fontFamily: fontFamily.regular,
    fontSize: fontSizeTokens.sm,
    textAlign: 'center',
  },
  errorText: {
    fontFamily: fontFamily.medium,
    fontSize: fontSizeTokens.sm,
    textAlign: 'center',
  },
  retryButton: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderRadius: 10,
    paddingHorizontal: 16,
    paddingVertical: 10,
    gap: 6,
  },
  retryButtonText: {
    fontFamily: fontFamily.medium,
    fontSize: fontSizeTokens.sm,
  },
  qrSection: {
    paddingTop: 8,
  },
  dividerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  dividerLine: {
    flex: 1,
    height: 1,
  },
  dividerText: {
    marginHorizontal: 12,
    fontFamily: fontFamily.regular,
    fontSize: fontSizeTokens.xs,
  },
  qrButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderRadius: 12,
    paddingVertical: 14,
    gap: 8,
  },
  qrButtonText: {
    fontFamily: fontFamily.medium,
    fontSize: fontSizeTokens.sm,
  },
  scannerContainer: {
    flex: 1,
  },
  camera: {
    flex: 1,
  },
  closeScannerButton: {
    position: 'absolute',
    top: 60,
    right: 20,
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  scannerOverlay: {
    position: 'absolute',
    bottom: 100,
    left: 0,
    right: 0,
    alignItems: 'center',
  },
  scannerText: {
    fontFamily: fontFamily.medium,
    fontSize: fontSizeTokens.base,
  },
});
