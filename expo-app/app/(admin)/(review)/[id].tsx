/**
 * 어드민 — 커뮤니티 검수 상세·승인/반려 (ADMIN 전용)
 *
 * @author MindGarden
 * @since 2026-05-16
 */
import { useCallback, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useLocalSearchParams, useRouter } from 'expo-router';
import * as Haptics from 'expo-haptics';
import { ShieldAlert } from 'lucide-react-native';
import { format, parseISO } from 'date-fns';
import { ko } from 'date-fns/locale';
import { useTheme } from '@/theme';
import { AppTopBar } from '@/components/templates/AppTopBar';
import { Badge } from '@/components/atoms/Badge';
import { EmptyState } from '@/components/atoms/EmptyState';
import { UnifiedModal } from '@/components/common/modals/UnifiedModal';
import {
  getMutationErrorMessage,
  useAdminCommunityModerationQueue,
  useModerateCommunityPost,
} from '@/api/hooks/useAdminCommunityModeration';
import { ADMIN_COMMUNITY_MODERATION_COPY } from '@/constants/adminCommunityModerationCopy';
import { useAuthStore } from '@/stores/useAuthStore';
import { canAccessCommunityModeration, isStaffRole } from '@/utils/adminRole';
import type { CommunityModerationDecision } from '@/utils/adminCommunityModerationNormalize';
import { toDisplayString } from '@/utils/safeDisplay';
import { normalizeCommunityListedTimeIso } from '@/utils/dateFormat';
import {
  isAdminListQueryLoading,
  retryAdminApiSession,
} from '@/utils/retryAdminApiSession';

type PendingModal = CommunityModerationDecision | null;

function formatQueueCreatedAt(iso: string): string {
  const trimmed = iso.trim();
  if (trimmed === '') {
    return '—';
  }
  try {
    const normalized = normalizeCommunityListedTimeIso(trimmed);
    const d = parseISO(normalized);
    if (Number.isNaN(d.getTime())) {
      return trimmed;
    }
    return format(d, 'yyyy.MM.dd HH:mm', { locale: ko });
  } catch {
    return trimmed;
  }
}

function postKindLabel(kind: string): string {
  if (kind === 'CONSULTANT_COLUMN') {
    return ADMIN_COMMUNITY_MODERATION_COPY.KIND_CONSULTANT_COLUMN;
  }
  if (kind === 'CLIENT_REVIEW') {
    return ADMIN_COMMUNITY_MODERATION_COPY.KIND_CLIENT_REVIEW;
  }
  return toDisplayString(kind, '—');
}

function statusBadge(status: string): {
  label: string;
  variant: 'warning' | 'success' | 'error' | 'gray';
} {
  const s = status.trim().toUpperCase();
  if (s === 'APPROVED') {
    return { label: ADMIN_COMMUNITY_MODERATION_COPY.STATUS_APPROVED, variant: 'success' };
  }
  if (s === 'REJECTED') {
    return { label: ADMIN_COMMUNITY_MODERATION_COPY.STATUS_REJECTED, variant: 'error' };
  }
  return { label: ADMIN_COMMUNITY_MODERATION_COPY.STATUS_PENDING, variant: 'warning' };
}

