import { useMemo, useCallback } from 'react';
import { useLocation } from 'react-router-dom';
import UnifiedLoading from '../common/UnifiedLoading';
import MGButton from '../common/MGButton';
import SafeText from '../common/SafeText';
import '../../styles/unified-design-tokens.css';
import '../admin/AdminDashboard/AdminDashboardB0KlA.css';
import './ComplianceDashboard.css';
import { ComplianceDashboardShell } from './ComplianceDashboardShell';
import {
  OverallSection,
  ProcessingCard,
  ImpactCard,
  BreachCard,
  EducationCard,
  PolicyCard,
  DestructionCard,
  ComplianceQuickActions,
  getComplianceLevelModifier
} from './ComplianceDashboardCards';
import { useComplianceDashboardData } from './useComplianceDashboardData';

const COMPLIANCE_TITLE_ID = 'compliance-dashboard-title';

const COMPLIANCE_SECTION_SUBTITLE = {
  '/admin/compliance/dashboard': '종합 컴플라이언스 지표와 준수 현황을 확인합니다.',
  '/admin/compliance/personal-data-processing': '개인정보 처리 건수 및 유형별 통계입니다.',
  '/admin/compliance/impact-assessment': '개인정보 영향평가 위험도 및 개선 영역입니다.',
  '/admin/compliance/breach-response': '침해사고 대응팀·절차 현황입니다.',
  '/admin/compliance/education': '개인정보보호 교육 이수 및 프로그램 현황입니다.',
  '/admin/compliance/policy': '처리방침 구성 요소 및 검토 일정입니다.',
  '/admin/compliance/destruction': '개인정보 파기·보관 현황입니다.',
  '/admin/compliance/audit': '감사·점검 관련 현황입니다.'
};

const URL_IMPACT_EXECUTE = '/api/v1/admin/compliance/impact-assessment/execute';
const URL_DESTRUCTION_ALL = '/api/v1/admin/personal-data-destruction/execute/all';
const URL_EDU_PLAN = '/api/v1/admin/compliance/education/plan';

/**
 * 컴플라이언스 모니터링 대시보드
 *
 * @author Core Solution
 * @version 1.0.0
 * @since 2024-12-19
 */
const ComplianceDashboard = () => {
  const location = useLocation();
  const sectionSubtitle = useMemo(
    () =>
      COMPLIANCE_SECTION_SUBTITLE[location.pathname] ||
      COMPLIANCE_SECTION_SUBTITLE['/admin/compliance/dashboard'],
    [location.pathname]
  );

  const {
    overallStatus,
    processingStatus,
    impactAssessment,
    breachResponse,
    educationStatus,
    policyStatus,
    destructionStatus,
    loading,
    error,
    loadComplianceData
  } = useComplianceDashboardData();

  const openImpactExecute = useCallback(() => {
    window.open(URL_IMPACT_EXECUTE, '_blank');
  }, []);

  const openDestructionAll = useCallback(() => {
    window.open(URL_DESTRUCTION_ALL, '_blank');
  }, []);

  const openEduPlan = useCallback(() => {
    window.open(URL_EDU_PLAN, '_blank');
  }, []);

  if (loading) {
    return (
      <ComplianceDashboardShell
        sectionSubtitle={sectionSubtitle}
        titleId={COMPLIANCE_TITLE_ID}
        refreshDisabled
        onRefresh={loadComplianceData}
      >
        <UnifiedLoading type="page" text="컴플라이언스 데이터를 불러오는 중..." />
      </ComplianceDashboardShell>
    );
  }

  if (error) {
    return (
      <ComplianceDashboardShell
        sectionSubtitle={sectionSubtitle}
        titleId={COMPLIANCE_TITLE_ID}
        refreshDisabled={false}
        onRefresh={loadComplianceData}
      >
        <section
          className="mg-v2-compliance-dashboard__state mg-v2-compliance-dashboard__state--error"
          aria-live="polite"
        >
          <h2 className="mg-v2-compliance-dashboard__state-title">오류 발생</h2>
          <p className="mg-v2-compliance-dashboard__state-text">
            <SafeText>{error}</SafeText>
          </p>
          <MGButton type="button" variant="primary" size="small" onClick={loadComplianceData}>
            다시 시도
          </MGButton>
        </section>
      </ComplianceDashboardShell>
    );
  }

  const levelMod = overallStatus
    ? getComplianceLevelModifier(overallStatus.complianceLevel)
    : 'unknown';

  return (
    <ComplianceDashboardShell
      sectionSubtitle={sectionSubtitle}
      titleId={COMPLIANCE_TITLE_ID}
      refreshDisabled={false}
      onRefresh={loadComplianceData}
    >
      <OverallSection overallStatus={overallStatus} levelMod={levelMod} />
      <div className="mg-v2-compliance-dashboard__grid">
        <ProcessingCard processingStatus={processingStatus} />
        <ImpactCard impactAssessment={impactAssessment} />
        <BreachCard breachResponse={breachResponse} />
        <EducationCard educationStatus={educationStatus} />
        <PolicyCard policyStatus={policyStatus} />
        <DestructionCard destructionStatus={destructionStatus} />
      </div>
      <ComplianceQuickActions
        onOpenImpact={openImpactExecute}
        onOpenDestruction={openDestructionAll}
        onOpenEduPlan={openEduPlan}
      />
    </ComplianceDashboardShell>
  );
};

export default ComplianceDashboard;
