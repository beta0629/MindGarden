/**
 * 사용자 관리 화면
 *
 * 웹의 frontend/src/components/admin/UserManagement.js를 참고
 */

import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, StyleSheet, ScrollView, RefreshControl, TouchableOpacity, TextInput, Alert } from 'react-native';
import { Users, Search, Plus, Edit, Trash2, UserCheck, UserX, Filter } from 'lucide-react-native';
import SimpleLayout from '../../components/layout/SimpleLayout';
import UnifiedLoading from '../../components/UnifiedLoading';
import DashboardSection from '../../components/DashboardSection';
import MGButton from '../../components/MGButton';
import { useSession } from '../../contexts/SessionContext';
import { apiGet, apiPost, apiPut, apiDelete } from '../../api/client';
import { ADMIN_API } from '../../api/endpoints';
import { COLORS, SPACING, TYPOGRAPHY, SHADOWS, BORDER_RADIUS } from '../../constants/theme';
import SIZES from '../../constants/sizes';
import { STRINGS } from '../../constants/strings';

const UserManagement = () => {
  const { user } = useSession();
  const [users, setUsers] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [roleFilter, setRoleFilter] = useState('ALL');
  const [error, setError] = useState(null);

  // 사용자 목록 조회
  const loadUsers = useCallback(async () => {
    if (!user?.id) return;

    try {
      setIsLoading(true);
      setError(null);

      // 전체 사용자 목록 조회
      const response = await apiGet(ADMIN_API.GET_ALL_USERS);

      if (response?.success && response?.data) {
        setUsers(response.data);
      } else {
        throw new Error(STRINGS.ERROR.LOAD_FAILED || '사용자 목록을 불러오는데 실패했습니다.');
      }
    } catch (error) {
      console.error('사용자 로드 실패:', error);
      setError(STRINGS.ERROR.LOAD_FAILED || '사용자 목록을 불러올 수 없습니다.');
    } finally {
      setIsLoading(false);
      setRefreshing(false);
    }
  }, [user?.id]);

  useEffect(() => {
    loadUsers();
  }, [loadUsers]);

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    loadUsers();
  }, [loadUsers]);

  // 필터링된 사용자 목록
  const filteredUsers = users.filter(user => {
    const matchesSearch = user.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         user.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         user.role?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === 'ALL' || user.status === statusFilter;
    const matchesRole = roleFilter === 'ALL' || user.role === roleFilter;

    return matchesSearch && matchesStatus && matchesRole;
  });

  // 사용자 상태 토글
  const toggleUserStatus = async (userId, currentStatus) => {
    try {
      const newStatus = currentStatus === 'ACTIVE' ? 'INACTIVE' : 'ACTIVE';
      const response = await apiPut(ADMIN_API.UPDATE_USER(userId), { status: newStatus });

      if (response?.success) {
        // 로컬 상태 업데이트
        setUsers(prev => prev.map(user =>
          user.id === userId ? { ...user, status: newStatus } : user
        ));
        Alert.alert(
          STRINGS.SUCCESS.SUCCESS,
          newStatus === 'ACTIVE' ? STRINGS.USER.ACTIVATED : STRINGS.USER.DEACTIVATED
        );
      } else {
        throw new Error(STRINGS.ERROR.UPDATE_FAILED || '상태 변경에 실패했습니다.');
      }
    } catch (error) {
      console.error('상태 변경 실패:', error);
      Alert.alert(STRINGS.ERROR.ERROR, STRINGS.ERROR.UPDATE_FAILED || '상태 변경에 실패했습니다.');
    }
  };

  // 사용자 삭제
  const deleteUser = async (userId, userName) => {
    Alert.alert(
      STRINGS.COMMON.CONFIRM,
      `${userName}${STRINGS.USER.DELETE_CONFIRM}`,
      [
        { text: STRINGS.COMMON.CANCEL, style: 'cancel' },
        {
          text: STRINGS.COMMON.DELETE,
          style: 'destructive',
          onPress: async () => {
            try {
              const response = await apiDelete(ADMIN_API.DELETE_USER(userId));

              if (response?.success) {
                // 로컬 상태 업데이트
                setUsers(prev => prev.filter(user => user.id !== userId));
                Alert.alert(STRINGS.SUCCESS.SUCCESS, STRINGS.SUCCESS.DELETED);
              } else {
                throw new Error(STRINGS.ERROR.DELETE_FAILED || '삭제에 실패했습니다.');
              }
            } catch (error) {
              console.error('사용자 삭제 실패:', error);
              Alert.alert(STRINGS.ERROR.ERROR, STRINGS.ERROR.DELETE_FAILED || '삭제에 실패했습니다.');
            }
          }
        }
      ]
    );
  };

  // 역할 표시 텍스트
  const getRoleDisplayText = (role) => {
    switch (role) {
      case 'CLIENT': return STRINGS.USER.ROLE_CLIENT;
      case 'CONSULTANT': return STRINGS.USER.ROLE_CONSULTANT;
      case 'ADMIN': return STRINGS.USER.ROLE_ADMIN;
      case 'HQ_ADMIN': return STRINGS.USER.ROLE_HQ_ADMIN;
      default: return role;
    }
  };

  // 상태 표시 텍스트 및 색상
  const getStatusDisplayInfo = (status) => {
    switch (status) {
      case 'ACTIVE':
        return {
          text: STRINGS.USER.STATUS_ACTIVE,
          color: COLORS.success,
          bgColor: COLORS.successLight
        };
      case 'INACTIVE':
        return {
          text: STRINGS.USER.STATUS_INACTIVE,
          color: COLORS.gray500,
          bgColor: COLORS.gray100
        };
      case 'PENDING':
        return {
          text: STRINGS.USER.STATUS_PENDING,
          color: COLORS.warning,
          bgColor: COLORS.warningLight
        };
      default:
        return {
          text: status,
          color: COLORS.gray500,
          bgColor: COLORS.gray100
        };
    }
  };

  if (isLoading) {
    return (
      <SimpleLayout title={STRINGS.ADMIN.USER_MANAGEMENT}>
        <UnifiedLoading text={STRINGS.COMMON.LOADING_DATA} size="large" type="fullscreen" />
      </SimpleLayout>
    );
  }

  return (
    <SimpleLayout title={STRINGS.ADMIN.USER_MANAGEMENT}>
      <ScrollView
        style={styles.container}
        contentContainerStyle={styles.contentContainer}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
      >
        {/* 검색 및 필터 */}
        <DashboardSection title={STRINGS.COMMON.SEARCH_FILTER} icon={<Search size={SIZES.ICON.MD} color={COLORS.primary} />}>
          <View style={styles.searchContainer}>
            <View style={styles.searchInputContainer}>
              <Search size={SIZES.ICON.MD} color={COLORS.gray500} style={styles.searchIcon} />
              <TextInput
                style={styles.searchInput}
                placeholder={STRINGS.USER.SEARCH_PLACEHOLDER}
                placeholderTextColor={COLORS.gray400}
                value={searchTerm}
                onChangeText={setSearchTerm}
              />
            </View>
          </View>

          <View style={styles.filtersContainer}>
            <View style={styles.filterRow}>
              <Text style={styles.filterLabel}>{STRINGS.USER.STATUS}:</Text>
              <View style={styles.filterButtons}>
                {[
                  { value: 'ALL', label: STRINGS.COMMON.ALL },
                  { value: 'ACTIVE', label: STRINGS.USER.STATUS_ACTIVE },
                  { value: 'INACTIVE', label: STRINGS.USER.STATUS_INACTIVE },
                  { value: 'PENDING', label: STRINGS.USER.STATUS_PENDING },
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

            <View style={styles.filterRow}>
              <Text style={styles.filterLabel}>{STRINGS.USER.ROLE}:</Text>
              <View style={styles.filterButtons}>
                {[
                  { value: 'ALL', label: STRINGS.COMMON.ALL },
                  { value: 'CLIENT', label: STRINGS.USER.ROLE_CLIENT },
                  { value: 'CONSULTANT', label: STRINGS.USER.ROLE_CONSULTANT },
                  { value: 'ADMIN', label: STRINGS.USER.ROLE_ADMIN },
                ].map((role) => (
                  <TouchableOpacity
                    key={role.value}
                    style={[
                      styles.filterButton,
                      roleFilter === role.value && styles.filterButtonActive,
                    ]}
                    onPress={() => setRoleFilter(role.value)}
                  >
                    <Text style={[
                      styles.filterButtonText,
                      roleFilter === role.value && styles.filterButtonTextActive,
                    ]}>
                      {role.label}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>
          </View>
        </DashboardSection>

        {/* 통계 */}
        <DashboardSection title={STRINGS.USER.USER_STATISTICS} icon={<Users size={SIZES.ICON.MD} color={COLORS.primary} />}>
          <View style={styles.statsContainer}>
            <View style={styles.statItem}>
              <Text style={styles.statLabel}>{STRINGS.COMMON.ALL}</Text>
              <Text style={styles.statValue}>{users.length}</Text>
            </View>
            <View style={styles.statItem}>
              <Text style={styles.statLabel}>{STRINGS.USER.STATUS_ACTIVE}</Text>
              <Text style={styles.statValue}>{users.filter(u => u.status === 'ACTIVE').length}</Text>
            </View>
            <View style={styles.statItem}>
              <Text style={styles.statLabel}>{STRINGS.USER.STATUS_INACTIVE}</Text>
              <Text style={styles.statValue}>{users.filter(u => u.status === 'INACTIVE').length}</Text>
            </View>
            <View style={styles.statItem}>
              <Text style={styles.statLabel}>{STRINGS.COMMON.SEARCH}</Text>
              <Text style={styles.statValue}>{filteredUsers.length}</Text>
            </View>
          </View>
        </DashboardSection>

        {/* 사용자 목록 */}
        <DashboardSection title={STRINGS.USER.USER_LIST} icon={<Users size={SIZES.ICON.MD} color={COLORS.primary} />}>
          {error ? (
            <View style={styles.errorContainer}>
              <Text style={styles.errorText}>{error}</Text>
              <MGButton
                variant="primary"
                size="small"
                onPress={loadUsers}
                style={styles.retryButton}
              >
                <Text style={styles.retryButtonText}>{STRINGS.COMMON.RETRY}</Text>
              </MGButton>
            </View>
          ) : filteredUsers.length > 0 ? (
            <View style={styles.userList}>
              {filteredUsers.map((userItem) => {
                const statusInfo = getStatusDisplayInfo(userItem.status);
                return (
                  <View key={userItem.id} style={styles.userCard}>
                    <View style={styles.userHeader}>
                      <View style={styles.userInfo}>
                        <Text style={styles.userName}>{userItem.name || STRINGS.USER.NO_NAME}</Text>
                        <Text style={styles.userEmail}>{userItem.email || STRINGS.USER.NO_EMAIL}</Text>
                      </View>
                      <View style={styles.userStatus}>
                        <View style={[styles.statusBadge, { backgroundColor: statusInfo.bgColor }]}>
                          <Text style={[styles.statusText, { color: statusInfo.color }]}>
                            {statusInfo.text}
                          </Text>
                        </View>
                      </View>
                    </View>

                    <View style={styles.userDetails}>
                      <Text style={styles.userRole}>{STRINGS.USER.ROLE}: {getRoleDisplayText(userItem.role)}</Text>
                      <Text style={styles.userCreated}>
                        {STRINGS.USER.CREATED_AT}: {new Date(userItem.createdAt).toLocaleDateString('ko-KR')}
                      </Text>
                    </View>

                    <View style={styles.userActions}>
                      <TouchableOpacity
                        style={[styles.actionButton, styles.editButton]}
                        onPress={() => {
                          // TODO: 사용자 수정 모달 열기
                          // setSelectedUser(userItem);
                          // setShowEditModal(true);
                        }}
                      >
                        <Edit size={SIZES.ICON.SM} color={COLORS.primary} />
                        <Text style={styles.actionButtonText}>{STRINGS.COMMON.EDIT}</Text>
                      </TouchableOpacity>

                      <TouchableOpacity
                        style={[styles.actionButton, userItem.status === 'ACTIVE' ? styles.deactivateButton : styles.activateButton]}
                        onPress={() => toggleUserStatus(userItem.id, userItem.status)}
                      >
                        {userItem.status === 'ACTIVE' ? (
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
                        style={[styles.actionButton, styles.deleteButton]}
                        onPress={() => deleteUser(userItem.id, userItem.name)}
                      >
                        <Trash2 size={SIZES.ICON.SM} color={COLORS.error} />
                        <Text style={styles.actionButtonText}>{STRINGS.COMMON.DELETE}</Text>
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
                {searchTerm || statusFilter !== 'ALL' || roleFilter !== 'ALL'
                  ? STRINGS.USER.NO_USERS_FOUND
                  : STRINGS.USER.NO_USERS}
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
  filtersContainer: {
    gap: SPACING.md,
  },
  filterRow: {
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
  },
  statItem: {
    width: '100%',
    alignItems: 'center',
    backgroundColor: COLORS.white,
    borderRadius: BORDER_RADIUS.md,
    padding: SPACING.md,
    ...SHADOWS.sm,
  },
  statLabel: {
    fontSize: TYPOGRAPHY.fontSize.sm,
    color: COLORS.gray600,
    marginBottom: SPACING.xs,
  },
  statValue: {
    fontSize: TYPOGRAPHY.fontSize['2xl'],
    fontWeight: TYPOGRAPHY.fontWeight.bold,
    color: COLORS.primary,
  },
  userList: {
    gap: SPACING.md,
  },
  userCard: {
    backgroundColor: COLORS.white,
    borderRadius: BORDER_RADIUS.lg,
    padding: SPACING.md,
    ...SHADOWS.sm,
  },
  userHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: SPACING.md,
  },
  userInfo: {
    flex: 1,
  },
  userName: {
    fontSize: TYPOGRAPHY.fontSize.lg,
    fontWeight: TYPOGRAPHY.fontWeight.semibold,
    color: COLORS.dark,
    marginBottom: SPACING.xs,
  },
  userEmail: {
    fontSize: TYPOGRAPHY.fontSize.base,
    color: COLORS.gray600,
  },
  userStatus: {
    alignItems: 'flex-end',
  },
  statusBadge: {
    paddingHorizontal: SPACING.sm,
    paddingVertical: SPACING.xs,
    borderRadius: BORDER_RADIUS.sm,
  },
  statusText: {
    fontSize: TYPOGRAPHY.fontSize.sm,
    fontWeight: TYPOGRAPHY.fontWeight.semibold,
  },
  userDetails: {
    gap: SPACING.xs,
    marginBottom: SPACING.md,
  },
  userRole: {
    fontSize: TYPOGRAPHY.fontSize.base,
    color: COLORS.gray600,
  },
  userCreated: {
    fontSize: TYPOGRAPHY.fontSize.sm,
    color: COLORS.gray500,
  },
  userActions: {
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
  },
  editButton: {
    borderColor: COLORS.primary,
    backgroundColor: COLORS.primaryLight,
  },
  activateButton: {
    borderColor: COLORS.success,
    backgroundColor: COLORS.successLight,
  },
  deactivateButton: {
    borderColor: COLORS.warning,
    backgroundColor: COLORS.warningLight,
  },
  deleteButton: {
    borderColor: COLORS.error,
    backgroundColor: COLORS.errorLight,
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

export default UserManagement;

