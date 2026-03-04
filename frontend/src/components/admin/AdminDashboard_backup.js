import React, { useState, useEffect, useCallback, useRef } from 'react';
import notificationManager from '../../utils/notification';
import { useNavigate } from 'react-router-dom';
import { FaUsers, FaUserTie, FaLink, FaCalendarAlt, FaCalendarCheck, FaCog, FaDollarSign, FaChartLine, FaCogs, FaBox, FaShoppingCart, FaCheckCircle, FaWallet, FaTruck, FaSyncAlt, FaExclamationTriangle, FaBuilding, FaMapMarkerAlt, FaUserCog, FaToggleOn, FaCompressAlt, FaChartBar, FaUserGraduate, FaRedo, FaFileExport, FaBell } from 'react-icons/fa';
import { Calendar, CheckCircle, TrendingUp, AlertTriangle, BarChart, Settings, LayoutDashboard, Heart, Trophy, Users, CalendarDays, User, Clock, PieChart, Target, Shield, Activity, Link2, DollarSign, RotateCcw, Receipt, MessageSquare, Sparkles } from 'lucide-react';
import SimpleLayout from '../layout/SimpleLayout';
import UnifiedLoading from '../../components/common/UnifiedLoading'; // 임시 비활성화
import SystemStatus from './system/SystemStatus';
import DashboardSection from '../layout/DashboardSection';
import StatCard from '../ui/Card/StatCard';
import { API_BASE_URL } from '../../constants/api';
import SystemTools from './system/SystemTools';
import PermissionManagement from './PermissionManagement';
import ConsultantRatingStatistics from './ConsultantRatingStatistics';
import SystemNotificationSection from '../dashboard/SystemNotificationSection';
import { useSession } from '../../contexts/SessionContext';
import { COMPONENT_CSS } from '../../constants/css-variables';
import csrfTokenManager from '../../utils/csrfTokenManager';
import { sessionManager } from '../../utils/sessionManager';
import { fetchUserPermissions, PermissionChecks } from '../../utils/permissionUtils';
import '../../styles/main.css';
import '../../styles/unified-design-tokens.css';
import './AdminDashboard.new.css';
import './system/SystemStatus.css';
import './system/SystemTools.css';

const ADMIN_ROUTES = {
    SCHEDULES: '/admin/schedules',
    SESSIONS: '/admin/sessions',
    USERS: '/admin/users',
    USER_MANAGEMENT: '/admin/user-management',
    CONSULTANTS: '/admin/consultants',
    CONSULTANT_COMPREHENSIVE: '/admin/consultant-comprehensive',
    CLIENTS: '/admin/clients',
    CLIENT_COMPREHENSIVE: '/admin/client-comprehensive',
    MAPPINGS: '/admin/mappings',
    MAPPING_MANAGEMENT: '/admin/mapping-management',
    BRANCHES: '/admin/branches',
    BRANCH_CREATE: '/admin/branch-create',
    BRANCH_HIERARCHY: '/admin/branch-hierarchy',
    BRANCH_MANAGERS: '/admin/branch-managers',
    BRANCH_STATUS: '/admin/branch-status',
    BRANCH_CONSULTANTS: '/admin/branch-consultants',
    COMMON_CODES: '/admin/common-codes',
    SYSTEM_NOTIFICATIONS: '/admin/system-notifications',
    SYSTEM_CONFIG: '/admin/system-config',
    MESSAGES: '/admin/messages',
    STATISTICS: '/admin/statistics',
    COMPLIANCE: '/admin/compliance',
    COMPLIANCE_DASHBOARD: '/admin/compliance/dashboard',
    COMPLIANCE_DESTRUCTION: '/admin/compliance/destruction',
    ERP_FINANCIAL: '/admin/erp/financial'
};

