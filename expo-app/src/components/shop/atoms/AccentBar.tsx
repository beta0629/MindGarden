/**
 * AccentBar — 카드 좌측 4px 포인트 바 atom
 *
 * @author MindGarden
 * @since 2026-05-19
 */
import { StyleSheet, View, type ViewStyle } from 'react-native';
import { useTheme } from '@/theme';

interface AccentBarProps {
  style?: ViewStyle;
}

export function AccentBar({ style }: AccentBarProps) {
  const theme = useTheme();

  return (
    <View
      style={[styles.bar, { backgroundColor: theme.colors.primary }, style]}
      accessibilityElementsHidden
      importantForAccessibility="no-hide-descendants"
    />
  );
}

const styles = StyleSheet.create({
  bar: {
    width: 4,
    alignSelf: 'stretch',
    borderTopLeftRadius: 12,
    borderBottomLeftRadius: 12,
  },
});
