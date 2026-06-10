/**
 * UnifiedModal — Expo 앱 공통 확인·폼 모달 (웹 UnifiedModal API 정합)
 *
 * @author MindGarden
 * @since 2026-05-16
 */
import {
  ActivityIndicator,
  Modal,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  View,
  type ViewStyle,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import * as Haptics from 'expo-haptics';
import { X } from 'lucide-react-native';
import { useTheme } from '@/theme';
import { LETTERBOX_CONTENT_MAX_WIDTH } from '@/theme/letterbox';

export type UnifiedModalAction = {
  readonly label: string;
  readonly onPress: () => void;
  readonly variant?: 'primary' | 'secondary' | 'danger';
  readonly disabled?: boolean;
};

export type UnifiedModalProps = {
  readonly isOpen: boolean;
  readonly onClose: () => void;
  readonly title: string;
  readonly subtitle?: string;
  readonly children?: React.ReactNode;
  readonly actions?: UnifiedModalAction[] | null;
  readonly loading?: boolean;
  readonly backdropClick?: boolean;
  readonly showCloseButton?: boolean;
  readonly contentStyle?: ViewStyle;
};

export function UnifiedModal({
  isOpen,
  onClose,
  title,
  subtitle,
  children,
  actions,
  loading = false,
  backdropClick = true,
  showCloseButton = true,
  contentStyle,
}: UnifiedModalProps) {
  const theme = useTheme();

  const handleBackdrop = () => {
    if (!backdropClick || loading) {
      return;
    }
    onClose();
  };

  const handleClose = () => {
    if (loading) {
      return;
    }
    if (Platform.OS !== 'web') {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
    onClose();
  };

  const resolveActionColors = (variant: UnifiedModalAction['variant']) => {
    if (variant === 'danger') {
      return { bg: theme.colors.error, text: theme.colors.textOnPrimary };
    }
    if (variant === 'secondary') {
      return { bg: theme.colors.gray[100], text: theme.colors.textMain };
    }
    return { bg: theme.colors.primary, text: theme.colors.textOnPrimary };
  };

  return (
    <Modal visible={isOpen} animationType="fade" transparent onRequestClose={handleClose}>
      <Pressable
        style={[styles.backdrop, { backgroundColor: theme.colors.modalBackdrop }]}
        onPress={handleBackdrop}
        accessibilityLabel="모달 닫기"
      >
        <Pressable
          style={[
            styles.card,
            {
              backgroundColor: theme.colors.surface,
              borderRadius: theme.borderRadius.xl,
            },
          ]}
          onPress={() => {
            /* 카드 내부 탭은 닫기 차단 */
          }}
        >
          <SafeAreaView edges={['bottom']}>
            <View style={styles.header}>
              <View style={styles.headerText}>
                <Text
                  style={{
                    fontFamily: theme.fontFamily.semibold,
                    fontSize: theme.fontSize.lg,
                    color: theme.colors.textMain,
                  }}
                  accessibilityRole="header"
                >
                  {title}
                </Text>
                {subtitle ? (
                  <Text
                    style={{
                      marginTop: theme.spacing.xs,
                      fontFamily: theme.fontFamily.regular,
                      fontSize: theme.fontSize.sm,
                      color: theme.colors.textSecondary,
                    }}
                  >
                    {subtitle}
                  </Text>
                ) : null}
              </View>
              {showCloseButton ? (
                <Pressable
                  onPress={handleClose}
                  disabled={loading}
                  accessibilityLabel="닫기"
                  accessibilityRole="button"
                  hitSlop={8}
                >
                  <X size={22} color={theme.colors.textSecondary} />
                </Pressable>
              ) : null}
            </View>

            {children ? <View style={[styles.body, contentStyle]}>{children}</View> : null}

            {actions && actions.length > 0 ? (
              <View style={styles.actions}>
                {actions.map((action) => {
                  const colors = resolveActionColors(action.variant);
                  const disabled = Boolean(action.disabled) || loading;
                  return (
                    <Pressable
                      key={action.label}
                      onPress={() => {
                        if (disabled) {
                          return;
                        }
                        if (Platform.OS !== 'web') {
                          Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                        }
                        action.onPress();
                      }}
                      disabled={disabled}
                      style={[
                        styles.actionBtn,
                        { backgroundColor: colors.bg, opacity: disabled ? 0.5 : 1 },
                      ]}
                      accessibilityRole="button"
                      accessibilityLabel={action.label}
                    >
                      <Text
                        style={{
                          fontFamily: theme.fontFamily.semibold,
                          fontSize: theme.fontSize.sm,
                          color: colors.text,
                        }}
                      >
                        {action.label}
                      </Text>
                    </Pressable>
                  );
                })}
              </View>
            ) : null}

            {loading ? (
              <View
                style={[
                  styles.loadingOverlay,
                  { backgroundColor: theme.colors.modalLoadingOverlay },
                ]}
              >
                <ActivityIndicator color={theme.colors.primary} />
              </View>
            ) : null}
          </SafeAreaView>
        </Pressable>
      </Pressable>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    justifyContent: 'center',
    paddingHorizontal: 24,
  },
  card: {
    overflow: 'hidden',
    maxHeight: '85%',
    /**
     * iPad letterbox 대응 — Modal 백드롭이 풀스크린이라 카드가 풀폭으로 늘어나는 것을 방지.
     * 임계 너비(744pt) 이상에서도 콘텐츠 컬럼과 동일한 max 폭으로 카드를 가운데에 안착시킨다.
     * iPhone 에서는 paddingHorizontal:24 (backdrop) 가 우선되어 maxWidth 제약이 영향 없음.
     * SSOT: P3-D 디자인 스펙 §4 #15 (UnifiedModal 카드 maxWidth).
     */
    maxWidth: LETTERBOX_CONTENT_MAX_WIDTH,
    width: '100%',
    alignSelf: 'center',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 8,
    gap: 12,
  },
  headerText: {
    flex: 1,
  },
  body: {
    paddingHorizontal: 20,
    paddingBottom: 12,
  },
  actions: {
    flexDirection: 'row',
    gap: 10,
    paddingHorizontal: 20,
    paddingBottom: 20,
    paddingTop: 8,
  },
  actionBtn: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    borderRadius: 12,
  },
  loadingOverlay: {
    ...StyleSheet.absoluteFillObject,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
