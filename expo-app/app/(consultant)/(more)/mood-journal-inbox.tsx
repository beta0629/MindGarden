/**
 * 상담사 — 감정 일기 수신함 (내담자 공유 동의 일기).
 *
 * @author MindGarden
 * @since 2026-05-21
 */
import { useCallback, useMemo } from 'react';
import { RefreshControl, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { AlertCircle, BookHeart, Heart } from 'lucide-react-native';
import { format, parseISO } from 'date-fns';
import { ko } from 'date-fns/locale';
import { useTheme } from '@/theme';
import { AppTopBar } from '@/components/app-chrome/AppTopBar';
import { Chip } from '@/components/atoms/Chip';
import { EmptyState } from '@/components/atoms/EmptyState';
import { SkeletonCard } from '@/components/atoms/SkeletonLoader';
import { useConsultantMoodJournalInbox } from '@/api/hooks/useMoodJournal';
import { useConsultantClients } from '@/api/hooks/useClients';
import { MOOD_EMOJIS, MOOD_SCORE_MAP } from '@/constants/moodConstants';
import {
  CONSULTANT_MOOD_JOURNAL_INBOX_COPY,
  CONSULTANT_MOOD_JOURNAL_INBOX_FETCH_FAILED,
  CONSULTANT_MOOD_JOURNAL_INBOX_SETUP_NO_TENANT,
  CONSULTANT_MOOD_JOURNAL_INBOX_SETUP_NO_TOKEN,
} from '@/constants/consultantMoodJournalInboxCopy';
import { toDisplayString } from '@/utils/toDisplayString';
import { toSafeNumber } from '@/utils/safeDisplay';
import {
  formatMindWeatherClientHeadline,
  isGenericMindWeatherClientDisplayName,
  MIND_WEATHER_GENERIC_CLIENT_LABEL,
} from '@/utils/mindWeatherClientLabel';
import { useAuthStore } from '@/stores/useAuthStore';
import { syncTenantFromAccessToken } from '@/utils/syncTenantFromAccessToken';
import type { MoodJournalInboxItem } from '@/services/moodJournalService';

export default function ConsultantMoodJournalInbox() {
  const theme = useTheme();
  const inboxQuery = useConsultantMoodJournalInbox();
  const items = inboxQuery.data?.items ?? [];
  const blockReason = inboxQuery.blockReason;
  const showLoadingSkeleton =
    blockReason === 'auth_loading' ||
    blockReason === 'tenant_hydrating' ||
    (inboxQuery.isQueryReady &&
      (inboxQuery.isPending || inboxQuery.isFetching || !inboxQuery.isFetched));
  const setupErrorMessage =
    blockReason === 'no_token'
      ? CONSULTANT_MOOD_JOURNAL_INBOX_SETUP_NO_TOKEN
      : blockReason === 'no_tenant'
        ? CONSULTANT_MOOD_JOURNAL_INBOX_SETUP_NO_TENANT
        : null;
  const showSetupError = setupErrorMessage != null;
  const showEmptyInbox =
    inboxQuery.isQueryReady &&
    inboxQuery.isFetched &&
    !inboxQuery.isError &&
    items.length === 0;
  const inboxDataSource = inboxQuery.data?.source;

  useFocusEffect(
    useCallback(() => {
      const token = useAuthStore.getState().accessToken;
      syncTenantFromAccessToken(token);
      if (inboxQuery.isQueryReady) {
        void inboxQuery.refetch();
      }
    }, [inboxQuery.isQueryReady, inboxQuery.refetch]),
  );

  const authUser = useAuthStore((s) => s.user);
  const consultantIdStr = authUser?.id != null ? String(authUser.id) : '';
  const clientsQuery = useConsultantClients({
    consultantId: consultantIdStr,
    status: 'ALL',
    search: undefined,
    size: 100,
  });
  const clientLabelByUserId = useMemo(() => {
    const m = new Map<number, string>();
    for (const p of clientsQuery.data?.pages ?? []) {
      for (const c of p.content) {
        if (c.id <= 0) continue;
        const raw = toDisplayString(c.nickname ?? c.name, '').trim();
        if (!raw || isGenericMindWeatherClientDisplayName(raw) || raw === '이름 비공개') continue;
        m.set(c.id, raw);
      }
    }
    return m;
  }, [clientsQuery.data]);

  const resolveInboxClientHeadline = useMemo(() => {
    return (row: MoodJournalInboxItem): string => {
      const cid = toSafeNumber(row.clientId, Number.NaN);
      if (Number.isFinite(cid) && cid > 0) {
        const fromRoster = clientLabelByUserId.get(cid);
        if (fromRoster) {
          return fromRoster;
        }
      }
      const base = formatMindWeatherClientHeadline(row.clientName, row.clientId, String(row.id));
      if (
        base === MIND_WEATHER_GENERIC_CLIENT_LABEL ||
        isGenericMindWeatherClientDisplayName(base)
      ) {
        return formatMindWeatherClientHeadline(undefined, row.clientId, String(row.id));
      }
      return base;
    };
  }, [clientLabelByUserId]);

  return (
    <SafeAreaView style={[styles.safe, { backgroundColor: theme.colors.bgMain }]} edges={['top']}>
      <AppTopBar title={CONSULTANT_MOOD_JOURNAL_INBOX_COPY.PAGE_TITLE} canGoBack />

      <ScrollView
        contentContainerStyle={styles.scroll}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={inboxQuery.isFetching}
            onRefresh={inboxQuery.refetch}
            tintColor={theme.colors.primary}
          />
        }
      >
        <Animated.View entering={FadeInDown.springify()} style={styles.headerWrap}>
          <View style={styles.headerRow}>
            <BookHeart size={22} color={theme.colors.primary} />
            <Text
              style={{
                fontFamily: theme.fontFamily.bold,
                fontSize: theme.fontSize.xl,
                color: theme.colors.textMain,
                marginLeft: 8,
              }}
              accessibilityRole="header"
            >
              {CONSULTANT_MOOD_JOURNAL_INBOX_COPY.HEADER_TITLE}
            </Text>
          </View>
          <Text
            style={{
              fontFamily: theme.fontFamily.regular,
              fontSize: theme.fontSize.sm,
              color: theme.colors.textSecondary,
              marginTop: 6,
              lineHeight: 20,
            }}
          >
            {CONSULTANT_MOOD_JOURNAL_INBOX_COPY.HEADER_DESC}
          </Text>
        </Animated.View>

        {showLoadingSkeleton ? (
          <View style={styles.loadingWrap}>
            {[0, 1].map((i) => (
              <SkeletonCard key={i} lines={3} />
            ))}
          </View>
        ) : showSetupError ? (
          <EmptyState
            icon={<AlertCircle size={32} color={theme.colors.textTertiary} />}
            title={CONSULTANT_MOOD_JOURNAL_INBOX_COPY.SETUP_ERROR_TITLE}
            description={setupErrorMessage}
            actionLabel={CONSULTANT_MOOD_JOURNAL_INBOX_COPY.RETRY}
            onAction={() => {
              const token = useAuthStore.getState().accessToken;
              syncTenantFromAccessToken(token);
              void useAuthStore.getState().restoreTokens();
              void inboxQuery.refetch();
            }}
          />
        ) : inboxQuery.isError ? (
          <EmptyState
            icon={<AlertCircle size={32} color={theme.colors.textTertiary} />}
            title={CONSULTANT_MOOD_JOURNAL_INBOX_COPY.FETCH_ERROR_TITLE}
            description={(() => {
              const msg = inboxQuery.error instanceof Error ? inboxQuery.error.message.trim() : '';
              return msg.length > 0 ? msg : CONSULTANT_MOOD_JOURNAL_INBOX_FETCH_FAILED;
            })()}
            actionLabel={CONSULTANT_MOOD_JOURNAL_INBOX_COPY.RETRY}
            onAction={() => inboxQuery.refetch()}
          />
        ) : showEmptyInbox ? (
          <EmptyState
            icon={<Heart size={32} color={theme.colors.textTertiary} />}
            title={CONSULTANT_MOOD_JOURNAL_INBOX_COPY.EMPTY_TITLE}
            description={
              inboxDataSource === 'api'
                ? CONSULTANT_MOOD_JOURNAL_INBOX_COPY.EMPTY_DESC_API
                : CONSULTANT_MOOD_JOURNAL_INBOX_COPY.EMPTY_DESC_DEFAULT
            }
          />
        ) : (
          items.map((row, index) => {
            const dateLabel = (() => {
              try {
                return format(parseISO(row.date), 'yyyy년 M월 d일 (EEEE)', { locale: ko });
              } catch {
                return toDisplayString(row.date, '');
              }
            })();
            const moodLabel =
              MOOD_SCORE_MAP[row.moodValue] ??
              MOOD_EMOJIS.find((m) => m.value === row.moodValue)?.label ??
              '';
            const clientHeadline = resolveInboxClientHeadline(row);
            return (
              <Animated.View
                key={`${row.id}-${row.date}`}
                entering={FadeInDown.delay(index * 60).springify()}
                style={[
                  styles.card,
                  {
                    backgroundColor: theme.colors.surface,
                    borderRadius: theme.borderRadius.xl,
                    borderColor: theme.colors.gray[300],
                    ...theme.shadows.sm,
                  },
                ]}
              >
                <View style={styles.cardHeader}>
                  <Text
                    style={{
                      fontFamily: theme.fontFamily.semibold,
                      fontSize: theme.fontSize.base,
                      color: theme.colors.textMain,
                    }}
                  >
                    {clientHeadline}
                  </Text>
                  <Text
                    style={{
                      fontFamily: theme.fontFamily.regular,
                      fontSize: theme.fontSize.xs,
                      color: theme.colors.textSecondary,
                      marginTop: 2,
                    }}
                  >
                    {dateLabel}
                  </Text>
                </View>

                <View style={styles.moodRow}>
                  <Text style={styles.moodEmoji} accessibilityLabel={moodLabel}>
                    {toDisplayString(row.emoji, '😐')}
                  </Text>
                  <Text
                    style={{
                      fontFamily: theme.fontFamily.medium,
                      fontSize: theme.fontSize.sm,
                      color: theme.colors.textMain,
                      marginLeft: 8,
                    }}
                  >
                    {CONSULTANT_MOOD_JOURNAL_INBOX_COPY.LABEL_MOOD}: {toDisplayString(moodLabel, '—')}
                  </Text>
                </View>

                {row.tags.length > 0 ? (
                  <View style={styles.chips} accessibilityLabel={CONSULTANT_MOOD_JOURNAL_INBOX_COPY.LABEL_TAGS}>
                    {row.tags.map((tag) => (
                      <Chip key={tag} label={toDisplayString(tag, '')} selected style={styles.chip} />
                    ))}
                  </View>
                ) : null}

                <Text
                  style={{
                    fontFamily: theme.fontFamily.regular,
                    fontSize: theme.fontSize.xs,
                    color: theme.colors.textSecondary,
                    marginTop: 12,
                  }}
                >
                  {CONSULTANT_MOOD_JOURNAL_INBOX_COPY.LABEL_MEMO}
                </Text>
                <Text
                  style={{
                    fontFamily: theme.fontFamily.regular,
                    fontSize: theme.fontSize.sm,
                    color: theme.colors.textMain,
                    lineHeight: 22,
                    marginTop: 4,
                  }}
                >
                  {toDisplayString(row.memo, '')}
                </Text>
              </Animated.View>
            );
          })
        )}

        <View style={styles.bottomSpacer} />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1 },
  scroll: { paddingHorizontal: 16, paddingTop: 4 },
  headerWrap: { paddingVertical: 12 },
  headerRow: { flexDirection: 'row', alignItems: 'center' },
  loadingWrap: { gap: 12 },
  card: {
    borderWidth: 1,
    padding: 16,
    marginBottom: 12,
  },
  cardHeader: { marginBottom: 12 },
  moodRow: { flexDirection: 'row', alignItems: 'center' },
  moodEmoji: { fontSize: 28 },
  chips: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginTop: 12,
  },
  chip: { marginBottom: 0 },
  bottomSpacer: { height: 32 },
});
