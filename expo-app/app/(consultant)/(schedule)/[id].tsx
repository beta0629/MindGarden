/**
 * 스케줄 상세 화면
 * 내담자 정보, 상담 정보, 액션 버튼, 메모, 이전 이력
 *
 * @author MindGarden
 * @since 2026-05-12
 */
import { useCallback, useState } from 'react';
import type { ReactNode } from 'react';
import {
  View,
  Text,
  Pressable,
  ScrollView,
  TextInput,
  RefreshControl,
  StyleSheet,
  Platform,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useLocalSearchParams, useRouter } from 'expo-router';
import * as Haptics from 'expo-haptics';
import { ArrowLeft, Phone, MessageCircle } from 'lucide-react-native';
import { useTheme, type AppTheme } from '@/theme';
import {
  useScheduleDetail,
  useStartConsultation,
  useCompleteConsultation,
  type ScheduleDetail,
} from '@/api/hooks/useSchedules';
import { useConsultationRecordExistsForSchedule } from '@/api/hooks/useRecords';
import { CONSULTANT_SCHEDULE_DETAIL_COPY } from '@/constants/consultantScheduleDetailCopy';
import {
  canShowConsultantScheduleStartButton,
  getConsultantScheduleCardFooterHint,
} from '@/utils/consultantScheduleCardUi';
import { toApiMutationMessage } from '@/utils/safeDisplay';
import { Avatar } from '@/components/atoms/Avatar';
import { Badge } from '@/components/atoms/Badge';
import { SkeletonCard, SkeletonLoader } from '@/components/atoms/SkeletonLoader';

const STATUS_LABEL: Record<string, string> = {
  BOOKED: '예정',
  SCHEDULED: '예정',
  CONFIRMED: '예약확정',
  IN_PROGRESS: '진행중',
  COMPLETED: '완료',
  CANCELLED: '취소',
  NO_SHOW: '불참',
};

const STATUS_VARIANT: Record<string, 'info' | 'warning' | 'success' | 'gray' | 'error'> = {
  BOOKED: 'info',
  SCHEDULED: 'info',
  CONFIRMED: 'info',
  IN_PROGRESS: 'warning',
  COMPLETED: 'success',
  CANCELLED: 'gray',
  NO_SHOW: 'error',
};

interface ConsultantScheduleSessionActionContentProps {
  theme: AppTheme;
  canRunSessionActions: boolean;
  showStartButton: boolean;
  showCompleteButton: boolean;
  showWriteRecordBeforeComplete: boolean;
  scheduleStatus: string | undefined;
  recordExistsQueryLoading: boolean;
  startMutationPending: boolean;
  completeMutationPending: boolean;
  onStart: () => void;
  onComplete: () => void;
  onWriteRecord: () => void;
}

/**
 * 진행 중 스케줄의 시작·일지 확인·완료·일지 작성 CTA 분기
 */
