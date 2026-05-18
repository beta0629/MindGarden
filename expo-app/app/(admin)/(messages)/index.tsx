/**
 * 어드민·스태프 메시지 — MESSAGE_MANAGE 시 네이티브 전체 목록, 없으면 웹 안내
 *
 * @author MindGarden
 * @since 2026-05-16
 */
import { useCallback, useDeferredValue, useMemo, useState, type ReactNode } from 'react';
import {
  ActivityIndicator,
  FlatList,
  Linking,
  Pressable,
  RefreshControl,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { ExternalLink, MessageCircle } from 'lucide-react-native';
import { useTheme } from '@/theme';
import { AppTopBar } from '@/components/templates/AppTopBar';
import { EmptyState } from '@/components/atoms/EmptyState';
import { Badge } from '@/components/atoms/Badge';
import { SearchBar } from '@/components/molecules/SearchBar';
import { UnifiedModal } from '@/components/common/modals/UnifiedModal';
import { apiGet } from '@/api/client';
import { unwrapApiResponse } from '@/api/unwrapApiResponse';
import { useAdminApiQueryReady } from '@/hooks/useAdminApiQueryReady';
import { buildAdminWebUrl } from '@/config/webBaseUrl';
import {
  ADMIN_MOBILE_MESSAGES_API,
  ADMIN_MOBILE_MESSAGES_COPY,
} from '@/constants/adminMobileScreensCopy';
import { usesAdminMessagingAllApi } from '@/utils/adminRole';
import { useAuthStore } from '@/stores/useAuthStore';
import { formatRelativeTime } from '@/utils/dateFormat';
import { toDisplayString, toSafeNumber } from '@/utils/safeDisplay';

interface AdminMessageRow {
  id: number;
  title: string;
  content: string;
  senderName: string;
  receiverName: string;
  sentAt: string;
  isRead: boolean;
  messageType: string;
}

type ApiReject = { status?: number; message?: string };

const ADMIN_MESSAGES_QUERY_KEY = ['admin', 'consultation-messages', 'all'] as const;

function isForbiddenError(error: unknown): boolean {
  return (
    error != null &&
    typeof error === 'object' &&
    'status' in error &&
    (error as ApiReject).status === 403
  );
}

function normalizeAdminMessageRow(raw: Record<string, unknown>): AdminMessageRow | null {
  const id = toSafeNumber(raw.id, 0);
  if (id <= 0) {
    return null;
  }
  const content = toDisplayString(raw.content, '');
  const title = toDisplayString(raw.title, '');
  const sentRaw = raw.sentAt ?? raw.createdAt;
  const sentAt = typeof sentRaw === 'string' ? sentRaw : toDisplayString(sentRaw, '');
  return {
    id,
    title,
    content,
    senderName: toDisplayString(raw.senderName, '발신자'),
    receiverName: toDisplayString(raw.receiverName, '수신자'),
    sentAt,
    isRead: Boolean(raw.isRead),
    messageType: toDisplayString(raw.messageType, 'GENERAL'),
  };
}

function extractAdminMessageList(data: unknown): AdminMessageRow[] {
  if (data == null) {
    return [];
  }
  const list = Array.isArray(data)
    ? data
    : typeof data === 'object' && data !== null
      ? ((data as Record<string, unknown>).messages ??
        (data as Record<string, unknown>).content ??
        (data as Record<string, unknown>).data)
      : null;
  if (!Array.isArray(list)) {
    return [];
  }
  const rows: AdminMessageRow[] = [];
  for (const item of list) {
    if (item == null || typeof item !== 'object') {
      continue;
    }
    const row = normalizeAdminMessageRow(item as Record<string, unknown>);
    if (row) {
      rows.push(row);
    }
  }
  rows.sort((a, b) => {
    const ta = new Date(a.sentAt).getTime();
    const tb = new Date(b.sentAt).getTime();
    return (Number.isNaN(tb) ? 0 : tb) - (Number.isNaN(ta) ? 0 : ta);
  });
  return rows;
}

async function fetchAdminAllMessages(): Promise<AdminMessageRow[]> {
  const raw = await apiGet<unknown>(ADMIN_MOBILE_MESSAGES_API.ALL);
  const inner = unwrapApiResponse<unknown>(raw);
  return extractAdminMessageList(inner ?? raw);
}

async function fetchAdminMessageDetail(messageId: number): Promise<AdminMessageRow | null> {
  const raw = await apiGet<unknown>(ADMIN_MOBILE_MESSAGES_API.detail(messageId));
  const inner = unwrapApiResponse<Record<string, unknown>>(raw);
  const bag =
    inner ?? (typeof raw === 'object' && raw !== null ? (raw as Record<string, unknown>) : null);
  if (!bag) {
    return null;
  }
  return normalizeAdminMessageRow(bag);
}

function filterMessages(rows: AdminMessageRow[], query: string): AdminMessageRow[] {
  const q = query.trim().toLowerCase();
  if (q === '') {
    return rows;
  }
  return rows.filter((row) => {
    const hay = `${row.title} ${row.content} ${row.senderName} ${row.receiverName}`.toLowerCase();
    return hay.includes(q);
  });
}

function messagePreview(row: AdminMessageRow): string {
  const body = row.content.trim();
  if (body.length > 0) {
    return body;
  }
  return row.title.trim();
}

function AdminMessagesWebFallback() {
  const theme = useTheme();

  const openWebAdmin = () => {
    const url = buildAdminWebUrl(ADMIN_MOBILE_MESSAGES_COPY.WEB_ROUTE);
    void Linking.openURL(url);
  };

  return (
    <View style={[styles.body, { paddingHorizontal: theme.spacing.lg }]}>
      <EmptyState
        icon={<MessageCircle size={36} color={theme.colors.textTertiary} />}
        title={ADMIN_MOBILE_MESSAGES_COPY.WEB_FALLBACK_TITLE}
        description={ADMIN_MOBILE_MESSAGES_COPY.WEB_FALLBACK_BODY}
      />
      <Pressable
        onPress={openWebAdmin}
        style={[
          styles.cta,
          {
            backgroundColor: theme.colors.primary,
            borderRadius: theme.borderRadius.lg,
            marginTop: theme.spacing.xl,
          },
        ]}
        accessibilityRole="link"
        accessibilityLabel={ADMIN_MOBILE_MESSAGES_COPY.OPEN_WEB_CTA}
      >
        <ExternalLink size={18} color={theme.colors.textOnPrimary} />
        <Text
          style={{
            color: theme.colors.textOnPrimary,
            fontFamily: theme.fontFamily.semibold,
            fontSize: theme.fontSize.base,
            marginLeft: theme.spacing.sm,
          }}
        >
          {ADMIN_MOBILE_MESSAGES_COPY.OPEN_WEB_CTA}
        </Text>
      </Pressable>
    </View>
  );
}

export default function AdminMessagesScreen() {
  const theme = useTheme();
  const role = useAuthStore((s) => s.role);
  const { ready, tenantId } = useAdminApiQueryReady();
  const queryClient = useQueryClient();
  const [searchQuery, setSearchQuery] = useState('');
  const deferredSearch = useDeferredValue(searchQuery);
  const [selectedId, setSelectedId] = useState<number | null>(null);
  const [detailLoading, setDetailLoading] = useState(false);
  const [detailRow, setDetailRow] = useState<AdminMessageRow | null>(null);

  const shellRole = usesAdminMessagingAllApi(role);

  const listQuery = useQuery({
    queryKey: [...ADMIN_MESSAGES_QUERY_KEY, tenantId],
    queryFn: fetchAdminAllMessages,
    enabled: ready && shellRole,
    staleTime: 1000 * 30,
    retry: (failureCount, error) => !isForbiddenError(error) && failureCount < 1,
  });

  const useWebFallback = listQuery.isError && isForbiddenError(listQuery.error);

  const filtered = useMemo(
    () => filterMessages(listQuery.data ?? [], deferredSearch),
    [listQuery.data, deferredSearch],
  );

  const handleRefresh = useCallback(async () => {
    await listQuery.refetch();
  }, [listQuery]);

  const openDetail = useCallback(
    async (row: AdminMessageRow) => {
      setSelectedId(row.id);
      setDetailRow(row);
      setDetailLoading(true);
      try {
        const detail = await fetchAdminMessageDetail(row.id);
        if (detail) {
          setDetailRow(detail);
          await queryClient.invalidateQueries({
            queryKey: [...ADMIN_MESSAGES_QUERY_KEY, tenantId],
          });
        }
      } finally {
        setDetailLoading(false);
      }
    },
    [queryClient, tenantId],
  );

  const closeDetail = useCallback(() => {
    setSelectedId(null);
    setDetailRow(null);
    setDetailLoading(false);
  }, []);

  const renderItem = useCallback(
    ({ item }: { item: AdminMessageRow }) => (
      <Pressable
        onPress={() => void openDetail(item)}
        style={({ pressed }) => [
          styles.row,
          {
            backgroundColor: pressed ? theme.colors.accentSoft : theme.colors.surface,
            borderBottomColor: theme.colors.divider,
          },
        ]}
        accessibilityRole="button"
        accessibilityLabel={`${item.senderName}에서 ${item.receiverName}으로. ${messagePreview(item)}`}
      >
        <View style={styles.rowTop}>
          <Text
            style={{
              flex: 1,
              color: theme.colors.textMain,
              fontFamily: theme.fontFamily.semibold,
              fontSize: theme.fontSize.sm,
            }}
            numberOfLines={1}
          >
            {item.senderName}
            <Text
              style={{ color: theme.colors.textTertiary, fontFamily: theme.fontFamily.regular }}
            >
              {' → '}
              {item.receiverName}
            </Text>
          </Text>
          <Text
            style={{
              color: theme.colors.textTertiary,
              fontFamily: theme.fontFamily.regular,
              fontSize: theme.fontSize['2xs'],
              marginLeft: theme.spacing.sm,
            }}
          >
            {formatRelativeTime(item.sentAt)}
          </Text>
        </View>
        <View style={styles.rowBottom}>
          <Text
            style={{
              flex: 1,
              color: theme.colors.textSecondary,
              fontFamily: theme.fontFamily.regular,
              fontSize: theme.fontSize.sm,
            }}
            numberOfLines={2}
          >
            {messagePreview(item)}
          </Text>
          {!item.isRead ? (
            <Badge label={ADMIN_MOBILE_MESSAGES_COPY.UNREAD_BADGE} variant="primary" />
          ) : null}
        </View>
      </Pressable>
    ),
    [openDetail, theme],
  );

  let body: ReactNode;

  if (!shellRole) {
    body = <AdminMessagesWebFallback />;
  } else if (listQuery.isLoading && !listQuery.data) {
    body = (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color={theme.colors.primary} />
      </View>
    );
  } else if (useWebFallback) {
    body = <AdminMessagesWebFallback />;
  } else if (listQuery.isError) {
    body = (
      <View style={[styles.body, { paddingHorizontal: theme.spacing.lg }]}>
        <EmptyState
          icon={<MessageCircle size={36} color={theme.colors.textTertiary} />}
          title={ADMIN_MOBILE_MESSAGES_COPY.ERROR_TITLE}
          description={ADMIN_MOBILE_MESSAGES_COPY.ERROR_BODY}
        />
        <Pressable
          onPress={() => void listQuery.refetch()}
          style={styles.retry}
          accessibilityRole="button"
          accessibilityLabel={ADMIN_MOBILE_MESSAGES_COPY.RETRY}
        >
          <Text
            style={{
              color: theme.colors.primary,
              fontFamily: theme.fontFamily.medium,
              fontSize: theme.fontSize.sm,
            }}
          >
            {ADMIN_MOBILE_MESSAGES_COPY.RETRY}
          </Text>
        </Pressable>
      </View>
    );
  } else {
    body = (
      <>
        <View style={styles.searchWrap}>
          <SearchBar
            value={searchQuery}
            onChangeText={setSearchQuery}
            placeholder={ADMIN_MOBILE_MESSAGES_COPY.SEARCH_PLACEHOLDER}
          />
        </View>
        <FlatList
          data={filtered}
          keyExtractor={(item) => String(item.id)}
          renderItem={renderItem}
          refreshControl={
            <RefreshControl
              refreshing={listQuery.isRefetching}
              onRefresh={() => void handleRefresh()}
              tintColor={theme.colors.primary}
            />
          }
          ListEmptyComponent={
            <EmptyState
              icon={<MessageCircle size={32} color={theme.colors.textTertiary} />}
              title={ADMIN_MOBILE_MESSAGES_COPY.EMPTY_TITLE}
              description={ADMIN_MOBILE_MESSAGES_COPY.EMPTY_BODY}
            />
          }
          contentContainerStyle={filtered.length === 0 ? styles.listEmpty : styles.listContent}
        />
      </>
    );
  }

  const modalPreview = detailRow ? messagePreview(detailRow) : '';

  return (
    <SafeAreaView style={[styles.safe, { backgroundColor: theme.colors.bgMain }]} edges={['top']}>
      <AppTopBar title={ADMIN_MOBILE_MESSAGES_COPY.TITLE} />
      <View style={styles.flex}>{body}</View>
      <UnifiedModal
        isOpen={selectedId != null}
        onClose={closeDetail}
        title={ADMIN_MOBILE_MESSAGES_COPY.DETAIL_MODAL_TITLE}
        subtitle={
          detailRow
            ? `${ADMIN_MOBILE_MESSAGES_COPY.DETAIL_FROM}: ${detailRow.senderName} · ${ADMIN_MOBILE_MESSAGES_COPY.DETAIL_TO}: ${detailRow.receiverName}`
            : undefined
        }
        loading={detailLoading}
        actions={[
          {
            label: ADMIN_MOBILE_MESSAGES_COPY.DETAIL_CLOSE,
            onPress: closeDetail,
            variant: 'primary',
          },
        ]}
      >
        {detailLoading && !detailRow ? (
          <ActivityIndicator color={theme.colors.primary} style={styles.detailSpinner} />
        ) : (
          <Text
            style={{
              color: theme.colors.textSecondary,
              fontFamily: theme.fontFamily.regular,
              fontSize: theme.fontSize.sm,
              lineHeight: 22,
            }}
          >
            {modalPreview.length > 0 ? modalPreview : '—'}
          </Text>
        )}
      </UnifiedModal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
  },
  flex: {
    flex: 1,
  },
  body: {
    flex: 1,
    justifyContent: 'center',
    paddingBottom: 48,
  },
  centered: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cta: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 14,
  },
  retry: {
    alignSelf: 'center',
    marginTop: 16,
    padding: 12,
  },
  searchWrap: {
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  listContent: {
    paddingBottom: 24,
  },
  listEmpty: {
    flexGrow: 1,
    paddingBottom: 24,
  },
  row: {
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderBottomWidth: 1,
  },
  rowTop: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 6,
  },
  rowBottom: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 8,
  },
  detailSpinner: {
    marginVertical: 16,
  },
});
