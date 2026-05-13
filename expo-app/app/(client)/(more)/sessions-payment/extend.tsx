/**
 * 회기 연장 요청 화면
 * 패키지 선택 + 토스페이먼츠 WebView 결제
 *
 * @author MindGarden
 * @since 2026-05-12
 */
import React, { useCallback, useMemo, useRef, useState } from 'react';
import {
  Alert,
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
import { borderRadius, colors as designColors } from '@/theme/tokens';
import { useAuthStore } from '@/stores/useAuthStore';
import { useTenantStore } from '@/stores/useTenantStore';
import {
  useSessionBalance,
  useCreatePayment,
} from '@/api/hooks/usePayments';
import { SkeletonLoader } from '@/components/atoms/SkeletonLoader';
import {
  getSessionExtensionPackages,
  type SessionExtensionPackage,
} from '@/constants/sessionExtensionCatalog';
import {
  getTossPaymentsClientKey,
  getTossPaymentSuccessUrl,
  getTossPaymentFailUrl,
  isTossPaymentsClientKeyConfigured,
} from '@/config/tossPayments';

type PaymentStep = 'select' | 'payment' | 'success' | 'error' | 'cancelled';

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
  const tenantId = useTenantStore((s) => s.tenantId);
  const clientId = user?.id;

  const packages = useMemo(() => getSessionExtensionPackages(), []);

  const [selectedPackageId, setSelectedPackageId] = useState<number | null>(null);
  const [step, setStep] = useState<PaymentStep>('select');
  const [failDetail, setFailDetail] = useState<string>('');
  const orderIdRef = useRef<string>('');

  const { data: balance } = useSessionBalance(clientId);
  const createPayment = useCreatePayment();

  const selectedPackage =
    packages.find((p) => p.id === selectedPackageId) ?? null;

  const tossReady = isTossPaymentsClientKeyConfigured();

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
    if (!selectedPackage || !clientId) {
      return;
    }
    if (!tenantId || String(tenantId).trim() === '') {
      Alert.alert(
        '기관 정보 필요',
        '테넌트(기관)가 선택되지 않았습니다. 로그아웃 후 기관을 다시 선택해 주세요.',
      );
      return;
    }
    if (!tossReady) {
      Alert.alert(
        '결제 설정 필요',
        '토스페이먼츠 클라이언트 키가 설정되지 않았습니다. EAS Secret 또는 EXPO_PUBLIC_TOSS_PAYMENTS_CLIENT_KEY를 설정한 뒤 다시 빌드해 주세요.',
      );
      return;
    }

    if (Platform.OS !== 'web') {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    }

    orderIdRef.current = generateOrderId();
    setFailDetail('');
    setStep('payment');
  }, [selectedPackage, clientId, tenantId, tossReady]);

  const handleWebViewMessage = useCallback(
    async (event: { nativeEvent: { data: string } }) => {
      try {
        const data = JSON.parse(event.nativeEvent.data) as {
          status?: string;
          paymentKey?: string;
          orderId?: string;
          amount?: number;
          message?: string;
        };

        if (data.status === 'success') {
          if (!clientId || !selectedPackage) {
            return;
          }

          const expectedOrderId = orderIdRef.current;
          if (
            data.orderId != null &&
            String(data.orderId) !== String(expectedOrderId)
          ) {
            setFailDetail(
              '결제 주문 번호가 일치하지 않습니다. 중복 결제 여부를 확인한 뒤 고객센터로 문의해 주세요.',
            );
            setStep('error');
            return;
          }

          if (data.amount != null) {
            const paid = Number(data.amount);
            if (
              !Number.isFinite(paid) ||
              paid !== selectedPackage.price
            ) {
              setFailDetail(
                '결제 금액이 선택한 패키지와 다릅니다. 환불·재결제가 필요하면 고객센터로 문의해 주세요.',
              );
              setStep('error');
              return;
            }
          }

          if (data.paymentKey == null || String(data.paymentKey).trim() === '') {
            setFailDetail('결제 승인 정보가 없습니다. 다시 시도해 주세요.');
            setStep('error');
            return;
          }

          try {
            await createPayment.mutateAsync({
              clientId,
              packageId: selectedPackage.id,
              paymentKey: String(data.paymentKey),
              orderId: data.orderId != null ? String(data.orderId) : expectedOrderId,
              amount: selectedPackage.price,
            });
          } catch (e) {
            const msg =
              e != null &&
              typeof e === 'object' &&
              'message' in e &&
              typeof (e as { message?: unknown }).message === 'string'
                ? String((e as { message: string }).message).trim()
                : '';
            setFailDetail(
              msg !== ''
                ? msg
                : '서버에서 결제 확정에 실패했습니다. 결제는 되었을 수 있으니 내역을 확인해 주세요.',
            );
            setStep('error');
            return;
          }

          if (Platform.OS !== 'web') {
            Haptics.notificationAsync(
              Haptics.NotificationFeedbackType.Success,
            );
          }
          setStep('success');
        } else if (data.status === 'cancel') {
          setStep('cancelled');
        } else if (data.status === 'fail') {
          const msg =
            data.message != null && String(data.message).trim() !== ''
              ? String(data.message).trim()
              : '결제를 완료할 수 없습니다.';
          setFailDetail(msg);
          setStep('error');
        }
      } catch {
        setFailDetail('결제 응답을 해석할 수 없습니다. 앱을 다시 실행한 뒤 결제 내역을 확인해 주세요.');
        setStep('error');
      }
    },
    [clientId, selectedPackage, createPayment],
  );

  const handleRetry = useCallback(() => {
    setStep('select');
    setSelectedPackageId(null);
    setFailDetail('');
  }, []);

  const handleDone = useCallback(() => {
    router.back();
  }, [router]);

  const tossClientKey = getTossPaymentsClientKey();
  const tossPaymentHtml = selectedPackage
    ? buildTossPaymentHtml({
        clientKey: tossClientKey,
        amount: selectedPackage.price,
        orderId: orderIdRef.current,
        orderName: `MindGarden ${selectedPackage.name}`,
        customerName: user?.name ?? '내담자',
        successUrl: getTossPaymentSuccessUrl(),
        failUrl: getTossPaymentFailUrl(),
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

  if (step === 'cancelled') {
    return (
      <SafeAreaView
        style={[styles.safeArea, { backgroundColor: theme.colors.bgMain }]}
        edges={['bottom']}
      >
        <CancelledView onRetry={handleRetry} />
      </SafeAreaView>
    );
  }

  if (step === 'error') {
    return (
      <SafeAreaView
        style={[styles.safeArea, { backgroundColor: theme.colors.bgMain }]}
        edges={['bottom']}
      >
        <ErrorView message={failDetail} onRetry={handleRetry} />
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

        {!tossReady && (
          <View
            style={[
              styles.configBanner,
              {
                backgroundColor: theme.colors.surfaceAlt,
                borderColor: theme.colors.border,
                borderRadius: theme.borderRadius.lg,
              },
            ]}
          >
            <Text
              style={{
                color: theme.colors.textSecondary,
                fontFamily: theme.fontFamily.regular,
                fontSize: theme.fontSize.sm,
                lineHeight: 20,
              }}
            >
              카드 결제를 쓰려면 빌드 시 EXPO_PUBLIC_TOSS_PAYMENTS_CLIENT_KEY(또는 EAS
              extra.tossPaymentsClientKey)를 설정해야 합니다. 키는 저장소에 커밋하지 마세요.
            </Text>
          </View>
        )}

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
          {packages.map((pkg, index) => (
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
          disabled={!selectedPackageId || createPayment.isPending || !tossReady}
          style={({ pressed }) => [
            styles.payButton,
            {
              backgroundColor:
                selectedPackageId && tossReady
                  ? theme.colors.primary
                  : theme.colors.gray[300],
              borderRadius: theme.borderRadius.lg,
              opacity: pressed ? 0.85 : 1,
            },
          ]}
          accessibilityRole="button"
          accessibilityLabel="결제하고 회기 연장하기"
          accessibilityState={{
            disabled: !selectedPackageId || createPayment.isPending || !tossReady,
          }}
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
  pkg: SessionExtensionPackage;
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

function ErrorView({
  message,
  onRetry,
}: {
  message?: string;
  onRetry: () => void;
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
        {message != null && message.trim() !== ''
          ? message
          : '결제 처리 중 오류가 발생했습니다.\n다시 시도해 주세요.'}
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

function CancelledView({ onRetry }: { onRetry: () => void }) {
  const theme = useTheme();

  return (
    <Animated.View
      entering={FadeInDown.duration(500).springify()}
      style={styles.resultContainer}
    >
      <View
        style={[
          styles.resultIcon,
          { backgroundColor: `${theme.colors.warning}25` },
        ]}
      >
        <CreditCard size={48} color={theme.colors.warning} />
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
        결제를 취소했습니다
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
        처음부터 다시 진행하거나, 다른 결제 수단으로 시도해 주세요.
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
        accessibilityLabel="돌아가기"
      >
        <Text
          style={{
            color: theme.colors.textOnPrimary,
            fontFamily: theme.fontFamily.semibold,
            fontSize: theme.fontSize.base,
          }}
        >
          돌아가기
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
  const bg = designColors.client.bgMain;
  const err = designColors.common.error;
  const btnBg = designColors.client.primary;
  const btnFg = designColors.common.textOnPrimary;
  const radius = borderRadius.lg;
  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <script src="https://js.tosspayments.com/v2/standard"></script>
  <style>
    body { margin: 0; padding: 16px; font-family: -apple-system, BlinkMacSystemFont, sans-serif; background: ${bg}; }
    #payment-widget { min-height: 300px; }
    #agreement-widget { margin-top: 16px; }
    .error { color: ${err}; text-align: center; padding: 20px; }
  </style>
</head>
<body>
  <div id="payment-widget"></div>
  <div id="agreement-widget"></div>
  <script>
    (async () => {
      try {
        const tossPayments = TossPayments(${JSON.stringify(params.clientKey)});
        const widgets = tossPayments.widgets({ customerKey: "ANONYMOUS" });

        await widgets.setAmount({ currency: "KRW", value: ${Number(params.amount)} });

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
        button.style.cssText = "width:100%;padding:16px;margin-top:24px;background:${btnBg};color:${btnFg};border:none;border-radius:${radius}px;font-size:16px;font-weight:600;cursor:pointer;";
        document.body.appendChild(button);

        button.addEventListener("click", async () => {
          try {
            await widgets.requestPayment({
              orderId: ${JSON.stringify(params.orderId)},
              orderName: ${JSON.stringify(params.orderName)},
              customerName: ${JSON.stringify(params.customerName)},
              successUrl: ${JSON.stringify(params.successUrl)},
              failUrl: ${JSON.stringify(params.failUrl)},
            });
          } catch (err) {
            if (err && err.code === "USER_CANCEL") {
              window.ReactNativeWebView.postMessage(JSON.stringify({ status: "cancel" }));
              return;
            }
            const msg = err && err.message ? String(err.message) : "결제 요청 실패";
            window.ReactNativeWebView.postMessage(JSON.stringify({ status: "fail", message: msg }));
          }
        });
      } catch (err) {
        document.body.innerHTML = '<div class="error">결제 위젯을 불러올 수 없습니다.</div>';
        const msg = err && err.message ? String(err.message) : "위젯 초기화 실패";
        window.ReactNativeWebView.postMessage(JSON.stringify({ status: "fail", message: msg }));
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
  configBanner: {
    marginTop: 12,
    padding: 12,
    borderWidth: 1,
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
