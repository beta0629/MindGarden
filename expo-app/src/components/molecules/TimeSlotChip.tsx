/**
 * TimeSlotChip — 시간 슬롯 칩 (3상태: 가용/불가/선택됨)
 *
 * @author MindGarden
 * @since 2026-05-12
 */
import { Pressable, StyleSheet, Text, Platform } from 'react-native';
import * as Haptics from 'expo-haptics';
import { Check } from 'lucide-react-native';
import { useTheme } from '@/theme';

interface TimeSlotChipProps {
  time: string;
  isAvailable: boolean;
  isSelected: boolean;
  onPress?: () => void;
}

export function TimeSlotChip({ time, isAvailable, isSelected, onPress }: TimeSlotChipProps) {
  const theme = useTheme();

  const handlePress = () => {
    if (!isAvailable) return;
    if (Platform.OS !== 'web') {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
    onPress?.();
  };

  const getBg = () => {
    if (isSelected) return theme.colors.primary;
    if (!isAvailable) return theme.colors.gray[100];
    return theme.colors.surfaceAlt;
  };

  const getTextColor = () => {
    if (isSelected) return theme.colors.textOnPrimary;
    if (!isAvailable) return theme.colors.textTertiary;
    return theme.colors.textMain;
  };

  return (
    <Pressable
      onPress={handlePress}
      disabled={!isAvailable}
      style={[
        styles.chip,
        {
          backgroundColor: getBg(),
          borderRadius: theme.borderRadius.lg,
          borderColor: isSelected ? theme.colors.primary : theme.colors.border,
        },
      ]}
      accessibilityLabel={`${time}${isSelected ? ' 선택됨' : ''}${!isAvailable ? ' 불가' : ''}`}
      accessibilityRole="button"
      accessibilityState={{ selected: isSelected, disabled: !isAvailable }}
    >
      {isSelected && <Check size={14} color={theme.colors.textOnPrimary} />}
      <Text
        style={{
          fontFamily: theme.fontFamily.medium,
          fontSize: theme.fontSize.sm,
          color: getTextColor(),
          marginLeft: isSelected ? 4 : 0,
        }}
      >
        {time}
      </Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderWidth: 1,
  },
});
