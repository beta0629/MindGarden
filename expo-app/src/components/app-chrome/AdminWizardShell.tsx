/**
 * 어드민 위저드 폼 껍데기 — 스텝 진행률·하단 이전/다음
 *
 * @author MindGarden
 * @since 2026-05-18
 */
import { ActivityIndicator, Pressable, StyleSheet, Text, View } from 'react-native';
import { useTheme } from '@/theme';
import { ADMIN_MIN_TOUCH_TARGET } from '@/theme/tokens';

export type AdminWizardShellLeftAction = {
  readonly label: string;
  readonly onPress: () => void;
  readonly variant?: 'secondary' | 'cancel';
};

export type AdminWizardShellRightAction = {
  readonly label: string;
  readonly onPress: () => void;
  readonly loading?: boolean;
  readonly disabled?: boolean;
};

export type AdminWizardShellProps = {
  readonly currentStep: number;
  readonly totalSteps: number;
  readonly stepOfText: string;
  readonly stepTitle: string;
  readonly children: React.ReactNode;
  readonly footerVisible?: boolean;
  readonly leftAction?: AdminWizardShellLeftAction;
  readonly rightAction?: AdminWizardShellRightAction;
};

export function AdminWizardShell({
  currentStep,
  totalSteps,
  stepOfText,
  stepTitle,
  children,
  footerVisible = true,
  leftAction,
  rightAction,
}: AdminWizardShellProps) {
  const theme = useTheme();
  const progressRatio = totalSteps > 0 ? currentStep / totalSteps : 0;

  return (
    <View style={styles.root}>
      <Text
        style={{
          paddingHorizontal: theme.spacing.lg,
          paddingTop: theme.spacing.sm,
          color: theme.colors.textSecondary,
          fontFamily: theme.fontFamily.medium,
          fontSize: theme.fontSize.sm,
        }}
      >
        {stepOfText} · {stepTitle}
      </Text>
      <View
        style={[
          styles.progressTrack,
          {
            marginHorizontal: theme.spacing.lg,
            marginTop: theme.spacing.sm,
            backgroundColor: theme.colors.divider,
          },
        ]}
      >
        <View
          style={{
            width: `${progressRatio * 100}%`,
            height: 4,
            backgroundColor: theme.colors.primary,
            borderRadius: theme.borderRadius.sm,
          }}
        />
      </View>

      <View style={styles.body}>{children}</View>

      {footerVisible && rightAction != null ? (
        <View
          style={[
            styles.footer,
            {
              borderTopColor: theme.colors.divider,
              backgroundColor: theme.colors.bgMain,
              paddingHorizontal: theme.spacing.lg,
            },
          ]}
        >
          {leftAction != null ? (
            <Pressable
              onPress={leftAction.onPress}
              style={({ pressed }) => [
                styles.footerBtn,
                leftAction.variant === 'cancel'
                  ? styles.footerBtnGhost
                  : { borderColor: theme.colors.divider, borderWidth: 1 },
                { opacity: pressed ? 0.85 : 1 },
              ]}
              accessibilityRole="button"
              accessibilityLabel={leftAction.label}
            >
              <Text
                style={{
                  color:
                    leftAction.variant === 'cancel'
                      ? theme.colors.textSecondary
                      : theme.colors.textMain,
                  fontFamily: theme.fontFamily.medium,
                }}
              >
                {leftAction.label}
              </Text>
            </Pressable>
          ) : (
            <View style={styles.footerBtn} />
          )}
          <Pressable
            onPress={rightAction.onPress}
            disabled={rightAction.disabled || rightAction.loading}
            style={({ pressed }) => [
              styles.footerBtn,
              {
                backgroundColor: theme.colors.primary,
                opacity:
                  rightAction.disabled || rightAction.loading
                    ? 0.7
                    : pressed
                      ? 0.85
                      : 1,
              },
            ]}
            accessibilityRole="button"
            accessibilityLabel={rightAction.label}
          >
            {rightAction.loading ? (
              <ActivityIndicator color={theme.colors.textOnPrimary} />
            ) : (
              <Text
                style={{
                  color: theme.colors.textOnPrimary,
                  fontFamily: theme.fontFamily.semibold,
                }}
              >
                {rightAction.label}
              </Text>
            )}
          </Pressable>
        </View>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
  },
  progressTrack: {
    height: 4,
    borderRadius: 4,
    overflow: 'hidden',
  },
  body: {
    flex: 1,
  },
  footer: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    flexDirection: 'row',
    gap: 12,
    paddingVertical: 12,
    borderTopWidth: 1,
  },
  footerBtn: {
    flex: 1,
    minHeight: ADMIN_MIN_TOUCH_TARGET,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    borderColor: 'transparent',
  },
  footerBtnGhost: {
    borderWidth: 0,
  },
});
