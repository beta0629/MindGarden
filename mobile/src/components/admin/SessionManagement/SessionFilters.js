/**
 * SessionManagement 필터 컴포넌트 (Presentational)
 * 
 * 순수 UI 컴포넌트 - 로직 없음
 */

import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { COLORS, SPACING, TYPOGRAPHY, BORDER_RADIUS } from '../../../constants/theme';
import { STRINGS } from '../../../constants/strings';

const SessionFilters = ({
  statusFilter = 'ALL',
  onStatusChange,
}) => {
  const filterOptions = [
    { value: 'ALL', label: STRINGS.COMMON.ALL },
    { value: 'SCHEDULED', label: STRINGS.SCHEDULE.STATUS.SCHEDULED },
    { value: 'COMPLETED', label: STRINGS.SCHEDULE.STATUS.COMPLETED },
    { value: 'CANCELLED', label: STRINGS.SCHEDULE.STATUS.CANCELLED },
    { value: 'PENDING', label: STRINGS.SESSION.PENDING },
  ];

  return (
    <View style={styles.container}>
      <Text style={styles.label}>{STRINGS.USER.STATUS}:</Text>
      <View style={styles.buttonsContainer}>
        {filterOptions.map((option) => (
          <TouchableOpacity
            key={option.value}
            style={[
              styles.button,
              statusFilter === option.value && styles.buttonActive,
            ]}
            onPress={() => onStatusChange(option.value)}
          >
            <Text style={[
              styles.buttonText,
              statusFilter === option.value && styles.buttonTextActive,
            ]}>
              {option.label}
            </Text>
          </TouchableOpacity>
        ))}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    padding: SPACING.md,
  },
  label: {
    fontSize: TYPOGRAPHY.fontSize.base,
    fontWeight: TYPOGRAPHY.fontWeight.semibold,
    color: COLORS.dark,
    marginBottom: SPACING.sm,
  },
  buttonsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: SPACING.xs,
  },
  button: {
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.sm,
    borderRadius: BORDER_RADIUS.md,
    backgroundColor: COLORS.gray100,
  },
  buttonActive: {
    backgroundColor: COLORS.primary,
  },
  buttonText: {
    fontSize: TYPOGRAPHY.fontSize.sm,
    color: COLORS.gray700,
    fontWeight: TYPOGRAPHY.fontWeight.medium,
  },
  buttonTextActive: {
    color: COLORS.white,
    fontWeight: TYPOGRAPHY.fontWeight.semibold,
  },
});

export default SessionFilters;