function buildConsultantScheduleSessionActionContent(
  props: ConsultantScheduleSessionActionContentProps,
): ReactNode {
  const {
    theme,
    canRunSessionActions,
    showStartButton,
    showCompleteButton,
    showWriteRecordBeforeComplete,
    scheduleStatus,
    recordExistsQueryLoading,
    startMutationPending,
    completeMutationPending,
    onStart,
    onComplete,
    onWriteRecord,
  } = props;

  if (!canRunSessionActions) {
    return null;
  }
  if (showStartButton) {
    return (
      <Pressable
        onPress={onStart}
        disabled={startMutationPending}
        style={[
          styles.primaryButton,
          {
            backgroundColor: theme.colors.primary,
            borderRadius: theme.borderRadius.lg,
            paddingVertical: theme.spacing.md,
            opacity: startMutationPending ? 0.6 : 1,
          },
        ]}
        accessibilityRole="button"
        accessibilityLabel={CONSULTANT_SCHEDULE_DETAIL_COPY.START_BUTTON_A11Y}
      >
        <Text
          style={{
            color: theme.colors.textOnPrimary,
            fontFamily: theme.fontFamily.semibold,
            fontSize: theme.fontSize.base,
            textAlign: 'center',
          }}
        >
          {CONSULTANT_SCHEDULE_DETAIL_COPY.START_BUTTON}
        </Text>
      </Pressable>
    );
  }
  if (scheduleStatus === 'IN_PROGRESS' && recordExistsQueryLoading) {
    return (
      <View
        style={[styles.primaryButton, { minHeight: 48, justifyContent: 'center' }]}
        accessibilityRole="progressbar"
        accessibilityLabel={CONSULTANT_SCHEDULE_DETAIL_COPY.RECORD_EXISTENCE_CHECK_A11Y}
      >
        <SkeletonLoader
          height={48}
          style={{ width: '100%', borderRadius: theme.borderRadius.lg }}
        />
      </View>
    );
  }
  if (showCompleteButton) {
    return (
      <Pressable
        onPress={onComplete}
        disabled={completeMutationPending}
        style={[
          styles.primaryButton,
          {
            backgroundColor: theme.colors.success,
            borderRadius: theme.borderRadius.lg,
            paddingVertical: theme.spacing.md,
            opacity: completeMutationPending ? 0.6 : 1,
          },
        ]}
        accessibilityRole="button"
        accessibilityLabel={CONSULTANT_SCHEDULE_DETAIL_COPY.COMPLETE_BUTTON_A11Y}
      >
        <Text
          style={{
            color: theme.colors.textOnPrimary,
            fontFamily: theme.fontFamily.semibold,
            fontSize: theme.fontSize.base,
            textAlign: 'center',
          }}
        >
          {CONSULTANT_SCHEDULE_DETAIL_COPY.COMPLETE_BUTTON}
        </Text>
      </Pressable>
    );
  }
  if (showWriteRecordBeforeComplete) {
    return (
      <Pressable
        onPress={onWriteRecord}
        style={[
          styles.primaryButton,
          {
            backgroundColor: theme.colors.primary,
            borderRadius: theme.borderRadius.lg,
            paddingVertical: theme.spacing.md,
          },
        ]}
        accessibilityRole="button"
        accessibilityLabel={CONSULTANT_SCHEDULE_DETAIL_COPY.WRITE_RECORD_FOR_COMPLETE_CTA_A11Y}
      >
        <MessageCircle
          size={18}
          color={theme.colors.textOnPrimary}
          style={{ marginRight: theme.spacing.sm }}
        />
        <Text
          style={{
            color: theme.colors.textOnPrimary,
            fontFamily: theme.fontFamily.semibold,
            fontSize: theme.fontSize.base,
          }}
        >
          {CONSULTANT_SCHEDULE_DETAIL_COPY.WRITE_RECORD_FOR_COMPLETE_CTA}
        </Text>
      </Pressable>
    );
  }
  return null;
}

function canEditConsultantScheduleMemo(schedule: ScheduleDetail | undefined): boolean {
  if (!schedule) {
    return false;
  }
  const st = schedule.status;
  return st === 'BOOKED' || st === 'CONFIRMED' || st === 'SCHEDULED' || st === 'IN_PROGRESS';
}

function consultantScheduleStatusFooterText(
  schedule: ScheduleDetail | undefined,
): string | undefined {
  if (!schedule) {
    return undefined;
  }
  return getConsultantScheduleCardFooterHint(schedule).text;
}

interface RecordExistenceQuerySlice {
  data: boolean | undefined;
  isLoading: boolean;
}

function deriveConsultantScheduleSessionFlags(
  schedule: ScheduleDetail | undefined,
  recordExists: RecordExistenceQuerySlice,
) {
  const hasConsultationRecord = recordExists.data === true;
  const showCompleteButton = Boolean(
    schedule?.status === 'IN_PROGRESS' && hasConsultationRecord && !recordExists.isLoading,
  );
  const showWriteRecordBeforeComplete = Boolean(
    schedule?.status === 'IN_PROGRESS' && !recordExists.isLoading && !hasConsultationRecord,
  );
  const showStartButton = schedule ? canShowConsultantScheduleStartButton(schedule) : false;
  const canRunSessionActions = showStartButton || schedule?.status === 'IN_PROGRESS';
  return {
    showStartButton,
    hasConsultationRecord,
    showCompleteButton,
    showWriteRecordBeforeComplete,
    canRunSessionActions,
  };
}

