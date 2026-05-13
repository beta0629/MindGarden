/**
 * 상담 상세 화면
 * 상담사 프로필 + 상담 정보 + 일지 열람 + 액션 버튼
 *
 * @author MindGarden
 * @since 2026-05-12
 */
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
import { Calendar, Clock, MapPin, FileText } from 'lucide-react-native';
import { useTheme } from '@/theme';
import { AppTopBar } from '@/components/templates/AppTopBar';
import { Avatar } from '@/components/atoms/Avatar';
import { Badge } from '@/components/atoms/Badge';
import { SkeletonCard } from '@/components/atoms/SkeletonLoader';
import { EmptyState } from '@/components/atoms/EmptyState';
import { useConsultationDetail } from '@/api/hooks/useConsultations';

function formatTime(time: string | undefined): string {
  if (!time) return '';
  const parts = time.split(':');
  return parts.length >= 2 ? `${parts[0]}:${parts[1]}` : time;
}

export default function ClientSessionDetail() {
  const theme = useTheme();
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();

  const { data: detail, isLoading } = useConsultationDetail(id);

  const isScheduled = detail?.status === 'SCHEDULED' || detail?.status === 'BOOKED';
  const isCompleted = detail?.status === 'COMPLETED';

  const handleCancelRequest = () => {
    Alert.alert(
      '상담 취소',
      '정말 이 상담을 취소하시겠습니까?',
      [
        { text: '아니요', style: 'cancel' },
        { text: '취소하기', style: 'destructive', onPress: () => {} },
      ],
    );
  };

  const handleReview = () => {
    if (Platform.OS !== 'web') {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    }
    router.push(`/(client)/(sessions)/review/${id}`);
  };

  if (isLoading) {
    return (
      <SafeAreaView
        style={[styles.safe, { backgroundColor: theme.colors.bgMain }]}
        edges={['top']}
      >
        <AppTopBar title="상담 상세" canGoBack />
        <View style={styles.loadingWrap}>
          <SkeletonCard />
          <SkeletonCard lines={4} />
        </View>
      </SafeAreaView>
    );
  }

  if (!detail) {
    return (
      <SafeAreaView
        style={[styles.safe, { backgroundColor: theme.colors.bgMain }]}
        edges={['top']}
      >
        <AppTopBar title="상담 상세" canGoBack />
        <EmptyState
          title="상담 정보를 불러올 수 없습니다"
          description="잠시 후 다시 시도해주세요"
        />
      </SafeAreaView>
    );
  }

  const statusConfig: Record<string, { label: string; variant: 'primary' | 'success' | 'error' | 'gray' }> = {
    BOOKED: { label: '예정', variant: 'primary' },
    SCHEDULED: { label: '예정', variant: 'primary' },
    IN_PROGRESS: { label: '진행중', variant: 'primary' },
    COMPLETED: { label: '완료', variant: 'success' },
    CANCELLED: { label: '취소', variant: 'error' },
    NO_SHOW: { label: '미출석', variant: 'gray' },
  };
  const status = statusConfig[detail.status] ?? statusConfig['SCHEDULED']!;

  return (
    <SafeAreaView
      style={[styles.safe, { backgroundColor: theme.colors.bgMain }]}
      edges={['top']}
    >
      <AppTopBar title="상담 상세" canGoBack />

      <ScrollView
        contentContainerStyle={styles.scroll}
        showsVerticalScrollIndicator={false}
      >
        {/* 상담사 프로필 */}
        <Animated.View
          entering={FadeInDown.springify()}
          style={[
            styles.profileCard,
            {
              backgroundColor: theme.colors.surface,
              borderRadius: theme.borderRadius.xl,
              ...theme.shadows.sm,
            },
          ]}
        >
          <View style={styles.profileRow}>
            <Avatar name={detail.consultantName} size="lg" />
            <View style={styles.profileInfo}>
              <Text
                style={{
                  fontFamily: theme.fontFamily.semibold,
                  fontSize: theme.fontSize.lg,
                  color: theme.colors.textMain,
                }}
              >
                {detail.consultantName}
              </Text>
              <Badge label={status.label} variant={status.variant} />
            </View>
          </View>
        </Animated.View>

        {/* 상담 정보 */}
        <Animated.View
          entering={FadeInDown.delay(100).springify()}
          style={[
            styles.infoCard,
            {
              backgroundColor: theme.colors.surface,
              borderRadius: theme.borderRadius.xl,
              ...theme.shadows.sm,
            },
          ]}
        >
          <Text
            style={[
              styles.cardTitle,
              {
                fontFamily: theme.fontFamily.semibold,
                fontSize: theme.fontSize.base,
                color: theme.colors.textMain,
              },
            ]}
          >
            상담 정보
          </Text>

          <DetailRow
            icon={<Calendar size={16} color={theme.colors.textSecondary} />}
            label="날짜"
            value={detail.date ?? '날짜 미정'}
            theme={theme}
          />
          <DetailRow
            icon={<Clock size={16} color={theme.colors.textSecondary} />}
            label="시간"
            value={`${formatTime(detail.startTime)} - ${formatTime(detail.endTime)}`}
            theme={theme}
          />
          {detail.location && (
            <DetailRow
              icon={<MapPin size={16} color={theme.colors.textSecondary} />}
              label="장소"
              value={detail.location}
              theme={theme}
            />
          )}
          <DetailRow
            icon={<FileText size={16} color={theme.colors.textSecondary} />}
            label="상담 유형"
            value={detail.consultationType ?? '-'}
            theme={theme}
          />
        </Animated.View>

        {/* 상담일지 (공유분) */}
        {detail.hasRecord && (
          <Animated.View
            entering={FadeInDown.delay(200).springify()}
            style={[
              styles.infoCard,
              {
                backgroundColor: theme.colors.surface,
                borderRadius: theme.borderRadius.xl,
                ...theme.shadows.sm,
              },
            ]}
          >
            <Text
              style={[
                styles.cardTitle,
                {
                  fontFamily: theme.fontFamily.semibold,
                  fontSize: theme.fontSize.base,
                  color: theme.colors.textMain,
                },
              ]}
            >
              상담일지
            </Text>
            <Text
              style={{
                fontFamily: theme.fontFamily.regular,
                fontSize: theme.fontSize.sm,
                color: theme.colors.textSecondary,
                lineHeight: 22,
              }}
            >
              상담사가 공유한 요약이 이곳에 표시됩니다.
            </Text>
          </Animated.View>
        )}

        {/* 액션 버튼 */}
        <Animated.View entering={FadeInDown.delay(300).springify()} style={styles.actionGroup}>
          {isScheduled && (
            <Pressable
              onPress={handleCancelRequest}
              style={[
                styles.actionButton,
                {
                  borderColor: theme.colors.error,
                  borderRadius: theme.borderRadius.lg,
                },
              ]}
              accessibilityLabel="상담 취소 요청"
              accessibilityRole="button"
            >
              <Text
                style={{
                  fontFamily: theme.fontFamily.semibold,
                  fontSize: theme.fontSize.sm,
                  color: theme.colors.error,
                }}
              >
                취소 요청
              </Text>
            </Pressable>
          )}
          {isCompleted && (
            <Pressable
              onPress={handleReview}
              style={[
                styles.primaryActionButton,
                {
                  backgroundColor: theme.colors.primary,
                  borderRadius: theme.borderRadius.lg,
                },
              ]}
              accessibilityLabel="상담사 평가하기"
              accessibilityRole="button"
            >
              <Text
                style={{
                  fontFamily: theme.fontFamily.semibold,
                  fontSize: theme.fontSize.base,
                  color: theme.colors.textOnPrimary,
                }}
              >
                평가하기
              </Text>
            </Pressable>
          )}
        </Animated.View>
      </ScrollView>
    </SafeAreaView>
  );
}

