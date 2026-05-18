/**
 * 어드민·스태프 — 사용자 조회 (읽기 전용)
 *
 * @author MindGarden
 * @since 2026-05-16
 */
import { useCallback, useMemo, useState } from 'react';
import {
  FlatList,
  Platform,
  Pressable,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import * as Haptics from 'expo-haptics';
import { Users } from 'lucide-react-native';
import { useTheme } from '@/theme';
import { AppTopBar } from '@/components/templates/AppTopBar';
import { Badge } from '@/components/atoms/Badge';
import { Chip } from '@/components/atoms/Chip';
import { EmptyState } from '@/components/atoms/EmptyState';
import { SearchBar } from '@/components/atoms/SearchBar';
import { SkeletonCard } from '@/components/atoms/SkeletonLoader';
import { UnifiedModal } from '@/components/common/modals/UnifiedModal';
import { useAdminUserManagement } from '@/api/hooks/useAdminUserManagement';
import { useAdminApiQueryReady } from '@/hooks/useAdminApiQueryReady';
import {
  ADMIN_USER_MANAGEMENT_COPY,
  ADMIN_USER_MANAGEMENT_ROLE_FILTERS,
  ADMIN_USER_MANAGEMENT_ROLE_LABELS,
  type AdminUserManagementRoleFilter,
} from '@/constants/adminUserManagementCopy';
import {
  ADMIN_API_QUERY_NOT_READY_COPY,
  ADMIN_MOBILE_OPERATION_COPY,
} from '@/constants/adminMobileScreensCopy';
import { useAuthStore } from '@/stores/useAuthStore';
import { isAdminMobileShellRole } from '@/utils/adminRole';
import {
  filterAdminManagedUsersBySearch,
  type AdminManagedUserListItem,
} from '@/utils/adminUserManagementNormalize';
import { toDisplayString } from '@/utils/safeDisplay';
import {
  isAdminListQueryLoading,
  retryAdminApiSession,
} from '@/utils/retryAdminApiSession';

function roleLabel(role: string): string {
  const code = role.trim().toUpperCase();
  return ADMIN_USER_MANAGEMENT_ROLE_LABELS[code] ?? toDisplayString(role, '—');
}

function roleBadgeVariant(
  role: string,
): 'primary' | 'success' | 'warning' | 'error' | 'info' | 'gray' {
  const code = role.trim().toUpperCase();
  if (code === 'ADMIN') {
    return 'primary';
  }
  if (code === 'CONSULTANT' || code === 'PLAY_THERAPIST' || code === 'SPEECH_THERAPIST') {
    return 'info';
  }
  if (code === 'STAFF') {
    return 'warning';
  }
  return 'gray';
}

type DetailFieldProps = {
  readonly label: string;
  readonly value: string;
};

function DetailField({ label, value }: DetailFieldProps) {
  const theme = useTheme();
  return (
    <View style={styles.detailRow}>
      <Text
        style={{
          width: 72,
          fontFamily: theme.fontFamily.medium,
          fontSize: theme.fontSize.sm,
          color: theme.colors.textSecondary,
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

export default function AdminUsersScreen() {
  const theme = useTheme();
  const storeRole = useAuthStore((s) => s.role);
  const allowed = isAdminMobileShellRole(storeRole);

  const [roleFilter, setRoleFilter] = useState<AdminUserManagementRoleFilter>('ALL');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedUser, setSelectedUser] = useState<AdminManagedUserListItem | null>(null);
  const [refreshing, setRefreshing] = useState(false);

  const { ready } = useAdminApiQueryReady();
  const listQuery = useAdminUserManagement(roleFilter);
  const showLoading = isAdminListQueryLoading(listQuery.isLoading, listQuery.data, {
    isError: listQuery.isError,
  });

  const filteredUsers = useMemo(
    () => filterAdminManagedUsersBySearch(listQuery.data ?? [], searchQuery),
    [listQuery.data, searchQuery],
  );

  const handleRefresh = useCallback(async () => {
    setRefreshing(true);
    await listQuery.refetch();
    setRefreshing(false);
  }, [listQuery]);

  const handleSessionRetry = useCallback(() => {
    retryAdminApiSession();
    void listQuery.refetch();
  }, [listQuery]);

  const openDetail = useCallback((user: AdminManagedUserListItem) => {
    if (Platform.OS !== 'web') {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
    setSelectedUser(user);
  }, []);

  const closeDetail = useCallback(() => {
    setSelectedUser(null);
  }, []);

  const renderItem = useCallback(
    ({ item }: { item: AdminManagedUserListItem }) => {
      const statusLabel = item.isActive
        ? ADMIN_USER_MANAGEMENT_COPY.STATUS_ACTIVE
        : ADMIN_USER_MANAGEMENT_COPY.STATUS_INACTIVE;
      const statusVariant = item.isActive ? 'success' : 'error';
      const phoneDisplay =
        item.phone.trim() !== '' ? item.phone : ADMIN_USER_MANAGEMENT_COPY.PHONE_NONE;

      return (
        <Pressable
          onPress={() => openDetail(item)}
          style={({ pressed }) => [
            styles.row,
            {
              backgroundColor: theme.colors.surface,
              borderColor: theme.colors.divider,
              opacity: pressed ? 0.92 : 1,
            },
          ]}
          accessibilityRole="button"
          accessibilityLabel={`${item.name}, ${roleLabel(item.role)}, ${statusLabel}`}
        >
          <View style={styles.rowMain}>
            <Text
              style={{
                fontFamily: theme.fontFamily.semibold,
                fontSize: theme.fontSize.base,
                color: theme.colors.textMain,
              }}
              numberOfLines={1}
            >
              {toDisplayString(item.name, '—')}
            </Text>
            <Text
              style={{
                marginTop: 4,
                fontFamily: theme.fontFamily.regular,
                fontSize: theme.fontSize.sm,
                color: theme.colors.textSecondary,
              }}
              numberOfLines={1}
            >
              {toDisplayString(item.email, '—')}
            </Text>
            <Text
              style={{
                marginTop: 2,
                fontFamily: theme.fontFamily.regular,
                fontSize: theme.fontSize.xs,
                color: theme.colors.textTertiary,
              }}
              numberOfLines={1}
            >
              {phoneDisplay}
            </Text>
            <View style={styles.badgeRow}>
              <Badge label={roleLabel(item.role)} variant={roleBadgeVariant(item.role)} />
              <View style={{ width: theme.spacing.xs }} />
              <Badge label={statusLabel} variant={statusVariant} />
            </View>
          </View>
        </Pressable>
      );
    },
    [openDetail, theme],
  );

  if (!allowed) {
    return (
      <SafeAreaView style={[styles.safe, { backgroundColor: theme.colors.bgMain }]} edges={['top']}>
        <AppTopBar title={ADMIN_MOBILE_OPERATION_COPY.USERS} canGoBack />
        <EmptyState
          icon={<Users size={32} color={theme.colors.textTertiary} />}
          title={ADMIN_USER_MANAGEMENT_COPY.ACCESS_DENIED}
        />
      </SafeAreaView>
    );
  }

  const listHeader = (
    <View style={{ paddingBottom: theme.spacing.md }}>
      <SearchBar
        value={searchQuery}
        onChangeText={setSearchQuery}
        placeholder={ADMIN_USER_MANAGEMENT_COPY.SEARCH_PLACEHOLDER}
        style={{ marginBottom: theme.spacing.md }}
      />
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.chipRow}
      >
        {ADMIN_USER_MANAGEMENT_ROLE_FILTERS.map((chip) => (
          <Chip
            key={chip.value}
            label={chip.label}
            selected={roleFilter === chip.value}
            onPress={() => setRoleFilter(chip.value)}
            style={styles.chip}
          />
        ))}
      </ScrollView>
    </View>
  );

  return (
    <SafeAreaView style={[styles.safe, { backgroundColor: theme.colors.bgMain }]} edges={['top']}>
      <AppTopBar title={ADMIN_MOBILE_OPERATION_COPY.USERS} canGoBack />

      {!ready ? (
        <View style={[styles.loading, { paddingHorizontal: theme.spacing.lg }]}>
          <EmptyState
            icon={<Users size={32} color={theme.colors.textTertiary} />}
            title={ADMIN_API_QUERY_NOT_READY_COPY.TITLE}
            description={ADMIN_API_QUERY_NOT_READY_COPY.DESCRIPTION}
            actionLabel={ADMIN_API_QUERY_NOT_READY_COPY.RETRY}
            onAction={handleSessionRetry}
          />
        </View>
      ) : showLoading ? (
        <View style={[styles.loading, { paddingHorizontal: theme.spacing.lg }]}>
          <SkeletonCard />
          <SkeletonCard />
        </View>
      ) : listQuery.isError ? (
        <View style={{ paddingHorizontal: theme.spacing.lg, paddingTop: theme.spacing.lg }}>
          {listHeader}
          <EmptyState
            icon={<Users size={32} color={theme.colors.textTertiary} />}
            title={ADMIN_USER_MANAGEMENT_COPY.ERROR}
          />
        </View>
      ) : (
        <FlatList
          data={filteredUsers}
          keyExtractor={(item) => String(item.id)}
          renderItem={renderItem}
          ListHeaderComponent={listHeader}
          contentContainerStyle={[
            styles.listContent,
            { paddingHorizontal: theme.spacing.lg },
            filteredUsers.length === 0 && styles.listContentEmpty,
          ]}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={handleRefresh}
              tintColor={theme.colors.primary}
            />
          }
          ListEmptyComponent={
            <EmptyState
              icon={<Users size={32} color={theme.colors.textTertiary} />}
              title={ADMIN_USER_MANAGEMENT_COPY.EMPTY}
            />
          }
        />
      )}

      <UnifiedModal
        isOpen={selectedUser != null}
        onClose={closeDetail}
        title={ADMIN_USER_MANAGEMENT_COPY.DETAIL_MODAL_TITLE}
        subtitle={selectedUser != null ? toDisplayString(selectedUser.name, '—') : undefined}
        actions={[
          {
            label: ADMIN_USER_MANAGEMENT_COPY.DETAIL_CLOSE,
            onPress: closeDetail,
            variant: 'primary',
          },
        ]}
      >
        {selectedUser != null ? (
          <View style={styles.detailBody}>
            <DetailField
              label={ADMIN_USER_MANAGEMENT_COPY.DETAIL_LABEL_NAME}
              value={toDisplayString(selectedUser.name, '—')}
            />
            <DetailField
              label={ADMIN_USER_MANAGEMENT_COPY.DETAIL_LABEL_EMAIL}
              value={toDisplayString(selectedUser.email, '—')}
            />
            <DetailField
              label={ADMIN_USER_MANAGEMENT_COPY.DETAIL_LABEL_PHONE}
              value={
                selectedUser.phone.trim() !== ''
                  ? selectedUser.phone
                  : ADMIN_USER_MANAGEMENT_COPY.PHONE_NONE
              }
            />
            <DetailField
              label={ADMIN_USER_MANAGEMENT_COPY.DETAIL_LABEL_ROLE}
              value={roleLabel(selectedUser.role)}
            />
            <DetailField
              label={ADMIN_USER_MANAGEMENT_COPY.DETAIL_LABEL_STATUS}
              value={
                selectedUser.isActive
                  ? ADMIN_USER_MANAGEMENT_COPY.STATUS_ACTIVE
                  : ADMIN_USER_MANAGEMENT_COPY.STATUS_INACTIVE
              }
            />
          </View>
        ) : null}
      </UnifiedModal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
  },
  loading: {
    paddingTop: 16,
  },
  listContent: {
    paddingBottom: 32,
    paddingTop: 8,
  },
  listContentEmpty: {
    flexGrow: 1,
  },
  chipRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingRight: 8,
  },
  chip: {
    marginRight: 8,
  },
  row: {
    borderWidth: 1,
    borderRadius: 12,
    padding: 14,
    marginBottom: 10,
  },
  rowMain: {
    flex: 1,
  },
  badgeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 10,
  },
  detailBody: {
    gap: 12,
  },
  detailRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
});
