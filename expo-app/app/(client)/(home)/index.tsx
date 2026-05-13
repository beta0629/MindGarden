/**
 * 내담자 홈(피드) 화면
 *
 * - 인사 메시지 + 오늘 날짜
 * - 다가오는 상담 카운트다운 카드
 * - 오늘의 웰니스 팁
 * - 최근 활동 요약 (가로 ScrollView)
 * - Pull-to-refresh + 스켈레톤
 *
 * @author MindGarden
 * @since 2026-05-12
 */
import { useCallback } from 'react';
import {
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import Animated, { FadeInDown } from 'react-native-reanimated';
import {
  Calendar,
  Heart,
  TrendingUp,
} from 'lucide-react-native';
import { format } from 'date-fns';
import { ko } from 'date-fns/locale';
import { useTheme } from '@/theme';
import { AppTopBar } from '@/components/templates/AppTopBar';
import { ConsultationCard } from '@/components/molecules/ConsultationCard';
import { CountdownTimer } from '@/components/molecules/CountdownTimer';
import { WellnessCard } from '@/components/molecules/WellnessCard';
import { StatCard } from '@/components/atoms/StatCard';
import { SkeletonCard, SkeletonLoader } from '@/components/atoms/SkeletonLoader';
import { EmptyState } from '@/components/atoms/EmptyState';
import { useAuthStore } from '@/stores/useAuthStore';
import { useClientDashboard, useUpcomingConsultation } from '@/api/hooks/useConsultations';
import { useRandomWellnessTip } from '@/api/hooks/useWellness';

const WARM_MESSAGES = [
  '오늘도 따뜻한 하루 보내세요.',
  '오늘 하루도 응원합니다.',
  '당신의 하루가 빛나길 바랍니다.',
  '편안한 하루 되세요.',
  '당신은 충분히 잘하고 있어요.',
];

function getWarmMessage(): string {
  const idx = new Date().getDate() % WARM_MESSAGES.length;
  return WARM_MESSAGES[idx]!;
}

export default function ClientHome() {
  const theme = useTheme();
  const router = useRouter();
  const user = useAuthStore((s) => s.user);

  const dashboardQuery = useClientDashboard(user?.id);
  const upcomingQuery = useUpcomingConsultation(user?.id);
  const tipQuery = useRandomWellnessTip();

  const isLoading =
    dashboardQuery.isLoading || upcomingQuery.isLoading;

  const onRefresh = useCallback(() => {
    dashboardQuery.refetch();
    upcomingQuery.refetch();
    tipQuery.refetch();
  }, [dashboardQuery, upcomingQuery, tipQuery]);

  const isRefreshing =
    dashboardQuery.isFetching ||
    upcomingQuery.isFetching ||
    tipQuery.isFetching;

  const today = format(new Date(), 'M월 d일 (EEEE)', { locale: ko });
  const upcoming = upcomingQuery.data;
  const dashboard = dashboardQuery.data;
  const tip = tipQuery.data;

  return (
    <SafeAreaView
      style={[styles.safe, { backgroundColor: theme.colors.bgMain }]}
      edges={['top']}
    >
      <AppTopBar title="홈" />

      <ScrollView
        contentContainerStyle={styles.scroll}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={isRefreshing}
            onRefresh={onRefresh}
            tintColor={theme.colors.primary}
          />
        }
      >
        {/* 인사 메시지 */}
        <Animated.View entering={FadeInDown.delay(0).springify()} style={styles.greetingSection}>
          <Text
            style={{
              fontFamily: theme.fontFamily.bold,
              fontSize: theme.fontSize['2xl'],
              color: theme.colors.textMain,
            }}
            accessibilityRole="header"
          >
            {user?.name ?? '내담자'}님, 안녕하세요
          </Text>
          <Text
            style={{
              fontFamily: theme.fontFamily.regular,
              fontSize: theme.fontSize.sm,
              color: theme.colors.textSecondary,
              marginTop: 4,
            }}
          >
            {today}
          </Text>
          <Text
            style={{
              fontFamily: theme.fontFamily.regular,
              fontSize: theme.fontSize.sm,
              color: theme.colors.textSecondary,
              marginTop: 2,
            }}
          >
            {getWarmMessage()}
          </Text>
        </Animated.View>

        {/* 다가오는 상담 카운트다운 */}
        <Animated.View entering={FadeInDown.delay(80).springify()}>
          {isLoading ? (
            <SkeletonCard style={styles.section} />
          ) : upcoming ? (
            <View style={styles.section}>
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
                다가오는 상담
              </Text>
              <ConsultationCard
                schedule={upcoming}
                onPress={() =>
                  router.push(`/(client)/(sessions)/${upcoming.id}`)
                }
              />
              <CountdownTimer
                targetDate={upcoming.date}
                targetTime={upcoming.startTime}
              />
            </View>
          ) : (
            <View style={styles.section}>
              <EmptyState
                title="예정된 상담이 없어요"
                description="관리자에게 상담 예약을 문의해주세요"
              />
            </View>
          )}
        </Animated.View>

        {/* 오늘의 웰니스 팁 */}
        <Animated.View entering={FadeInDown.delay(240).springify()} style={styles.section}>
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
            오늘의 웰니스 팁
          </Text>
          {tipQuery.isLoading ? (
            <SkeletonCard lines={2} />
          ) : tip ? (
            <WellnessCard
              icon={<Heart size={24} color={theme.colors.primary} />}
              title={tip.title}
              description={tip.description}
              onPress={() =>
                router.push('/(client)/(wellness)')
              }
            />
          ) : (
            <WellnessCard
              icon={<Heart size={24} color={theme.colors.primary} />}
              title="마음 돌봄"
              description="오늘도 잠시 마음을 챙겨보세요"
              onPress={() =>
                router.push('/(client)/(wellness)')
              }
            />
          )}
        </Animated.View>

        {/* 최근 활동 요약 */}
        <Animated.View entering={FadeInDown.delay(320).springify()} style={styles.section}>
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
            나의 활동
          </Text>
          {isLoading ? (
            <View style={styles.statRow}>
              {[1, 2, 3].map((i) => (
                <SkeletonLoader key={i} width={100} height={80} borderRadius={16} />
              ))}
            </View>
          ) : (
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.statRow}
            >
              <StatCard
                label="총 상담"
                value={dashboard?.totalConsultations ?? 0}
                unit="회"
                icon={<Calendar size={18} color={theme.colors.primary} />}
                style={styles.statCard}
              />
              <StatCard
                label="이번 달"
                value={dashboard?.thisMonthCount ?? 0}
                unit="회"
                icon={<TrendingUp size={18} color={theme.colors.primary} />}
                style={styles.statCard}
              />
              <StatCard
                label="연속 관리"
                value={dashboard?.streakDays ?? 0}
                unit="일"
                icon={<Heart size={18} color={theme.colors.primary} />}
                style={styles.statCard}
              />
            </ScrollView>
          )}
        </Animated.View>

        <View style={styles.bottomSpacer} />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
  },
  scroll: {
    paddingHorizontal: 16,
    paddingTop: 8,
  },
  greetingSection: {
    paddingVertical: 16,
  },
  section: {
    marginBottom: 20,
  },
  sectionTitle: {
    marginBottom: 12,
  },
  statRow: {
    flexDirection: 'row',
    gap: 12,
    paddingRight: 16,
  },
  statCard: {
    minWidth: 110,
  },
  bottomSpacer: {
    height: 24,
  },
});
