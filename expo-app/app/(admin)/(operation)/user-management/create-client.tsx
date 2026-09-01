/**
 * 어드민·스태프 — 내담자 등록
 * 웹 ClientComprehensiveManagement POST `/api/v1/admin/clients` 패리티
 * DESIGN_SPEC / SCREEN_SPEC_EXPO_ADMIN_CLIENT_CONSULTANT_CREATE
 *
 * @author MindGarden
 * @since 2026-05-18
 */
import { useCallback, useState, type ReactNode } from 'react';
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useLocalSearchParams, useRouter, type Href } from 'expo-router';
import { useTheme } from '@/theme';
import { ADMIN_MIN_TOUCH_TARGET } from '@/theme/tokens';
import { AppTopBar } from '@/components/app-chrome/AppTopBar';
import { FormSectionCard } from '@/components/molecules/FormSectionCard';
import { UnifiedModal } from '@/components/common/modals/UnifiedModal';
import {
  getAdminUserCreateErrorMessage,
  useAdminCreateClient,
  useAdminDuplicateCheckEmail,
  type AdminCreateClientPayload,
} from '@/api/hooks/useAdminUserCreate';
import { ADMIN_USER_CREATE_COPY } from '@/constants/adminScheduleRegisterCopy';
import { isAdminMobileShellRole } from '@/utils/adminRole';
import { useAuthStore } from '@/stores/useAuthStore';
import { toDisplayString } from '@/utils/safeDisplay';

type Params = {
  returnPath?: string;
  consultantId?: string;
  dateYmd?: string;
};

function isValidRrnPair(first6: string, last1: string): boolean {
  if (!first6 && !last1) {
    return true;
  }
  return /^[0-9]{6}$/.test(first6) && /^[1-4]$/.test(last1);
}

