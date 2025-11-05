/**
 * StatCard 컴포넌트
 * 통계 카드 표시용 컴포넌트
 * 
 * 웹의 frontend/src/components/ui/Card/StatCard.js를 참고
 */

import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { COLORS, SPACING, BORDER_RADIUS, SHADOWS, TYPOGRAPHY, SIZES } from '../constants/theme';

const StatCard = ({
  icon,
  value,
  label,
  change,
  variant = 'default',
  style,
}) => {
  return (
    <View style={[styles.card, variant === 'highlight' && styles.highlight, style]}>
      <View style={styles.header}>
        {icon && <View style={styles.iconContainer}>{icon}</View>}
        <View style={styles.content}>
          <Text style={styles.value}>{value}</Text>
          <Text style={styles.label}>{label}</Text>
          {change && (
            <Text style={styles.change}>{change}</Text>
          )}
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  card: {
    backgroundColor: COLORS.white,
    borderRadius: SIZES.CARD.BORDER_RADIUS, // 모바일 최적화 둥글기
    padding: SIZES.CARD.PADDING, // 모바일 최적화 패딩
    ...SHADOWS.sm, // 미묘한 그림자
    marginBottom: 0, // 컨테이너에서 gap으로 처리
  },
  highlight: {
    borderWidth: SIZES.BORDER_WIDTH.MEDIUM,
    borderColor: COLORS.primary,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center', // 오늘의 활동과 동일하게 중앙 정렬
  },
  iconContainer: {
    marginRight: SPACING.card.gap, // 카드 내 요소 간격
  },
  content: {
    flex: 1,
  },
  value: {
    fontSize: TYPOGRAPHY.fontSize['2xl'], // 모바일에 더 적합한 크기
    fontWeight: TYPOGRAPHY.fontWeight.bold,
    color: COLORS.dark,
    marginBottom: SPACING.xs,
  },
  label: {
    fontSize: TYPOGRAPHY.fontSize.base,
    color: COLORS.mediumGray,
    marginBottom: SPACING.xs / 2,
  },
  change: {
    fontSize: TYPOGRAPHY.fontSize.sm,
    color: COLORS.success,
  },
});

export default StatCard;

