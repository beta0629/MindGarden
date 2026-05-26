import ContentCard from '../dashboard-v2/content/ContentCard';
import MGButton from '../common/MGButton';
import { buildErpMgButtonClassName, ERP_MG_BUTTON_LOADING_TEXT } from '../erp/common/erpMgButtonProps';
import SafeText from '../common/SafeText';
import { toDisplayString } from '../../utils/safeDisplay';
import { useTranslation } from 'react-i18next';


/**
 * @param {string} level
 * @returns {string}
 */
export function getComplianceLevelModifier(level) {
  switch (level) {
    case '우수':
      return 'excellent';
    case '양호':
      return 'good';
    case '보통':
      return 'normal';
    case '미흡':
      return 'poor';
    case '부족':
      return 'critical';
    default:
      return 'unknown';
  }
}

export function OverallSection({ overallStatus, levelMod }) {
  const { t } = useTranslation();
  if (!overallStatus) {
    return null;
  }
  return (
    <section
      className="mg-v2-compliance-dashboard__section mg-v2-compliance-dashboard__section--overall"
      aria-labelledby="compliance-overall-heading"
    >
      <ContentCard className="mg-v2-compliance-dashboard__card">
        <h2 id="compliance-overall-heading" className="mg-v2-compliance-dashboard__card-title">
          <span>{t('common:compliance.ComplianceDashboardCards.t_b53a88c2')}</span>
        </h2>
        <div className="mg-v2-compliance-dashboard__metrics">
          <div className="mg-v2-compliance-dashboard__metric">
            <div className="mg-v2-compliance-dashboard__metric-label">{t('common:compliance.ComplianceDashboardCards.t_29ac7208')}</div>
            <div
              className={`mg-v2-compliance-dashboard__metric-value mg-v2-compliance-dashboard__metric-value--${levelMod}`}
            >
              {toDisplayString(overallStatus.overallScore ?? 0)}점
            </div>
          </div>
          <div className="mg-v2-compliance-dashboard__metric">
            <div className="mg-v2-compliance-dashboard__metric-label">{t('common:compliance.ComplianceDashboardCards.t_b6f6192b')}</div>
            <div
              className={`mg-v2-compliance-dashboard__metric-value mg-v2-compliance-dashboard__metric-value--inline mg-v2-compliance-dashboard__metric-value--${levelMod}`}
            >
              <SafeText fallback="미평가">{overallStatus.complianceLevel}</SafeText>
            </div>
          </div>
          <div className="mg-v2-compliance-dashboard__metric">
            <div className="mg-v2-compliance-dashboard__metric-label">{t('common:compliance.ComplianceDashboardCards.t_d735b02d')}</div>
            <div className="mg-v2-compliance-dashboard__metric-value mg-v2-compliance-dashboard__metric-value--neutral">
              <SafeText fallback="N/A">
                {overallStatus.lastUpdated
                  ? new Date(overallStatus.lastUpdated).toLocaleString()
                  : null}
              </SafeText>
            </div>
          </div>
        </div>
      </ContentCard>
    </section>
  );
}

export function ProcessingCard({ processingStatus }) {
  const { t } = useTranslation();
  if (!processingStatus) {
    return null;
  }
  return (
    <article className="mg-v2-compliance-dashboard__cell">
      <ContentCard className="mg-v2-compliance-dashboard__card">
        <h3 className="mg-v2-compliance-dashboard__card-title">
          <span>{t('common:compliance.ComplianceDashboardCards.t_857f68b1')}</span>
        </h3>
        <div className="mg-v2-compliance-dashboard__card-body">
          <div className="mg-v2-compliance-dashboard__row">
            <span className="mg-v2-compliance-dashboard__label">{t('common:compliance.ComplianceDashboardCards.t_087f0ee4')}</span>
            <span className="mg-v2-compliance-dashboard__value">
              {toDisplayString(processingStatus.totalCount ?? 0)}건
            </span>
          </div>
          <div className="mg-v2-compliance-dashboard__row mg-v2-compliance-dashboard__row--block">
            <span className="mg-v2-compliance-dashboard__label">{t('common:compliance.ComplianceDashboardCards.t_2b112411')}</span>
            <div className="mg-v2-compliance-dashboard__subgrid">
              {processingStatus.dataTypeStats &&
                Object.entries(processingStatus.dataTypeStats).map(([type, count]) => (
                  <div key={type} className="mg-v2-compliance-dashboard__subrow">
                    <span className="mg-v2-compliance-dashboard__muted">{toDisplayString(type)}:</span>
                    <span className="mg-v2-compliance-dashboard__value">
                      {toDisplayString(count)}건
                    </span>
                  </div>
                ))}
            </div>
          </div>
        </div>
      </ContentCard>
    </article>
  );
}

