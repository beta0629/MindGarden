/**
 * 검색 바 (Molecule)
 * 아이콘 + TextInput + 필터 버튼
 *
 * @author MindGarden
 * @since 2026-05-12
 */
import { View, TextInput, Pressable, StyleSheet, Platform } from 'react-native';
import * as Haptics from 'expo-haptics';
import { Search, SlidersHorizontal } from 'lucide-react-native';
import { useTheme } from '@/theme';

interface SearchBarProps {
  readonly value: string;
  readonly onChangeText: (text: string) => void;
  readonly placeholder?: string;
  readonly onFilterPress?: () => void;
  readonly showFilter?: boolean;
}

const ICON_SIZE = 20;

export function SearchBar({
  value,
  onChangeText,
  placeholder = '검색',
  onFilterPress,
  showFilter = false,
}: SearchBarProps) {
  const theme = useTheme();

  const handleFilterPress = () => {
    if (Platform.OS !== 'web') {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
    onFilterPress?.();
  };

  return (
    <View
      style={[
        styles.container,
        {
          backgroundColor: theme.colors.surface,
          borderRadius: theme.borderRadius.lg,
          borderColor: theme.colors.border,
          paddingHorizontal: theme.spacing.md,
        },
      ]}
    >
      <Search size={ICON_SIZE} color={theme.colors.gray[400]} />
      <TextInput
        style={[
          styles.input,
          {
            color: theme.colors.textMain,
            fontFamily: theme.fontFamily.regular,
            fontSize: theme.fontSize.sm,
            marginHorizontal: theme.spacing.sm,
          },
        ]}
        value={value}
        onChangeText={onChangeText}
        placeholder={placeholder}
        placeholderTextColor={theme.colors.gray[400]}
        returnKeyType="search"
        autoCorrect={false}
        accessibilityLabel={placeholder}
      />
      {showFilter && onFilterPress ? (
        <Pressable
          onPress={handleFilterPress}
          hitSlop={8}
          accessibilityRole="button"
          accessibilityLabel="필터"
        >
          <SlidersHorizontal
            size={ICON_SIZE}
            color={theme.colors.textSecondary}
          />
        </Pressable>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    height: 44,
  },
  input: {
    flex: 1,
    height: '100%',
    padding: 0,
  },
});
