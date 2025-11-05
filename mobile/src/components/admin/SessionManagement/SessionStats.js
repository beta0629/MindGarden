/**
 * SessionManagement 통계 카드 컴포넌트 (Presentational)
 * 
 * 순수 UI 컴포넌트 - 로직 없음
 */

import React from 'react';
import { View, StyleSheet } from 'react-native';
import { Calendar as CalendarIcon, Clock, CheckCircle, AlertTriangle } from 'lucide-react-native';
import StatCard from '../../StatCard';
import { COLORS, SPACING } from '../../../constants/theme';
import SIZES from '../../../constants/sizes';
import { STRINGS } from '../../../constants/strings';

const SessionStats = ({
  stats = {
    total: 0,
    scheduled: 0,
    completed: 0,
    pending: 0,
  },
}) => {
  const statCards = [
    {
      id: 'total',
      icon: <CalendarIcon size={SIZES.ICON.LG} color={COLORS.primary} />,
      value: stats.total.toString(),
      label: STRINGS.SESSION.TOTAL_SESSIONS || '총 세션',
    },
    {
      id: 'scheduled',
      icon: <Clock size={SIZES.ICON.LG} color={COLORS.info} />,
      value: stats.scheduled.toString(),
      label: STRINGS.SCHEDULE.STATUS.SCHEDULED,
    },
    {
      id: 'completed',
      icon: <CheckCircle size={SIZES.ICON.LG} color={COLORS.success} />,
      value: stats.completed.toString(),
      label: STRINGS.SCHEDULE.STATUS.COMPLETED,
    },
    {
      id: 'pending',
      icon: <AlertTriangle size={SIZES.ICON.LG} color={COLORS.warning} />,
      value: stats.pending.toString(),
      label: STRINGS.SESSION.PENDING,
    },
  ];

  return (
    <View style={styles.container}>
      {statCards.map((card) => (
        <StatCard
          key={card.id}
          icon={card.icon}
          value={card.value}
          label={card.label}
          style={styles.statCard}
        />
      ))}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    gap: SPACING.md,
    marginBottom: SPACING.lg,
  },
  statCard: {
    width: '100%',
    marginBottom: 0,
  },
});

export default SessionStats;

