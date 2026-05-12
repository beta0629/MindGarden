/**
 * 테넌트 선택 화면
 * 기관 코드 직접 입력 + QR 스캔 + 최근 사용한 기관 목록
 *
 * @author MindGarden
 * @since 2026-05-12
 */
import { useState, useCallback } from 'react';
import {
  View,
  Text,
  TextInput,
  Pressable,
  FlatList,
  StyleSheet,
  Alert,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { router, type Href } from 'expo-router';
import { CameraView, useCameraPermissions } from 'expo-camera';
import * as Haptics from 'expo-haptics';
import Animated, { FadeIn, FadeInDown, SlideInDown } from 'react-native-reanimated';
import { Building2, QrCode, ChevronRight, X } from 'lucide-react-native';
import { useTheme } from '../../src/theme';
import { fontSize as fontSizeTokens } from '../../src/theme/typography';
import { useTenantStore } from '../../src/stores/useTenantStore';
import { apiGet } from '../../src/api/client';
import { TENANT_API } from '../../src/api/endpoints';

interface TenantVerifyResponse {
  tenantId: string;
  tenantName: string;
  tenantCode: string;
}

export default function TenantSelectScreen() {
  const theme = useTheme();
  const { setTenant, recentTenants } = useTenantStore();

  const [code, setCode] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [showScanner, setShowScanner] = useState(false);
  const [permission, requestPermission] = useCameraPermissions();

  const verifyTenantCode = useCallback(
    async (tenantCode: string) => {
      if (!tenantCode.trim()) {
        setErrorMessage('기관 코드를 입력해주세요.');
        return;
      }

      setIsLoading(true);
      setErrorMessage(null);

      try {
        const response = await apiGet<TenantVerifyResponse>(TENANT_API.VERIFY, {
          code: tenantCode.trim(),
        });

        if (response?.tenantId && response?.tenantName) {
          await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
          setTenant(tenantCode.trim(), response.tenantId, response.tenantName);
          router.replace('/(auth)/login' as Href);
        } else {
          setErrorMessage('유효하지 않은 기관 코드입니다.');
          await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
        }
      } catch {
        setErrorMessage('기관 코드를 확인할 수 없습니다. 다시 시도해주세요.');
        await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      } finally {
        setIsLoading(false);
      }
    },
    [setTenant],
  );

  const handleQrScan = useCallback(
    async (data: string) => {
      setShowScanner(false);
      const tenantCode = data.replace(/^mindgarden:\/\/tenant\//, '').trim();
      if (tenantCode) {
        setCode(tenantCode);
        await verifyTenantCode(tenantCode);
      }
    },
    [verifyTenantCode],
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

  const handleRecentTenantSelect = (recentCode: string) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setCode(recentCode);
    verifyTenantCode(recentCode);
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
          style={[styles.closeScannerButton, { backgroundColor: theme.colors.surface, ...theme.shadows.md }]}
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
    <KeyboardAvoidingView
      style={[styles.container, { backgroundColor: theme.colors.bgMain }]}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <Animated.View entering={FadeIn.duration(600)} style={styles.content}>
        <View style={styles.header}>
          <Animated.Text
            entering={FadeInDown.delay(100).duration(500)}
            style={[styles.logo, { color: theme.colors.primary }]}
            accessibilityRole="header"
          >
            MindGarden
          </Animated.Text>
          <Animated.Text
            entering={FadeInDown.delay(200).duration(500)}
            style={[styles.subtitle, { color: theme.colors.textSecondary }]}
          >
            소속 기관을 선택해주세요
          </Animated.Text>
        </View>

        <Animated.View
          entering={SlideInDown.delay(300).duration(500)}
          style={[styles.card, { backgroundColor: theme.colors.surface, ...theme.shadows.md }]}
        >
          <View style={styles.inputGroup}>
            <View
              style={[
                styles.inputContainer,
                { borderColor: errorMessage ? theme.colors.error : theme.colors.border },
              ]}
            >
              <Building2 size={20} color={theme.colors.textTertiary} />
              <TextInput
                style={[styles.input, { color: theme.colors.textMain }]}
                placeholder="기관 코드를 입력하세요"
                placeholderTextColor={theme.colors.textTertiary}
                value={code}
                onChangeText={(text) => {
                  setCode(text);
                  setErrorMessage(null);
                }}
                autoCapitalize="none"
                autoCorrect={false}
                returnKeyType="go"
                onSubmitEditing={() => verifyTenantCode(code)}
                accessibilityLabel="기관 코드 입력"
              />
            </View>
            {Boolean(errorMessage) && (
              <Text style={[styles.errorText, { color: theme.colors.error }]}>
                {errorMessage}
              </Text>
            )}
          </View>

          <Pressable
            style={[styles.primaryButton, { backgroundColor: theme.colors.primary }]}
            onPress={() => verifyTenantCode(code)}
            disabled={isLoading}
            accessibilityLabel="기관 코드 확인"
            accessibilityRole="button"
          >
            {isLoading ? (
              <ActivityIndicator color={theme.colors.textOnPrimary} />
            ) : (
              <Text style={[styles.primaryButtonText, { color: theme.colors.textOnPrimary }]}>
                확인
              </Text>
            )}
          </Pressable>

          <View style={styles.dividerRow}>
            <View style={[styles.dividerLine, { backgroundColor: theme.colors.divider }]} />
            <Text style={[styles.dividerText, { color: theme.colors.textTertiary }]}>
              또는
            </Text>
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
              QR 코드 스캔
            </Text>
          </Pressable>
        </Animated.View>

        {recentTenants.length > 0 && (
          <Animated.View entering={FadeInDown.delay(500).duration(400)} style={styles.recentSection}>
            <Text style={[styles.recentTitle, { color: theme.colors.textSecondary }]}>
              최근 사용한 기관
            </Text>
            <FlatList
              data={recentTenants}
              keyExtractor={(item) => item.code}
              scrollEnabled={false}
              renderItem={({ item }) => (
                <Pressable
                  style={[styles.recentItem, { backgroundColor: theme.colors.surface }]}
                  onPress={() => handleRecentTenantSelect(item.code)}
                  accessibilityLabel={`${item.name} 선택`}
                  accessibilityRole="button"
                >
                  <View>
                    <Text style={[styles.recentName, { color: theme.colors.textMain }]}>
                      {item.name}
                    </Text>
                    <Text style={[styles.recentCode, { color: theme.colors.textTertiary }]}>
                      {item.code}
                    </Text>
                  </View>
                  <ChevronRight size={18} color={theme.colors.textTertiary} />
                </Pressable>
              )}
            />
          </Animated.View>
        )}
      </Animated.View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    flex: 1,
    justifyContent: 'center',
    paddingHorizontal: 24,
  },
  header: {
    alignItems: 'center',
    marginBottom: 32,
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
  card: {
    borderRadius: 16,
    padding: 24,
  },
  inputGroup: {
    marginBottom: 16,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 12,
    gap: 10,
  },
  input: {
    flex: 1,
    fontSize: fontSizeTokens.base,
    fontWeight: '400',
  },
  errorText: {
    fontSize: fontSizeTokens.xs,
    marginTop: 6,
    marginLeft: 4,
  },
  primaryButton: {
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 48,
  },
  primaryButtonText: {
    fontSize: fontSizeTokens.base,
    fontWeight: '600',
  },
  dividerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 16,
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
  recentSection: {
    marginTop: 24,
  },
  recentTitle: {
    fontSize: fontSizeTokens.sm,
    fontWeight: '500',
    marginBottom: 10,
  },
  recentItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderRadius: 12,
    padding: 14,
    marginBottom: 8,
  },
  recentName: {
    fontSize: fontSizeTokens.sm,
    fontWeight: '500',
  },
  recentCode: {
    fontSize: fontSizeTokens.xs,
    marginTop: 2,
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
