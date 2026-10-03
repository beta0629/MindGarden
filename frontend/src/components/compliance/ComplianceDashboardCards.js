import { SettingsButton, SettingsSectionPanel } from '../admin/settings-shell';
import SafeText from '../common/SafeText';
import { toDisplayString } from '../../utils/safeDisplay';
import { formatLedgerDateTime } from '../../utils/erpFinanceDisplay';
import { toDateStr } from '../../utils/dateUtils';
import { useTranslation } from 'react-i18next';

/** 실측 데이터가 없는 목록(영향평가 개선영역·교육 프로그램) 빈 상태 문구 */
export const COMPLIANCE_EMPTY_LIST_TEXT = '등록된 항목이 없습니다';

/** 실측 점검이 없는 상태 라벨 (백엔드 STATUS_NOT_REVIEWED 와 동일) */
export const COMPLIANCE_NOT_REVIEWED_TEXT = '미점검';

/**
 * 목록이 비어 있으면 빈 상태 문구를, 아니면 렌더 결과를 돌려준다.
 *
 * @param {Array|undefined|null} items
 * @param {(item: *, index: number) => React.ReactNode} renderItem
 * @returns {React.ReactNode}
 */
function renderComplianceList(items, renderItem) {
  if (!Array.isArray(items) || items.length === 0) {
    return (
      <p className="mg-v2-compliance-dashboard__muted" data-testid="compliance-empty-list">
        {COMPLIANCE_EMPTY_LIST_TEXT}
      </p>
    );
  }
  return items.map(renderItem);
}

/**
 * 값이 없으면 '—', 있으면 단위를 붙여 표시 (없는 값을 0으로 꾸미지 않음).
 *
 * @param {*} value
 * @param {string} unit
 * @returns {string}
 */
export function formatComplianceCount(value, unit) {
  if (value == null || value === '') {
    return toDisplayString(null);
  }
  return `${toDisplayString(value)}${unit}`;
}


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
    <SettingsSectionPanel
      className="mg-v2-compliance-dashboard__section mg-v2-compliance-dashboard__section--overall"
      title={t('common:compliance.ComplianceDashboardCards.t_b53a88c2')}
      body="form"
    >
      <div className="mg-v2-compliance-dashboard__metrics">
        <div className="mg-v2-compliance-dashboard__metric">
          <div className="mg-v2-compliance-dashboard__metric-label">{t('common:compliance.ComplianceDashboardCards.t_29ac7208')}</div>
          <div
            className={`mg-v2-compliance-dashboard__metric-value mg-v2-compliance-dashboard__metric-value--${levelMod}`}
          >
            {formatComplianceCount(overallStatus.overallScore, '점')}
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
            {formatLedgerDateTime(overallStatus.lastUpdated)}
          </div>
        </div>
      </div>
    </SettingsSectionPanel>
  );
}

export function ProcessingCard({ processingStatus }) {
  const { t } = useTranslation();
  if (!processingStatus) {
    return null;
  }
  return (
    <SettingsSectionPanel
      className="mg-v2-compliance-dashboard__cell"
      title={t('common:compliance.ComplianceDashboardCards.t_857f68b1')}
      headingLevel={3}
      body="form"
    >
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
    </SettingsSectionPanel>
  );
}

export function ImpactCard({ impactAssessment }) {
  const { t } = useTranslation();
  if (!impactAssessment) {
    return null;
  }
  return (
    <SettingsSectionPanel
      className="mg-v2-compliance-dashboard__cell"
      title={t('common:compliance.ComplianceDashboardCards.t_c1f0c59c')}
      headingLevel={3}
      body="form"
    >
      <div className="mg-v2-compliance-dashboard__card-body">
        <div className="mg-v2-compliance-dashboard__row">
          <span className="mg-v2-compliance-dashboard__label">{t('common:compliance.ComplianceDashboardCards.t_ff2e0b95')}</span>
          <span className="mg-v2-compliance-dashboard__value mg-v2-compliance-dashboard__value--risk">
            <SafeText fallback={COMPLIANCE_NOT_REVIEWED_TEXT}>
              {impactAssessment.overallAssessment?.overallRiskLevel}
            </SafeText>
          </span>
        </div>
        <div className="mg-v2-compliance-dashboard__row">
          <span className="mg-v2-compliance-dashboard__label">{t('common:compliance.ComplianceDashboardCards.t_4ac79a4b')}</span>
          <span className="mg-v2-compliance-dashboard__value">
            <SafeText fallback={COMPLIANCE_NOT_REVIEWED_TEXT}>
              {impactAssessment.overallAssessment?.complianceStatus}
            </SafeText>
          </span>
        </div>
        <div className="mg-v2-compliance-dashboard__row mg-v2-compliance-dashboard__row--block">
          <span className="mg-v2-compliance-dashboard__label">{t('common:compliance.ComplianceDashboardCards.t_a6f23a87')}</span>
          <div className="mg-v2-compliance-dashboard__list">
            {renderComplianceList(impactAssessment.overallAssessment?.improvementAreas, (area) => (
              <div key={area} className="mg-v2-compliance-dashboard__list-item">
                <SafeText>{area}</SafeText>
              </div>
            ))}
          </div>
        </div>
      </div>
    </SettingsSectionPanel>
  );
}

export function BreachCard({ breachResponse }) {
  const { t } = useTranslation();
  if (!breachResponse) {
    return null;
  }
  return (
    <SettingsSectionPanel
      className="mg-v2-compliance-dashboard__cell"
      title={t('common:compliance.ComplianceDashboardCards.t_d7e04c00')}
      headingLevel={3}
      body="form"
    >
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
    </SettingsSectionPanel>
  );
}

