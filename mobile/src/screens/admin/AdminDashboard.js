/**
 * 관리자 대시보드 화면 (Container Component)
 * 
 * 웹의 frontend/src/components/admin/AdminDashboard.js를 참고
 * Presentational/Container 분리 패턴 적용
 * - 로직만 담당 (데이터 fetching, 상태 관리)
 * - UI는 Presentational 컴포넌트에 위임
 */

import React, { useState, useEffect, useCallback } from 'react';
import { StyleSheet, ScrollView, RefreshControl } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { Calendar, Settings } from 'lucide-react-native';
import SimpleLayout from '../../components/layout/SimpleLayout';
import UnifiedLoading from '../../components/UnifiedLoading';
import DashboardSection from '../../components/DashboardSection';
import { useSession } from '../../contexts/SessionContext';
import { apiGet } from '../../api/client';
import { DASHBOARD_API } from '../../api/endpoints';
import { COLORS, SPACING } from '../../constants/theme';
import SIZES from '../../constants/sizes';
import { STRINGS } from '../../constants/strings';
// Presentational 컴포넌트들
import AdminDashboardStats from '../../components/admin/AdminDashboard/AdminDashboardStats';
import AdminDashboardActions from '../../components/admin/AdminDashboard/AdminDashboardActions';
import AdminDashboardSystem from '../../components/admin/AdminDashboard/AdminDashboardSystem';
import AdminDashboardActivities from '../../components/admin/AdminDashboard/AdminDashboardActivities';

const AdminDashboard = () => {
  const { user } = useSession();
  const navigation = useNavigation();
  const [dashboardData, setDashboardData] = useState({
    totalUsers: 0,
    totalConsultants: 0,
    totalClients: 0,
    totalMappings: 0,
    activeMappings: 0,
    todaySchedules: 0,
    pendingMessages: 0,
    pendingRecords: 0,
    systemHealth: 'GOOD',
  });
  const [isLoading, setIsLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  // 대시보드 데이터 로드
  const loadDashboardData = useCallback(async () => {
    if (!user?.id) return;

    try {
      setIsLoading(true);

      // 관리자 대시보드 데이터 조회
      const response = await apiGet(DASHBOARD_API.ADMIN);

      if (response?.success && response?.data) {
        setDashboardData(response.data);
      } else {
        // API가 없거나 실패 시 기본값 설정 (조용히 처리)
        console.log('📊 대시보드 API 응답 없음, 기본값 사용');
        setDashboardData({
          totalUsers: 0,
          totalConsultants: 0,
          totalClients: 0,
          totalMappings: 0,
          activeMappings: 0,
          todaySchedules: 0,
          pendingMessages: 0,
          pendingRecords: 0,
          systemHealth: 'GOOD',
        });
      }
    } catch (error) {
      // 백엔드 API가 구현되지 않았거나 오류가 발생해도 조용히 기본값으로 처리
      // 사용자에게는 빈 대시보드를 표시하되 오류 메시지는 표시하지 않음
      if (__DEV__) {
        // 개발 환경에서만 상세 로그 출력
        console.log('📊 대시보드 API 호출 실패 (기본값 사용):', {
          status: error.status,
          message: error.message,
        });
      }
      
      // 에러 시에도 기본값 표시 (사용자가 빈 대시보드를 볼 수 있도록)
      setDashboardData({
        totalUsers: 0,
        totalConsultants: 0,
        totalClients: 0,
        totalMappings: 0,
        activeMappings: 0,
        todaySchedules: 0,
        pendingMessages: 0,
        pendingRecords: 0,
        systemHealth: 'GOOD',
      });
    } finally {
      setIsLoading(false);
      setRefreshing(false);
    }
  }, [user?.id]);

  useEffect(() => {
    loadDashboardData();
  }, [loadDashboardData]);

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    loadDashboardData();
  }, [loadDashboardData]);

  // 네비게이션 핸들러
  const handleNavigate = useCallback((screen) => {
    navigation.navigate(screen);
  }, [navigation]);

  if (isLoading) {
    return (
      <SimpleLayout title={STRINGS.ADMIN.DASHBOARD_TITLE}>
        <UnifiedLoading text={STRINGS.COMMON.LOADING_DATA} size="large" type="fullscreen" />
      </SimpleLayout>
    );
  }

  return (
    <SimpleLayout title={STRINGS.ADMIN.DASHBOARD_TITLE}>
      <ScrollView
        style={styles.container}
        contentContainerStyle={styles.contentContainer}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
      >
        {/* 주요 통계 카드 - Presentational 컴포넌트 사용 */}
        <AdminDashboardStats stats={dashboardData} loading={isLoading} />

        {/* 시스템 상태 - Presentational 컴포넌트 사용 */}
        <DashboardSection 
          title={STRINGS.ADMIN.SYSTEM_STATUS} 
          icon={<Settings size={SIZES.ICON.MD} color={COLORS.primary} />}
        >
          <AdminDashboardSystem systemHealth={dashboardData.systemHealth} />
        </DashboardSection>

        {/* 오늘의 활동 - Presentational 컴포넌트 사용 */}
        <DashboardSection 
          title={STRINGS.ADMIN.TODAY_ACTIVITIES} 
          icon={<Calendar size={SIZES.ICON.MD} color={COLORS.primary} />}
        >
          <AdminDashboardActivities
            todaySchedules={dashboardData.todaySchedules}
            pendingMessages={dashboardData.pendingMessages}
            pendingRecords={dashboardData.pendingRecords}
          />
        </DashboardSection>

        {/* 빠른 액션 버튼들 - Presentational 컴포넌트 사용 */}
        <DashboardSection 
          title={STRINGS.ADMIN.QUICK_ACTIONS} 
          icon={<Settings size={SIZES.ICON.MD} color={COLORS.primary} />}
        >
          <AdminDashboardActions onNavigate={handleNavigate} />
        </DashboardSection>
      </ScrollView>
    </SimpleLayout>
  );
};

// Container 컴포넌트는 최소한의 스타일만 가짐 (레이아웃 관련)
// 상세 스타일은 Presentational 컴포넌트에 위임
const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  contentContainer: {
    padding: SPACING.md,
  },
});

export default AdminDashboard;

