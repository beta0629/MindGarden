/**
 * Step 3: 결제/확인
 * 예약 요약 + 보유 회기 차감 확정 (잔여 회기는 서버 매칭 API 기준)
 *
 * @author MindGarden
 * @since 2026-05-12
 */
import { useMemo } from 'react';
import { Alert, Pressable, ScrollView, StyleSheet, Text, View, Platform } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useQueryClient } from '@tanstack/react-query';
import * as Haptics from 'expo-haptics';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { Calendar, Clock, Ticket } from 'lucide-react-native';
import { useTheme } from '@/theme';
import { toDisplayString } from '@/utils/safeDisplay';
import { AppTopBar } from '@/components/templates/AppTopBar';
import { ProgressBar } from '@/components/molecules/ProgressBar';
import { Avatar } from '@/components/atoms/Avatar';
import { useCreateBooking } from '@/api/hooks/useBooking';
import { useSessionBalance, PAYMENT_QUERY_KEYS } from '@/api/hooks/usePayments';
import { useAuthStore } from '@/stores/useAuthStore';
import { useTenantStore } from '@/stores/useTenantStore';

const STEP_LABELS = ['상담사 선택', '시간 선택', '결제'];

function extractErrorMessage(error: unknown, fallback: string): string {
  if (
    error != null &&
    typeof error === 'object' &&
    'message' in error &&
    typeof (error as { message?: unknown }).message === 'string'
  ) {
    const m = (error as { message: string }).message.trim();
    if (m !== '') {
      return m;
    }
  }
  return fallback;
}

