import React from 'react';
import Toast from 'react-native-toast-message';
import { View, Text, StyleSheet } from 'react-native';
import { COLORS, TYPOGRAPHY, SPACING, BORDER_RADIUS, SHADOWS, SIZES } from '../constants/theme';

/*
  Toast config for react-native-toast-message
  Custom types can be added here
*/
export const toastConfig = {
  success: ({ text1, text2, props, ...rest }) => (
    <View style={[styles.toastContainer, styles.successBackground]}>
      <Text style={styles.toastText1}>{text1}</Text>
      {text2 && <Text style={styles.toastText2}>{text2}</Text>}
    </View>
  ),
  error: ({ text1, text2, props, ...rest }) => (
    <View style={[styles.toastContainer, styles.errorBackground]}>
      <Text style={styles.toastText1}>{text1}</Text>
      {text2 && <Text style={styles.toastText2}>{text2}</Text>}
    </View>
  ),
  info: ({ text1, text2, props, ...rest }) => (
    <View style={[styles.toastContainer, styles.infoBackground]}>
      <Text style={styles.toastText1}>{text1}</Text>
      {text2 && <Text style={styles.toastText2}>{text2}</Text>}
    </View>
  ),
  warning: ({ text1, text2, props, ...rest }) => (
    <View style={[styles.toastContainer, styles.warningBackground]}>
      <Text style={styles.toastText1}>{text1}</Text>
      {text2 && <Text style={styles.toastText2}>{text2}</Text>}
    </View>
  ),
  // Add other custom types if needed
};

const styles = StyleSheet.create({
  toastContainer: {
    paddingHorizontal: SPACING.lg,
    paddingVertical: SPACING.md,
    borderRadius: BORDER_RADIUS.md,
    width: SIZES.TOAST.WIDTH,
    maxWidth: SIZES.TOAST.MAX_WIDTH,
    flexDirection: 'column',
    justifyContent: 'center',
    alignItems: 'flex-start',
    ...SHADOWS.lg,
  },
  successBackground: {
    backgroundColor: COLORS.success,
  },
  errorBackground: {
    backgroundColor: COLORS.error,
  },
  infoBackground: {
    backgroundColor: COLORS.info,
  },
  warningBackground: {
    backgroundColor: COLORS.warning,
  },
  toastText1: {
    fontSize: TYPOGRAPHY.fontSize.lg,
    fontWeight: TYPOGRAPHY.fontWeight.bold,
    color: COLORS.white,
  },
  toastText2: {
    fontSize: TYPOGRAPHY.fontSize.base,
    color: COLORS.white,
    marginTop: SPACING.xs,
  },
});
