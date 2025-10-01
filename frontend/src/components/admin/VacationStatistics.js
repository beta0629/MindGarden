import React, { useState, useEffect, useCallback } from 'react';
import { FaCalendarAlt, FaUserTie, FaChartBar, FaClock } from 'react-icons/fa';
import LoadingSpinner from '../common/LoadingSpinner';
import './VacationStatistics.css';

/**
 * 상담사별 색상 반환 함수
 */
const getConsultantColor = (consultantId) => {
    const colors = [
        '#3b82f6', // 파란색
        '#10b981', // 녹색
        '#f59e0b', // 주황색
        '#ef4444', // 빨간색
        '#8b5cf6', // 보라색
        '#06b6d4', // 청록색
        '#84cc16', // 라임색
        '#f97316', // 오렌지색
        '#ec4899', // 핑크색
        '#6366f1'  // 인디고색
    ];
    
    // 상담사 ID를 기반으로 일관된 색상 할당
    const colorIndex = consultantId % colors.length;
    return colors[colorIndex];
};

/**
 * 휴가 유형을 한글로 변환
 */
const getVacationTypeKorean = (type) => {
    const typeMap = {
        'annual': '연차',
        'personal': '개인',
        'sick': '병가',
        'maternity': '출산',
        'paternity': '육아',
        'bereavement': '경조',
        'other': '기타'
    };
    return typeMap[type] || type;
};

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
                console.log('🏖️ 휴가 통계 API 응답:', data);
                
                if (data.success) {
                    console.log('📊 상담사별 휴가 데이터:', data.consultantStats);
                    
                    // 각 상담사의 vacationDaysByType 데이터 확인
                    data.consultantStats?.forEach(consultant => {
                        console.log(`👤 ${consultant.consultantName}:`, {
                            vacationDays: consultant.vacationDays,
                            vacationByType: consultant.vacationByType,
                            vacationDaysByType: consultant.vacationDaysByType
                        });
                    });
                    
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
     * 휴가 유형별 파스텔 색상
     */
    const getVacationTypeColor = (type) => {
        const colors = {
            '연차': '#E8F5E8',        // 연한 초록 (연차)
            '반차': '#FFF2CC',        // 연한 노랑 (반차) 
            '반반차': '#E6F3FF',      // 연한 파랑 (반반차)
            '개인사정': '#F5E6FF',    // 연한 보라 (개인사정)
            '병가': '#FFE6E6',        // 연한 빨강 (병가)
            '하루 종일 휴가': '#E8F5E8',  // 연한 초록 (종일 휴가)
            '사용자 정의 휴가': '#F0F8FF', // 연한 하늘색 (사용자 정의)
            // 상세 유형별 색상
            '오전 반반차 1 (09:00-11:00)': '#E6F3FF',
            '오전 반반차 2 (11:00-13:00)': '#E6F3FF', 
            '오후 반반차 1 (14:00-16:00)': '#E6F3FF',
            '오후 반반차 2 (16:00-18:00)': '#E6F3FF',
            '오전반차': '#FFF2CC',
            '오후반차': '#FFF2CC'
        };
        return colors[type] || '#F8F9FA'; // 기본 연한 회색
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
                        {vacationStats.consultantStats.map(consultant => {
                            const consultantColor = getConsultantColor(consultant.consultantId);
                            return (
                                <div key={consultant.consultantId} className="consultant-item" style={{ borderLeft: `4px solid ${consultantColor}` }}>
                                    <div className="consultant-info">
                                        <div className="consultant-avatar" style={{ backgroundColor: consultantColor }}>
                                            {consultant.consultantName.charAt(0)}
                                        </div>
                                        <div className="consultant-details">
                                            <div className="consultant-name">{consultant.consultantName}</div>
                                            <div className="consultant-email">{consultant.consultantEmail}</div>
                                        </div>
                                    </div>
                                    <div className="vacation-info">
                                        <div className="vacation-days" style={{ color: consultantColor }}>
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
                                                        style={{ 
                                                            backgroundColor: `${consultantColor}20`,
                                                            color: consultantColor,
                                                            border: `1px solid ${consultantColor}`,
                                                            fontWeight: '500',
                                                            borderRadius: '12px',
                                                            padding: '4px 8px',
                                                            fontSize: 'var(--font-size-xs)',
                                                            margin: '2px',
                                                            display: 'inline-block'
                                                        }}
                                                        title={`${getVacationTypeKorean(type)}: ${days.toFixed(1)}일`}
                                                    >
                                                        {getVacationTypeKorean(type)} {days.toFixed(1)}일
                                                    </span>
                                                )
                                            ))}
                                            {/* 백업: 가중치 데이터가 없으면 개수로 표시 */}
                                            {!consultant.vacationDaysByType && consultant.vacationByType && Object.entries(consultant.vacationByType).map(([type, count]) => (
                                                count > 0 && (
                                                    <span 
                                                        key={type}
                                                        className="type-badge"
                                                        style={{ 
                                                            backgroundColor: `${consultantColor}20`,
                                                            color: consultantColor,
                                                            border: `1px solid ${consultantColor}`,
                                                            fontWeight: '500',
                                                            borderRadius: '12px',
                                                            padding: '4px 8px',
                                                            fontSize: 'var(--font-size-xs)',
                                                            margin: '2px',
                                                            display: 'inline-block'
                                                        }}
                                                    >
                                                        {getVacationTypeKorean(type)} {count}회
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
                            );
                        })}
                    </div>
                </div>

                {/* 휴가 많은 상담사 TOP 3 */}
                <div className="top-vacation-section">
                    <h4 className="section-title">
                        <FaChartBar className="section-icon" />
                        휴가 사용 TOP 3
                    </h4>
                    <div className="top-list">
                        {vacationStats.topVacationConsultants.map((consultant, index) => {
                            const consultantColor = getConsultantColor(consultant.consultantId);
                            return (
                                <div key={index} className="top-item" style={{ borderLeft: `4px solid ${consultantColor}` }}>
                                    <div className="rank-badge" style={{ backgroundColor: consultantColor }}>
                                        {index + 1}
                                    </div>
                                    <div className="consultant-name">{consultant.consultantName}</div>
                                    <div className="vacation-count" style={{ color: consultantColor }}>
                                        {typeof consultant.vacationDays === 'number' 
                                            ? consultant.vacationDays.toFixed(1)
                                            : consultant.vacationDays}일
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default VacationStatistics;
