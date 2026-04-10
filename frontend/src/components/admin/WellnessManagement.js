import React, { useState, useEffect, useCallback } from 'react';
import MGButton from '../common/MGButton';
import {
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
import ConfirmModal from '../common/ConfirmModal';
import SafeText from '../common/SafeText';
import { toDisplayString, toSafeNumber } from '../../utils/safeDisplay';
import AdminCommonLayout from '../layout/AdminCommonLayout';
import ContentArea from '../dashboard-v2/content/ContentArea';
import ContentHeader from '../dashboard-v2/content/ContentHeader';
import UnifiedLoading from '../common/UnifiedLoading';
import { sessionManager } from '../../utils/sessionManager';
import '../../styles/unified-design-tokens.css';
import './AdminDashboard/AdminDashboardB0KlA.css';
import './WellnessManagement.css';

/**
 * 웰니스 알림 관리 페이지
/**
 * - 관리자 전용 (BRANCH_ADMIN 이상)
/**
 * - 템플릿 관리, 테스트 발송, AI 비용 통계
/**
 * 
/**
 * @author Core Solution
/**
 * @version 1.0.0
/**
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
    
    // 컨펌 모달 상태
    const [confirmModal, setConfirmModal] = useState({
        isOpen: false,
        title: '',
        message: '',
        type: 'default',
        onConfirm: null
    });

    // 데이터 로드 함수 (재사용 가능)
    const loadData = useCallback(async () => {
        try {
            setLoading(true);
            console.log('📊 웰니스 관리 데이터 로드 시작');
            
            // API 사용 통계 로드
            const usageStatsResponse = await apiGet('/api/v1/admin/wellness/usage-stats', {
                year: selectedMonth.year,
                month: selectedMonth.month
            });
            
            console.log('📊 통계 응답:', usageStatsResponse);
            
            if (usageStatsResponse && usageStatsResponse.success) {
                setStats(usageStatsResponse.data);
            }
            
            // 템플릿 목록 로드
            const templatesResponse = await apiGet('/api/v1/admin/wellness/templates');
            
            console.log('📋 템플릿 응답:', templatesResponse);
            
            if (templatesResponse && templatesResponse.success) {
                setTemplates(templatesResponse.data);
            }
            
            // 환율 정보 로드
            const exchangeRateResponse = await apiGet('/api/v1/admin/wellness/exchange-rate');
            
            console.log('💰 환율 응답:', exchangeRateResponse);
            
            if (exchangeRateResponse && exchangeRateResponse.success) {
                setStats(prev => ({
                    ...prev,
                    exchangeRate: exchangeRateResponse.data.exchangeRate || 1300.0,
                    exchangeRateDisplay: exchangeRateResponse.data.exchangeRateDisplay || ''
                }));
            }
            
            console.log('✅ 웰니스 관리 데이터 로드 완료');
        } catch (error) {
            console.error('❌ 데이터 로드 실패:', error);
            notificationManager.show('데이터를 불러오는데 실패했습니다.', 'error');
        } finally {
            setLoading(false);
        }
    }, [selectedMonth]);

    useEffect(() => {
        console.log('🔍 웰니스 관리 useEffect 실행:', { isLoggedIn, userId: user?.id, selectedMonth });
        
        const loadDataAsync = async () => {
            // sessionManager에서 직접 사용자 확인
            const sessionUser = sessionManager.getUser();
            if (!sessionUser?.id) {
                console.log('❌ sessionManager에 사용자 정보 없음');
                return;
            }
            
            console.log('✅ 사용자 확인됨, 데이터 로드 시작');
            
            try {
                setLoading(true);
                console.log('📊 웰니스 관리 데이터 로드 시작');
                
                // API 사용 통계 로드
                const usageStatsResponse = await apiGet('/api/v1/admin/wellness/usage-stats', {
                    year: selectedMonth.year,
                    month: selectedMonth.month
                });
                
                console.log('📊 통계 응답:', usageStatsResponse);
                
                if (usageStatsResponse && usageStatsResponse.success) {
                    setStats(usageStatsResponse.data);
                }
                
                // 템플릿 목록 로드
                const templatesResponse = await apiGet('/api/v1/admin/wellness/templates');
                
                console.log('📋 템플릿 응답:', templatesResponse);
                
                if (templatesResponse && templatesResponse.success) {
                    setTemplates(templatesResponse.data);
                }
                
                // 환율 정보 로드
                const exchangeRateResponse = await apiGet('/api/v1/admin/wellness/exchange-rate');
                
                console.log('💰 환율 응답:', exchangeRateResponse);
                
                if (exchangeRateResponse && exchangeRateResponse.success) {
                    setStats(prev => ({
                        ...prev,
                        exchangeRate: exchangeRateResponse.data.exchangeRate || 1300.0,
                        exchangeRateDisplay: exchangeRateResponse.data.exchangeRateDisplay || ''
                    }));
                }
                
                console.log('✅ 웰니스 관리 데이터 로드 완료');
            } catch (error) {
                console.error('❌ 데이터 로드 실패:', error);
                notificationManager.show('데이터를 불러오는데 실패했습니다.', 'error');
            } finally {
                setLoading(false);
            }
        };
        
        loadDataAsync();
    }, [user?.id, selectedMonth.year, selectedMonth.month]);



/**
     * 테스트 발송
     */
    const handleTestSend = async () => {
        setConfirmModal({
            isOpen: true,
            title: '웰니스 알림 테스트 발송',
            message: '웰니스 알림을 테스트 발송하시겠습니까?\n\n모든 내담자에게 즉시 발송됩니다.',
            type: 'warning',
            onConfirm: async () => {
                try {
                    setSending(true);
                    const response = await apiPost('/api/v1/admin/wellness/test-send');
                    
                    if (response.success) {
                        notificationManager.show('웰니스 알림이 성공적으로 발송되었습니다!', 'success');
                        // 페이지 새로고침으로 데이터 다시 로드
                        window.location.reload();
                    } else {
                        notificationManager.show(response.message || '발송에 실패했습니다.', 'error');
                    }
                } catch (error) {
                    console.error('❌ 테스트 발송 실패:', error);
                    notificationManager.show('테스트 발송 중 오류가 발생했습니다.', 'error');
                } finally {
                    setSending(false);
                }
            }
        });
    };

/**
     * 데이터 새로고침
     */
    const handleRefresh = () => {
        window.location.reload();
    };

/**
     * 환율 새로고침
     */
    const handleExchangeRateRefresh = async () => {
        try {
            setRefreshing(true);
            const response = await apiPost('/api/v1/admin/wellness/exchange-rate/refresh');
            
            if (response.success) {
                notificationManager.show('환율을 새로고침했습니다.', 'success');
                // 전체 데이터 다시 로드
                await loadData();
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

    return (
        <AdminCommonLayout title="웰니스 알림 관리">
            <div className="mg-v2-ad-b0kla mg-v2-wellness-management">
                <div className="mg-v2-ad-b0kla__container">
                    <ContentArea ariaLabel="웰니스 알림 관리 본문">
                        <ContentHeader
                            title="웰니스 알림 관리"
                            subtitle="AI 기반 자동 웰니스 컨텐츠 생성 및 발송 관리"
                            titleId="wellness-management-title"
                            actions={(
                                <>
                                    <MGButton
                                        variant="outline"
                                        size="small"
                                        onClick={handleExchangeRateRefresh}
                                        disabled={refreshing}
                                        preventDoubleClick={false}
                                    >
                                        <TrendingUp size={18} className={refreshing ? 'spinning' : ''} />
                                        환율 새로고침
                                    </MGButton>
                                    <MGButton
                                        variant="outline"
                                        size="small"
                                        onClick={handleRefresh}
                                        disabled={refreshing}
                                        preventDoubleClick={false}
                                    >
                                        <RefreshCw size={18} className={refreshing ? 'spinning' : ''} />
                                        새로고침
                                    </MGButton>
                                    <MGButton
                                        variant="primary"
                                        size="small"
                                        onClick={handleTestSend}
                                        disabled={sending}
                                        loading={sending}
                                        loadingText="발송 중..."
                                        preventDoubleClick={true}
                                    >
                                        <Send size={18} />
                                        테스트 발송
                                    </MGButton>
                                </>
                            )}
                        />

                        <main aria-labelledby="wellness-management-title">
                {loading ? (
                    <div className="mg-dashboard-loading" aria-busy="true" aria-live="polite">
                        <UnifiedLoading type="inline" text="데이터를 불러오는 중..." />
                    </div>
                ) : (
                    <>
                {/* 통계 카드 */}
                <div className="mg-v2-stats-grid">
                    <div className="mg-v2-stat-card">
                        <div className="mg-v2-stat-icon">
                            <DollarSign size={24} />
                        </div>
                        <div className="mg-v2-stat-content">
                            <div className="mg-v2-stat-value">{stats.totalCostDisplay || `$${(stats.totalCost || 0).toFixed(4)}`}</div>
                            <div className="mg-v2-stat-label">이번 달 비용</div>
                            <div className="mg-v2-stat-description">
                                {selectedMonth.year}년 {selectedMonth.month}월
                                {stats.exchangeRateDisplay && ` (환율: ${stats.exchangeRateDisplay})`}
                            </div>
                        </div>
                    </div>

                    <div className="mg-v2-stat-card">
                        <div className="mg-v2-stat-icon">
                            <Database size={24} />
                        </div>
                        <div className="mg-v2-stat-content">
                            <div className="mg-v2-stat-value">{(stats.totalTokens || 0).toLocaleString()}</div>
                            <div className="mg-v2-stat-label">사용 토큰</div>
                            <div className="mg-v2-stat-description">총 토큰 사용량</div>
                        </div>
                    </div>

                    <div className="mg-v2-stat-card">
                        <div className="mg-v2-stat-icon">
                            <TrendingUp size={24} />
                        </div>
                        <div className="mg-v2-stat-content">
                            <div className="mg-v2-stat-value">{(stats.totalRequests || 0).toLocaleString()}</div>
                            <div className="mg-v2-stat-label">API 호출</div>
                            <div className="mg-v2-stat-description">이번 달 총 호출 수</div>
                        </div>
                    </div>

                    <div className="mg-v2-stat-card">
                        <div className="mg-v2-stat-icon">
                            <BarChart3 size={24} />
                        </div>
                        <div className="mg-v2-stat-content">
                            <div className="mg-v2-stat-value">{templates.length}</div>
                            <div className="mg-v2-stat-label">템플릿 수</div>
                            <div className="mg-v2-stat-description">활성화된 템플릿</div>
                        </div>
                    </div>
                </div>

                {/* 월 선택 */}
                <div className="mg-v2-section">
                    <div className="mg-v2-card wellness-month-selector">
                        <MGButton
                            variant="primary"
                            size="small"
                            onClick={() => handleMonthChange(-1)}
                            preventDoubleClick={false}
                        >
                            ◀
                        </MGButton>
                        <span className="mg-v2-h2">
                            {selectedMonth.year}년 {selectedMonth.month}월
                        </span>
                        <MGButton
                            variant="primary"
                            size="small"
                            onClick={() => handleMonthChange(1)}
                            disabled={
                                selectedMonth.year === new Date().getFullYear() &&
                                selectedMonth.month === new Date().getMonth() + 1
                            }
                            preventDoubleClick={false}
                        >
                            ▶
                        </MGButton>
                    </div>
                </div>

                {/* 최근 API 사용 로그 */}
                <div className="mg-v2-section">
                    <div className="mg-v2-card">
                        <h2 className="mg-v2-h2">
                            <Clock size={20} /> 최근 API 사용 내역
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
                </div>

                {/* 템플릿 목록 */}
                <div className="mg-v2-section">
                    <div className="mg-v2-card">
                        <h2 className="mg-v2-h2">
                            <Database size={20} /> 웰니스 템플릿 목록
                        </h2>
                    <div className="wellness-templates">
                        {templates.length > 0 ? (
                            templates.map((template) => (
                                <div key={template.id} className="wellness-template-card">
                                    <div className="wellness-template-header">
                                        <h3 className="wellness-template-title"><SafeText>{template.title}</SafeText></h3>
                                        {template.isImportant && (
                                            <span className="wellness-template-badge wellness-template-badge--important">
                                                중요
                                            </span>
                                        )}
                                    </div>
                                    <div className="wellness-template-meta">
                                        <span className="wellness-template-tag">
                                            <SafeText>{getCategoryName(template.category)}</SafeText>
                                        </span>
                                        <span className="wellness-template-tag">
                                            <SafeText>{getDayName(template.dayOfWeek)}</SafeText>
                                        </span>
                                        <span className="wellness-template-tag">
                                            <SafeText>{getSeasonName(template.season)}</SafeText>
                                        </span>
                                    </div>
                                    <div className="wellness-template-stats">
                                        <span className="wellness-template-stat">
                                            사용 {toSafeNumber(template.usageCount)}회
                                        </span>
                                        <span className="wellness-template-stat">
                                            생성자: <SafeText>{template.createdBy}</SafeText>
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
                    </>
                )}
                        </main>
                    </ContentArea>
                </div>
            </div>

            {/* 컨펌 모달 */}
            <ConfirmModal
                isOpen={confirmModal.isOpen}
                onClose={() => setConfirmModal({ isOpen: false, title: '', message: '', type: 'default', onConfirm: null })}
                onConfirm={confirmModal.onConfirm}
                title={toDisplayString(confirmModal.title, '')}
                message={toDisplayString(confirmModal.message, '')}
                type={confirmModal.type}
            />
        </AdminCommonLayout>
    );
};

export default WellnessManagement;

