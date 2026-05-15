/**
 * 상담사 대시보드 (홈)
 * 인사 메시지, 긴급 알림, 오늘의 스케줄, 빠른 액션
 *
 * @author MindGarden
 * @since 2026-05-12
 * @see docs/design-system/v2/CONSULTANT_CLIENT_SCREEN_WIREFRAMES.md §1
 */
import { useCallback, useMemo } from 'react';
import {
  View,
  Text,
  Pressable,
  ScrollView,
  RefreshControl,
  StyleSheet,
  Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import * as Haptics from 'expo-haptics';
import { FlashList } from '@shopify/flash-list';
import { Calendar as CalendarIcon, Clock, AlertTriangle } from 'lucide-react-native';
import { format } from 'date-fns';
import { ko } from 'date-fns/locale';
import { useTheme } from '@/theme';
import { useAuthStore } from '@/stores/useAuthStore';
import { useConsultantDashboard } from '@/api/hooks/useSchedules';
import { usePendingRecords } from '@/api/hooks/useRecords';
import { ScheduleCard } from '@/components/molecules/ScheduleCard';
import {
  getConsultantScheduleCardFooterHint,
  getConsultantScheduleCardVisualTone,
  getConsultantScheduleListRowActions,
} from '@/utils/consultantScheduleCardUi';
import { QuickActionBar, type QuickAction } from '@/components/molecules/QuickActionBar';
import { SkeletonCard } from '@/components/atoms/SkeletonLoader';
import { EmptyState } from '@/components/atoms/EmptyState';

const TODAY = format(new Date(), 'yyyy년 M월 d일 (EEEE)', { locale: ko });

export default function ConsultantDashboard() {
  const theme = useTheme();
  const router = useRouter();
  const user = useAuthStore((s) => s.user);

  const dashboardQuery = useConsultantDashboard(user?.id);
  const pendingQuery = usePendingRecords(user?.id);

  const isLoading = dashboardQuery.isLoading;
  const isRefreshing = dashboardQuery.isFetching && !dashboardQuery.isLoading;

  const onRefresh = useCallback(() => {
    dashboardQuery.refetch();
    pendingQuery.refetch();
  }, [dashboardQuery, pendingQuery]);

  const schedules = dashboardQuery.data?.todaySchedules ?? [];
  const pendingCount = pendingQuery.data?.length ?? dashboardQuery.data?.pendingRecordCount ?? 0;

  const quickActions: QuickAction[] = useMemo(
    () => [
      {
        icon: CalendarIcon,
        label: '오늘 스케줄',
        onPress: () => router.push('/(consultant)/(schedule)/'),
      },
      {
        icon: Clock,
        label: '근무 설정',
        onPress: () => router.push('/(consultant)/(more)/availability'),
      },
    ],
    [router],
  );

  const handlePendingPress = () => {
    if (Platform.OS !== 'web') {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
    router.push('/(consultant)/(records)/');
  };

  return (
    <SafeAreaView
      style={[styles.safeArea, { backgroundColor: theme.colors.bgMain }]}
      edges={['top']}
    >
      <ScrollView
        style={styles.scroll}
        contentContainerStyle={[styles.scrollContent, { paddingHorizontal: theme.spacing.lg }]}
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
        <View style={[styles.greeting, { marginTop: theme.spacing.xl }]}>
          <Text
            style={{
              color: theme.colors.textMain,
              fontFamily: theme.fontFamily.bold,
              fontSize: theme.fontSize['2xl'],
            }}
            accessibilityRole="header"
          >
            안녕하세요, {user?.name ?? '선생'}님!
          </Text>
          <Text
            style={{
              color: theme.colors.textSecondary,
              fontFamily: theme.fontFamily.regular,
              fontSize: theme.fontSize.sm,
              marginTop: theme.spacing.xs,
            }}
          >
            {TODAY}
          </Text>
        </View>

        {/* 긴급 알림 — 미작성 일지 */}
        {pendingCount > 0 ? (
          <Pressable
            onPress={handlePendingPress}
            style={[
              styles.alertBanner,
              {
                backgroundColor: theme.colors.error + '15',
                borderRadius: theme.borderRadius.lg,
                padding: theme.spacing.lg,
                marginTop: theme.spacing.lg,
              },
            ]}
            accessibilityRole="button"
            accessibilityLabel={`미작성 일지 ${pendingCount}건`}
          >
            <AlertTriangle size={20} color={theme.colors.error} />
            <Text
              style={[
                styles.alertText,
                {
                  color: theme.colors.error,
                  fontFamily: theme.fontFamily.semibold,
                  fontSize: theme.fontSize.sm,
                  marginLeft: theme.spacing.sm,
                },
              ]}
            >
              미작성 일지 {pendingCount}건이 있습니다.
            </Text>
            <Text
              style={{
                color: theme.colors.error,
                fontFamily: theme.fontFamily.regular,
                fontSize: theme.fontSize.sm,
              }}
            >
              바로가기 &gt;
            </Text>
          </Pressable>
        ) : null}

        {/* 오늘의 스케줄 */}
        <Text
          style={[
            styles.sectionTitle,
            {
              color: theme.colors.textMain,
              fontFamily: theme.fontFamily.semibold,
              fontSize: theme.fontSize.lg,
              marginTop: theme.spacing['2xl'],
              marginBottom: theme.spacing.md,
            },
          ]}
        >
          오늘의 스케줄 {!isLoading && `(${schedules.length}건)`}
        </Text>

        {isLoading ? (
          <>
            <SkeletonCard />
            <SkeletonCard />
            <SkeletonCard />
          </>
        ) : schedules.length === 0 ? (
          <EmptyState
            icon={<CalendarIcon size={32} color={theme.colors.textTertiary} />}
            title="오늘 예정된 상담이 없습니다"
            description="새로운 상담 일정을 추가해보세요."
            actionLabel="일정 추가"
            onAction={() => router.push('/(consultant)/(schedule)/')}
          />
        ) : (
          <View style={styles.listWrapper}>
            <FlashList
              data={schedules}
              keyExtractor={(item) => String(item.id)}
              scrollEnabled={false}
              renderItem={({ item, index }) => {
                const nav = () => router.push(`/(consultant)/(schedule)/${item.id}`);
                const row = getConsultantScheduleListRowActions(item, nav);
                const hint = getConsultantScheduleCardFooterHint(item);
                const tone = getConsultantScheduleCardVisualTone(item);
                return (
                  <ScheduleCard
                    time={`${item.startTime} - ${item.endTime}`}
                    clientName={`${item.clientName} 님`}
                    sessionType={item.consultationType}
                    status={item.status}
                    index={index}
                    containerOpacity={tone.containerOpacity}
                    footerHint={hint.text}
                    onPress={nav}
                    actionLabel={row.primaryActionLabel}
                    onActionPress={row.onPrimaryAction}
                  />
                );
              }}
            />
          </View>
        )}

        {/* 빠른 액션 바 */}
        <Text
          style={[
            styles.sectionTitle,
            {
              color: theme.colors.textMain,
              fontFamily: theme.fontFamily.semibold,
              fontSize: theme.fontSize.lg,
              marginTop: theme.spacing['2xl'],
              marginBottom: theme.spacing.md,
            },
          ]}
        >
          빠른 액션
        </Text>
        <QuickActionBar actions={quickActions} />

        <View style={{ height: theme.spacing['3xl'] }} />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
  },
  scroll: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: 16,
  },
  greeting: {},
  alertBanner: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  alertText: {
    flex: 1,
  },
  sectionTitle: {},
  listWrapper: {
    minHeight: 100,
  },
});
