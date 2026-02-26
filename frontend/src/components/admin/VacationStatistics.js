import React, { useState, useEffect, useCallback } from 'react';
// // import UnifiedLoading from '../../components/common/UnifiedLoading'; // 임시 비활성화
import MGButton from '../../components/common/MGButton'; // 임시 비활성화
import StatCard from '../ui/Card/StatCard';
import DashboardSection from '../layout/DashboardSection';
import { Calendar, User, BarChart3, Clock } from 'lucide-react';
import Avatar from '../common/Avatar';
import './VacationStatistics.css';

/**
 * 상담사별 색상 반환 함수 - CSS 변수 사용
 */
const getConsultantColor = (consultantId) => {
    const colorClasses = [
        'consultant-color-1', // 파란색
        'consultant-color-2', // 녹색
        'consultant-color-3', // 주황색
        'consultant-color-4', // 빨간색
        'consultant-color-5', // 보라색
        'consultant-color-6', // 청록색
        'consultant-color-7', // 라임색
        'consultant-color-8', // 오렌지색
        'consultant-color-9', // 핑크색
        'consultant-color-10' // 인디고색
    ];
    
    // 상담사 ID를 기반으로 일관된 색상 할당
    const colorIndex = consultantId % colorClasses.length;
    return colorClasses[colorIndex];
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
/**
 * - 상담사별 휴가 사용 현황
/**
 * - 휴가 유형별 통계
/**
 * - 최근 휴가 동향
/**
 * 
/**
 * @author Core Solution
/**
 * @version 1.0.0
/**
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
     * 휴가 유형별 색상 (디자인 시스템 변수 사용)
     */
    const getVacationTypeColor = (type) => {
        const colors = {
            // ⚠️ 표준화 2025-12-05: 하드코딩된 색상값을 CSS 변수로 변경 필요: rgba(52, 199, 89, 0.2) -> var(--mg-custom-color)
            '연차': 'rgba(52, 199, 89, 0.2)',        // 연한 초록 (연차)
            // ⚠️ 표준화 2025-12-05: 하드코딩된 색상값을 CSS 변수로 변경 필요: rgba(255, 149, 0, 0.2) -> var(--mg-custom-color)
            '반차': 'rgba(255, 149, 0, 0.2)',         // 연한 노랑 (반차) 
            // ⚠️ 표준화 2025-12-05: 하드코딩된 색상값을 CSS 변수로 변경 필요: rgba(0, 122, 255, 0.2) -> var(--mg-custom-color)
            '반반차': 'rgba(0, 122, 255, 0.2)',       // 연한 파랑 (반반차)
            // ⚠️ 표준화 2025-12-05: 하드코딩된 색상값을 CSS 변수로 변경 필요: rgba(88, 86, 214, 0.2) -> var(--mg-custom-color)
            '개인사정': 'rgba(88, 86, 214, 0.2)',     // 연한 보라 (개인사정)
            // ⚠️ 표준화 2025-12-05: 하드코딩된 색상값을 CSS 변수로 변경 필요: rgba(255, 59, 48, 0.2) -> var(--mg-custom-color)
            '병가': 'rgba(255, 59, 48, 0.2)',         // 연한 빨강 (병가)
            // ⚠️ 표준화 2025-12-05: 하드코딩된 색상값을 CSS 변수로 변경 필요: rgba(52, 199, 89, 0.2) -> var(--mg-custom-color)
            '하루 종일 휴가': 'rgba(52, 199, 89, 0.2)',  // 연한 초록 (종일 휴가)
            // ⚠️ 표준화 2025-12-05: 하드코딩된 색상값을 CSS 변수로 변경 필요: rgba(0, 122, 255, 0.15) -> var(--mg-custom-color)
            '사용자 정의 휴가': 'rgba(0, 122, 255, 0.15)', // 연한 하늘색 (사용자 정의)
            // 상세 유형별 색상
            // ⚠️ 표준화 2025-12-05: 하드코딩된 색상값을 CSS 변수로 변경 필요: rgba(0, 122, 255, 0.2) -> var(--mg-custom-color)
            '오전 반반차 1 (09:00-11:00)': 'rgba(0, 122, 255, 0.2)',
            // ⚠️ 표준화 2025-12-05: 하드코딩된 색상값을 CSS 변수로 변경 필요: rgba(0, 122, 255, 0.2) -> var(--mg-custom-color)
            '오전 반반차 2 (11:00-13:00)': 'rgba(0, 122, 255, 0.2)', 
            // ⚠️ 표준화 2025-12-05: 하드코딩된 색상값을 CSS 변수로 변경 필요: rgba(0, 122, 255, 0.2) -> var(--mg-custom-color)
            '오후 반반차 1 (14:00-16:00)': 'rgba(0, 122, 255, 0.2)',
            // ⚠️ 표준화 2025-12-05: 하드코딩된 색상값을 CSS 변수로 변경 필요: rgba(0, 122, 255, 0.2) -> var(--mg-custom-color)
            '오후 반반차 2 (16:00-18:00)': 'rgba(0, 122, 255, 0.2)',
            // ⚠️ 표준화 2025-12-05: 하드코딩된 색상값을 CSS 변수로 변경 필요: rgba(255, 149, 0, 0.2) -> var(--mg-custom-color)
            '오전반차': 'rgba(255, 149, 0, 0.2)',
            // ⚠️ 표준화 2025-12-05: 하드코딩된 색상값을 CSS 변수로 변경 필요: rgba(255, 149, 0, 0.2) -> var(--mg-custom-color)
            '오후반차': 'rgba(255, 149, 0, 0.2)'
        };
        // ⚠️ 표준화 2025-12-05: 하드코딩된 색상값을 CSS 변수로 변경 필요: rgba(248, 249, 250, 0.5) -> var(--mg-custom-color)
        return colors[type] || 'rgba(248, 249, 250, 0.5)'; // 기본 연한 회색
    };

    if (loading) {
        return (
            <div className={`vacation-statistics ${className}`}>
                <div className="mg-loading">로딩중...</div>
            </div>
        );
    }

    if (error) {
        return (
            <div className={`vacation-statistics mg-dashboard-layout ${className}`}>
                <div className="mg-empty-state">
                    <div className="mg-empty-state__icon">
                        <Calendar size={48} />
                    </div>
                    <div className="mg-empty-state__text">{error}</div>
                    <button className="mg-button" variant="primary" onClick={loadVacationStats}>다시 시도</button>
                </div>
            </div>
        );
    }

    return (
        <div className={`vacation-statistics mg-dashboard-layout ${className}`}>
            {/* 헤더 */}
            <div className="mg-dashboard-header">
                <div className="mg-dashboard-header-content">
                    <div className="mg-dashboard-header-left">
                        <Calendar size={32} />
                        <div>
                            <h1 className="mg-dashboard-title">휴가 현황</h1>
                            <p className="mg-dashboard-subtitle">상담사별 휴가 사용 통계 및 현황</p>
                        </div>
                    </div>
                    <div className="mg-dashboard-header-right">
                        <div className="period-selector">
                            {['week', 'month', 'quarter', 'year'].map(period => (
                                <button className="mg-button"
                                    key={period}
                                    variant={selectedPeriod === period ? 'primary' : 'outline'}
                                    size="small"
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
                </div>
            </div>

            {/* 요약 통계 */}
            <div className="mg-dashboard-stats">
                <StatCard
                    icon={<User />}
                    value={`${vacationStats.summary.totalConsultants}명`}
                    label="전체 상담사"
                />
                <StatCard
                    icon={<Calendar />}
                    value={`${typeof vacationStats.summary.totalVacationDays === 'number' 
                        ? vacationStats.summary.totalVacationDays.toFixed(1)
                        : vacationStats.summary.totalVacationDays}일`}
                    label="총 휴가일수"
                />
                <StatCard
                    icon={<BarChart3 />}
                    value={`${vacationStats.summary.averageVacationDays.toFixed(1)}일`}
                    label="평균 휴가일수"
                />
            </div>

            {/* 상담사별 휴가 현황 */}
            <div className="mg-dashboard-content">
                <DashboardSection
                    title="상담사별 휴가 현황"
                    icon={<User size={24} />}
                >
                    <div className="consultant-list">
                        {vacationStats.consultantStats.map(consultant => {
                            const consultantColor = getConsultantColor(consultant.consultantId);
                            return (
                                <div 
                                    key={consultant.consultantId} 
                                    className="consultant-card" 
                                >
                                    <div className="consultant-info">
                                        <Avatar
                                            profileImageUrl={consultant.profileImageUrl}
                                            displayName={consultant.consultantName}
                                            className={`consultant-avatar ${consultantColor} mg-v2-consultant-detail-avatar`}
                                        />
                                        <div className="consultant-name">{consultant.consultantName}</div>
                                        <div className="consultant-vacation-info">{consultant.consultantEmail}</div>
                                    </div>
                                    <div className="consultant-vacation-details">
                                        <div className="consultant-vacation-count">
                                            {typeof consultant.vacationDays === 'number' 
                                                ? consultant.vacationDays.toFixed(1)
                                                : consultant.vacationDays}일
                                        </div>
                                        <div className="vacation-types">
                                            {consultant.vacationDaysByType && Object.entries(consultant.vacationDaysByType).map(([type, days]) => (
                                                days > 0 && (
                                                    <span 
                                                        key={type}
                                                        className="type-badge"
                                                        data-bg-color={`${consultantColor}20`}
                                                        data-text-color={consultantColor}
                                                        data-border-color={consultantColor}
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
                                                        data-bg-color={`${consultantColor}20`}
                                                        data-text-color={consultantColor}
                                                        data-border-color={consultantColor}
                                                    >
                                                        {getVacationTypeKorean(type)} {count}회
                                                    </span>
                                                )
                                            ))}
                                        </div>
                                        <div className="last-vacation">
                                            <Clock size={16} className="clock-icon" />
                                            <span>최근: {formatDate(consultant.lastVacationDate)}</span>
                                        </div>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </DashboardSection>

                {/* 휴가 많은 상담사 TOP 3 */}
                <DashboardSection
                    title="휴가 사용 TOP 3"
                    icon={<BarChart3 size={24} />}
                >
                    <div className="top-list">
                        {vacationStats.topVacationConsultants.map((consultant, index) => {
                            const consultantColor = getConsultantColor(consultant.consultantId);
                            return (
                                <div key={index} className="top-item" data-border-color={consultantColor}>
                                    <div className="rank-badge" data-bg-color={consultantColor}>
                                        {index + 1}
                                    </div>
                                    <div className="consultant-name">{consultant.consultantName}</div>
                                    <div className="vacation-count" data-text-color={consultantColor}>
                                        {typeof consultant.vacationDays === 'number' 
                                            ? consultant.vacationDays.toFixed(1)
                                            : consultant.vacationDays}일
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </DashboardSection>
            </div>
        </div>
    );
};

export default VacationStatistics;
