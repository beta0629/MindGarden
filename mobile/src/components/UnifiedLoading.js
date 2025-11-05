/**
 * UnifiedLoading 컴포넌트
 * 통합 로딩 컴포넌트
 */

import React from 'react';
import { View, Text, ActivityIndicator, StyleSheet } from 'react-native';
import { COLORS, SPACING, TYPOGRAPHY } from '../constants/theme';
import { STRINGS } from '../constants/strings';

const UnifiedLoading = ({
  text = STRINGS.COMMON.LOADING,
  size = 'small',
  variant = 'default',
  type = 'inline', // inline, fullscreen
}) => {
  const indicatorSize = size === 'large' ? 'large' : 'small';

  if (type === 'fullscreen') {
    return (
      <View style={styles.fullscreen}>
        <ActivityIndicator size={indicatorSize} color={COLORS.primary} />
        {text && <Text style={styles.text}>{text}</Text>}
      </View>
    );
  }

  return (
    <View style={styles.inline}>
      <ActivityIndicator size={indicatorSize} color={COLORS.primary} />
      {text && <Text style={styles.text}>{text}</Text>}
    </View>
  );
};

const styles = StyleSheet.create({
  fullscreen: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: COLORS.white,
  },
  inline: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: SPACING.md,
  },
  text: {
    marginLeft: SPACING.sm,
    fontSize: TYPOGRAPHY.fontSize.base,
    color: COLORS.mediumGray,
  },
});

export default UnifiedLoading;

