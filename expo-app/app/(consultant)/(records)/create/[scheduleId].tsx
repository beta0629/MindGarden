/**
 * 일지 작성 화면
 * 상담 정보 요약, 요약(공유), 전문가 메모(비공개), 태그, 다음 상담 제안
 *
 * @author MindGarden
 * @since 2026-05-12
 * @see docs/design-system/v2/CONSULTANT_CLIENT_SCREEN_WIREFRAMES.md §2
 */
import { useEffect, useState } from 'react';
import {
  View,
  Text,
  TextInput,
  Pressable,
  ScrollView,
  KeyboardAvoidingView,
  StyleSheet,
  Platform,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useLocalSearchParams, useRouter } from 'expo-router';
import * as Haptics from 'expo-haptics';
import { ArrowLeft } from 'lucide-react-native';
import { useTheme } from '@/theme';
import { useScheduleDetail } from '@/api/hooks/useSchedules';
import { useCreateRecord } from '@/api/hooks/useRecords';
import { Chip } from '@/components/atoms/Chip';
import { SkeletonLoader } from '@/components/atoms/SkeletonLoader';
import { CONSULTANT_RECORDS_COPY } from '@/constants/consultantRecordsCopy';
import { resolveSessionNumberFromSchedule } from '@/utils/consultationRecordSessionNumber';
import {
  extractConsultationRecordFieldErrors,
  findMissingConsultationRecordFields,
  resolveDefaultSessionDurationMinutes,
  type ConsultationRecordFieldErrors,
  type ConsultationRecordRequiredField,
} from '@/utils/consultationRecordCreateBody';
import { extractApiErrorMessage } from '@/utils/extractApiErrorMessage';

const TAG_OPTIONS = ['우울', '불안', '가족', '학업', '직장', '관계', '자아', '기타'];
const FIELD_LABELS = CONSULTANT_RECORDS_COPY.CREATE_FIELD_LABELS;
const FIELD_PLACEHOLDERS = CONSULTANT_RECORDS_COPY.CREATE_FIELD_PLACEHOLDERS;
const FIELD_ERRORS = CONSULTANT_RECORDS_COPY.CREATE_FIELD_ERRORS;

type RequiredTextField = 'mainIssues' | 'interventionMethods' | 'clientResponse' | 'progressEvaluation';

function parseDurationInput(raw: string): number | null {
  const trimmed = raw.trim();
  if (!trimmed) return null;
  const n = Number(trimmed);
  return Number.isFinite(n) ? n : null;
}

