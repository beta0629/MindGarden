/**
 * Apple T2 (1.2 UGC) — 사용자 차단 확인 시트 (Expo).
 *
 * <p>디자이너 핸드오프 §5.1 — 차단 효과 안내 + 취소/차단 액션. 차단은 단방향. 차단 사실은
 * 상대방에게 알리지 않는다. 차단 호출은 `blockRemoteCommunityUser` 를 사용한다.</p>
 *
 * @author MindGarden
 * @since 2026-06-07
 */
import { useState } from 'react';
import {
  ActivityIndicator,
  StyleSheet,
  Text,
  View,
} from 'react-native';

import { UnifiedModal } from '@/components/common/modals/UnifiedModal';
import { blockRemoteCommunityUser } from '@/services/communityApi';
import { useTheme } from '@/theme';

export type BlockConfirmSheetProps = {
  readonly isOpen: boolean;
  readonly userId: number | null;
  readonly displayName?: string;
  readonly onClose: () => void;
  readonly onBlocked?: (userId: number) => void;
};

const EFFECTS = [
  '이 사용자의 게시글과 댓글이 보이지 않습니다.',
  '마이페이지 > 차단 목록에서 언제든지 해제할 수 있습니다.',
  '차단 사실은 상대방에게 알려지지 않습니다.',
] as const;

export function BlockConfirmSheet({
  isOpen,
  userId,
  displayName,
  onClose,
  onBlocked,
}: BlockConfirmSheetProps) {
  const theme = useTheme();
  const [submitting, setSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  const handleClose = () => {
    if (submitting) {
      return;
    }
    setErrorMessage('');
    onClose();
  };

  const handleConfirm = async () => {
    if (!userId) {
      return;
    }
    setSubmitting(true);
    setErrorMessage('');
    try {
      await blockRemoteCommunityUser(userId);
      onBlocked?.(userId);
      setSubmitting(false);
      onClose();
    } catch (err) {
      const status = (err as { status?: number; response?: { status?: number } })?.status
        ?? (err as { response?: { status?: number } })?.response?.status;
      if (status === 409) {
        setErrorMessage('이미 차단된 사용자입니다.');
      } else {
        const message = (err as { message?: string })?.message ?? '차단 처리에 실패했습니다.';
        setErrorMessage(message);
      }
      setSubmitting(false);
    }
  };

  const title = `${displayName?.trim() || '사용자'}을(를) 차단하시겠습니까?`;

  return (
    <UnifiedModal
      isOpen={isOpen}
      onClose={handleClose}
      title={title}
      backdropClick={!submitting}
      actions={[
        {
          label: '취소',
          onPress: handleClose,
          variant: 'secondary',
          disabled: submitting,
        },
        {
          label: submitting ? '차단 중...' : '차단하기',
          onPress: handleConfirm,
          variant: 'danger',
          disabled: submitting || !userId,
        },
      ]}
    >
      <View style={styles.body}>
        {EFFECTS.map((effect) => (
          <View key={effect} style={styles.effectRow}>
            <View style={[styles.bullet, { backgroundColor: theme.colors.primary }]} />
            <Text style={[styles.effectLabel, { color: theme.colors.textSecondary }]}>
              {effect}
            </Text>
          </View>
        ))}

        {errorMessage.length > 0 && (
          <Text
            accessibilityRole="alert"
            style={[styles.error, { color: theme.colors.error }]}
            testID="block-confirm-sheet-error"
          >
            {errorMessage}
          </Text>
        )}

        {submitting && (
          <ActivityIndicator
            color={theme.colors.primary}
            style={styles.spinner}
            accessibilityLabel="차단 처리 중"
          />
        )}
      </View>
    </UnifiedModal>
  );
}

const styles = StyleSheet.create({
  body: {
    gap: 10,
  },
  effectRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 8,
  },
  bullet: {
    width: 6,
    height: 6,
    borderRadius: 3,
    marginTop: 8,
  },
  effectLabel: {
    flex: 1,
    fontSize: 14,
    lineHeight: 20,
  },
  error: {
    fontSize: 13,
    marginTop: 8,
  },
  spinner: {
    marginTop: 4,
  },
});

export default BlockConfirmSheet;
