/**
 * 내담자 상담 일정 화면
 * 
 * 웹의 frontend/src/components/client/ClientSchedule.js를 참고
 */

import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, StyleSheet, ScrollView, RefreshControl, TouchableOpacity } from 'react-native';
import { Calendar } from 'react-native-calendars';
import { Clock, Calendar as CalendarIcon, CheckCircle, XCircle } from 'lucide-react-native';
import SimpleLayout from '../../components/layout/SimpleLayout';
import UnifiedLoading from '../../components/UnifiedLoading';
import StatCard from '../../components/StatCard';
import DashboardSection from '../../components/DashboardSection';
import MGButton from '../../components/MGButton';
import { useSession } from '../../contexts/SessionContext';
import { apiGet } from '../../api/client';
import { SCHEDULE_API } from '../../api/endpoints';
import { COLORS, SPACING, TYPOGRAPHY, SHADOWS, BORDER_RADIUS } from '../../constants/theme';
import SIZES from '../../constants/sizes';
import { STRINGS } from '../../constants/strings';

const ClientSchedule = () => {
  const { user } = useSession();
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
  const [schedules, setSchedules] = useState([]);
  const [markedDates, setMarkedDates] = useState({});
  const [isLoading, setIsLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  // 스케줄 데이터 로드
  const loadSchedules = useCallback(async () => {
    if (!user?.id) return;

    try {
      setIsLoading(true);
      // 웹과 동일한 API 사용: /api/schedules?userId=${userId}&userRole=CLIENT
      const response = await apiGet(SCHEDULE_API.SCHEDULES, {
        userId: user.id,
        userRole: 'CLIENT',
      });

      if (response?.success && response?.data) {
        setSchedules(response.data);

        // 캘린더 마킹을 위한 날짜 정보 생성
        const marked = {};
        response.data.forEach((schedule) => {
          const dateStr = schedule.date;
          if (!marked[dateStr]) {
            marked[dateStr] = {
              marked: true,
              dotColor: schedule.status === 'COMPLETED' ? COLORS.success : COLORS.primary,
            };
          }
        });
        setMarkedDates(marked);
      }
    } catch (error) {
      console.error('스케줄 로드 실패:', error);
    } finally {
      setIsLoading(false);
      setRefreshing(false);
    }
  }, [user?.id]);

  useEffect(() => {
    loadSchedules();
  }, [loadSchedules]);

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    loadSchedules();
  }, [loadSchedules]);

  // 선택된 날짜의 스케줄 필터링
  const selectedDaySchedules = schedules.filter((s) => s.date === selectedDate);

  // 스케줄 상태별 색상
  const getStatusColor = (status) => {
    switch (status) {
      case 'COMPLETED':
        return COLORS.success;
      case 'CANCELLED':
        return COLORS.error;
      case 'SCHEDULED':
        return COLORS.primary;
      default:
        return COLORS.gray500;
    }
  };

  // 스케줄 상태 텍스트
  const getStatusText = (status) => {
    switch (status) {
      case 'COMPLETED':
        return STRINGS.SCHEDULE.STATUS.COMPLETED;
      case 'CANCELLED':
        return STRINGS.SCHEDULE.STATUS.CANCELLED;
      case 'SCHEDULED':
        return STRINGS.SCHEDULE.STATUS.SCHEDULED;
      default:
        return status;
    }
  };

  if (isLoading) {
    return (
      <SimpleLayout title={STRINGS.CLIENT.SCHEDULE_TITLE}>
        <UnifiedLoading text={STRINGS.COMMON.LOADING_DATA} size="large" type="fullscreen" />
      </SimpleLayout>
    );
  }

  return (
    <SimpleLayout title={STRINGS.CLIENT.SCHEDULE_TITLE}>
      <ScrollView
        style={styles.container}
        contentContainerStyle={styles.contentContainer}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
      >
        {/* 캘린더 */}
        <DashboardSection title={STRINGS.SCHEDULE.CALENDAR} icon={<CalendarIcon size={SIZES.ICON.MD} color={COLORS.primary} />}>
          <Calendar
            current={selectedDate}
            onDayPress={(day) => setSelectedDate(day.dateString)}
            markedDates={{
              ...markedDates,
              [selectedDate]: {
                ...markedDates[selectedDate],
                selected: true,
                selectedColor: COLORS.primary,
              },
            }}
            theme={{
              todayTextColor: COLORS.primary,
              selectedDayBackgroundColor: COLORS.primary,
              selectedDayTextColor: COLORS.white,
              arrowColor: COLORS.primary,
            }}
          />
        </DashboardSection>

        {/* 선택된 날짜의 스케줄 */}
        <DashboardSection
          title={STRINGS.SCHEDULE.SCHEDULE_FOR_DATE(selectedDate)}
          icon={<Clock size={SIZES.ICON.MD} color={COLORS.primary} />}
        >
          {selectedDaySchedules.length > 0 ? (
            <View style={styles.scheduleList}>
              {selectedDaySchedules.map((schedule, index) => (
                <View key={schedule.id || index} style={styles.scheduleItem}>
                  <View style={styles.scheduleHeader}>
                    <Text style={styles.scheduleTitle}>{schedule.title || STRINGS.SCHEDULE.CLIENT}</Text>
                    <View
                      style={[
                        styles.statusBadge,
                        { backgroundColor: getStatusColor(schedule.status) },
                      ]}
                    >
                      <Text style={styles.statusText}>{getStatusText(schedule.status)}</Text>
                    </View>
                  </View>
                  <View style={styles.scheduleDetails}>
                    <View style={styles.scheduleDetailRow}>
                      <Clock size={SIZES.ICON.SM} color={COLORS.mediumGray} />
                      <Text style={styles.scheduleTime}>
                        {schedule.startTime} - {schedule.endTime}
                      </Text>
                    </View>
                    {schedule.consultantName && (
                      <Text style={styles.consultantName}>
                        상담사: {schedule.consultantName}
                      </Text>
                    )}
                  </View>
                </View>
              ))}
            </View>
          ) : (
            <View style={styles.emptyState}>
              <CalendarIcon size={SIZES.ICON['2XL']} color={COLORS.gray400} />
              <Text style={styles.emptyText}>{STRINGS.CLIENT.SCHEDULE_EMPTY}</Text>
            </View>
          )}
        </DashboardSection>

        {/* 통계 */}
        <View style={styles.statsContainer}>
          <StatCard
            icon={<CheckCircle size={SIZES.ICON.LG} color={COLORS.success} />}
            value={schedules.filter((s) => s.status === 'COMPLETED').length}
            label={STRINGS.SCHEDULE.STATUS.COMPLETED}
            style={styles.statCard}
          />
          <StatCard
            icon={<Clock size={SIZES.ICON.LG} color={COLORS.primary} />}
            value={schedules.filter((s) => s.status === 'SCHEDULED').length}
            label={STRINGS.SCHEDULE.STATUS.SCHEDULED}
            style={styles.statCard}
          />
        </View>
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
  scheduleList: {
    gap: SPACING.md,
  },
  scheduleItem: {
    backgroundColor: COLORS.white,
    borderRadius: BORDER_RADIUS.xl,
    padding: SPACING.md,
    ...SHADOWS.sm,
  },
  scheduleHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: SPACING.sm,
  },
  scheduleTitle: {
    fontSize: TYPOGRAPHY.fontSize.lg,
    fontWeight: TYPOGRAPHY.fontWeight.bold,
    color: COLORS.dark,
    flex: 1,
  },
  statusBadge: {
    paddingHorizontal: SPACING.sm,
    paddingVertical: SPACING.xs,
    borderRadius: BORDER_RADIUS.xl,
  },
  statusText: {
    color: COLORS.white,
    fontSize: TYPOGRAPHY.fontSize.sm,
    fontWeight: TYPOGRAPHY.fontWeight.medium,
  },
  scheduleDetails: {
    gap: SPACING.xs,
  },
  scheduleDetailRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.xs,
  },
  scheduleTime: {
    fontSize: TYPOGRAPHY.fontSize.base,
    color: COLORS.mediumGray,
  },
  consultantName: {
    fontSize: TYPOGRAPHY.fontSize.base,
    color: COLORS.mediumGray,
    marginTop: SPACING.xs,
  },
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: SPACING.xl,
  },
  emptyText: {
    marginTop: SPACING.md,
    fontSize: TYPOGRAPHY.fontSize.base,
    color: COLORS.mediumGray,
    textAlign: 'center',
  },
  statsContainer: {
    gap: SPACING.md,
    marginTop: SPACING.lg,
  },
  statCard: {
    width: '100%',
    marginBottom: 0,
  },
});

export default ClientSchedule;

