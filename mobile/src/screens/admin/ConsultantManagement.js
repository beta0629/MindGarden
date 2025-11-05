/**
 * 상담사 관리 화면
 *
 * 웹의 frontend/src/components/admin/ConsultantManagement.js를 참고
 */

import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, StyleSheet, ScrollView, RefreshControl, TouchableOpacity, TextInput } from 'react-native';
import { Users, Search, Star, Calendar, FileText, Award, UserCheck, UserX, TrendingUp } from 'lucide-react-native';
import SimpleLayout from '../../components/layout/SimpleLayout';
import UnifiedLoading from '../../components/UnifiedLoading';
import DashboardSection from '../../components/DashboardSection';
import StatCard from '../../components/StatCard';
import MGButton from '../../components/MGButton';
import { useSession } from '../../contexts/SessionContext';
import { apiGet, apiPut } from '../../api/client';
import { ADMIN_API, RATING_API } from '../../api/endpoints';
import { COLORS, SPACING, TYPOGRAPHY, SHADOWS, BORDER_RADIUS } from '../../constants/theme';
import SIZES from '../../constants/sizes';
import { STRINGS } from '../../constants/strings';

const ConsultantManagement = () => {
  const { user } = useSession();
  const [consultants, setConsultants] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [error, setError] = useState(null);
  const [consultantStats, setConsultantStats] = useState({});

  // 상담사 목록 조회
  const loadConsultants = useCallback(async () => {
    if (!user?.id) return;

    try {
      setIsLoading(true);
      setError(null);

      // 상담사 목록 조회
      const response = await apiGet(ADMIN_API.GET_ALL_USERS);

      if (response?.success && response?.data) {
        // 상담사만 필터링
        const consultantList = response.data.filter(userItem => userItem.role === 'CONSULTANT');
        setConsultants(consultantList);

        // 각 상담사의 통계 정보 조회
        const statsPromises = consultantList.map(async (consultant) => {
          try {
            const statsResponse = await apiGet(RATING_API.GET_CONSULTANT_STATS(consultant.id));
            return {
              consultantId: consultant.id,
              stats: statsResponse?.data || {}
            };
          } catch (error) {
            console.warn(`상담사 ${consultant.id} 통계 조회 실패:`, error);
            return {
              consultantId: consultant.id,
              stats: {}
            };
          }
        });

        const statsResults = await Promise.all(statsPromises);
        const statsMap = {};
        statsResults.forEach(result => {
          statsMap[result.consultantId] = result.stats;
        });
        setConsultantStats(statsMap);
      } else {
        throw new Error(STRINGS.ERROR.LOAD_FAILED || '상담사 목록을 불러오는데 실패했습니다.');
      }
    } catch (error) {
      console.error('상담사 로드 실패:', error);
      setError(STRINGS.ERROR.LOAD_FAILED || '상담사 목록을 불러올 수 없습니다.');
    } finally {
      setIsLoading(false);
      setRefreshing(false);
    }
  }, [user?.id]);

  useEffect(() => {
    loadConsultants();
  }, [loadConsultants]);

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    loadConsultants();
  }, [loadConsultants]);

  // 필터링된 상담사 목록
  const filteredConsultants = consultants.filter(consultant =>
    consultant.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    consultant.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    consultant.specialty?.toLowerCase().includes(searchTerm.toLowerCase())
  ).filter(consultant => statusFilter === 'ALL' || consultant.status === statusFilter);

  // 상담사 상태 토글
  const toggleConsultantStatus = async (consultantId, currentStatus) => {
    try {
      const newStatus = currentStatus === 'ACTIVE' ? 'INACTIVE' : 'ACTIVE';
      const response = await apiPut(ADMIN_API.UPDATE_USER(consultantId), { status: newStatus });

      if (response?.success) {
        // 로컬 상태 업데이트
        setConsultants(prev => prev.map(consultant =>
          consultant.id === consultantId ? { ...consultant, status: newStatus } : consultant
        ));
      } else {
        throw new Error(STRINGS.ERROR.UPDATE_FAILED || '상태 변경에 실패했습니다.');
      }
    } catch (error) {
      console.error('상담사 상태 변경 실패:', error);
    }
  };

  // 상담사 통계 계산
  const getConsultantStats = (consultantId) => {
    return consultantStats[consultantId] || {};
  };

  if (isLoading) {
    return (
      <SimpleLayout title={STRINGS.ADMIN.CONSULTANT_MANAGEMENT || '상담사 관리'}>
        <UnifiedLoading text={STRINGS.COMMON.LOADING_DATA} size="large" type="fullscreen" />
      </SimpleLayout>
    );
  }

  return (
    <SimpleLayout title={STRINGS.ADMIN.CONSULTANT_MANAGEMENT || '상담사 관리'}>
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
                placeholder={STRINGS.CONSULTANT.SEARCH_PLACEHOLDER || '이름, 이메일, 전문 분야로 검색'}
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
            value={consultants.length.toString()}
            label={STRINGS.CONSULTANT.TOTAL_CONSULTANTS || '총 상담사'}
            style={styles.statCard}
          />
          <StatCard
            icon={<UserCheck size={SIZES.ICON.LG} color={COLORS.success} />}
            value={consultants.filter(c => c.status === 'ACTIVE').length.toString()}
            label={STRINGS.CONSULTANT.ACTIVE_CONSULTANTS || '활성 상담사'}
            style={styles.statCard}
          />
          <StatCard
            icon={<Star size={SIZES.ICON.LG} color={COLORS.warning} />}
            value={Object.values(consultantStats).reduce((sum, stats) => sum + (stats.totalRatings || 0), 0).toString()}
            label={STRINGS.CONSULTANT.TOTAL_RATINGS || '총 평가 수'}
            style={styles.statCard}
          />
          <StatCard
            icon={<TrendingUp size={SIZES.ICON.LG} color={COLORS.info} />}
            value={filteredConsultants.length.toString()}
            label={STRINGS.COMMON.SEARCH}
            style={styles.statCard}
          />
        </View>

        {/* 상담사 목록 */}
        <DashboardSection title={STRINGS.CONSULTANT.CONSULTANT_LIST || '상담사 목록'} icon={<Users size={SIZES.ICON.MD} color={COLORS.primary} />}>
          {error ? (
            <View style={styles.errorContainer}>
              <Text style={styles.errorText}>{error}</Text>
              <MGButton
                variant="primary"
                size="small"
                onPress={loadConsultants}
                style={styles.retryButton}
              >
                <Text style={styles.retryButtonText}>{STRINGS.COMMON.RETRY}</Text>
              </MGButton>
            </View>
          ) : filteredConsultants.length > 0 ? (
            <View style={styles.consultantList}>
              {filteredConsultants.map((consultant) => {
                const stats = getConsultantStats(consultant.id);
                return (
                  <View key={consultant.id} style={styles.consultantCard}>
                    <View style={styles.consultantHeader}>
                      <View style={styles.consultantInfo}>
                        <Text style={styles.consultantName}>{consultant.name || STRINGS.USER.NO_NAME}</Text>
                        <Text style={styles.consultantEmail}>{consultant.email || STRINGS.USER.NO_EMAIL}</Text>
                        {consultant.specialty && (
                          <Text style={styles.consultantSpecialty}>
                            {STRINGS.CONSULTANT.SPECIALTY || '전문 분야'}: {consultant.specialty}
                          </Text>
                        )}
                      </View>
                      <View style={styles.consultantStatus}>
                        <View style={[
                          styles.statusBadge,
                          consultant.status === 'ACTIVE' ? styles.statusActive : styles.statusInactive,
                        ]}>
                          <Text style={styles.statusText}>
                            {consultant.status === 'ACTIVE' ? STRINGS.USER.STATUS_ACTIVE : STRINGS.USER.STATUS_INACTIVE}
                          </Text>
                        </View>
                      </View>
                    </View>

                    {/* 통계 정보 */}
                    <View style={styles.consultantStats}>
                      <View style={styles.statRow}>
                        <View style={styles.statItem}>
                          <Award size={SIZES.ICON.SM} color={COLORS.warning} />
                          <Text style={styles.statValue}>{stats.averageRating?.toFixed(1) || '0.0'}</Text>
                          <Text style={styles.statLabel}>{STRINGS.CONSULTANT.AVERAGE_RATING}</Text>
                        </View>
                        <View style={styles.statItem}>
                          <FileText size={SIZES.ICON.SM} color={COLORS.info} />
                          <Text style={styles.statValue}>{stats.totalRatings || 0}</Text>
                          <Text style={styles.statLabel}>{STRINGS.CONSULTANT.TOTAL_RATINGS}</Text>
                        </View>
                        <View style={styles.statItem}>
                          <Calendar size={SIZES.ICON.SM} color={COLORS.success} />
                          <Text style={styles.statValue}>{stats.totalSessions || 0}</Text>
                          <Text style={styles.statLabel}>{STRINGS.CONSULTANT.TOTAL_SESSIONS}</Text>
                        </View>
                      </View>
                    </View>

                    {/* 액션 버튼 */}
                    <View style={styles.consultantActions}>
                      <TouchableOpacity
                        style={[
                          styles.actionButton,
                          consultant.status === 'ACTIVE' ? styles.deactivateButton : styles.activateButton,
                        ]}
                        onPress={() => toggleConsultantStatus(consultant.id, consultant.status)}
                      >
                        {consultant.status === 'ACTIVE' ? (
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
                          // TODO: 상담사 상세 화면으로 이동
                          // navigation.navigate(ADMIN_SCREENS.CONSULTANT_DETAIL, { consultantId: consultant.id });
                        }}
                      >
                        <Users size={SIZES.ICON.SM} color={COLORS.primary} />
                        <Text style={styles.actionButtonText}>{STRINGS.COMMON.VIEW}</Text>
                      </TouchableOpacity>
                    </View>
                  </View>
                );
              })}
            </View>
          ) : (
            <View style={styles.emptyState}>
              <Users size={SIZES.ICON['2XL']} color={COLORS.gray400} />
              <Text style={styles.emptyText}>
                {searchTerm || statusFilter !== 'ALL'
                  ? STRINGS.CONSULTANT.NO_CONSULTANTS_FOUND || '검색 결과가 없습니다.'
                  : STRINGS.CONSULTANT.NO_CONSULTANTS || '등록된 상담사가 없습니다.'}
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
  consultantList: {
    gap: SPACING.md,
  },
  consultantCard: {
    backgroundColor: COLORS.white,
    borderRadius: BORDER_RADIUS.lg,
    padding: SPACING.md,
    ...SHADOWS.sm,
  },
  consultantHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: SPACING.md,
  },
  consultantInfo: {
    flex: 1,
  },
  consultantName: {
    fontSize: TYPOGRAPHY.fontSize.lg,
    fontWeight: TYPOGRAPHY.fontWeight.semibold,
    color: COLORS.dark,
    marginBottom: SPACING.xs,
  },
  consultantEmail: {
    fontSize: TYPOGRAPHY.fontSize.base,
    color: COLORS.gray600,
    marginBottom: SPACING.xs,
  },
  consultantSpecialty: {
    fontSize: TYPOGRAPHY.fontSize.sm,
    color: COLORS.primary,
    fontWeight: TYPOGRAPHY.fontWeight.semibold,
  },
  consultantStatus: {
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
  consultantStats: {
    marginBottom: SPACING.md,
  },
  statRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    paddingVertical: SPACING.sm,
    backgroundColor: COLORS.gray50,
    borderRadius: BORDER_RADIUS.md,
  },
  statItem: {
    alignItems: 'center',
    gap: SPACING.xs,
  },
  statValue: {
    fontSize: TYPOGRAPHY.fontSize.lg,
    fontWeight: TYPOGRAPHY.fontWeight.bold,
    color: COLORS.primary,
  },
  statLabel: {
    fontSize: TYPOGRAPHY.fontSize.sm,
    color: COLORS.gray600,
    textAlign: 'center',
  },
  consultantActions: {
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

export default ConsultantManagement;

