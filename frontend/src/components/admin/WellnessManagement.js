import React, { useState, useEffect, useCallback } from 'react';
import MGButton from '../common/MGButton';
import { 
    Sparkles, 
    Send, 
    Database, 
    DollarSign, 
    TrendingUp,
    Calendar,
    Clock,
    CheckCircle,
    XCircle,
    RefreshCw,
    BarChart3
} from 'lucide-react';
import { apiGet, apiPost } from '../../utils/ajax';
import { useSession } from '../../contexts/SessionContext';
import notificationManager from '../../utils/notification';
import SimpleLayout from '../layout/SimpleLayout';
import UnifiedLoading from '../common/UnifiedLoading';
import './WellnessManagement.css';

/**
 * 웰니스 알림 관리 페이지
 * - 관리자 전용 (BRANCH_ADMIN 이상)
 * - 템플릿 관리, 테스트 발송, AI 비용 통계
 * 
 * @author MindGarden
 * @version 1.0.0
 * @since 2025-01-21
 */
const WellnessManagement = () => {
    const { user, isLoggedIn } = useSession();
    const [loading, setLoading] = useState(true);
    const [sending, setSending] = useState(false);
    const [refreshing, setRefreshing] = useState(false);
    
    // 통계 데이터
    const [stats, setStats] = useState({
        totalCost: 0,
        totalCostDisplay: '',
        totalTokens: 0,
        totalRequests: 0,
        recentLogs: [],
        exchangeRate: 1300.0,
        exchangeRateDisplay: ''
    });
    
    // 템플릿 데이터
    const [templates, setTemplates] = useState([]);
    const [selectedMonth, setSelectedMonth] = useState({
        year: new Date().getFullYear(),
        month: new Date().getMonth() + 1
    });

    /**
     * API 사용 통계 로드
     */
    const loadUsageStats = useCallback(async () => {
        try {
            const response = await apiGet('/api/admin/wellness/usage-stats', {
                year: selectedMonth.year,
                month: selectedMonth.month
            });
            
            if (response && response.success) {
                setStats(response.data);
            }
        } catch (error) {
            console.error('❌ 통계 로드 실패:', error);
            throw error;
        }
    }, [selectedMonth]);

    /**
     * 템플릿 목록 로드
     */
    const loadTemplates = useCallback(async () => {
        try {
            const response = await apiGet('/api/admin/wellness/templates');
            
            if (response && response.success) {
                setTemplates(response.data);
            }
        } catch (error) {
            console.error('❌ 템플릿 로드 실패:', error);
            throw error;
        }
    }, []);

    /**
     * 환율 정보 로드
     */
    const loadExchangeRate = useCallback(async () => {
        try {
            const response = await apiGet('/api/admin/wellness/exchange-rate');
            
            if (response && response.success) {
                setStats(prev => ({
                    ...prev,
                    exchangeRate: response.data.exchangeRate || 1300.0,
                    exchangeRateDisplay: response.data.exchangeRateDisplay || ''
                }));
            }
        } catch (error) {
            console.error('❌ 환율 정보 로드 실패:', error);
            // 환율 로드 실패는 치명적이지 않으므로 에러를 던지지 않음
        }
    }, []);

    /**
     * 데이터 로드
     */
    const loadData = useCallback(async () => {
        try {
            setLoading(true);
            await Promise.all([
                loadUsageStats(),
                loadTemplates(),
                loadExchangeRate()
            ]);
        } catch (error) {
            console.error('❌ 데이터 로드 실패:', error);
            notificationManager.show('데이터를 불러오는데 실패했습니다.', 'error');
        } finally {
            setLoading(false);
        }
    }, [loadUsageStats, loadTemplates, loadExchangeRate]);

    useEffect(() => {
        if (isLoggedIn && user) {
            loadData();
        }
    }, [isLoggedIn, user, loadData]);



    /**
     * 테스트 발송
     */
    const handleTestSend = async () => {
        if (!window.confirm('웰니스 알림을 테스트 발송하시겠습니까?\n\n모든 내담자에게 즉시 발송됩니다.')) {
            return;
        }

        try {
            setSending(true);
            const response = await apiPost('/api/admin/wellness/test-send');
            
            if (response.success) {
                notificationManager.show('웰니스 알림이 성공적으로 발송되었습니다!', 'success');
                // 통계 새로고침
                await loadUsageStats();
            } else {
                notificationManager.show(response.message || '발송에 실패했습니다.', 'error');
            }
        } catch (error) {
            console.error('❌ 테스트 발송 실패:', error);
            notificationManager.show('테스트 발송 중 오류가 발생했습니다.', 'error');
        } finally {
            setSending(false);
        }
    };

    /**
     * 데이터 새로고침
     */
    const handleRefresh = async () => {
        try {
            setRefreshing(true);
            await loadData();
            notificationManager.show('데이터를 새로고침했습니다.', 'success');
        } catch (error) {
            notificationManager.show('새로고침에 실패했습니다.', 'error');
        } finally {
            setRefreshing(false);
        }
    };

    /**
     * 환율 새로고침
     */
    const handleExchangeRateRefresh = async () => {
        try {
            setRefreshing(true);
            const response = await apiPost('/api/admin/wellness/exchange-rate/refresh');
            
            if (response.success) {
                notificationManager.show('환율을 새로고침했습니다.', 'success');
                await loadExchangeRate();
            } else {
                notificationManager.show(response.message || '환율 새로고침에 실패했습니다.', 'error');
            }
        } catch (error) {
            console.error('❌ 환율 새로고침 실패:', error);
            notificationManager.show('환율 새로고침 중 오류가 발생했습니다.', 'error');
        } finally {
            setRefreshing(false);
        }
    };

    /**
     * 월 변경
     */
    const handleMonthChange = (direction) => {
        setSelectedMonth(prev => {
            let newMonth = prev.month + direction;
            let newYear = prev.year;
            
            if (newMonth > 12) {
                newMonth = 1;
                newYear++;
            } else if (newMonth < 1) {
                newMonth = 12;
                newYear--;
            }
            
            return { year: newYear, month: newMonth };
        });
    };

    /**
     * 카테고리 한글 변환
     */
    const getCategoryName = (category) => {
        const categories = {
            'MENTAL': '마음 건강',
            'EXERCISE': '운동',
            'SLEEP': '수면',
            'NUTRITION': '영양',
            'GENERAL': '일반'
        };
        return categories[category] || category;
    };

    /**
     * 요일 한글 변환
     */
    const getDayName = (dayOfWeek) => {
        if (!dayOfWeek) return '모든 요일';
        const days = ['', '월', '화', '수', '목', '금', '토', '일'];
        return days[dayOfWeek] + '요일';
    };

    /**
     * 계절 한글 변환
     */
    const getSeasonName = (season) => {
        const seasons = {
            'SPRING': '봄',
            'SUMMER': '여름',
            'FALL': '가을',
            'WINTER': '겨울',
            'ALL': '모든 계절'
        };
        return seasons[season] || season;
    };

    if (loading) {
        return (
            <SimpleLayout>
                <UnifiedLoading message="웰니스 관리 데이터를 불러오는 중..." />
            </SimpleLayout>
        );
    }

    return (
        <SimpleLayout>
            <div className="wellness-management">
                {/* 헤더 */}
                <div className="wellness-header">
                    <div className="wellness-header-content">
                        <div className="wellness-header-icon">
                            <Sparkles size={32} />
                        </div>
                        <div className="wellness-header-text">
                            <h1 className="wellness-title">웰니스 알림 관리</h1>
                            <p className="wellness-subtitle">AI 기반 자동 웰니스 컨텐츠 생성 및 발송 관리</p>
                        </div>
                    </div>
                    <div className="wellness-header-actions">
                        <button 
                            className="wellness-btn wellness-btn--secondary"
                            onClick={handleExchangeRateRefresh}
                            disabled={refreshing}
                            title="환율 새로고침"
                        >
                            <TrendingUp size={18} className={refreshing ? 'spinning' : ''} />
                            <span>환율 새로고침</span>
                        </button>
                        <button 
                            className="wellness-btn wellness-btn--secondary"
                            onClick={handleRefresh}
                            disabled={refreshing}
                        >
                            <RefreshCw size={18} className={refreshing ? 'spinning' : ''} />
                            <span>새로고침</span>
                        </button>
                        <button 
                            className="wellness-btn wellness-btn--primary"
                            onClick={handleTestSend}
                            disabled={sending}
                        >
                            <Send size={18} />
                            <span>{sending ? '발송 중...' : '테스트 발송'}</span>
                        </button>
                    </div>
                </div>

                {/* 통계 카드 */}
                <div className="wellness-stats-grid">
                    <div className="wellness-stat-card wellness-stat-card--cost">
                        <div className="wellness-stat-icon">
                            <DollarSign size={24} />
                        </div>
                        <div className="wellness-stat-content">
                            <p className="wellness-stat-label">이번 달 비용</p>
                            <p className="wellness-stat-value">
                                {stats.totalCostDisplay || `$${(stats.totalCost || 0).toFixed(4)}`}
                            </p>
                            <p className="wellness-stat-description">
                                {selectedMonth.year}년 {selectedMonth.month}월
                                {stats.exchangeRateDisplay && (
                                    <span className="wellness-exchange-rate">
                                        (환율: {stats.exchangeRateDisplay})
                                    </span>
                                )}
                            </p>
                        </div>
                    </div>

                    <div className="wellness-stat-card wellness-stat-card--tokens">
                        <div className="wellness-stat-icon">
                            <Database size={24} />
                        </div>
                        <div className="wellness-stat-content">
                            <p className="wellness-stat-label">사용 토큰</p>
                            <p className="wellness-stat-value">
                                {(stats.totalTokens || 0).toLocaleString()}
                            </p>
                            <p className="wellness-stat-description">
                                총 토큰 사용량
                            </p>
                        </div>
                    </div>

                    <div className="wellness-stat-card wellness-stat-card--requests">
                        <div className="wellness-stat-icon">
                            <TrendingUp size={24} />
                        </div>
                        <div className="wellness-stat-content">
                            <p className="wellness-stat-label">API 호출</p>
                            <p className="wellness-stat-value">
                                {(stats.totalRequests || 0).toLocaleString()}
                            </p>
                            <p className="wellness-stat-description">
                                이번 달 총 호출 수
                            </p>
                        </div>
                    </div>

                    <div className="wellness-stat-card wellness-stat-card--templates">
                        <div className="wellness-stat-icon">
                            <BarChart3 size={24} />
                        </div>
                        <div className="wellness-stat-content">
                            <p className="wellness-stat-label">템플릿 수</p>
                            <p className="wellness-stat-value">
                                {templates.length}
                            </p>
                            <p className="wellness-stat-description">
                                활성화된 템플릿
                            </p>
                        </div>
                    </div>
                </div>

                {/* 월 선택 */}
                <div className="wellness-month-selector">
                    <MGButton variant="primary" className="wellness-month-btn" onClick={() => handleMonthChange(-1)}>◀
                    </MGButton>
                    <span className="wellness-month-text">
                        {selectedMonth.year}년 {selectedMonth.month}월
                    </span>
                    <MGButton variant="primary" className="wellness-month-btn" onClick={() => handleMonthChange(1)} disabled={
                            selectedMonth.year === new Date().getFullYear() &&
                            selectedMonth.month === new Date().getMonth() + 1
                        }>▶
                    </MGButton>
                </div>

                {/* 최근 API 사용 로그 */}
                <div className="wellness-section">
                    <h2 className="wellness-section-title">
                        <Clock size={20} />
                        <span>최근 API 사용 내역</span>
                    </h2>
                    <div className="wellness-logs">
                        {stats.recentLogs && stats.recentLogs.length > 0 ? (
                            stats.recentLogs.map((log) => (
                                <div key={log.id} className="wellness-log-item">
                                    <div className="wellness-log-status">
                                        {log.isSuccess ? (
                                            <CheckCircle size={20} className="wellness-log-icon--success" />
                                        ) : (
                                            <XCircle size={20} className="wellness-log-icon--error" />
                                        )}
                                    </div>
                                    <div className="wellness-log-content">
                                        <div className="wellness-log-header">
                                            <span className="wellness-log-type">{log.requestType}</span>
                                            <span className="wellness-log-model">{log.model}</span>
                                        </div>
                                        <div className="wellness-log-details">
                                            <span className="wellness-log-tokens">
                                                {log.totalTokens?.toLocaleString()} 토큰
                                            </span>
                                            <span className="wellness-log-cost">
                                                {log.estimatedCostDisplay || `$${log.estimatedCost?.toFixed(6)}`}
                                            </span>
                                            <span className="wellness-log-time">
                                                {log.responseTimeMs}ms
                                            </span>
                                        </div>
                                    </div>
                                    <div className="wellness-log-date">
                                        <Calendar size={14} />
                                        <span>
                                            {new Date(log.createdAt).toLocaleString('ko-KR')}
                                        </span>
                                    </div>
                                </div>
                            ))
                        ) : (
                            <div className="wellness-empty">
                                <p>최근 사용 내역이 없습니다.</p>
                            </div>
                        )}
                    </div>
                </div>

                {/* 템플릿 목록 */}
                <div className="wellness-section">
                    <h2 className="wellness-section-title">
                        <Database size={20} />
                        <span>웰니스 템플릿 목록</span>
                    </h2>
                    <div className="wellness-templates">
                        {templates.length > 0 ? (
                            templates.map((template) => (
                                <div key={template.id} className="wellness-template-card">
                                    <div className="wellness-template-header">
                                        <h3 className="wellness-template-title">{template.title}</h3>
                                        {template.isImportant && (
                                            <span className="wellness-template-badge wellness-template-badge--important">
                                                중요
                                            </span>
                                        )}
                                    </div>
                                    <div className="wellness-template-meta">
                                        <span className="wellness-template-tag">
                                            {getCategoryName(template.category)}
                                        </span>
                                        <span className="wellness-template-tag">
                                            {getDayName(template.dayOfWeek)}
                                        </span>
                                        <span className="wellness-template-tag">
                                            {getSeasonName(template.season)}
                                        </span>
                                    </div>
                                    <div className="wellness-template-stats">
                                        <span className="wellness-template-stat">
                                            사용 {template.usageCount}회
                                        </span>
                                        <span className="wellness-template-stat">
                                            생성자: {template.createdBy}
                                        </span>
                                    </div>
                                    {template.lastUsedAt && (
                                        <div className="wellness-template-date">
                                            마지막 사용: {new Date(template.lastUsedAt).toLocaleDateString('ko-KR')}
                                        </div>
                                    )}
                                </div>
                            ))
                        ) : (
                            <div className="wellness-empty">
                                <p>등록된 템플릿이 없습니다.</p>
                                <p className="wellness-empty-hint">
                                    테스트 발송을 하면 AI가 자동으로 템플릿을 생성합니다.
                                </p>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </SimpleLayout>
    );
};

export default WellnessManagement;

