/**
 * AdminDashboard 빠른 액션 버튼 컴포넌트 (Presentational)
 * 
 * 웹의 frontend/src/components/admin/AdminDashboard/AdminDashboardActions.js를 참고
 * 순수 UI 컴포넌트 - 로직 없음
 */

import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { BarChart3, Users, Calendar } from 'lucide-react-native';
import MGButton from '../../MGButton';
import { COLORS, SPACING, TYPOGRAPHY } from '../../../constants/theme';
import SIZES from '../../../constants/sizes';
import { STRINGS } from '../../../constants/strings';
import { ADMIN_SCREENS } from '../../../constants/navigation';

const AdminDashboardActions = ({
  onNavigate,
}) => {
  const actions = [
    {
      id: 'userManagement',
      variant: 'primary',
      icon: <Users size={SIZES.ICON.MD} color={COLORS.white} />,
      label: STRINGS.ADMIN.USER_MANAGEMENT,
      screen: ADMIN_SCREENS.USER_MANAGEMENT,
    },
    {
      id: 'mappingManagement',
      variant: 'success',
      icon: <BarChart3 size={SIZES.ICON.MD} color={COLORS.white} />,
      label: STRINGS.ADMIN.MAPPING_MANAGEMENT,
      screen: ADMIN_SCREENS.MAPPING_MANAGEMENT,
    },
    {
      id: 'sessionManagement',
      variant: 'info',
      icon: <Calendar size={SIZES.ICON.MD} color={COLORS.white} />,
      label: STRINGS.ADMIN.SESSION_MANAGEMENT,
      screen: ADMIN_SCREENS.SESSION_MANAGEMENT,
    },
    {
      id: 'statistics',
      variant: 'warning',
      icon: <BarChart3 size={SIZES.ICON.MD} color={COLORS.white} />,
      label: STRINGS.ADMIN.STATISTICS_DASHBOARD,
      screen: ADMIN_SCREENS.STATISTICS,
    },
  ];

  return (
    <View style={styles.container}>
      {actions.map((action) => (
        <MGButton
          key={action.id}
          variant={action.variant}
          size="medium"
          fullWidth
          onPress={() => onNavigate(action.screen)}
          style={styles.actionButton}
        >
          <View style={styles.actionButtonContent}>
            {action.icon}
            <Text style={styles.actionButtonText}>{action.label}</Text>
          </View>
        </MGButton>
      ))}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    gap: SPACING.md,
  },
  actionButton: {
    marginBottom: 0,
  },
  actionButtonContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: SPACING.xs,
  },
  actionButtonText: {
    color: COLORS.white,
    fontSize: TYPOGRAPHY.fontSize.base,
    fontWeight: TYPOGRAPHY.fontWeight.semibold,
  },
});

export default AdminDashboardActions;

