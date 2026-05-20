/**
 * 어드민·스태프 — 신규 매칭 5스텝 (상담사→패키지→내담자→결제→완료)
 *
 * @author MindGarden
 * @since 2026-05-18
 */
import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  FlatList,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { format } from 'date-fns';
import { ExternalLink } from 'lucide-react-native';
import { useRouter, type Href } from 'expo-router';
import { useTheme } from '@/theme';
import { AppTopBar } from '@/components/app-chrome/AppTopBar';
import { AdminWizardShell } from '@/components/app-chrome/AdminWizardShell';
import { EmptyState } from '@/components/atoms/EmptyState';
import { SearchBar } from '@/components/atoms/SearchBar';
import { UnifiedModal } from '@/components/common/modals/UnifiedModal';
import { AdminMappingPaymentConfirmModal } from '@/components/organisms/AdminMappingPaymentConfirmModal';
import {
  getAdminCreateMappingErrorMessage,
  useAdminCreateMapping,
} from '@/api/hooks/useAdminCreateMapping';
import {
  useAdminClientsWithMappingInfo,
  useAdminMappingPackageCodes,
  useAdminMappingPaymentMethodCodes,
  useAdminMappingResponsibilityCodes,
  type AdminMappingClientWithInfo,
  type AdminMappingPackageOption,
} from '@/api/hooks/useAdminMappingPickers';
import { useAdminConsultantsWithVacation } from '@/api/hooks/useAdminSchedulePickers';
import type { AdminConsultantVacationPickerItem } from '@/api/hooks/useAdminSchedulePickers';
import {
  ADMIN_MAPPING_COPY,
  ADMIN_MAPPING_DEFAULTS,
} from '@/constants/adminMappingCopy';
import { useAuthStore } from '@/stores/useAuthStore';
import { generateMappingPaymentReference } from '@/utils/adminMappingCreateBody';
import { canManageMappingsOnMobile } from '@/utils/adminRole';
import { ADMIN_MIN_TOUCH_TARGET } from '@/theme/tokens';
import { extractCreatedMappingId, openAdminWebIntegratedSchedule } from '@/utils/openAdminWebMappingPayment';
import type { AdminMappingSettlementTarget } from '@/utils/adminMappingSettlement';
import { toDisplayString, toSafeNumber } from '@/utils/safeDisplay';

const TOTAL_STEPS = 5;

function filterBySearch<T extends { name: string; email?: string; phone?: string }>(
  items: readonly T[],
  query: string,
): T[] {
  const q = query.trim().toLowerCase();
  if (!q) {
    return [...items];
  }
  return items.filter((item) => {
    const hay = `${item.name} ${item.email ?? ''} ${item.phone ?? ''}`.toLowerCase();
    return hay.includes(q);
  });
}

