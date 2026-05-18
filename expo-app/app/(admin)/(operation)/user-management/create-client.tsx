/**
 * 어드민·스태프 — 내담자 등록
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
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useLocalSearchParams, useRouter, type Href } from 'expo-router';
import { useTheme } from '@/theme';
import { AppTopBar } from '@/components/templates/AppTopBar';
import { UnifiedModal } from '@/components/common/modals/UnifiedModal';
import {
  getAdminUserCreateErrorMessage,
  useAdminCreateClient,
  useAdminDuplicateCheckEmail,
} from '@/api/hooks/useAdminUserCreate';
import { ADMIN_USER_CREATE_COPY } from '@/constants/adminScheduleRegisterCopy';
import { isAdminMobileShellRole } from '@/utils/adminRole';
import { useAuthStore } from '@/stores/useAuthStore';

type Params = {
  returnPath?: string;
  consultantId?: string;
  dateYmd?: string;
};

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
  const [checkEmail, setCheckEmail] = useState(false);
  const [errorModal, setErrorModal] = useState<string | null>(null);

  const createMutation = useAdminCreateClient();
  const duplicateQuery = useAdminDuplicateCheckEmail(email, checkEmail);

  const handleSubmit = useCallback(async () => {
    if (!name.trim()) {
      setErrorModal(ADMIN_USER_CREATE_COPY.VALIDATION_NAME);
      return;
    }
    const emailTrim = email.trim();
    const phoneTrim = phone.trim();
    if (!emailTrim && !phoneTrim) {
      setErrorModal(ADMIN_USER_CREATE_COPY.VALIDATION_CONTACT);
      return;
    }
    if (emailTrim && duplicateQuery.data?.isDuplicate) {
      setErrorModal(ADMIN_USER_CREATE_COPY.DUPLICATE_EMAIL);
      return;
    }
    try {
      const result = await createMutation.mutateAsync({
        name: name.trim(),
        email: emailTrim || undefined,
        phone: phoneTrim || undefined,
        password: password.trim() || undefined,
        status: 'ACTIVE',
      });
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
  ]);

  if (!allowed) {
    return (
      <SafeAreaView style={[styles.safe, { backgroundColor: theme.colors.bgMain }]} edges={['top']}>
        <AppTopBar title={ADMIN_USER_CREATE_COPY.CLIENT_TITLE} canGoBack />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={[styles.safe, { backgroundColor: theme.colors.bgMain }]} edges={['top']}>
      <AppTopBar title={ADMIN_USER_CREATE_COPY.CLIENT_TITLE} canGoBack />
      <ScrollView contentContainerStyle={{ padding: theme.spacing.lg, paddingBottom: 48 }}>
        <FieldLabel text={ADMIN_USER_CREATE_COPY.LABEL_NAME} theme={theme} required />
        <TextInput
          value={name}
          onChangeText={setName}
          style={inputStyle(theme)}
          placeholderTextColor={theme.colors.textTertiary}
        />
        <FieldLabel text={ADMIN_USER_CREATE_COPY.LABEL_CONTACT} theme={theme} required />
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
        <TextInput
          value={phone}
          onChangeText={setPhone}
          keyboardType="phone-pad"
          style={[inputStyle(theme), { marginTop: theme.spacing.sm }]}
          placeholderTextColor={theme.colors.textTertiary}
        />
        <FieldLabel text={ADMIN_USER_CREATE_COPY.LABEL_PASSWORD} theme={theme} />
        <TextInput
          value={password}
          onChangeText={setPassword}
          secureTextEntry
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
        <Text style={{ color: theme.colors.textSecondary }}>{errorModal}</Text>
      </UnifiedModal>
    </SafeAreaView>
  );
}

function FieldLabel({
  text,
  theme,
  required,
}: {
  text: string;
  theme: ReturnType<typeof useTheme>;
  required?: boolean;
}) {
  return (
    <Text
      style={{
        marginTop: theme.spacing.md,
        marginBottom: 6,
        color: theme.colors.textSecondary,
        fontFamily: theme.fontFamily.medium,
        fontSize: theme.fontSize.sm,
      }}
    >
      {text}
      {required ? ' *' : ''}
    </Text>
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