export default function ConsultantScheduleDetail() {
  const theme = useTheme();
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();
  const [memo, setMemo] = useState('');

  const detailQuery = useScheduleDetail(id);
  const startMutation = useStartConsultation();
  const completeMutation = useCompleteConsultation();

  const schedule = detailQuery.data;
  const isLoading = detailQuery.isLoading;
  const recordExistsEnabled = Boolean(id && schedule?.status === 'IN_PROGRESS');
  const recordExistsQuery = useConsultationRecordExistsForSchedule(id, recordExistsEnabled);

  /** 예약·확정·진행 중일 때 메모 편집 허용 */
  const canEditMemo = canEditConsultantScheduleMemo(schedule);

  const {
    showStartButton,
    hasConsultationRecord,
    showCompleteButton,
    showWriteRecordBeforeComplete,
    canRunSessionActions,
  } = deriveConsultantScheduleSessionFlags(schedule, {
    data: recordExistsQuery.data,
    isLoading: recordExistsQuery.isLoading,
  });
  const statusFooterHint = consultantScheduleStatusFooterText(schedule);

  const onRefresh = useCallback(() => {
    detailQuery.refetch();
    if (recordExistsEnabled) {
      recordExistsQuery.refetch().catch(() => {
        /* 당겨서 새로고침 시 일지 존재 조회는 best-effort */
      });
    }
  }, [detailQuery, recordExistsEnabled, recordExistsQuery]);

  const handleStart = () => {
    if (!id) return;
    if (Platform.OS !== 'web') {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    }
    Alert.alert(
      CONSULTANT_SCHEDULE_DETAIL_COPY.START_ALERT_TITLE,
      CONSULTANT_SCHEDULE_DETAIL_COPY.START_ALERT_MESSAGE,
      [
        { text: CONSULTANT_SCHEDULE_DETAIL_COPY.START_ALERT_CANCEL, style: 'cancel' },
        {
          text: CONSULTANT_SCHEDULE_DETAIL_COPY.START_ALERT_CONFIRM,
          onPress: () =>
            startMutation.mutate(id, {
              onError: (err) => {
                Alert.alert(
                  CONSULTANT_SCHEDULE_DETAIL_COPY.START_ALERT_TITLE,
                  toApiMutationMessage(err),
                );
              },
            }),
        },
      ],
    );
  };

  const handleComplete = () => {
    if (!id || !hasConsultationRecord) return;
    if (Platform.OS !== 'web') {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    }
    Alert.alert(
      CONSULTANT_SCHEDULE_DETAIL_COPY.COMPLETE_ALERT_TITLE,
      CONSULTANT_SCHEDULE_DETAIL_COPY.COMPLETE_ALERT_MESSAGE,
      [
        { text: CONSULTANT_SCHEDULE_DETAIL_COPY.COMPLETE_ALERT_CANCEL, style: 'cancel' },
        {
          text: CONSULTANT_SCHEDULE_DETAIL_COPY.COMPLETE_ALERT_CONFIRM,
          onPress: () =>
            completeMutation.mutate(id, {
              onError: (err) => {
                Alert.alert(
                  CONSULTANT_SCHEDULE_DETAIL_COPY.COMPLETE_ALERT_TITLE,
                  toApiMutationMessage(err),
                );
              },
            }),
        },
      ],
    );
  };

  const handleNavigateWriteRecord = () => {
    if (!schedule?.id) return;
    if (Platform.OS !== 'web') {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
    router.push(`/(consultant)/(records)/create/${schedule.id}`);
  };

  const sessionActionInner = buildConsultantScheduleSessionActionContent({
    theme,
    canRunSessionActions,
    showStartButton,
    showCompleteButton,
    showWriteRecordBeforeComplete,
    scheduleStatus: schedule?.status,
    recordExistsQueryLoading: recordExistsQuery.isLoading,
    startMutationPending: startMutation.isPending,
    completeMutationPending: completeMutation.isPending,
    onStart: handleStart,
    onComplete: handleComplete,
    onWriteRecord: handleNavigateWriteRecord,
  });

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
          }}
        >
          {CONSULTANT_SCHEDULE_DETAIL_COPY.HEADER_TITLE}
        </Text>
      </View>

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={[styles.scrollContent, { padding: theme.spacing.lg }]}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={detailQuery.isFetching && !isLoading}
            onRefresh={onRefresh}
            tintColor={theme.colors.primary}
          />
        }
      >
        {isLoading && (
          <>
            <SkeletonCard />
            <SkeletonCard />
            <SkeletonLoader height={100} style={{ marginTop: 16 }} />
          </>
        )}
        {!isLoading && schedule && (
          <>
            {/* 내담자 정보 카드 */}
            <View
              style={[
                styles.card,
                {
                  backgroundColor: theme.colors.surface,
                  borderRadius: theme.borderRadius.xl,
                  padding: theme.spacing.lg,
                  ...theme.shadows.sm,
                },
              ]}
            >
              <View style={styles.clientRow}>
                <Avatar uri={schedule.clientProfileImageUrl} name={schedule.clientName} size="lg" />
                <View style={[styles.clientInfo, { marginLeft: theme.spacing.md }]}>
                  <Text
                    style={{
                      color: theme.colors.textMain,
                      fontFamily: theme.fontFamily.semibold,
                      fontSize: theme.fontSize.lg,
                    }}
                  >
                    {schedule.clientName} 님
                  </Text>
                  {schedule.contactNumber ? (
                    <View style={styles.contactRow}>
                      <Phone size={14} color={theme.colors.textSecondary} />
                      <Text
                        style={{
                          color: theme.colors.textSecondary,
                          fontFamily: theme.fontFamily.regular,
                          fontSize: theme.fontSize.sm,
                          marginLeft: theme.spacing.xs,
                        }}
                      >
                        {schedule.contactNumber}
                      </Text>
                    </View>
                  ) : null}
                </View>
              </View>
            </View>

            {/* 상담 정보 */}
            <View
              style={[
                styles.card,
                {
                  backgroundColor: theme.colors.surface,
                  borderRadius: theme.borderRadius.xl,
                  padding: theme.spacing.lg,
                  marginTop: theme.spacing.md,
                  ...theme.shadows.sm,
                },
              ]}
            >
              <View style={styles.infoRow}>
                <Text
                  style={{
                    color: theme.colors.textSecondary,
                    fontFamily: theme.fontFamily.regular,
                    fontSize: theme.fontSize.sm,
                  }}
                >
                  날짜
                </Text>
                <Text
                  style={{
                    color: theme.colors.textMain,
                    fontFamily: theme.fontFamily.medium,
                    fontSize: theme.fontSize.sm,
                  }}
                >
                  {schedule.date}
                </Text>
              </View>
              <View style={[styles.infoRow, { marginTop: theme.spacing.md }]}>
                <Text
                  style={{
                    color: theme.colors.textSecondary,
                    fontFamily: theme.fontFamily.regular,
                    fontSize: theme.fontSize.sm,
                  }}
                >
                  시간
                </Text>
                <Text
                  style={{
                    color: theme.colors.textMain,
                    fontFamily: theme.fontFamily.medium,
                    fontSize: theme.fontSize.sm,
                  }}
                >
                  {schedule.startTime} - {schedule.endTime}
                </Text>
              </View>
              {schedule.location ? (
                <View style={[styles.infoRow, { marginTop: theme.spacing.md }]}>
                  <Text
                    style={{
                      color: theme.colors.textSecondary,
                      fontFamily: theme.fontFamily.regular,
                      fontSize: theme.fontSize.sm,
                    }}
                  >
                    장소
                  </Text>
                  <Text
                    style={{
                      color: theme.colors.textMain,
                      fontFamily: theme.fontFamily.medium,
                      fontSize: theme.fontSize.sm,
                    }}
                  >
                    {schedule.location}
                  </Text>
                </View>
              ) : null}
              <View style={[styles.infoRow, { marginTop: theme.spacing.md }]}>
                <Text
                  style={{
                    color: theme.colors.textSecondary,
                    fontFamily: theme.fontFamily.regular,
                    fontSize: theme.fontSize.sm,
                  }}
                >
                  상태
                </Text>
                <Badge
                  variant={STATUS_VARIANT[schedule.status] ?? 'info'}
                  label={STATUS_LABEL[schedule.status] ?? String(schedule.status)}
                />
              </View>
              {statusFooterHint ? (
                <Text
                  style={{
                    color: theme.colors.warning,
                    fontFamily: theme.fontFamily.medium,
                    fontSize: theme.fontSize.xs,
                    marginTop: theme.spacing.sm,
                  }}
                >
                  {statusFooterHint}
                </Text>
              ) : null}
              <View style={[styles.infoRow, { marginTop: theme.spacing.md }]}>
                <Text
                  style={{
                    color: theme.colors.textSecondary,
                    fontFamily: theme.fontFamily.regular,
                    fontSize: theme.fontSize.sm,
                  }}
                >
                  유형
                </Text>
                <Text
                  style={{
                    color: theme.colors.textMain,
                    fontFamily: theme.fontFamily.medium,
                    fontSize: theme.fontSize.sm,
                  }}
                >
                  {schedule.consultationType}
                  {schedule.sessionNumber ? ` (${schedule.sessionNumber}회차)` : ''}
                </Text>
              </View>
            </View>

            {/* 액션 버튼 — 예약·확정·슬롯 유효 시 시작, 진행 중·일지 유무에 따라 완료 또는 일지 작성 */}
            {canRunSessionActions ? (
              <View style={[styles.actionRow, { marginTop: theme.spacing.lg }]}>
                {sessionActionInner}
              </View>
            ) : null}

            {/* 상담 메모 */}
            <Text
              style={{
                color: theme.colors.textMain,
                fontFamily: theme.fontFamily.semibold,
                fontSize: theme.fontSize.lg,
                marginTop: theme.spacing['2xl'],
              }}
            >
              상담 메모
            </Text>
            {canEditMemo ? (
              <TextInput
                style={[
                  styles.memoInput,
                  {
                    backgroundColor: theme.colors.surface,
                    borderColor: theme.colors.border,
                    borderRadius: theme.borderRadius.lg,
                    color: theme.colors.textMain,
                    fontFamily: theme.fontFamily.regular,
                    fontSize: theme.fontSize.sm,
                    padding: theme.spacing.md,
                    marginTop: theme.spacing.md,
                  },
                ]}
                value={memo || schedule.memo || ''}
                onChangeText={setMemo}
                placeholder="상담 메모를 입력하세요..."
                placeholderTextColor={theme.colors.gray[400]}
                multiline
                textAlignVertical="top"
                accessibilityLabel="상담 메모"
              />
            ) : (
              <Text
                style={{
                  backgroundColor: theme.colors.surface,
                  borderColor: theme.colors.border,
                  borderWidth: 1,
                  borderRadius: theme.borderRadius.lg,
                  color: theme.colors.textSecondary,
                  fontFamily: theme.fontFamily.regular,
                  fontSize: theme.fontSize.sm,
                  padding: theme.spacing.md,
                  marginTop: theme.spacing.md,
                  minHeight: 100,
                }}
                accessibilityLabel="상담 메모 읽기 전용"
              >
                {schedule.memo?.trim()
                  ? schedule.memo
                  : '확정된 예약에서만 메모를 수정할 수 있습니다.'}
              </Text>
            )}

            {/* 이전 상담 이력 */}
            {schedule.previousSessions && schedule.previousSessions.length > 0 ? (
              <>
                <Text
                  style={{
                    color: theme.colors.textMain,
                    fontFamily: theme.fontFamily.semibold,
                    fontSize: theme.fontSize.lg,
                    marginTop: theme.spacing['2xl'],
                  }}
                >
                  이전 상담 이력
                </Text>
                {schedule.previousSessions.map((session) => (
                  <View
                    key={session.id}
                    style={[
                      styles.historyItem,
                      {
                        borderLeftColor: theme.colors.primary,
                        paddingLeft: theme.spacing.md,
                        marginTop: theme.spacing.md,
                      },
                    ]}
                  >
                    <Text
                      style={{
                        color: theme.colors.textMain,
                        fontFamily: theme.fontFamily.medium,
                        fontSize: theme.fontSize.sm,
                      }}
                    >
                      {session.date} {session.startTime}
                    </Text>
                    <Text
                      style={{
                        color: theme.colors.textSecondary,
                        fontFamily: theme.fontFamily.regular,
                        fontSize: theme.fontSize.xs,
                        marginTop: theme.spacing['2xs'],
                      }}
                    >
                      {session.consultationType}
                      {session.sessionNumber ? ` · ${session.sessionNumber}회차` : ''}
                    </Text>
                  </View>
                ))}
              </>
            ) : null}

            {/* 일지 작성 바로가기 */}
            {schedule.status === 'COMPLETED' && !schedule.hasRecord ? (
              <Pressable
                onPress={handleNavigateWriteRecord}
                style={[
                  styles.primaryButton,
                  {
                    backgroundColor: theme.colors.primary,
                    borderRadius: theme.borderRadius.lg,
                    paddingVertical: theme.spacing.md,
                    marginTop: theme.spacing.xl,
                  },
                ]}
                accessibilityRole="button"
                accessibilityLabel={
                  CONSULTANT_SCHEDULE_DETAIL_COPY.WRITE_RECORD_AFTER_COMPLETED_CTA_A11Y
                }
              >
                <MessageCircle
                  size={18}
                  color={theme.colors.textOnPrimary}
                  style={{ marginRight: theme.spacing.sm }}
                />
                <Text
                  style={{
                    color: theme.colors.textOnPrimary,
                    fontFamily: theme.fontFamily.semibold,
                    fontSize: theme.fontSize.base,
                  }}
                >
                  {CONSULTANT_SCHEDULE_DETAIL_COPY.WRITE_RECORD_AFTER_COMPLETED_CTA}
                </Text>
              </Pressable>
            ) : null}

            <View style={{ height: 32 }} />
          </>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
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
  card: {},
  clientRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  clientInfo: {
    flex: 1,
  },
  contactRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 4,
  },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  actionRow: {
    flexDirection: 'row',
    gap: 12,
  },
  primaryButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  memoInput: {
    minHeight: 100,
    borderWidth: 1,
  },
  historyItem: {
    borderLeftWidth: 2,
  },
});
