import React from 'react';
import { getUserStatusKoreanNameSync, getUserGradeKoreanNameSync } from '../../../utils/codeHelper';
import SafeText from '../../common/SafeText';
import KpiNumeral from '../../dashboard-v2/atoms/KpiNumeral';
import '../mapping-management/organisms/MappingKpiSection.css';
import './ClientStatisticsTab.css';

const CLIENT_STATS_KPI_UNIT_PEOPLE = '명';
const CLIENT_STATS_KPI_UNIT_CASES = '건';
const CLIENT_STATS_KPI_STRIP_ARIA = '내담자 통계 요약';

/**
 * 내담자 통계 분석 탭 컴포넌트
 */
const ClientStatisticsTab = ({
    clients,
    consultations,
    mappings
}) => {
    const totalClients = clients.length;
    // ⚠️ 표준화 2025-12-05: 하드코딩된 상태값을 공통코드에서 동적 조회하세요. getCommonCodes('STATUS_GROUP') 사용
    const activeClients = clients.filter(client => client.status === 'ACTIVE').length;
    const totalConsultations = consultations.length;
    const totalMappings = mappings.length;
    
    const clientsByGrade = clients.reduce((acc, client) => {
        const grade = client.grade || '미설정';
        acc[grade] = (acc[grade] || 0) + 1;
        return acc;
    }, {});
    
    const clientsByStatus = clients.reduce((acc, client) => {
        acc[client.status] = (acc[client.status] || 0) + 1;
        return acc;
    }, {});
    
    const consultationsByMonth = consultations.reduce((acc, consultation) => {
        const month = new Date(consultation.date).toLocaleDateString('ko-KR', { 
            year: 'numeric', 
            month: 'long' 
        });
        acc[month] = (acc[month] || 0) + 1;
        return acc;
    }, {});

    const renderChartData = (title, data, color = 'var(--ad-b0kla-green)') => {
        if (!data || Object.keys(data).length === 0) {
            return (
                <div className="mg-v2-card mg-v2-chart-card">
                    <h3>{title}</h3>
                    <div className="mg-v2-empty-state">
                        <p>데이터가 없습니다.</p>
                    </div>
                </div>
            );
        }

        const maxValue = Math.max(...Object.values(data));
        
        const getLabel = (key) => {
            if (!key || key === 'undefined' || key === 'null') {
                return '알 수 없음';
            }
            if (title.includes('등급')) {
                if (key === '미설정') {
                    return '미설정';
                }
                return getUserGradeKoreanNameSync(key) || key || '알 수 없음';
            }
            if (title.includes('상태')) {
                return getUserStatusKoreanNameSync(key) || key || '알 수 없음';
            }
            return key || '알 수 없음';
        };

        return (
            <div className="mg-v2-card mg-v2-chart-card">
                <h3>{title}</h3>
                <div className="mg-v2-chart-content">
                    {Object.entries(data).map(([key, value]) => (
                        <div key={key} className="mg-v2-chart-item">
                            <div className="mg-v2-chart-label">{getLabel(key)}</div>
                            <div className="mg-v2-chart-bar">
                                <div 
                                    className="mg-v2-chart-fill"
                                    style={{ 
                                        '--chart-width': `${maxValue > 0 ? (value / maxValue) * 100 : 0}%`,
                                        '--chart-color': color
                                    }}
                                />
                            </div>
                            <div className="mg-v2-chart-value">{value}</div>
                        </div>
                    ))}
                </div>
            </div>
        );
    };

    return (
        <div className="mg-v2-client-statistics">
            <div className="mg-v2-section-header">
                <h2>통계 분석</h2>
                <p>내담자 관련 통계 정보를 확인할 수 있습니다.</p>
            </div>
            
            {/* 주요 통계 — Clinic-OS summary strip */}
            <section
                className="mg-v2-mapping-kpi-section mapping-management-summary mapping-management-summary--cols-4"
                data-testid="client-statistics-summary"
                aria-label={CLIENT_STATS_KPI_STRIP_ARIA}
            >
                <article className="mapping-management-summary__cell">
                    <p className="mapping-management-summary__label">
                        <SafeText>총 내담자 수</SafeText>
                    </p>
                    <div className="mapping-management-summary__amount">
                        <KpiNumeral value={String(totalClients)} unit={CLIENT_STATS_KPI_UNIT_PEOPLE} />
                    </div>
                </article>
                <article className="mapping-management-summary__cell">
                    <p className="mapping-management-summary__label">
                        <SafeText>활성 내담자</SafeText>
                    </p>
                    <div className="mapping-management-summary__amount">
                        <KpiNumeral value={String(activeClients)} unit={CLIENT_STATS_KPI_UNIT_PEOPLE} />
                    </div>
                </article>
                <article className="mapping-management-summary__cell">
                    <p className="mapping-management-summary__label">
                        <SafeText>총 상담 수</SafeText>
                    </p>
                    <div className="mapping-management-summary__amount">
                        <KpiNumeral value={String(totalConsultations)} unit={CLIENT_STATS_KPI_UNIT_CASES} />
                    </div>
                </article>
                <article className="mapping-management-summary__cell">
                    <p className="mapping-management-summary__label">
                        <SafeText>총 매칭 수</SafeText>
                    </p>
                    <div className="mapping-management-summary__amount">
                        <KpiNumeral value={String(totalMappings)} unit={CLIENT_STATS_KPI_UNIT_CASES} />
                    </div>
                </article>
            </section>
            
            {/* 상세 통계 */}
            <div className="mg-v2-detailed-stats">
                <div className="mg-mobile-card-stack">
                    {renderChartData('등급별 내담자 분포', clientsByGrade, 'var(--ad-b0kla-blue)')}
                    {renderChartData('상태별 내담자 분포', clientsByStatus, 'var(--ad-b0kla-green)')}
                    {Object.keys(consultationsByMonth).length > 0 &&
                        renderChartData('월별 상담 수', consultationsByMonth, 'var(--ad-b0kla-orange)')
                    }
                </div>
            </div>
            
            {/* 요약 정보 */}
            <div className="mg-v2-card mg-v2-summary-card">
                <h3 className="mg-v2-h3">요약 정보</h3>
                <div className="mg-v2-summary-content">
                    <p>• 전체 내담자 중 활성 비율: {totalClients > 0 ? Math.round((activeClients / totalClients) * 100) : 0}%</p>
                    <p>• 내담자당 평균 상담 수: {totalClients > 0 ? Math.round(totalConsultations / totalClients) : 0}건</p>
                    <p>• 내담자당 평균 매칭 수: {totalClients > 0 ? Math.round(totalMappings / totalClients) : 0}건</p>
                </div>
            </div>
        </div>
    );
};

export default ClientStatisticsTab;
