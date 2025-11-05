/**
 * 내담자 대시보드
 * 
 * 웹의 frontend/src/components/client/ClientDashboard.js를 참고
 */

import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, StyleSheet, ScrollView, RefreshControl } from 'react-native';
import { Calendar, MessageCircle, CreditCard, Clock, CheckCircle, TrendingUp, Heart } from 'lucide-react-native';
import SimpleLayout from '../../components/layout/SimpleLayout';
import StatCard from '../../components/StatCard';
import DashboardSection from '../../components/DashboardSection';
import MGButton from '../../components/MGButton';
import UnifiedLoading from '../../components/UnifiedLoading';
import { useSession } from '../../contexts/SessionContext';
import { apiGet } from '../../api/client';
import { DASHBOARD_API, ADMIN_API, SCHEDULE_API } from '../../api/endpoints';
import { COLORS, SPACING, TYPOGRAPHY, SHADOWS, BORDER_RADIUS } from '../../constants/theme';
import SIZES from '../../constants/sizes';
import { STRINGS } from '../../constants/strings';
import { CLIENT_SCREENS } from '../../constants/navigation';
import { useNavigation } from '@react-navigation/native';

const ClientDashboard = () => {
  const { user } = useSession();
  const navigation = useNavigation();
  const [currentTime, setCurrentTime] = useState('');
  const [consultationData, setConsultationData] = useState({
    todaySchedules: [],
    weeklySchedules: [],
    completedCount: 0,
    totalSessions: 0,
    usedSessions: 0,
    remainingSessions: 0,
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

  // 내담자 데이터 로드
  const loadClientData = useCallback(async () => {
    if (!user?.id) {
      return;
    }

    try {
      setIsLoading(true);

      // 스케줄 데이터 로드 (웹과 동일한 API 사용)
      const scheduleResponse = await apiGet(SCHEDULE_API.SCHEDULES, {
        userId: user.id,
        userRole: 'CLIENT',
      });

      // 매핑 정보 로드 (회기 수 계산)
      const mappingResponse = await apiGet(ADMIN_API.GET_MAPPINGS_BY_CLIENT(user.id));

      let totalSessions = 0;
      let usedSessions = 0;
      let remainingSessions = 0;

      if (mappingResponse?.success && mappingResponse?.data) {
        const activeMappings = mappingResponse.data.filter(
          (mapping) => mapping.status === 'ACTIVE'
        );
        totalSessions = activeMappings.reduce(
          (sum, mapping) => sum + (mapping.totalSessions || 0),
          0
        );
        usedSessions = activeMappings.reduce(
          (sum, mapping) => sum + (mapping.usedSessions || 0),
          0
        );
        remainingSessions = activeMappings.reduce(
          (sum, mapping) => sum + (mapping.remainingSessions || 0),
          0
        );
      }

      if (scheduleResponse?.success && scheduleResponse?.data) {
        const schedules = scheduleResponse.data;
        const today = new Date();
        const todayStr = today.toISOString().split('T')[0];

        const todaySchedules = schedules.filter((s) => s.date === todayStr);
        const completedSchedules = schedules.filter(
          (s) => s.status === 'COMPLETED'
        );

        // 이번 주 상담 계산
        const weekStart = new Date(today);
        weekStart.setDate(today.getDate() - today.getDay());
        const weekEnd = new Date(weekStart);
        weekEnd.setDate(weekStart.getDate() + 6);

        const weeklySchedules = schedules.filter((s) => {
          const scheduleDate = new Date(s.date);
          return scheduleDate >= weekStart && scheduleDate <= weekEnd;
        });

        setConsultationData({
          todaySchedules,
          weeklySchedules,
          completedCount: completedSchedules.length,
          totalSessions,
          usedSessions,
          remainingSessions,
        });
      }
    } catch (error) {
      console.error('내담자 데이터 로드 실패:', error);
    } finally {
      setIsLoading(false);
      setRefreshing(false);
    }
  }, [user?.id]);

  useEffect(() => {
    loadClientData();
  }, [loadClientData]);

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    loadClientData();
  }, [loadClientData]);

  if (isLoading) {
    return (
      <SimpleLayout>
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
    <SimpleLayout>
      <ScrollView
        style={styles.container}
        contentContainerStyle={styles.contentContainer}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
      >
        {/* 환영 메시지 */}
        <View style={styles.welcomeSection}>
          <View style={styles.welcomeContent}>
            <Text style={styles.greeting}>
              {greeting()},{'\n'}<Text style={styles.name}>{user?.name || STRINGS.GREETING.CLIENT_DEFAULT_NAME}</Text>님 👋
            </Text>
            <Text style={styles.subtitle}>{STRINGS.GREETING.CLIENT_SUBTITLE}</Text>
          </View>
          <View style={styles.timeContainer}>
            <Clock size={SIZES.ICON.MD} color={COLORS.primary} />
            <Text style={styles.time}>{currentTime}</Text>
          </View>
        </View>

        {/* 통계 카드 */}
        <View style={styles.statsContainer}>
          <StatCard
            icon={<Calendar size={SIZES.ICON.LG} color={COLORS.primary} />}
            value={consultationData.todaySchedules.length}
            label={STRINGS.CLIENT.TODAY_CONSULTATION}
            style={styles.statCard}
          />
          <StatCard
            icon={<CheckCircle size={SIZES.ICON.LG} color={COLORS.success} />}
            value={consultationData.completedCount}
            label={STRINGS.CLIENT.COMPLETED_CONSULTATION}
            style={styles.statCard}
          />
          <StatCard
            icon={<TrendingUp size={SIZES.ICON.LG} color={COLORS.info} />}
            value={consultationData.weeklySchedules.length}
            label={STRINGS.CLIENT.WEEKLY_CONSULTATION}
            style={styles.statCard}
          />
          <StatCard
            icon={<Clock size={SIZES.ICON.LG} color={COLORS.warning} />}
            value={consultationData.remainingSessions}
            label={STRINGS.CLIENT.REMAINING_SESSIONS}
            style={styles.statCard}
          />
        </View>

        {/* 빠른 액션 */}
        <DashboardSection title={STRINGS.CLIENT.QUICK_ACTIONS} icon={<Heart size={SIZES.ICON.MD} color={COLORS.primary} />}>
          <View style={styles.quickActionsGrid}>
            <MGButton
              variant="primary"
              size="large"
              fullWidth
              onPress={() => {
                navigation.navigate(CLIENT_SCREENS.SCHEDULE);
              }}
              style={styles.actionButton}
            >
              <View style={styles.actionButtonContent}>
                <Calendar size={SIZES.ICON.MD} color={COLORS.white} />
                <Text style={styles.actionButtonText}>{STRINGS.CLIENT.QUICK_ACTION_ITEMS.SCHEDULE}</Text>
              </View>
            </MGButton>
            <MGButton
              variant="success"
              size="large"
              fullWidth
              onPress={() => {
                navigation.navigate(CLIENT_SCREENS.MESSAGES);
              }}
              style={styles.actionButton}
            >
              <View style={styles.actionButtonContent}>
                <MessageCircle size={SIZES.ICON.MD} color={COLORS.white} />
                <Text style={styles.actionButtonText}>{STRINGS.CLIENT.QUICK_ACTION_ITEMS.MESSAGES}</Text>
              </View>
            </MGButton>
            <MGButton
              variant="info"
              size="large"
              fullWidth
              onPress={() => {
                navigation.navigate(CLIENT_SCREENS.PAYMENT);
              }}
              style={styles.actionButton}
            >
              <View style={styles.actionButtonContent}>
                <CreditCard size={SIZES.ICON.MD} color={COLORS.white} />
                <Text style={styles.actionButtonText}>{STRINGS.CLIENT.QUICK_ACTION_ITEMS.PAYMENT}</Text>
              </View>
            </MGButton>
            <MGButton
              variant="warning"
              size="large"
              fullWidth
              onPress={() => {
                navigation.navigate(CLIENT_SCREENS.SETTINGS);
              }}
              style={styles.actionButton}
            >
              <View style={styles.actionButtonContent}>
                <Heart size={SIZES.ICON.MD} color={COLORS.white} />
                <Text style={styles.actionButtonText}>{STRINGS.CLIENT.QUICK_ACTION_ITEMS.SETTINGS}</Text>
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
    flexDirection: 'column', // 세로로 배치 (가로를 넓히기 위해)
    gap: SPACING.md,
  },
  actionButton: {
    width: '100%', // 전체 너비로 변경 (가로 넓히기)
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

export default ClientDashboard;
