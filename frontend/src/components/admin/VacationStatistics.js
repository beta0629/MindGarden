import React, { useState, useEffect, useCallback } from 'react';
import { FaCalendarAlt, FaUserTie, FaChartBar, FaClock } from 'react-icons/fa';
import LoadingSpinner from '../common/LoadingSpinner';
import './VacationStatistics.css';

/**
 * 휴가 통계 컴포넌트
 * - 상담사별 휴가 사용 현황
 * - 휴가 유형별 통계
 * - 최근 휴가 동향
 * 
 * @author MindGarden
 * @version 1.0.0
 * @since 2025-09-17
 */
const VacationStatistics = ({ className = "" }) => {
    const [vacationStats, setVacationStats] = useState({
        summary: {
            totalConsultants: 0,
            totalVacationDays: 0,
            averageVacationDays: 0
        },
        consultantStats: [],
        topVacationConsultants: [],
        vacationTrend: []
    });
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [selectedPeriod, setSelectedPeriod] = useState('month');

    /**
     * 휴가 통계 데이터 로드
     */
    const loadVacationStats = useCallback(async () => {
        try {
            setLoading(true);
            setError(null);

            // 실제 API 호출
            const response = await fetch(`/api/admin/vacation-statistics?period=${selectedPeriod}`, {
                method: 'GET',
                headers: {
                    'Content-Type': 'application/json',
                },
                credentials: 'include'
            });

            if (response.ok) {
                const data = await response.json();
                
                if (data.success) {
                    setVacationStats({
                        summary: data.summary || {
                            totalConsultants: 0,
                            totalVacationDays: 0,
                            averageVacationDays: 0
                        },
                        consultantStats: data.consultantStats || [],
                        topVacationConsultants: data.topVacationConsultants || [],
                        vacationTrend: data.vacationTrend || []
                    });
                } else {
                    throw new Error(data.message || '휴가 통계 조회 실패');
                }
            } else {
                throw new Error('서버 응답 오류');
            }

        } catch (err) {
            console.error('휴가 통계 로드 실패:', err);
            setError('휴가 통계를 불러오는데 실패했습니다.');
            
            // 에러 시 기본값 설정
            setVacationStats({
                summary: {
                    totalConsultants: 0,
                    totalVacationDays: 0,
                    averageVacationDays: 0
                },
                consultantStats: [],
                topVacationConsultants: [],
                vacationTrend: []
            });
        } finally {
            setLoading(false);
        }
    }, [selectedPeriod]);

    useEffect(() => {
        loadVacationStats();
    }, [loadVacationStats]);

    /**
     * 기간 변경 핸들러
     */
    const handlePeriodChange = (period) => {
        setSelectedPeriod(period);
    };

    /**
     * 날짜 포맷팅
     */
    const formatDate = (dateString) => {
        if (!dateString) return '-';
        const date = new Date(dateString);
        return date.toLocaleDateString('ko-KR');
    };

    /**
     * 휴가 유형별 색상
     */
    const getVacationTypeColor = (type) => {
        const colors = {
            '연차': '#28a745',
            '병가': '#dc3545',
            '개인사정': '#ffc107'
        };
        return colors[type] || '#6c757d';
    };

    if (loading) {
        return (
            <div className={`vacation-statistics ${className}`}>
                <LoadingSpinner 
                    text="휴가 통계를 불러오는 중..." 
                    size="medium"
                    inline={true}
                />
            </div>
        );
    }

    if (error) {
        return (
            <div className={`vacation-statistics ${className}`}>
                <div className="vacation-error">
                    <FaCalendarAlt className="error-icon" />
                    <p>{error}</p>
                    <button 
                        className="retry-button"
                        onClick={loadVacationStats}
                    >
                        다시 시도
                    </button>
                </div>
            </div>
        );
    }

    return (
        <div className={`vacation-statistics ${className}`}>
            {/* 헤더 */}
            <div className="vacation-header">
                <div className="header-title">
                    <FaCalendarAlt className="title-icon" />
                    <h3>휴가 현황</h3>
                </div>
                <div className="period-selector">
                    {['week', 'month', 'quarter', 'year'].map(period => (
                        <button
                            key={period}
                            className={`period-button ${selectedPeriod === period ? 'active' : ''}`}
                            onClick={() => handlePeriodChange(period)}
                        >
                            {period === 'week' && '1주일'}
                            {period === 'month' && '1개월'}
                            {period === 'quarter' && '3개월'}
                            {period === 'year' && '1년'}
                        </button>
                    ))}
                </div>
            </div>

            {/* 요약 통계 */}
            <div className="vacation-summary">
                <div className="summary-card">
                    <div className="card-icon consultant-icon">
                        <FaUserTie />
                    </div>
                    <div className="card-content">
                        <h4>전체 상담사</h4>
                        <div className="card-value">{vacationStats.summary.totalConsultants}명</div>
                    </div>
                </div>
                
                <div className="summary-card">
                    <div className="card-icon vacation-icon">
                        <FaCalendarAlt />
                    </div>
                    <div className="card-content">
                        <h4>총 휴가일수</h4>
                        <div className="card-value">
                            {typeof vacationStats.summary.totalVacationDays === 'number' 
                                ? vacationStats.summary.totalVacationDays.toFixed(1)
                                : vacationStats.summary.totalVacationDays}일
                        </div>
                    </div>
                </div>
                
                <div className="summary-card">
                    <div className="card-icon average-icon">
                        <FaChartBar />
                    </div>
                    <div className="card-content">
                        <h4>평균 휴가일수</h4>
                        <div className="card-value">{vacationStats.summary.averageVacationDays.toFixed(1)}일</div>
                    </div>
                </div>
            </div>

            {/* 상담사별 휴가 현황 */}
            <div className="vacation-details">
                <div className="details-section">
                    <h4 className="section-title">
                        <FaUserTie className="section-icon" />
                        상담사별 휴가 현황
                    </h4>
                    <div className="consultant-list">
                        {vacationStats.consultantStats.map(consultant => (
                            <div key={consultant.consultantId} className="consultant-item">
                                <div className="consultant-info">
                                    <div className="consultant-name">{consultant.consultantName}</div>
                                    <div className="consultant-email">{consultant.email}</div>
                                </div>
                                <div className="vacation-info">
                                <div className="vacation-days">
                                    <span className="days-count">
                                        {typeof consultant.vacationDays === 'number' 
                                            ? consultant.vacationDays.toFixed(1)
                                            : consultant.vacationDays}
                                    </span>
                                    <span className="days-label">일</span>
                                </div>
                                    <div className="vacation-types">
                                        {consultant.vacationDaysByType && Object.entries(consultant.vacationDaysByType).map(([type, days]) => (
                                            days > 0 && (
                                                <span 
                                                    key={type}
                                                    className="type-badge"
                                                    style={{ backgroundColor: getVacationTypeColor(type) }}
                                                    title={`${type}: ${days.toFixed(1)}일`}
                                                >
                                                    {type} {days.toFixed(1)}일
                                                </span>
                                            )
                                        ))}
                                        {/* 백업: 가중치 데이터가 없으면 개수로 표시 */}
                                        {!consultant.vacationDaysByType && consultant.vacationByType && Object.entries(consultant.vacationByType).map(([type, count]) => (
                                            count > 0 && (
                                                <span 
                                                    key={type}
                                                    className="type-badge"
                                                    style={{ backgroundColor: getVacationTypeColor(type) }}
                                                >
                                                    {type} {count}회
                                                </span>
                                            )
                                        ))}
                                    </div>
                                    <div className="last-vacation">
                                        <FaClock className="clock-icon" />
                                        <span>최근: {formatDate(consultant.lastVacationDate)}</span>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>

                {/* 휴가 많은 상담사 TOP 3 */}
                <div className="top-vacation-section">
                    <h4 className="section-title">
                        <FaChartBar className="section-icon" />
                        휴가 사용 TOP 3
                    </h4>
                    <div className="top-list">
                        {vacationStats.topVacationConsultants.map((consultant, index) => (
                            <div key={index} className="top-item">
                                <div className="rank-badge">
                                    {index + 1}
                                </div>
                                <div className="consultant-name">{consultant.consultantName}</div>
                                <div className="vacation-count">
                                    {typeof consultant.vacationDays === 'number' 
                                        ? consultant.vacationDays.toFixed(1)
                                        : consultant.vacationDays}일
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default VacationStatistics;