export default function ConsultantRecordCreate() {
  const theme = useTheme();
  const router = useRouter();
  const { scheduleId } = useLocalSearchParams<{ scheduleId: string }>();

  const scheduleQuery = useScheduleDetail(scheduleId);
  const createMutation = useCreateRecord();

  const schedule = scheduleQuery.data;

  const [summary, setSummary] = useState('');
  const [expertMemo, setExpertMemo] = useState('');
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [nextSessionMemo, setNextSessionMemo] = useState('');
  const [sessionDuration, setSessionDuration] = useState('');
  const [mainIssues, setMainIssues] = useState('');
  const [interventionMethods, setInterventionMethods] = useState('');
  const [clientResponse, setClientResponse] = useState('');
  const [riskAssessment, setRiskAssessment] = useState('');
  const [progressEvaluation, setProgressEvaluation] = useState('');
  const [fieldErrors, setFieldErrors] = useState<ConsultationRecordFieldErrors>({});

  const riskMissing = riskAssessment.trim() === '';
  const submitDisabled = createMutation.isPending || riskMissing;

  const clearFieldError = (field: ConsultationRecordRequiredField) => {
    setFieldErrors((prev) => {
      if (!prev[field]) return prev;
      const next = { ...prev };
      delete next[field];
      return next;
    });
  };

  const withClearError =
    (field: ConsultationRecordRequiredField, setter: (text: string) => void) => (text: string) => {
      setter(text);
      clearFieldError(field);
    };

  const requiredTextValues: Record<RequiredTextField, string> = {
    mainIssues,
    interventionMethods,
    clientResponse,
    progressEvaluation,
  };
  const requiredTextSetters: Record<RequiredTextField, (text: string) => void> = {
    mainIssues: setMainIssues,
    interventionMethods: setInterventionMethods,
    clientResponse: setClientResponse,
    progressEvaluation: setProgressEvaluation,
  };

  useEffect(() => {
    if (!schedule) return;
    setSessionDuration((prev) =>
      prev !== ''
        ? prev
        : String(resolveDefaultSessionDurationMinutes(schedule.startTime, schedule.endTime)),
    );
  }, [schedule]);

  const toggleTag = (tag: string) => {
    setSelectedTags((prev) =>
      prev.includes(tag) ? prev.filter((t) => t !== tag) : [...prev, tag],
    );
  };

  const handleSave = (status: 'DRAFT' | 'COMPLETED') => {
    if (Platform.OS !== 'web') {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    }

    const sessionDurationMinutes = parseDurationInput(sessionDuration);
    const missing = findMissingConsultationRecordFields({
      sessionDurationMinutes,
      clientCondition: summary,
      mainIssues,
      interventionMethods,
      clientResponse,
      riskAssessment,
      progressEvaluation,
    });
    if (missing.length > 0) {
      const localErrors: ConsultationRecordFieldErrors = {};
      for (const key of missing) {
        localErrors[key] = FIELD_ERRORS[key];
      }
      setFieldErrors(localErrors);
      Alert.alert(
        CONSULTANT_RECORDS_COPY.CREATE_REQUIRED_TITLE,
        CONSULTANT_RECORDS_COPY.CREATE_REQUIRED_MISSING_PREFIX +
          missing.map((key) => FIELD_LABELS[key]).join(', '),
      );
      return;
    }

    if (!schedule?.clientId || !schedule?.consultantId) {
      Alert.alert('알림', '스케줄 정보를 불러온 뒤 다시 시도해주세요.');
      return;
    }

    const sessionNumber = resolveSessionNumberFromSchedule(schedule);
    if (sessionNumber == null) {
      Alert.alert('알림', CONSULTANT_RECORDS_COPY.SESSION_NUMBER_REQUIRED);
      return;
    }

    setFieldErrors({});
    createMutation.mutate(
      {
        scheduleId: Number(scheduleId),
        sessionNumber,
        clientId: schedule.clientId,
        consultantId: schedule.consultantId,
        summary: summary.trim(),
        expertMemo: expertMemo.trim() || undefined,
        tags: selectedTags,
        nextSessionMemo: nextSessionMemo.trim() || undefined,
        status,
        sessionDurationMinutes,
        mainIssues,
        interventionMethods,
        clientResponse,
        riskAssessment,
        progressEvaluation,
      },
      {
        onSuccess: () => {
          Alert.alert(
            status === 'COMPLETED' ? '저장 완료' : '임시 저장',
            status === 'COMPLETED' ? '상담일지가 저장되었습니다.' : '임시 저장되었습니다.',
            [{ text: '확인', onPress: () => router.back() }],
          );
        },
        onError: (error) => {
          setFieldErrors(extractConsultationRecordFieldErrors(error));
          Alert.alert(
            '오류',
            extractApiErrorMessage(error, CONSULTANT_RECORDS_COPY.CREATE_SAVE_FAILED),
          );
        },
      },
    );
  };

  const renderSectionLabel = (label: string) => (
    <Text
      style={[
        styles.sectionLabel,
        {
          color: theme.colors.textMain,
          fontFamily: theme.fontFamily.semibold,
          fontSize: theme.fontSize.base,
          marginTop: theme.spacing.xl,
        },
      ]}
    >
      {label}
    </Text>
  );

  const renderFieldError = (field: ConsultationRecordRequiredField, fallback?: string) => {
    const message = fieldErrors[field] ?? fallback;
    if (!message) return null;
    return (
      <Text
        style={{
          color: theme.colors.error,
          fontFamily: theme.fontFamily.regular,
          fontSize: theme.fontSize.xs,
          marginTop: theme.spacing.xs,
        }}
        accessibilityLiveRegion="polite"
      >
        {message}
      </Text>
    );
  };

  const fieldBorderColor = (field: ConsultationRecordRequiredField) =>
    fieldErrors[field] ? theme.colors.error : theme.colors.border;

  const renderRequiredTextField = (field: RequiredTextField) => (
    <>
      {renderSectionLabel(FIELD_LABELS[field])}
      <TextInput
        style={[
          styles.textInput,
          {
            backgroundColor: theme.colors.surface,
            borderColor: fieldBorderColor(field),
            borderRadius: theme.borderRadius.lg,
            color: theme.colors.textMain,
            fontFamily: theme.fontFamily.regular,
            fontSize: theme.fontSize.sm,
            padding: theme.spacing.md,
            marginTop: theme.spacing.sm,
          },
        ]}
        value={requiredTextValues[field]}
        onChangeText={withClearError(field, requiredTextSetters[field])}
        placeholder={FIELD_PLACEHOLDERS[field]}
        placeholderTextColor={theme.colors.gray[400]}
        multiline
        textAlignVertical="top"
        accessibilityLabel={FIELD_LABELS[field]}
      />
      {renderFieldError(field)}
    </>
  );

  return (
    <SafeAreaView
      style={[styles.safeArea, { backgroundColor: theme.colors.bgMain }]}
      edges={['top']}
    >
      {/* 헤더 */}
      <View
        style={[
          styles.header,
          {
            paddingHorizontal: theme.spacing.lg,
            paddingVertical: theme.spacing.md,
            borderBottomColor: theme.colors.divider,
          },
        ]}
      >
        <Pressable
          onPress={() => router.back()}
          hitSlop={12}
          accessibilityRole="button"
          accessibilityLabel="뒤로가기"
        >
          <ArrowLeft size={24} color={theme.colors.textMain} />
        </Pressable>
        <Text
          style={{
            color: theme.colors.textMain,
            fontFamily: theme.fontFamily.semibold,
            fontSize: theme.fontSize.lg,
            marginLeft: theme.spacing.md,
            flex: 1,
          }}
        >
          일지 작성
        </Text>
      </View>

      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 88 : 0}
      >
        <ScrollView
          style={styles.scroll}
          contentContainerStyle={[styles.scrollContent, { padding: theme.spacing.lg }]}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          {/* 상담 정보 요약 */}
          {scheduleQuery.isLoading ? (
            <SkeletonLoader height={60} />
          ) : schedule ? (
            <View
              style={[
                styles.infoCard,
                {
                  backgroundColor: theme.colors.surfaceAlt,
                  borderRadius: theme.borderRadius.lg,
                  padding: theme.spacing.lg,
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
                {schedule.clientName} 님
              </Text>
              <Text
                style={{
                  color: theme.colors.textSecondary,
                  fontFamily: theme.fontFamily.regular,
                  fontSize: theme.fontSize.sm,
                  marginTop: theme.spacing.xs,
                }}
              >
                {schedule.date} · {schedule.startTime} - {schedule.endTime}
              </Text>
            </View>
          ) : null}

          {/* 요약 (공유) */}
          <Text
            style={[
              styles.sectionLabel,
              {
                color: theme.colors.textMain,
                fontFamily: theme.fontFamily.semibold,
                fontSize: theme.fontSize.base,
                marginTop: theme.spacing['2xl'],
              },
            ]}
          >
            상담 요약 (내담자에게 공유됨)
          </Text>
          <TextInput
            style={[
              styles.textInput,
              {
                backgroundColor: theme.colors.surface,
                borderColor: fieldBorderColor('clientCondition'),
                borderRadius: theme.borderRadius.lg,
                color: theme.colors.textMain,
                fontFamily: theme.fontFamily.regular,
                fontSize: theme.fontSize.sm,
                padding: theme.spacing.md,
                marginTop: theme.spacing.sm,
              },
            ]}
            value={summary}
            onChangeText={withClearError('clientCondition', setSummary)}
            placeholder="내담자에게 공유될 한 줄 요약을 입력하세요..."
            placeholderTextColor={theme.colors.gray[400]}
            multiline
            textAlignVertical="top"
            accessibilityLabel="상담 요약"
          />
          {renderFieldError('clientCondition')}

          {/* 전문가 메모 (비공개) */}
          <Text
            style={[
              styles.sectionLabel,
              {
                color: theme.colors.textMain,
                fontFamily: theme.fontFamily.semibold,
                fontSize: theme.fontSize.base,
                marginTop: theme.spacing.xl,
              },
            ]}
          >
            전문가 메모 (비공개)
          </Text>
          <TextInput
            style={[
              styles.textInputLarge,
              {
                backgroundColor: theme.colors.surface,
                borderColor: theme.colors.border,
                borderRadius: theme.borderRadius.lg,
                color: theme.colors.textMain,
                fontFamily: theme.fontFamily.regular,
                fontSize: theme.fontSize.sm,
                padding: theme.spacing.md,
                marginTop: theme.spacing.sm,
              },
            ]}
            value={expertMemo}
            onChangeText={setExpertMemo}
            placeholder="상담사만 볼 수 있는 상세 메모를 입력하세요..."
            placeholderTextColor={theme.colors.gray[400]}
            multiline
            textAlignVertical="top"
            accessibilityLabel="전문가 메모"
          />

          {/* 서버·웹 공통 필수값 */}
          {renderSectionLabel(FIELD_LABELS.sessionDurationMinutes)}
          <TextInput
            style={[
              styles.numberInput,
              {
                backgroundColor: theme.colors.surface,
                borderColor: fieldBorderColor('sessionDurationMinutes'),
                borderRadius: theme.borderRadius.lg,
                color: theme.colors.textMain,
                fontFamily: theme.fontFamily.regular,
                fontSize: theme.fontSize.sm,
                padding: theme.spacing.md,
                marginTop: theme.spacing.sm,
              },
            ]}
            value={sessionDuration}
            onChangeText={withClearError('sessionDurationMinutes', setSessionDuration)}
            placeholder={FIELD_PLACEHOLDERS.sessionDurationMinutes}
            placeholderTextColor={theme.colors.gray[400]}
            keyboardType="number-pad"
            accessibilityLabel={FIELD_LABELS.sessionDurationMinutes}
          />
          {renderFieldError('sessionDurationMinutes')}
          {renderRequiredTextField('mainIssues')}
          {renderRequiredTextField('interventionMethods')}
          {renderRequiredTextField('clientResponse')}
          {renderSectionLabel(FIELD_LABELS.riskAssessment)}
          <View style={[styles.tagRow, { marginTop: theme.spacing.sm }]}>
            {CONSULTANT_RECORDS_COPY.CREATE_RISK_OPTIONS.map((option) => (
              <Chip
                key={option.value}
                label={option.label}
                selected={riskAssessment === option.value}
                onPress={() => {
                  setRiskAssessment((prev) => (prev === option.value ? '' : option.value));
                  clearFieldError('riskAssessment');
                }}
              />
            ))}
          </View>
          {renderFieldError('riskAssessment', riskMissing ? FIELD_ERRORS.riskAssessment : undefined)}
          {renderRequiredTextField('progressEvaluation')}

          {/* 태그 */}
          <Text
            style={[
              styles.sectionLabel,
              {
                color: theme.colors.textMain,
                fontFamily: theme.fontFamily.semibold,
                fontSize: theme.fontSize.base,
                marginTop: theme.spacing.xl,
              },
            ]}
          >
            태그 추가
          </Text>
          <View style={[styles.tagRow, { marginTop: theme.spacing.sm }]}>
            {TAG_OPTIONS.map((tag) => (
              <Chip
                key={tag}
                label={tag}
                selected={selectedTags.includes(tag)}
                onPress={() => toggleTag(tag)}
              />
            ))}
          </View>

          {/* 다음 상담 제안 */}
          <Text
            style={[
              styles.sectionLabel,
              {
                color: theme.colors.textMain,
                fontFamily: theme.fontFamily.semibold,
                fontSize: theme.fontSize.base,
                marginTop: theme.spacing.xl,
              },
            ]}
          >
            다음 상담 제안
          </Text>
          <TextInput
            style={[
              styles.textInput,
              {
                backgroundColor: theme.colors.surface,
                borderColor: theme.colors.border,
                borderRadius: theme.borderRadius.lg,
                color: theme.colors.textMain,
                fontFamily: theme.fontFamily.regular,
                fontSize: theme.fontSize.sm,
                padding: theme.spacing.md,
                marginTop: theme.spacing.sm,
              },
            ]}
            value={nextSessionMemo}
            onChangeText={setNextSessionMemo}
            placeholder="다음 상담에 대한 메모를 남겨주세요..."
            placeholderTextColor={theme.colors.gray[400]}
            multiline
            textAlignVertical="top"
            accessibilityLabel="다음 상담 제안 메모"
          />

          <View style={{ height: 100 }} />
        </ScrollView>

        {/* 하단 고정 버튼 */}
        <View
          style={[
            styles.bottomBar,
            {
              backgroundColor: theme.colors.surface,
              paddingHorizontal: theme.spacing.lg,
              paddingVertical: theme.spacing.md,
              borderTopColor: theme.colors.divider,
              ...theme.shadows.md,
            },
          ]}
        >
          <Pressable
            onPress={() => handleSave('DRAFT')}
            disabled={submitDisabled}
            style={[
              styles.secondaryButton,
              {
                borderColor: theme.colors.border,
                borderRadius: theme.borderRadius.lg,
                paddingVertical: theme.spacing.md,
                opacity: submitDisabled ? 0.6 : 1,
              },
            ]}
            accessibilityRole="button"
            accessibilityLabel="임시저장"
          >
            <Text
              style={{
                color: theme.colors.textMain,
                fontFamily: theme.fontFamily.semibold,
                fontSize: theme.fontSize.base,
                textAlign: 'center',
              }}
            >
              임시저장
            </Text>
          </Pressable>
          <View style={{ width: theme.spacing.md }} />
          <Pressable
            onPress={() => handleSave('COMPLETED')}
            disabled={submitDisabled}
            style={[
              styles.primaryButton,
              {
                backgroundColor: theme.colors.primary,
                borderRadius: theme.borderRadius.lg,
                paddingVertical: theme.spacing.md,
                opacity: submitDisabled ? 0.6 : 1,
              },
            ]}
            accessibilityRole="button"
            accessibilityLabel="저장"
          >
            <Text
              style={{
                color: theme.colors.textOnPrimary,
                fontFamily: theme.fontFamily.semibold,
                fontSize: theme.fontSize.base,
                textAlign: 'center',
              }}
            >
              저장
            </Text>
          </Pressable>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
  },
  flex: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  scroll: {
    flex: 1,
  },
  scrollContent: {},
  infoCard: {},
  sectionLabel: {},
  textInput: {
    borderWidth: 1,
    minHeight: 60,
  },
  textInputLarge: {
    borderWidth: 1,
    minHeight: 160,
  },
  numberInput: {
    borderWidth: 1,
  },
  tagRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  bottomBar: {
    flexDirection: 'row',
    borderTopWidth: StyleSheet.hairlineWidth,
  },
  secondaryButton: {
    flex: 1,
    borderWidth: 1,
    alignItems: 'center',
  },
  primaryButton: {
    flex: 1,
    alignItems: 'center',
  },
});
