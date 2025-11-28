import React, { useState, useEffect } from 'react';
import { User, Users, Link2, Calendar, CheckCircle, Activity } from 'lucide-react';
import StatCard from '../../../ui/Card/StatCard';
import DashboardSection from '../../../layout/DashboardSection';
import { apiGet } from '../../../../utils/ajax';

/**
 * 관리자 시스템 개요 위젯
 * 기존 AdminDashboard의 "시스템 개요" 섹션을 위젯으로 변환
 * 
 * @author CoreSolution
 * @version 1.0.0
 * @since 2025-11-27
 */
const AdminSystemOverviewWidget = ({ config = {} }) => {
  const [stats, setStats] = useState({
    totalConsultants: 0,
    totalClients: 0,
    totalMappings: 0,
    activeMappings: 0,
    pendingMappings: 0
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // 통계 데이터 로드
  useEffect(() => {
    const loadStats = async () => {
      try {
        setLoading(true);
        
        // 기존 AdminDashboard와 동일한 API 호출
        const [
          consultantStats,
          clientStats, 
          mappingStats
        ] = await Promise.allSettled([
          apiGet('/api/admin/statistics/consultants'),
          apiGet('/api/admin/statistics/clients'),
          apiGet('/api/admin/statistics/mappings')
        ]);

        const newStats = {
          totalConsultants: consultantStats.status === 'fulfilled' ? consultantStats.value?.total || 0 : 0,
          totalClients: clientStats.status === 'fulfilled' ? clientStats.value?.total || 0 : 0,
          totalMappings: mappingStats.status === 'fulfilled' ? mappingStats.value?.total || 0 : 0,
          activeMappings: mappingStats.status === 'fulfilled' ? mappingStats.value?.active || 0 : 0,
          pendingMappings: mappingStats.status === 'fulfilled' ? mappingStats.value?.pending || 0 : 0
        };

        setStats(newStats);
        console.debug('관리자 시스템 개요 위젯 로드 완료:', newStats);
        
      } catch (error) {
        console.error('시스템 개요 통계 로드 실패:', error);
        setError(error.message);
      } finally {
        setLoading(false);
      }
    };

    loadStats();
  }, []);

  if (loading) {
    return (
      <div className="admin-system-overview-widget loading">
        <div className="loading-spinner">로딩 중...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="admin-system-overview-widget error">
        <div className="error-message">통계 로드 실패: {error}</div>
      </div>
    );
  }

  return (
    <div className="admin-system-overview-widget">
      <DashboardSection
        title={config.title || "시스템 개요"}
        subtitle={config.subtitle || "전체 시스템 현황 요약"}
        icon={<Activity />}
      >
        <div className="mg-stats-grid">
          <StatCard
            icon={<User />}
            value={stats.totalConsultants}
            label="상담사"
            className="mg-stat-card"
          />
          <StatCard
            icon={<Users />}
            value={stats.totalClients}
            label="내담자"
            className="mg-stat-card"
          />
          <StatCard
            icon={<Link2 />}
            value={stats.totalMappings}
            label="총 매칭"
            className="mg-stat-card"
          />
          <StatCard
            icon={<CheckCircle />}
            value={stats.activeMappings}
            label="활성 매칭"
            className="mg-stat-card"
          />
        </div>
      </DashboardSection>
    </div>
  );
};

export default AdminSystemOverviewWidget;
