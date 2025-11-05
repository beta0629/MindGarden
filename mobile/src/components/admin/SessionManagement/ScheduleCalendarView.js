/**
 * 스케줄 달력 뷰 컴포넌트 (Presentational)
 * 
 * react-native-calendars를 사용한 월별 달력 뷰
 * 순수 UI 컴포넌트 - 로직 없음
 */

import React from 'react';
import { View, StyleSheet } from 'react-native';
import { Calendar } from 'react-native-calendars';
import { COLORS, SPACING, BORDER_RADIUS, SHADOWS, TYPOGRAPHY } from '../../../constants/theme';
import { STRINGS } from '../../../constants/strings';

const ScheduleCalendarView = ({
  markedDates = {},
  onDayPress,
  currentMonth,
  onMonthChange,
  minDate,
  maxDate,
}) => {
  // 디버깅: markedDates 확인
  const markedDatesKeys = Object.keys(markedDates);
  console.log('📅 ScheduleCalendarView - markedDates 전달됨:', markedDatesKeys.length, '개 날짜');
  if (markedDatesKeys.length > 0) {
    console.log('📅 markedDates 샘플 (첫 5개):', markedDatesKeys.slice(0, 5));
    const sampleDate = markedDatesKeys[0];
    console.log('📅 샘플 날짜 데이터:', sampleDate, markedDates[sampleDate]);
  }
  
  return (
    <View style={styles.container}>
      <Calendar
        current={currentMonth || new Date().toISOString().split('T')[0]}
        minDate={minDate}
        maxDate={maxDate}
        onDayPress={onDayPress}
        markedDates={markedDates}
        markingType={'multi-dot'}
        theme={{
          backgroundColor: COLORS.white,
          calendarBackground: COLORS.white,
          textSectionTitleColor: COLORS.mediumGray,
          selectedDayBackgroundColor: COLORS.primary,
          selectedDayTextColor: COLORS.white,
          todayTextColor: COLORS.primary,
          dayTextColor: COLORS.dark,
          textDisabledColor: COLORS.gray300,
          dotColor: COLORS.primary,
          selectedDotColor: COLORS.white,
          arrowColor: COLORS.primary,
          monthTextColor: COLORS.dark,
          textDayFontWeight: TYPOGRAPHY.fontWeight.medium,
          textMonthFontWeight: TYPOGRAPHY.fontWeight.semibold,
          textDayHeaderFontWeight: TYPOGRAPHY.fontWeight.semibold,
          textDayFontSize: TYPOGRAPHY.fontSize.base,
          textMonthFontSize: TYPOGRAPHY.fontSize.lg,
          textDayHeaderFontSize: TYPOGRAPHY.fontSize.sm,
        }}
        onMonthChange={onMonthChange}
        enableSwipeMonths={true}
        style={styles.calendar}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: COLORS.white,
    borderRadius: BORDER_RADIUS.md,
    padding: SPACING.md,
    marginBottom: SPACING.lg,
    ...SHADOWS.sm,
  },
  calendar: {
    borderRadius: BORDER_RADIUS.md,
  },
});

export default ScheduleCalendarView;

