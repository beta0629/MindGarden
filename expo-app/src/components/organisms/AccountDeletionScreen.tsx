/**
 * 회원 탈퇴(계정 삭제) — App Store 5.1.1(v) 인앱 삭제 흐름.
 * 30일 WITHDRAWAL_PENDING → ANONYMIZED. UnifiedModal 최종 확인.
 *
 * @author MindGarden
 * @since 2026-10-28
 */
import { useCallback, useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Pressable,
  ScrollView,
  StyleSheet,
  Switch,
  Text,
  TextInput,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { ChevronLeft } from 'lucide-react-native';
import { UnifiedModal } from '@/components/common/modals/UnifiedModal';
import { TabletContentShell } from '@/components/layout/TabletContentShell';
import { ACCOUNT_DELETION_COPY } from '@/constants/accountDeletionCopy';
import { performSignOut } from '@/services/auth/performSignOut';
import {
  WITHDRAWAL_SOCIAL_CONFIRM_PHRASE,
  cancelWithdrawal,
  getWithdrawalStatus,
  requestWithdrawal,
  type WithdrawalStatusResult,
} from '@/services/withdrawalApi';
import { useAuthStore } from '@/stores/useAuthStore';
import { useTheme } from '@/theme';
import { toDisplayString } from '@/utils/safeDisplay';

function resolveApiErrorMessage(err: unknown): string {
  if (err && typeof err === 'object' && 'message' in err) {
    const m = (err as { message?: unknown }).message;
    if (typeof m === 'string' && m.trim() !== '') {
      return m;
    }
  }
  return ACCOUNT_DELETION_COPY.ERROR_GENERIC;
}

export function AccountDeletionScreen() {
  const theme = useTheme();
  const router = useRouter();
  const user = useAuthStore((s) => s.user);

  const [status, setStatus] = useState<WithdrawalStatusResult | null>(null);
  const [loadingStatus, setLoadingStatus] = useState(true);
  const [password, setPassword] = useState('');
  const [confirmPhrase, setConfirmPhrase] = useState('');
  const [reason, setReason] = useState('');
  const [agreed, setAgreed] = useState(false);
  const [submitError, setSubmitError] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [cancelConfirmOpen, setCancelConfirmOpen] = useState(false);

  const loadStatus = useCallback(async () => {
    setLoadingStatus(true);
    try {
      const next = await getWithdrawalStatus();
      setStatus(next);
    } catch {
      setStatus(null);
    } finally {
      setLoadingStatus(false);
    }
  }, []);

  useEffect(() => {
    void loadStatus();
  }, [loadStatus]);

  const isPending = status?.lifecycleState === 'WITHDRAWAL_PENDING' && status?.cancellable === true;

  const finishAndLogout = useCallback(async () => {
    await performSignOut();
    router.replace('/(auth)/login');
  }, [router]);

  const handleSubmitPress = () => {
    setSubmitError('');
    const hasPassword = password.trim().length > 0;
    const hasPhrase = confirmPhrase.trim().length > 0;
    if (!hasPassword && !hasPhrase) {
      setSubmitError(ACCOUNT_DELETION_COPY.VALIDATION_IDENTITY);
      return;
    }
    if (!agreed) {
      setSubmitError(ACCOUNT_DELETION_COPY.VALIDATION_AGREE);
      return;
    }
    setConfirmOpen(true);
  };

  const handleConfirmSubmit = async () => {
    setSubmitting(true);
    setSubmitError('');
    try {
      const trimmedPassword = password.trim();
      const trimmedPhrase = confirmPhrase.trim();
      await requestWithdrawal({
        password: trimmedPassword.length > 0 ? trimmedPassword : null,
        confirmPhrase:
          trimmedPassword.length === 0 && trimmedPhrase.length > 0 ? trimmedPhrase : null,
        reason: reason.trim() || null,
        deleteCommunityBody: false,
      });
      setConfirmOpen(false);
      await finishAndLogout();
    } catch (err) {
      setSubmitError(resolveApiErrorMessage(err));
      setConfirmOpen(false);
    } finally {
      setSubmitting(false);
    }
  };

  const handleCancelPending = async () => {
    setSubmitting(true);
    setSubmitError('');
    try {
      await cancelWithdrawal();
      setCancelConfirmOpen(false);
      await loadStatus();
    } catch (err) {
      setSubmitError(resolveApiErrorMessage(err));
      setCancelConfirmOpen(false);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <SafeAreaView
      style={[styles.safe, { backgroundColor: theme.colors.bgMain }]}
      edges={['top', 'bottom']}
    >
      <View style={[styles.header, { borderBottomColor: theme.colors.divider }]}>
        <Pressable
          onPress={() => router.back()}
          hitSlop={8}
          accessibilityLabel="뒤로 가기"
          accessibilityRole="button"
        >
          <ChevronLeft size={24} color={theme.colors.textMain} />
        </Pressable>
        <Text
          style={{
            color: theme.colors.textMain,
            fontFamily: theme.fontFamily.semibold,
            fontSize: theme.fontSize.lg,
          }}
        >
          {ACCOUNT_DELETION_COPY.TITLE}
        </Text>
        <View style={styles.headerSpacer} />
      </View>

      <TabletContentShell>
        <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
          {loadingStatus ? (
            <ActivityIndicator color={theme.colors.primary} />
          ) : isPending ? (
            <View
              style={[
                styles.card,
                {
                  backgroundColor: theme.colors.surface,
                  borderRadius: theme.borderRadius.lg,
                },
              ]}
            >
              <Text
                style={{
                  color: theme.colors.textMain,
                  fontFamily: theme.fontFamily.semibold,
                  fontSize: theme.fontSize.base,
                }}
              >
                {ACCOUNT_DELETION_COPY.PENDING_TITLE}
              </Text>
              <Text
                style={{
                  marginTop: 8,
                  color: theme.colors.textSecondary,
                  fontFamily: theme.fontFamily.regular,
                  fontSize: theme.fontSize.sm,
                  lineHeight: 20,
                }}
              >
                신청 시각: {toDisplayString(status?.withdrawalRequestedAt, '—')}
                {'\n'}
                익명화 예정: {toDisplayString(status?.withdrawalExpiresAt, '—')}
              </Text>
              {submitError ? (
                <Text
                  style={{
                    marginTop: 12,
                    color: theme.colors.error,
                    fontFamily: theme.fontFamily.regular,
                    fontSize: theme.fontSize.sm,
                  }}
                >
                  {submitError}
                </Text>
              ) : null}
              <Pressable
                testID="account-deletion-cancel-pending"
                onPress={() => setCancelConfirmOpen(true)}
                disabled={submitting}
                style={({ pressed }) => [
                  styles.primaryBtn,
                  {
                    marginTop: 16,
                    backgroundColor: theme.colors.primary,
                    opacity: pressed || submitting ? 0.7 : 1,
                    borderRadius: theme.borderRadius.md,
                  },
                ]}
                accessibilityRole="button"
                accessibilityLabel={ACCOUNT_DELETION_COPY.PENDING_CANCEL}
              >
                <Text
                  style={{
                    color: theme.colors.textOnPrimary,
                    fontFamily: theme.fontFamily.semibold,
                    fontSize: theme.fontSize.base,
                    textAlign: 'center',
                  }}
                >
                  {ACCOUNT_DELETION_COPY.PENDING_CANCEL}
                </Text>
              </Pressable>
            </View>
          ) : (
            <>
              <View
                style={[
                  styles.card,
                  {
                    backgroundColor: theme.colors.surface,
                    borderRadius: theme.borderRadius.lg,
                  },
                ]}
              >
                <Text
                  style={{
                    color: theme.colors.textMain,
                    fontFamily: theme.fontFamily.regular,
                    fontSize: theme.fontSize.sm,
                    lineHeight: 22,
                  }}
                >
                  {ACCOUNT_DELETION_COPY.INTRO}
                </Text>
                <Text
                  style={{
                    marginTop: 10,
                    color: theme.colors.textSecondary,
                    fontFamily: theme.fontFamily.regular,
                    fontSize: theme.fontSize.xs,
                    lineHeight: 18,
                  }}
                >
                  {ACCOUNT_DELETION_COPY.GRACE_NOTE}
                </Text>
                {user?.email ? (
                  <Text
                    style={{
                      marginTop: 10,
                      color: theme.colors.textTertiary,
                      fontFamily: theme.fontFamily.regular,
                      fontSize: theme.fontSize.xs,
                    }}
                  >
                    계정: {toDisplayString(user.email)}
                  </Text>
                ) : null}
              </View>

              <Text
                style={[
                  styles.label,
                  {
                    color: theme.colors.textSecondary,
                    fontFamily: theme.fontFamily.medium,
                    fontSize: theme.fontSize.xs,
                  },
                ]}
              >
                {ACCOUNT_DELETION_COPY.REASON_LABEL}
              </Text>
              <TextInput
                value={reason}
                onChangeText={setReason}
                placeholder={ACCOUNT_DELETION_COPY.REASON_PLACEHOLDER}
                placeholderTextColor={theme.colors.textTertiary}
                style={[
                  styles.input,
                  {
                    backgroundColor: theme.colors.surface,
                    color: theme.colors.textMain,
                    borderColor: theme.colors.border,
                    borderRadius: theme.borderRadius.md,
                    fontFamily: theme.fontFamily.regular,
                    fontSize: theme.fontSize.base,
                  },
                ]}
              />

              <Text
                style={[
                  styles.label,
                  {
                    color: theme.colors.textSecondary,
                    fontFamily: theme.fontFamily.medium,
                    fontSize: theme.fontSize.xs,
                  },
                ]}
              >
                {ACCOUNT_DELETION_COPY.PASSWORD_LABEL}
              </Text>
              <Text
                style={{
                  marginBottom: 6,
                  color: theme.colors.textTertiary,
                  fontFamily: theme.fontFamily.regular,
                  fontSize: theme.fontSize.xs,
                }}
              >
                {ACCOUNT_DELETION_COPY.PASSWORD_HINT}
              </Text>
              <TextInput
                testID="account-deletion-password"
                value={password}
                onChangeText={setPassword}
                secureTextEntry
                autoCapitalize="none"
                autoCorrect={false}
                style={[
                  styles.input,
                  {
                    backgroundColor: theme.colors.surface,
                    color: theme.colors.textMain,
                    borderColor: theme.colors.border,
                    borderRadius: theme.borderRadius.md,
                    fontFamily: theme.fontFamily.regular,
                    fontSize: theme.fontSize.base,
                  },
                ]}
              />

              <Text
                style={[
                  styles.label,
                  {
                    color: theme.colors.textSecondary,
                    fontFamily: theme.fontFamily.medium,
                    fontSize: theme.fontSize.xs,
                  },
                ]}
              >
                {ACCOUNT_DELETION_COPY.CONFIRM_PHRASE_LABEL}
              </Text>
              <Text
                style={{
                  marginBottom: 6,
                  color: theme.colors.textTertiary,
                  fontFamily: theme.fontFamily.regular,
                  fontSize: theme.fontSize.xs,
                }}
              >
                {ACCOUNT_DELETION_COPY.CONFIRM_PHRASE_HINT}
              </Text>
              <TextInput
                testID="account-deletion-confirm-phrase"
                value={confirmPhrase}
                onChangeText={setConfirmPhrase}
                placeholder={ACCOUNT_DELETION_COPY.CONFIRM_PHRASE_PLACEHOLDER}
                placeholderTextColor={theme.colors.textTertiary}
                autoCapitalize="characters"
                autoCorrect={false}
                style={[
                  styles.input,
                  {
                    backgroundColor: theme.colors.surface,
                    color: theme.colors.textMain,
                    borderColor: theme.colors.border,
                    borderRadius: theme.borderRadius.md,
                    fontFamily: theme.fontFamily.regular,
                    fontSize: theme.fontSize.base,
                  },
                ]}
              />
              <Text
                style={{
                  marginBottom: 12,
                  color: theme.colors.textTertiary,
                  fontFamily: theme.fontFamily.regular,
                  fontSize: theme.fontSize.xs,
                }}
              >
                서버 확인 문구: {WITHDRAWAL_SOCIAL_CONFIRM_PHRASE}
              </Text>

              <View style={styles.agreeRow}>
                <Switch
                  testID="account-deletion-agree"
                  value={agreed}
                  onValueChange={setAgreed}
                  trackColor={{ false: theme.colors.border, true: theme.colors.primaryLight }}
                  thumbColor={agreed ? theme.colors.primary : theme.colors.surface}
                />
                <Text
                  style={{
                    flex: 1,
                    marginLeft: 12,
                    color: theme.colors.textMain,
                    fontFamily: theme.fontFamily.regular,
                    fontSize: theme.fontSize.sm,
                    lineHeight: 20,
                  }}
                >
                  {ACCOUNT_DELETION_COPY.AGREE_LABEL}
                </Text>
              </View>

              {submitError ? (
                <Text
                  style={{
                    marginTop: 8,
                    color: theme.colors.error,
                    fontFamily: theme.fontFamily.regular,
                    fontSize: theme.fontSize.sm,
                  }}
                >
                  {submitError}
                </Text>
              ) : null}

              <Pressable
                testID="account-deletion-submit"
                onPress={handleSubmitPress}
                disabled={submitting}
                style={({ pressed }) => [
                  styles.dangerBtn,
                  {
                    marginTop: 20,
                    backgroundColor: theme.colors.error,
                    opacity: pressed || submitting ? 0.7 : 1,
                    borderRadius: theme.borderRadius.md,
                  },
                ]}
                accessibilityRole="button"
                accessibilityLabel={ACCOUNT_DELETION_COPY.SUBMIT}
              >
                {submitting ? (
                  <ActivityIndicator color={theme.colors.textOnPrimary} />
                ) : (
                  <Text
                    style={{
                      color: theme.colors.textOnPrimary,
                      fontFamily: theme.fontFamily.semibold,
                      fontSize: theme.fontSize.base,
                      textAlign: 'center',
                    }}
                  >
                    {ACCOUNT_DELETION_COPY.SUBMIT}
                  </Text>
                )}
              </Pressable>
            </>
          )}
        </ScrollView>
      </TabletContentShell>

      <UnifiedModal
        isOpen={confirmOpen}
        onClose={() => {
          if (!submitting) {
            setConfirmOpen(false);
          }
        }}
        title={ACCOUNT_DELETION_COPY.CONFIRM_MODAL_TITLE}
        subtitle={ACCOUNT_DELETION_COPY.CONFIRM_MODAL_BODY}
        loading={submitting}
        actions={[
          {
            label: ACCOUNT_DELETION_COPY.CONFIRM_MODAL_CANCEL,
            onPress: () => setConfirmOpen(false),
            variant: 'secondary',
            disabled: submitting,
          },
          {
            label: ACCOUNT_DELETION_COPY.CONFIRM_MODAL_CONFIRM,
            onPress: () => {
              void handleConfirmSubmit();
            },
            variant: 'danger',
            disabled: submitting,
          },
        ]}
      />

      <UnifiedModal
        isOpen={cancelConfirmOpen}
        onClose={() => {
          if (!submitting) {
            setCancelConfirmOpen(false);
          }
        }}
        title={ACCOUNT_DELETION_COPY.PENDING_CANCEL_CONFIRM_TITLE}
        subtitle={ACCOUNT_DELETION_COPY.PENDING_CANCEL_CONFIRM_BODY}
        loading={submitting}
        actions={[
          {
            label: ACCOUNT_DELETION_COPY.CONFIRM_MODAL_CANCEL,
            onPress: () => setCancelConfirmOpen(false),
            variant: 'secondary',
            disabled: submitting,
          },
          {
            label: ACCOUNT_DELETION_COPY.PENDING_CANCEL,
            onPress: () => {
              void handleCancelPending();
            },
            variant: 'primary',
            disabled: submitting,
          },
        ]}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 8,
    paddingVertical: 8,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  headerSpacer: {
    width: 32,
  },
  scroll: {
    padding: 16,
    paddingBottom: 40,
  },
  card: {
    padding: 16,
    marginBottom: 20,
  },
  label: {
    marginBottom: 6,
    marginLeft: 2,
    textTransform: 'uppercase',
    letterSpacing: 0.4,
  },
  input: {
    borderWidth: StyleSheet.hairlineWidth,
    paddingHorizontal: 14,
    paddingVertical: 12,
    marginBottom: 16,
  },
  agreeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 4,
  },
  primaryBtn: {
    paddingVertical: 14,
    paddingHorizontal: 16,
  },
  dangerBtn: {
    paddingVertical: 14,
    paddingHorizontal: 16,
  },
});
