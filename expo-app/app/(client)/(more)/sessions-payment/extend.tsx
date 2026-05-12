/**
 * 회기 연장 요청 화면
 * 패키지 선택 + 토스페이먼츠 WebView 결제
 *
 * @author MindGarden
 * @since 2026-05-12
 */
import React, { useCallback, useRef, useState } from 'react';
import {
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import * as Haptics from 'expo-haptics';
import Animated, {
  FadeInDown,
  useAnimatedStyle,
  useSharedValue,
  withSpring,
} from 'react-native-reanimated';
import { WebView } from 'react-native-webview';
import {
  Check,
  CreditCard,
  Package,
  ShoppingBag,
  Sparkles,
} from 'lucide-react-native';
import { useTheme } from '@/theme';
import { useAuthStore } from '@/stores/useAuthStore';
import {
  useSessionBalance,
  useCreatePayment,
} from '@/api/hooks/usePayments';
import { SkeletonLoader } from '@/components/atoms/SkeletonLoader';

interface ExtensionPackage {
  id: number;
  name: string;
  sessions: number;
  price: number;
  popular?: boolean;
  perSession: number;
}

const PACKAGES: ExtensionPackage[] = [
  { id: 1, name: '1회 체험', sessions: 1, price: 60000, perSession: 60000 },
  { id: 2, name: '5회 패키지', sessions: 5, price: 275000, popular: true, perSession: 55000 },
  { id: 3, name: '10회 패키지', sessions: 10, price: 500000, perSession: 50000 },
];

const TOSS_CLIENT_KEY = 'test_ck_placeholder';
const TOSS_SUCCESS_URL = 'mindgarden://payment/success';
const TOSS_FAIL_URL = 'mindgarden://payment/fail';

type PaymentStep = 'select' | 'payment' | 'success' | 'error';

function formatCurrency(amount: number): string {
  return `₩${Number(amount || 0).toLocaleString()}`;
}

function generateOrderId(): string {
  const timestamp = Date.now().toString(36);
  const random = Math.random().toString(36).substring(2, 8);
  return `MG-${timestamp}-${random}`;
}

export default function SessionExtendScreen() {
  const theme = useTheme();
  const router = useRouter();
  const user = useAuthStore((s) => s.user);
  const clientId = user?.id;

  const [selectedPackageId, setSelectedPackageId] = useState<number | null>(null);
  const [step, setStep] = useState<PaymentStep>('select');
  const orderIdRef = useRef<string>('');

  const { data: balance } = useSessionBalance(clientId);
  const createPayment = useCreatePayment();

  const selectedPackage = PACKAGES.find((p) => p.id === selectedPackageId) ?? null;

  const handlePackageSelect = useCallback(
    (packageId: number) => {
      if (Platform.OS !== 'web') {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      }
      setSelectedPackageId(packageId);
    },
    [],
  );

  const handlePaymentStart = useCallback(() => {
    if (!selectedPackage || !clientId) return;

    if (Platform.OS !== 'web') {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    }

    orderIdRef.current = generateOrderId();
    setStep('payment');
  }, [selectedPackage, clientId]);

  const handleWebViewMessage = useCallback(
    async (event: { nativeEvent: { data: string } }) => {
      try {
        const data = JSON.parse(event.nativeEvent.data);

        if (data.status === 'success') {
          if (!clientId || !selectedPackage) return;

          await createPayment.mutateAsync({
            clientId,
            packageId: selectedPackage.id,
            paymentKey: data.paymentKey,
            orderId: data.orderId,
            amount: selectedPackage.price,
          });

          if (Platform.OS !== 'web') {
            Haptics.notificationAsync(
              Haptics.NotificationFeedbackType.Success,
            );
          }
          setStep('success');
        } else if (data.status === 'fail') {
          setStep('error');
        }
      } catch {
        setStep('error');
      }
    },
    [clientId, selectedPackage, createPayment],
  );

  const handleRetry = useCallback(() => {
    setStep('select');
    setSelectedPackageId(null);
  }, []);

  const handleDone = useCallback(() => {
    router.back();
  }, [router]);

  const tossPaymentHtml = selectedPackage
    ? buildTossPaymentHtml({
        clientKey: TOSS_CLIENT_KEY,
        amount: selectedPackage.price,
        orderId: orderIdRef.current,
        orderName: `MindGarden ${selectedPackage.name}`,
        customerName: user?.name ?? '내담자',
        successUrl: TOSS_SUCCESS_URL,
        failUrl: TOSS_FAIL_URL,
      })
    : '';

  if (step === 'success') {
    return (
      <SafeAreaView
        style={[styles.safeArea, { backgroundColor: theme.colors.bgMain }]}
        edges={['bottom']}
      >
        <SuccessView
          sessions={selectedPackage?.sessions ?? 0}
          onDone={handleDone}
        />
      </SafeAreaView>
    );
  }

  if (step === 'error') {
    return (
      <SafeAreaView
        style={[styles.safeArea, { backgroundColor: theme.colors.bgMain }]}
        edges={['bottom']}
      >
        <ErrorView onRetry={handleRetry} />
      </SafeAreaView>
    );
  }

  if (step === 'payment') {
    return (
      <SafeAreaView
        style={[styles.safeArea, { backgroundColor: theme.colors.bgMain }]}
        edges={['bottom']}
      >
        <View style={styles.webviewContainer}>
          <WebView
            source={{ html: tossPaymentHtml }}
            onMessage={handleWebViewMessage}
            javaScriptEnabled
            domStorageEnabled
            style={styles.webview}
            startInLoadingState
            renderLoading={() => (
              <View style={styles.webviewLoading}>
                <SkeletonLoader width="80%" height={40} />
                <SkeletonLoader width="60%" height={20} style={styles.webviewLoadingGap} />
              </View>
            )}
          />
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView
      style={[styles.safeArea, { backgroundColor: theme.colors.bgMain }]}
      edges={['bottom']}
    >
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <Animated.View entering={FadeInDown.duration(400)}>
          <View
            style={[
              styles.currentBalanceCard,
              {
                backgroundColor: theme.colors.surface,
                borderRadius: theme.borderRadius.xl,
                ...theme.shadows.sm,
              },
            ]}
          >
            <Text
              style={{
                color: theme.colors.textSecondary,
                fontFamily: theme.fontFamily.regular,
                fontSize: theme.fontSize.sm,
              }}
            >
              현재 보유 회기
            </Text>
            <Text
              style={{
                color: theme.colors.primary,
                fontFamily: theme.fontFamily.bold,
                fontSize: theme.fontSize['3xl'],
              }}
            >
              {balance?.remainingSessions ?? 0}
              <Text
                style={{
                  fontFamily: theme.fontFamily.regular,
                  fontSize: theme.fontSize.base,
                }}
              >
                {' '}회기
              </Text>
            </Text>
          </View>
        </Animated.View>

        <Text
          style={[
            styles.sectionTitle,
            {
              color: theme.colors.textMain,
              fontFamily: theme.fontFamily.semibold,
              fontSize: theme.fontSize.lg,
            },
          ]}
        >
          연장 패키지 선택
        </Text>

        <View style={styles.packageList}>
          {PACKAGES.map((pkg, index) => (
            <PackageCard
              key={pkg.id}
              pkg={pkg}
              isSelected={selectedPackageId === pkg.id}
              onSelect={handlePackageSelect}
              index={index}
            />
          ))}
        </View>

        {selectedPackage && (
          <Animated.View entering={FadeInDown.duration(300)}>
            <View
              style={[
                styles.summaryCard,
                {
                  backgroundColor: theme.colors.surfaceAlt,
                  borderRadius: theme.borderRadius.xl,
                },
              ]}
            >
              <View style={styles.summaryRow}>
                <Text
                  style={{
                    color: theme.colors.textSecondary,
                    fontFamily: theme.fontFamily.regular,
                    fontSize: theme.fontSize.sm,
                  }}
                >
                  선택 패키지
                </Text>
                <Text
                  style={{
                    color: theme.colors.textMain,
                    fontFamily: theme.fontFamily.semibold,
                    fontSize: theme.fontSize.sm,
                  }}
                >
                  {selectedPackage.name} ({selectedPackage.sessions}회)
                </Text>
              </View>
              <View
                style={[styles.summaryDivider, { backgroundColor: theme.colors.divider }]}
              />
              <View style={styles.summaryRow}>
                <Text
                  style={{
                    color: theme.colors.textMain,
                    fontFamily: theme.fontFamily.semibold,
                    fontSize: theme.fontSize.base,
                  }}
                >
                  결제 금액
                </Text>
                <Text
                  style={{
                    color: theme.colors.primary,
                    fontFamily: theme.fontFamily.bold,
                    fontSize: theme.fontSize.xl,
                  }}
                >
                  {formatCurrency(selectedPackage.price)}
                </Text>
              </View>
            </View>
          </Animated.View>
        )}
      </ScrollView>

      <View
        style={[
          styles.bottomBar,
          {
            backgroundColor: theme.colors.surface,
            borderTopColor: theme.colors.divider,
          },
        ]}
      >
        <Pressable
          onPress={handlePaymentStart}
          disabled={!selectedPackageId || createPayment.isPending}
          style={({ pressed }) => [
            styles.payButton,
            {
              backgroundColor: selectedPackageId
                ? theme.colors.primary
                : theme.colors.gray[300],
              borderRadius: theme.borderRadius.lg,
              opacity: pressed ? 0.85 : 1,
            },
          ]}
          accessibilityRole="button"
          accessibilityLabel="결제하고 회기 연장하기"
          accessibilityState={{ disabled: !selectedPackageId }}
        >
          <ShoppingBag size={20} color={theme.colors.textOnPrimary} />
          <Text
            style={{
              color: theme.colors.textOnPrimary,
              fontFamily: theme.fontFamily.semibold,
              fontSize: theme.fontSize.base,
              marginLeft: 8,
            }}
          >
            {createPayment.isPending ? '처리 중...' : '결제하고 회기 연장하기'}
          </Text>
        </Pressable>
      </View>
    </SafeAreaView>
  );
}

interface PackageCardProps {
  pkg: ExtensionPackage;
  isSelected: boolean;
  onSelect: (id: number) => void;
  index: number;
}

function PackageCard({ pkg, isSelected, onSelect, index }: PackageCardProps) {
  const theme = useTheme();
  const scale = useSharedValue(1);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  const handlePressIn = () => {
    scale.value = withSpring(0.97, { damping: 15, stiffness: 200 });
  };

  const handlePressOut = () => {
    scale.value = withSpring(1, { damping: 15, stiffness: 200 });
  };

  return (
    <Animated.View
      entering={FadeInDown.delay(index * 80).duration(400)}
      style={animatedStyle}
    >
      <Pressable
        onPress={() => onSelect(pkg.id)}
        onPressIn={handlePressIn}
        onPressOut={handlePressOut}
        style={[
          styles.packageCard,
          {
            backgroundColor: theme.colors.surface,
            borderRadius: theme.borderRadius.xl,
            borderColor: isSelected ? theme.colors.primary : theme.colors.border,
            borderWidth: isSelected ? 2 : 1,
            ...theme.shadows.sm,
          },
        ]}
        accessibilityRole="button"
        accessibilityState={{ selected: isSelected }}
        accessibilityLabel={`${pkg.name} ${pkg.sessions}회 ${formatCurrency(pkg.price)}`}
      >
        {pkg.popular && (
          <View
            style={[
              styles.popularBadge,
              { backgroundColor: theme.colors.primary, borderRadius: theme.borderRadius.sm },
            ]}
          >
            <Sparkles size={12} color={theme.colors.textOnPrimary} />
            <Text
              style={{
                color: theme.colors.textOnPrimary,
                fontFamily: theme.fontFamily.semibold,
                fontSize: theme.fontSize['2xs'],
                marginLeft: 4,
              }}
            >
              인기
            </Text>
          </View>
        )}

        <View style={styles.packageInfo}>
          <View style={styles.packageHeader}>
            <Package size={20} color={isSelected ? theme.colors.primary : theme.colors.textSecondary} />
            <Text
              style={{
                color: theme.colors.textMain,
                fontFamily: theme.fontFamily.semibold,
                fontSize: theme.fontSize.base,
                marginLeft: 8,
              }}
            >
              {pkg.name}
            </Text>
          </View>
          <Text
            style={{
              color: theme.colors.textSecondary,
              fontFamily: theme.fontFamily.regular,
              fontSize: theme.fontSize.sm,
              marginTop: 4,
            }}
          >
            {pkg.sessions}회 상담 · 회당 {formatCurrency(pkg.perSession)}
          </Text>
        </View>

        <View style={styles.packageRight}>
          <Text
            style={{
              color: isSelected ? theme.colors.primary : theme.colors.textMain,
              fontFamily: theme.fontFamily.bold,
              fontSize: theme.fontSize.lg,
            }}
          >
            {formatCurrency(pkg.price)}
          </Text>
          {isSelected && (
            <View
              style={[
                styles.checkCircle,
                { backgroundColor: theme.colors.primary },
              ]}
            >
              <Check size={14} color={theme.colors.textOnPrimary} />
            </View>
          )}
        </View>
      </Pressable>
    </Animated.View>
  );
}

function SuccessView({
  sessions,
  onDone,
}: {
  sessions: number;
  onDone: () => void;
}) {
  const theme = useTheme();

  return (
    <Animated.View
      entering={FadeInDown.duration(500).springify()}
      style={styles.resultContainer}
    >
      <View
        style={[
          styles.resultIcon,
          { backgroundColor: `${theme.colors.success}20` },
        ]}
      >
        <Check size={48} color={theme.colors.success} />
      </View>
      <Text
        style={{
          color: theme.colors.textMain,
          fontFamily: theme.fontFamily.bold,
          fontSize: theme.fontSize['2xl'],
          marginTop: 24,
          textAlign: 'center',
        }}
      >
        결제 완료!
      </Text>
      <Text
        style={{
          color: theme.colors.textSecondary,
          fontFamily: theme.fontFamily.regular,
          fontSize: theme.fontSize.base,
          marginTop: 8,
          textAlign: 'center',
        }}
      >
        {sessions}회기가 추가되었습니다
      </Text>
      <Pressable
        onPress={onDone}
        style={[
          styles.resultButton,
          {
            backgroundColor: theme.colors.primary,
            borderRadius: theme.borderRadius.lg,
          },
        ]}
        accessibilityRole="button"
        accessibilityLabel="확인"
      >
        <Text
          style={{
            color: theme.colors.textOnPrimary,
            fontFamily: theme.fontFamily.semibold,
            fontSize: theme.fontSize.base,
          }}
        >
          확인
        </Text>
      </Pressable>
    </Animated.View>
  );
}

function ErrorView({ onRetry }: { onRetry: () => void }) {
  const theme = useTheme();

  return (
    <Animated.View
      entering={FadeInDown.duration(500).springify()}
      style={styles.resultContainer}
    >
      <View
        style={[
          styles.resultIcon,
          { backgroundColor: `${theme.colors.error}20` },
        ]}
      >
        <CreditCard size={48} color={theme.colors.error} />
      </View>
      <Text
        style={{
          color: theme.colors.textMain,
          fontFamily: theme.fontFamily.bold,
          fontSize: theme.fontSize['2xl'],
          marginTop: 24,
          textAlign: 'center',
        }}
      >
        결제 실패
      </Text>
      <Text
        style={{
          color: theme.colors.textSecondary,
          fontFamily: theme.fontFamily.regular,
          fontSize: theme.fontSize.base,
          marginTop: 8,
          textAlign: 'center',
        }}
      >
        결제 처리 중 오류가 발생했습니다.{'\n'}다시 시도해주세요.
      </Text>
      <Pressable
        onPress={onRetry}
        style={[
          styles.resultButton,
          {
            backgroundColor: theme.colors.primary,
            borderRadius: theme.borderRadius.lg,
          },
        ]}
        accessibilityRole="button"
        accessibilityLabel="다시 시도"
      >
        <Text
          style={{
            color: theme.colors.textOnPrimary,
            fontFamily: theme.fontFamily.semibold,
            fontSize: theme.fontSize.base,
          }}
        >
          다시 시도
        </Text>
      </Pressable>
    </Animated.View>
  );
}

interface TossPaymentParams {
  clientKey: string;
  amount: number;
  orderId: string;
  orderName: string;
  customerName: string;
  successUrl: string;
  failUrl: string;
}

function buildTossPaymentHtml(params: TossPaymentParams): string {
  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <script src="https://js.tosspayments.com/v2/standard"></script>
  <style>
    body { margin: 0; padding: 16px; font-family: -apple-system, BlinkMacSystemFont, sans-serif; background: #FAF9F7; }
    #payment-widget { min-height: 300px; }
    #agreement-widget { margin-top: 16px; }
    .error { color: #E57373; text-align: center; padding: 20px; }
  </style>
</head>
<body>
  <div id="payment-widget"></div>
  <div id="agreement-widget"></div>
  <script>
    (async () => {
      try {
        const tossPayments = TossPayments("${params.clientKey}");
        const widgets = tossPayments.widgets({ customerKey: "ANONYMOUS" });

        await widgets.setAmount({ currency: "KRW", value: ${params.amount} });

        await Promise.all([
          widgets.renderPaymentMethods({
            selector: "#payment-widget",
            variantKey: "DEFAULT"
          }),
          widgets.renderAgreement({
            selector: "#agreement-widget",
            variantKey: "AGREEMENT"
          })
        ]);

        const button = document.createElement("button");
        button.textContent = "결제하기";
        button.style.cssText = "width:100%;padding:16px;margin-top:24px;background:#E07A5F;color:#fff;border:none;border-radius:12px;font-size:16px;font-weight:600;cursor:pointer;";
        document.body.appendChild(button);

        button.addEventListener("click", async () => {
          try {
            await widgets.requestPayment({
              orderId: "${params.orderId}",
              orderName: "${params.orderName}",
              customerName: "${params.customerName}",
              successUrl: "${params.successUrl}",
              failUrl: "${params.failUrl}",
            });
          } catch (err) {
            if (err.code === "USER_CANCEL") return;
            window.ReactNativeWebView.postMessage(JSON.stringify({ status: "fail", message: err.message }));
          }
        });
      } catch (err) {
        document.body.innerHTML = '<div class="error">결제 위젯을 불러올 수 없습니다.</div>';
        window.ReactNativeWebView.postMessage(JSON.stringify({ status: "fail", message: err.message }));
      }
    })();
  </script>
</body>
</html>`;
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
  },
  scrollContent: {
    padding: 16,
    paddingBottom: 100,
  },
  currentBalanceCard: {
    alignItems: 'center',
    padding: 20,
    gap: 4,
  },
  sectionTitle: {
    marginTop: 24,
    marginBottom: 12,
  },
  packageList: {
    gap: 10,
  },
  packageCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    position: 'relative',
    overflow: 'hidden',
  },
  popularBadge: {
    position: 'absolute',
    top: 0,
    right: 0,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderBottomLeftRadius: 8,
  },
  packageInfo: {
    flex: 1,
  },
  packageHeader: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  packageRight: {
    alignItems: 'flex-end',
    gap: 8,
  },
  checkCircle: {
    width: 24,
    height: 24,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  summaryCard: {
    padding: 16,
    marginTop: 16,
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 8,
  },
  summaryDivider: {
    height: StyleSheet.hairlineWidth,
    marginVertical: 4,
  },
  bottomBar: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    padding: 16,
    paddingBottom: 32,
    borderTopWidth: StyleSheet.hairlineWidth,
  },
  payButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
  },
  webviewContainer: {
    flex: 1,
  },
  webview: {
    flex: 1,
  },
  webviewLoading: {
    padding: 20,
    alignItems: 'center',
    gap: 12,
  },
  webviewLoadingGap: {
    marginTop: 8,
  },
  resultContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 32,
  },
  resultIcon: {
    width: 100,
    height: 100,
    borderRadius: 50,
    alignItems: 'center',
    justifyContent: 'center',
  },
  resultButton: {
    marginTop: 32,
    paddingHorizontal: 48,
    paddingVertical: 14,
  },
});
