/**
 * 내담자 종합 관리 화면
 *
 * 웹의 frontend/src/components/admin/ClientComprehensiveManagement.js를 참고
 */

import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, StyleSheet, ScrollView, RefreshControl, TouchableOpacity, TextInput } from 'react-native';
import { Users, Search, UserCheck, UserX, Calendar, FileText, TrendingUp } from 'lucide-react-native';
import SimpleLayout from '../../components/layout/SimpleLayout';
import UnifiedLoading from '../../components/UnifiedLoading';
import DashboardSection from '../../components/DashboardSection';
import StatCard from '../../components/StatCard';
import MGButton from '../../components/MGButton';
import { useSession } from '../../contexts/SessionContext';
import { apiGet, apiPut } from '../../api/client';
import { ADMIN_API } from '../../api/endpoints';
import { COLORS, SPACING, TYPOGRAPHY, SHADOWS, BORDER_RADIUS } from '../../constants/theme';
import SIZES from '../../constants/sizes';
import { STRINGS } from '../../constants/strings';

const ClientManagement = () => {
  const { user } = useSession();
  const [clients, setClients] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [error, setError] = useState(null);

  // 내담자 목록 조회
  const loadClients = useCallback(async () => {
    if (!user?.id) return;

    try {
      setIsLoading(true);
      setError(null);

      // 전체 사용자 목록 조회 후 내담자만 필터링
      const response = await apiGet(ADMIN_API.GET_ALL_USERS);

      if (response?.success && response?.data) {
        // 내담자만 필터링
        const clientList = response.data.filter(userItem => userItem.role === 'CLIENT');
        setClients(clientList);
      } else {
        throw new Error(STRINGS.ERROR.LOAD_FAILED || '내담자 목록을 불러오는데 실패했습니다.');
      }
    } catch (error) {
      console.error('내담자 로드 실패:', error);
      setError(STRINGS.ERROR.LOAD_FAILED || '내담자 목록을 불러올 수 없습니다.');
    } finally {
      setIsLoading(false);
      setRefreshing(false);
    }
  }, [user?.id]);

  useEffect(() => {
    loadClients();
  }, [loadClients]);

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    loadClients();
  }, [loadClients]);

  // 필터링된 내담자 목록
  const filteredClients = clients.filter(client =>
    client.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    client.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    client.phone?.includes(searchTerm)
  ).filter(client => statusFilter === 'ALL' || client.status === statusFilter);

  // 내담자 상태 토글
  const toggleClientStatus = async (clientId, currentStatus) => {
    try {
      const newStatus = currentStatus === 'ACTIVE' ? 'INACTIVE' : 'ACTIVE';
      const response = await apiPut(ADMIN_API.UPDATE_USER(clientId), { status: newStatus });

      if (response?.success) {
        // 로컬 상태 업데이트
        setClients(prev => prev.map(client =>
          client.id === clientId ? { ...client, status: newStatus } : client
        ));
      } else {
        throw new Error(STRINGS.ERROR.UPDATE_FAILED || '상태 변경에 실패했습니다.');
      }
    } catch (error) {
      console.error('내담자 상태 변경 실패:', error);
    }
  };

  if (isLoading) {
    return (
      <SimpleLayout title={STRINGS.ADMIN.CLIENT_MANAGEMENT || '내담자 관리'}>
        <UnifiedLoading text={STRINGS.COMMON.LOADING_DATA} size="large" type="fullscreen" />
      </SimpleLayout>
    );
  }

  return (
    <SimpleLayout title={STRINGS.ADMIN.CLIENT_MANAGEMENT || '내담자 관리'}>
      <ScrollView
        style={styles.container}
        contentContainerStyle={styles.contentContainer}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
      >
        {/* 검색 */}
        <DashboardSection title={STRINGS.COMMON.SEARCH_FILTER} icon={<Search size={SIZES.ICON.MD} color={COLORS.primary} />}>
          <View style={styles.searchContainer}>
            <View style={styles.searchInputContainer}>
              <Search size={SIZES.ICON.MD} color={COLORS.gray500} style={styles.searchIcon} />
              <TextInput
                style={styles.searchInput}
                placeholder={STRINGS.CLIENT.SEARCH_PLACEHOLDER || '이름, 이메일, 전화번호로 검색'}
                placeholderTextColor={COLORS.gray400}
                value={searchTerm}
                onChangeText={setSearchTerm}
              />
            </View>
          </View>

          <View style={styles.filterContainer}>
            <Text style={styles.filterLabel}>{STRINGS.USER.STATUS}:</Text>
            <View style={styles.filterButtons}>
              {[
                { value: 'ALL', label: STRINGS.COMMON.ALL },
                { value: 'ACTIVE', label: STRINGS.USER.STATUS_ACTIVE },
                { value: 'INACTIVE', label: STRINGS.USER.STATUS_INACTIVE },
              ].map((status) => (
                <TouchableOpacity
                  key={status.value}
                  style={[
                    styles.filterButton,
                    statusFilter === status.value && styles.filterButtonActive,
                  ]}
                  onPress={() => setStatusFilter(status.value)}
                >
                  <Text style={[
                    styles.filterButtonText,
                    statusFilter === status.value && styles.filterButtonTextActive,
                  ]}>
                    {status.label}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>
        </DashboardSection>

        {/* 통계 카드 */}
        <View style={styles.statsContainer}>
          <StatCard
            icon={<Users size={SIZES.ICON.LG} color={COLORS.primary} />}
            value={clients.length.toString()}
            label={STRINGS.ADMIN.TOTAL_CLIENTS}
            style={styles.statCard}
          />
          <StatCard
            icon={<UserCheck size={SIZES.ICON.LG} color={COLORS.success} />}
            value={clients.filter(c => c.status === 'ACTIVE').length.toString()}
            label={STRINGS.CLIENT.ACTIVE_CLIENTS || '활성 내담자'}
            style={styles.statCard}
          />
          <StatCard
            icon={<Calendar size={SIZES.ICON.LG} color={COLORS.info} />}
            value={clients.filter(c => c.createdAt && new Date(c.createdAt) > new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)).length.toString()}
            label={STRINGS.CLIENT.NEW_CLIENTS || '신규 내담자'}
            style={styles.statCard}
          />
          <StatCard
            icon={<TrendingUp size={SIZES.ICON.LG} color={COLORS.warning} />}
            value={filteredClients.length.toString()}
            label={STRINGS.COMMON.SEARCH}
            style={styles.statCard}
          />
        </View>

        {/* 내담자 목록 */}
        <DashboardSection title={STRINGS.CLIENT.CLIENT_LIST} icon={<Users size={SIZES.ICON.MD} color={COLORS.primary} />}>
          {error ? (
            <View style={styles.errorContainer}>
              <Text style={styles.errorText}>{error}</Text>
              <MGButton
                variant="primary"
                size="small"
                onPress={loadClients}
                style={styles.retryButton}
              >
                <Text style={styles.retryButtonText}>{STRINGS.COMMON.RETRY}</Text>
              </MGButton>
            </View>
          ) : filteredClients.length > 0 ? (
            <View style={styles.clientList}>
              {filteredClients.map((client) => (
                <View key={client.id} style={styles.clientCard}>
                  <View style={styles.clientHeader}>
                    <View style={styles.clientInfo}>
                      <Text style={styles.clientName}>{client.name || STRINGS.USER.NO_NAME}</Text>
                      <Text style={styles.clientEmail}>{client.email || STRINGS.USER.NO_EMAIL}</Text>
                    </View>
                    <View style={styles.clientStatus}>
                      <View style={[
                        styles.statusBadge,
                        client.status === 'ACTIVE' ? styles.statusActive : styles.statusInactive,
                      ]}>
                        <Text style={styles.statusText}>
                          {client.status === 'ACTIVE' ? STRINGS.USER.STATUS_ACTIVE : STRINGS.USER.STATUS_INACTIVE}
                        </Text>
                      </View>
                    </View>
                  </View>

                  <View style={styles.clientDetails}>
                    <Text style={styles.clientPhone}>
                      {STRINGS.CLIENT.PHONE}: {client.phone || STRINGS.USER.NO_INFO}
                    </Text>
                    <Text style={styles.clientCreated}>
                      {STRINGS.USER.CREATED_AT}: {new Date(client.createdAt).toLocaleDateString('ko-KR')}
                    </Text>
                    {client.lastLoginAt && (
                      <Text style={styles.clientLastLogin}>
                        {STRINGS.CLIENT.LAST_LOGIN || '최근 로그인'}: {new Date(client.lastLoginAt).toLocaleDateString('ko-KR')}
                      </Text>
                    )}
                  </View>

                  {/* 액션 버튼 */}
                  <View style={styles.clientActions}>
                    <TouchableOpacity
                      style={[
                        styles.actionButton,
                        client.status === 'ACTIVE' ? styles.deactivateButton : styles.activateButton,
                      ]}
                      onPress={() => toggleClientStatus(client.id, client.status)}
                    >
                      {client.status === 'ACTIVE' ? (
                        <>
                          <UserX size={SIZES.ICON.SM} color={COLORS.warning} />
                          <Text style={styles.actionButtonText}>{STRINGS.USER.DEACTIVATE}</Text>
                        </>
                      ) : (
                        <>
                          <UserCheck size={SIZES.ICON.SM} color={COLORS.success} />
                          <Text style={styles.actionButtonText}>{STRINGS.USER.ACTIVATE}</Text>
                        </>
                      )}
                    </TouchableOpacity>

                    <TouchableOpacity
                      style={[styles.actionButton, styles.detailButton]}
                      onPress={() => {
                        // TODO: 내담자 상세 화면으로 이동
                        // navigation.navigate(ADMIN_SCREENS.CLIENT_DETAIL, { clientId: client.id });
                      }}
                    >
                      <Users size={SIZES.ICON.SM} color={COLORS.primary} />
                      <Text style={styles.actionButtonText}>{STRINGS.COMMON.VIEW}</Text>
                    </TouchableOpacity>
                  </View>
                </View>
              ))}
            </View>
          ) : (
            <View style={styles.emptyState}>
              <Users size={SIZES.ICON['2XL']} color={COLORS.gray400} />
              <Text style={styles.emptyText}>
                {searchTerm || statusFilter !== 'ALL'
                  ? STRINGS.CLIENT.NO_CLIENTS_FOUND || '검색 결과가 없습니다.'
                  : STRINGS.CLIENT.NO_CLIENTS || '등록된 내담자가 없습니다.'}
              </Text>
            </View>
          )}
        </DashboardSection>
      </ScrollView>
    </SimpleLayout>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  contentContainer: {
    padding: SPACING.md,
  },
  searchContainer: {
    gap: SPACING.md,
  },
  searchInputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.white,
    borderRadius: BORDER_RADIUS.md,
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.sm,
    borderWidth: SIZES.BORDER_WIDTH.THIN,
    borderColor: COLORS.border,
  },
  searchIcon: {
    marginRight: SPACING.sm,
  },
  searchInput: {
    flex: 1,
    fontSize: TYPOGRAPHY.fontSize.base,
    color: COLORS.dark,
  },
  filterContainer: {
    gap: SPACING.sm,
  },
  filterLabel: {
    fontSize: TYPOGRAPHY.fontSize.sm,
    fontWeight: TYPOGRAPHY.fontWeight.semibold,
    color: COLORS.gray600,
  },
  filterButtons: {
    flexDirection: 'row',
    gap: SPACING.sm,
    flexWrap: 'wrap',
  },
  filterButton: {
    paddingHorizontal: SPACING.sm,
    paddingVertical: SPACING.xs,
    borderRadius: BORDER_RADIUS.sm,
    borderWidth: SIZES.BORDER_WIDTH.THIN,
    borderColor: COLORS.border,
    backgroundColor: COLORS.white,
  },
  filterButtonActive: {
    borderColor: COLORS.primary,
    backgroundColor: COLORS.primaryLight,
  },
  filterButtonText: {
    fontSize: TYPOGRAPHY.fontSize.sm,
    color: COLORS.gray600,
  },
  filterButtonTextActive: {
    color: COLORS.primary,
    fontWeight: TYPOGRAPHY.fontWeight.semibold,
  },
  statsContainer: {
    gap: SPACING.md,
    marginBottom: SPACING.lg,
  },
  statCard: {
    width: '100%',
    marginBottom: 0,
  },
  clientList: {
    gap: SPACING.md,
  },
  clientCard: {
    backgroundColor: COLORS.white,
    borderRadius: BORDER_RADIUS.lg,
    padding: SPACING.md,
    ...SHADOWS.sm,
  },
  clientHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: SPACING.md,
  },
  clientInfo: {
    flex: 1,
  },
  clientName: {
    fontSize: TYPOGRAPHY.fontSize.lg,
    fontWeight: TYPOGRAPHY.fontWeight.semibold,
    color: COLORS.dark,
    marginBottom: SPACING.xs,
  },
  clientEmail: {
    fontSize: TYPOGRAPHY.fontSize.base,
    color: COLORS.gray600,
  },
  clientStatus: {
    alignItems: 'flex-end',
  },
  statusBadge: {
    paddingHorizontal: SPACING.sm,
    paddingVertical: SPACING.xs,
    borderRadius: BORDER_RADIUS.sm,
  },
  statusActive: {
    backgroundColor: COLORS.successLight,
  },
  statusInactive: {
    backgroundColor: COLORS.gray100,
  },
  statusText: {
    fontSize: TYPOGRAPHY.fontSize.sm,
    fontWeight: TYPOGRAPHY.fontWeight.semibold,
    color: COLORS.dark,
  },
  clientDetails: {
    gap: SPACING.xs,
    marginBottom: SPACING.md,
  },
  clientPhone: {
    fontSize: TYPOGRAPHY.fontSize.base,
    color: COLORS.gray600,
  },
  clientCreated: {
    fontSize: TYPOGRAPHY.fontSize.sm,
    color: COLORS.gray500,
  },
  clientLastLogin: {
    fontSize: TYPOGRAPHY.fontSize.sm,
    color: COLORS.gray500,
  },
  clientActions: {
    flexDirection: 'row',
    gap: SPACING.sm,
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.xs,
    paddingHorizontal: SPACING.sm,
    paddingVertical: SPACING.xs,
    borderRadius: BORDER_RADIUS.sm,
    borderWidth: SIZES.BORDER_WIDTH.THIN,
    flex: 1,
    justifyContent: 'center',
  },
  activateButton: {
    borderColor: COLORS.success,
    backgroundColor: COLORS.successLight,
  },
  deactivateButton: {
    borderColor: COLORS.warning,
    backgroundColor: COLORS.warningLight,
  },
  detailButton: {
    borderColor: COLORS.primary,
    backgroundColor: COLORS.primaryLight,
  },
  actionButtonText: {
    fontSize: TYPOGRAPHY.fontSize.sm,
    fontWeight: TYPOGRAPHY.fontWeight.semibold,
  },
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: SPACING['2xl'],
  },
  emptyText: {
    fontSize: TYPOGRAPHY.fontSize.base,
    color: COLORS.gray500,
    marginTop: SPACING.md,
    textAlign: 'center',
  },
  errorContainer: {
    alignItems: 'center',
    padding: SPACING.lg,
  },
  errorText: {
    fontSize: TYPOGRAPHY.fontSize.base,
    color: COLORS.error,
    marginBottom: SPACING.md,
    textAlign: 'center',
  },
  retryButton: {
    marginTop: SPACING.sm,
  },
  retryButtonText: {
    color: COLORS.white,
    fontSize: TYPOGRAPHY.fontSize.base,
    fontWeight: TYPOGRAPHY.fontWeight.semibold,
  },
});

export default ClientManagement;

