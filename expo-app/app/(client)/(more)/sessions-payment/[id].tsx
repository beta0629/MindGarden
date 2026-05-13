/**
 * 결제 상세 화면
 * 결제 정보, 관련 상담 정보, 영수증, 환불 요청
 *
 * @author MindGarden
 * @since 2026-05-12
 */
import React, { useCallback } from 'react';
import {
  Alert,
  Linking,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useLocalSearchParams } from 'expo-router';
import * as Haptics from 'expo-haptics';
import Animated, { FadeInDown } from 'react-native-reanimated';
import {
  Calendar,
  Clock,
  CreditCard,
  FileText,
  Receipt,
  RotateCcw,
  User,
} from 'lucide-react-native';
import { useTheme } from '@/theme';
import { useAuthStore } from '@/stores/useAuthStore';
import { useSessionPaymentDetail, type PaymentStatus } from '@/api/hooks/usePayments';
import { Badge } from '@/components/atoms/Badge';
import { SkeletonCard } from '@/components/atoms/SkeletonLoader';
import { EmptyState } from '@/components/atoms/EmptyState';

const STATUS_LABEL: Record<PaymentStatus, string> = {
  COMPLETED: '결제 완료',
  PENDING: '결제 대기',
  FAILED: '결제 실패',
  CANCELLED: '결제 취소',
  REFUNDED: '환불 완료',
};

const STATUS_VARIANT: Record<PaymentStatus, 'success' | 'warning' | 'error' | 'gray' | 'info'> = {
  COMPLETED: 'success',
  PENDING: 'warning',
  FAILED: 'error',
  CANCELLED: 'gray',
  REFUNDED: 'info',
};

function formatCurrency(amount: number): string {
  return `₩${Number(amount || 0).toLocaleString()}`;
}

