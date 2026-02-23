/**
 * Admin Dashboard Monitoring Section
 * 관리자 대시보드 모니터링 섹션 (AI·보안, 시스템) — Organism
 * 스펙: ADMIN_DASHBOARD_MONITORING_DESIGN_SPEC 2.1·2.2·3.1, 5.3(헤더 액션)
 *
 * @author CoreSolution
 * @since 2025-12-02
 */

import React from 'react';
import { Link } from 'react-router-dom';
import DashboardSection from '../../layout/DashboardSection';
import { Activity, Brain } from 'lucide-react';
import AIMonitoringWidget from '../../dashboard/widgets/admin/AIMonitoringWidget';
import SchedulerStatusWidget from '../../dashboard/widgets/admin/SchedulerStatusWidget';
import SecurityAuditWidget from '../../dashboard/widgets/admin/SecurityAuditWidget';
import SystemMetricsWidget from '../../dashboard/widgets/admin/SystemMetricsWidget';
import AIUsageWidget from '../../dashboard/widgets/admin/AIUsageWidget';

/**
 * 관리자 대시보드 모니터링 섹션
 *
 * @param {Object} props
 * @param {Object} props.user - 사용자 정보
 */
const AdminDashboardMonitoring = ({ user }) => {
  // 위젯 설정
  const aiMonitoringWidget = {
    id: 'ai-monitoring',
    type: 'ai-monitoring',
    title: 'AI 모니터링',
    config: {
      refreshInterval: 30000 // 30초
    }
  };

  const schedulerWidget = {
    id: 'scheduler-status',
    type: 'scheduler-status',
    title: '스케줄러 실행 현황',
    config: {
      refreshInterval: 60000 // 1분
    }
  };

  const securityAuditWidget = {
    id: 'security-audit',
    type: 'security-audit',
    title: '보안 감사 로그',
    config: {
      refreshInterval: 30000 // 30초
    }
  };

  const systemMetricsWidget = {
    id: 'system-metrics',
    type: 'system-metrics',
    title: '시스템 메트릭',
    config: {
      refreshInterval: 5000 // 5초
    }
  };

  const aiUsageWidget = {
    id: 'ai-usage',
    type: 'ai-usage',
    title: 'AI 사용량 및 비용',
    config: {
      refreshInterval: 60000 // 1분
    }
  };

  return (
    <>
      {/* Organism: AI 및 보안 모니터링 — 2열 그리드, 스펙 3.1·5.3 */}
      <DashboardSection
        title="AI 및 보안 모니터링"
        subtitle="AI 이상 탐지, 보안 위협, 감사 로그"
        icon={<Brain />}
        actions={
          <Link
            to="/admin/monitoring"
            className="mg-button mg-button--sm mg-button--text"
          >
            전체 모니터링 보기
          </Link>
        }
      >
        <div className="mg-grid mg-grid--cols-2 mg-monitoring-section-grid">
          <AIMonitoringWidget widget={aiMonitoringWidget} user={user} />
          <SecurityAuditWidget widget={securityAuditWidget} user={user} />
        </div>
      </DashboardSection>

      {/* Organism: 시스템 모니터링 — 3열 그리드, 스펙 3.1·5.3 */}
      <DashboardSection
        title="시스템 모니터링"
        subtitle="스케줄러, 시스템 리소스, AI 사용량"
        icon={<Activity />}
        actions={
          <Link
            to="/admin/monitoring"
            className="mg-button mg-button--sm mg-button--text"
          >
            전체 모니터링 보기
          </Link>
        }
      >
        <div className="mg-grid mg-grid--cols-3 mg-monitoring-section-grid">
          <SchedulerStatusWidget widget={schedulerWidget} user={user} />
          <SystemMetricsWidget widget={systemMetricsWidget} user={user} />
          <AIUsageWidget widget={aiUsageWidget} user={user} />
        </div>
      </DashboardSection>
    </>
  );
};

export default AdminDashboardMonitoring;