export function EducationCard({ educationStatus }) {
  const { t } = useTranslation();
  if (!educationStatus) {
    return null;
  }
  return (
    <SettingsSectionPanel
      className="mg-v2-compliance-dashboard__cell"
      title={t('common:compliance.ComplianceDashboardCards.t_e9f98a96')}
      headingLevel={3}
      body="form"
    >
      <div className="mg-v2-compliance-dashboard__card-body">
        <div className="mg-v2-compliance-dashboard__row">
          <span className="mg-v2-compliance-dashboard__label">{t('common:compliance.ComplianceDashboardCards.t_ffd1b583')}</span>
          <span className="mg-v2-compliance-dashboard__value">
            <SafeText>
              {educationStatus.completionStatus?.completionRate}
            </SafeText>
          </span>
        </div>
        <div className="mg-v2-compliance-dashboard__row">
          <span className="mg-v2-compliance-dashboard__label">{t('common:compliance.ComplianceDashboardCards.t_467bd916')}</span>
          <span className="mg-v2-compliance-dashboard__value">
            {formatComplianceCount(educationStatus.completionStatus?.totalEmployees, '명')}
          </span>
        </div>
        <div className="mg-v2-compliance-dashboard__row mg-v2-compliance-dashboard__row--block">
          <span className="mg-v2-compliance-dashboard__label">{t('common:compliance.ComplianceDashboardCards.t_5fa20d46')}</span>
          <div className="mg-v2-compliance-dashboard__list">
            {renderComplianceList(Object.entries(educationStatus.educationPrograms || {}), ([type, program]) => (
              <div key={type} className="mg-v2-compliance-dashboard__list-item">
                <strong>
                  <SafeText>{program?.title}</SafeText>:
                </strong>{' '}
                <SafeText>{program?.frequency}</SafeText>
              </div>
            ))}
          </div>
        </div>
      </div>
    </SettingsSectionPanel>
  );
}

export function PolicyCard({ policyStatus }) {
  const { t } = useTranslation();
  if (!policyStatus) {
    return null;
  }
  return (
    <SettingsSectionPanel
      className="mg-v2-compliance-dashboard__cell"
      title={t('common:compliance.ComplianceDashboardCards.t_95ab9a6b')}
      headingLevel={3}
      body="form"
    >
      <div className="mg-v2-compliance-dashboard__card-body">
        <div className="mg-v2-compliance-dashboard__row">
          <span className="mg-v2-compliance-dashboard__label">{t('common:compliance.ComplianceDashboardCards.t_ea1ba45c')}</span>
          <span className="mg-v2-compliance-dashboard__value">
            <SafeText>
              {policyStatus.policyComponents?.basicInfo?.companyName}
            </SafeText>
          </span>
        </div>
        <div className="mg-v2-compliance-dashboard__row">
          <span className="mg-v2-compliance-dashboard__label">{t('common:compliance.ComplianceDashboardCards.t_5823eb2a')}</span>
          <span className="mg-v2-compliance-dashboard__value">
            <SafeText>
              {policyStatus.policyComponents?.basicInfo?.privacyOfficer}
            </SafeText>
          </span>
        </div>
        <div className="mg-v2-compliance-dashboard__row">
          <span className="mg-v2-compliance-dashboard__label">{t('common:compliance.ComplianceDashboardCards.t_88107ea4')}</span>
          <span className="mg-v2-compliance-dashboard__value">
            <SafeText>{toDateStr(policyStatus.policyComponents?.basicInfo?.lastUpdated)}</SafeText>
          </span>
        </div>
        <div className="mg-v2-compliance-dashboard__row">
          <span className="mg-v2-compliance-dashboard__label">{t('common:compliance.ComplianceDashboardCards.t_99ac659e')}</span>
          <span className="mg-v2-compliance-dashboard__value">
            <SafeText>{toDateStr(policyStatus.nextReviewDate)}</SafeText>
          </span>
        </div>
      </div>
    </SettingsSectionPanel>
  );
}

export function DestructionCard({ destructionStatus }) {
  const { t } = useTranslation();
  if (!destructionStatus) {
    return null;
  }
  return (
    <SettingsSectionPanel
      className="mg-v2-compliance-dashboard__cell"
      title={t('common:compliance.ComplianceDashboardCards.t_aa3f6e4d')}
      headingLevel={3}
      body="form"
    >
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
            {formatLedgerDateTime(destructionStatus.lastDestruction)}
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
    </SettingsSectionPanel>
  );
}

export function ComplianceQuickActions({ onOpenImpact, onOpenDestruction, onOpenEduPlan }) {
  const { t } = useTranslation();
  return (
    <SettingsSectionPanel
      className="mg-v2-compliance-dashboard__actions"
      title={t('common:compliance.ComplianceDashboardCards.t_b5305340')}
      body="plain"
    >
      <div className="mg-v2-settings-actions mg-v2-compliance-dashboard__actions-row">
        <SettingsButton
          type="button"
          variant="primary"
          onClick={onOpenImpact}
          preventDoubleClick
        >
          {t('common:compliance.ComplianceDashboardCards.t_86fdae04')}
        </SettingsButton>
        <SettingsButton
          type="button"
          variant="secondary"
          onClick={onOpenDestruction}
          preventDoubleClick
        >
          {t('common:compliance.ComplianceDashboardCards.t_a7aed244')}
        </SettingsButton>
        <SettingsButton
          type="button"
          variant="outline"
          onClick={onOpenEduPlan}
          preventDoubleClick
        >
          {t('common:compliance.ComplianceDashboardCards.t_419560bd')}
        </SettingsButton>
      </div>
    </SettingsSectionPanel>
  );
}
