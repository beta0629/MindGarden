/**
 * 어드민·스태프 — 일정 등록 4스텝 폼
 *
 * @author MindGarden
 * @since 2026-05-18
 */
import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  FlatList,
  Pressable,
  ScrollView,
  StyleSheet,
  Switch,
  Text,
  TextInput,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { addDays, format, parseISO } from 'date-fns';
import { useLocalSearchParams, useRouter, type Href } from 'expo-router';
import { ChevronLeft, ChevronRight } from 'lucide-react-native';
import { useTheme } from '@/theme';
import { AppTopBar } from '@/components/templates/AppTopBar';
import { AdminWizardShell } from '@/components/templates/AdminWizardShell';
import { Badge } from '@/components/atoms/Badge';
import { EmptyState } from '@/components/atoms/EmptyState';
import { SearchBar } from '@/components/atoms/SearchBar';
import { UnifiedModal } from '@/components/common/modals/UnifiedModal';
import {
  getAdminCreateScheduleErrorMessage,
  useAdminCreateSchedule,
} from '@/api/hooks/useAdminCreateSchedule';
import {
  findAdminMappingById,
  useAdminMappings,
} from '@/api/hooks/useAdminMappings';
import {
  useAdminConsultantsWithVacation,
  useAdminConsultationTypeCodes,
  useAdminDurationCodes,
  useAdminMappingClientsByConsultant,
  type AdminConsultantVacationPickerItem,
  type AdminMappingClientPickerItem,
} from '@/api/hooks/useAdminSchedulePickers';
import {
  ADMIN_SCHEDULE_DEFAULTS,
  ADMIN_SCHEDULE_REGISTER_COPY,
} from '@/constants/adminScheduleRegisterCopy';
import { useAuthStore } from '@/stores/useAuthStore';
import {
  canRegisterConsultantOnMobile,
  isAdminMobileShellRole,
} from '@/utils/adminRole';
import {
  buildDefaultScheduleTitle,
  computeEndTimeFromDuration,
  resolveDurationMinutes,
} from '@/utils/adminScheduleCreateBody';
import { AdminConsultantDayScheduleList } from '@/components/molecules/AdminConsultantDayScheduleList';
import { AdminScheduleSelectionSummary } from '@/components/molecules/AdminScheduleSelectionSummary';
import { AdminScheduleTimeSlotPicker } from '@/components/molecules/AdminScheduleTimeSlotPicker';
import {
  occupiedRangesFromConsultantSchedules,
  useConsultantSchedulesByDate,
} from '@/api/hooks/useConsultantSchedulesByDate';
import { normalizeConsultantDaySchedulesFromItems } from '@/utils/adminConsultantDayScheduleNormalize';
import { validateAdminScheduleTimeSelection } from '@/utils/scheduleTimeSlotConflict';
import { toDisplayString } from '@/utils/safeDisplay';

const TOTAL_STEPS = 4;

type SearchParams = {
  consultantId?: string;
  clientId?: string;
  step?: string;
  dateYmd?: string;
  // Sprint 1b: mappingId prefill from integrated schedule
  mappingId?: string;
};

function parsePositiveId(raw: string | undefined): number | null {
  const n = Number(raw);
  return Number.isFinite(n) && n > 0 ? n : null;
}

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

