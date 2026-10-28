/**
 * MGButton — Clinic-OS 공통 CTA atom
 * primary (teal fill) · ghost (line + ink/slate). 화면별 버튼 스킨 금지.
 *
 * @author MindGarden
 * @since 2026-10-28
 */
import { Platform, Pressable, StyleSheet, Text, type ViewStyle } from 'react-native';
import * as Haptics from 'expo-haptics';
import { useTheme } from '@/theme';
import { ADMIN_MIN_TOUCH_TARGET } from '@/theme/tokens';

export type MGButtonVariant = 'primary' | 'ghost';

export interface MGButtonProps {
  readonly label: string;
  readonly variant?: MGButtonVariant;
  readonly onPress?: () => void;
  readonly disabled?: boolean;
  readonly accessibilityLabel?: string;
  readonly style?: ViewStyle;
  readonly testID?: string;
}

export function MGButton({
  label,
  variant = 'primary',
  onPress,
  disabled = false,
  accessibilityLabel,
  style,
  testID,
}: MGButtonProps) {
  const theme = useTheme();
  const pressColor = theme.colors.primaryPress ?? theme.colors.primaryDark;
  const isPrimary = variant === 'primary';

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
      testID={testID}
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel ?? label}
      accessibilityState={{ disabled }}
      style={({ pressed }) => [
        styles.base,
        {
          backgroundColor: isPrimary
            ? pressed && !disabled
              ? pressColor
              : theme.colors.primary
            : 'transparent',
          borderColor: isPrimary ? theme.colors.primary : theme.colors.border,
          borderWidth: isPrimary ? 0 : 1,
          opacity: disabled ? 0.45 : pressed && !isPrimary ? 0.72 : 1,
          borderRadius: theme.borderRadius.lg,
        },
        style,
      ]}
    >
      <Text
        style={{
          fontFamily: theme.fontFamily.semibold,
          fontSize: theme.fontSize.base,
          color: isPrimary ? theme.colors.textOnPrimary : theme.colors.slate,
          letterSpacing: -0.16,
        }}
      >
        {label}
      </Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  base: {
    minHeight: ADMIN_MIN_TOUCH_TARGET,
    paddingHorizontal: 18,
    alignItems: 'center',
    justifyContent: 'center',
    flexGrow: 0,
    flexShrink: 1,
  },
});
