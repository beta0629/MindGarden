/**
 * Apple G1.2 UGC (P2-C) — 신고 하단 시트 (Expo).
 *
 * <p>디자이너 시안 §B 신고 시트 강화. 사유 8종 → **5종**(`OBSCENE`/`HARASSMENT`/`SPAM`/`SELF_HARM`/`OTHER`)
 * 으로 단순화 + 24h 검토 InfoBanner + 완료 모달 노출.</p>
 *
 * @author MindGarden
 * @since 2026-06-07
 */
import { useState } from 'react';
import {
  ActivityIndicator,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { Flag } from 'lucide-react-native';

import { InfoBanner } from '@/components/molecules/InfoBanner';
import { UnifiedModal } from '@/components/common/modals/UnifiedModal';
import { UGC_REVIEW_SLA_COPY } from '@/constants/eulaTerms';
import {
  createRemoteCommunityReport,
  type CommunityReportReasonCodeDto,
} from '@/services/communityApi';
import { useTheme } from '@/theme';

const DETAIL_MAX = 200;
const SELF_HARM_ICON_SIZE = 16;

/**
 * P2-C 시안 §B.4.2 — 신고 사유 5종.
 *
 * `SELF_HARM` row 는 우측 끝에 위험 깃발(`Flag`) 아이콘을 노출한다.
 */
const REASONS: ReadonlyArray<{
  readonly code: CommunityReportReasonCodeDto;
  readonly label: string;
  readonly emphasize?: boolean;
}> = [
  { code: 'OBSCENE', label: '음란·외설 콘텐츠' },
  { code: 'HARASSMENT', label: '폭력·혐오·괴롭힘' },
  { code: 'SPAM', label: '사기·스팸·광고' },
  { code: 'SELF_HARM', label: '자해·자살 조장', emphasize: true },
  { code: 'OTHER', label: '기타 (직접 입력)' },
];

export type ReportBottomSheetProps = {
  readonly isOpen: boolean;
  readonly postId: number;
  readonly commentId?: number;
  readonly onClose: () => void;
  readonly onSubmitted?: () => void;
};

export function ReportBottomSheet({
  isOpen,
  postId,
  commentId,
  onClose,
  onSubmitted,
}: ReportBottomSheetProps) {
  const theme = useTheme();
  const [reasonCode, setReasonCode] = useState<CommunityReportReasonCodeDto | ''>('');
  const [detailMessage, setDetailMessage] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [submittedModalOpen, setSubmittedModalOpen] = useState(false);

  const reset = () => {
    setReasonCode('');
    setDetailMessage('');
    setSubmitting(false);
    setErrorMessage('');
  };

  const handleClose = () => {
    if (submitting) {
      return;
    }
    reset();
    onClose();
  };

  const handleSubmittedAck = () => {
    setSubmittedModalOpen(false);
    onSubmitted?.();
    reset();
    onClose();
  };

  const handleSubmit = async () => {
    if (!reasonCode) {
      setErrorMessage('신고 사유를 선택해 주세요.');
      return;
    }
    setSubmitting(true);
    setErrorMessage('');
    try {
      await createRemoteCommunityReport(postId, {
        reasonCode,
        detailMessage: detailMessage.trim() || undefined,
        commentId,
      });
      setSubmitting(false);
      setSubmittedModalOpen(true);
    } catch (err) {
      const message =
        (err as { message?: string })?.message ?? '신고 접수에 실패했습니다.';
      setErrorMessage(message);
      setSubmitting(false);
    }
  };

  return (
    <>
      <UnifiedModal
        isOpen={isOpen && !submittedModalOpen}
        onClose={handleClose}
        title="신고하기"
        subtitle="어떤 점이 문제인가요?"
        backdropClick={!submitting}
        actions={[
          {
            label: '취소',
            onPress: handleClose,
            variant: 'secondary',
            disabled: submitting,
          },
          {
            label: submitting ? '제출 중...' : '신고 제출',
            onPress: handleSubmit,
            variant: 'primary',
            disabled: submitting || !reasonCode,
          },
        ]}
      >
        <View style={styles.body}>
          <InfoBanner
            message={UGC_REVIEW_SLA_COPY.reportInfoBanner}
            testID="report-bottom-sheet-info-banner"
          />

          <View>
            {REASONS.map((reason) => {
              const selected = reasonCode === reason.code;
              return (
                <Pressable
                  key={reason.code}
                  accessibilityRole="radio"
                  accessibilityState={{ selected }}
                  onPress={() => setReasonCode(reason.code)}
                  disabled={submitting}
                  testID={`report-bottom-sheet-reason-${reason.code}`}
                  style={[
                    styles.reasonRow,
                    {
                      borderColor: selected ? theme.colors.primary : theme.colors.gray[200],
                      backgroundColor: selected ? theme.colors.bgSub : theme.colors.surface,
                    },
                  ]}
                >
                  <Text
                    style={[
                      styles.reasonLabel,
                      { color: selected ? theme.colors.primary : theme.colors.textMain },
                    ]}
                  >
                    {reason.label}
                  </Text>
                  {reason.emphasize ? (
                    <Flag size={SELF_HARM_ICON_SIZE} color={theme.colors.error} />
                  ) : null}
                </Pressable>
              );
            })}
          </View>

          <View style={styles.detailGroup}>
            <Text style={[styles.detailLabel, { color: theme.colors.textMain }]}>
              상세 설명 (선택, 최대 {DETAIL_MAX}자)
            </Text>
            <TextInput
              value={detailMessage}
              onChangeText={(value) => setDetailMessage(value.slice(0, DETAIL_MAX))}
              editable={!submitting}
              multiline
              maxLength={DETAIL_MAX}
              placeholder="신고 사유를 자세히 적어 주세요. (선택)"
              placeholderTextColor={theme.colors.textTertiary}
              style={[
                styles.detailInput,
                {
                  borderColor: theme.colors.gray[200],
                  color: theme.colors.textMain,
                },
              ]}
              testID="report-bottom-sheet-detail"
            />
            <Text style={[styles.detailCounter, { color: theme.colors.textTertiary }]}>
              {detailMessage.length} / {DETAIL_MAX}
            </Text>
          </View>

          {errorMessage.length > 0 && (
            <Text accessibilityRole="alert" style={[styles.error, { color: theme.colors.error }]}>
              {errorMessage}
            </Text>
          )}

          {submitting && (
            <ActivityIndicator
              color={theme.colors.primary}
              style={styles.spinner}
              accessibilityLabel="신고 제출 중"
            />
          )}
        </View>
      </UnifiedModal>

      <UnifiedModal
        isOpen={submittedModalOpen}
        onClose={handleSubmittedAck}
        title={UGC_REVIEW_SLA_COPY.reportSubmittedTitle}
        subtitle={UGC_REVIEW_SLA_COPY.reportSubmittedBody}
        showCloseButton={false}
        actions={[
          {
            label: '확인',
            onPress: handleSubmittedAck,
            variant: 'primary',
          },
        ]}
      />
    </>
  );
}

const styles = StyleSheet.create({
  body: {
    gap: 12,
  },
  reasonRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 14,
    paddingVertical: 12,
    borderRadius: 12,
    borderWidth: 1,
    marginBottom: 8,
    minHeight: 44,
  },
  reasonLabel: {
    fontSize: 15,
    lineHeight: 22,
  },
  detailGroup: {
    marginTop: 8,
  },
  detailLabel: {
    fontSize: 13,
    marginBottom: 6,
  },
  detailInput: {
    borderWidth: 1,
    borderRadius: 10,
    padding: 10,
    minHeight: 80,
    textAlignVertical: 'top',
  },
  detailCounter: {
    marginTop: 4,
    fontSize: 12,
    textAlign: 'right',
  },
  error: {
    fontSize: 13,
  },
  spinner: {
    marginTop: 4,
  },
});

export default ReportBottomSheet;
