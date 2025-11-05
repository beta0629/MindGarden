/**
 * 상담사 대시보드
 * 
 * 웹의 frontend/src/components/dashboard/CommonDashboard.js를 참고
 */

import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, StyleSheet, ScrollView, RefreshControl } from 'react-native';
import { Calendar, MessageCircle, Users, Clock, CheckCircle, Award, FileText } from 'lucide-react-native';
import SimpleLayout from '../../components/layout/SimpleLayout';
import StatCard from '../../components/StatCard';
import DashboardSection from '../../components/DashboardSection';
import MGButton from '../../components/MGButton';
import UnifiedLoading from '../../components/UnifiedLoading';
import { useSession } from '../../contexts/SessionContext';
import { apiGet } from '../../api/client';
import { DASHBOARD_API, ADMIN_API, RATING_API, CONSULTATION_RECORD_API, SCHEDULE_API } from '../../api/endpoints';
import { COLORS, SPACING, TYPOGRAPHY, SHADOWS, BORDER_RADIUS } from '../../constants/theme';
import SIZES from '../../constants/sizes';
import { STRINGS } from '../../constants/strings';
import { CONSULTANT_SCREENS } from '../../constants/navigation';
import { useNavigation } from '@react-navigation/native';

const ConsultantDashboard = () => {
  const { user } = useSession();
  const navigation = useNavigation();
  const [currentTime, setCurrentTime] = useState('');
  const [dashboardData, setDashboardData] = useState({
    todaySchedules: [],
    totalClients: 0,
    completedSessions: 0,
    averageRating: 0,
    totalRatingCount: 0,
    totalRecords: 0,
    todayRecords: 0,
    pendingRecords: 0,
  });
  const [isLoading, setIsLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  // 현재 시간 업데이트
  useEffect(() => {
    const updateTime = () => {
      const now = new Date();
      const hours = now.getHours();
      const minutes = now.getMinutes().toString().padStart(2, '0');
      const period = hours < 12 ? STRINGS.TIME.AM : STRINGS.TIME.PM;
      const displayHours = hours % 12 || 12;
      setCurrentTime(`${period} ${displayHours}:${minutes}`);
    };

    updateTime();
    const interval = setInterval(updateTime, 60000);
    return () => clearInterval(interval);
  }, []);

  // 대시보드 데이터 로드
  const loadDashboardData = useCallback(async () => {
    if (!user?.id) return;

    try {
      setIsLoading(true);

      // 스케줄 데이터 로드 (웹과 동일한 API 사용)
      const scheduleResponse = await apiGet(SCHEDULE_API.SCHEDULES, {
        userId: user.id,
        userRole: 'CONSULTANT',
      });

      // 내담자 수 로드
      const clientsResponse = await apiGet(ADMIN_API.GET_CLIENTS_BY_CONSULTANT(user.id));

      // 평가 통계 로드
      const ratingResponse = await apiGet(RATING_API.GET_CONSULTANT_STATS(user.id));

      // 상담일지 통계 로드
      const recordsResponse = await apiGet(CONSULTATION_RECORD_API.GET_RECORDS(user.id));

      // 데이터 통합
      if (scheduleResponse?.success && scheduleResponse?.data) {
        const schedules = scheduleResponse.data;
        const today = new Date().toISOString().split('T')[0];
        const todaySchedules = schedules.filter((s) => s.date === today);
        const completedSessions = schedules.filter((s) => s.status === 'COMPLETED');

        setDashboardData((prev) => ({
          ...prev,
          todaySchedules,
          completedSessions: completedSessions.length,
        }));
      }

      if (clientsResponse?.success && clientsResponse?.data) {
        // API 응답 구조 확인: data가 배열이거나 { client: {...} } 형태의 배열일 수 있음
        let clientsCount = 0;
        if (Array.isArray(clientsResponse.data)) {
          clientsCount = clientsResponse.data.length;
        } else if (clientsResponse.data.count !== undefined) {
          clientsCount = clientsResponse.data.count;
        }
        
        console.log('📊 대시보드 내담자 수:', clientsCount);
        setDashboardData((prev) => ({
          ...prev,
          totalClients: clientsCount,
        }));
      }

      if (ratingResponse?.success && ratingResponse?.data) {
        setDashboardData((prev) => ({
          ...prev,
          averageRating: ratingResponse.data.averageHeartScore || 0,
          totalRatingCount: ratingResponse.data.totalRatingCount || 0,
        }));
      }

      if (recordsResponse?.success && recordsResponse?.data) {
        const records = recordsResponse.data;
        const today = new Date().toISOString().split('T')[0];
        const todayRecords = records.filter(
          (record) => record.sessionDate && record.sessionDate.startsWith(today)
        );

        setDashboardData((prev) => ({
          ...prev,
          totalRecords: records.length,
          todayRecords: todayRecords.length,
          pendingRecords: records.filter((record) => !record.isCompleted).length,
        }));
      }
    } catch (error) {
      console.error('대시보드 데이터 로드 실패:', error);
    } finally {
      setIsLoading(false);
      setRefreshing(false);
    }
  }, [user?.id]);

  useEffect(() => {
    loadDashboardData();
  }, [loadDashboardData]);

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    loadDashboardData();
  }, [loadDashboardData]);

  if (isLoading) {
    return (
      <SimpleLayout title={STRINGS.CONSULTANT.DASHBOARD_TITLE}>
        <UnifiedLoading text={STRINGS.COMMON.LOADING_DATA} size="large" type="fullscreen" />
      </SimpleLayout>
    );
  }

  const greeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return STRINGS.GREETING.MORNING;
    if (hour < 18) return STRINGS.GREETING.AFTERNOON;
    return STRINGS.GREETING.EVENING;
  };

  return (
    <SimpleLayout title={STRINGS.CONSULTANT.DASHBOARD_TITLE}>
      <ScrollView
        style={styles.container}
        contentContainerStyle={styles.contentContainer}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
      >
        {/* 환영 메시지 */}
        <View style={styles.welcomeSection}>
          <View style={styles.welcomeContent}>
            <Text style={styles.greeting}>
              {greeting()}, <Text style={styles.name}>{user?.name || STRINGS.GREETING.CONSULTANT_DEFAULT_NAME}</Text>님 👋
            </Text>
            <Text style={styles.subtitle}>{STRINGS.GREETING.CONSULTANT_SUBTITLE}</Text>
          </View>
          <View style={styles.timeContainer}>
            <Clock size={SIZES.ICON.MD} color={COLORS.primary} />
            <Text style={styles.time}>{currentTime}</Text>
          </View>
        </View>

        {/* 주요 통계 카드 */}
        <View style={styles.statsContainer}>
          <StatCard
            icon={<Calendar size={SIZES.ICON.LG} color={COLORS.primary} />}
            value={dashboardData.todaySchedules.length}
            label={STRINGS.CONSULTANT.TODAY_CONSULTATION}
            style={styles.statCard}
          />
          <StatCard
            icon={<Users size={SIZES.ICON.LG} color={COLORS.info} />}
            value={dashboardData.totalClients}
            label={STRINGS.CONSULTANT.TOTAL_CLIENTS}
            style={styles.statCard}
          />
          <StatCard
            icon={<CheckCircle size={SIZES.ICON.LG} color={COLORS.success} />}
            value={dashboardData.completedSessions}
            label={STRINGS.CONSULTANT.COMPLETED_CONSULTATION}
            style={styles.statCard}
          />
          <StatCard
            icon={<Award size={SIZES.ICON.LG} color={COLORS.warning} />}
            value={dashboardData.averageRating.toFixed(1)}
            label={STRINGS.CONSULTANT.AVERAGE_RATING}
            style={styles.statCard}
          />
          <StatCard
            icon={<FileText size={SIZES.ICON.LG} color={COLORS.info} />}
            value={dashboardData.totalRecords}
            label={STRINGS.CONSULTANT.CONSULTATION_RECORDS}
            style={styles.statCard}
          />
          <StatCard
            icon={<Clock size={SIZES.ICON.LG} color={COLORS.warning} />}
            value={dashboardData.pendingRecords}
            label={STRINGS.CONSULTANT.PENDING_RECORDS}
            style={styles.statCard}
          />
        </View>

        {/* 빠른 액션 */}
        <DashboardSection title={STRINGS.CONSULTANT.QUICK_ACTIONS} icon={<Calendar size={SIZES.ICON.MD} color={COLORS.primary} />}>
          <View style={styles.quickActionsGrid}>
            <MGButton
              variant="primary"
              size="large"
              fullWidth
              onPress={() => {
                navigation.navigate(CONSULTANT_SCREENS.SCHEDULE);
              }}
              style={styles.actionButton}
            >
              <View style={styles.actionButtonContent}>
                <Calendar size={SIZES.ICON.MD} color={COLORS.white} />
                <Text style={styles.actionButtonText}>{STRINGS.CONSULTANT.QUICK_ACTION_ITEMS.SCHEDULE}</Text>
              </View>
            </MGButton>
            <MGButton
              variant="success"
              size="large"
              fullWidth
              onPress={() => {
                navigation.navigate(CONSULTANT_SCREENS.CLIENT_MANAGEMENT);
              }}
              style={styles.actionButton}
            >
              <View style={styles.actionButtonContent}>
                <Users size={SIZES.ICON.MD} color={COLORS.white} />
                <Text style={styles.actionButtonText}>{STRINGS.CONSULTANT.QUICK_ACTION_ITEMS.CLIENTS}</Text>
              </View>
            </MGButton>
            <MGButton
              variant="info"
              size="large"
              fullWidth
              onPress={() => {
                navigation.navigate(CONSULTANT_SCREENS.MESSAGES);
              }}
              style={styles.actionButton}
            >
              <View style={styles.actionButtonContent}>
                <MessageCircle size={SIZES.ICON.MD} color={COLORS.white} />
                <Text style={styles.actionButtonText}>{STRINGS.CONSULTANT.QUICK_ACTION_ITEMS.MESSAGES}</Text>
              </View>
            </MGButton>
            <MGButton
              variant="warning"
              size="large"
              fullWidth
              onPress={() => {
                navigation.navigate(CONSULTANT_SCREENS.RECORDS);
              }}
              style={styles.actionButton}
            >
              <View style={styles.actionButtonContent}>
                <FileText size={SIZES.ICON.MD} color={COLORS.white} />
                <Text style={styles.actionButtonText}>{STRINGS.CONSULTANT.QUICK_ACTION_ITEMS.RECORDS}</Text>
              </View>
            </MGButton>
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
  welcomeSection: {
    backgroundColor: COLORS.white,
    borderRadius: BORDER_RADIUS.xl,
    padding: SPACING.lg,
    marginBottom: SPACING.lg,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    ...SHADOWS.md,
  },
  welcomeContent: {
    flex: 1,
  },
  greeting: {
    fontSize: TYPOGRAPHY.fontSize['2xl'],
    fontWeight: TYPOGRAPHY.fontWeight.bold,
    color: COLORS.dark,
    marginBottom: SPACING.xs,
  },
  name: {
    color: COLORS.primary,
  },
  subtitle: {
    fontSize: TYPOGRAPHY.fontSize.base,
    color: COLORS.mediumGray,
  },
  timeContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.gray100,
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.sm,
    borderRadius: BORDER_RADIUS.md,
  },
  time: {
    marginLeft: SPACING.xs,
    fontSize: TYPOGRAPHY.fontSize.base,
    fontWeight: TYPOGRAPHY.fontWeight.semibold,
    color: COLORS.dark,
  },
  statsContainer: {
    gap: SPACING.md,
    marginBottom: SPACING.lg,
  },
  statCard: {
    width: '100%',
    marginBottom: 0,
  },
  quickActionsGrid: {
    flexDirection: 'column', // 세로로 배치 (내담자 대시보드와 동일)
    gap: SPACING.md,
  },
  actionButton: {
    width: '100%', // 전체 너비 (내담자 대시보드와 동일)
    paddingVertical: SPACING.md,
  },
  actionButtonContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  actionButtonText: {
    marginLeft: SPACING.xs,
    color: COLORS.white,
    fontSize: TYPOGRAPHY.fontSize.base,
    fontWeight: TYPOGRAPHY.fontWeight.medium,
  },
});

export default ConsultantDashboard;
