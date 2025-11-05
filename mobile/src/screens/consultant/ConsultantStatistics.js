/**
 * 상담사 통계 화면
 * 
 * 웹의 frontend/src/components/consultant/ConsultantRatingDisplay.js를 참고
 */

import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, StyleSheet, ScrollView, RefreshControl } from 'react-native';
import { BarChart3, TrendingUp, Award, Users } from 'lucide-react-native';
import SimpleLayout from '../../components/layout/SimpleLayout';
import UnifiedLoading from '../../components/UnifiedLoading';
import StatCard from '../../components/StatCard';
import DashboardSection from '../../components/DashboardSection';
import { useSession } from '../../contexts/SessionContext';
import { apiGet } from '../../api/client';
import { RATING_API, DASHBOARD_API, SCHEDULE_API } from '../../api/endpoints';
import { COLORS, SPACING, TYPOGRAPHY, SHADOWS, BORDER_RADIUS } from '../../constants/theme';
import SIZES from '../../constants/sizes';
import { STRINGS } from '../../constants/strings';

const ConsultantStatistics = () => {
  const { user } = useSession();
  const [stats, setStats] = useState({
    averageRating: 0,
    totalRatings: 0,
    ratingDistribution: {},
    totalSessions: 0,
    completedSessions: 0,
    completionRate: 0,
    currentClients: 0,
  });
  const [isLoading, setIsLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  // 통계 데이터 로드
  const loadStatistics = useCallback(async () => {
    if (!user?.id) return;

    try {
      setIsLoading(true);
      
      // 평점 통계
      const ratingResponse = await apiGet(RATING_API.GET_CONSULTANT_STATS(user.id));
      
      // 대시보드 통계 (웹과 동일한 API 사용)
      const dashboardResponse = await apiGet(SCHEDULE_API.SCHEDULES, {
        userId: user.id,
        userRole: 'CONSULTANT',
      });

      if (ratingResponse?.success && ratingResponse?.data) {
        setStats((prev) => ({
          ...prev,
          averageRating: ratingResponse.data.averageRating || 0,
          totalRatings: ratingResponse.data.totalRatings || 0,
          ratingDistribution: ratingResponse.data.ratingDistribution || {},
        }));
      }

      if (dashboardResponse?.success && dashboardResponse?.data) {
        setStats((prev) => ({
          ...prev,
          totalSessions: dashboardResponse.data.totalSessions || 0,
          completedSessions: dashboardResponse.data.completedSessions || 0,
          completionRate: dashboardResponse.data.completionRate || 0,
          currentClients: dashboardResponse.data.currentClients || 0,
        }));
      }
    } catch (error) {
      console.error('통계 로드 실패:', error);
    } finally {
      setIsLoading(false);
      setRefreshing(false);
    }
  }, [user?.id]);

  useEffect(() => {
    loadStatistics();
  }, [loadStatistics]);

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    loadStatistics();
  }, [loadStatistics]);

  // 평점 하트 표시
  const renderRatingHearts = (rating) => {
    const fullHearts = Math.floor(rating);
    const emptyHearts = 5 - fullHearts;
    return '💖'.repeat(fullHearts) + '🤍'.repeat(emptyHearts);
  };

  if (isLoading) {
    return (
      <SimpleLayout title={STRINGS.CONSULTANT.STATISTICS_TITLE}>
        <UnifiedLoading text={STRINGS.COMMON.LOADING_DATA} size="large" type="fullscreen" />
      </SimpleLayout>
    );
  }

  return (
    <SimpleLayout title={STRINGS.CONSULTANT.STATISTICS_TITLE || '통계'}>
      <ScrollView
        style={styles.container}
        contentContainerStyle={styles.contentContainer}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
      >
        {/* 주요 통계 카드 */}
        <View style={styles.statsContainer}>
          <StatCard
            icon={<Award size={SIZES.ICON.LG} color={COLORS.warning} />}
            value={stats.averageRating.toFixed(1)}
            label={STRINGS.CONSULTANT.AVERAGE_RATING}
            style={styles.statCard}
          />
          <StatCard
            icon={<Users size={SIZES.ICON.LG} color={COLORS.info} />}
            value={stats.totalRatings}
            label={STRINGS.CONSULTANT.TOTAL_RATINGS}
            style={styles.statCard}
          />
          <StatCard
            icon={<TrendingUp size={SIZES.ICON.LG} color={COLORS.success} />}
            value={`${stats.completionRate.toFixed(0)}%`}
            label={STRINGS.CONSULTANT.COMPLETION_RATE}
            style={styles.statCard}
          />
          <StatCard
            icon={<BarChart3 size={SIZES.ICON.LG} color={COLORS.primary} />}
            value={stats.totalSessions}
            label={STRINGS.CONSULTANT.TOTAL_SESSIONS}
            style={styles.statCard}
          />
        </View>

        {/* 평점 상세 */}
        {stats.averageRating > 0 && (
          <DashboardSection title={STRINGS.CONSULTANT.AVERAGE_RATING} icon={<Award size={SIZES.ICON.MD} color={COLORS.warning} />}>
            <View style={styles.ratingSection}>
              <View style={styles.ratingDisplay}>
                <Text style={styles.ratingValue}>{stats.averageRating.toFixed(1)}</Text>
                <Text style={styles.ratingHearts}>{renderRatingHearts(stats.averageRating)}</Text>
                <Text style={styles.ratingCount}>
                  {STRINGS.CONSULTANT.TOTAL_RATINGS}: {stats.totalRatings}
                </Text>
              </View>
            </View>
          </DashboardSection>
        )}

        {/* 상담 통계 */}
        <DashboardSection title={STRINGS.CONSULTANT.CONSULTATION_STATS} icon={<BarChart3 size={SIZES.ICON.MD} color={COLORS.primary} />}>
          <View style={styles.statsList}>
            <View style={styles.statItem}>
              <Text style={styles.statLabel}>{STRINGS.CONSULTANT.TOTAL_SESSIONS}</Text>
              <Text style={styles.statValue}>{stats.totalSessions}</Text>
            </View>
            <View style={styles.statItem}>
              <Text style={styles.statLabel}>{STRINGS.CONSULTANT.COMPLETED_CONSULTATION}</Text>
              <Text style={styles.statValue}>{stats.completedSessions}</Text>
            </View>
            <View style={styles.statItem}>
              <Text style={styles.statLabel}>{STRINGS.CONSULTANT.COMPLETION_RATE}</Text>
              <Text style={styles.statValue}>{stats.completionRate.toFixed(1)}%</Text>
            </View>
            <View style={styles.statItem}>
              <Text style={styles.statLabel}>{STRINGS.CONSULTANT.TOTAL_CLIENTS}</Text>
              <Text style={styles.statValue}>{stats.currentClients}</Text>
            </View>
          </View>
        </DashboardSection>
      </ScrollView>
    </SimpleLayout>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  contentContainer: {
    padding: SPACING.md,
  },
  statsContainer: {
    gap: SPACING.md,
    marginBottom: SPACING.lg,
  },
  statCard: {
    width: '100%',
    marginBottom: 0,
  },
  ratingSection: {
    padding: SPACING.md,
  },
  ratingDisplay: {
    alignItems: 'center',
  },
  ratingValue: {
    fontSize: TYPOGRAPHY.fontSize['3xl'],
    fontWeight: TYPOGRAPHY.fontWeight.bold,
    color: COLORS.primary,
    marginBottom: SPACING.xs,
  },
  ratingHearts: {
    fontSize: TYPOGRAPHY.fontSize['2xl'],
    marginBottom: SPACING.sm,
  },
  ratingCount: {
    fontSize: TYPOGRAPHY.fontSize.base,
    color: COLORS.gray600,
  },
  statsList: {
    gap: SPACING.md,
  },
  statItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: COLORS.white,
    borderRadius: BORDER_RADIUS.md,
    padding: SPACING.md,
    ...SHADOWS.sm,
  },
  statLabel: {
    fontSize: TYPOGRAPHY.fontSize.base,
    color: COLORS.dark,
  },
  statValue: {
    fontSize: TYPOGRAPHY.fontSize.lg,
    fontWeight: TYPOGRAPHY.fontWeight.bold,
    color: COLORS.primary,
  },
});

export default ConsultantStatistics;

