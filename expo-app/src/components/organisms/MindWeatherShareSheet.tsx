/**
 * MindWeatherShareSheet — Phase 4-A 상담사 공유 옵트인 바텀 시트.
 *
 * 디자이너 §3.2 `ShareProposalBottomSheet` 기준 — 키보드 의존 없는 간단 토글 + 가이드.
 * `@gorhom/bottom-sheet` 미연결 환경에서도 동작하도록 React Native `Modal` 기반.
 *
 * @author MindGarden
 * @since 2026-05-13
 */
import { useEffect, useState } from 'react';
import {
  Modal,
  Platform,
  Pressable,
  StyleSheet,
  Switch,
  Text,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import * as Haptics from 'expo-haptics';
import { ShieldCheck, X } from 'lucide-react-native';
import { useTheme } from '@/theme';
import { MIND_WEATHER_SHARE_COPY_KO } from '@/constants/wellnessComplianceCopy';

interface MindWeatherShareSheetProps {
  readonly visible: boolean;
  readonly onClose: () => void;
  readonly onSubmit: (consent: { summary: boolean; original: boolean }) => void;
  readonly initial?: { summary: boolean; original: boolean };
  readonly busy?: boolean;
}

export function MindWeatherShareSheet({
  visible,
  onClose,
  onSubmit,
  initial,
  busy = false,
}: MindWeatherShareSheetProps) {
  const theme = useTheme();
  const [summary, setSummary] = useState<boolean>(initial?.summary ?? true);
  const [original, setOriginal] = useState<boolean>(initial?.original ?? false);

  useEffect(() => {
    if (visible) {
      setSummary(initial?.summary ?? true);
      setOriginal(initial?.original ?? false);
    }
  }, [visible, initial?.summary, initial?.original]);

  const handleHaptic = () => {
    if (Platform.OS !== 'web') {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
  };

  const handleSubmit = () => {
    handleHaptic();
    onSubmit({ summary, original: summary ? original : false });
  };

  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent
      onRequestClose={onClose}
    >
      <Pressable
        style={[styles.backdrop, { backgroundColor: theme.colors.modalBackdrop }]}
        onPress={onClose}
        accessibilityLabel="닫기"
      >
        <Pressable
          style={[
            styles.sheet,
            {
              backgroundColor: theme.colors.surface,
              borderTopLeftRadius: theme.borderRadius['2xl'],
              borderTopRightRadius: theme.borderRadius['2xl'],
            },
          ]}
          onPress={() => {
            /* 시트 내부 탭은 닫기 차단 */
          }}
        >
          <SafeAreaView edges={['bottom']}>
            <View style={styles.handleRow}>
              <View
                style={[
                  styles.handle,
                  { backgroundColor: theme.colors.gray[300] },
                ]}
              />
            </View>

            <View style={styles.header}>
              <View style={styles.headerLeft}>
                <View
                  style={[
                    styles.headerIcon,
                    { backgroundColor: theme.colors.primaryLight + '40' },
                  ]}
                >
                  <ShieldCheck size={18} color={theme.colors.primary} />
                </View>
                <Text
                  style={{
                    fontFamily: theme.fontFamily.semibold,
                    fontSize: theme.fontSize.base,
                    color: theme.colors.textMain,
                    flex: 1,
                  }}
                  numberOfLines={2}
                >
                  {MIND_WEATHER_SHARE_COPY_KO.modalTitle}
                </Text>
              </View>
              <Pressable
                onPress={onClose}
                hitSlop={12}
                accessibilityLabel="닫기"
                accessibilityRole="button"
              >
                <X size={20} color={theme.colors.textSecondary} />
              </Pressable>
            </View>

            <Text
              style={{
                fontFamily: theme.fontFamily.regular,
                fontSize: theme.fontSize.sm,
                color: theme.colors.textSecondary,
                lineHeight: 20,
                marginTop: 8,
              }}
            >
              {MIND_WEATHER_SHARE_COPY_KO.description}
            </Text>

            <View
              style={[
                styles.toggleCard,
                {
                  backgroundColor: theme.colors.bgMain,
                  borderRadius: theme.borderRadius.lg,
                  borderColor: theme.colors.gray[200],
                },
              ]}
            >
              <View style={styles.toggleRow}>
                <View style={styles.toggleText}>
                  <Text
                    style={{
                      fontFamily: theme.fontFamily.semibold,
                      fontSize: theme.fontSize.sm,
                      color: theme.colors.textMain,
                    }}
                  >
                    {MIND_WEATHER_SHARE_COPY_KO.summaryConsentLabel}
                  </Text>
                  <Text
                    style={{
                      fontFamily: theme.fontFamily.regular,
                      fontSize: theme.fontSize.xs,
                      color: theme.colors.textSecondary,
                      marginTop: 2,
                    }}
                  >
                    {MIND_WEATHER_SHARE_COPY_KO.summaryConsentHelper}
                  </Text>
                </View>
                <Switch
                  value={summary}
                  onValueChange={(next) => {
                    handleHaptic();
                    setSummary(next);
                    if (!next) setOriginal(false);
                  }}
                  trackColor={{
                    false: theme.colors.gray[300],
                    true: theme.colors.primaryLight,
                  }}
                  thumbColor={summary ? theme.colors.primary : theme.colors.surface}
                  accessibilityLabel="요약·키워드 공유 토글"
                />
              </View>
              <View style={[styles.divider, { backgroundColor: theme.colors.gray[200] }]} />
              <View style={styles.toggleRow}>
                <View style={styles.toggleText}>
                  <Text
                    style={{
                      fontFamily: theme.fontFamily.semibold,
                      fontSize: theme.fontSize.sm,
                      color: summary ? theme.colors.textMain : theme.colors.textTertiary,
                    }}
                  >
                    {MIND_WEATHER_SHARE_COPY_KO.originalConsentLabel}
                  </Text>
                  <Text
                    style={{
                      fontFamily: theme.fontFamily.regular,
                      fontSize: theme.fontSize.xs,
                      color: theme.colors.textSecondary,
                      marginTop: 2,
                    }}
                  >
                    {MIND_WEATHER_SHARE_COPY_KO.originalConsentHelper}
                  </Text>
                </View>
                <Switch
                  value={original}
                  onValueChange={(next) => {
                    handleHaptic();
                    setOriginal(next);
                  }}
                  disabled={!summary}
                  trackColor={{
                    false: theme.colors.gray[300],
                    true: theme.colors.primaryLight,
                  }}
                  thumbColor={original ? theme.colors.primary : theme.colors.surface}
                  accessibilityLabel="원문 공유 토글"
                />
              </View>
            </View>

            <View style={styles.actions}>
              <Pressable
                onPress={() => {
                  handleHaptic();
                  onClose();
                }}
                disabled={busy}
                style={({ pressed }) => [
                  styles.cancelButton,
                  {
                    backgroundColor: theme.colors.bgMain,
                    borderColor: theme.colors.border,
                    borderRadius: theme.borderRadius.lg,
                    opacity: busy ? 0.5 : pressed ? 0.7 : 1,
                  },
                ]}
                accessibilityLabel={MIND_WEATHER_SHARE_COPY_KO.ctaCancel}
                accessibilityRole="button"
              >
                <Text
                  style={{
                    fontFamily: theme.fontFamily.semibold,
                    fontSize: theme.fontSize.sm,
                    color: theme.colors.textSecondary,
                  }}
                >
                  {MIND_WEATHER_SHARE_COPY_KO.ctaCancel}
                </Text>
              </Pressable>
              <Pressable
                onPress={handleSubmit}
                disabled={busy || !summary}
                style={({ pressed }) => [
                  styles.confirmButton,
                  {
                    backgroundColor: theme.colors.primary,
                    borderRadius: theme.borderRadius.lg,
                    opacity: busy || !summary ? 0.5 : pressed ? 0.85 : 1,
                  },
                ]}
                accessibilityLabel={MIND_WEATHER_SHARE_COPY_KO.ctaShare}
                accessibilityRole="button"
              >
                <Text
                  style={{
                    fontFamily: theme.fontFamily.semibold,
                    fontSize: theme.fontSize.sm,
                    color: theme.colors.textOnPrimary,
                  }}
                >
                  {busy ? '저장 중...' : MIND_WEATHER_SHARE_COPY_KO.ctaShare}
                </Text>
              </Pressable>
            </View>
          </SafeAreaView>
        </Pressable>
      </Pressable>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    justifyContent: 'flex-end',
  },
  sheet: {
    paddingHorizontal: 20,
    paddingTop: 8,
    paddingBottom: 16,
  },
  handleRow: {
    alignItems: 'center',
    paddingBottom: 12,
  },
  handle: {
    width: 36,
    height: 4,
    borderRadius: 2,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    marginRight: 12,
  },
  headerIcon: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 10,
  },
  toggleCard: {
    marginTop: 16,
    paddingVertical: 8,
    borderWidth: 1,
  },
  toggleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 12,
    paddingHorizontal: 14,
  },
  toggleText: {
    flex: 1,
    marginRight: 12,
  },
  divider: {
    height: 1,
    marginHorizontal: 14,
  },
  actions: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 20,
  },
  cancelButton: {
    flex: 1,
    paddingVertical: 14,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
  },
  confirmButton: {
    flex: 1,
    paddingVertical: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