export default function AdminCreateClientScreen() {
  const theme = useTheme();
  const router = useRouter();
  const params = useLocalSearchParams<Params>();
  const role = useAuthStore((s) => s.role);
  const allowed = isAdminMobileShellRole(role);

  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [rrnFirst6, setRrnFirst6] = useState('');
  const [rrnLast1, setRrnLast1] = useState('');
  const [address, setAddress] = useState('');
  const [consultationPurposeHistory, setConsultationPurposeHistory] = useState('');
  const [checkEmail, setCheckEmail] = useState(false);
  const [fieldError, setFieldError] = useState<string | null>(null);
  const [errorModal, setErrorModal] = useState<string | null>(null);

  const createMutation = useAdminCreateClient();
  const duplicateQuery = useAdminDuplicateCheckEmail(email, checkEmail);

  const handleSubmit = useCallback(async () => {
    setFieldError(null);
    if (!name.trim()) {
      setFieldError(ADMIN_USER_CREATE_COPY.VALIDATION_NAME);
      setErrorModal(ADMIN_USER_CREATE_COPY.VALIDATION_NAME);
      return;
    }
    const emailTrim = email.trim();
    const phoneTrim = phone.trim();
    if (!emailTrim && !phoneTrim) {
      setFieldError(ADMIN_USER_CREATE_COPY.VALIDATION_CONTACT);
      setErrorModal(ADMIN_USER_CREATE_COPY.VALIDATION_CONTACT);
      return;
    }
    if (emailTrim && duplicateQuery.data?.isDuplicate) {
      setErrorModal(ADMIN_USER_CREATE_COPY.DUPLICATE_EMAIL);
      return;
    }
    const first6 = rrnFirst6.trim();
    const last1 = rrnLast1.trim();
    if (!isValidRrnPair(first6, last1)) {
      setFieldError(ADMIN_USER_CREATE_COPY.VALIDATION_RRN);
      setErrorModal(ADMIN_USER_CREATE_COPY.VALIDATION_RRN);
      return;
    }
    try {
      const purposeHistory = consultationPurposeHistory.trim();
      const payload: AdminCreateClientPayload = {
        name: name.trim(),
        email: emailTrim || undefined,
        phone: phoneTrim || undefined,
        password: password.trim() || undefined,
        status: ADMIN_USER_CREATE_COPY.DEFAULT_STATUS,
        grade: ADMIN_USER_CREATE_COPY.DEFAULT_CLIENT_GRADE,
        consultationPurpose: purposeHistory,
        consultationHistory: purposeHistory,
        ...(address.trim() ? { address: address.trim() } : {}),
        ...(first6 ? { rrnFirst6: first6 } : {}),
        ...(last1 ? { rrnLast1: last1 } : {}),
      };
      const result = await createMutation.mutateAsync(payload);
      const returnPath =
        typeof params.returnPath === 'string' && params.returnPath.length > 0
          ? params.returnPath
          : '/(admin)/(operation)/user-management';
      const clientId = result.id;
      if (returnPath.includes('schedule/create') && clientId != null) {
        router.replace({
          pathname: returnPath as Href,
          params: {
            clientId: String(clientId),
            consultantId: params.consultantId ?? '',
            dateYmd: params.dateYmd ?? '',
            step: '2',
          },
        } as Href);
        return;
      }
      router.replace(returnPath as Href);
    } catch (err) {
      setErrorModal(
        getAdminUserCreateErrorMessage(err, ADMIN_USER_CREATE_COPY.ERROR_TITLE),
      );
    }
  }, [
    address,
    consultationPurposeHistory,
    createMutation,
    duplicateQuery.data?.isDuplicate,
    email,
    name,
    params.consultantId,
    params.dateYmd,
    params.returnPath,
    password,
    phone,
    router,
    rrnFirst6,
    rrnLast1,
  ]);

  if (!allowed) {
    return (
      <SafeAreaView style={[styles.safe, { backgroundColor: theme.colors.bgMain }]} edges={['top']}>
        <AppTopBar title={ADMIN_USER_CREATE_COPY.CLIENT_TITLE} canGoBack />
      </SafeAreaView>
    );
  }

  const emailHint =
    checkEmail && email.includes('@')
      ? duplicateQuery.isFetching
        ? ADMIN_USER_CREATE_COPY.EMAIL_CHECKING
        : duplicateQuery.data
          ? toDisplayString(
              duplicateQuery.data.isDuplicate
                ? ADMIN_USER_CREATE_COPY.DUPLICATE_EMAIL
                : ADMIN_USER_CREATE_COPY.EMAIL_AVAILABLE,
              '',
            )
          : null
      : null;
  const emailHintColor =
    duplicateQuery.data?.isDuplicate === true ? theme.colors.error : theme.colors.success;

  return (
    <SafeAreaView style={[styles.safe, { backgroundColor: theme.colors.bgMain }]} edges={['top']}>
      <AppTopBar title={ADMIN_USER_CREATE_COPY.CLIENT_TITLE} canGoBack />
      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 8 : 0}
      >
        <ScrollView
          style={styles.flex}
          contentContainerStyle={{
            paddingHorizontal: theme.spacing.lg,
            paddingTop: theme.spacing['2xl'],
            paddingBottom: theme.spacing['2xl'],
            gap: theme.spacing.lg,
          }}
          keyboardShouldPersistTaps="handled"
        >
          <FormSectionCard title={ADMIN_USER_CREATE_COPY.CARD_CLIENT_BASIC}>
            <FieldBlock
              label={ADMIN_USER_CREATE_COPY.LABEL_NAME}
              theme={theme}
              required
              error={fieldError === ADMIN_USER_CREATE_COPY.VALIDATION_NAME}
            >
              <TextInput
                value={name}
                onChangeText={setName}
                style={inputStyle(theme, fieldError === ADMIN_USER_CREATE_COPY.VALIDATION_NAME)}
                placeholderTextColor={theme.colors.textTertiary}
              />
            </FieldBlock>
            <FieldBlock
              label={ADMIN_USER_CREATE_COPY.LABEL_EMAIL}
              theme={theme}
              error={fieldError === ADMIN_USER_CREATE_COPY.VALIDATION_CONTACT}
              hint={emailHint}
              hintColor={emailHintColor}
              trailing={
                checkEmail && email.includes('@') && duplicateQuery.isFetching ? (
                  <ActivityIndicator size="small" color={theme.colors.primary} />
                ) : null
              }
            >
              <TextInput
                value={email}
                onChangeText={(v) => {
                  setEmail(v);
                  setCheckEmail(false);
                }}
                onBlur={() => setCheckEmail(true)}
                keyboardType="email-address"
                autoCapitalize="none"
                autoCorrect={false}
                style={inputStyle(theme, fieldError === ADMIN_USER_CREATE_COPY.VALIDATION_CONTACT)}
                placeholder={ADMIN_USER_CREATE_COPY.PLACEHOLDER_EMAIL}
                placeholderTextColor={theme.colors.textTertiary}
              />
            </FieldBlock>
            <FieldBlock
              label={ADMIN_USER_CREATE_COPY.LABEL_PHONE}
              theme={theme}
              error={fieldError === ADMIN_USER_CREATE_COPY.VALIDATION_CONTACT}
              hint={
                fieldError === ADMIN_USER_CREATE_COPY.VALIDATION_CONTACT
                  ? ADMIN_USER_CREATE_COPY.VALIDATION_CONTACT
                  : null
              }
              hintColor={theme.colors.error}
            >
              <TextInput
                value={phone}
                onChangeText={setPhone}
                keyboardType="phone-pad"
                style={inputStyle(theme, fieldError === ADMIN_USER_CREATE_COPY.VALIDATION_CONTACT)}
                placeholder={ADMIN_USER_CREATE_COPY.PLACEHOLDER_PHONE}
                placeholderTextColor={theme.colors.textTertiary}
              />
            </FieldBlock>
            <FieldBlock
              label={ADMIN_USER_CREATE_COPY.LABEL_PASSWORD}
              theme={theme}
              hint={ADMIN_USER_CREATE_COPY.HINT_PASSWORD_AUTO}
              hintColor={theme.colors.textTertiary}
            >
              <TextInput
                value={password}
                onChangeText={setPassword}
                secureTextEntry
                style={inputStyle(theme, false)}
                placeholderTextColor={theme.colors.textTertiary}
              />
            </FieldBlock>
          </FormSectionCard>

          <FormSectionCard title={ADMIN_USER_CREATE_COPY.CARD_CLIENT_EXTRA}>
            <FieldBlock
              label={ADMIN_USER_CREATE_COPY.LABEL_RRN}
              theme={theme}
              error={fieldError === ADMIN_USER_CREATE_COPY.VALIDATION_RRN}
            >
              <View style={styles.rrnRow}>
                <TextInput
                  value={rrnFirst6}
                  onChangeText={(v) => setRrnFirst6(v.replace(/\D/g, '').slice(0, 6))}
                  keyboardType="number-pad"
                  maxLength={6}
                  style={[
                    inputStyle(theme, fieldError === ADMIN_USER_CREATE_COPY.VALIDATION_RRN),
                    styles.rrnFirst,
                  ]}
                  placeholder={ADMIN_USER_CREATE_COPY.LABEL_RRN_FIRST}
                  placeholderTextColor={theme.colors.textTertiary}
                />
                <Text style={{ color: theme.colors.textSecondary, fontFamily: theme.fontFamily.medium }}>
                  -
                </Text>
                <TextInput
                  value={rrnLast1}
                  onChangeText={(v) => setRrnLast1(v.replace(/\D/g, '').slice(0, 1))}
                  keyboardType="number-pad"
                  maxLength={1}
                  secureTextEntry
                  style={[
                    inputStyle(theme, fieldError === ADMIN_USER_CREATE_COPY.VALIDATION_RRN),
                    styles.rrnLast,
                  ]}
                  placeholder={ADMIN_USER_CREATE_COPY.LABEL_RRN_LAST}
                  placeholderTextColor={theme.colors.textTertiary}
                />
                <Text style={{ color: theme.colors.textTertiary, fontFamily: theme.fontFamily.regular }}>
                  ******
                </Text>
              </View>
            </FieldBlock>
            <FieldBlock label={ADMIN_USER_CREATE_COPY.LABEL_ADDRESS} theme={theme}>
              <TextInput
                value={address}
                onChangeText={setAddress}
                style={inputStyle(theme, false)}
                placeholder={ADMIN_USER_CREATE_COPY.PLACEHOLDER_ADDRESS}
                placeholderTextColor={theme.colors.textTertiary}
              />
            </FieldBlock>
            <FieldBlock
              label={ADMIN_USER_CREATE_COPY.LABEL_CONSULTATION_PURPOSE_HISTORY}
              theme={theme}
            >
              <TextInput
                value={consultationPurposeHistory}
                onChangeText={setConsultationPurposeHistory}
                multiline
                numberOfLines={3}
                textAlignVertical="top"
                style={[inputStyle(theme, false), styles.multiline]}
                placeholder={ADMIN_USER_CREATE_COPY.PLACEHOLDER_PURPOSE}
                placeholderTextColor={theme.colors.textTertiary}
              />
            </FieldBlock>
          </FormSectionCard>
        </ScrollView>

        <View
          style={[
            styles.bottomBar,
            {
              backgroundColor: theme.colors.bgMain,
              borderTopColor: theme.colors.border,
              paddingHorizontal: theme.spacing.lg,
              paddingTop: theme.spacing.md,
              paddingBottom: theme.spacing.md,
            },
          ]}
        >
          <Pressable
            onPress={() => void handleSubmit()}
            disabled={createMutation.isPending}
            style={({ pressed }) => [
              styles.submit,
              {
                backgroundColor: theme.colors.primary,
                opacity: createMutation.isPending || pressed ? 0.85 : 1,
                borderRadius: theme.borderRadius.md + 2,
              },
            ]}
            accessibilityRole="button"
            accessibilityLabel={ADMIN_USER_CREATE_COPY.SUBMIT}
          >
            {createMutation.isPending ? (
              <ActivityIndicator color={theme.colors.textOnPrimary} />
            ) : (
              <Text
                style={{
                  color: theme.colors.textOnPrimary,
                  fontFamily: theme.fontFamily.semibold,
                  fontSize: theme.fontSize.base,
                }}
              >
                {ADMIN_USER_CREATE_COPY.SUBMIT}
              </Text>
            )}
          </Pressable>
        </View>
      </KeyboardAvoidingView>

      <UnifiedModal
        isOpen={errorModal != null}
        onClose={() => setErrorModal(null)}
        title={ADMIN_USER_CREATE_COPY.ERROR_TITLE}
        actions={[{ label: '확인', onPress: () => setErrorModal(null), variant: 'primary' }]}
      >
        <Text style={{ color: theme.colors.textSecondary }}>
          {toDisplayString(errorModal, '')}
        </Text>
      </UnifiedModal>
    </SafeAreaView>
  );
}

