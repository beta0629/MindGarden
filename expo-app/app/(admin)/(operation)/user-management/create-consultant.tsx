/**
 * 어드민·스태프 — 상담사 등록 (CONSULTANT_MANAGE)
 * 웹 ConsultantComprehensiveManagement POST `/api/v1/admin/consultants` 패리티
 * DESIGN_SPEC / SCREEN_SPEC_EXPO_ADMIN_CLIENT_CONSULTANT_CREATE
 *
 * @author MindGarden
 * @since 2026-05-18
 */
import { useCallback, useEffect, useMemo, useState, type ReactNode } from 'react';
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
import { Chip } from '@/components/atoms/Chip';
import { EmptyState } from '@/components/atoms/EmptyState';
import { FormSectionCard } from '@/components/molecules/FormSectionCard';
import { UnifiedModal } from '@/components/common/modals/UnifiedModal';
import {
  getAdminUserCreateErrorMessage,
  useAdminCreateConsultant,
  useAdminDuplicateCheckEmail,
  type AdminCreateConsultantPayload,
} from '@/api/hooks/useAdminUserCreate';
import {
  FALLBACK_CONSULTANT_GRADE_OPTIONS,
  useAdminConsultantGradeCodes,
  useAdminSpecialtyCodes,
} from '@/api/hooks/useAdminUserCreateCodes';
import { ADMIN_USER_CREATE_COPY } from '@/constants/adminScheduleRegisterCopy';
import { toDisplayString } from '@/utils/safeDisplay';
import {
  canRegisterConsultantOnMobile,
  isAdminMobileShellRole,
} from '@/utils/adminRole';
import { useAuthStore } from '@/stores/useAuthStore';

type Params = {
  returnPath?: string;
  dateYmd?: string;
};

