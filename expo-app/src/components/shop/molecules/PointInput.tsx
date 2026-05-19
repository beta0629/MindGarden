/**
 * PointInput — 포인트 입력 Molecule
 *
 * @author MindGarden
 * @since 2026-05-19
 */
import { Platform, Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import * as Haptics from 'expo-haptics';
import { useTheme } from '@/theme';

interface PointInputProps {
  value: string;
  onChange: (value: string) => void;
  onUseAll: () => void;
  maxMinor: number;
  disabled?: boolean;
}

export function PointInput({
  value,
  onChange,
  onUseAll,
  maxMinor,
  disabled = false,
}: PointInputProps) {
  const theme = useTheme();

  const handleUseAll = () => {
    if (disabled || maxMinor <= 0) return;
    if (Platform.OS !== 'web') {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
    onUseAll();
  };

  return (
    <View style={styles.row}>
      <TextInput
        value={value}
        onChangeText={onChange}
        keyboardType="number-pad"
        inputMode="numeric"
        editable={!disabled}
        style={[
          styles.input,
          {
            color: theme.colors.textMain,
            borderColor: theme.colors.border,
            backgroundColor: theme.colors.surface,
            fontFamily: theme.fontFamily.regular,
            fontSize: theme.fontSize.base,
            borderRadius: theme.borderRadius.md,
          },
        ]}
        accessibilityLabel="사용 포인트"
        placeholder="0"
        placeholderTextColor={theme.colors.textTertiary}
      />
      <Pressable
        onPress={handleUseAll}
        disabled={disabled || maxMinor <= 0}
        style={({ pressed }) => [
          styles.useAllBtn,
          {
            backgroundColor: pressed ? theme.colors.accentSoft : theme.colors.surface,
            borderColor: theme.colors.border,
            borderRadius: theme.borderRadius.md,
            opacity: disabled || maxMinor <= 0 ? 0.5 : 1,
          },
        ]}
        accessibilityRole="button"
        accessibilityLabel="전액 사용"
      >
        <Text
          style={[
            styles.useAllText,
            {
              color: theme.colors.textMain,
              fontFamily: theme.fontFamily.medium,
              fontSize: theme.fontSize.sm,
            },
          ]}
        >
          전액 사용
        </Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  input: {
    flex: 1,
    minHeight: 44,
    paddingHorizontal: 12,
    borderWidth: StyleSheet.hairlineWidth,
  },
  useAllBtn: {
    minHeight: 44,
    paddingHorizontal: 14,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: StyleSheet.hairlineWidth,
  },
  useAllText: {
    lineHeight: 20,
  },
});