export function ImpactCard({ impactAssessment }) {
  const { t } = useTranslation();
  if (!impactAssessment) {
    return null;
  }
  return (
    <article className="mg-v2-compliance-dashboard__cell">
      <ContentCard className="mg-v2-compliance-dashboard__card">
        <h3 className="mg-v2-compliance-dashboard__card-title">
          <span>{t('common:compliance.ComplianceDashboardCards.t_c1f0c59c')}</span>
        </h3>
        <div className="mg-v2-compliance-dashboard__card-body">
          <div className="mg-v2-compliance-dashboard__row">
            <span className="mg-v2-compliance-dashboard__label">{t('common:compliance.ComplianceDashboardCards.t_ff2e0b95')}</span>
            <span className="mg-v2-compliance-dashboard__value mg-v2-compliance-dashboard__value--risk">
              <SafeText fallback="미평가">
                {impactAssessment.overallAssessment?.overallRiskLevel}
              </SafeText>
            </span>
          </div>
          <div className="mg-v2-compliance-dashboard__row">
            <span className="mg-v2-compliance-dashboard__label">{t('common:compliance.ComplianceDashboardCards.t_4ac79a4b')}</span>
            <span className="mg-v2-compliance-dashboard__value">
              <SafeText fallback="미평가">
                {impactAssessment.overallAssessment?.complianceStatus}
              </SafeText>
            </span>
          </div>
          <div className="mg-v2-compliance-dashboard__row mg-v2-compliance-dashboard__row--block">
            <span className="mg-v2-compliance-dashboard__label">{t('common:compliance.ComplianceDashboardCards.t_a6f23a87')}</span>
            <div className="mg-v2-compliance-dashboard__list">
              {impactAssessment.overallAssessment?.improvementAreas?.map((area) => (
                <div key={area} className="mg-v2-compliance-dashboard__list-item">
                  <SafeText>{area}</SafeText>
                </div>
              ))}
            </div>
          </div>
        </div>
      </ContentCard>
    </article>
  );
}

export function BreachCard({ breachResponse }) {
  const { t } = useTranslation();
  if (!breachResponse) {
    return null;
  }
  return (
    <article className="mg-v2-compliance-dashboard__cell">
      <ContentCard className="mg-v2-compliance-dashboard__card">
        <h3 className="mg-v2-compliance-dashboard__card-title">
          <span>{t('common:compliance.ComplianceDashboardCards.t_d7e04c00')}</span>
        </h3>
        <div className="mg-v2-compliance-dashboard__card-body">
          <div className="mg-v2-compliance-dashboard__row">
            <span className="mg-v2-compliance-dashboard__label">{t('common:compliance.ComplianceDashboardCards.t_71083ed2')}</span>
            <span className="mg-v2-compliance-dashboard__value">
              <SafeText fallback="N/A">{breachResponse.responseTeam?.teamLeader}</SafeText>
            </span>
          </div>
          <div className="mg-v2-compliance-dashboard__row">
            <span className="mg-v2-compliance-dashboard__label">{t('common:compliance.ComplianceDashboardCards.t_65c0f5a2')}</span>
            <span className="mg-v2-compliance-dashboard__value">
              <SafeText fallback="N/A">
                {breachResponse.responseTeam?.contactInfo?.emergency}
              </SafeText>
            </span>
          </div>
          <div className="mg-v2-compliance-dashboard__row mg-v2-compliance-dashboard__row--block">
            <span className="mg-v2-compliance-dashboard__label">{t('common:compliance.ComplianceDashboardCards.t_7df26b5b')}</span>
            <div className="mg-v2-compliance-dashboard__list">
              {breachResponse.responseProcedures &&
                Object.entries(breachResponse.responseProcedures).map(([step, procedure]) => (
                  <div key={step} className="mg-v2-compliance-dashboard__list-item">
                    <strong>
                      <SafeText>{procedure.title}</SafeText>:
                    </strong>{' '}
                    <SafeText>{procedure.timeframe}</SafeText>
                  </div>
                ))}
            </div>
          </div>
        </div>
      </ContentCard>
    </article>
  );
}