interface DetailRowProps {
  icon: React.ReactNode;
  label: string;
  value: string;
  theme: ReturnType<typeof useTheme>;
}

function DetailRow({ icon, label, value, theme }: DetailRowProps) {
  return (
    <View style={detailRowStyles.row}>
      {icon}
      <Text
        numberOfLines={1}
        style={{
          fontFamily: theme.fontFamily.regular,
          fontSize: theme.fontSize.sm,
          color: theme.colors.textTertiary,
          marginLeft: 8,
          minWidth: 88,
          flexShrink: 0,
        }}
      >
        {label}
      </Text>
      <Text
        style={{
          fontFamily: theme.fontFamily.medium,
          fontSize: theme.fontSize.sm,
          color: theme.colors.textMain,
          flex: 1,
          flexShrink: 1,
        }}
      >
        {value}
      </Text>
    </View>
  );
}

const detailRowStyles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 12,
  },
});

const styles = StyleSheet.create({
  safe: {
    flex: 1,
  },
  scroll: {
    paddingHorizontal: 16,
    paddingBottom: 40,
    gap: 16,
  },
  loadingWrap: {
    paddingHorizontal: 16,
    gap: 16,
    paddingTop: 16,
  },
  profileCard: {
    padding: 20,
  },
  profileRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  profileInfo: {
    marginLeft: 16,
    gap: 8,
  },
  infoCard: {
    padding: 20,
  },
  cardTitle: {
    marginBottom: 4,
  },
  actionGroup: {
    gap: 12,
    marginTop: 8,
  },
  actionButton: {
    height: 48,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1.5,
  },
  primaryActionButton: {
    height: 52,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
