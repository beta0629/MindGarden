/**
 * Step 3: 결제/확인
 * 예약 요약 + 결제 방법 선택 + 확정
 *
 * @author MindGarden
 * @since 2026-05-12
 */
import { useState } from 'react';
import {
  Alert,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
  Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useLocalSearchParams, useRouter } from 'expo-router';
import * as Haptics from 'expo-haptics';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { Calendar, Clock, CreditCard, Ticket } from 'lucide-react-native';
import { useTheme } from '@/theme';
import { AppTopBar } from '@/components/templates/AppTopBar';
import { ProgressBar } from '@/components/molecules/ProgressBar';
import { Avatar } from '@/components/atoms/Avatar';
import { useCreateBooking } from '@/api/hooks/useBooking';

type PaymentMethod = 'SESSION_DEDUCT' | 'TOSS_PAYMENT';

const STEP_LABELS = ['상담사 선택', '시간 선택', '결제'];
const REMAINING_SESSIONS = 5;

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

  const [paymentMethod, setPaymentMethod] =
    useState<PaymentMethod>('SESSION_DEDUCT');

  const createBooking = useCreateBooking();

  const handleConfirm = async () => {
    if (Platform.OS !== 'web') {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    }
    try {
      await createBooking.mutateAsync({
        consultantId: Number(params.consultantId),
        scheduledDate: params.date,
        startTime: params.startTime,
        endTime: params.endTime,
        sessionType: 'REGULAR',
        paymentMethod,
      });
      router.push({
        pathname: '/(client)/(booking)/complete',
        params: {
          consultantName: params.consultantName,
          date: params.date,
          startTime: params.startTime,
          endTime: params.endTime,
        },
      });
    } catch {
      Alert.alert('예약 실패', '예약 처리 중 문제가 발생했습니다. 다시 시도해주세요.');
    }
  };

  const renderPaymentOption = (
    method: PaymentMethod,
    icon: React.ReactNode,
    title: string,
    desc: string,
  ) => {
    const selected = paymentMethod === method;
    return (
      <Pressable
        onPress={() => {
          if (Platform.OS !== 'web') {
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
          }
          setPaymentMethod(method);
        }}
        style={[
          styles.paymentOption,
          {
            backgroundColor: selected
              ? theme.colors.surfaceAlt
              : theme.colors.surface,
            borderColor: selected
              ? theme.colors.primary
              : theme.colors.border,
            borderRadius: theme.borderRadius.xl,
          },
        ]}
        accessibilityLabel={title}
        accessibilityState={{ selected }}
      >
        <View style={styles.paymentLeft}>
          {icon}
          <View style={styles.paymentText}>
            <Text
              style={{
                fontFamily: theme.fontFamily.semibold,
                fontSize: theme.fontSize.base,
                color: theme.colors.textMain,
              }}
            >
              {title}
            </Text>
            <Text
              style={{
                fontFamily: theme.fontFamily.regular,
                fontSize: theme.fontSize.sm,
                color: theme.colors.textSecondary,
              }}
            >
              {desc}
            </Text>
          </View>
        </View>
        <View
          style={[
            styles.radio,
            {
              borderColor: selected
                ? theme.colors.primary
                : theme.colors.border,
            },
          ]}
        >
          {selected && (
            <View
              style={[
                styles.radioDot,
                { backgroundColor: theme.colors.primary },
              ]}
            />
          )}
        </View>
      </Pressable>
    );
  };

  return (
    <SafeAreaView
      style={[styles.safe, { backgroundColor: theme.colors.bgMain }]}
      edges={['top']}
    >
      <AppTopBar title="결제" canGoBack />
      <ProgressBar currentStep={3} totalSteps={3} labels={STEP_LABELS} />

      <ScrollView
        contentContainerStyle={styles.scroll}
        showsVerticalScrollIndicator={false}
      >
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
              <Avatar name={params.consultantName} size="md" />
              <Text
                style={{
                  fontFamily: theme.fontFamily.semibold,
                  fontSize: theme.fontSize.base,
                  color: theme.colors.textMain,
                  marginLeft: 12,
                }}
              >
                {params.consultantName} 전문가
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

        {/* 결제 방법 */}
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

          {renderPaymentOption(
            'SESSION_DEDUCT',
            <Ticket size={20} color={theme.colors.primary} />,
            '보유 회기 차감',
            `잔여 ${REMAINING_SESSIONS}회기`,
          )}

          {renderPaymentOption(
            'TOSS_PAYMENT',
            <CreditCard size={20} color={theme.colors.primary} />,
            '토스페이먼츠 결제',
            'Phase 3-E에서 연동 예정',
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
          disabled={createBooking.isPending}
          style={[
            styles.confirmButton,
            {
              backgroundColor: createBooking.isPending
                ? theme.colors.gray[300]
                : theme.colors.primary,
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
  radio: {
    width: 22,
    height: 22,
    borderRadius: 11,
    borderWidth: 2,
    alignItems: 'center',
    justifyContent: 'center',
  },
  radioDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
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
