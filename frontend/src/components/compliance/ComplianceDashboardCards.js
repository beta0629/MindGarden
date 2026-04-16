import ContentCard from '../dashboard-v2/content/ContentCard';
import MGButton from '../common/MGButton';
import { buildErpMgButtonClassName, ERP_MG_BUTTON_LOADING_TEXT } from '../erp/common/erpMgButtonProps';
import SafeText from '../common/SafeText';
import { toDisplayString } from '../../utils/safeDisplay';


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
          <span>종합 컴플라이언스 현황</span>
        </h2>
        <div className="mg-v2-compliance-dashboard__metrics">
          <div className="mg-v2-compliance-dashboard__metric">
            <div className="mg-v2-compliance-dashboard__metric-label">종합 점수</div>
            <div
              className={`mg-v2-compliance-dashboard__metric-value mg-v2-compliance-dashboard__metric-value--${levelMod}`}
            >
              {toDisplayString(overallStatus.overallScore ?? 0)}점
            </div>
          </div>
          <div className="mg-v2-compliance-dashboard__metric">
            <div className="mg-v2-compliance-dashboard__metric-label">준수 수준</div>
            <div
              className={`mg-v2-compliance-dashboard__metric-value mg-v2-compliance-dashboard__metric-value--inline mg-v2-compliance-dashboard__metric-value--${levelMod}`}
            >
              <SafeText fallback="미평가">{overallStatus.complianceLevel}</SafeText>
            </div>
          </div>
          <div className="mg-v2-compliance-dashboard__metric">
            <div className="mg-v2-compliance-dashboard__metric-label">마지막 업데이트</div>
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
  if (!processingStatus) {
    return null;
  }
  return (
    <article className="mg-v2-compliance-dashboard__cell">
      <ContentCard className="mg-v2-compliance-dashboard__card">
        <h3 className="mg-v2-compliance-dashboard__card-title">
          <span>개인정보 처리 현황</span>
        </h3>
        <div className="mg-v2-compliance-dashboard__card-body">
          <div className="mg-v2-compliance-dashboard__row">
            <span className="mg-v2-compliance-dashboard__label">총 처리 건수:</span>
            <span className="mg-v2-compliance-dashboard__value">
              {toDisplayString(processingStatus.totalCount ?? 0)}건
            </span>
          </div>
          <div className="mg-v2-compliance-dashboard__row mg-v2-compliance-dashboard__row--block">
            <span className="mg-v2-compliance-dashboard__label">데이터 유형별:</span>
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
  if (!impactAssessment) {
    return null;
  }
  return (
    <article className="mg-v2-compliance-dashboard__cell">
      <ContentCard className="mg-v2-compliance-dashboard__card">
        <h3 className="mg-v2-compliance-dashboard__card-title">
          <span>개인정보 영향평가</span>
        </h3>
        <div className="mg-v2-compliance-dashboard__card-body">
          <div className="mg-v2-compliance-dashboard__row">
            <span className="mg-v2-compliance-dashboard__label">전체 위험도:</span>
            <span className="mg-v2-compliance-dashboard__value mg-v2-compliance-dashboard__value--risk">
              <SafeText fallback="미평가">
                {impactAssessment.overallAssessment?.overallRiskLevel}
              </SafeText>
            </span>
          </div>
          <div className="mg-v2-compliance-dashboard__row">
            <span className="mg-v2-compliance-dashboard__label">준수 상태:</span>
            <span className="mg-v2-compliance-dashboard__value">
              <SafeText fallback="미평가">
                {impactAssessment.overallAssessment?.complianceStatus}
              </SafeText>
            </span>
          </div>
          <div className="mg-v2-compliance-dashboard__row mg-v2-compliance-dashboard__row--block">
            <span className="mg-v2-compliance-dashboard__label">개선 필요 영역:</span>
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
  if (!breachResponse) {
    return null;
  }
  return (
    <article className="mg-v2-compliance-dashboard__cell">
      <ContentCard className="mg-v2-compliance-dashboard__card">
        <h3 className="mg-v2-compliance-dashboard__card-title">
          <span>개인정보 침해사고 대응</span>
        </h3>
        <div className="mg-v2-compliance-dashboard__card-body">
          <div className="mg-v2-compliance-dashboard__row">
            <span className="mg-v2-compliance-dashboard__label">대응팀 구성:</span>
            <span className="mg-v2-compliance-dashboard__value">
              <SafeText fallback="N/A">{breachResponse.responseTeam?.teamLeader}</SafeText>
            </span>
          </div>
          <div className="mg-v2-compliance-dashboard__row">
            <span className="mg-v2-compliance-dashboard__label">긴급 연락처:</span>
            <span className="mg-v2-compliance-dashboard__value">
              <SafeText fallback="N/A">
                {breachResponse.responseTeam?.contactInfo?.emergency}
              </SafeText>
            </span>
          </div>
          <div className="mg-v2-compliance-dashboard__row mg-v2-compliance-dashboard__row--block">
            <span className="mg-v2-compliance-dashboard__label">대응 절차:</span>
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
  if (!educationStatus) {
    return null;
  }
  return (
    <article className="mg-v2-compliance-dashboard__cell">
      <ContentCard className="mg-v2-compliance-dashboard__card">
        <h3 className="mg-v2-compliance-dashboard__card-title">
          <span>개인정보보호 교육 현황</span>
        </h3>
        <div className="mg-v2-compliance-dashboard__card-body">
          <div className="mg-v2-compliance-dashboard__row">
            <span className="mg-v2-compliance-dashboard__label">이수율:</span>
            <span className="mg-v2-compliance-dashboard__value">
              <SafeText fallback="N/A">
                {educationStatus.completionStatus?.completionRate}
              </SafeText>
            </span>
          </div>
          <div className="mg-v2-compliance-dashboard__row">
            <span className="mg-v2-compliance-dashboard__label">전체 임직원:</span>
            <span className="mg-v2-compliance-dashboard__value">
              {toDisplayString(educationStatus.completionStatus?.totalEmployees ?? 0)}명
            </span>
          </div>
          <div className="mg-v2-compliance-dashboard__row mg-v2-compliance-dashboard__row--block">
            <span className="mg-v2-compliance-dashboard__label">교육 프로그램:</span>
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
  if (!policyStatus) {
    return null;
  }
  return (
    <article className="mg-v2-compliance-dashboard__cell">
      <ContentCard className="mg-v2-compliance-dashboard__card">
        <h3 className="mg-v2-compliance-dashboard__card-title">
          <span>개인정보 처리방침 현황</span>
        </h3>
        <div className="mg-v2-compliance-dashboard__card-body">
          <div className="mg-v2-compliance-dashboard__row">
            <span className="mg-v2-compliance-dashboard__label">회사명:</span>
            <span className="mg-v2-compliance-dashboard__value">
              <SafeText fallback="N/A">
                {policyStatus.policyComponents?.basicInfo?.companyName}
              </SafeText>
            </span>
          </div>
          <div className="mg-v2-compliance-dashboard__row">
            <span className="mg-v2-compliance-dashboard__label">개인정보보호책임자:</span>
            <span className="mg-v2-compliance-dashboard__value">
              <SafeText fallback="N/A">
                {policyStatus.policyComponents?.basicInfo?.privacyOfficer}
              </SafeText>
            </span>
          </div>
          <div className="mg-v2-compliance-dashboard__row">
            <span className="mg-v2-compliance-dashboard__label">마지막 업데이트:</span>
            <span className="mg-v2-compliance-dashboard__value">
              <SafeText fallback="N/A">
                {policyStatus.policyComponents?.basicInfo?.lastUpdated}
              </SafeText>
            </span>
          </div>
          <div className="mg-v2-compliance-dashboard__row">
            <span className="mg-v2-compliance-dashboard__label">다음 검토일:</span>
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
  if (!destructionStatus) {
    return null;
  }
  return (
    <article className="mg-v2-compliance-dashboard__cell">
      <ContentCard className="mg-v2-compliance-dashboard__card">
        <h3 className="mg-v2-compliance-dashboard__card-title">
          <span>개인정보 파기 현황</span>
        </h3>
        <div className="mg-v2-compliance-dashboard__card-body">
          <div className="mg-v2-compliance-dashboard__row">
            <span className="mg-v2-compliance-dashboard__label">최근 1개월 파기 건수:</span>
            <span className="mg-v2-compliance-dashboard__value">
              {toDisplayString(destructionStatus.totalDestroyed ?? 0)}건
            </span>
          </div>
          <div className="mg-v2-compliance-dashboard__row">
            <span className="mg-v2-compliance-dashboard__label">마지막 파기:</span>
            <span className="mg-v2-compliance-dashboard__value">
              <SafeText fallback="N/A">
                {destructionStatus.lastDestruction
                  ? new Date(destructionStatus.lastDestruction).toLocaleString()
                  : null}
              </SafeText>
            </span>
          </div>
          <div className="mg-v2-compliance-dashboard__row mg-v2-compliance-dashboard__row--block">
            <span className="mg-v2-compliance-dashboard__label">파기 통계:</span>
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
  return (
    <section
      className="mg-v2-compliance-dashboard__actions"
      aria-label="컴플라이언스 빠른 작업"
    >
      <MGButton
        type="button"
        variant="primary"
        size="small"
        className={buildErpMgButtonClassName({ variant: 'primary', size: 'sm', loading: false })}
        loadingText={ERP_MG_BUTTON_LOADING_TEXT}
        onClick={onOpenImpact}
      >
        영향평가 실행
      </MGButton>
      <MGButton
        type="button"
        variant="secondary"
        size="small"
        className={buildErpMgButtonClassName({ variant: 'secondary', size: 'sm', loading: false })}
        loadingText={ERP_MG_BUTTON_LOADING_TEXT}
        onClick={onOpenDestruction}
      >
        전체 파기 실행
      </MGButton>
      <MGButton
        type="button"
        variant="outline"
        size="small"
        className={buildErpMgButtonClassName({ variant: 'outline', size: 'sm', loading: false })}
        loadingText={ERP_MG_BUTTON_LOADING_TEXT}
        onClick={onOpenEduPlan}
      >
        교육 계획 수립
      </MGButton>
    </section>
  );
}