export function EducationCard({ educationStatus }) {
  const { t } = useTranslation();
  if (!educationStatus) {
    return null;
  }
  return (
    <article className="mg-v2-compliance-dashboard__cell">
      <ContentCard className="mg-v2-compliance-dashboard__card">
        <h3 className="mg-v2-compliance-dashboard__card-title">
          <span>{t('common:compliance.ComplianceDashboardCards.t_e9f98a96')}</span>
        </h3>
        <div className="mg-v2-compliance-dashboard__card-body">
          <div className="mg-v2-compliance-dashboard__row">
            <span className="mg-v2-compliance-dashboard__label">{t('common:compliance.ComplianceDashboardCards.t_ffd1b583')}</span>
            <span className="mg-v2-compliance-dashboard__value">
              <SafeText fallback="N/A">
                {educationStatus.completionStatus?.completionRate}
              </SafeText>
            </span>
          </div>
          <div className="mg-v2-compliance-dashboard__row">
            <span className="mg-v2-compliance-dashboard__label">{t('common:compliance.ComplianceDashboardCards.t_467bd916')}</span>
            <span className="mg-v2-compliance-dashboard__value">
              {toDisplayString(educationStatus.completionStatus?.totalEmployees ?? 0)}명
            </span>
          </div>
          <div className="mg-v2-compliance-dashboard__row mg-v2-compliance-dashboard__row--block">
            <span className="mg-v2-compliance-dashboard__label">{t('common:compliance.ComplianceDashboardCards.t_5fa20d46')}</span>
            <div className="mg-v2-compliance-dashboard__list">
              {educationStatus.educationPrograms &&
                Object.entries(educationStatus.educationPrograms).map(([type, program]) => (
                  <div key={type} className="mg-v2-compliance-dashboard__list-item">
                    <strong>
                      <SafeText>{program.title}</SafeText>:
                    </strong>{' '}
                    <SafeText>{program.frequency}</SafeText>
                  </div>
                ))}
            </div>
          </div>
        </div>
      </ContentCard>
    </article>
  );
}

export function PolicyCard({ policyStatus }) {
  const { t } = useTranslation();
  if (!policyStatus) {
    return null;
  }
  return (
    <article className="mg-v2-compliance-dashboard__cell">
      <ContentCard className="mg-v2-compliance-dashboard__card">
        <h3 className="mg-v2-compliance-dashboard__card-title">
          <span>{t('common:compliance.ComplianceDashboardCards.t_95ab9a6b')}</span>
        </h3>
        <div className="mg-v2-compliance-dashboard__card-body">
          <div className="mg-v2-compliance-dashboard__row">
            <span className="mg-v2-compliance-dashboard__label">{t('common:compliance.ComplianceDashboardCards.t_ea1ba45c')}</span>
            <span className="mg-v2-compliance-dashboard__value">
              <SafeText fallback="N/A">
                {policyStatus.policyComponents?.basicInfo?.companyName}
              </SafeText>
            </span>
          </div>
          <div className="mg-v2-compliance-dashboard__row">
            <span className="mg-v2-compliance-dashboard__label">{t('common:compliance.ComplianceDashboardCards.t_5823eb2a')}</span>
            <span className="mg-v2-compliance-dashboard__value">
              <SafeText fallback="N/A">
                {policyStatus.policyComponents?.basicInfo?.privacyOfficer}
              </SafeText>
            </span>
          </div>
          <div className="mg-v2-compliance-dashboard__row">
            <span className="mg-v2-compliance-dashboard__label">{t('common:compliance.ComplianceDashboardCards.t_88107ea4')}</span>
            <span className="mg-v2-compliance-dashboard__value">
              <SafeText fallback="N/A">
                {policyStatus.policyComponents?.basicInfo?.lastUpdated}
              </SafeText>
            </span>
          </div>
          <div className="mg-v2-compliance-dashboard__row">
            <span className="mg-v2-compliance-dashboard__label">{t('common:compliance.ComplianceDashboardCards.t_99ac659e')}</span>
            <span className="mg-v2-compliance-dashboard__value">
              <SafeText fallback="N/A">
                {policyStatus.nextReviewDate
                  ? new Date(policyStatus.nextReviewDate).toLocaleDateString()
                  : null}
              </SafeText>
            </span>
          </div>
        </div>
      </ContentCard>
    </article>
  );
}

