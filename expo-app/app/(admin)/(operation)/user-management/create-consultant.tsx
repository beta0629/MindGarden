/**
 * 어드민·스태프 — 상담사 등록 (CONSULTANT_MANAGE)
 *
 * @author MindGarden
 * @since 2026-05-18
 */
import { useCallback, useState } from 'react';
import {
  ActivityIndicator,
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
import { AppTopBar } from '@/components/templates/AppTopBar';
import { EmptyState } from '@/components/atoms/EmptyState';
import { UnifiedModal } from '@/components/common/modals/UnifiedModal';
import {
  getAdminUserCreateErrorMessage,
  useAdminCreateConsultant,
  useAdminDuplicateCheckEmail,
} from '@/api/hooks/useAdminUserCreate';
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
  const [checkEmail, setCheckEmail] = useState(false);
  const [errorModal, setErrorModal] = useState<string | null>(null);

  const createMutation = useAdminCreateConsultant();
  const duplicateQuery = useAdminDuplicateCheckEmail(email, checkEmail);

  const handleSubmit = useCallback(async () => {
    const emailTrim = email.trim();
    if (!emailTrim) {
      setErrorModal(ADMIN_USER_CREATE_COPY.VALIDATION_EMAIL);
      return;
    }
    if (duplicateQuery.data?.isDuplicate) {
      setErrorModal(ADMIN_USER_CREATE_COPY.DUPLICATE_EMAIL);
      return;
    }
    try {
      const result = await createMutation.mutateAsync({
        email: emailTrim,
        phone: phone.trim() || undefined,
        status: 'ACTIVE',
      });
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
    params.dateYmd,
    params.returnPath,
    phone,
    router,
  ]);

  if (!allowed || !canCreate) {
    return (
      <SafeAreaView style={[styles.safe, { backgroundColor: theme.colors.bgMain }]} edges={['top']}>
        <AppTopBar title={ADMIN_USER_CREATE_COPY.CONSULTANT_TITLE} canGoBack />
        <EmptyState title={ADMIN_USER_CREATE_COPY.ACCESS_CONSULTANT_DENIED} />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={[styles.safe, { backgroundColor: theme.colors.bgMain }]} edges={['top']}>
      <AppTopBar title={ADMIN_USER_CREATE_COPY.CONSULTANT_TITLE} canGoBack />
      <ScrollView contentContainerStyle={{ padding: theme.spacing.lg, paddingBottom: 48 }}>
        <Text
          style={{
            marginBottom: theme.spacing.md,
            color: theme.colors.textSecondary,
            fontFamily: theme.fontFamily.regular,
            fontSize: theme.fontSize.sm,
          }}
        >
          {ADMIN_USER_CREATE_COPY.LABEL_EMAIL} *
        </Text>
        <TextInput
          value={email}
          onChangeText={setEmail}
          onBlur={() => setCheckEmail(true)}
          keyboardType="email-address"
          autoCapitalize="none"
          style={inputStyle(theme)}
          placeholderTextColor={theme.colors.textTertiary}
        />
        {checkEmail && email.includes('@') && duplicateQuery.data ? (
          <Text
            style={{
              marginTop: 4,
              color: duplicateQuery.data.isDuplicate ? theme.colors.error : theme.colors.success,
              fontFamily: theme.fontFamily.regular,
              fontSize: theme.fontSize.xs,
            }}
          >
            {duplicateQuery.data.message}
          </Text>
        ) : null}
        <Text
          style={{
            marginTop: theme.spacing.md,
            marginBottom: 6,
            color: theme.colors.textSecondary,
            fontFamily: theme.fontFamily.medium,
            fontSize: theme.fontSize.sm,
          }}
        >
          {ADMIN_USER_CREATE_COPY.LABEL_PHONE}
        </Text>
        <TextInput
          value={phone}
          onChangeText={setPhone}
          keyboardType="phone-pad"
          style={inputStyle(theme)}
          placeholderTextColor={theme.colors.textTertiary}
        />
        <Pressable
          onPress={() => void handleSubmit()}
          disabled={createMutation.isPending}
          style={({ pressed }) => [
            styles.submit,
            {
              backgroundColor: theme.colors.primary,
              opacity: createMutation.isPending || pressed ? 0.85 : 1,
              marginTop: theme.spacing.xl,
            },
          ]}
        >
          {createMutation.isPending ? (
            <ActivityIndicator color={theme.colors.textOnPrimary} />
          ) : (
            <Text style={{ color: theme.colors.textOnPrimary, fontFamily: theme.fontFamily.semibold }}>
              {ADMIN_USER_CREATE_COPY.SUBMIT}
            </Text>
          )}
        </Pressable>
      </ScrollView>

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

function inputStyle(theme: ReturnType<typeof useTheme>) {
  return {
    borderWidth: 1,
    borderColor: theme.colors.divider,
    borderRadius: theme.borderRadius.md,
    paddingHorizontal: theme.spacing.md,
    paddingVertical: theme.spacing.sm,
    color: theme.colors.textMain,
    fontFamily: theme.fontFamily.regular,
    fontSize: theme.fontSize.base,
  };
}

const styles = StyleSheet.create({
  safe: { flex: 1 },
  submit: {
    minHeight: 48,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
