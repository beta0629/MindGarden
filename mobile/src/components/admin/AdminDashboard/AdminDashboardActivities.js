/**
 * AdminDashboard 오늘의 활동 컴포넌트 (Presentational)
 * 
 * 순수 UI 컴포넌트 - 로직 없음
 */

import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Calendar, MessageSquare, FileText } from 'lucide-react-native';
import { COLORS, SPACING, TYPOGRAPHY, SHADOWS } from '../../../constants/theme';
import SIZES from '../../../constants/sizes';
import { STRINGS } from '../../../constants/strings';

const AdminDashboardActivities = ({
  todaySchedules = 0,
  pendingMessages = 0,
  pendingRecords = 0,
}) => {
  const activities = [
    {
      id: 'todaySchedules',
      icon: <Calendar size={SIZES.ICON.MD} color={COLORS.primary} />,
      title: STRINGS.ADMIN.TODAY_SCHEDULES,
      value: todaySchedules,
    },
    {
      id: 'pendingMessages',
      icon: <MessageSquare size={SIZES.ICON.MD} color={COLORS.warning} />,
      title: STRINGS.ADMIN.PENDING_MESSAGES,
      value: pendingMessages,
    },
    {
      id: 'pendingRecords',
      icon: <FileText size={SIZES.ICON.MD} color={COLORS.info} />,
      title: STRINGS.ADMIN.PENDING_RECORDS,
      value: pendingRecords,
    },
  ];

  return (
    <View style={styles.container}>
      {activities.map((activity) => (
        <View key={activity.id} style={styles.activityItem}>
          {activity.icon}
          <View style={styles.activityContent}>
            <Text style={styles.activityTitle}>{activity.title}</Text>
            <Text style={styles.activityValue}>{activity.value}</Text>
          </View>
        </View>
      ))}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    gap: SPACING.md,
  },
  activityItem: {
    flexDirection: 'row',
    alignItems: 'center',
    width: '100%',
    padding: SIZES.CARD.PADDING,
    backgroundColor: COLORS.white,
    borderRadius: SIZES.CARD.BORDER_RADIUS,
    ...SHADOWS.sm,
  },
  activityContent: {
    flex: 1,
    marginLeft: SPACING.card.gap,
  },
  activityTitle: {
    fontSize: TYPOGRAPHY.fontSize.base,
    color: COLORS.dark,
    marginBottom: SPACING.xs,
  },
  activityValue: {
    fontSize: TYPOGRAPHY.fontSize['2xl'],
    fontWeight: TYPOGRAPHY.fontWeight.bold,
    color: COLORS.primary,
  },
});

export default AdminDashboardActivities;

