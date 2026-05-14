/**
 * 테넌트 선택 화면
 * 서버에서 활성 테넌트 목록을 가져와 카드 리스트로 표시
 * 검색 필터 + QR 스캔 지원
 *
 * @author CoreSolution
 * @since 2026-05-12
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
} from 'react-native';
import { router, type Href } from 'expo-router';
import { CameraView, useCameraPermissions } from 'expo-camera';
import * as Haptics from 'expo-haptics';
import Animated, { FadeIn, FadeInDown, SlideInDown } from 'react-native-reanimated';
import { Building2, QrCode, ChevronRight, X, Search, RefreshCw } from 'lucide-react-native';
import { useTheme } from '../../src/theme';
import { fontSize as fontSizeTokens } from '../../src/theme/typography';
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

export default function TenantSelectScreen() {
  const theme = useTheme();
  const { setTenant } = useTenantStore();

  const [tenants, setTenants] = useState<TenantInfo[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [showScanner, setShowScanner] = useState(false);
  const [permission, requestPermission] = useCameraPermissions();

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

  const renderTenantCard = useCallback(
    ({ item, index }: { item: TenantInfo; index: number }) => (
      <Animated.View entering={FadeInDown.delay(index * 60).duration(400)}>
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
        >
          <View
            style={[
              styles.tenantIconWrapper,
              { backgroundColor: theme.colors.primaryLight ?? theme.colors.bgSub },
            ]}
          >
            <Building2 size={22} color={theme.colors.primary} />
          </View>
          <View style={styles.tenantInfo}>
            <Text style={[styles.tenantName, { color: theme.colors.textMain }]} numberOfLines={1}>
              {item.name}
            </Text>
            <Text
              style={[styles.tenantSubdomain, { color: theme.colors.textTertiary }]}
              numberOfLines={1}
            >
              {item.subdomain}
            </Text>
          </View>
          <ChevronRight size={18} color={theme.colors.textTertiary} />
        </Pressable>
      </Animated.View>
    ),
    [theme, handleTenantSelect],
  );

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
    <View style={[styles.container, { backgroundColor: theme.colors.bgMain }]}>
      <Animated.View entering={FadeIn.duration(600)} style={styles.content}>
        <View style={styles.header}>
          <Animated.Text
            entering={FadeInDown.delay(100).duration(500)}
            style={[styles.logo, { color: theme.colors.primary }]}
            accessibilityRole="header"
          >
            CoreSolution
          </Animated.Text>
          <Animated.Text
            entering={FadeInDown.delay(200).duration(500)}
            style={[styles.subtitle, { color: theme.colors.textSecondary }]}
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
            style={[styles.qrButton, { borderColor: theme.colors.border }]}
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
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    flex: 1,
    paddingHorizontal: 24,
    paddingTop: 60,
    paddingBottom: 24,
  },
  header: {
    alignItems: 'center',
    marginBottom: 28,
  },
  logo: {
    fontSize: fontSizeTokens['3xl'],
    fontWeight: '700',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: fontSizeTokens.base,
    fontWeight: '400',
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
    fontSize: fontSizeTokens.sm,
    fontWeight: '400',
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
    fontSize: fontSizeTokens.sm,
    fontWeight: '600',
  },
  tenantSubdomain: {
    fontSize: fontSizeTokens.xs,
    fontWeight: '400',
  },
  centerState: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 48,
    gap: 12,
  },
  stateText: {
    fontSize: fontSizeTokens.sm,
    fontWeight: '400',
    textAlign: 'center',
  },
  errorText: {
    fontSize: fontSizeTokens.sm,
    fontWeight: '500',
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
    fontSize: fontSizeTokens.sm,
    fontWeight: '500',
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
    fontSize: fontSizeTokens.sm,
    fontWeight: '500',
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
    fontSize: fontSizeTokens.base,
    fontWeight: '500',
  },
});