export default function AdminScheduleCreateScreen() {
  const theme = useTheme();
  const router = useRouter();
  const params = useLocalSearchParams<SearchParams>();
  const storeRole = useAuthStore((s) => s.role);
  const accessToken = useAuthStore((s) => s.accessToken);
  const allowed = isAdminMobileShellRole(storeRole);
  const showConsultantCreateLink = canRegisterConsultantOnMobile(storeRole, accessToken);

  const preMappingId = parsePositiveId(params.mappingId);
  const preConsultantId = parsePositiveId(params.consultantId);
  const preClientId = parsePositiveId(params.clientId);
  const preStep = Math.min(
    TOTAL_STEPS,
    Math.max(
      1,
      Number(params.step) ||
        (preMappingId || (preConsultantId && preClientId) ? 3 : 1),
    ),
  );

  const [step, setStep] = useState(preStep);
  const [consultant, setConsultant] = useState<AdminConsultantVacationPickerItem | null>(null);
  const [client, setClient] = useState<AdminMappingClientPickerItem | null>(null);
  const [dateYmd, setDateYmd] = useState(
    typeof params.dateYmd === 'string' && params.dateYmd.length >= 10
      ? params.dateYmd.slice(0, 10)
      : format(new Date(), 'yyyy-MM-dd'),
  );
  const [startTime, setStartTime] = useState<string | null>(null);
  const [endTime, setEndTime] = useState<string | null>(null);
  const [durationCode, setDurationCode] = useState<string>(ADMIN_SCHEDULE_DEFAULTS.DURATION_CODE);
  const [consultationType, setConsultationType] = useState<string>(
    ADMIN_SCHEDULE_DEFAULTS.CONSULTATION_TYPE,
  );
  const [title, setTitle] = useState('');
  const [memo, setMemo] = useState('');
  const [tentative, setTentative] = useState(false);
  const [consultantSearch, setConsultantSearch] = useState('');
  const [clientSearch, setClientSearch] = useState('');
  const [errorModal, setErrorModal] = useState<string | null>(null);
  const [successOpen, setSuccessOpen] = useState(false);
  const [cancelOpen, setCancelOpen] = useState(false);

  const mappingsQuery = useAdminMappings({ enabled: preMappingId != null });
  const consultantsQuery = useAdminConsultantsWithVacation(dateYmd);
  const clientsQuery = useAdminMappingClientsByConsultant(consultant?.id ?? preConsultantId);
  const consultationTypesQuery = useAdminConsultationTypeCodes();
  const durationQuery = useAdminDurationCodes();
  const createMutation = useAdminCreateSchedule();

  const durationOptions = durationQuery.data ?? [];
  const durationMinutes = useMemo(
    () => resolveDurationMinutes(durationCode, durationOptions),
    [durationCode, durationOptions],
  );

  const existingSchedulesQuery = useConsultantSchedulesByDate(consultant?.id ?? null, dateYmd, {
    enabled: step >= 3,
  });
  const occupiedRanges = useMemo(
    () => occupiedRangesFromConsultantSchedules(existingSchedulesQuery.data ?? []),
    [existingSchedulesQuery.data],
  );

  const daySchedules = useMemo(
    () => normalizeConsultantDaySchedulesFromItems(existingSchedulesQuery.data ?? []),
    [existingSchedulesQuery.data],
  );

  useEffect(() => {
    if (!preMappingId || consultant) {
      return;
    }
    const mapping = findAdminMappingById(mappingsQuery.data ?? [], preMappingId);
    if (!mapping) {
      return;
    }
    setConsultant({
      id: mapping.consultantId,
      name: mapping.consultantName,
      email: '',
      isOnVacation: false,
      isActive: true,
    });
    setClient({
      id: mapping.clientId,
      name: mapping.clientName,
      email: '',
      phone: '',
    });
    setStep(3);
  }, [consultant, mappingsQuery.data, preMappingId]);

  useEffect(() => {
    const list = consultantsQuery.data ?? [];
    if (preConsultantId && !consultant) {
      const found = list.find((c) => c.id === preConsultantId);
      if (found) {
        setConsultant(found);
      }
    }
  }, [consultantsQuery.data, preConsultantId, consultant]);

  useEffect(() => {
    const list = clientsQuery.data ?? [];
    if (preClientId && !client) {
      const found = list.find((c) => c.id === preClientId);
      if (found) {
        setClient(found);
      }
    }
  }, [clientsQuery.data, preClientId, client]);

  useEffect(() => {
    if (consultant && client && title.trim() === '') {
      setTitle(buildDefaultScheduleTitle(consultant.name, client.name));
    }
  }, [consultant, client, title]);

  useEffect(() => {
    if (!startTime) {
      return;
    }
    const computed = computeEndTimeFromDuration(startTime, durationMinutes);
    if (computed) {
      setEndTime(computed);
    }
  }, [durationMinutes, startTime]);

  useEffect(() => {
    setStartTime(null);
    setEndTime(null);
  }, [consultant?.id, dateYmd]);

  useEffect(() => {
    if (!startTime || !endTime) {
      return;
    }
    const check = validateAdminScheduleTimeSelection(dateYmd, startTime, endTime, occupiedRanges);
    if (!check.ok) {
      setStartTime(null);
      setEndTime(null);
    }
  }, [dateYmd, durationMinutes, endTime, occupiedRanges, startTime]);

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
      return ADMIN_SCHEDULE_REGISTER_COPY.STEP_CONSULTANT;
    }
    if (step === 2) {
      return ADMIN_SCHEDULE_REGISTER_COPY.STEP_CLIENT;
    }
    if (step === 3) {
      return ADMIN_SCHEDULE_REGISTER_COPY.STEP_DATETIME;
    }
    return ADMIN_SCHEDULE_REGISTER_COPY.STEP_DETAILS;
  }, [step]);

  const handleCloseSuccess = useCallback(() => {
    setSuccessOpen(false);
    router.replace({
      pathname: '/(admin)/(operation)/schedule',
      params: { dateYmd },
    } as Href);
  }, [dateYmd, router]);

  const submit = useCallback(async () => {
    if (!consultant) {
      setErrorModal(ADMIN_SCHEDULE_REGISTER_COPY.VALIDATION_PICK_CONSULTANT);
      return;
    }
    if (!client) {
      setErrorModal(ADMIN_SCHEDULE_REGISTER_COPY.VALIDATION_PICK_CLIENT);
      return;
    }
    if (!dateYmd || !startTime || !endTime) {
      setErrorModal(ADMIN_SCHEDULE_REGISTER_COPY.VALIDATION_DATETIME);
      return;
    }
    const timeCheck = validateAdminScheduleTimeSelection(
      dateYmd,
      startTime,
      endTime,
      occupiedRanges,
    );
    if (!timeCheck.ok) {
      if (timeCheck.reason === 'past') {
        setErrorModal(ADMIN_SCHEDULE_REGISTER_COPY.VALIDATION_TIME_PAST);
      } else {
        setErrorModal(ADMIN_SCHEDULE_REGISTER_COPY.VALIDATION_TIME_CONFLICT);
      }
      return;
    }
    try {
      await createMutation.mutateAsync({
        consultantId: consultant.id,
        clientId: client.id,
        dateYmd,
        startTime,
        endTime,
        title: title.trim() || buildDefaultScheduleTitle(consultant.name, client.name),
        description: memo,
        consultationType,
        tentativeBeforeDeposit: tentative,
      });
      setSuccessOpen(true);
    } catch (err) {
      const msg = getAdminCreateScheduleErrorMessage(err);
      setErrorModal(msg);
    }
  }, [
    client,
    consultationType,
    consultant,
    createMutation,
    dateYmd,
    endTime,
    memo,
    occupiedRanges,
    startTime,
    tentative,
    title,
  ]);

  const openCreateConsultant = useCallback(() => {
    router.push({
      pathname: '/(admin)/(operation)/user-management/create-consultant',
      params: {
        returnPath: '/(admin)/(operation)/schedule/create',
        dateYmd,
      },
    } as Href);
  }, [dateYmd, router]);

  const openCreateClient = useCallback(() => {
    router.push({
      pathname: '/(admin)/(operation)/user-management/create-client',
      params: {
        returnPath: '/(admin)/(operation)/schedule/create',
        consultantId: String(consultant?.id ?? preConsultantId ?? ''),
        dateYmd,
      },
    } as Href);
  }, [consultant?.id, dateYmd, preConsultantId, router]);

  if (!allowed) {
    return (
      <SafeAreaView style={[styles.safe, { backgroundColor: theme.colors.bgMain }]} edges={['top']}>
        <AppTopBar title={ADMIN_SCHEDULE_REGISTER_COPY.CREATE_TITLE} canGoBack />
        <EmptyState title={ADMIN_SCHEDULE_REGISTER_COPY.ERROR_TITLE} />
      </SafeAreaView>
    );
  }

  const renderPickerRow = (
    label: string,
    selected: boolean,
    onPress: () => void,
    badges?: React.ReactNode,
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
      {badges}
    </Pressable>
  );

  return (
    <SafeAreaView style={[styles.safe, { backgroundColor: theme.colors.bgMain }]} edges={['top']}>
      <AppTopBar title={ADMIN_SCHEDULE_REGISTER_COPY.CREATE_TITLE} canGoBack />
      <AdminWizardShell
        currentStep={step}
        totalSteps={TOTAL_STEPS}
        stepOfText={ADMIN_SCHEDULE_REGISTER_COPY.STEP_OF(step, TOTAL_STEPS)}
        stepTitle={stepTitle}
        leftAction={
          step > 1
            ? {
                label: ADMIN_SCHEDULE_REGISTER_COPY.PREV,
                onPress: () => setStep(step - 1),
              }
            : undefined
        }
        rightAction={{
          label:
            step < TOTAL_STEPS
              ? ADMIN_SCHEDULE_REGISTER_COPY.NEXT
              : ADMIN_SCHEDULE_REGISTER_COPY.SUBMIT,
          loading: step === TOTAL_STEPS && createMutation.isPending,
          disabled: step === TOTAL_STEPS && createMutation.isPending,
          onPress: () => {
            if (step < TOTAL_STEPS) {
              if (step === 1 && !consultant) {
                setErrorModal(ADMIN_SCHEDULE_REGISTER_COPY.VALIDATION_PICK_CONSULTANT);
                return;
              }
              if (step === 2 && !client) {
                setErrorModal(ADMIN_SCHEDULE_REGISTER_COPY.VALIDATION_PICK_CLIENT);
                return;
              }
              if (step === 3 && (!startTime || !endTime)) {
                setErrorModal(ADMIN_SCHEDULE_REGISTER_COPY.VALIDATION_DATETIME);
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
            placeholder={ADMIN_SCHEDULE_REGISTER_COPY.SEARCH_CONSULTANT}
          />
          <FlatList
            data={filteredConsultants}
            keyExtractor={(item) => String(item.id)}
            contentContainerStyle={{ paddingBottom: 120 }}
            ListEmptyComponent={
              <EmptyState title={ADMIN_SCHEDULE_REGISTER_COPY.EMPTY_CONSULTANTS} />
            }
            renderItem={({ item }) =>
              renderPickerRow(
                toDisplayString(item.name, '—'),
                consultant?.id === item.id,
                () => {
                  setConsultant(item);
                  setStep(2);
                },
                <View style={styles.badgeRow}>
                  {!item.isActive ? (
                    <Badge label={ADMIN_SCHEDULE_REGISTER_COPY.INACTIVE_BADGE} variant="gray" />
                  ) : null}
                  {item.isOnVacation ? (
                    <Badge label={ADMIN_SCHEDULE_REGISTER_COPY.VACATION_BADGE} variant="warning" />
                  ) : null}
                </View>,
              )
            }
          />
          {showConsultantCreateLink ? (
            <Pressable onPress={openCreateConsultant} style={styles.inlineLink}>
              <Text style={{ color: theme.colors.primary, fontFamily: theme.fontFamily.medium }}>
                {ADMIN_SCHEDULE_REGISTER_COPY.LINK_CREATE_CONSULTANT}
              </Text>
            </Pressable>
          ) : null}
        </View>
      ) : null}

      {step === 2 ? (
        <View style={{ flex: 1, paddingHorizontal: theme.spacing.lg, paddingTop: theme.spacing.md }}>
          <SearchBar
            value={clientSearch}
            onChangeText={setClientSearch}
            placeholder={ADMIN_SCHEDULE_REGISTER_COPY.SEARCH_CLIENT}
          />
          <FlatList
            data={filteredClients}
            keyExtractor={(item) => String(item.id)}
            contentContainerStyle={{ paddingBottom: 120 }}
            ListEmptyComponent={
              <EmptyState title={ADMIN_SCHEDULE_REGISTER_COPY.EMPTY_CLIENTS} />
            }
            renderItem={({ item }) =>
              renderPickerRow(
                toDisplayString(item.name, '—'),
                client?.id === item.id,
                () => {
                  setClient(item);
                  setStep(3);
                },
              )
            }
          />
          <Pressable onPress={openCreateClient} style={styles.inlineLink}>
            <Text style={{ color: theme.colors.primary, fontFamily: theme.fontFamily.medium }}>
              {ADMIN_SCHEDULE_REGISTER_COPY.LINK_CREATE_CLIENT}
            </Text>
          </Pressable>
        </View>
      ) : null}

      {step === 3 || step === 4 ? (
        <ScrollView
          contentContainerStyle={{
            paddingHorizontal: theme.spacing.lg,
            paddingTop: theme.spacing.md,
            paddingBottom: 120,
          }}
        >
          {step === 3 ? (
            <>
              <Text style={[styles.fieldLabel, { color: theme.colors.textSecondary }]}>
                {ADMIN_SCHEDULE_REGISTER_COPY.LABEL_DATE}
              </Text>
              <View style={styles.dateRow}>
                <Pressable
                  onPress={() => {
                    try {
                      setDateYmd(format(addDays(parseISO(dateYmd), -1), 'yyyy-MM-dd'));
                    } catch {
                      /* keep */
                    }
                  }}
                  style={styles.dateNavBtn}
                >
                  <ChevronLeft size={20} color={theme.colors.textSecondary} />
                </Pressable>
                <TextInput
                  value={dateYmd}
                  onChangeText={setDateYmd}
                  style={[
                    styles.input,
                    {
                      flex: 1,
                      borderColor: theme.colors.divider,
                      color: theme.colors.textMain,
                      fontFamily: theme.fontFamily.regular,
                    },
                  ]}
                  placeholder="YYYY-MM-DD"
                  placeholderTextColor={theme.colors.textTertiary}
                />
                <Pressable
                  onPress={() => {
                    try {
                      setDateYmd(format(addDays(parseISO(dateYmd), 1), 'yyyy-MM-dd'));
                    } catch {
                      /* keep */
                    }
                  }}
                  style={styles.dateNavBtn}
                >
                  <ChevronRight size={20} color={theme.colors.textSecondary} />
                </Pressable>
              </View>
              <AdminConsultantDayScheduleList
                schedules={daySchedules}
                isLoading={existingSchedulesQuery.isLoading}
                isError={existingSchedulesQuery.isError}
                onRetry={() => void existingSchedulesQuery.refetch()}
              />
              <Text style={[styles.fieldLabel, { color: theme.colors.textSecondary, marginTop: 16 }]}>
                {ADMIN_SCHEDULE_REGISTER_COPY.LABEL_DURATION}
              </Text>
              <View style={styles.chipWrap}>
                {durationOptions.map((opt) => (
                  <Pressable
                    key={opt.value}
                    onPress={() => {
                      setDurationCode(opt.value);
                      setStartTime(null);
                      setEndTime(null);
                    }}
                    style={[
                      styles.chip,
                      {
                        borderColor:
                          durationCode === opt.value ? theme.colors.primary : theme.colors.divider,
                        backgroundColor: theme.colors.surface,
                      },
                    ]}
                  >
                    <Text style={{ color: theme.colors.textMain, fontFamily: theme.fontFamily.medium }}>
                      {opt.label}
                    </Text>
                  </Pressable>
                ))}
              </View>
              <Text style={[styles.fieldLabel, { color: theme.colors.textSecondary, marginTop: 16 }]}>
                {ADMIN_SCHEDULE_REGISTER_COPY.LABEL_TIME_SLOTS}
              </Text>
              <AdminScheduleTimeSlotPicker
                consultantId={consultant?.id ?? null}
                dateYmd={dateYmd}
                durationMinutes={durationMinutes}
                selectedStartTime={startTime}
                onSelectStartTime={(start, end) => {
                  setStartTime(start);
                  setEndTime(end);
                }}
                schedules={existingSchedulesQuery.data ?? []}
                schedulesLoading={existingSchedulesQuery.isLoading}
                schedulesError={existingSchedulesQuery.isError}
                onSchedulesRetry={() => void existingSchedulesQuery.refetch()}
              />
              <AdminScheduleSelectionSummary startTime={startTime} endTime={endTime} />
            </>
          ) : null}

          {step === 4 ? (
            <>
              <Text style={[styles.fieldLabel, { color: theme.colors.textSecondary }]}>
                {ADMIN_SCHEDULE_REGISTER_COPY.LABEL_CONSULTATION_TYPE}
              </Text>
              <View style={styles.chipWrap}>
                {(consultationTypesQuery.data ?? []).map((opt) => (
                  <Pressable
                    key={opt.value}
                    onPress={() => setConsultationType(opt.value)}
                    style={[
                      styles.chip,
                      {
                        borderColor:
                          consultationType === opt.value
                            ? theme.colors.primary
                            : theme.colors.divider,
                        backgroundColor: theme.colors.surface,
                      },
                    ]}
                  >
                    <Text style={{ color: theme.colors.textMain, fontFamily: theme.fontFamily.medium }}>
                      {opt.label}
                    </Text>
                  </Pressable>
                ))}
              </View>
              <Text style={[styles.fieldLabel, { color: theme.colors.textSecondary, marginTop: 8 }]}>
                {ADMIN_SCHEDULE_REGISTER_COPY.LABEL_START_TIME}:{' '}
                {toDisplayString(startTime, '—')} · {ADMIN_SCHEDULE_REGISTER_COPY.LABEL_END_TIME}:{' '}
                {toDisplayString(endTime, '—')}
              </Text>
              <Text style={[styles.fieldLabel, { color: theme.colors.textSecondary, marginTop: 16 }]}>
                {ADMIN_SCHEDULE_REGISTER_COPY.LABEL_TITLE}
              </Text>
              <TextInput
                value={title}
                onChangeText={setTitle}
                style={[
                  styles.input,
                  {
                    borderColor: theme.colors.divider,
                    color: theme.colors.textMain,
                    fontFamily: theme.fontFamily.regular,
                  },
                ]}
                placeholderTextColor={theme.colors.textTertiary}
              />
              <Text style={[styles.fieldLabel, { color: theme.colors.textSecondary, marginTop: 16 }]}>
                {ADMIN_SCHEDULE_REGISTER_COPY.LABEL_MEMO}
              </Text>
              <TextInput
                value={memo}
                onChangeText={setMemo}
                multiline
                style={[
                  styles.input,
                  styles.textArea,
                  {
                    borderColor: theme.colors.divider,
                    color: theme.colors.textMain,
                    fontFamily: theme.fontFamily.regular,
                  },
                ]}
                placeholderTextColor={theme.colors.textTertiary}
              />
              <View style={[styles.toggleRow, { marginTop: theme.spacing.lg }]}>
                <Text style={{ color: theme.colors.textMain, fontFamily: theme.fontFamily.medium }}>
                  {ADMIN_SCHEDULE_REGISTER_COPY.TENTATIVE_TOGGLE}
                </Text>
                <Switch
                  value={tentative}
                  onValueChange={setTentative}
                  trackColor={{ false: theme.colors.gray[300], true: theme.colors.primary }}
                />
              </View>
            </>
          ) : null}
        </ScrollView>
      ) : null}
      </AdminWizardShell>

      <UnifiedModal
        isOpen={errorModal != null}
        onClose={() => setErrorModal(null)}
        title={ADMIN_SCHEDULE_REGISTER_COPY.ERROR_TITLE}
        actions={[{ label: '확인', onPress: () => setErrorModal(null), variant: 'primary' }]}
      >
        <Text style={{ color: theme.colors.textSecondary, fontFamily: theme.fontFamily.regular }}>
          {errorModal}
        </Text>
        {errorModal != null &&
        (errorModal.includes('회기') || errorModal.includes('매칭')) ? (
          <Text
            style={{
              marginTop: theme.spacing.sm,
              color: theme.colors.textTertiary,
              fontFamily: theme.fontFamily.regular,
              fontSize: theme.fontSize.sm,
            }}
          >
            {ADMIN_SCHEDULE_REGISTER_COPY.REFRESH_HINT}
          </Text>
        ) : null}
      </UnifiedModal>

      <UnifiedModal
        isOpen={successOpen}
        onClose={handleCloseSuccess}
        title={ADMIN_SCHEDULE_REGISTER_COPY.SUCCESS_TITLE}
        subtitle={ADMIN_SCHEDULE_REGISTER_COPY.SUCCESS_BODY}
        actions={[
          { label: '확인', onPress: handleCloseSuccess, variant: 'primary' },
        ]}
      />

      <UnifiedModal
        isOpen={cancelOpen}
        onClose={() => setCancelOpen(false)}
        title={ADMIN_SCHEDULE_REGISTER_COPY.CANCEL_CONFIRM_TITLE}
        actions={[
          {
            label: ADMIN_SCHEDULE_REGISTER_COPY.CANCEL,
            onPress: () => setCancelOpen(false),
            variant: 'secondary',
          },
          {
            label: '나가기',
            onPress: () => {
              setCancelOpen(false);
              router.back();
            },
            variant: 'danger',
          },
        ]}
      >
        <Text style={{ color: theme.colors.textSecondary, fontFamily: theme.fontFamily.regular }}>
          {ADMIN_SCHEDULE_REGISTER_COPY.CANCEL_CONFIRM_BODY}
        </Text>
      </UnifiedModal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1 },
  pickerRow: {
    borderWidth: 1,
    borderRadius: 12,
    padding: 14,
    marginBottom: 10,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  badgeRow: { flexDirection: 'row', gap: 6 },
  inlineLink: { paddingVertical: 12, alignItems: 'center' },
  fieldLabel: { fontSize: 13, marginBottom: 6 },
  input: {
    borderWidth: 1,
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 16,
  },
  textArea: { minHeight: 88, textAlignVertical: 'top' },
  dateRow: { flexDirection: 'row', alignItems: 'center' },
  dateNavBtn: { padding: 8 },
  chipWrap: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  chip: { borderWidth: 1, borderRadius: 8, paddingHorizontal: 12, paddingVertical: 8 },
  toggleRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
});
