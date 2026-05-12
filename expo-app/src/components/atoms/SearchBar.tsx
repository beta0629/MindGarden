/**
 * SearchBar — 검색 입력 atom
 *
 * @author MindGarden
 * @since 2026-05-12
 */
import { StyleSheet, TextInput, View, Pressable, type ViewStyle } from 'react-native';
import { Search, X } from 'lucide-react-native';
import { useTheme } from '@/theme';

interface SearchBarProps {
  value: string;
  onChangeText: (text: string) => void;
  placeholder?: string;
  style?: ViewStyle;
}

export function SearchBar({
  value,
  onChangeText,
  placeholder = '검색',
  style,
}: SearchBarProps) {
  const theme = useTheme();

  return (
    <View
      style={[
        styles.container,
        {
          backgroundColor: theme.colors.gray[100],
          borderRadius: theme.borderRadius.lg,
        },
        style,
      ]}
    >
      <Search size={18} color={theme.colors.textTertiary} />
      <TextInput
        value={value}
        onChangeText={onChangeText}
        placeholder={placeholder}
        placeholderTextColor={theme.colors.textTertiary}
        style={[
          styles.input,
          {
            color: theme.colors.textMain,
            fontFamily: theme.fontFamily.regular,
            fontSize: theme.fontSize.sm,
          },
        ]}
        returnKeyType="search"
        autoCorrect={false}
        accessibilityLabel={placeholder}
      />
      {value.length > 0 ? (
        <Pressable
          onPress={() => onChangeText('')}
          hitSlop={8}
          accessibilityLabel="검색어 지우기"
          accessibilityRole="button"
        >
          <X size={16} color={theme.colors.textTertiary} />
        </Pressable>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    height: 44,
    gap: 8,
  },
  input: {
    flex: 1,
    padding: 0,
  },
});
