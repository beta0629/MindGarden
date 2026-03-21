import React, { useState, useEffect, useMemo } from 'react';
import { useLocation } from 'react-router-dom';
import UnifiedLoading from '../common/UnifiedLoading';
import AdminCommonLayout from '../layout/AdminCommonLayout';
import ContentArea from '../dashboard-v2/content/ContentArea';
import ContentHeader from '../dashboard-v2/content/ContentHeader';
import MGButton from '../common/MGButton';
import SafeText from '../common/SafeText';
import { toDisplayString } from '../../utils/safeDisplay';
import '../../styles/main.css';
import '../../styles/unified-design-tokens.css';
import '../admin/AdminDashboard/AdminDashboardB0KlA.css';
import './ComplianceDashboard.css';

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

/**
 * 컴플라이언스 모니터링 대시보드
/**
 * 
/**
 * @author Core Solution
/**
 * @version 1.0.0
/**
 * @since 2024-12-19
 */
const ComplianceDashboard = () => {
    const location = useLocation();
    const sectionSubtitle = useMemo(
        () => COMPLIANCE_SECTION_SUBTITLE[location.pathname] || COMPLIANCE_SECTION_SUBTITLE['/admin/compliance/dashboard'],
        [location.pathname]
    );

    const [overallStatus, setOverallStatus] = useState(null);
    const [processingStatus, setProcessingStatus] = useState(null);
    const [impactAssessment, setImpactAssessment] = useState(null);
    const [breachResponse, setBreachResponse] = useState(null);
    const [educationStatus, setEducationStatus] = useState(null);
    const [policyStatus, setPolicyStatus] = useState(null);
    const [destructionStatus, setDestructionStatus] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    // 컴플라이언스 데이터 로드
    useEffect(() => {
        loadComplianceData();
    }, []);

    const loadComplianceData = async () => {
        try {
            setLoading(true);
            
            // 모든 컴플라이언스 데이터 병렬 로드
            const [
                overallRes,
                processingRes,
                impactRes,
                breachRes,
                educationRes,
                policyRes,
                destructionRes
            ] = await Promise.all([
                fetch('/api/v1/admin/compliance/overall'),
                fetch('/api/v1/admin/compliance/personal-data-processing'),
                fetch('/api/v1/admin/compliance/impact-assessment'),
                fetch('/api/v1/admin/compliance/breach-response'),
                fetch('/api/v1/admin/compliance/education'),
                fetch('/api/v1/admin/compliance/policy'),
                fetch('/api/v1/admin/personal-data-destruction/status')
            ]);

            if (overallRes.ok) setOverallStatus(await overallRes.json());
            if (processingRes.ok) setProcessingStatus(await processingRes.json());
            if (impactRes.ok) setImpactAssessment(await impactRes.json());
            if (breachRes.ok) setBreachResponse(await breachRes.json());
            if (educationRes.ok) setEducationStatus(await educationRes.json());
            if (policyRes.ok) setPolicyStatus(await policyRes.json());
            if (destructionRes.ok) setDestructionStatus(await destructionRes.json());

        } catch (err) {
            console.error('컴플라이언스 데이터 로드 실패:', err);
            setError('컴플라이언스 데이터를 불러오는데 실패했습니다.');
        } finally {
            setLoading(false);
        }
    };

    const getComplianceLevelColor = (level) => {
        switch (level) {
            case '우수': return 'var(--mg-success-500)';
            // ⚠️ 표준화 2025-12-05: 하드코딩된 색상값을 CSS 변수로 변경 필요: #8BC34A -> var(--mg-custom-8BC34A)
            case '양호': return '#8BC34A';
            case '보통': return 'var(--mg-warning-500)';
            case '미흡': return 'var(--mg-warning-500)';
            case '부족': return 'var(--mg-error-500)';
            // ⚠️ 표준화 2025-12-05: 하드코딩된 색상값을 CSS 변수로 변경 필요: #9E9E9E -> var(--mg-gray-400)
            default: return '#9E9E9E';
        }
    };

    const getComplianceLevelIcon = (level) => {
        switch (level) {
            case '우수': return '🟢';
            case '양호': return '🟡';
            case '보통': return '🟠';
            case '미흡': return '🔴';
            case '부족': return '🔴';
            default: return '⚪';
        }
    };

    const complianceShell = (body) => (
        <AdminCommonLayout title="컴플라이언스 관리">
            <div className="mg-v2-ad-b0kla">
                <div className="mg-v2-ad-b0kla__container">
                    <ContentArea ariaLabel="컴플라이언스 관리 본문">
                        <ContentHeader
                            title="컴플라이언스 모니터링"
                            subtitle={sectionSubtitle}
                            titleId={COMPLIANCE_TITLE_ID}
                            actions={(
                                <MGButton
                                    type="button"
                                    variant="outline"
                                    size="small"
                                    onClick={loadComplianceData}
                                    disabled={loading}
                                >
                                    새로고침
                                </MGButton>
                            )}
                        />
                        <main aria-labelledby={COMPLIANCE_TITLE_ID} className="compliance-dashboard">
                            {body}
                        </main>
                    </ContentArea>
                </div>
            </div>
        </AdminCommonLayout>
    );

    if (loading) {
        return complianceShell(
            <UnifiedLoading type="page" text="컴플라이언스 데이터를 불러오는 중..." />
        );
    }

    if (error) {
        return complianceShell(
            <div className="error-container">
                <h2>오류 발생</h2>
                <p><SafeText>{error}</SafeText></p>
                <MGButton type="button" variant="primary" size="small" onClick={loadComplianceData}>
                    다시 시도
                </MGButton>
            </div>
        );
    }

    return complianceShell(
            <>
            {/* 종합 현황 */}
            {overallStatus && (
                <div className="overall-status-card">
                    <h2>📊 종합 컴플라이언스 현황</h2>
                    <div className="overall-metrics">
                        <div className="metric-item">
                            <div className="metric-label">종합 점수</div>
                            <div className="metric-value" data-compliance-color={getComplianceLevelColor(overallStatus.complianceLevel)}>
                                {toDisplayString(overallStatus.overallScore ?? 0)}점
                            </div>
                        </div>
                        <div className="metric-item">
                            <div className="metric-label">준수 수준</div>
                            <div className="metric-value" data-compliance-color={getComplianceLevelColor(overallStatus.complianceLevel)}>
                                {getComplianceLevelIcon(overallStatus.complianceLevel)}{' '}
                                <SafeText fallback="미평가">{overallStatus.complianceLevel}</SafeText>
                            </div>
                        </div>
                        <div className="metric-item">
                            <div className="metric-label">마지막 업데이트</div>
                            <div className="metric-value">
                                <SafeText fallback="N/A">
                                  {overallStatus.lastUpdated ? new Date(overallStatus.lastUpdated).toLocaleString() : null}
                                </SafeText>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* 개인정보 처리 현황 */}
            {processingStatus && (
                <div className="status-card">
                    <h3>👥 개인정보 처리 현황</h3>
                    <div className="status-content">
                        <div className="status-item">
                            <span className="label">총 처리 건수:</span>
                            <span className="value">{toDisplayString(processingStatus.totalCount ?? 0)}건</span>
                        </div>
                        <div className="status-item">
                            <span className="label">데이터 유형별:</span>
                            <div className="data-type-stats">
                                {processingStatus.dataTypeStats && Object.entries(processingStatus.dataTypeStats).map(([type, count]) => (
                                    <div key={type} className="data-type-item">
                                        <span className="type">{toDisplayString(type)}:</span>
                                        <span className="count">{toDisplayString(count)}건</span>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* 개인정보 영향평가 */}
            {impactAssessment && (
                <div className="status-card">
                    <h3>📋 개인정보 영향평가</h3>
                    <div className="status-content">
                        <div className="status-item">
                            <span className="label">전체 위험도:</span>
                            <span className="value risk-level">
                                <SafeText fallback="미평가">{impactAssessment.overallAssessment?.overallRiskLevel}</SafeText>
                            </span>
                        </div>
                        <div className="status-item">
                            <span className="label">준수 상태:</span>
                            <span className="value">
                                <SafeText fallback="미평가">{impactAssessment.overallAssessment?.complianceStatus}</SafeText>
                            </span>
                        </div>
                        <div className="status-item">
                            <span className="label">개선 필요 영역:</span>
                            <div className="improvement-areas">
                                {impactAssessment.overallAssessment?.improvementAreas?.map((area, index) => (
                                    <div key={index} className="improvement-item">• <SafeText>{area}</SafeText></div>
                                ))}
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* 침해사고 대응 */}
            {breachResponse && (
                <div className="status-card">
                    <h3>🚨 개인정보 침해사고 대응</h3>
                    <div className="status-content">
                        <div className="status-item">
                            <span className="label">대응팀 구성:</span>
                            <span className="value">
                                <SafeText fallback="N/A">{breachResponse.responseTeam?.teamLeader}</SafeText>
                            </span>
                        </div>
                        <div className="status-item">
                            <span className="label">긴급 연락처:</span>
                            <span className="value">
                                <SafeText fallback="N/A">{breachResponse.responseTeam?.contactInfo?.emergency}</SafeText>
                            </span>
                        </div>
                        <div className="status-item">
                            <span className="label">대응 절차:</span>
                            <div className="response-procedures">
                                {breachResponse.responseProcedures && Object.entries(breachResponse.responseProcedures).map(([step, procedure]) => (
                                    <div key={step} className="procedure-item">
                                        <strong><SafeText>{procedure.title}</SafeText>:</strong> <SafeText>{procedure.timeframe}</SafeText>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* 교육 현황 */}
            {educationStatus && (
                <div className="status-card">
                    <h3>🎓 개인정보보호 교육 현황</h3>
                    <div className="status-content">
                        <div className="status-item">
                            <span className="label">이수율:</span>
                            <span className="value">
                                <SafeText fallback="N/A">{educationStatus.completionStatus?.completionRate}</SafeText>
                            </span>
                        </div>
                        <div className="status-item">
                            <span className="label">전체 임직원:</span>
                            <span className="value">
                                {toDisplayString(educationStatus.completionStatus?.totalEmployees ?? 0)}명
                            </span>
                        </div>
                        <div className="status-item">
                            <span className="label">교육 프로그램:</span>
                            <div className="education-programs">
                                {educationStatus.educationPrograms && Object.entries(educationStatus.educationPrograms).map(([type, program]) => (
                                    <div key={type} className="program-item">
                                        <strong><SafeText>{program.title}</SafeText>:</strong> <SafeText>{program.frequency}</SafeText>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* 처리방침 현황 */}
            {policyStatus && (
                <div className="status-card">
                    <h3>📄 개인정보 처리방침 현황</h3>
                    <div className="status-content">
                        <div className="status-item">
                            <span className="label">회사명:</span>
                            <span className="value">
                                <SafeText fallback="N/A">{policyStatus.policyComponents?.basicInfo?.companyName}</SafeText>
                            </span>
                        </div>
                        <div className="status-item">
                            <span className="label">개인정보보호책임자:</span>
                            <span className="value">
                                <SafeText fallback="N/A">{policyStatus.policyComponents?.basicInfo?.privacyOfficer}</SafeText>
                            </span>
                        </div>
                        <div className="status-item">
                            <span className="label">마지막 업데이트:</span>
                            <span className="value">
                                <SafeText fallback="N/A">{policyStatus.policyComponents?.basicInfo?.lastUpdated}</SafeText>
                            </span>
                        </div>
                        <div className="status-item">
                            <span className="label">다음 검토일:</span>
                            <span className="value">
                                <SafeText fallback="N/A">
                                  {policyStatus.nextReviewDate ? new Date(policyStatus.nextReviewDate).toLocaleDateString() : null}
                                </SafeText>
                            </span>
                        </div>
                    </div>
                </div>
            )}

            {/* 개인정보 파기 현황 */}
            {destructionStatus && (
                <div className="status-card">
                    <h3>🗑️ 개인정보 파기 현황</h3>
                    <div className="status-content">
                        <div className="status-item">
                            <span className="label">최근 1개월 파기 건수:</span>
                            <span className="value">
                                {toDisplayString(destructionStatus.totalDestroyed ?? 0)}건
                            </span>
                        </div>
                        <div className="status-item">
                            <span className="label">마지막 파기:</span>
                            <span className="value">
                                <SafeText fallback="N/A">
                                  {destructionStatus.lastDestruction ? new Date(destructionStatus.lastDestruction).toLocaleString() : null}
                                </SafeText>
                            </span>
                        </div>
                        <div className="status-item">
                            <span className="label">파기 통계:</span>
                            <div className="destruction-stats">
                                {destructionStatus.destructionStats && Object.entries(destructionStatus.destructionStats).map(([type, count]) => (
                                    <div key={type} className="destruction-item">
                                        <span className="type">{toDisplayString(type)}:</span>
                                        <span className="count">{toDisplayString(count)}건</span>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* 액션 버튼들 */}
            <div className="action-buttons">
                <MGButton
                    type="button"
                    variant="primary"
                    size="small"
                    onClick={() => window.open('/api/v1/admin/compliance/impact-assessment/execute', '_blank')}
                >
                    영향평가 실행
                </MGButton>
                <MGButton
                    type="button"
                    variant="secondary"
                    size="small"
                    onClick={() => window.open('/api/v1/admin/personal-data-destruction/execute/all', '_blank')}
                >
                    전체 파기 실행
                </MGButton>
                <MGButton
                    type="button"
                    variant="outline"
                    size="small"
                    onClick={() => window.open('/api/v1/admin/compliance/education/plan', '_blank')}
                >
                    교육 계획 수립
                </MGButton>
            </div>
            </>
    );
};

export default ComplianceDashboard;
