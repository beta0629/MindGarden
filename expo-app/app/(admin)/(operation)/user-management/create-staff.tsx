/**
 * 어드민 — 스태프 등록 (ADMIN 전용)
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
import { useRouter } from 'expo-router';
import { useTheme } from '@/theme';
import { AppTopBar } from '@/components/templates/AppTopBar';
import { EmptyState } from '@/components/atoms/EmptyState';
import { UnifiedModal } from '@/components/common/modals/UnifiedModal';
import {
  getAdminUserCreateErrorMessage,
  useAdminCreateStaff,
  useAdminDuplicateCheckEmail,
} from '@/api/hooks/useAdminUserCreate';
import { ADMIN_USER_CREATE_COPY } from '@/constants/adminScheduleRegisterCopy';
import { canRegisterStaffOnMobile } from '@/utils/adminRole';
import { useAuthStore } from '@/stores/useAuthStore';

export default function AdminCreateStaffScreen() {
  const theme = useTheme();
  const router = useRouter();
  const storeRole = useAuthStore((s) => s.role);
  const canCreate = canRegisterStaffOnMobile(storeRole);

  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [checkEmail, setCheckEmail] = useState(false);
  const [errorModal, setErrorModal] = useState<string | null>(null);

  const createMutation = useAdminCreateStaff();
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
      await createMutation.mutateAsync({
        email: emailTrim,
        name: name.trim() || undefined,
        phone: phone.trim() || undefined,
        password: password.trim() || undefined,
      });
      router.back();
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
    password,
    phone,
    router,
  ]);

  if (!canCreate) {
    return (
      <SafeAreaView style={[styles.safe, { backgroundColor: theme.colors.bgMain }]} edges={['top']}>
        <AppTopBar title={ADMIN_USER_CREATE_COPY.STAFF_TITLE} canGoBack />
        <EmptyState title={ADMIN_USER_CREATE_COPY.ACCESS_STAFF_DENIED} />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={[styles.safe, { backgroundColor: theme.colors.bgMain }]} edges={['top']}>
      <AppTopBar title={ADMIN_USER_CREATE_COPY.STAFF_TITLE} canGoBack />
      <ScrollView contentContainerStyle={{ padding: theme.spacing.lg, paddingBottom: 48 }}>
        <Text
          style={{
            marginBottom: 6,
            color: theme.colors.textSecondary,
            fontFamily: theme.fontFamily.medium,
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
          {ADMIN_USER_CREATE_COPY.LABEL_NAME}
        </Text>
        <TextInput
          value={name}
          onChangeText={setName}
          style={inputStyle(theme)}
          placeholderTextColor={theme.colors.textTertiary}
        />
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
        <Text
          style={{
            marginTop: theme.spacing.md,
            marginBottom: 6,
            color: theme.colors.textSecondary,
            fontFamily: theme.fontFamily.medium,
            fontSize: theme.fontSize.sm,
          }}
        >
          {ADMIN_USER_CREATE_COPY.LABEL_PASSWORD}
        </Text>
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
