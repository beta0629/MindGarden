/**
 * 어드민 — 상담일지 라이트 (상담사 선택 → 기록 목록)
 *
 * @author MindGarden
 * @since 2026-05-16
 */
import { useCallback, useMemo, useState } from 'react';
import { useFocusEffect } from '@react-navigation/native';
import {
  ActivityIndicator,
  FlatList,
  Platform,
  Pressable,
  RefreshControl,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter, type Href } from 'expo-router';
import * as Haptics from 'expo-haptics';
import { ChevronRight, FileText, Search, User } from 'lucide-react-native';
import { format, parseISO } from 'date-fns';
import { ko } from 'date-fns/locale';
import { useTheme } from '@/theme';
import { AppTopBar } from '@/components/templates/AppTopBar';
import { Badge } from '@/components/atoms/Badge';
import { EmptyState } from '@/components/atoms/EmptyState';
import { SkeletonCard } from '@/components/atoms/SkeletonLoader';
import {
  useAdminConsultantPicker,
  useAdminConsultationRecordsList,
  type AdminConsultantPickerItem,
  type AdminConsultationRecordLite,
} from '@/api/hooks/useAdminConsultationRecords';
import { useApiQueryReady } from '@/hooks/useApiQueryReady';
import { ADMIN_CONSULTATION_RECORDS_COPY } from '@/constants/adminConsultationRecordsCopy';
import { ADMIN_API_QUERY_NOT_READY_COPY } from '@/constants/adminMobileScreensCopy';
import { useAuthStore } from '@/stores/useAuthStore';
import { isAdminRole, isStaffRole } from '@/utils/adminRole';
import { toDisplayString } from '@/utils/safeDisplay';
import {
  isAdminListQueryLoading,
  retryAdminApiSession,
} from '@/utils/retryAdminApiSession';
import { syncTenantFromAccessToken } from '@/utils/syncTenantFromAccessToken';

function formatSessionDate(ymd: string): string {
  const trimmed = ymd.trim();
  if (trimmed === '') {
    return '—';
  }
  try {
    const d = parseISO(trimmed.length >= 10 ? trimmed.slice(0, 10) : trimmed);
    if (Number.isNaN(d.getTime())) {
      return trimmed;
    }
    return format(d, 'yyyy.MM.dd (EEE)', { locale: ko });
  } catch {
    return trimmed;
  }
}

function recordStatusBadge(record: AdminConsultationRecordLite): {
  label: string;
  variant: 'success' | 'warning';
} {
  const completed = record.isSessionCompleted || record.status.trim().toUpperCase() === 'COMPLETED';
  if (completed) {
    return {
      label: ADMIN_CONSULTATION_RECORDS_COPY.STATUS_COMPLETED,
      variant: 'success',
    };
  }
  return {
    label: ADMIN_CONSULTATION_RECORDS_COPY.STATUS_PENDING,
    variant: 'warning',
  };
}