function FieldBlock({
  label,
  theme,
  required,
  error,
  hint,
  hintColor,
  trailing,
  children,
}: {
  label: string;
  theme: ReturnType<typeof useTheme>;
  required?: boolean;
  error?: boolean;
  hint?: string | null;
  hintColor?: string;
  trailing?: ReactNode;
  children: ReactNode;
}) {
  return (
    <View>
      <View style={styles.labelRow}>
        <Text
          style={{
            color: theme.colors.textSecondary,
            fontFamily: theme.fontFamily.medium,
            fontSize: theme.fontSize.xs,
            marginBottom: theme.spacing.xs,
          }}
        >
          {toDisplayString(label, '')}
          {required ? ' *' : ''}
        </Text>
        {trailing}
      </View>
      {children}
      {hint ? (
        <Text
          style={{
            marginTop: theme.spacing.xs,
            color: hintColor ?? (error ? theme.colors.error : theme.colors.textTertiary),
            fontFamily: theme.fontFamily.regular,
            fontSize: theme.fontSize.xs,
          }}
        >
          {toDisplayString(hint, '')}
        </Text>
      ) : null}
    </View>
  );
}

function inputStyle(theme: ReturnType<typeof useTheme>, error: boolean) {
  return {
    borderWidth: 1,
    borderColor: error ? theme.colors.error : theme.colors.border,
    borderRadius: theme.borderRadius.md,
    paddingHorizontal: theme.spacing.md,
    minHeight: ADMIN_MIN_TOUCH_TARGET,
    color: theme.colors.textMain,
    fontFamily: theme.fontFamily.regular,
    fontSize: theme.fontSize.sm,
    backgroundColor: theme.colors.loginOrbCore,
  };
}

const styles = StyleSheet.create({
  safe: { flex: 1 },
  flex: { flex: 1 },
  labelRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  rrnRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  rrnFirst: {
    flex: 1,
  },
  rrnLast: {
    width: 48,
    textAlign: 'center',
  },
  multiline: {
    minHeight: 88,
    paddingTop: 12,
    paddingBottom: 12,
  },
  bottomBar: {
    borderTopWidth: 1,
  },
  submit: {
    minHeight: 48,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
