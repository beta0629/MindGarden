/**
 * AdminDashboard 시스템 상태 컴포넌트 (Presentational)
 * 
 * 웹의 frontend/src/components/admin/AdminDashboard/AdminDashboardSystem.js를 참고
 * 순수 UI 컴포넌트 - 로직 없음
 */

import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Settings } from 'lucide-react-native';
import { COLORS, SPACING, TYPOGRAPHY, BORDER_RADIUS } from '../../../constants/theme';
import { STRINGS } from '../../../constants/strings';

const AdminDashboardSystem = ({
  systemHealth = 'GOOD',
}) => {
  const getStatusStyle = () => {
    switch (systemHealth) {
      case 'GOOD':
        return styles.statusGood;
      case 'WARNING':
        return styles.statusWarning;
      case 'ERROR':
        return styles.statusError;
      default:
        return styles.statusGood;
    }
  };

  const getStatusText = () => {
    switch (systemHealth) {
      case 'GOOD':
        return STRINGS.ADMIN.STATUS_GOOD;
      case 'WARNING':
        return STRINGS.ADMIN.STATUS_WARNING;
      case 'ERROR':
        return STRINGS.ADMIN.STATUS_ERROR;
      default:
        return STRINGS.ADMIN.STATUS_GOOD;
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.statusItem}>
        <Text style={styles.statusLabel}>{STRINGS.ADMIN.SYSTEM_HEALTH}</Text>
        <View style={[styles.statusBadge, getStatusStyle()]}>
          <Text style={styles.statusText}>{getStatusText()}</Text>
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    padding: SPACING.md,
  },
  statusItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  statusLabel: {
    fontSize: TYPOGRAPHY.fontSize.base,
    color: COLORS.dark,
    fontWeight: TYPOGRAPHY.fontWeight.semibold,
  },
  statusBadge: {
    paddingHorizontal: SPACING.sm,
    paddingVertical: SPACING.xs,
    borderRadius: BORDER_RADIUS.sm,
  },
  statusGood: {
    backgroundColor: COLORS.successLight,
  },
  statusWarning: {
    backgroundColor: COLORS.warningLight,
  },
  statusError: {
    backgroundColor: COLORS.errorLight,
  },
  statusText: {
    fontSize: TYPOGRAPHY.fontSize.sm,
    fontWeight: TYPOGRAPHY.fontWeight.semibold,
    color: COLORS.dark,
  },
});

export default AdminDashboardSystem;

