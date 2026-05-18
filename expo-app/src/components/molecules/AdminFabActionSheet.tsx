/**
 * 어드민 FAB 하단 액션 시트 — UnifiedModal 패턴
 *
 * @author MindGarden
 * @since 2026-05-18
 */
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { useTheme } from '@/theme';
import { ADMIN_MIN_TOUCH_TARGET } from '@/theme/tokens';
import { UnifiedModal } from '@/components/common/modals/UnifiedModal';

export type AdminFabActionSheetItem = {
  readonly label: string;
  readonly onPress: () => void;
};

export type AdminFabActionSheetProps = {
  readonly isOpen: boolean;
  readonly onClose: () => void;
  readonly title: string;
  readonly actions: readonly AdminFabActionSheetItem[];
  readonly cancelLabel: string;
};

export function AdminFabActionSheet({
  isOpen,
  onClose,
  title,
  actions,
  cancelLabel,
}: AdminFabActionSheetProps) {
  const theme = useTheme();

  return (
    <UnifiedModal
      isOpen={isOpen}
      onClose={onClose}
      title={title}
      actions={[
        {
          label: cancelLabel,
          onPress: onClose,
          variant: 'secondary',
        },
      ]}
    >
      <View
        style={[
          styles.handle,
          { backgroundColor: theme.colors.border, marginBottom: theme.spacing.md },
        ]}
      />
      <View style={{ gap: theme.spacing.sm }}>
        {actions.map((action) => (
          <Pressable
            key={action.label}
            onPress={action.onPress}
            style={({ pressed }) => [
              styles.sheetRow,
              {
                borderColor: theme.colors.border,
                backgroundColor: theme.colors.surface,
                opacity: pressed ? 0.9 : 1,
              },
            ]}
            accessibilityRole="button"
            accessibilityLabel={action.label}
          >
            <Text
              style={{
                color: theme.colors.textMain,
                fontFamily: theme.fontFamily.medium,
                fontSize: theme.fontSize.base,
              }}
            >
              {action.label}
            </Text>
          </Pressable>
        ))}
      </View>
    </UnifiedModal>
  );
}

const styles = StyleSheet.create({
  handle: {
    alignSelf: 'center',
    width: 40,
    height: 4,
    borderRadius: 2,
  },
  sheetRow: {
    borderWidth: 1,
    borderRadius: 12,
    paddingHorizontal: 14,
    minHeight: ADMIN_MIN_TOUCH_TARGET,
    justifyContent: 'center',
  },
});
