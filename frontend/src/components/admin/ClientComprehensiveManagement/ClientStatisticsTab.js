import React from 'react';
import { FaChartBar, FaUsers, FaHandshake, FaCalendarAlt } from 'react-icons/fa';
import { getUserStatusKoreanNameSync, getUserGradeKoreanNameSync } from '../../../utils/codeHelper';

/**
 * 내담자 통계 분석 탭 컴포넌트
 */
const ClientStatisticsTab = ({
    clients,
    consultations,
    mappings
}) => {
    // 통계 데이터 계산
    const totalClients = clients.length;
    const activeClients = clients.filter(client => client.status === 'ACTIVE').length;
    const totalConsultations = consultations.length;
    const totalMappings = mappings.length;
    
    // 등급별 내담자 수
    const clientsByGrade = clients.reduce((acc, client) => {
        acc[client.grade] = (acc[client.grade] || 0) + 1;
        return acc;
    }, {});
    
    // 상태별 내담자 수
    const clientsByStatus = clients.reduce((acc, client) => {
        acc[client.status] = (acc[client.status] || 0) + 1;
        return acc;
    }, {});
    
    // 월별 상담 수
    const consultationsByMonth = consultations.reduce((acc, consultation) => {
        const month = new Date(consultation.date).toLocaleDateString('ko-KR', { 
            year: 'numeric', 
            month: 'long' 
        });
        acc[month] = (acc[month] || 0) + 1;
        return acc;
    }, {});

    // 통계 카드 렌더링
    const renderStatCard = (title, value, icon, color = '#007bff') => (
        <div className="mg-v2-card mg-v2-stat-card">
            <div className="mg-v2-stat-icon" style={{ '--icon-color': color }}>
                {icon}
            </div>
            <div className="mg-v2-stat-content">
                <h3>{value}</h3>
                <p>{title}</p>
            </div>
        </div>
    );

    // 차트 데이터 렌더링
    const renderChartData = (title, data, color = '#007bff') => {
        // 데이터가 없으면 빈 상태 표시
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
        
        // 라벨 변환 함수
        const getLabel = (key) => {
            // 등급별 분포인 경우
            if (title.includes('등급')) {
                return getUserGradeKoreanNameSync(key) || key || '알 수 없음';
            }
            // 상태별 분포인 경우
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
            
            {/* 주요 통계 */}
            <div className="mg-v2-stats-grid">
                {renderStatCard('총 내담자 수', totalClients, <FaUsers />, '#28a745')}
                {renderStatCard('활성 내담자', activeClients, <FaUsers />, '#007bff')}
                {renderStatCard('총 상담 수', totalConsultations, <FaCalendarAlt />, '#ffc107')}
                {renderStatCard('총 매칭 수', totalMappings, <FaHandshake />, '#dc3545')}
            </div>
            
            {/* 상세 통계 */}
            <div className="mg-v2-detailed-stats">
                <div className="mg-mobile-card-stack">
                    {renderChartData('등급별 내담자 분포', clientsByGrade, '#6f42c1')}
                    {renderChartData('상태별 내담자 분포', clientsByStatus, '#17a2b8')}
                    {Object.keys(consultationsByMonth).length > 0 && 
                        renderChartData('월별 상담 수', consultationsByMonth, '#fd7e14')
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