const AdminDashboard = ({ user: propUser }) => {
    const navigate = useNavigate();
    const { user: sessionUser, isLoggedIn, isLoading: sessionLoading, hasPermission } = useSession();

    const getAvatarInitial = (name) => {
        if (!name) return '?';
        
        if (/[가-힣]/.test(name)) {
            const parts = name.trim().split(/\s+/);
            if (parts.length > 1) {
                return parts[0].charAt(0) + parts[1].charAt(0);
            } else {
                const chars = name.split('');
                let result = chars[0];
                for (let i = 1; i < chars.length; i++) {
                    if (chars[i] === chars[0]) {
                        result += chars[i];
                    } else {
                        break;
                    }
                }
                return result;
            }
        }
        
        return name.charAt(0).toUpperCase();
    };
    const [userPermissions, setUserPermissions] = useState([]);
    const [stats, setStats] = useState({
        totalConsultants: 0,
        totalClients: 0,
        totalMappings: 0,
        activeMappings: 0,
        consultantRatingStats: {
            totalRatings: 0,
            averageScore: 0,
            topConsultants: []
        },
        vacationStats: {
            summary: {
                totalConsultants: 0,
                totalVacationDays: 0,
                averageVacationDays: 0
            },
            consultantStats: []
        },
        consultationStats: {
            totalCompleted: 0,
            completionRate: 0,
            averageCompletionTime: 0,
            monthlyData: []
        }
    });
    
    const [refundStats, setRefundStats] = useState({
        totalRefundCount: 0,
        totalRefundedSessions: 0,
        totalRefundAmount: 0,
        averageRefundPerCase: 0
    });
    
    const [pendingDepositStats, setPendingDepositStats] = useState({
        count: 0,
        totalAmount: 0,
        oldestHours: 0
    });
    
    const [showErpReport, setShowErpReport] = useState(false);
    const [showPerformanceMetrics, setShowPerformanceMetrics] = useState(false);
    const [showSpecialtyManagement, setShowSpecialtyManagement] = useState(false);
    const [showRecurringExpense, setShowRecurringExpense] = useState(false);
    
    const [todayStats, setTodayStats] = useState({
        totalToday: 0,
        completedToday: 0,
        inProgressToday: 0,
        cancelledToday: 0
    });
    
    const [loading, setLoading] = useState(false);
    const [showToastState, setShowToastState] = useState(false);
    const [toastMessage, setToastMessage] = useState('');
    const [toastType, setToastType] = useState('success');
    const [isPermissionSectionExpanded, setIsPermissionSectionExpanded] = useState(false);
    const [systemStatus, setSystemStatus] = useState({
        server: 'unknown',
        database: 'unknown',
        lastChecked: null
    });
    const [showStatisticsModal, setShowStatisticsModal] = useState(false);
    const isInitialized = useRef(false);

    const loadTodayStats = useCallback(async () => {
        const user = propUser || sessionUser;
        if (!user?.role) return;
        
        try {
            const response = await fetch(`${API_BASE_URL}/api/v1/schedules/today/statistics?userRole=${user.role}`, {
                method: 'GET',
                headers: { 'Content-Type': 'application/json' },
                credentials: 'include'
            });

            if (response.ok) {
                const data = await response.json();
                setTodayStats({
                    totalToday: data.totalToday || 0,
                    completedToday: data.completedToday || 0,
                    inProgressToday: data.inProgressToday || 0,
                    cancelledToday: data.cancelledToday || 0
                });
            }
        } catch (error) {
            console.error('오늘의 통계 로드 실패:', error);
        }
    }, []); // 사용자 객체 의존성 제거

    useEffect(() => {
        if (isInitialized.current) return;
        
        const initializeDashboard = async () => {
            try {
                console.log('🔄 AdminDashboard 초기화 시작...');
                const permissions = await fetchUserPermissions(setUserPermissions);
                console.log('✅ AdminDashboard 초기화 완료:', permissions.length, '개 권한');
                loadTodayStats();
                isInitialized.current = true;
            } catch (error) {
                console.error('❌ AdminDashboard 초기화 실패:', error);
                setUserPermissions([]);
                isInitialized.current = true;
            }
        };

        initializeDashboard();
    }, []); // loadTodayStats 의존성 제거

    const showToast = useCallback((message, type = 'success') => {
        setToastMessage(message);
        setToastType(type);
        setShowToastState(true);
        setTimeout(() => setShowToastState(false), 3000);
    }, []);



    const loadStats = useCallback(async () => {
        setLoading(true);
        try {
            const [consultantsRes, clientsRes, mappingsRes, ratingRes, vacationRes, consultationRes] = await Promise.all([
                fetch('/api/admin/consultants/with-vacation?date=' + new Date().toISOString().split('T')[0]),
                fetch('/api/admin/clients/with-mapping-info'),
                fetch('/api/admin/mappings'),
                fetch('/api/admin/consultant-rating-stats'),
                fetch('/api/admin/vacation-statistics?period=month'),
                fetch('/api/admin/statistics/consultation-completion')
            ]);

            let totalConsultants = 0;
            let totalClients = 0;
            let totalMappings = 0;
            let activeMappings = 0;
            let consultantRatingStats = {
                totalRatings: 0,
                averageScore: 0,
                topConsultants: []
            };
            let vacationStats = {
                summary: {
                    totalConsultants: 0,
                    totalVacationDays: 0,
                    averageVacationDays: 0
                },
                consultantStats: []
            };
            let consultationStats = {
                totalCompleted: 0,
                completionRate: 0,
                averageCompletionTime: 0,
                monthlyData: []
            };

            if (consultantsRes.ok) {
                const consultantsData = await consultantsRes.json();
                totalConsultants = consultantsData.count || 0;
            }

            if (clientsRes.ok) {
                const clientsData = await clientsRes.json();
                totalClients = clientsData.count || 0;
            }

            if (mappingsRes.ok) {
                const mappingsData = await mappingsRes.json();
                totalMappings = mappingsData.count || 0;
                // ⚠️ 표준화 2025-12-05: 하드코딩된 상태값을 공통코드에서 동적 조회하세요. getCommonCodes('STATUS_GROUP') 사용
                activeMappings = (mappingsData.data || []).filter(m => m.status === 'ACTIVE').length;
            }

            if (ratingRes.ok) {
                const ratingData = await ratingRes.json();
                if (ratingData.success && ratingData.data) {
                    consultantRatingStats = {
                        totalRatings: ratingData.data.totalRatings || 0,
                        averageScore: ratingData.data.averageScore || 0,
                        topConsultants: ratingData.data.topConsultants || []
                    };
                }
            }

            if (vacationRes.ok) {
                const vacationData = await vacationRes.json();
                if (vacationData.success) {
                    vacationStats = {
                        summary: vacationData.summary || {
                            totalConsultants: 0,
                            totalVacationDays: 0,
                            averageVacationDays: 0
                        },
                        consultantStats: vacationData.consultantStats || []
                    };
                }
            }

            if (consultationRes.ok) {
                const consultationData = await consultationRes.json();
                if (consultationData.success) {
                    consultationStats = {
                        totalCompleted: consultationData.data?.totalCompleted || 0,
                        completionRate: consultationData.data?.completionRate || 0,
                        averageCompletionTime: consultationData.data?.averageCompletionTime || 0,
                        monthlyData: consultationData.data?.monthlyData || []
                    };
                }
            }

            setStats({
                totalConsultants,
                totalClients,
                totalMappings,
                activeMappings,
                consultantRatingStats,
                vacationStats,
                consultationStats
            });
        } catch (error) {
            console.error('통계 데이터 로드 실패:', error);
            showToast('통계 데이터 로드에 실패했습니다.', 'danger');
        } finally {
            setLoading(false);
        }
    }, [showToast]);

    const loadRefundStats = useCallback(async () => {
        try {
            const response = await fetch('/api/admin/refund-statistics?period=month');
            if (response.ok) {
                const data = await response.json();
                if (data.success && data.data.summary) {
                    setRefundStats({
                        totalRefundCount: data.data.summary.totalRefundCount || 0,
                        totalRefundedSessions: data.data.summary.totalRefundedSessions || 0,
                        totalRefundAmount: data.data.summary.totalRefundAmount || 0,
                        averageRefundPerCase: data.data.summary.averageRefundPerCase || 0
                    });
                }
            }
        } catch (error) {
            console.error('환불 통계 로드 실패:', error);
        }
    }, []);

    const loadPendingDepositStats = useCallback(async () => {
        try {
            console.log('🔍 입금 확인 대기 통계 로드 시작...');
            const response = await fetch('/api/admin/mappings/pending-deposit');
            console.log('🔍 API 응답 상태:', response.status);
            
            if (response.ok) {
                const data = await response.json();
                console.log('🔍 API 응답 데이터:', data);
                
                if (data.success && data.data) {
                    const count = data.data.length;
                    const totalAmount = data.data.reduce((sum, mapping) => sum + (mapping.packagePrice || 0), 0);
                    const oldestHours = Math.max(...data.data.map(mapping => mapping.hoursElapsed || 0), 0);
                    
                    console.log('🔍 계산된 통계:', { count, totalAmount, oldestHours });
                    
                    setPendingDepositStats({
                        count,
                        totalAmount,
                        oldestHours
                    });
                } else {
                    console.log('🔍 데이터가 없거나 실패:', data);
                    setPendingDepositStats({
                        count: 0,
                        totalAmount: 0,
                        oldestHours: 0
                    });
                }
            } else {
                console.error('🔍 API 호출 실패:', response.status, response.statusText);
                setPendingDepositStats({
                    count: 0,
                    totalAmount: 0,
                    oldestHours: 0
                });
            }
        } catch (error) {
            console.error('입금 확인 대기 통계 로드 실패:', error);
            setPendingDepositStats({
                count: 0,
                totalAmount: 0,
                oldestHours: 0
            });
        }
    }, []);

    const handleAutoCompleteSchedules = async () => {
        try {
            const response = await csrfTokenManager.post('/api/admin/schedules/auto-complete');

            if (response.ok) {
                const result = await response.json();
                showToast(result.message || '스케줄 자동 완료 처리가 완료되었습니다.');
                loadStats(); // 통계 새로고침
            } else {
                const error = await response.json();
                showToast(error.message || '스케줄 자동 완료 처리에 실패했습니다.', 'danger');
            }
        } catch (error) {
            console.error('스케줄 자동 완료 처리 실패:', error);
            showToast('스케줄 자동 완료 처리에 실패했습니다.', 'danger');
        }
    };

    const handleAutoCompleteWithReminder = async () => {
        try {
            const response = await csrfTokenManager.post('/api/admin/schedules/auto-complete-with-reminder');

            if (response.ok) {
                const result = await response.json();
                showToast(result.message || '스케줄 자동 완료 처리 및 알림이 완료되었습니다.');
                loadStats(); // 통계 새로고침
            } else {
                const error = await response.json();
                showToast(error.message || '스케줄 자동 완료 처리 및 알림에 실패했습니다.', 'danger');
            }
        } catch (error) {
            console.error('스케줄 자동 완료 처리 및 알림 실패:', error);
            showToast('스케줄 자동 완료 처리 및 알림에 실패했습니다.', 'danger');
        }
    };

    const handleMergeDuplicateMappings = async () => {
        try {
            const checkResponse = await fetch('/api/admin/duplicate-mappings');
            if (!checkResponse.ok) {
                showToast('중복 매칭 조회에 실패했습니다.', 'danger');
                return;
            }
            
            const checkResult = await checkResponse.json();
            if (checkResult.count === 0) {
                showToast('중복된 매칭이 없습니다.');
                return;
            }
            
            const confirmMessage = `중복된 매칭이 ${checkResult.count}개 발견되었습니다. 통합하시겠습니까?`;
            const confirmed = await new Promise((resolve) => {
      notificationManager.confirm(confirmMessage, resolve);
    });
    if (!confirmed) {
        return;
    }
            
            const response = await csrfTokenManager.post('/api/admin/merge-duplicate-mappings');

            if (response.ok) {
                const result = await response.json();
                showToast(result.message || '중복 매칭 통합이 완료되었습니다.');
                loadStats(); // 통계 새로고침
                loadRefundStats(); // 환불 통계 새로고침
            } else {
                const error = await response.json();
                showToast(error.message || '중복 매칭 통합에 실패했습니다.', 'danger');
            }
        } catch (error) {
            console.error('중복 매칭 통합 실패:', error);
            showToast('중복 매칭 통합에 실패했습니다.', 'danger');
        }
    };

    useEffect(() => {
        loadStats();
        loadRefundStats();
        loadPendingDepositStats();
    }, [loadStats, loadRefundStats, loadPendingDepositStats]);

    const createTestData = async () => {
        try {
            const response = await csrfTokenManager.post('/api/test/create-test-data');

            if (response.ok) {
                showToast('테스트 데이터가 성공적으로 생성되었습니다.');
                loadStats();
            } else {
                const error = await response.json();
                showToast(error.message || '테스트 데이터 생성에 실패했습니다.', 'danger');
            }
        } catch (error) {
            console.error('테스트 데이터 생성 실패:', error);
            showToast('테스트 데이터 생성에 실패했습니다.', 'danger');
        }
    };

    const checkSystemStatus = async () => {
        setLoading(true);
        try {
            const [serverRes, dbRes] = await Promise.all([
                fetch('/api/health/server'),
                fetch('/api/health/database')
            ]);

            const serverStatus = serverRes.ok ? 'healthy' : 'error';
            const dbStatus = dbRes.ok ? 'healthy' : 'error';

            setSystemStatus({
                server: serverStatus,
                database: dbStatus,
                lastChecked: new Date().toLocaleTimeString('ko-KR')
            });

            if (serverStatus === 'healthy' && dbStatus === 'healthy') {
                showToast('시스템 상태가 정상입니다.', 'success');
            } else {
                showToast('시스템 상태에 문제가 있습니다.', 'warning');
            }
        } catch (error) {
            console.error('시스템 상태 체크 실패:', error);
            setSystemStatus({
                server: 'error',
                database: 'error',
                lastChecked: new Date().toLocaleTimeString('ko-KR')
            });
            showToast('시스템 상태 체크에 실패했습니다.', 'danger');
        } finally {
            setLoading(false);
        }
    };

    const viewLogs = async () => {
        try {
            const response = await fetch('/api/admin/logs/recent');
            if (response.ok) {
                const logs = await response.json();
                const logWindow = window.open('', '_blank');
                logWindow.document.write(`
                    <html>
                        <head><title>시스템 로그</title></head>
                        <body>
                            <h2>최근 시스템 로그</h2>
                            <pre style="white-space: pre-wrap; font-family: monospace;">${JSON.stringify(logs, null, 2)}</pre>
                        </body>
                    </html>
                `);
                showToast('로그를 새 창에서 열었습니다.', 'info');
            } else {
                showToast('로그 조회에 실패했습니다.', 'danger');
            }
        } catch (error) {
            console.error('로그 조회 실패:', error);
            showToast('로그 조회에 실패했습니다.', 'danger');
        }
    };

    const clearCache = async () => {
        try {
            const response = await csrfTokenManager.post('/api/admin/cache/clear');

            if (response.ok) {
                showToast('캐시가 성공적으로 초기화되었습니다.', 'success');
                loadStats();
            } else {
                showToast('캐시 초기화에 실패했습니다.', 'danger');
            }
        } catch (error) {
            console.error('캐시 초기화 실패:', error);
            showToast('캐시 초기화에 실패했습니다.', 'danger');
        }
    };

    const createBackup = async () => {
        try {
            const response = await csrfTokenManager.post('/api/admin/backup/create');

            if (response.ok) {
                const backupData = await response.json();
                showToast(`백업이 생성되었습니다: ${backupData.filename}`, 'success');
            } else {
                showToast('백업 생성에 실패했습니다.', 'danger');
            }
        } catch (error) {
            console.error('백업 생성 실패:', error);
            showToast('백업 생성에 실패했습니다.', 'danger');
        }
    };

    if (sessionLoading) {
        return (
            <div className="admin-dashboard">
                <div className="admin-dashboard-content">
                    <div className="mg-loading">로딩중...</div>
                </div>
            </div>
        );
    }

    return (
        <SimpleLayout>
        <div className="mg-dashboard-layout">
            {/* Dashboard Header */}
            <div className="mg-dashboard-header">
                <div className="mg-dashboard-header-content">
                    <div className="mg-dashboard-header-left">
                        <LayoutDashboard />
                        <div>
                            <h1 className="mg-dashboard-title">관리자 대시보드</h1>
                            <p className="mg-dashboard-subtitle">시스템 전체 현황을 관리합니다</p>
                        </div>
                    </div>
                    <div className="mg-dashboard-header-right">
                        <button className="mg-dashboard-icon-btn" onClick={() => setShowStatisticsModal(true)}>
                            <BarChart />
                        </button>
                    </div>
                </div>
            </div>

            {/* Dashboard Stats Grid */}
            <div className="mg-dashboard-stats">
                <StatCard
                    icon={<Users />}
                    value={stats.totalConsultants + stats.totalClients}
                    label="총 사용자"
                    change="+12.5%"
                    changeType="positive"
                />
                <StatCard
                    icon={<Calendar />}
                    value={todayStats.totalToday}
                    label="예약된 상담"
                    change="+8.2%"
                    changeType="positive"
                />
                <StatCard
                    icon={<CheckCircle />}
                    value={todayStats.completedToday}
                    label="완료된 상담"
                    change="+15.3%"
                    changeType="positive"
                />
            </div>

            {/* 상세 통계 섹션들 */}
                {/* 시스템 개요 */}
            <DashboardSection
                title="시스템 개요"
                subtitle="전체 시스템 현황 요약"
                icon={<Activity />}
            >
                <div className="mg-stats-grid">
                    <StatCard
                        icon={<User />}
                        value={stats.totalConsultants}
                        label="상담사"
                    />
                    <StatCard
                        icon={<Users />}
                        value={stats.totalClients}
                        label="내담자"
                    />
                    <StatCard
                        icon={<Link2 />}
                        value={stats.totalMappings}
                        label="매칭"
                    />
                    <StatCard
                        icon={<CheckCircle />}
                        value={stats.activeMappings}
                        label="활성 매칭"
                    />
                </div>
            </DashboardSection>

                {/* 입금 확인 대기 알림 - 매칭 관리 권한이 있는 사용자만 표시 */}
                {(() => {
                    const canViewPendingDeposits = PermissionChecks.canViewMappings(userPermissions);
                    console.log('🔍 입금 확인 대기 알림 권한 체크:', {
                        userPermissions,
                        canViewPendingDeposits,
                        pendingDepositStats
                    });
                    return canViewPendingDeposits;
                })() && pendingDepositStats.count > 0 && (
                    <DashboardSection
                        title="입금 확인 대기 알림"
                        subtitle="결제 확인 완료, 입금 대기 중인 매칭"
                        icon={<AlertTriangle />}
                    >
                        <div className="mg-stats-grid">
                            <StatCard
                                icon={<AlertTriangle />}
                                value={`${pendingDepositStats.count}건`}
                                label="입금 확인 대기"
                            />
                            <StatCard
                                icon={<DollarSign />}
                                value={`${pendingDepositStats.totalAmount.toLocaleString()}원`}
                                label="대기 중인 금액"
                            />
                            <StatCard
                                icon={<Clock />}
                                value={`${pendingDepositStats.oldestHours}시간`}
                                label="최장 대기 시간"
                            />
                            <StatCard
                                icon={<Settings />}
                                value="처리하기"
                                label="입금 확인 처리"
                                onClick={() => navigate(ADMIN_ROUTES.MAPPING_MANAGEMENT)}
                            />
                        </div>
                    </DashboardSection>
                )}

                {/* 휴가 통계 섹션 */}
                <DashboardSection
                    title="휴가 현황"
                    subtitle="상담사별 휴가 사용 현황 및 통계"
                    icon={<CalendarDays />}
                >
                    <div className="mg-stats-grid">
                        <StatCard
                            icon={<User />}
                            value={`${stats.vacationStats?.summary?.totalConsultants || 0}명`}
                            label="전체 상담사"
                        />
                        <StatCard
                            icon={<CalendarDays />}
                            value={`${(stats.vacationStats?.summary?.totalVacationDays || 0).toFixed(1)}일`}
                            label="총 휴가일수"
                        />
                        <StatCard
                            icon={<BarChart />}
                            value={`${(stats.vacationStats?.summary?.averageVacationDays || 0).toFixed(1)}일`}
                            label="평균 휴가일수"
                        />
                    </div>
                    
                    {/* 상담사별 휴가 현황 테이블 */}
                    {stats.vacationStats?.consultantStats && stats.vacationStats.consultantStats.length > 0 && (
                        <div className="mg-v2-table-container">
                            <table className="mg-v2-table">
                                <thead>
                                    <tr>
                                        <th>상담사</th>
                                        <th>이메일</th>
                                        <th>휴가일수</th>
                                        <th>최근 휴가</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {stats.vacationStats.consultantStats.slice(0, 10).map((consultant) => (
                                        <tr key={consultant.consultantId}>
                                            <td data-label="상담사">
                                                <div className="mg-flex mg-v2-items-center mg-gap-2">
                                                    <div className="mg-avatar mg-avatar-sm mg-avatar-primary">
                                                        {getAvatarInitial(consultant.consultantName)}
                                                    </div>
                                                    {consultant.consultantName}
                                                </div>
                                            </td>
                                            <td data-label="이메일">{consultant.consultantEmail}</td>
                                            <td data-label="휴가일수">
                                                <span className="mg-v2-badge mg-v2-badge-primary">
                                                    {(consultant.vacationDays || 0).toFixed(1)}일
                                                </span>
                                            </td>
                                            <td data-label="최근 휴가">
                                                <div className="mg-flex mg-v2-items-center mg-gap-1">
                                                    <Clock />
                                                    {consultant.lastVacationDate ? 
                                                        new Date(consultant.lastVacationDate).toLocaleDateString('ko-KR') : 
                                                        '-'
                                                    }
                                                </div>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    )}
                </DashboardSection>

                {/* 상담사 평가 통계 섹션 */}
                <DashboardSection
                    title="상담사 평가 통계"
                    subtitle="전체 상담사 평가 현황 및 만족도 지표"
                    icon={<Heart />}
                >
                    <div className="mg-stats-grid">
                        <StatCard
                            icon={<Heart />}
                            value={`${stats.consultantRatingStats?.totalRatings || 0}개`}
                            label="총 평가 수"
                        />
                        <StatCard
                            icon={<Trophy />}
                            value={(stats.consultantRatingStats?.averageScore || 0).toFixed(1)}
                            label="전체 평균 점수"
                        />
                        <StatCard
                            icon={<Users />}
                            value={`${stats.consultantRatingStats?.topConsultants?.length || 0}명`}
                            label="평가받은 상담사"
                        />
                    </div>
                    
                    {/* 상세 상담사 평가 통계 */}
                    <ConsultantRatingStatistics />
                </DashboardSection>

                {/* 환불 통계 섹션 */}
                <DashboardSection
                    title="환불 현황"
                    subtitle="최근 1개월 환불 통계"
                    icon={<RotateCcw />}
                >
                    <div className="mg-stats-grid">
                        <StatCard
                            icon={<Receipt />}
                            value={`${refundStats.totalRefundCount}건`}
                            label="환불 건수"
                        />
                        <StatCard
                            icon={<Calendar />}
                            value={`${refundStats.totalRefundedSessions}회`}
                            label="환불 회기"
                        />
                        <StatCard
                            icon={<DollarSign />}
                            value={`${refundStats.totalRefundAmount.toLocaleString()}원`}
                            label="환불 금액"
                        />
                        <StatCard
                            icon={<TrendingUp />}
                            value={`${refundStats.averageRefundPerCase.toLocaleString()}원`}
                            label="평균 환불액"
                        />
                    </div>
                </DashboardSection>

            {/* 상담 완료 건수 통계 (어드민/수퍼어드민/지점수퍼어드민) */}
            {((propUser || sessionUser)?.role === 'ADMIN' || (propUser || sessionUser)?.role === 'BRANCH_SUPER_ADMIN' || (propUser || sessionUser)?.role === 'BRANCH_BRANCH_SUPER_ADMIN') && (
                    <DashboardSection
                        title="상담 완료 통계"
                        subtitle="월별 상담 완료 현황 및 성과 지표"
                        icon={<Target />}
                    >
                        <div className="mg-stats-grid">
                            <StatCard
                                icon={<CheckCircle />}
                                value={`${stats.consultationStats?.totalCompleted || 0}건`}
                                label="총 완료 상담"
                            />
                            <StatCard
                                icon={<TrendingUp />}
                                value={`${stats.consultationStats?.completionRate || 0}%`}
                                label="완료율"
                            />
                            <StatCard
                                icon={<PieChart />}
                                value={`${stats.consultationStats?.averageCompletionTime || 0}분`}
                                label="평균 완료 시간"
                            />
                        </div>
                        
                        {/* 월별 상담 완료 차트 */}
                        {stats.consultationStats?.monthlyData && stats.consultationStats.monthlyData.length > 0 && (
                            <div className="mg-chart-container">
                                <h4 className="mg-chart-title">월별 상담 완료 현황</h4>
                                <div className="mg-chart-grid">
                                    {stats.consultationStats.monthlyData.slice(0, 6).map((data, index) => {
                                        const maxCount = Math.max(...stats.consultationStats.monthlyData.map(d => d.completedCount));
                                        const heightPercent = Math.max(20, (data.completedCount / maxCount) * 100);
                                        return (
                                            <div key={data.period} className="mg-chart-bar">
                                                <div 
                                                    className="mg-chart-bar-fill" 
                                                    data-chart-height={heightPercent}
                                                >
                                                    <span className="mg-chart-value">{data.completedCount}</span>
                                                </div>
                                                <div className="mg-chart-label">{data.period}</div>
                                            </div>
                                        );
                                    })}
                                </div>
                            </div>
                        )}
                    </DashboardSection>
            )}

            {/* 관리 기능 */}
            <DashboardSection
                title="관리 기능"
                subtitle="시스템 관리 및 설정 기능"
                icon={<Settings />}
            >
                <div className="mg-management-grid">
                    <div className="mg-management-card" onClick={() => navigate(ADMIN_ROUTES.SCHEDULES)}>
                        <div className="mg-management-icon">
                            <FaCalendarAlt />
                        </div>
                        <h3>스케줄 관리</h3>
                        <p className="mg-management-description">상담 일정을 관리하고 조정합니다</p>
                    </div>
                    
                    <div className="mg-management-card" onClick={() => navigate(ADMIN_ROUTES.SESSIONS)}>
                        <div className="mg-management-icon">
                            <FaCalendarCheck />
                        </div>
                        <h3>회기 관리</h3>
                        <p className="mg-management-description">상담 회기를 등록하고 관리합니다</p>
                    </div>
                    
                    <div className="mg-management-card" onClick={handleAutoCompleteSchedules}>
                        <div className="mg-management-icon">
                            <FaSyncAlt />
                        </div>
                        <h3>스케줄 자동 완료</h3>
                        <p className="mg-management-description">지난 스케줄을 자동으로 완료 처리합니다</p>
                    </div>
                    
                    <div className="mg-management-card" onClick={handleAutoCompleteWithReminder}>
                        <div className="mg-management-icon">
                            <FaExclamationTriangle />
                        </div>
                        <h3>스케줄 완료 + 알림</h3>
                        <p className="mg-management-description">지난 스케줄 완료 처리 및 상담일지 미작성 알림</p>
                    </div>
                    
                    
                    <div className="mg-management-card" onClick={() => navigate(ADMIN_ROUTES.CONSULTANT_COMPREHENSIVE)}>
                        <div className="mg-management-icon">
                            <FaUserTie />
                        </div>
                        <h3>상담사 관리</h3>
                        <p className="mg-management-description">상담사 정보를 관리합니다</p>
                    </div>
                    
                    {PermissionChecks.canManageClients(userPermissions) && (
                        <div className="mg-management-card" onClick={() => navigate(ADMIN_ROUTES.CLIENT_COMPREHENSIVE)}>
                            <div className="mg-management-icon">
                                <FaUsers />
                            </div>
                            <h3>내담자 관리</h3>
                            <p className="mg-management-description">내담자 정보를 관리합니다</p>
                        </div>
                    )}
                    
                    {PermissionChecks.canManageUsers(userPermissions) && (
                        <div className="mg-management-card" onClick={() => navigate(ADMIN_ROUTES.USER_MANAGEMENT)}>
                            <div className="mg-management-icon">
                                <FaUserCog />
                            </div>
                            <h3>사용자 관리</h3>
                            <p className="mg-management-description">사용자 역할 변경 및 권한 관리</p>
                        </div>
                    )}
                    
                    {PermissionChecks.canViewMappings(userPermissions) && (
                        <div className="mg-management-card" onClick={() => navigate(ADMIN_ROUTES.MAPPING_MANAGEMENT)}>
                            <div className="mg-management-icon">
                                <FaLink />
                            </div>
                            <h3>매칭 관리</h3>
                            <p className="mg-management-description">상담사와 내담자 매칭을 관리합니다</p>
                        </div>
                    )}
                    
                    <div className="mg-management-card" onClick={() => navigate(ADMIN_ROUTES.COMMON_CODES)}>
                        <div className="mg-management-icon">
                            <FaCog />
                        </div>
                    </div>
                    
                    <div className="mg-management-card" onClick={() => navigate(ADMIN_ROUTES.SYSTEM_NOTIFICATIONS)}>
                        <div className="mg-management-icon">
                            <FaBell />
                        </div>
                        <h3>시스템 공지 관리</h3>
                        <p className="mg-management-description">전체/상담사/내담자 공지를 관리합니다</p>
                    </div>
                    
                    <div className="mg-management-card" onClick={() => navigate(ADMIN_ROUTES.SYSTEM_CONFIG)}>
                        <div className="mg-management-icon">
                            <Settings />
                        </div>
                        <h3>시스템 설정</h3>
                        <p className="mg-management-description">OpenAI API 키 및 시스템 설정을 관리합니다</p>
                    </div>
                    
                    <div className="mg-management-card" onClick={() => navigate(ADMIN_ROUTES.MESSAGES)}>
                        <div className="mg-management-icon">
                            <MessageSquare />
                        </div>
                        <h3>메시지 관리</h3>
                        <p className="mg-management-description">상담사-내담자 메시지를 관리합니다</p>
                    </div>
                    
                    <div className="mg-management-card" onClick={() => navigate('/admin/wellness')}>
                        <div className="mg-management-icon">
                            <Sparkles />
                        </div>
                        <h3>웰니스 알림 관리</h3>
                        <p className="mg-management-description">AI 기반 웰니스 컨텐츠 생성 및 비용 관리</p>
                    </div>
                    
                    <div className="mg-management-card" onClick={handleMergeDuplicateMappings}>
                        <div className="mg-management-icon">
                            <FaCompressAlt />
                        </div>
                        <h3>중복 매칭 통합</h3>
                        <p className="mg-management-description">중복된 상담사-내담자 매칭을 통합합니다</p>
                    </div>
                </div>
            </DashboardSection>

            {/* 시스템 상태 */}
            <DashboardSection
                title="시스템 상태"
                subtitle="서버 및 데이터베이스 상태 모니터링"
                icon={<Settings />}
            >
                <SystemStatus 
                    systemStatus={systemStatus}
                    onStatusCheck={checkSystemStatus}
                    loading={loading}
                />
            </DashboardSection>

            {/* 시스템 도구 */}
            <DashboardSection
                title="시스템 도구"
                subtitle="시스템 관리 및 유지보수 도구"
                icon={<Settings />}
            >
                <SystemTools 
                    onRefresh={loadStats}
                    onViewLogs={viewLogs}
                    onClearCache={clearCache}
                    onCreateBackup={createBackup}
                    loading={loading}
                />
            </DashboardSection>

            {/* 컴플라이언스 관리 (관리자 전용) */}
            {((propUser || sessionUser)?.role === 'ADMIN' || (propUser || sessionUser)?.role === 'BRANCH_SUPER_ADMIN' || (propUser || sessionUser)?.role === 'BRANCH_BRANCH_SUPER_ADMIN') && (
                <DashboardSection
                    title="컴플라이언스 관리"
                    subtitle="규정 준수 및 보안 관리"
                    icon={<Shield />}
                >
                    <div className="mg-management-grid">
                        <div className="mg-management-card" onClick={() => navigate(ADMIN_ROUTES.COMPLIANCE)}>
                            <div className="mg-management-icon">
                                <i className="bi bi-shield-check"></i>
                            </div>
                            <h3>컴플라이언스 대시보드</h3>
                            <p className="mg-management-description">개인정보보호법 준수 현황을 모니터링합니다</p>
                        </div>
                        
                        <div className="mg-management-card" onClick={() => navigate(ADMIN_ROUTES.COMPLIANCE_DASHBOARD)}>
                            <div className="mg-management-icon">
                                <i className="bi bi-graph-up"></i>
                            </div>
                            <h3>개인정보 처리 현황</h3>
                            <p className="mg-management-description">개인정보 처리 현황 및 통계를 관리합니다</p>
                        </div>
                        
                        <div className="mg-management-card" onClick={() => navigate(ADMIN_ROUTES.COMPLIANCE_DESTRUCTION)}>
                            <div className="mg-management-icon">
                                <i className="bi bi-trash"></i>
                            </div>
                            <h3>개인정보 파기 관리</h3>
                            <p className="mg-management-description">자동화된 개인정보 파기 시스템을 관리합니다</p>
                        </div>
                    </div>
                </DashboardSection>
            )}

            {/* ERP 관리 */}
            {PermissionChecks.canAccessERP(userPermissions) && (
                <DashboardSection
                    title="ERP 관리"
                    subtitle="기업 자원 계획 시스템 관리"
                    icon={<Settings />}
                >
                    <div className="mg-management-grid">
                        <div className="mg-management-card" onClick={() => navigate('/erp/dashboard')}>
                            <div className="mg-management-icon">
                                <FaChartLine />
                            </div>
                            <h3>ERP 대시보드</h3>
                            <p className="mg-management-description">전체 ERP 현황을 한눈에 확인합니다</p>
                        </div>
                        
                        <div className="mg-management-card" onClick={() => navigate('/erp/purchase-requests')}>
                            <div className="mg-management-icon">
                                <FaShoppingCart />
                            </div>
                            <h3>구매 요청</h3>
                            <p className="mg-management-description">상담사 구매 요청을 관리합니다</p>
                        </div>
                        
                        <div className="mg-management-card" onClick={() => navigate('/erp/approvals')}>
                            <div className="mg-management-icon">
                                <FaCheckCircle />
                            </div>
                            <h3>관리자 승인</h3>
                            <p className="mg-management-description">구매 요청을 검토하고 승인합니다</p>
                        </div>
                        
                        <div className="mg-management-card" onClick={() => navigate('/erp/super-approvals')}>
                            <div className="mg-management-icon">
                                <FaCheckCircle />
                            </div>
                            <h3>수퍼 관리자 승인</h3>
                            <p className="mg-management-description">최종 승인을 처리합니다</p>
                        </div>
                        
                        <div className="mg-management-card" onClick={() => navigate('/erp/items')}>
                            <div className="mg-management-icon">
                                <FaBox />
                            </div>
                            <h3>아이템 관리</h3>
                            <p className="mg-management-description">구매 가능한 아이템을 관리합니다</p>
                        </div>
                        
                        {/* 새로 추가된 ERP 보고서 카드 */}
                        <div className="mg-management-card" onClick={() => setShowErpReport(true)}>
                            <div className="mg-management-icon">
                                <FaFileExport />
                            </div>
                            <h3>ERP 보고서</h3>
                            <p className="mg-management-description">월별/분기별/연별 재무 보고서를 생성합니다</p>
                        </div>
                        
                        <div className="mg-management-card" onClick={() => navigate('/erp/budgets')}>
                            <div className="mg-management-icon">
                                <FaWallet />
                            </div>
                            <h3>예산 관리</h3>
                            <p className="mg-management-description">부서별 예산을 관리합니다</p>
                        </div>
                        
                        <div className="mg-management-card" onClick={() => navigate('/erp/orders')}>
                            <div className="mg-management-icon">
                                <FaTruck />
                            </div>
                            <h3>주문 관리</h3>
                            <p className="mg-management-description">발주 및 배송을 관리합니다</p>
                        </div>
                        
                        {PermissionChecks.canViewIntegratedFinance(userPermissions) && (
                            <div className="mg-management-card" onClick={() => navigate(ADMIN_ROUTES.ERP_FINANCIAL)}>
                                <div className="mg-management-icon">
                                    <FaDollarSign />
                                </div>
                                <h3>통합 재무 관리</h3>
                                <p className="mg-management-description">수입/지출 통합 관리 및 대차대조표</p>
                            </div>
                        )}
                    </div>
                </DashboardSection>
            )}

            {/* 지점 관리 */}
            <DashboardSection
                    title="지점 관리"
                    subtitle="지점 정보 및 설정 관리"
                    icon={<Settings />}
                >
                    <div className="mg-management-grid">
                        <div className="mg-management-card" onClick={() => navigate(ADMIN_ROUTES.BRANCHES)}>
                            <div className="mg-management-icon">
                                <FaBuilding />
                            </div>
                            <h3>지점 관리</h3>
                            <p className="mg-management-description">지점 등록, 수정, 통계를 통합 관리합니다</p>
                        </div>
                        
                        <div className="mg-management-card" onClick={() => navigate(ADMIN_ROUTES.BRANCH_CREATE)}>
                            <div className="mg-management-icon">
                                <FaMapMarkerAlt />
                            </div>
                            <h3>지점 생성</h3>
                            <p className="mg-management-description">새로운 지점을 등록합니다</p>
                        </div>
                        
                        <div className="mg-management-card" onClick={() => navigate(ADMIN_ROUTES.BRANCH_HIERARCHY)}>
                            <div className="mg-management-icon">
                                <FaCogs />
                            </div>
                            <h3>지점 계층 구조</h3>
                            <p className="mg-management-description">지점 간 계층 관계를 관리합니다</p>
                        </div>
                        
                        <div className="mg-management-card" onClick={() => navigate(ADMIN_ROUTES.BRANCH_MANAGERS)}>
                            <div className="mg-management-icon">
                                <FaUserCog />
                            </div>
                            <h3>지점장 관리</h3>
                            <p className="mg-management-description">지점장을 지정하고 관리합니다</p>
                        </div>
                        
                        <div className="mg-management-card" onClick={() => navigate(ADMIN_ROUTES.BRANCH_STATUS)}>
                            <div className="mg-management-icon">
                                <FaToggleOn />
                            </div>
                            <h3>지점 상태 관리</h3>
                            <p className="mg-management-description">지점 활성화/비활성화를 관리합니다</p>
                        </div>
                        
                        <div className="mg-management-card" onClick={() => navigate(ADMIN_ROUTES.BRANCH_CONSULTANTS)}>
                            <div className="mg-management-icon">
                                <FaUserTie />
                            </div>
                            <h3>지점 상담사 관리</h3>
                            <p className="mg-management-description">지점별 상담사를 할당하고 관리합니다</p>
                        </div>
                    </div>
                </DashboardSection>

            {/* 통계 및 분석 */}
            {PermissionChecks.canViewStatistics(userPermissions) && (
                <DashboardSection
                    title="통계 및 분석"
                    subtitle="시스템 통계 및 성과 분석"
                    icon={<BarChart />}
                >
                    <div className="mg-management-grid">
                        <div className="mg-management-card" onClick={() => setShowPerformanceMetrics(true)}>
                            <div className="mg-management-icon">
                                <FaChartBar />
                            </div>
                            <h3>성과 지표 대시보드</h3>
                            <p className="mg-management-description">실시간 성과 지표를 확인하고 재계산합니다</p>
                        </div>
                    </div>
            </DashboardSection>
            )}

            {/* 상담사 관리 */}
            {PermissionChecks.canManageConsultants(userPermissions) && (
                <DashboardSection
                    title="상담사 관리"
                    subtitle="상담사 정보 및 관리 기능"
                    icon={<Users />}
                >
                    <div className="mg-management-grid">
                        <div className="mg-management-card" onClick={() => setShowSpecialtyManagement(true)}>
                            <div className="mg-management-icon">
                                <FaUserGraduate />
                            </div>
                            <h3>전문분야 관리</h3>
                            <p className="mg-management-description">상담사별 전문분야를 설정하고 관리합니다</p>
                        </div>
                    </div>
            </DashboardSection>
            )}

            {/* 재무 관리 */}
            {PermissionChecks.canAccessFinance(userPermissions) && (
                <DashboardSection
                    title="재무 관리"
                    subtitle="수입, 지출 및 재무 분석"
                    icon={<DollarSign />}
                >
                    <div className="mg-management-grid">
                        <div className="mg-management-card" onClick={() => {
                            console.log('🔄 반복 지출 모달 열기 버튼 클릭');
                            setShowRecurringExpense(true);
                        }}>
                            <div className="mg-management-icon">
                                <FaRedo />
                            </div>
                            <h3>반복 지출 관리</h3>
                            <p className="mg-management-description">정기적인 지출을 설정하고 관리합니다</p>
                        </div>
                    </div>
                </DashboardSection>
            )}

            {/* 토스트 알림 */}
            {showToastState && (
                <div className={`mg-toast mg-toast-${toastType}`}>
                    <div className="mg-toast-header">
                        <strong className="me-auto">알림</strong>
                        <button type="button" className="mg-toast-close" onClick={() => setShowToastState(false)}></button>
                    </div>
                    <div className="mg-toast-body">{toastMessage}</div>
                </div>
            )}

            {/* 권한 관리 - 지점 수퍼 어드민 이상만 접근 가능 */}
            {(() => {
                const currentRole = (propUser || sessionUser)?.role;
                const canManagePermissions = currentRole === 'BRANCH_SUPER_ADMIN' || 
                                           currentRole === 'HQ_ADMIN' || 
                                           currentRole === 'SUPER_HQ_ADMIN' || 
                                           currentRole === 'HQ_MASTER';
                console.log('🔍 권한 관리 섹션 렌더링 체크:', {
                    currentRole,
                    canManagePermissions,
                    userPermissions
                });
                return canManagePermissions;
            })() && (
                <div className="mg-mb-lg">
                    <div 
                        onClick={() => setIsPermissionSectionExpanded(!isPermissionSectionExpanded)}
                        className={`mg-v2-card mg-flex mg-align-center mg-justify-between mg-cursor-pointer ${isPermissionSectionExpanded ? 'mg-mb-0' : 'mg-mb-md'}`}
                    >
                        <div className="mg-flex mg-align-center mg-gap-sm">
                            <Shield />
                            <div>
                                <h3 className="mg-h4 mg-mb-0">
                                    권한 관리
                                </h3>
                                <p className="mg-v2-text-sm mg-v2-color-text-secondary mg-mb-0">
                                    사용자 권한 설정 및 관리 (클릭하여 펼치기/접기)
                                </p>
                            </div>
                        </div>
                        <div style={{
                            fontSize: '20px',
                            color: '#666'
                        }}>
                            {isPermissionSectionExpanded ? '▲' : '▼'}
                        </div>
                    </div>
                    
                    {isPermissionSectionExpanded && (
                        <div style={{
                            padding: '20px',
                            backgroundColor: 'white',
                            border: '1px solid #e9ecef',
                            borderTop: 'none',
                            borderRadius: '0 0 8px 8px'
                        }}>
                            <PermissionManagement />
                        </div>
                    )}
                </div>
            )}

        </div>
        </SimpleLayout>
    );
};

export default AdminDashboard;