export default function AdminMappingCreateScreen() {
  const theme = useTheme();
  const router = useRouter();
  const role = useAuthStore((s) => s.role);
  const accessToken = useAuthStore((s) => s.accessToken);
  const allowed = canManageMappingsOnMobile(role, accessToken);

  const [step, setStep] = useState(1);
  const [consultant, setConsultant] = useState<AdminConsultantVacationPickerItem | null>(null);
  const [client, setClient] = useState<AdminMappingClientWithInfo | null>(null);
  const [selectedPackage, setSelectedPackage] = useState<AdminMappingPackageOption | null>(null);
  const [totalSessions, setTotalSessions] = useState(String(ADMIN_MAPPING_DEFAULTS.TOTAL_SESSIONS));
  const [packageName, setPackageName] = useState<string>(ADMIN_MAPPING_DEFAULTS.PACKAGE_NAME);
  const [packagePrice, setPackagePrice] = useState(String(ADMIN_MAPPING_DEFAULTS.PACKAGE_PRICE));
  const [paymentMethod, setPaymentMethod] = useState<string>(ADMIN_MAPPING_DEFAULTS.PAYMENT_METHOD);
  const [paymentReference, setPaymentReference] = useState(() =>
    generateMappingPaymentReference(ADMIN_MAPPING_DEFAULTS.PAYMENT_METHOD),
  );
  const [responsibility, setResponsibility] = useState<string>(ADMIN_MAPPING_DEFAULTS.RESPONSIBILITY);
  const [specialConsiderations, setSpecialConsiderations] = useState('');
  const [notes, setNotes] = useState('');
  const [consultantSearch, setConsultantSearch] = useState('');
  const [clientSearch, setClientSearch] = useState('');
  const [errorModal, setErrorModal] = useState<string | null>(null);
  const [cancelOpen, setCancelOpen] = useState(false);
  const [forbiddenOpen, setForbiddenOpen] = useState(false);
  const [createdMappingSnapshot, setCreatedMappingSnapshot] =
    useState<AdminMappingSettlementTarget | null>(null);
  const [paymentModalOpen, setPaymentModalOpen] = useState(false);

  const dateYmd = format(new Date(), 'yyyy-MM-dd');
  const consultantsQuery = useAdminConsultantsWithVacation(dateYmd);
  const clientsQuery = useAdminClientsWithMappingInfo();
  const packagesQuery = useAdminMappingPackageCodes();
  const paymentMethodsQuery = useAdminMappingPaymentMethodCodes();
  const responsibilityQuery = useAdminMappingResponsibilityCodes();
  const createMutation = useAdminCreateMapping();

  const paymentMethods = paymentMethodsQuery.data ?? [];
  const responsibilities = responsibilityQuery.data ?? [];

  useEffect(() => {
    if (paymentMethods.length > 0 && !paymentMethods.some((m) => m.value === paymentMethod)) {
      const first = paymentMethods[0];
      if (first) {
        setPaymentMethod(first.value);
        setPaymentReference(generateMappingPaymentReference(first.value));
      }
    }
  }, [paymentMethods, paymentMethod]);

  useEffect(() => {
    if (
      responsibilities.length > 0 &&
      !responsibilities.some((r) => r.value === responsibility)
    ) {
      const first = responsibilities[0];
      if (first) {
        setResponsibility(first.value);
      }
    }
  }, [responsibilities, responsibility]);

  const filteredConsultants = useMemo(
    () => filterBySearch(consultantsQuery.data ?? [], consultantSearch),
    [consultantsQuery.data, consultantSearch],
  );

  const filteredClients = useMemo(
    () => filterBySearch(clientsQuery.data ?? [], clientSearch),
    [clientsQuery.data, clientSearch],
  );

  const stepTitle = useMemo(() => {
    if (step === 1) {
      return ADMIN_MAPPING_COPY.STEP_CONSULTANT;
    }
    if (step === 2) {
      return ADMIN_MAPPING_COPY.STEP_PACKAGE;
    }
    if (step === 3) {
      return ADMIN_MAPPING_COPY.STEP_CLIENT;
    }
    if (step === 4) {
      return ADMIN_MAPPING_COPY.STEP_PAYMENT;
    }
    return ADMIN_MAPPING_COPY.STEP_DONE;
  }, [step]);

  const applyPackage = useCallback((pkg: AdminMappingPackageOption) => {
    setSelectedPackage(pkg);
    setPackageName(pkg.label);
    setTotalSessions(String(pkg.sessions));
    setPackagePrice(String(pkg.price));
    setStep(3);
  }, []);

  const submit = useCallback(async () => {
    if (!consultant) {
      setErrorModal(ADMIN_MAPPING_COPY.VALIDATION_PICK_CONSULTANT);
      return;
    }
    if (!client) {
      setErrorModal(ADMIN_MAPPING_COPY.VALIDATION_PICK_CLIENT);
      return;
    }
    if (!packageName.trim()) {
      setErrorModal(ADMIN_MAPPING_COPY.VALIDATION_PACKAGE);
      return;
    }
    const sessions = parseInt(totalSessions, 10);
    const price = parseInt(packagePrice, 10);
    if (!Number.isFinite(sessions) || sessions < 1 || !Number.isFinite(price)) {
      setErrorModal(ADMIN_MAPPING_COPY.VALIDATION_PAYMENT);
      return;
    }
    try {
      const raw = await createMutation.mutateAsync({
        consultantId: consultant.id,
        clientId: client.id,
        payment: {
          totalSessions: sessions,
          packageName: packageName.trim(),
          packagePrice: price,
          paymentMethod,
          paymentReference: paymentReference.trim(),
          responsibility,
          specialConsiderations,
          notes,
        },
      });
      const newId = extractCreatedMappingId(raw);
      if (newId != null && consultant && client) {
        setCreatedMappingSnapshot({
          id: newId,
          status: 'PENDING_PAYMENT',
          remainingSessions: sessions,
          consultantName: toDisplayString(consultant.name, '상담사'),
          clientName: toDisplayString(client.name, '내담자'),
          packageName: packageName.trim(),
          packagePrice: price,
          paymentMethod,
        });
      }
      setStep(5);
    } catch (err) {
      if (
        err != null &&
        typeof err === 'object' &&
        'status' in err &&
        (err as { status: number }).status === 403
      ) {
        setForbiddenOpen(true);
        return;
      }
      setErrorModal(getAdminCreateMappingErrorMessage(err));
    }
  }, [
    client,
    consultant,
    createMutation,
    notes,
    packageName,
    packagePrice,
    paymentMethod,
    paymentReference,
    responsibility,
    specialConsiderations,
    totalSessions,
  ]);

  const finishToMappingsTab = useCallback(() => {
    router.replace({
      pathname: '/(admin)/(operation)/schedule',
      params: { tab: 'mappings' },
    } as Href);
  }, [router]);

  const openWebPayment = useCallback(() => {
    void openAdminWebIntegratedSchedule();
  }, []);

  const renderPickerRow = (
    label: string,
    selected: boolean,
    onPress: () => void,
    subtitle?: string,
  ) => (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [
        styles.pickerRow,
        {
          borderColor: selected ? theme.colors.primary : theme.colors.divider,
          backgroundColor: theme.colors.surface,
          opacity: pressed ? 0.92 : 1,
        },
      ]}
    >
      <Text
        style={{
          fontFamily: theme.fontFamily.medium,
          fontSize: theme.fontSize.base,
          color: theme.colors.textMain,
        }}
      >
        {label}
      </Text>
      {subtitle ? (
        <Text
          style={{
            marginTop: 4,
            fontFamily: theme.fontFamily.regular,
            fontSize: theme.fontSize.xs,
            color: theme.colors.textSecondary,
          }}
        >
          {subtitle}
        </Text>
      ) : null}
    </Pressable>
  );

  if (!allowed) {
    return (
      <SafeAreaView style={[styles.safe, { backgroundColor: theme.colors.bgMain }]} edges={['top']}>
        <AppTopBar title={ADMIN_MAPPING_COPY.CREATE_TITLE} canGoBack />
        <EmptyState title={ADMIN_MAPPING_COPY.ACCESS_MANAGE_DENIED} />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={[styles.safe, { backgroundColor: theme.colors.bgMain }]} edges={['top']}>
      <AppTopBar title={ADMIN_MAPPING_COPY.CREATE_TITLE} canGoBack />
      {step < 5 ? (
      <AdminWizardShell
        currentStep={step}
        totalSteps={TOTAL_STEPS}
        stepOfText={ADMIN_MAPPING_COPY.STEP_OF(step, TOTAL_STEPS)}
        stepTitle={stepTitle}
        leftAction={
          step > 1
            ? {
                label: ADMIN_MAPPING_COPY.PREV,
                onPress: () => setStep(step - 1),
              }
            : {
                label: ADMIN_MAPPING_COPY.CANCEL,
                onPress: () => setCancelOpen(true),
                variant: 'cancel',
              }
        }
        rightAction={{
          label: step < 4 ? ADMIN_MAPPING_COPY.NEXT : ADMIN_MAPPING_COPY.SUBMIT,
          loading: step === 4 && createMutation.isPending,
          disabled: step === 4 && createMutation.isPending,
          onPress: () => {
            if (step < 4) {
              if (step === 1 && !consultant) {
                setErrorModal(ADMIN_MAPPING_COPY.VALIDATION_PICK_CONSULTANT);
                return;
              }
              if (step === 2 && !selectedPackage) {
                setErrorModal(ADMIN_MAPPING_COPY.VALIDATION_PACKAGE);
                return;
              }
              if (step === 3 && !client) {
                setErrorModal(ADMIN_MAPPING_COPY.VALIDATION_PICK_CLIENT);
                return;
              }
              setStep(step + 1);
              return;
            }
            void submit();
          },
        }}
      >
      {step === 1 ? (
        <View style={{ flex: 1, paddingHorizontal: theme.spacing.lg, paddingTop: theme.spacing.md }}>
          <SearchBar
            value={consultantSearch}
            onChangeText={setConsultantSearch}
            placeholder={ADMIN_MAPPING_COPY.SEARCH_CONSULTANT}
          />
          {consultantsQuery.isLoading ? (
            <ActivityIndicator style={{ marginTop: 24 }} color={theme.colors.primary} />
          ) : (
            <FlatList
              data={filteredConsultants}
              keyExtractor={(item) => String(item.id)}
              contentContainerStyle={{ paddingBottom: 120 }}
              ListEmptyComponent={
                <EmptyState title={ADMIN_MAPPING_COPY.EMPTY_CONSULTANTS} />
              }
              renderItem={({ item }) =>
                renderPickerRow(
                  toDisplayString(item.name, '—'),
                  consultant?.id === item.id,
                  () => {
                    setConsultant(item);
                    setStep(2);
                  },
                  item.email || undefined,
                )
              }
            />
          )}
        </View>
      ) : null}

      {step === 2 ? (
        <View style={{ flex: 1, paddingHorizontal: theme.spacing.lg, paddingTop: theme.spacing.md }}>
          {packagesQuery.isLoading ? (
            <ActivityIndicator style={{ marginTop: 24 }} color={theme.colors.primary} />
          ) : (
            <FlatList
              data={packagesQuery.data ?? []}
              keyExtractor={(item) => item.value}
              contentContainerStyle={{ paddingBottom: 120 }}
              ListEmptyComponent={
                <EmptyState title={ADMIN_MAPPING_COPY.EMPTY_PACKAGES} />
              }
              renderItem={({ item }) =>
                renderPickerRow(
                  item.label,
                  selectedPackage?.value === item.value,
                  () => applyPackage(item),
                  ADMIN_MAPPING_COPY.REMAINING_SESSIONS(item.sessions) +
                    ` · ${toSafeNumber(item.price, 0).toLocaleString('ko-KR')}원`,
                )
              }
            />
          )}
        </View>
      ) : null}

      {step === 3 ? (
        <View style={{ flex: 1, paddingHorizontal: theme.spacing.lg, paddingTop: theme.spacing.md }}>
          <SearchBar
            value={clientSearch}
            onChangeText={setClientSearch}
            placeholder={ADMIN_MAPPING_COPY.SEARCH_CLIENT}
          />
          {clientsQuery.isLoading ? (
            <ActivityIndicator style={{ marginTop: 24 }} color={theme.colors.primary} />
          ) : (
            <FlatList
              data={filteredClients}
              keyExtractor={(item) => String(item.id)}
              contentContainerStyle={{ paddingBottom: 120 }}
              ListEmptyComponent={<EmptyState title={ADMIN_MAPPING_COPY.EMPTY_CLIENTS} />}
              renderItem={({ item }) =>
                renderPickerRow(
                  toDisplayString(item.name, '—'),
                  client?.id === item.id,
                  () => {
                    setClient(item);
                    setStep(4);
                  },
                  item.email || item.phone || undefined,
                )
              }
            />
          )}
        </View>
      ) : null}

      {step === 4 ? (
        <ScrollView
          contentContainerStyle={{
            paddingHorizontal: theme.spacing.lg,
            paddingTop: theme.spacing.md,
            paddingBottom: 120,
          }}
        >
          <Text style={[styles.fieldLabel, { color: theme.colors.textSecondary }]}>
            {ADMIN_MAPPING_COPY.LABEL_PACKAGE}
          </Text>
          <TextInput
            value={packageName}
            onChangeText={setPackageName}
            style={[
              styles.input,
              {
                borderColor: theme.colors.divider,
                color: theme.colors.textMain,
                fontFamily: theme.fontFamily.regular,
              },
            ]}
          />
          <Text style={[styles.fieldLabel, { color: theme.colors.textSecondary }]}>
            {ADMIN_MAPPING_COPY.LABEL_SESSIONS}
          </Text>
          <TextInput
            value={totalSessions}
            onChangeText={setTotalSessions}
            keyboardType="number-pad"
            style={[
              styles.input,
              {
                borderColor: theme.colors.divider,
                color: theme.colors.textMain,
                fontFamily: theme.fontFamily.regular,
              },
            ]}
          />
          <Text style={[styles.fieldLabel, { color: theme.colors.textSecondary }]}>
            {ADMIN_MAPPING_COPY.LABEL_PRICE}
          </Text>
          <TextInput
            value={packagePrice}
            onChangeText={setPackagePrice}
            keyboardType="number-pad"
            style={[
              styles.input,
              {
                borderColor: theme.colors.divider,
                color: theme.colors.textMain,
                fontFamily: theme.fontFamily.regular,
              },
            ]}
          />
          <Text style={[styles.fieldLabel, { color: theme.colors.textSecondary }]}>
            {ADMIN_MAPPING_COPY.LABEL_PAYMENT_METHOD}
          </Text>
          <View style={styles.chipWrap}>
            {paymentMethods.map((m) => (
              <Pressable
                key={m.value}
                onPress={() => {
                  setPaymentMethod(m.value);
                  setPaymentReference(generateMappingPaymentReference(m.value));
                }}
                style={[
                  styles.chip,
                  {
                    borderColor:
                      paymentMethod === m.value ? theme.colors.primary : theme.colors.divider,
                    backgroundColor:
                      paymentMethod === m.value ? theme.colors.gray[100] : theme.colors.surface,
                  },
                ]}
              >
                <Text
                  style={{
                    color:
                      paymentMethod === m.value
                        ? theme.colors.primary
                        : theme.colors.textSecondary,
                    fontFamily: theme.fontFamily.medium,
                    fontSize: theme.fontSize.sm,
                  }}
                >
                  {m.label}
                </Text>
              </Pressable>
            ))}
          </View>
          <Text style={[styles.fieldLabel, { color: theme.colors.textSecondary }]}>
            {ADMIN_MAPPING_COPY.LABEL_PAYMENT_REF}
          </Text>
          <TextInput
            value={paymentReference}
            onChangeText={setPaymentReference}
            style={[
              styles.input,
              {
                borderColor: theme.colors.divider,
                color: theme.colors.textMain,
                fontFamily: theme.fontFamily.regular,
              },
            ]}
          />
          <Text style={[styles.fieldLabel, { color: theme.colors.textSecondary }]}>
            {ADMIN_MAPPING_COPY.LABEL_RESPONSIBILITY}
          </Text>
          <View style={styles.chipWrap}>
            {responsibilities.map((r) => (
              <Pressable
                key={r.value}
                onPress={() => setResponsibility(r.value)}
                style={[
                  styles.chip,
                  {
                    borderColor:
                      responsibility === r.value ? theme.colors.primary : theme.colors.divider,
                    backgroundColor:
                      responsibility === r.value ? theme.colors.gray[100] : theme.colors.surface,
                  },
                ]}
              >
                <Text
                  style={{
                    color:
                      responsibility === r.value
                        ? theme.colors.primary
                        : theme.colors.textSecondary,
                    fontFamily: theme.fontFamily.medium,
                    fontSize: theme.fontSize.sm,
                  }}
                >
                  {r.label}
                </Text>
              </Pressable>
            ))}
          </View>
          <Text style={[styles.fieldLabel, { color: theme.colors.textSecondary }]}>
            {ADMIN_MAPPING_COPY.LABEL_SPECIAL}
          </Text>
          <TextInput
            value={specialConsiderations}
            onChangeText={setSpecialConsiderations}
            multiline
            style={[
              styles.input,
              styles.multiline,
              {
                borderColor: theme.colors.divider,
                color: theme.colors.textMain,
                fontFamily: theme.fontFamily.regular,
              },
            ]}
          />
          <Text style={[styles.fieldLabel, { color: theme.colors.textSecondary }]}>
            {ADMIN_MAPPING_COPY.LABEL_NOTES}
          </Text>
          <TextInput
            value={notes}
            onChangeText={setNotes}
            multiline
            style={[
              styles.input,
              styles.multiline,
              {
                borderColor: theme.colors.divider,
                color: theme.colors.textMain,
                fontFamily: theme.fontFamily.regular,
              },
            ]}
          />
        </ScrollView>
      ) : null}
      </AdminWizardShell>
      ) : (
        <View style={{ flex: 1, paddingHorizontal: theme.spacing.lg, paddingTop: theme.spacing.xl }}>
          <EmptyState
            title={ADMIN_MAPPING_COPY.SUCCESS_TITLE}
            description={ADMIN_MAPPING_COPY.SUCCESS_BODY}
          />
          <Text
            style={{
              textAlign: 'center',
              color: theme.colors.textSecondary,
              fontFamily: theme.fontFamily.regular,
              fontSize: theme.fontSize.sm,
              marginTop: theme.spacing.md,
            }}
          >
            {ADMIN_MAPPING_COPY.WEB_PAYMENT_HINT}
          </Text>
          {allowed && createdMappingSnapshot != null ? (
            <Pressable
              onPress={() => setPaymentModalOpen(true)}
              style={({ pressed }) => [
                styles.primaryBtn,
                {
                  backgroundColor: theme.colors.primary,
                  opacity: pressed ? 0.7 : 1,
                  marginTop: theme.spacing.xl,
                },
              ]}
              accessibilityRole="button"
              accessibilityLabel={ADMIN_MAPPING_COPY.CONFIRM_PAYMENT_CTA}
            >
              <Text style={{ color: theme.colors.textOnPrimary, fontFamily: theme.fontFamily.semibold }}>
                {ADMIN_MAPPING_COPY.CONFIRM_PAYMENT_CTA}
              </Text>
            </Pressable>
          ) : null}
          <Pressable
            onPress={finishToMappingsTab}
            style={({ pressed }) => [
              styles.primaryBtn,
              allowed && createdMappingSnapshot != null ? styles.outlineBtn : null,
              {
                backgroundColor:
                  allowed && createdMappingSnapshot != null
                    ? 'transparent'
                    : theme.colors.primary,
                borderColor: theme.colors.primary,
                opacity: pressed ? 0.7 : 1,
                marginTop:
                  allowed && createdMappingSnapshot != null
                    ? theme.spacing.sm
                    : theme.spacing.xl,
              },
            ]}
            accessibilityRole="button"
          >
            <Text
              style={{
                color:
                  allowed && createdMappingSnapshot != null
                    ? theme.colors.primary
                    : theme.colors.textOnPrimary,
                fontFamily: theme.fontFamily.semibold,
              }}
            >
              {ADMIN_MAPPING_COPY.DONE_BACK}
            </Text>
          </Pressable>
          {allowed ? (
            <Pressable
              onPress={openWebPayment}
              style={({ pressed }) => [
                styles.tertiaryBtn,
                { opacity: pressed ? 0.7 : 1, marginTop: theme.spacing.sm },
              ]}
              accessibilityRole="button"
              accessibilityLabel={ADMIN_MAPPING_COPY.OPEN_WEB_PAYMENT_A11Y}
            >
              <ExternalLink size={16} color={theme.colors.primary} />
              <Text
                style={{
                  color: theme.colors.primary,
                  fontFamily: theme.fontFamily.medium,
                  fontSize: theme.fontSize.sm,
                  marginLeft: 6,
                }}
              >
                {ADMIN_MAPPING_COPY.OPEN_WEB_PAYMENT_CTA}
              </Text>
            </Pressable>
          ) : null}
        </View>
      )}

      <UnifiedModal
        isOpen={errorModal != null}
        onClose={() => setErrorModal(null)}
        title={ADMIN_MAPPING_COPY.ERROR_TITLE}
        subtitle={errorModal ?? undefined}
        actions={[{ label: '확인', onPress: () => setErrorModal(null), variant: 'primary' }]}
      />
      <UnifiedModal
        isOpen={forbiddenOpen}
        onClose={() => setForbiddenOpen(false)}
        title={ADMIN_MAPPING_COPY.FORBIDDEN_TITLE}
        subtitle={ADMIN_MAPPING_COPY.ACCESS_MANAGE_DENIED}
        actions={[
          { label: '확인', onPress: () => setForbiddenOpen(false), variant: 'primary' },
        ]}
      />
      <UnifiedModal
        isOpen={cancelOpen}
        onClose={() => setCancelOpen(false)}
        title={ADMIN_MAPPING_COPY.CANCEL_CONFIRM_TITLE}
        subtitle={ADMIN_MAPPING_COPY.CANCEL_CONFIRM_BODY}
        actions={[
          {
            label: ADMIN_MAPPING_COPY.CANCEL,
            onPress: () => setCancelOpen(false),
            variant: 'secondary',
          },
          {
            label: '나가기',
            onPress: () => router.back(),
            variant: 'primary',
          },
        ]}
      />
      <AdminMappingPaymentConfirmModal
        isOpen={paymentModalOpen}
        mapping={createdMappingSnapshot}
        onClose={() => setPaymentModalOpen(false)}
        onSuccess={() => {
          setPaymentModalOpen(false);
          finishToMappingsTab();
        }}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
  },
  pickerRow: {
    borderWidth: 1,
    borderRadius: 12,
    padding: 14,
    marginBottom: 10,
  },
  fieldLabel: {
    fontSize: 13,
    marginTop: 12,
    marginBottom: 6,
  },
  input: {
    borderWidth: 1,
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 15,
  },
  multiline: {
    minHeight: 72,
    textAlignVertical: 'top',
  },
  chipWrap: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginTop: 4,
  },
  chip: {
    borderWidth: 1,
    borderRadius: 20,
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  primaryBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: ADMIN_MIN_TOUCH_TARGET,
    paddingVertical: 14,
    borderRadius: 12,
  },
  outlineBtn: {
    backgroundColor: 'transparent',
    borderWidth: 1,
  },
  tertiaryBtn: {
    alignItems: 'center',
    paddingVertical: 12,
  },
});
