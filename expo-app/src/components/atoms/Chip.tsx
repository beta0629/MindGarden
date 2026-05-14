/**
 * Chip — 필터·선택용 칩 atom
 *
 * @author MindGarden
 * @since 2026-05-12
 */
import { Pressable, StyleSheet, Text, type ViewStyle } from 'react-native';
import { Platform } from 'react-native';
import * as Haptics from 'expo-haptics';
import { useTheme } from '@/theme';

interface ChipProps {
  label: string;
  selected?: boolean;
  disabled?: boolean;
  onPress?: () => void;
  style?: ViewStyle;
}

export function Chip({ label, selected = false, disabled = false, onPress, style }: ChipProps) {
  const theme = useTheme();

  const handlePress = () => {
    if (disabled) return;
    if (Platform.OS !== 'web') {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
    onPress?.();
  };

  return (
    <Pressable
      onPress={handlePress}
      disabled={disabled}
      style={[
        styles.chip,
        {
          backgroundColor: selected ? theme.colors.primary : 'transparent',
          borderColor: selected ? theme.colors.primary : theme.colors.border,
          opacity: disabled ? 0.5 : 1,
        },
        style,
      ]}
      accessibilityRole="button"
      accessibilityState={{ selected, disabled }}
      accessibilityLabel={label}
    >
      <Text
        style={[
          styles.label,
          {
            color: selected ? theme.colors.textOnPrimary : theme.colors.textMain,
            fontFamily: theme.fontFamily.medium,
            fontSize: theme.fontSize.sm,
          },
        ]}
      >
        {label}
      </Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  chip: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 9999,
    borderWidth: 1,
  },
  label: {
    textAlign: 'center',
  },
});
