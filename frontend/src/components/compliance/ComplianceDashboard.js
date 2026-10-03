import { useCallback } from 'react';
import SafeErrorDisplay from '../common/SafeErrorDisplay';
import { SettingsButton, SettingsSectionPanel } from '../admin/settings-shell';
import '../../styles/unified-design-tokens.css';
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
import { useTranslation } from 'react-i18next';

const COMPLIANCE_TITLE_ID = 'compliance-dashboard-title';

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
  const { t } = useTranslation();
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
        titleId={COMPLIANCE_TITLE_ID}
        refreshDisabled
        onRefresh={loadComplianceData}
        loading
        loadingText="컴플라이언스 데이터를 불러오는 중..."
      />
    );
  }

  if (error) {
    return (
      <ComplianceDashboardShell
        titleId={COMPLIANCE_TITLE_ID}
        refreshDisabled={false}
        onRefresh={loadComplianceData}
      >
        <SettingsSectionPanel
          title="오류 발생"
          body="form"
          className="mg-v2-compliance-dashboard__state"
          actions={(
            <SettingsButton
              type="button"
              variant="primary"
              onClick={loadComplianceData}
              preventDoubleClick
            >
              {t('common.labels.retry')}
            </SettingsButton>
          )}
        >
          <div aria-live="polite">
            <SafeErrorDisplay error={error} />
          </div>
        </SettingsSectionPanel>
      </ComplianceDashboardShell>
    );
  }

  const levelMod = overallStatus
    ? getComplianceLevelModifier(overallStatus.complianceLevel)
    : 'unknown';

  return (
    <ComplianceDashboardShell
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