export default function AdminCommunityModerationDetailScreen() {
  const theme = useTheme();
  const router = useRouter();
  const { id: idParam } = useLocalSearchParams<{ id: string }>();
  const postId = useMemo(() => {
    const n = Number(idParam);
    return Number.isFinite(n) && n > 0 ? n : null;
  }, [idParam]);

  const role = useAuthStore((s) => s.role);
  const allowed = canAccessCommunityModeration(role);
  const staffDenied = isStaffRole(role);

  const queueQuery = useAdminCommunityModerationQueue();
  const moderateMutation = useModerateCommunityPost();

  const [pendingModal, setPendingModal] = useState<PendingModal>(null);
  const [rejectNote, setRejectNote] = useState('');
  const [patchError, setPatchError] = useState<string | null>(null);

  const item = useMemo(() => {
    if (postId == null) {
      return null;
    }
    return (queueQuery.data ?? []).find((row) => row.id === postId) ?? null;
  }, [postId, queueQuery.data]);

  const accessDeniedMessage = useMemo(() => {
    if (staffDenied) {
      return ADMIN_COMMUNITY_MODERATION_COPY.ACCESS_DENIED_STAFF;
    }
    return ADMIN_COMMUNITY_MODERATION_COPY.ACCESS_DENIED_GENERIC;
  }, [staffDenied]);

  const closeModal = useCallback(() => {
    if (moderateMutation.isPending) {
      return;
    }
    setPendingModal(null);
    setRejectNote('');
    setPatchError(null);
  }, [moderateMutation.isPending]);

  const openModal = useCallback((decision: CommunityModerationDecision) => {
    if (Platform.OS !== 'web') {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    }
    setPatchError(null);
    setRejectNote('');
    setPendingModal(decision);
  }, []);

  const handleSessionRetry = useCallback(() => {
    void retryAdminApiSession().then(() => queueQuery.refetch());
  }, [queueQuery]);

  const handleConfirmPatch = useCallback(async () => {
    if (postId == null || pendingModal == null) {
      return;
    }
    setPatchError(null);
    try {
      await moderateMutation.mutateAsync({
        postId,
        decision: pendingModal,
        note: pendingModal === 'REJECT' ? rejectNote : undefined,
      });
      closeModal();
      router.back();
    } catch (err) {
      setPatchError(getMutationErrorMessage(err, ADMIN_COMMUNITY_MODERATION_COPY.PATCH_ERROR));
    }
  }, [postId, pendingModal, rejectNote, moderateMutation, closeModal, router]);

  if (!allowed) {
    return (
      <SafeAreaView
        style={[styles.safe, { backgroundColor: theme.colors.bgMain }]}
        edges={['top', 'left', 'right']}
      >
        <AppTopBar title={ADMIN_COMMUNITY_MODERATION_COPY.DETAIL_TITLE} canGoBack />
        <View style={styles.deniedWrap}>
          <ShieldAlert size={40} color={theme.colors.error} />
          <Text
            style={{
              marginTop: theme.spacing.md,
              fontFamily: theme.fontFamily.semibold,
              fontSize: theme.fontSize.lg,
              color: theme.colors.textMain,
              textAlign: 'center',
            }}
          >
            {ADMIN_COMMUNITY_MODERATION_COPY.ACCESS_DENIED_TITLE}
          </Text>
          <Text
            style={{
              marginTop: theme.spacing.sm,
              fontFamily: theme.fontFamily.regular,
              fontSize: theme.fontSize.sm,
              color: theme.colors.textSecondary,
              textAlign: 'center',
              paddingHorizontal: 24,
            }}
          >
            {accessDeniedMessage}
          </Text>
        </View>
      </SafeAreaView>
    );
  }

  const showLoading = isAdminListQueryLoading(queueQuery.isLoading, queueQuery.data, {
    isError: queueQuery.isError,
  });
  const badge = item ? statusBadge(item.moderationStatus) : null;
  const isPending = item?.moderationStatus.trim().toUpperCase() === 'PENDING';

  const modalTitle =
    pendingModal === 'APPROVE'
      ? ADMIN_COMMUNITY_MODERATION_COPY.MODAL_APPROVE_TITLE
      : ADMIN_COMMUNITY_MODERATION_COPY.MODAL_REJECT_TITLE;
  const modalBody =
    pendingModal === 'APPROVE'
      ? ADMIN_COMMUNITY_MODERATION_COPY.MODAL_APPROVE_BODY
      : ADMIN_COMMUNITY_MODERATION_COPY.MODAL_REJECT_BODY;

  return (
    <SafeAreaView
      style={[styles.safe, { backgroundColor: theme.colors.bgMain }]}
      edges={['top', 'left', 'right', 'bottom']}
    >
      <AppTopBar title={ADMIN_COMMUNITY_MODERATION_COPY.DETAIL_TITLE} canGoBack />

      {!queueQuery.ready ? (
        <View style={styles.centered}>
          <EmptyState
            title={ADMIN_COMMUNITY_MODERATION_COPY.SESSION_NOT_READY_TITLE}
            description={ADMIN_COMMUNITY_MODERATION_COPY.SESSION_NOT_READY_DESC}
            actionLabel={ADMIN_COMMUNITY_MODERATION_COPY.RETRY}
            onAction={handleSessionRetry}
          />
        </View>
      ) : showLoading ? (
        <View style={styles.centered}>
          <ActivityIndicator size="large" color={theme.colors.primary} />
          <Text
            style={{
              marginTop: theme.spacing.sm,
              fontFamily: theme.fontFamily.regular,
              fontSize: theme.fontSize.sm,
              color: theme.colors.textSecondary,
            }}
          >
            {ADMIN_COMMUNITY_MODERATION_COPY.DETAIL_LOADING}
          </Text>
        </View>
      ) : item == null ? (
        <EmptyState
          title={ADMIN_COMMUNITY_MODERATION_COPY.DETAIL_NOT_FOUND}
          actionLabel={ADMIN_COMMUNITY_MODERATION_COPY.RETRY}
          onAction={() => {
            void queueQuery.refetch();
            router.back();
          }}
        />
      ) : (
        <>
          <ScrollView contentContainerStyle={styles.scrollContent}>
            <Text
              style={{
                fontFamily: theme.fontFamily.semibold,
                fontSize: theme.fontSize.xl,
                color: theme.colors.textMain,
              }}
            >
              {toDisplayString(item.title, '제목 없음')}
            </Text>

            <View style={styles.chipRow}>
              {badge ? <Badge label={badge.label} variant={badge.variant} /> : null}
              <Badge label={postKindLabel(item.postKind)} variant="gray" />
            </View>

            <DetailRow
              label={ADMIN_COMMUNITY_MODERATION_COPY.LABEL_AUTHOR}
              value={toDisplayString(item.authorDisplay, '—')}
            />
            <DetailRow
              label={ADMIN_COMMUNITY_MODERATION_COPY.LABEL_CREATED}
              value={formatQueueCreatedAt(item.createdAt)}
            />
            {item.specialty ? (
              <DetailRow label="전문분야" value={toDisplayString(item.specialty, '')} />
            ) : null}

            <Text
              style={{
                marginTop: theme.spacing.lg,
                marginBottom: theme.spacing.xs,
                fontFamily: theme.fontFamily.semibold,
                fontSize: theme.fontSize.sm,
                color: theme.colors.textSecondary,
              }}
            >
              {ADMIN_COMMUNITY_MODERATION_COPY.LABEL_BODY}
            </Text>
            <View
              style={[
                styles.bodyBox,
                {
                  backgroundColor: theme.colors.surface,
                  borderColor: theme.colors.divider,
                },
              ]}
            >
              <Text
                style={{
                  fontFamily: theme.fontFamily.regular,
                  fontSize: theme.fontSize.base,
                  color: theme.colors.textMain,
                  lineHeight: 22,
                }}
              >
                {toDisplayString(item.bodyPreview, '—')}
              </Text>
            </View>
          </ScrollView>

          {isPending ? (
            <View
              style={[
                styles.ctaBar,
                {
                  borderTopColor: theme.colors.divider,
                  backgroundColor: theme.colors.bgMain,
                },
              ]}
            >
              <Pressable
                onPress={() => openModal('REJECT')}
                style={[styles.ctaBtn, { backgroundColor: theme.colors.gray[100] }]}
                accessibilityRole="button"
                accessibilityLabel={ADMIN_COMMUNITY_MODERATION_COPY.ACTION_REJECT}
              >
                <Text
                  style={{
                    fontFamily: theme.fontFamily.semibold,
                    fontSize: theme.fontSize.base,
                    color: theme.colors.textMain,
                  }}
                >
                  {ADMIN_COMMUNITY_MODERATION_COPY.ACTION_REJECT}
                </Text>
              </Pressable>
              <Pressable
                onPress={() => openModal('APPROVE')}
                style={[styles.ctaBtn, { backgroundColor: theme.colors.primary }]}
                accessibilityRole="button"
                accessibilityLabel={ADMIN_COMMUNITY_MODERATION_COPY.ACTION_APPROVE}
              >
                <Text
                  style={{
                    fontFamily: theme.fontFamily.semibold,
                    fontSize: theme.fontSize.base,
                    color: theme.colors.textOnPrimary,
                  }}
                >
                  {ADMIN_COMMUNITY_MODERATION_COPY.ACTION_APPROVE}
                </Text>
              </Pressable>
            </View>
          ) : null}
        </>
      )}

      <UnifiedModal
        isOpen={pendingModal != null}
        onClose={closeModal}
        title={modalTitle}
        subtitle={modalBody}
        loading={moderateMutation.isPending}
        actions={[
          {
            label: ADMIN_COMMUNITY_MODERATION_COPY.MODAL_CANCEL,
            onPress: closeModal,
            variant: 'secondary',
            disabled: moderateMutation.isPending,
          },
          {
            label: ADMIN_COMMUNITY_MODERATION_COPY.MODAL_CONFIRM,
            onPress: () => void handleConfirmPatch(),
            variant: pendingModal === 'REJECT' ? 'danger' : 'primary',
            disabled: moderateMutation.isPending,
          },
        ]}
      >
        {pendingModal === 'REJECT' ? (
          <View>
            <Text
              style={{
                fontFamily: theme.fontFamily.medium,
                fontSize: theme.fontSize.sm,
                color: theme.colors.textSecondary,
                marginBottom: theme.spacing.xs,
              }}
            >
              {ADMIN_COMMUNITY_MODERATION_COPY.MODAL_REJECT_NOTE_LABEL}
            </Text>
            <TextInput
              value={rejectNote}
              onChangeText={setRejectNote}
              placeholder={ADMIN_COMMUNITY_MODERATION_COPY.MODAL_REJECT_NOTE_PLACEHOLDER}
              placeholderTextColor={theme.colors.textTertiary}
              multiline
              maxLength={500}
              editable={!moderateMutation.isPending}
              style={[
                styles.noteInput,
                {
                  borderColor: theme.colors.divider,
                  color: theme.colors.textMain,
                  fontFamily: theme.fontFamily.regular,
                  fontSize: theme.fontSize.sm,
                },
              ]}
            />
          </View>
        ) : null}
        {patchError ? (
          <Text
            style={{
              marginTop: theme.spacing.sm,
              fontFamily: theme.fontFamily.regular,
              fontSize: theme.fontSize.sm,
              color: theme.colors.error,
            }}
          >
            {patchError}
          </Text>
        ) : null}
      </UnifiedModal>
    </SafeAreaView>
  );
}