export default function PaymentDetailScreen() {
  const theme = useTheme();
  const { id } = useLocalSearchParams<{ id: string }>();
  const user = useAuthStore((s) => s.user);
  const clientId =
    user?.id != null && !Number.isNaN(Number(user.id))
      ? Number(user.id)
      : undefined;
  const paymentId = id ? Number(id) : undefined;

  const { data: payment, isLoading, isError } = useSessionPaymentDetail(
    clientId,
    paymentId,
  );

  const handleReceiptPress = useCallback(() => {
    if (payment?.receiptUrl) {
      Linking.openURL(payment.receiptUrl);
    }
  }, [payment?.receiptUrl]);

  const handleRefundPress = useCallback(() => {
    if (Platform.OS !== 'web') {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
    }
    Alert.alert(
      '환불 요청',
      '정말로 환불을 요청하시겠습니까?\n환불 처리까지 영업일 기준 3~5일이 소요됩니다.',
      [
        { text: '취소', style: 'cancel' },
        {
          text: '환불 요청',
          style: 'destructive',
          onPress: () => {
            // TODO: 환불 API 연동
          },
        },
      ],
    );
  }, []);

  if (isLoading) {
    return (
      <SafeAreaView
        style={[styles.safeArea, { backgroundColor: theme.colors.bgMain }]}
        edges={['bottom']}
      >
        <View style={styles.loadingContainer}>
          <SkeletonCard lines={4} />
          <SkeletonCard lines={3} style={styles.skeletonGap} />
        </View>
      </SafeAreaView>
    );
  }

  if (isError || !payment) {
    return (
      <SafeAreaView
        style={[styles.safeArea, { backgroundColor: theme.colors.bgMain }]}
        edges={['bottom']}
      >
        <EmptyState
          title="결제 정보를 불러올 수 없습니다"
          description="잠시 후 다시 시도해주세요"
        />
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
              styles.amountCard,
              {
                backgroundColor: theme.colors.surface,
                borderRadius: theme.borderRadius['2xl'],
                ...theme.shadows.md,
              },
            ]}
          >
            <Text
              style={{
                color: theme.colors.textTertiary,
                fontFamily: theme.fontFamily.regular,
                fontSize: theme.fontSize.sm,
              }}
            >
              결제 금액
            </Text>
            <Text
              style={[
                styles.amountText,
                {
                  color: theme.colors.textMain,
                  fontFamily: theme.fontFamily.bold,
                  fontSize: theme.fontSize['4xl'],
                },
              ]}
            >
              {formatCurrency(payment.amount)}
            </Text>
            <Badge
              label={STATUS_LABEL[payment.status]}
              variant={STATUS_VARIANT[payment.status]}
              size="md"
            />
          </View>
        </Animated.View>

        <Animated.View entering={FadeInDown.delay(100).duration(400)}>
          <SectionCard title="결제 정보">
            <InfoRow
              icon={Calendar}
              label="결제일"
              value={payment.paymentDate}
            />
            <InfoRow
              icon={CreditCard}
              label="결제수단"
              value={payment.paymentMethod}
            />
            <InfoRow
              icon={FileText}
              label="설명"
              value={payment.description}
            />
            {payment.sessionCount != null && (
              <InfoRow
                icon={FileText}
                label="회기 수"
                value={`${payment.sessionCount}회`}
              />
            )}
          </SectionCard>
        </Animated.View>

        {(payment.consultantName || payment.consultationDate) && (
          <Animated.View entering={FadeInDown.delay(200).duration(400)}>
            <SectionCard title="관련 상담 정보">
              {payment.consultantName && (
                <InfoRow
                  icon={User}
                  label="상담사"
                  value={payment.consultantName}
                />
              )}
              {payment.consultationDate && (
                <InfoRow
                  icon={Calendar}
                  label="상담일"
                  value={payment.consultationDate}
                />
              )}
              {payment.consultationTime && (
                <InfoRow
                  icon={Clock}
                  label="시간"
                  value={payment.consultationTime}
                />
              )}
            </SectionCard>
          </Animated.View>
        )}

        {payment.receiptUrl && (
          <Animated.View entering={FadeInDown.delay(300).duration(400)}>
            <Pressable
              onPress={handleReceiptPress}
              style={({ pressed }) => [
                styles.receiptButton,
                {
                  backgroundColor: pressed
                    ? theme.colors.accentSoft
                    : theme.colors.surface,
                  borderRadius: theme.borderRadius.xl,
                  borderColor: theme.colors.border,
                },
              ]}
              accessibilityRole="button"
              accessibilityLabel="영수증 보기"
            >
              <Receipt size={20} color={theme.colors.primary} />
              <Text
                style={{
                  color: theme.colors.primary,
                  fontFamily: theme.fontFamily.semibold,
                  fontSize: theme.fontSize.base,
                  marginLeft: 8,
                }}
              >
                영수증 보기
              </Text>
            </Pressable>
          </Animated.View>
        )}

        {payment.refundable && payment.status === 'COMPLETED' && (
          <Animated.View entering={FadeInDown.delay(400).duration(400)}>
            <Pressable
              onPress={handleRefundPress}
              style={({ pressed }) => [
                styles.refundButton,
                {
                  backgroundColor: pressed
                    ? `${theme.colors.error}15`
                    : theme.colors.surface,
                  borderRadius: theme.borderRadius.xl,
                  borderColor: theme.colors.error,
                },
              ]}
              accessibilityRole="button"
              accessibilityLabel="환불 요청"
            >
              <RotateCcw size={18} color={theme.colors.error} />
              <Text
                style={{
                  color: theme.colors.error,
                  fontFamily: theme.fontFamily.semibold,
                  fontSize: theme.fontSize.base,
                  marginLeft: 8,
                }}
              >
                환불 요청
              </Text>
            </Pressable>
            {payment.refundDeadline && (
              <Text
                style={[
                  styles.refundNotice,
                  {
                    color: theme.colors.textTertiary,
                    fontFamily: theme.fontFamily.regular,
                    fontSize: theme.fontSize.xs,
                  },
                ]}
              >
                환불 가능 기한: {payment.refundDeadline}
              </Text>
            )}
          </Animated.View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

function SectionCard({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  const theme = useTheme();
  return (
    <View
      style={[
        styles.sectionCard,
        {
          backgroundColor: theme.colors.surface,
          borderRadius: theme.borderRadius.xl,
          ...theme.shadows.sm,
        },
      ]}
    >
      <Text
        style={[
          styles.sectionTitle,
          {
            color: theme.colors.textMain,
            fontFamily: theme.fontFamily.semibold,
            fontSize: theme.fontSize.base,
          },
        ]}
      >
        {title}
      </Text>
      {children}
    </View>
  );
}

function InfoRow({
  icon: Icon,
  label,
  value,
}: {
  icon: React.ComponentType<{ size: number; color: string }>;
  label: string;
  value: string;
}) {
  const theme = useTheme();
  return (
    <View style={styles.infoRow}>
      <View style={styles.infoRowLeft}>
        <Icon size={16} color={theme.colors.textTertiary} />
        <Text
          style={{
            color: theme.colors.textSecondary,
            fontFamily: theme.fontFamily.regular,
            fontSize: theme.fontSize.sm,
            marginLeft: 8,
          }}
        >
          {label}
        </Text>
      </View>
      <Text
        style={{
          color: theme.colors.textMain,
          fontFamily: theme.fontFamily.medium,
          fontSize: theme.fontSize.sm,
          flexShrink: 1,
          textAlign: 'right',
        }}
        numberOfLines={2}
      >
        {value}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
  },
  loadingContainer: {
    padding: 16,
    gap: 12,
  },
  skeletonGap: {
    marginTop: 8,
  },
  scrollContent: {
    padding: 16,
    gap: 12,
    paddingBottom: 40,
  },
  amountCard: {
    alignItems: 'center',
    padding: 24,
    gap: 8,
  },
  amountText: {
    marginVertical: 4,
  },
  sectionCard: {
    padding: 16,
  },
  sectionTitle: {
    marginBottom: 12,
  },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 10,
  },
  infoRowLeft: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  receiptButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 14,
    borderWidth: 1,
  },
  refundButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 14,
    borderWidth: 1,
  },
  refundNotice: {
    textAlign: 'center',
    marginTop: 8,
  },
});
