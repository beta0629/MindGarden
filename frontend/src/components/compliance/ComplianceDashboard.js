import React, { useState, useEffect } from 'react';
import UnifiedLoading from '../../components/common/UnifiedLoading';
import SimpleLayout from '../layout/SimpleLayout';
import '../../styles/main.css';
import './ComplianceDashboard.css';

/**
 * 컴플라이언스 모니터링 대시보드
 * 
 * @author MindGarden
 * @version 1.0.0
 * @since 2024-12-19
 */
const ComplianceDashboard = () => {
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

    if (loading) {
        return (
            <SimpleLayout title="컴플라이언스 관리">
                <UnifiedLoading type="page" text="컴플라이언스 데이터를 불러오는 중..." />
            </SimpleLayout>
        );
    }

    if (error) {
        return (
            <SimpleLayout title="컴플라이언스 관리">
                <div className="error-container">
                    <h2>❌ 오류 발생</h2>
                    <p>{error}</p>
                    <button onClick={loadComplianceData} className="retry-button">
                        다시 시도
                    </button>
                </div>
            </SimpleLayout>
        );
    }

    return (
        <SimpleLayout title="컴플라이언스 관리">
            <div className="compliance-dashboard">
            <div className="dashboard-header">
                <h1>⚖️ 컴플라이언스 모니터링 대시보드</h1>
                <p>개인정보보호법 및 관련 법령 준수 현황을 실시간으로 모니터링합니다.</p>
                <button onClick={loadComplianceData} className="refresh-button">
                    🔄 새로고침
                </button>
            </div>

            {/* 종합 현황 */}
            {overallStatus && (
                <div className="overall-status-card">
                    <h2>📊 종합 컴플라이언스 현황</h2>
                    <div className="overall-metrics">
                        <div className="metric-item">
                            <div className="metric-label">종합 점수</div>
                            <div className="metric-value" data-compliance-color={getComplianceLevelColor(overallStatus.complianceLevel)}>
                                {overallStatus.overallScore || 0}점
                            </div>
                        </div>
                        <div className="metric-item">
                            <div className="metric-label">준수 수준</div>
                            <div className="metric-value" data-compliance-color={getComplianceLevelColor(overallStatus.complianceLevel)}>
                                {getComplianceLevelIcon(overallStatus.complianceLevel)} {overallStatus.complianceLevel || '미평가'}
                            </div>
                        </div>
                        <div className="metric-item">
                            <div className="metric-label">마지막 업데이트</div>
                            <div className="metric-value">
                                {overallStatus.lastUpdated ? new Date(overallStatus.lastUpdated).toLocaleString() : 'N/A'}
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
                            <span className="value">{processingStatus.totalCount || 0}건</span>
                        </div>
                        <div className="status-item">
                            <span className="label">데이터 유형별:</span>
                            <div className="data-type-stats">
                                {processingStatus.dataTypeStats && Object.entries(processingStatus.dataTypeStats).map(([type, count]) => (
                                    <div key={type} className="data-type-item">
                                        <span className="type">{type}:</span>
                                        <span className="count">{count}건</span>
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
                                {impactAssessment.overallAssessment?.overallRiskLevel || '미평가'}
                            </span>
                        </div>
                        <div className="status-item">
                            <span className="label">준수 상태:</span>
                            <span className="value">
                                {impactAssessment.overallAssessment?.complianceStatus || '미평가'}
                            </span>
                        </div>
                        <div className="status-item">
                            <span className="label">개선 필요 영역:</span>
                            <div className="improvement-areas">
                                {impactAssessment.overallAssessment?.improvementAreas?.map((area, index) => (
                                    <div key={index} className="improvement-item">• {area}</div>
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
                                {breachResponse.responseTeam?.teamLeader || 'N/A'}
                            </span>
                        </div>
                        <div className="status-item">
                            <span className="label">긴급 연락처:</span>
                            <span className="value">
                                {breachResponse.responseTeam?.contactInfo?.emergency || 'N/A'}
                            </span>
                        </div>
                        <div className="status-item">
                            <span className="label">대응 절차:</span>
                            <div className="response-procedures">
                                {breachResponse.responseProcedures && Object.entries(breachResponse.responseProcedures).map(([step, procedure]) => (
                                    <div key={step} className="procedure-item">
                                        <strong>{procedure.title}:</strong> {procedure.timeframe}
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
                                {educationStatus.completionStatus?.completionRate || 'N/A'}
                            </span>
                        </div>
                        <div className="status-item">
                            <span className="label">전체 임직원:</span>
                            <span className="value">
                                {educationStatus.completionStatus?.totalEmployees || 0}명
                            </span>
                        </div>
                        <div className="status-item">
                            <span className="label">교육 프로그램:</span>
                            <div className="education-programs">
                                {educationStatus.educationPrograms && Object.entries(educationStatus.educationPrograms).map(([type, program]) => (
                                    <div key={type} className="program-item">
                                        <strong>{program.title}:</strong> {program.frequency}
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
                                {policyStatus.policyComponents?.basicInfo?.companyName || 'N/A'}
                            </span>
                        </div>
                        <div className="status-item">
                            <span className="label">개인정보보호책임자:</span>
                            <span className="value">
                                {policyStatus.policyComponents?.basicInfo?.privacyOfficer || 'N/A'}
                            </span>
                        </div>
                        <div className="status-item">
                            <span className="label">마지막 업데이트:</span>
                            <span className="value">
                                {policyStatus.policyComponents?.basicInfo?.lastUpdated || 'N/A'}
                            </span>
                        </div>
                        <div className="status-item">
                            <span className="label">다음 검토일:</span>
                            <span className="value">
                                {policyStatus.nextReviewDate ? new Date(policyStatus.nextReviewDate).toLocaleDateString() : 'N/A'}
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
                                {destructionStatus.totalDestroyed || 0}건
                            </span>
                        </div>
                        <div className="status-item">
                            <span className="label">마지막 파기:</span>
                            <span className="value">
                                {destructionStatus.lastDestruction ? new Date(destructionStatus.lastDestruction).toLocaleString() : 'N/A'}
                            </span>
                        </div>
                        <div className="status-item">
                            <span className="label">파기 통계:</span>
                            <div className="destruction-stats">
                                {destructionStatus.destructionStats && Object.entries(destructionStatus.destructionStats).map(([type, count]) => (
                                    <div key={type} className="destruction-item">
                                        <span className="type">{type}:</span>
                                        <span className="count">{count}건</span>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* 액션 버튼들 */}
            <div className="action-buttons">
                <button 
                    className="action-button primary"
                    onClick={() => window.open('/api/v1/admin/compliance/impact-assessment/execute', '_blank')}
                >
                    📊 영향평가 실행
                </button>
                <button 
                    className="action-button secondary"
                    onClick={() => window.open('/api/v1/admin/personal-data-destruction/execute/all', '_blank')}
                >
                    🗑️ 전체 파기 실행
                </button>
                <button 
                    className="action-button tertiary"
                    onClick={() => window.open('/api/v1/admin/compliance/education/plan', '_blank')}
                >
                    🎓 교육 계획 수립
                </button>
            </div>
            </div>
        </SimpleLayout>
    );
};

export default ComplianceDashboard;