function DetailRow({ label, value }: { label: string; value: string }) {
  const theme = useTheme();
  return (
    <View style={styles.detailRow}>
      <Text
        style={{
          width: 72,
          fontFamily: theme.fontFamily.medium,
          fontSize: theme.fontSize.sm,
          color: theme.colors.textTertiary,
        }}
      >
        {label}
      </Text>
      <Text
        style={{
          flex: 1,
          fontFamily: theme.fontFamily.regular,
          fontSize: theme.fontSize.sm,
          color: theme.colors.textMain,
        }}
      >
        {value}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
  },
  scrollContent: {
    padding: 16,
    paddingBottom: 24,
  },
  chipRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginTop: 12,
  },
  detailRow: {
    flexDirection: 'row',
    marginTop: 10,
    alignItems: 'flex-start',
  },
  bodyBox: {
    borderWidth: StyleSheet.hairlineWidth,
    borderRadius: 12,
    padding: 14,
  },
  ctaBar: {
    flexDirection: 'row',
    gap: 10,
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: 8,
    borderTopWidth: StyleSheet.hairlineWidth,
  },
  ctaBtn: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 14,
    borderRadius: 12,
  },
  centered: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  deniedWrap: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 24,
  },
  noteInput: {
    borderWidth: StyleSheet.hairlineWidth,
    borderRadius: 10,
    minHeight: 88,
    paddingHorizontal: 12,
    paddingVertical: 10,
    textAlignVertical: 'top',
  },
});