export function DestructionCard({ destructionStatus }) {
  const { t } = useTranslation();
  if (!destructionStatus) {
    return null;
  }
  return (
    <article className="mg-v2-compliance-dashboard__cell">
      <ContentCard className="mg-v2-compliance-dashboard__card">
        <h3 className="mg-v2-compliance-dashboard__card-title">
          <span>{t('common:compliance.ComplianceDashboardCards.t_aa3f6e4d')}</span>
        </h3>
        <div className="mg-v2-compliance-dashboard__card-body">
          <div className="mg-v2-compliance-dashboard__row">
            <span className="mg-v2-compliance-dashboard__label">{t('common:compliance.ComplianceDashboardCards.t_87b2fe52')}</span>
            <span className="mg-v2-compliance-dashboard__value">
              {toDisplayString(destructionStatus.totalDestroyed ?? 0)}건
            </span>
          </div>
          <div className="mg-v2-compliance-dashboard__row">
            <span className="mg-v2-compliance-dashboard__label">{t('common:compliance.ComplianceDashboardCards.t_8d4540b5')}</span>
            <span className="mg-v2-compliance-dashboard__value">
              <SafeText fallback="N/A">
                {destructionStatus.lastDestruction
                  ? new Date(destructionStatus.lastDestruction).toLocaleString()
                  : null}
              </SafeText>
            </span>
          </div>
          <div className="mg-v2-compliance-dashboard__row mg-v2-compliance-dashboard__row--block">
            <span className="mg-v2-compliance-dashboard__label">{t('common:compliance.ComplianceDashboardCards.t_c0c358b3')}</span>
            <div className="mg-v2-compliance-dashboard__subgrid">
              {destructionStatus.destructionStats &&
                Object.entries(destructionStatus.destructionStats).map(([type, count]) => (
                  <div key={type} className="mg-v2-compliance-dashboard__subrow">
                    <span className="mg-v2-compliance-dashboard__muted">{toDisplayString(type)}:</span>
                    <span className="mg-v2-compliance-dashboard__value">
                      {toDisplayString(count)}건
                    </span>
                  </div>
                ))}
            </div>
          </div>
        </div>
      </ContentCard>
    </article>
  );
}

export function ComplianceQuickActions({ onOpenImpact, onOpenDestruction, onOpenEduPlan }) {
  const { t } = useTranslation();
  return (
    <section
      className="mg-v2-compliance-dashboard__actions"
      aria-label={t('common:compliance.ComplianceDashboardCards.t_b5305340')}
    >
      <MGButton
        type="button"
        variant="primary"
        size="small"
        className={buildErpMgButtonClassName({ variant: 'primary', size: 'sm', loading: false })}
        loadingText={ERP_MG_BUTTON_LOADING_TEXT}
        onClick={onOpenImpact}
      >
        {t('common:compliance.ComplianceDashboardCards.t_86fdae04')}
      </MGButton>
      <MGButton
        type="button"
        variant="secondary"
        size="small"
        className={buildErpMgButtonClassName({ variant: 'secondary', size: 'sm', loading: false })}
        loadingText={ERP_MG_BUTTON_LOADING_TEXT}
        onClick={onOpenDestruction}
      >
        {t('common:compliance.ComplianceDashboardCards.t_a7aed244')}
      </MGButton>
      <MGButton
        type="button"
        variant="outline"
        size="small"
        className={buildErpMgButtonClassName({ variant: 'outline', size: 'sm', loading: false })}
        loadingText={ERP_MG_BUTTON_LOADING_TEXT}
        onClick={onOpenEduPlan}
      >
        {t('common:compliance.ComplianceDashboardCards.t_419560bd')}
      </MGButton>
    </section>
  );
}
