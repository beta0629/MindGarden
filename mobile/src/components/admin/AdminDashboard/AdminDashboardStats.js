/**
 * AdminDashboard 통계 카드 컴포넌트 (Presentational)
 * 
 * 웹의 frontend/src/components/admin/AdminDashboard/AdminDashboardStats.js를 참고
 * 순수 UI 컴포넌트 - 로직 없음
 */

import React from 'react';
import { View, StyleSheet } from 'react-native';
import { Users, BarChart3 } from 'lucide-react-native';
import StatCard from '../../StatCard';
import { COLORS, SPACING } from '../../../constants/theme';
import SIZES from '../../../constants/sizes';
import { STRINGS } from '../../../constants/strings';

const AdminDashboardStats = ({
  stats = {},
  loading = false,
}) => {
  const statCards = [
    {
      id: 'totalUsers',
      icon: <Users size={SIZES.ICON.LG} color={COLORS.primary} />,
      value: stats.totalUsers?.toString() || '0',
      label: STRINGS.ADMIN.TOTAL_USERS,
    },
    {
      id: 'totalConsultants',
      icon: <Users size={SIZES.ICON.LG} color={COLORS.success} />,
      value: stats.totalConsultants?.toString() || '0',
      label: STRINGS.ADMIN.TOTAL_CONSULTANTS,
    },
    {
      id: 'totalClients',
      icon: <Users size={SIZES.ICON.LG} color={COLORS.info} />,
      value: stats.totalClients?.toString() || '0',
      label: STRINGS.ADMIN.TOTAL_CLIENTS,
    },
    {
      id: 'totalMappings',
      icon: <BarChart3 size={SIZES.ICON.LG} color={COLORS.warning} />,
      value: stats.totalMappings?.toString() || '0',
      label: STRINGS.ADMIN.TOTAL_MAPPINGS,
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

export default AdminDashboardStats;

