/**
 * MappingManagement 통계 카드 컴포넌트 (Presentational)
 * 
 * 웹의 frontend/src/components/admin/mapping/MappingStats.js를 참고
 * 순수 UI 컴포넌트 - 로직 없음
 */

import React from 'react';
import { View, StyleSheet } from 'react-native';
import { Link, Users, Unlink } from 'lucide-react-native';
import StatCard from '../../StatCard';
import { COLORS, SPACING } from '../../../constants/theme';
import SIZES from '../../../constants/sizes';
import { STRINGS } from '../../../constants/strings';

const MappingStats = ({
  mappings = [],
  consultants = [],
  clients = [],
  unmappedClientsCount = 0,
}) => {
  const activeMappingsCount = mappings.filter(m => 
    m.status === 'ACTIVE' || 
    m.status === 'PENDING_PAYMENT' || 
    m.status === 'PAYMENT_CONFIRMED'
  ).length;

  const statCards = [
    {
      id: 'activeMappings',
      icon: <Link size={SIZES.ICON.LG} color={COLORS.primary} />,
      value: activeMappingsCount.toString(),
      label: STRINGS.MAPPING.ACTIVE_MAPPINGS || '활성 매칭',
    },
    {
      id: 'totalConsultants',
      icon: <Users size={SIZES.ICON.LG} color={COLORS.success} />,
      value: consultants.length.toString(),
      label: STRINGS.ADMIN.TOTAL_CONSULTANTS,
    },
    {
      id: 'totalClients',
      icon: <Users size={SIZES.ICON.LG} color={COLORS.info} />,
      value: clients.length.toString(),
      label: STRINGS.ADMIN.TOTAL_CLIENTS,
    },
    {
      id: 'unmappedClients',
      icon: <Unlink size={SIZES.ICON.LG} color={COLORS.warning} />,
      value: unmappedClientsCount.toString(),
      label: STRINGS.MAPPING.UNMAPPED_CLIENTS || '미매칭 내담자',
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

export default MappingStats;

