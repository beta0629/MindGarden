/**
 * EmptyState — 데이터 없음 표시 atom
 *
 * @author MindGarden
 * @since 2026-05-12
 */
import { Pressable, StyleSheet, Text, View, type ViewStyle } from 'react-native';
import { Platform } from 'react-native';
import * as Haptics from 'expo-haptics';
import { Inbox } from 'lucide-react-native';
import { useTheme } from '@/theme';

interface EmptyStateProps {
  icon?: React.ReactNode;
  title: string;
  description?: string;
  actionLabel?: string;
  onAction?: () => void;
  style?: ViewStyle;
}

export function EmptyState({
  icon,
  title,
  description,
  actionLabel,
  onAction,
  style,
}: EmptyStateProps) {
  const theme = useTheme();

  const handleAction = () => {
    if (Platform.OS !== 'web') {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
    onAction?.();
  };

  return (
    <View
      style={[styles.container, style]}
      accessibilityRole="text"
      accessibilityLabel={`${title}${description ? `. ${description}` : ''}`}
    >
      <View style={[styles.iconCircle, { backgroundColor: theme.colors.accentSoft }]}>
        {icon ?? <Inbox size={32} color={theme.colors.textTertiary} />}
      </View>
      <Text
        style={[
          styles.title,
          {
            color: theme.colors.textMain,
            fontFamily: theme.fontFamily.semibold,
            fontSize: theme.fontSize.base,
          },
        ]}
      >
        {title}
      </Text>
      {description ? (
        <Text
          style={[
            styles.description,
            {
              color: theme.colors.textSecondary,
              fontFamily: theme.fontFamily.regular,
              fontSize: theme.fontSize.sm,
            },
          ]}
        >
          {description}
        </Text>
      ) : null}
      {actionLabel && onAction ? (
        <Pressable
          onPress={handleAction}
          style={[styles.actionButton, { backgroundColor: theme.colors.primary }]}
          accessibilityLabel={actionLabel}
          accessibilityRole="button"
        >
          <Text
            style={[
              styles.actionText,
              {
                color: theme.colors.textOnPrimary,
                fontFamily: theme.fontFamily.semibold,
                fontSize: theme.fontSize.sm,
              },
            ]}
          >
            {actionLabel}
          </Text>
        </Pressable>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 48,
    paddingHorizontal: 24,
  },
  iconCircle: {
    width: 72,
    height: 72,
    borderRadius: 36,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  title: {
    textAlign: 'center',
    marginBottom: 4,
  },
  description: {
    textAlign: 'center',
    marginBottom: 20,
  },
  actionButton: {
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 12,
  },
  actionText: {
    textAlign: 'center',
  },
});
