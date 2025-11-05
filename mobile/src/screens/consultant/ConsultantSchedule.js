/**
 * 상담사 스케줄 관리 화면
 * 
 * 웹의 frontend/src/components/consultant/ConsultantSchedule.js를 참고
 */

import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, StyleSheet, ScrollView, RefreshControl } from 'react-native';
import { Calendar } from 'react-native-calendars';
import { Calendar as CalendarIcon, Clock, CheckCircle } from 'lucide-react-native';
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
import { useNavigation } from '@react-navigation/native';
import { CONSULTANT_SCREENS } from '../../constants/navigation';
import VacationModal from '../../components/VacationModal';
import NotificationService from '../../services/NotificationService';

// 캘린더 테마 상수 (스타일 분리)
const CALENDAR_THEME = {
  todayTextColor: COLORS.primary,
  selectedDayBackgroundColor: COLORS.primary,
  selectedDayTextColor: COLORS.white,
  arrowColor: COLORS.primary,
};

const ConsultantSchedule = () => {
  const { user } = useSession();
  const navigation = useNavigation();
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
  const [schedules, setSchedules] = useState([]);
  const [markedDates, setMarkedDates] = useState({});
  const [isLoading, setIsLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [isVacationModalOpen, setIsVacationModalOpen] = useState(false);
  const [vacationModalDate, setVacationModalDate] = useState(null);

  // 비즈니스 로직: 캘린더 도트 색상 결정
  const getCalendarDotColor = useCallback((status) => {
    return status === 'COMPLETED' ? COLORS.success : COLORS.primary;
  }, []);

  // 비즈니스 로직: 스케줄 상태별 배지 스타일 선택
  const getStatusBadgeStyle = useCallback((status) => {
    const baseStyle = styles.statusBadge;
    switch (status) {
      case 'COMPLETED':
        return [baseStyle, styles.statusBadgeCompleted];
      case 'CANCELLED':
        return [baseStyle, styles.statusBadgeCancelled];
      case 'SCHEDULED':
        return [baseStyle, styles.statusBadgeScheduled];
      default:
        return [baseStyle, styles.statusBadgeDefault];
    }
  }, []);

  // 비즈니스 로직: 스케줄 상태 텍스트
  const getStatusText = useCallback((status) => {
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
  }, []);

  // 스케줄 데이터 로드
  const loadSchedules = useCallback(async () => {
    if (!user?.id) return;

    try {
      setIsLoading(true);
      // 웹과 동일한 API 사용
      const response = await apiGet(SCHEDULE_API.SCHEDULES, {
        userId: user.id,
        userRole: 'CONSULTANT',
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
              dotColor: getCalendarDotColor(schedule.status),
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
  }, [user?.id, getCalendarDotColor]);

  useEffect(() => {
    loadSchedules();
  }, [loadSchedules]);

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    loadSchedules();
  }, [loadSchedules]);

  // 선택된 날짜의 스케줄 필터링
  const selectedDaySchedules = schedules.filter((s) => s.date === selectedDate);

  if (isLoading) {
    return (
      <SimpleLayout title={STRINGS.CONSULTANT.SCHEDULE_TITLE}>
        <UnifiedLoading text={STRINGS.COMMON.LOADING_DATA} size="large" type="fullscreen" />
      </SimpleLayout>
    );
  }

  return (
    <SimpleLayout title={STRINGS.CONSULTANT.SCHEDULE_TITLE}>
      <ScrollView
        style={styles.container}
        contentContainerStyle={styles.contentContainer}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
      >
        {/* 캘린더 */}
        <DashboardSection title={STRINGS.SCHEDULE.CALENDAR} icon={<CalendarIcon size={SIZES.ICON.MD} color={COLORS.primary} />}>
          <Calendar
            current={selectedDate}
            onDayPress={(day) => {
              // 날짜 선택
              setSelectedDate(day.dateString);
              
              // 상담사는 날짜 클릭 시 휴가 등록 모달 열기
              const clickedDate = new Date(day.dateString);
              const today = new Date();
              today.setHours(0, 0, 0, 0);
              clickedDate.setHours(0, 0, 0, 0);
              
              if (clickedDate < today) {
                // 과거 날짜는 휴가 등록 불가
                return;
              }
              
              // 휴가 등록 모달 열기
              setVacationModalDate(day.dateString);
              setIsVacationModalOpen(true);
            }}
            markedDates={{
              ...markedDates,
              [selectedDate]: {
                ...markedDates[selectedDate],
                selected: true,
                selectedColor: COLORS.primary,
              },
            }}
            theme={CALENDAR_THEME}
          />
        </DashboardSection>

        {/* 선택된 날짜의 스케줄 */}
        <DashboardSection title={STRINGS.SCHEDULE.SCHEDULE_FOR_DATE(selectedDate)} icon={<Clock size={SIZES.ICON.MD} color={COLORS.primary} />}>
          {selectedDaySchedules.length > 0 ? (
            <View style={styles.scheduleList}>
              {selectedDaySchedules.map((schedule, index) => (
                <View key={schedule.id || index} style={styles.scheduleItem}>
                  <View style={styles.scheduleHeader}>
                    <Text style={styles.scheduleTitle}>{schedule.title || STRINGS.SCHEDULE.CLIENT}</Text>
                    <View style={getStatusBadgeStyle(schedule.status)}>
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
                    {schedule.clientName && (
                      <Text style={styles.clientName}>{STRINGS.SCHEDULE.CLIENT}: {schedule.clientName}</Text>
                    )}
                  </View>
                </View>
              ))}
            </View>
          ) : (
            <View style={styles.emptyState}>
              <CalendarIcon size={SIZES.ICON['2XL']} color={COLORS.gray400} />
              <Text style={styles.emptyText}>{STRINGS.CONSULTANT.SCHEDULE_EMPTY}</Text>
            </View>
          )}
        </DashboardSection>

        {/* 통계 */}
        <View style={styles.statsContainer}>
          <StatCard
            icon={<CheckCircle size={SIZES.ICON.LG} color={COLORS.success} />}
            value={schedules.filter((s) => s.status === 'COMPLETED').length}
            label={STRINGS.CONSULTANT.COMPLETED}
            style={styles.statCard}
          />
          <StatCard
            icon={<Clock size={SIZES.ICON.LG} color={COLORS.primary} />}
            value={schedules.filter((s) => s.status === 'SCHEDULED').length}
            label={STRINGS.CONSULTANT.SCHEDULED}
            style={styles.statCard}
          />
        </View>

        {/* 상담사는 일정 추가 불가, 휴가만 등록 가능 */}
      </ScrollView>

      {/* 휴가 등록 모달 */}
      <VacationModal
        isOpen={isVacationModalOpen}
        onClose={() => {
          setIsVacationModalOpen(false);
          setVacationModalDate(null);
        }}
        onSuccess={(data) => {
          NotificationService.success('휴무가 성공적으로 등록되었습니다.');
          loadSchedules(); // 스케줄 새로고침
        }}
        selectedDate={vacationModalDate || selectedDate}
        consultantId={user?.id}
      />
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
  statusBadgeCompleted: {
    backgroundColor: COLORS.success,
  },
  statusBadgeCancelled: {
    backgroundColor: COLORS.error,
  },
  statusBadgeScheduled: {
    backgroundColor: COLORS.primary,
  },
  statusBadgeDefault: {
    backgroundColor: COLORS.gray500,
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
  clientName: {
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
  createButton: {
    marginTop: SPACING.lg,
  },
  createButtonText: {
    color: COLORS.white,
    fontSize: TYPOGRAPHY.fontSize.base,
    fontWeight: TYPOGRAPHY.fontWeight.bold,
  },
});

export default ConsultantSchedule;
