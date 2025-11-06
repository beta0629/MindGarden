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

  // 대시보드 데이터 로드 (웹과 동일한 방식: 여러 개별 API 호출)
  const loadDashboardData = useCallback(async () => {
    if (!user?.id) return;

    try {
      setIsLoading(true);

      // 웹과 동일한 방식: 여러 API를 병렬로 호출하여 데이터 수집
      // 각 API 호출을 안전하게 래핑하는 헬퍼 함수
      const safeApiGet = async (url, apiName) => {
        try {
          return await apiGet(url);
        } catch (err) {
          // 에러 발생 시 조용히 기본값 반환 (콘솔에만 로그)
          if (__DEV__) {
            console.warn(`${apiName} 로드 실패 (기본값 사용):`, err?.message || err?.data?.message || '알 수 없는 오류');
          }
          return null;
        }
      };

      // 웹과 동일한 API 호출 패턴
      const [consultantsRes, clientsRes, mappingsRes, todayStatsRes] = await Promise.all([
        safeApiGet(`/api/admin/consultants/with-vacation?date=${new Date().toISOString().split('T')[0]}`, '상담사 통계'),
        safeApiGet('/api/admin/clients/with-mapping-info', '클라이언트 통계'),
        safeApiGet('/api/admin/mappings', '매핑 통계'),
        safeApiGet(`/api/schedules/today/statistics?userRole=${user.role}`, '오늘의 일정 통계'),
      ]);

      // 디버깅: API 응답 구조 확인
      if (__DEV__) {
        console.log('📊 API 응답 구조 확인:', {
          consultantsRes,
          clientsRes,
          mappingsRes,
          todayStatsRes,
        });
      }

      // 데이터 추출 및 합산 (웹과 동일한 로직)
      // apiGet은 이미 response.data를 반환하므로, 웹의 consultantsData와 동일한 구조
      let totalConsultants = 0;
      let totalClients = 0;
      let totalMappings = 0;
      let activeMappings = 0;
      let todaySchedules = 0;

      // 웹: consultantsData.count
      // 앱: consultantsRes는 이미 파싱된 데이터이므로 consultantsRes.count
      if (consultantsRes) {
        totalConsultants = consultantsRes.count || 0;
        if (__DEV__) {
          console.log('📊 상담사 통계:', { count: consultantsRes.count, full: consultantsRes });
        }
      }

      // 웹: clientsData.count
      // 앱: clientsRes는 이미 파싱된 데이터이므로 clientsRes.count
      if (clientsRes) {
        totalClients = clientsRes.count || 0;
        if (__DEV__) {
          console.log('📊 클라이언트 통계:', { count: clientsRes.count, full: clientsRes });
        }
      }

      // 웹: mappingsData.count, mappingsData.data 배열에서 activeMappings 필터링
      // 앱: mappingsRes는 이미 파싱된 데이터이므로 mappingsRes.count, mappingsRes.data 배열
      if (mappingsRes) {
        totalMappings = mappingsRes.count || 0;
        if (Array.isArray(mappingsRes.data)) {
          activeMappings = mappingsRes.data.filter(m => m.status === 'ACTIVE').length;
        }
        if (__DEV__) {
          console.log('📊 매핑 통계:', { 
            count: mappingsRes.count, 
            dataLength: mappingsRes.data?.length,
            activeMappings,
            full: mappingsRes 
          });
        }
      }

      // 웹: todayStatsRes는 별도로 처리하지 않음 (loadTodayStats에서 처리)
      // 앱: todayStatsRes는 이미 파싱된 데이터
      if (todayStatsRes) {
        todaySchedules = todayStatsRes.totalToday || 0;
      }

      // 총 사용자 = 상담사 + 내담자 (웹과 동일한 계산 방식)
      const totalUsers = totalConsultants + totalClients;

      // 통계 데이터 설정
      setDashboardData({
        totalUsers, // 상담사 + 내담자
        totalConsultants,
        totalClients,
        totalMappings,
        activeMappings,
        todaySchedules,
        pendingMessages: 0, // 별도 API 필요
        pendingRecords: 0, // 별도 API 필요
        systemHealth: 'GOOD',
      });

      if (__DEV__) {
        console.log('📊 최종 대시보드 데이터:', {
          totalUsers,
          totalConsultants,
          totalClients,
          totalMappings,
          activeMappings,
          todaySchedules,
        });
      }
    } catch (error) {
      // 예상치 못한 오류 발생 시 기본값으로 처리
      if (__DEV__) {
        console.error('📊 대시보드 데이터 로드 실패:', error);
      }
      
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
  }, [user?.id, user?.role]);

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