export default function AdminConsultationRecordsLiteScreen() {
  const theme = useTheme();
  const router = useRouter();
  const role = useAuthStore((s) => s.role);
  const allowed = isAdminRole(role);
  const staffDenied = isStaffRole(role);

  const [selectedConsultant, setSelectedConsultant] = useState<AdminConsultantPickerItem | null>(
    null,
  );
  const [consultantSearch, setConsultantSearch] = useState('');
  const [recordSearch, setRecordSearch] = useState('');
  const [refreshing, setRefreshing] = useState(false);

  const { ready } = useApiQueryReady();
  const consultantsQuery = useAdminConsultantPicker();
  const recordsQuery = useAdminConsultationRecordsList(selectedConsultant?.id ?? null);
  const consultantsLoading = isAdminListQueryLoading(
    consultantsQuery.isLoading,
    consultantsQuery.data,
    { isError: consultantsQuery.isError },
  );
  const recordsLoading = isAdminListQueryLoading(recordsQuery.isLoading, recordsQuery.data, {
    isError: recordsQuery.isError,
  });

  useFocusEffect(
    useCallback(() => {
      const token = useAuthStore.getState().accessToken;
      syncTenantFromAccessToken(token);
      if (ready && !selectedConsultant) {
        void consultantsQuery.refetch();
      }
    }, [consultantsQuery.refetch, ready, selectedConsultant]),
  );

  const accessDeniedMessage = useMemo(() => {
    if (staffDenied) {
      return ADMIN_CONSULTATION_RECORDS_COPY.ACCESS_DENIED_STAFF;
    }
    return ADMIN_CONSULTATION_RECORDS_COPY.ACCESS_DENIED_GENERIC;
  }, [staffDenied]);

  const filteredConsultants = useMemo(() => {
    const consultants = consultantsQuery.data ?? [];
    const q = consultantSearch.trim().toLowerCase();
    if (!q) {
      return consultants;
    }
    return consultants.filter(
      (c) => c.name.toLowerCase().includes(q) || c.email.toLowerCase().includes(q),
    );
  }, [consultantsQuery.data, consultantSearch]);

  const filteredRecords = useMemo(() => {
    const records = recordsQuery.data ?? [];
    const q = recordSearch.trim().toLowerCase();
    if (!q) {
      return records;
    }
    return records.filter(
      (r) => r.clientName.toLowerCase().includes(q) || r.title.toLowerCase().includes(q),
    );
  }, [recordsQuery.data, recordSearch]);

  const handleRefresh = useCallback(async () => {
    setRefreshing(true);
    try {
      if (selectedConsultant) {
        await recordsQuery.refetch();
      } else {
        await consultantsQuery.refetch();
      }
    } finally {
      setRefreshing(false);
    }
  }, [consultantsQuery, recordsQuery, selectedConsultant]);

  const handleSessionRetry = useCallback(() => {
    retryAdminApiSession();
    void consultantsQuery.refetch();
    void recordsQuery.refetch();
  }, [consultantsQuery, recordsQuery]);

  const handleSelectConsultant = useCallback((item: AdminConsultantPickerItem) => {
    if (Platform.OS !== 'web') {
      void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
    setRecordSearch('');
    setSelectedConsultant(item);
  }, []);

  const handleBackToConsultants = useCallback(() => {
    if (Platform.OS !== 'web') {
      void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
    setRecordSearch('');
    setSelectedConsultant(null);
  }, []);

  const handleOpenRecord = useCallback(
    (record: AdminConsultationRecordLite) => {
      if (!selectedConsultant) {
        return;
      }
      if (Platform.OS !== 'web') {
        void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      }
      const href =
        `/(admin)/(operation)/records/${record.id}?consultantId=${selectedConsultant.id}` as Href;
      router.push(href);
    },
    [router, selectedConsultant],
  );

  const topBarTitle = selectedConsultant
    ? ADMIN_CONSULTATION_RECORDS_COPY.STEP_RECORDS
    : ADMIN_CONSULTATION_RECORDS_COPY.PAGE_TITLE;

  if (!allowed) {
    return (
      <SafeAreaView style={[styles.safe, { backgroundColor: theme.colors.bgMain }]} edges={['top']}>
        <AppTopBar title={ADMIN_CONSULTATION_RECORDS_COPY.PAGE_TITLE} canGoBack />
        <View style={[styles.denied, { paddingHorizontal: theme.spacing.lg }]}>
          <EmptyState
            icon={<FileText size={32} color={theme.colors.textTertiary} />}
            title={ADMIN_CONSULTATION_RECORDS_COPY.ACCESS_DENIED_TITLE}
            description={accessDeniedMessage}
          />
        </View>
      </SafeAreaView>
    );
  }

  if (!ready) {
    return (
      <SafeAreaView style={[styles.safe, { backgroundColor: theme.colors.bgMain }]} edges={['top']}>
        <AppTopBar title={ADMIN_CONSULTATION_RECORDS_COPY.PAGE_TITLE} canGoBack />
        <View style={[styles.denied, { paddingHorizontal: theme.spacing.lg }]}>
          <EmptyState
            icon={<FileText size={32} color={theme.colors.textTertiary} />}
            title={ADMIN_API_QUERY_NOT_READY_COPY.TITLE}
            description={ADMIN_API_QUERY_NOT_READY_COPY.DESCRIPTION}
            actionLabel={ADMIN_API_QUERY_NOT_READY_COPY.RETRY}
            onAction={handleSessionRetry}
          />
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={[styles.safe, { backgroundColor: theme.colors.bgMain }]} edges={['top']}>
      <AppTopBar title={topBarTitle} canGoBack />
      <View style={[styles.body, { paddingHorizontal: theme.spacing.lg }]}>
        <Text
          style={{
            color: theme.colors.textSecondary,
            fontFamily: theme.fontFamily.regular,
            fontSize: theme.fontSize.sm,
            marginTop: theme.spacing.md,
          }}
        >
          {selectedConsultant
            ? toDisplayString(selectedConsultant.name, '상담사')
            : ADMIN_CONSULTATION_RECORDS_COPY.PAGE_SUBTITLE}
        </Text>

        {selectedConsultant ? (
          <Pressable
            onPress={handleBackToConsultants}
            accessibilityRole="button"
            style={{ marginTop: theme.spacing.sm }}
          >
            <Text
              style={{
                color: theme.colors.primary,
                fontFamily: theme.fontFamily.medium,
                fontSize: theme.fontSize.sm,
              }}
            >
              {ADMIN_CONSULTATION_RECORDS_COPY.BACK_TO_CONSULTANTS}
            </Text>
          </Pressable>
        ) : null}

        <View
          style={[
            styles.searchRow,
            {
              marginTop: theme.spacing.md,
              backgroundColor: theme.colors.surface,
              borderRadius: theme.borderRadius.lg,
              paddingHorizontal: theme.spacing.md,
            },
          ]}
        >
          <Search size={18} color={theme.colors.textTertiary} />
          <TextInput
            value={selectedConsultant ? recordSearch : consultantSearch}
            onChangeText={selectedConsultant ? setRecordSearch : setConsultantSearch}
            placeholder={
              selectedConsultant
                ? ADMIN_CONSULTATION_RECORDS_COPY.SEARCH_RECORDS_PLACEHOLDER
                : ADMIN_CONSULTATION_RECORDS_COPY.SEARCH_CONSULTANT_PLACEHOLDER
            }
            placeholderTextColor={theme.colors.textTertiary}
            style={[
              styles.searchInput,
              {
                color: theme.colors.textMain,
                fontFamily: theme.fontFamily.regular,
                fontSize: theme.fontSize.base,
              },
            ]}
            autoCapitalize="none"
            autoCorrect={false}
            clearButtonMode="while-editing"
          />
        </View>

        {!selectedConsultant ? (
          <ConsultantPickerList
            consultants={filteredConsultants}
            isLoading={consultantsLoading}
            isError={consultantsQuery.isError}
            refreshing={refreshing}
            onRefresh={handleRefresh}
            onSelect={handleSelectConsultant}
          />
        ) : (
          <RecordsList
            records={filteredRecords}
            isLoading={recordsLoading}
            isError={recordsQuery.isError}
            refreshing={refreshing}
            onRefresh={handleRefresh}
            onPressRecord={handleOpenRecord}
          />
        )}
      </View>
    </SafeAreaView>
  );
}

type ConsultantPickerListProps = {
  readonly consultants: AdminConsultantPickerItem[];
  readonly isLoading: boolean;
  readonly isError: boolean;
  readonly refreshing: boolean;
  readonly onRefresh: () => void;
  readonly onSelect: (item: AdminConsultantPickerItem) => void;
};

function ConsultantPickerList({
  consultants,
  isLoading,
  isError,
  refreshing,
  onRefresh,
  onSelect,
}: ConsultantPickerListProps) {
  const theme = useTheme();

  if (isError) {
    return (
      <View style={styles.listArea}>
        <EmptyState
          icon={<User size={32} color={theme.colors.textTertiary} />}
          title={ADMIN_CONSULTATION_RECORDS_COPY.CONSULTANT_ERROR}
        />
      </View>
    );
  }

  if (isLoading) {
    return (
      <View style={styles.listArea}>
        <SkeletonCard />
        <SkeletonCard />
      </View>
    );
  }

  if (consultants.length === 0) {
    return (
      <View style={styles.listArea}>
        <EmptyState
          icon={<User size={32} color={theme.colors.textTertiary} />}
          title={ADMIN_CONSULTATION_RECORDS_COPY.CONSULTANT_EMPTY}
        />
      </View>
    );
  }

  return (
    <FlatList
      data={consultants}
      keyExtractor={(item) => String(item.id)}
      style={styles.listArea}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
      renderItem={({ item }) => (
        <Pressable
          onPress={() => onSelect(item)}
          style={[
            styles.rowCard,
            {
              backgroundColor: theme.colors.surface,
              borderRadius: theme.borderRadius.xl,
              padding: theme.spacing.lg,
              marginBottom: theme.spacing.sm,
            },
          ]}
        >
          <View style={styles.rowMain}>
            <Text
              style={{
                color: theme.colors.textMain,
                fontFamily: theme.fontFamily.semibold,
                fontSize: theme.fontSize.base,
              }}
            >
              {toDisplayString(item.name, '상담사')}
            </Text>
            {item.email ? (
              <Text
                style={{
                  color: theme.colors.textSecondary,
                  fontFamily: theme.fontFamily.regular,
                  fontSize: theme.fontSize.sm,
                  marginTop: theme.spacing.xs,
                }}
              >
                {toDisplayString(item.email, '—')}
              </Text>
            ) : null}
          </View>
          <ChevronRight size={20} color={theme.colors.textTertiary} />
        </Pressable>
      )}
    />
  );
}

type RecordsListProps = {
  readonly records: AdminConsultationRecordLite[];
  readonly isLoading: boolean;
  readonly isError: boolean;
  readonly refreshing: boolean;
  readonly onRefresh: () => void;
  readonly onPressRecord: (record: AdminConsultationRecordLite) => void;
};

function RecordsList({
  records,
  isLoading,
  isError,
  refreshing,
  onRefresh,
  onPressRecord,
}: RecordsListProps) {
  const theme = useTheme();

  if (isLoading) {
    return (
      <View style={styles.listArea}>
        <ActivityIndicator color={theme.colors.primary} style={{ marginTop: 24 }} />
      </View>
    );
  }

  if (isError) {
    return (
      <View style={styles.listArea}>
        <EmptyState
          icon={<FileText size={32} color={theme.colors.textTertiary} />}
          title={ADMIN_CONSULTATION_RECORDS_COPY.RECORDS_ERROR}
        />
      </View>
    );
  }

  if (records.length === 0) {
    return (
      <View style={styles.listArea}>
        <EmptyState
          icon={<FileText size={32} color={theme.colors.textTertiary} />}
          title={ADMIN_CONSULTATION_RECORDS_COPY.RECORDS_EMPTY}
        />
      </View>
    );
  }

  return (
    <FlatList
      data={records}
      keyExtractor={(item) => String(item.id)}
      style={styles.listArea}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
      renderItem={({ item }) => {
        const badge = recordStatusBadge(item);
        return (
          <Pressable
            onPress={() => onPressRecord(item)}
            style={[
              styles.rowCard,
              {
                backgroundColor: theme.colors.surface,
                borderRadius: theme.borderRadius.xl,
                padding: theme.spacing.lg,
                marginBottom: theme.spacing.sm,
              },
            ]}
          >
            <View style={styles.rowMain}>
              <View style={styles.recordTitleRow}>
                <Text
                  style={{
                    color: theme.colors.textMain,
                    fontFamily: theme.fontFamily.semibold,
                    fontSize: theme.fontSize.base,
                    flex: 1,
                  }}
                  numberOfLines={1}
                >
                  {toDisplayString(item.title, '상담 기록')}
                </Text>
                <Badge label={badge.label} variant={badge.variant} />
              </View>
              <Text
                style={{
                  color: theme.colors.textSecondary,
                  fontFamily: theme.fontFamily.regular,
                  fontSize: theme.fontSize.sm,
                  marginTop: theme.spacing.xs,
                }}
              >
                {toDisplayString(item.clientName, '내담자')}
              </Text>
              <Text
                style={{
                  color: theme.colors.textTertiary,
                  fontFamily: theme.fontFamily.regular,
                  fontSize: theme.fontSize.xs,
                  marginTop: theme.spacing.xs,
                }}
              >
                {formatSessionDate(item.sessionDate)}
              </Text>
            </View>
            <ChevronRight size={20} color={theme.colors.textTertiary} />
          </Pressable>
        );
      }}
    />
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
  },
  body: {
    flex: 1,
  },
  denied: {
    flex: 1,
    justifyContent: 'center',
  },
  searchRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  searchInput: {
    flex: 1,
    paddingVertical: 12,
  },
  listArea: {
    flex: 1,
    marginTop: 16,
  },
  rowCard: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  rowMain: {
    flex: 1,
    marginRight: 8,
  },
  recordTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
});
