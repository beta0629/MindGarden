/**
 * 상담사 내담자 관리 화면
 *
 * 웹의 frontend/src/components/consultant/ConsultantClientList.js를 참고
 */

import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, StyleSheet, ScrollView, RefreshControl, TouchableOpacity, TextInput } from 'react-native';
import { Users, Search, Phone, Mail, Calendar, User } from 'lucide-react-native';
import SimpleLayout from '../../components/layout/SimpleLayout';
import UnifiedLoading from '../../components/UnifiedLoading';
import DashboardSection from '../../components/DashboardSection';
import MGButton from '../../components/MGButton';
import { useSession } from '../../contexts/SessionContext';
import { apiGet } from '../../api/client';
import { ADMIN_API } from '../../api/endpoints';
import { COLORS, SPACING, TYPOGRAPHY, SHADOWS, BORDER_RADIUS } from '../../constants/theme';
import SIZES from '../../constants/sizes';
import { STRINGS } from '../../constants/strings';

const ClientManagement = () => {
  const { user } = useSession();
  const [clients, setClients] = useState([]);
  const [stats, setStats] = useState({
    totalClients: 0,
    activeClients: 0,
    totalSessions: 0,
    remainingSessions: 0,
  });
  const [isLoading, setIsLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [error, setError] = useState(null);

  // 내담자 목록 및 통계 조회
  const loadClients = useCallback(async () => {
    if (!user?.id) return;

    try {
      setIsLoading(true);
      setError(null);

      // 내담자 목록 조회 (통계는 목록 데이터에서 계산)
      const clientsResponse = await apiGet(ADMIN_API.GET_CLIENTS_BY_CONSULTANT(user.id));

      // 내담자 목록 처리
      if (clientsResponse?.success && clientsResponse?.data) {
        const mappingsData = Array.isArray(clientsResponse.data) ? clientsResponse.data : [];
        
        // 웹 버전과 동일한 변환 로직
        const clientsData = mappingsData
          .map(item => {
            // client 객체가 중첩되어 있는 경우
            if (item.client && typeof item.client === 'object' && !Array.isArray(item.client)) {
              return {
                id: item.mappingId || item.id, // mappingId를 우선 사용
                clientId: item.client.id, // 실제 클라이언트 ID
                name: item.client.name,
                email: item.client.email || '',
                phone: item.client.phone || '',
                status: item.client.status || 'ACTIVE',
                createdAt: item.assignedAt || item.client.createdAt || item.createdAt,
                profileImage: item.client.profileImage || null,
                remainingSessions: item.remainingSessions || 0,
                totalSessions: item.totalSessions || 0,
                usedSessions: item.usedSessions || 0,
                packageName: item.packageName,
                packagePrice: item.packagePrice,
                paymentStatus: item.paymentStatus,
                paymentDate: item.paymentDate,
                mappingId: item.id,
              };
            }
            // 이미 평면화된 경우
            return item;
          })
          .filter(client => client && client.id && client.name); // 유효한 client만 필터링
        
        // 최신순 정렬 (웹과 동일)
        const sortedClients = clientsData.sort((a, b) => {
          const dateA = new Date(a.createdAt || 0);
          const dateB = new Date(b.createdAt || 0);
          return dateB - dateA; // 최신순
        });
        
        setClients(sortedClients);

        // 통계 계산: API 응답의 원본 매핑 데이터에서 직접 계산
        // 백엔드 API는 이미 paymentStatus가 APPROVED 또는 PENDING인 매핑만 반환함
        // 따라서 모든 매핑이 활성 상태로 간주됨
        
        // 1. 전체 내담자 수: API 응답의 count 또는 배열 길이
        const totalClientsCount = clientsResponse.count !== undefined 
          ? Number(clientsResponse.count) 
          : mappingsData.length;
        
        // 2. 활성 내담자 수: API가 이미 필터링된 데이터를 반환하므로 전체와 동일
        // 추가로 paymentStatus 확인
        const activeClientsCount = mappingsData.filter(item => {
          if (!item) return false;
          const paymentStatus = item.paymentStatus;
          return paymentStatus === 'APPROVED' || paymentStatus === 'PENDING' || paymentStatus === 'CONFIRMED';
        }).length;
        
        // 3. 전체 상담 세션 수: 각 매핑의 totalSessions 합산
        // 백엔드에서 Integer로 반환되므로 직접 Number 변환
        let totalSessionsSum = 0;
        let remainingSessionsSum = 0;
        
        mappingsData.forEach(item => {
          if (item) {
            // totalSessions가 null이거나 undefined인 경우 0으로 처리
            const sessions = (item.totalSessions !== null && item.totalSessions !== undefined) 
              ? Number(item.totalSessions) 
              : 0;
            totalSessionsSum += isNaN(sessions) ? 0 : sessions;
            
            // remainingSessions가 null이거나 undefined인 경우 0으로 처리
            const remaining = (item.remainingSessions !== null && item.remainingSessions !== undefined)
              ? Number(item.remainingSessions)
              : 0;
            remainingSessionsSum += isNaN(remaining) ? 0 : remaining;
          }
        });
        
        setStats({
          totalClients: totalClientsCount || 0,
          activeClients: activeClientsCount > 0 ? activeClientsCount : totalClientsCount,
          totalSessions: totalSessionsSum || 0,
          remainingSessions: remainingSessionsSum || 0,
        });
      } else {
        throw new Error(clientsResponse?.message || STRINGS.ERROR.LOAD_FAILED || '내담자 목록을 불러오는데 실패했습니다.');
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

  // 검색 필터링
  const filteredClients = clients.filter(client =>
    client.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    client.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    client.phone?.includes(searchTerm)
  );

  // 날짜 포맷
  const formatDate = (dateString) => {
    if (!dateString) return STRINGS.CONSULTANT.NO_INFO || '정보 없음';
    try {
      const date = new Date(dateString);
      return date.toLocaleDateString('ko-KR');
    } catch (error) {
      return dateString;
    }
  };

  if (isLoading) {
    return (
      <SimpleLayout title={STRINGS.CONSULTANT.QUICK_ACTION_ITEMS.CLIENTS}>
        <UnifiedLoading text={STRINGS.COMMON.LOADING_DATA} size="large" type="fullscreen" />
      </SimpleLayout>
    );
  }

  return (
    <SimpleLayout title={STRINGS.CONSULTANT.QUICK_ACTION_ITEMS.CLIENTS}>
      <ScrollView
        style={styles.container}
        contentContainerStyle={styles.contentContainer}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
      >
        {/* 검색 */}
        <DashboardSection title={STRINGS.COMMON.SEARCH || '검색'} icon={<Search size={SIZES.ICON.MD} color={COLORS.primary} />}>
          <View style={styles.searchContainer}>
            <View style={styles.searchInputContainer}>
              <Search size={SIZES.ICON.MD} color={COLORS.gray500} style={styles.searchIcon} />
              <TextInput
                style={styles.searchInput}
                placeholder={STRINGS.CLIENT.NAME_EMAIL_PHONE || '이름, 이메일, 전화번호로 검색'}
                placeholderTextColor={COLORS.gray400}
                value={searchTerm}
                onChangeText={setSearchTerm}
              />
            </View>
          </View>
        </DashboardSection>

        {/* 통계 */}
        <DashboardSection title={STRINGS.CONSULTANT.TOTAL_CLIENTS || '내담자 통계'} icon={<Users size={SIZES.ICON.MD} color={COLORS.primary} />}>
          <View style={styles.statsContainer}>
            <View style={styles.statItem}>
              <Text style={styles.statLabel}>{STRINGS.COMMON.ALL || '전체 내담자'}</Text>
              <Text style={styles.statValue}>{stats.totalClients || 0}</Text>
            </View>
            <View style={styles.statItem}>
              <Text style={styles.statLabel}>{STRINGS.CONSULTANT.ACTIVE_CLIENTS || '활성 내담자'}</Text>
              <Text style={styles.statValue}>{stats.activeClients || 0}</Text>
            </View>
            <View style={styles.statItem}>
              <Text style={styles.statLabel}>{STRINGS.CONSULTANT.TOTAL_SESSIONS || '전체 상담'}</Text>
              <Text style={styles.statValue}>{stats.totalSessions || 0}</Text>
            </View>
            <View style={styles.statItem}>
              <Text style={styles.statLabel}>{STRINGS.CONSULTANT.REMAINING_SESSIONS || '남은 상담'}</Text>
              <Text style={styles.statValue}>{stats.remainingSessions || 0}</Text>
            </View>
          </View>
        </DashboardSection>

        {/* 내담자 목록 */}
        <DashboardSection title={STRINGS.CONSULTANT.CLIENT_LIST || '내담자 목록'} icon={<Users size={SIZES.ICON.MD} color={COLORS.primary} />}>
          {error ? (
            <View style={styles.errorContainer}>
              <Text style={styles.errorText}>{error}</Text>
              <MGButton
                variant="primary"
                size="small"
                onPress={loadClients}
                style={styles.retryButton}
              >
                <Text style={styles.retryButtonText}>{STRINGS.COMMON.RETRY || '다시 시도'}</Text>
              </MGButton>
            </View>
          ) : filteredClients.length > 0 ? (
            <View style={styles.clientList}>
              {filteredClients.map((client, index) => (
                <TouchableOpacity
                  key={client.id || index}
                  style={styles.clientCard}
                  onPress={() => {
                    // TODO: 내담자 상세 화면으로 이동
                    // navigation.navigate(CONSULTANT_SCREENS.CLIENT_DETAIL, { clientId: client.id });
                  }}
                >
                  <View style={styles.clientHeader}>
                    <View style={styles.clientAvatar}>
                      <User size={SIZES.ICON.LG} color={COLORS.primary} />
                    </View>
                    <View style={styles.clientInfo}>
                      <Text style={styles.clientName}>{client.name || STRINGS.CONSULTANT.NO_INFO}</Text>
                      <Text style={styles.clientEmail}>{client.email || STRINGS.CONSULTANT.NO_INFO}</Text>
                    </View>
                  </View>

                  <View style={styles.clientDetails}>
                    <View style={styles.detailRow}>
                      <Phone size={SIZES.ICON.SM} color={COLORS.gray500} />
                      <Text style={styles.detailText}>{client.phone || STRINGS.CONSULTANT.NO_INFO}</Text>
                    </View>
                    <View style={styles.detailRow}>
                      <Calendar size={SIZES.ICON.SM} color={COLORS.gray500} />
                      <Text style={styles.detailText}>
                        {STRINGS.CLIENT.JOIN_DATE || '가입일'}: {formatDate(client.createdAt || client.joinDate)}
                      </Text>
                    </View>
                  </View>
                </TouchableOpacity>
              ))}
            </View>
          ) : (
            <View style={styles.emptyState}>
              <Users size={SIZES.ICON['2XL']} color={COLORS.gray400} />
              <Text style={styles.emptyText}>
                {searchTerm
                  ? STRINGS.CONSULTANT.NO_CLIENTS_FOUND || '검색 결과가 없습니다.'
                  : STRINGS.CONSULTANT.NO_CLIENTS || '등록된 내담자가 없습니다.'}
              </Text>
              {!searchTerm && (
                <Text style={styles.emptySubText}>
                  {STRINGS.CONSULTANT.NO_CLIENTS_HINT || '새로운 내담자가 매칭되면 여기에 표시됩니다.'}
                </Text>
              )}
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
  statsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: SPACING.md,
  },
  statItem: {
    flex: 1,
    minWidth: '48%',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: COLORS.white,
    borderRadius: BORDER_RADIUS.md,
    padding: SPACING.md,
    minHeight: SIZES.CARD.MIN_HEIGHT,
    ...SHADOWS.sm,
  },
  statLabel: {
    fontSize: TYPOGRAPHY.fontSize.sm,
    color: COLORS.gray600,
    marginBottom: SPACING.xs,
  },
  statValue: {
    fontSize: TYPOGRAPHY.fontSize['2xl'] || TYPOGRAPHY.fontSize.xl,
    fontWeight: TYPOGRAPHY.fontWeight.bold,
    color: COLORS.primary,
    textAlign: 'center',
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
    alignItems: 'center',
    marginBottom: SPACING.md,
  },
  clientAvatar: {
    width: SIZES.PROFILE_IMAGE.AVATAR,
    height: SIZES.PROFILE_IMAGE.AVATAR,
    borderRadius: SIZES.PROFILE_IMAGE.AVATAR / 2,
    backgroundColor: COLORS.primaryLight,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: SPACING.md,
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
  clientDetails: {
    gap: SPACING.sm,
  },
  detailRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.xs,
  },
  detailText: {
    fontSize: TYPOGRAPHY.fontSize.sm,
    color: COLORS.gray600,
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
  emptySubText: {
    fontSize: TYPOGRAPHY.fontSize.sm,
    color: COLORS.gray400,
    marginTop: SPACING.sm,
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