export default function AdminCreateConsultantScreen() {
  const theme = useTheme();
  const router = useRouter();
  const params = useLocalSearchParams<Params>();
  const storeRole = useAuthStore((s) => s.role);
  const accessToken = useAuthStore((s) => s.accessToken);
  const allowed = isAdminMobileShellRole(storeRole);
  const canCreate = canRegisterConsultantOnMobile(storeRole, accessToken);

  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  /** SPECIALTY codeValue 문자열만 저장 — 객체 금지 (React #130) */
  const [specialtyCodes, setSpecialtyCodes] = useState<string[]>([]);
  const [qualifications, setQualifications] = useState('');
  /** CONSULTANT_GRADE codeValue 문자열 */
  const [grade, setGrade] = useState('');
  const [checkEmail, setCheckEmail] = useState(false);
  const [fieldError, setFieldError] = useState<string | null>(null);
  const [errorModal, setErrorModal] = useState<string | null>(null);

  const createMutation = useAdminCreateConsultant();
  const duplicateQuery = useAdminDuplicateCheckEmail(email, checkEmail);
  const gradeQuery = useAdminConsultantGradeCodes({ enabled: allowed && canCreate });
  const specialtyQuery = useAdminSpecialtyCodes({ enabled: allowed && canCreate });

  const gradeOptions = useMemo(() => {
    const list = gradeQuery.data ?? [...FALLBACK_CONSULTANT_GRADE_OPTIONS];
    return list.filter((o) => toDisplayString(o.value, '').length > 0);
  }, [gradeQuery.data]);

  const specialtyOptions = useMemo(() => {
    const list = specialtyQuery.data ?? [];
    return list.filter((o) => toDisplayString(o.value, '').length > 0);
  }, [specialtyQuery.data]);

  useEffect(() => {
    if (grade || gradeOptions.length === 0) {
      return;
    }
    setGrade(toDisplayString(gradeOptions[0]?.value, ''));
  }, [grade, gradeOptions]);

  const toggleSpecialty = useCallback((codeValue: string) => {
    const code = toDisplayString(codeValue, '').trim();
    if (!code) {
      return;
    }
    setSpecialtyCodes((prev) =>
      prev.includes(code) ? prev.filter((v) => v !== code) : [...prev, code],
    );
  }, []);

  const handleSubmit = useCallback(async () => {
    setFieldError(null);
    const emailTrim = email.trim();
    if (!emailTrim) {
      setFieldError(ADMIN_USER_CREATE_COPY.VALIDATION_EMAIL);
      setErrorModal(ADMIN_USER_CREATE_COPY.VALIDATION_EMAIL);
      return;
    }
    if (duplicateQuery.data?.isDuplicate) {
      setErrorModal(ADMIN_USER_CREATE_COPY.DUPLICATE_EMAIL);
      return;
    }
    try {
      const specialization =
        specialtyCodes.length > 0 ? specialtyCodes.join(',') : undefined;
      const quals = qualifications.trim();
      const gradeCode = toDisplayString(grade, '').trim();
      const payload: AdminCreateConsultantPayload = {
        email: emailTrim,
        phone: phone.trim() || undefined,
        status: ADMIN_USER_CREATE_COPY.DEFAULT_STATUS,
        ...(specialization ? { specialization } : {}),
        ...(quals ? { qualifications: quals } : {}),
        ...(gradeCode ? { grade: gradeCode } : {}),
      };
      const result = await createMutation.mutateAsync(payload);
      const returnPath =
        typeof params.returnPath === 'string' && params.returnPath.length > 0
          ? params.returnPath
          : '/(admin)/(operation)/user-management';
      const consultantId = result.id;
      if (returnPath.includes('schedule/create') && consultantId != null) {
        router.replace({
          pathname: returnPath as Href,
          params: {
            consultantId: String(consultantId),
            dateYmd: params.dateYmd ?? '',
            step: '1',
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
    createMutation,
    duplicateQuery.data?.isDuplicate,
    email,
    grade,
    params.dateYmd,
    params.returnPath,
    phone,
    qualifications,
    router,
    specialtyCodes,
  ]);

  if (!allowed || !canCreate) {
    return (
      <SafeAreaView style={[styles.safe, { backgroundColor: theme.colors.bgMain }]} edges={['top']}>
        <AppTopBar title={ADMIN_USER_CREATE_COPY.CONSULTANT_TITLE} canGoBack />
        <EmptyState title={ADMIN_USER_CREATE_COPY.ACCESS_CONSULTANT_DENIED} />
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

  const selectedGradeLabel = toDisplayString(
    gradeOptions.find((o) => o.value === grade)?.label ?? grade,
    '',
  );

  return (
    <SafeAreaView style={[styles.safe, { backgroundColor: theme.colors.bgMain }]} edges={['top']}>
      <AppTopBar title={ADMIN_USER_CREATE_COPY.CONSULTANT_TITLE} canGoBack />
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
          <FormSectionCard title={ADMIN_USER_CREATE_COPY.CARD_CONSULTANT_ACCOUNT}>
            <FieldBlock
              label={ADMIN_USER_CREATE_COPY.LABEL_EMAIL}
              theme={theme}
              required
              error={fieldError === ADMIN_USER_CREATE_COPY.VALIDATION_EMAIL}
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
                style={inputStyle(
                  theme,
                  fieldError === ADMIN_USER_CREATE_COPY.VALIDATION_EMAIL,
                )}
                placeholder={ADMIN_USER_CREATE_COPY.PLACEHOLDER_EMAIL}
                placeholderTextColor={theme.colors.textTertiary}
              />
            </FieldBlock>
            <FieldBlock label={ADMIN_USER_CREATE_COPY.LABEL_PHONE} theme={theme}>
              <TextInput
                value={phone}
                onChangeText={setPhone}
                keyboardType="phone-pad"
                style={inputStyle(theme, false)}
                placeholder={ADMIN_USER_CREATE_COPY.PLACEHOLDER_PHONE}
                placeholderTextColor={theme.colors.textTertiary}
              />
            </FieldBlock>
          </FormSectionCard>

          <FormSectionCard title={ADMIN_USER_CREATE_COPY.CARD_CONSULTANT_PRO}>
            <FieldBlock label={ADMIN_USER_CREATE_COPY.LABEL_SPECIALTY} theme={theme}>
              {specialtyQuery.isLoading ? (
                <ActivityIndicator color={theme.colors.primary} />
              ) : specialtyOptions.length === 0 ? (
                <Text
                  style={{
                    color: theme.colors.textTertiary,
                    fontFamily: theme.fontFamily.regular,
                    fontSize: theme.fontSize.xs,
                  }}
                >
                  {ADMIN_USER_CREATE_COPY.EMPTY_SPECIALTY_CODES}
                </Text>
              ) : (
                <View style={styles.chipWrap}>
                  {specialtyOptions.map((opt) => {
                    const code = toDisplayString(opt.value, '');
                    const label = toDisplayString(opt.label, code);
                    const selected = specialtyCodes.includes(code);
                    return (
                      <Chip
                        key={code}
                        label={label}
                        selected={selected}
                        onPress={() => toggleSpecialty(code)}
                        style={
                          selected
                            ? {
                                backgroundColor: theme.colors.primaryLight,
                                borderColor: theme.colors.primaryLight,
                              }
                            : undefined
                        }
                      />
                    );
                  })}
                </View>
              )}
            </FieldBlock>
            <FieldBlock label={ADMIN_USER_CREATE_COPY.LABEL_QUALIFICATIONS} theme={theme}>
              <TextInput
                value={qualifications}
                onChangeText={setQualifications}
                multiline
                numberOfLines={3}
                textAlignVertical="top"
                style={[inputStyle(theme, false), styles.multiline]}
                placeholder={ADMIN_USER_CREATE_COPY.PLACEHOLDER_QUALIFICATIONS}
                placeholderTextColor={theme.colors.textTertiary}
              />
            </FieldBlock>
            <FieldBlock label={ADMIN_USER_CREATE_COPY.LABEL_GRADE} theme={theme}>
              {gradeQuery.isLoading && gradeOptions.length === 0 ? (
                <ActivityIndicator color={theme.colors.primary} />
              ) : (
                <View style={styles.chipWrap}>
                  {gradeOptions.map((opt) => {
                    const code = toDisplayString(opt.value, '');
                    const label = toDisplayString(opt.label, code);
                    const selected = grade === code;
                    return (
                      <Chip
                        key={code}
                        label={label}
                        selected={selected}
                        onPress={() => setGrade(code)}
                        style={
                          selected
                            ? {
                                backgroundColor: theme.colors.primaryLight,
                                borderColor: theme.colors.primaryLight,
                              }
                            : undefined
                        }
                      />
                    );
                  })}
                </View>
              )}
              {selectedGradeLabel ? (
                <Text
                  style={{
                    marginTop: theme.spacing.xs,
                    color: theme.colors.textSecondary,
                    fontFamily: theme.fontFamily.regular,
                    fontSize: theme.fontSize.xs,
                  }}
                >
                  {selectedGradeLabel}
                </Text>
              ) : null}
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
  chipWrap: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
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