export default function BookingPayment() {
  const theme = useTheme();
  const router = useRouter();
  const queryClient = useQueryClient();
  const params = useLocalSearchParams<{
    consultantId: string;
    consultantName: string;
    date: string;
    startTime: string;
    endTime: string;
  }>();

  const user = useAuthStore((s) => s.user);
  const tenantId = useTenantStore((s) => s.tenantId);
  const clientId = user?.id;

  const { data: balance, isLoading: balanceLoading } = useSessionBalance(clientId);
  const remainingSessions = balance?.remainingSessions ?? 0;

  const createBooking = useCreateBooking();

  const consultantLabel = toDisplayString(params.consultantName, '상담');

  const paramsReady = useMemo(() => {
    const cid = params.consultantId;
    return (
      cid != null &&
      String(cid).trim() !== '' &&
      params.date != null &&
      String(params.date).trim() !== '' &&
      params.startTime != null &&
      params.endTime != null
    );
  }, [params]);

  const handleConfirm = async () => {
    if (!paramsReady) {
      Alert.alert('예약 정보 없음', '예약 단계를 처음부터 다시 진행해 주세요.');
      return;
    }
    if (!tenantId || String(tenantId).trim() === '') {
      Alert.alert(
        '기관 정보 필요',
        '테넌트(기관)가 선택되지 않았습니다. 로그아웃 후 기관을 다시 선택해 주세요.',
      );
      return;
    }
    if (clientId == null) {
      Alert.alert('로그인 필요', '다시 로그인한 뒤 예약을 진행해 주세요.');
      return;
    }
    if (remainingSessions < 1) {
      Alert.alert(
        '보유 회기 없음',
        '잔여 회기가 없습니다. 회기·결제 메뉴에서 패키지를 구매한 뒤 다시 예약해 주세요.',
      );
      return;
    }

    if (Platform.OS !== 'web') {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    }
    try {
      await createBooking.mutateAsync({
        consultantId: Number(params.consultantId),
        scheduledDate: String(params.date),
        startTime: String(params.startTime),
        endTime: String(params.endTime),
        sessionType: 'REGULAR',
        paymentMethod: 'SESSION_DEDUCT',
      });
      await queryClient.invalidateQueries({ queryKey: PAYMENT_QUERY_KEYS.all });
      router.push({
        pathname: '/(client)/(booking)/complete',
        params: {
          consultantName: consultantLabel,
          date: params.date,
          startTime: params.startTime,
          endTime: params.endTime,
        },
      });
    } catch (e) {
      const msg = extractErrorMessage(e, '예약 처리 중 문제가 발생했습니다. 다시 시도해 주세요.');
      Alert.alert('예약 실패', msg);
    }
  };

  const sessionDeductDesc = balanceLoading
    ? '잔여 회기를 불러오는 중…'
    : `잔여 ${remainingSessions}회기`;

  const canConfirm =
    paramsReady &&
    !!tenantId &&
    clientId != null &&
    !balanceLoading &&
    remainingSessions >= 1 &&
    !createBooking.isPending;

  return (
    <SafeAreaView style={[styles.safe, { backgroundColor: theme.colors.bgMain }]} edges={['top']}>
      <AppTopBar title="결제" canGoBack />
      <ProgressBar currentStep={3} totalSteps={3} labels={STEP_LABELS} />

      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
        {/* 예약 요약 */}
        <Animated.View entering={FadeInDown.springify()}>
          <View
            style={[
              styles.summaryCard,
              {
                backgroundColor: theme.colors.surface,
                borderRadius: theme.borderRadius.xl,
                ...theme.shadows.sm,
              },
            ]}
          >
            <Text
              style={{
                fontFamily: theme.fontFamily.semibold,
                fontSize: theme.fontSize.base,
                color: theme.colors.textMain,
                marginBottom: 16,
              }}
            >
              예약 정보
            </Text>

            <View style={styles.summaryRow}>
              <Avatar name={consultantLabel} size="md" />
              <Text
                style={{
                  fontFamily: theme.fontFamily.semibold,
                  fontSize: theme.fontSize.base,
                  color: theme.colors.textMain,
                  marginLeft: 12,
                }}
              >
                {consultantLabel} 전문가
              </Text>
            </View>

            <View style={styles.detailRow}>
              <Calendar size={16} color={theme.colors.textSecondary} />
              <Text
                style={{
                  fontFamily: theme.fontFamily.regular,
                  fontSize: theme.fontSize.sm,
                  color: theme.colors.textSecondary,
                  marginLeft: 8,
                }}
              >
                {params.date}
              </Text>
            </View>

            <View style={styles.detailRow}>
              <Clock size={16} color={theme.colors.textSecondary} />
              <Text
                style={{
                  fontFamily: theme.fontFamily.regular,
                  fontSize: theme.fontSize.sm,
                  color: theme.colors.textSecondary,
                  marginLeft: 8,
                }}
              >
                {params.startTime} - {params.endTime}
              </Text>
            </View>
          </View>
        </Animated.View>

        {/* 결제: 예약 확정은 보유 회기 차감만 지원. 카드 패키지는 회기·결제 메뉴. */}
        <Animated.View entering={FadeInDown.delay(100).springify()}>
          <Text
            style={[
              styles.sectionTitle,
              {
                fontFamily: theme.fontFamily.semibold,
                fontSize: theme.fontSize.base,
                color: theme.colors.textMain,
              },
            ]}
          >
            결제 방법
          </Text>

          <View
            style={[
              styles.paymentOption,
              {
                backgroundColor: theme.colors.surfaceAlt,
                borderColor: theme.colors.primary,
                borderRadius: theme.borderRadius.xl,
              },
            ]}
            accessibilityLabel="보유 회기 차감"
            accessibilityRole="text"
          >
            <View style={styles.paymentLeft}>
              <Ticket size={20} color={theme.colors.primary} />
              <View style={styles.paymentText}>
                <Text
                  style={{
                    fontFamily: theme.fontFamily.semibold,
                    fontSize: theme.fontSize.base,
                    color: theme.colors.textMain,
                  }}
                >
                  보유 회기 차감
                </Text>
                <Text
                  style={{
                    fontFamily: theme.fontFamily.regular,
                    fontSize: theme.fontSize.sm,
                    color: theme.colors.textSecondary,
                  }}
                >
                  {sessionDeductDesc}
                </Text>
              </View>
            </View>
          </View>

          {remainingSessions < 1 && !balanceLoading && (
            <Pressable
              onPress={() => router.push('/(client)/(more)/sessions-payment/extend')}
              style={({ pressed }) => [
                styles.extendHint,
                {
                  borderColor: theme.colors.border,
                  backgroundColor: pressed ? theme.colors.accentSoft : theme.colors.surface,
                  borderRadius: theme.borderRadius.lg,
                },
              ]}
              accessibilityRole="button"
              accessibilityLabel="회기 연장 및 패키지 구매"
            >
              <Text
                style={{
                  fontFamily: theme.fontFamily.medium,
                  fontSize: theme.fontSize.sm,
                  color: theme.colors.primary,
                  textAlign: 'center',
                }}
              >
                회기가 없으시면 회기 연장·패키지 구매로 이동
              </Text>
            </Pressable>
          )}
        </Animated.View>
      </ScrollView>

      {/* 하단 고정 버튼 */}
      <View
        style={[
          styles.bottomBar,
          {
            backgroundColor: theme.colors.surface,
            borderTopColor: theme.colors.divider,
            ...theme.shadows.md,
          },
        ]}
      >
        <Pressable
          onPress={handleConfirm}
          disabled={!canConfirm}
          style={[
            styles.confirmButton,
            {
              backgroundColor: canConfirm ? theme.colors.primary : theme.colors.gray[300],
              borderRadius: theme.borderRadius.lg,
            },
          ]}
          accessibilityLabel="예약 확정"
          accessibilityRole="button"
        >
          <Text
            style={{
              fontFamily: theme.fontFamily.semibold,
              fontSize: theme.fontSize.base,
              color: theme.colors.textOnPrimary,
            }}
          >
            {createBooking.isPending ? '처리 중...' : '예약 확정'}
          </Text>
        </Pressable>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
  },
  scroll: {
    paddingHorizontal: 16,
    paddingBottom: 120,
    gap: 16,
  },
  summaryCard: {
    padding: 20,
  },
  summaryRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  detailRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 8,
  },
  sectionTitle: {
    marginTop: 8,
    marginBottom: 12,
  },
  paymentOption: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
    borderWidth: 1.5,
    marginBottom: 12,
  },
  paymentLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  paymentText: {
    marginLeft: 12,
    gap: 2,
  },
  extendHint: {
    marginTop: 4,
    paddingVertical: 14,
    paddingHorizontal: 12,
    borderWidth: 1,
  },
  bottomBar: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: 32,
    borderTopWidth: StyleSheet.hairlineWidth,
  },
  confirmButton: {
    height: 56,
    alignItems: 'center',
    justifyContent: 'center',
    width: '100%',
  },
});
