/**
 * Step 3: 신청 확인
 * 예약 요약 + 가예약 신청. 센터 확정 후 확정되며 회기 차감은 결제 완료 후 서버가 1회만 처리한다.
 *
 * @author MindGarden
 * @since 2026-05-12
 */
import { useMemo } from 'react';
import { Alert, Pressable, ScrollView, StyleSheet, Text, View, Platform } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useLocalSearchParams, useRouter } from 'expo-router';
import * as Haptics from 'expo-haptics';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { Calendar, Clock, Ticket } from 'lucide-react-native';
import { useTheme } from '@/theme';
import { toDisplayString } from '@/utils/safeDisplay';
import { AppTopBar } from '@/components/app-chrome/AppTopBar';
import { ProgressBar } from '@/components/molecules/ProgressBar';
import { Avatar } from '@/components/atoms/Avatar';
import { useCreateBooking, useDefaultConsultationType } from '@/api/hooks/useBooking';
import { buildCreateBookingRequest } from '@/api/hooks/clientBookingPayload';
import { useAuthStore } from '@/stores/useAuthStore';
import { useTenantStore } from '@/stores/useTenantStore';

const STEP_LABELS = ['상담사 선택', '시간 선택', '신청'];

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

  const { data: consultationType, isLoading: consultationTypeLoading } =
    useDefaultConsultationType();

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
    if (!consultationType) {
      Alert.alert('상담 유형 없음', '기관에 등록된 상담 유형이 없습니다. 센터에 문의해 주세요.');
      return;
    }

    if (Platform.OS !== 'web') {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    }
    try {
      await createBooking.mutateAsync(
        buildCreateBookingRequest({
          consultantId: String(params.consultantId),
          date: String(params.date),
          startTime: String(params.startTime),
          endTime: String(params.endTime),
          consultationType: consultationType.value,
        }),
      );
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
      const msg = extractErrorMessage(e, '예약 신청 중 문제가 발생했습니다. 다시 시도해 주세요.');
      Alert.alert('예약 신청 실패', msg);
    }
  };

  const consultationTypeDesc = consultationTypeLoading
    ? '상담 유형을 불러오는 중…'
    : toDisplayString(consultationType?.label, '등록된 상담 유형 없음');

  const canConfirm =
    paramsReady &&
    !!tenantId &&
    clientId != null &&
    !consultationTypeLoading &&
    !!consultationType &&
    !createBooking.isPending;

  return (
    <SafeAreaView style={[styles.safe, { backgroundColor: theme.colors.bgMain }]} edges={['top']}>
      <AppTopBar title="예약 신청" canGoBack />
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

        {/* 가예약 신청 안내: 센터 확정 후 확정, 회기 차감은 결제 완료 후 */}
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
            신청 안내
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
            accessibilityLabel="상담 유형"
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
                  상담 유형
                </Text>
                <Text
                  style={{
                    fontFamily: theme.fontFamily.regular,
                    fontSize: theme.fontSize.sm,
                    color: theme.colors.textSecondary,
                  }}
                >
                  {consultationTypeDesc}
                </Text>
              </View>
            </View>
          </View>

          <Text
            style={{
              fontFamily: theme.fontFamily.regular,
              fontSize: theme.fontSize.sm,
              color: theme.colors.textSecondary,
            }}
          >
            예약 신청은 가예약으로 접수되며 센터 확정 후 예약이 확정됩니다. 회기는 결제 완료 후에 차감됩니다.
          </Text>
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
          accessibilityLabel="예약 신청"
          accessibilityRole="button"
        >
          <Text
            style={{
              fontFamily: theme.fontFamily.semibold,
              fontSize: theme.fontSize.base,
              color: theme.colors.textOnPrimary,
            }}
          >
            {createBooking.isPending ? '처리 중...' : '예약 신청'}
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
