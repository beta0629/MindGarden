/**
 * DashboardSection 컴포넌트
 * 대시보드 섹션 래퍼 컴포넌트
 * 
 * 웹의 frontend/src/components/layout/DashboardSection.js를 참고
 */

import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { COLORS, SPACING, TYPOGRAPHY } from '../constants/theme';
import MGButton from './MGButton';

const DashboardSection = ({
  title,
  icon,
  actions,
  children,
  style,
}) => {
  return (
    <View style={[styles.container, style]}>
      {/* 헤더 */}
      <View style={styles.header}>
        <View style={styles.titleContainer}>
          {icon && <View style={styles.iconContainer}>{icon}</View>}
          <Text style={styles.title}>{title}</Text>
        </View>
        {actions && (
          <View style={styles.actionsContainer}>
            {actions}
          </View>
        )}
      </View>
      
      {/* 컨텐츠 */}
      <View style={styles.content}>
        {children}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginBottom: SPACING.lg,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: SPACING.md,
    paddingHorizontal: SPACING.md,
  },
  titleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  iconContainer: {
    marginRight: SPACING.xs,
  },
  title: {
    fontSize: TYPOGRAPHY.fontSize.xl,
    fontWeight: TYPOGRAPHY.fontWeight.bold,
    color: COLORS.dark,
  },
  actionsContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  content: {
    paddingHorizontal: SPACING.md,
  },
});

export default DashboardSection;
