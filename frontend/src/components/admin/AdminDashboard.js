import React, { useState, useEffect, useCallback, useRef } from 'react';
import notificationManager from '../../utils/notification';
import { useConfirm } from '../../hooks/useConfirm';
import { useNavigate } from 'react-router-dom';
import { RoleUtils, USER_ROLES } from '../../constants/roles';
import { WIDGET_CONSTANTS } from '../../constants/widgetConstants';
import {
  resolveRollingMonthlyChartRows
} from '../dashboard-v2/utils/dashboardChartPeriodUtils';
import { FaUsers, FaDollarSign, FaChartLine, FaBox, FaShoppingCart, FaCheckCircle, FaWallet, FaTruck, FaChartBar, FaUserGraduate, FaRedo, FaFileExport } from 'react-icons/fa';
import {
    Activity,
    AlertTriangle,
    BarChart,
    BellRing,
    Brain,
    Calendar,
    CalendarDays,
    Check,
    CheckCircle,
    ClipboardList,
    Clock,
    Database,
    DollarSign,
    Heart,
    LayoutDashboard,
    Link2,
    Megaphone,
    Merge,
    MessageCircle,
    MessageSquare,
    PieChart,
    Receipt,
    RotateCcw,
    Search,
    Settings,
    Shield,
    Tags,
    Target,
    TrendingUp,
    Trophy,
    User,
    UserCog,
    UserRound,
    Users
} from 'lucide-react';
import SimpleLayout from '../layout/SimpleLayout';
import UnifiedLoading from '../../components/common/UnifiedLoading'; // 임시 비활성화
import SafeText from '../common/SafeText';
import SystemStatus from './system/SystemStatus';
import DashboardSection from '../layout/DashboardSection';
import StatCard from '../ui/Card/StatCard';
import { ProfileCard, ConsultantRatingCard } from '../ui/Card/index';
import { API_BASE_URL } from '../../constants/api';
import SystemTools from './system/SystemTools';
import ConsultantRatingStatistics from './ConsultantRatingStatistics';
import StatisticsDashboard from './StatisticsDashboard';
import SystemNotificationSection from '../dashboard/SystemNotificationSection';
import SpecialtyManagementModal from '../consultant/SpecialtyManagementModal';
import PerformanceMetricsModal from '../statistics/PerformanceMetricsModal';
import RecurringExpenseModal from '../finance/RecurringExpenseModal';
import ErpReportModal from '../erp/ErpReportModal';
import MappingDepositModal from './mapping/MappingDepositModal';
import AdminDashboardMonitoring from './AdminDashboard/AdminDashboardMonitoring';
import UnifiedModal from '../common/modals/UnifiedModal';
import Badge from '../common/Badge';
import StandardizedApi from '../../utils/standardizedApi';
import {
  CoreFlowPipeline,
  ManualMatchingQueue,
  DepositPendingList,
  SchedulePendingList
} from './AdminDashboard/index';
import { useSession } from '../../contexts/SessionContext';
import { buildErpApprovalHubPath } from '../erp/approval/erpApprovalHubRoutes';
import { COMPONENT_CSS } from '../../constants/css-variables';
import csrfTokenManager from '../../utils/csrfTokenManager';
import { sessionManager } from '../../utils/sessionManager';
import { fetchUserPermissions, PermissionChecks } from '../../utils/permissionUtils';
import PermissionGroupGuard from '../common/PermissionGroupGuard';
import '../../styles/main.css';
import '../../styles/unified-design-tokens.css';
import '../../styles/dashboard-tokens-extension.css';
import '../../styles/themes/admin-theme.css';
import './AdminDashboard/AdminDashboardPipeline.css';
import './AdminDashboard/AdminDashboardB0KlA.css';
import './system/SystemStatus.css';
import './system/SystemTools.css';
import { ADMIN_ROUTES } from '../../constants/adminRoutes';
import MGButton from '../common/MGButton';
import { buildErpMgButtonClassName, ERP_MG_BUTTON_LOADING_TEXT } from '../erp/common/erpMgButtonProps';
import { API_ENDPOINTS } from '../../constants/apiEndpoints';
import { useTranslation } from 'react-i18next';

// T5 표준화 2026-05-21: API 경로 리터럴 → 로컬 상수 (운영 게이트 P0)
const API_ADMIN_CLIENTS_WITH_MAPPING_INFO = '/api/v1/admin/clients/with-mapping-info';
const API_ADMIN_CONSULTANT_RATING_STATS = '/api/v1/admin/consultant-rating-stats';
const API_ADMIN_VACATION_STATISTICS = '/api/v1/admin/vacation-statistics?period=month';
const API_ADMIN_STATISTICS_CONSULTATION_COMPLETION = '/api/v1/admin/statistics/consultation-completion';
const API_ADMIN_REFUND_STATISTICS = '/api/v1/admin/refund-statistics?period=month';
const API_ADMIN_CONSULTANTS_WITH_VACATION = '/api/v1/admin/consultants/with-vacation';
const API_ADMIN_MAPPINGS_PENDING_DEPOSIT = '/api/v1/admin/mappings/pending-deposit';
const API_ADMIN_SCHEDULES_AUTO_COMPLETE = '/api/v1/admin/schedules/auto-complete';
const API_ADMIN_SCHEDULES_AUTO_COMPLETE_WITH_REMINDER = '/api/v1/admin/schedules/auto-complete-with-reminder';
const API_ADMIN_DUPLICATE_MAPPINGS = '/api/v1/admin/duplicate-mappings';
const API_ADMIN_MERGE_DUPLICATE_MAPPINGS = '/api/v1/admin/merge-duplicate-mappings';
const API_TEST_CREATE_TEST_DATA = '/api/v1/test/create-test-data';
const API_HEALTH_SERVER = '/api/v1/health/server';
const API_HEALTH_DATABASE = '/api/v1/health/database';
const API_ADMIN_LOGS_RECENT = '/api/v1/admin/logs/recent';
const API_ADMIN_CACHE_CLEAR = '/api/v1/admin/cache/clear';
const API_ADMIN_BACKUP_CREATE = '/api/v1/admin/backup/create';


/** 관리 기능 카드 상단 아이콘 (B0KlA 톤 배지 + Lucide, AdminDashboardV2와 동일 계열) */
function AdminMgmtCardIcon({ icon: LucideIcon, tone = 'blue' }) {
    return (
        <span
            className={`mg-v2-ad-b0kla__admin-icon mg-v2-ad-b0kla__admin-icon--${tone}`}
            aria-hidden
        >
            <LucideIcon size={28} strokeWidth={2} />
        </span>
    );
}

const AdminDashboard = ({ user: propUser }) => {
    const { t } = useTranslation(['admin', 'common']);
    const navigate = useNavigate();
    const [confirm, ConfirmModal] = useConfirm();
    const { user: sessionUser, isLoggedIn, isLoading: sessionLoading, hasPermission } = useSession();

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
    const [unassignedClients, setUnassignedClients] = useState([]);
    const [consultants, setConsultants] = useState([]);
    const [pendingDepositList, setPendingDepositList] = useState([]);
    const [matchingQueueLoading, setMatchingQueueLoading] = useState(false);
    const [depositModalMapping, setDepositModalMapping] = useState(null);
    
    const [showErpReport, setShowErpReport] = useState(false);
    const [showPerformanceMetrics, setShowPerformanceMetrics] = useState(false);
    const [showSpecialtyManagement, setShowSpecialtyManagement] = useState(false);
    const [showRecurringExpense, setShowRecurringExpense] = useState(false);
    const [showStatisticsModal, setShowStatisticsModal] = useState(false);
    const [isConsultantRatingExpanded, setIsConsultantRatingExpanded] = useState(false);
    const [isVacationExpanded, setIsVacationExpanded] = useState(false);
    
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
    const [autoCompleteLoading, setAutoCompleteLoading] = useState(false);
    const [autoCompleteWithReminderLoading, setAutoCompleteWithReminderLoading] = useState(false);
    const [isPermissionSectionExpanded, setIsPermissionSectionExpanded] = useState(false);
    const [chartPeriod, setChartPeriod] = useState('monthly');
    const [systemStatus, setSystemStatus] = useState({
        server: 'unknown',
        database: 'unknown',
        lastChecked: null
    });
    const isInitialized = useRef(false);

    const loadTodayStats = useCallback(async() => {
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
        // OAuth 콜백 처리 (무한 새로고침 방지)
        const urlParams = new URLSearchParams(window.location.search);
        const oauth = urlParams.get('oauth');
        
        if (oauth === 'success') {
            console.log('🔗 OAuth 로그인 성공, URL 파라미터에서 사용자 정보 복원...');
            
            const userInfo = {
                id: parseInt(urlParams.get('userId')) || 0,
                email: urlParams.get('email') || '',
                name: decodeURIComponent(urlParams.get('name') || ''),
                nickname: decodeURIComponent(urlParams.get('nickname') || ''),
                role: urlParams.get('role') || USER_ROLES.ADMIN,
                profileImageUrl: decodeURIComponent(urlParams.get('profileImage') || ''),
                provider: urlParams.get('provider') || 'UNKNOWN'
            };
            
            console.log('✅ URL 파라미터에서 사용자 정보:', userInfo);
            
            sessionManager.setUser(userInfo, {
                accessToken: 'oauth2_token',
                refreshToken: 'oauth2_refresh_token'
            });
            
            // URL 파라미터 완전히 제거 (새로고침 없이)
            const cleanUrl = window.location.origin + window.location.pathname;
            window.history.replaceState({}, document.title, cleanUrl);
            
            // 세션 체크만 강제 실행 (새로고침 없이)
            console.log('🔄 세션 복원 완료, 세션 체크만 실행...');
            sessionManager.checkSession(true).then(() => {
                console.log('✅ 세션 체크 완료');
            });
            return;
        }
        
        if (isInitialized.current) return;
        
        const initializeDashboard = async() => {
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



    const loadStats = useCallback(async() => {
        setLoading(true);
        try {
            const [consultantsRes, clientsRes, mappingsRes, ratingRes, vacationRes, consultationRes] = await Promise.all([
                fetch(`/api/v1/admin/consultants/with-vacation?date=${new Date().toISOString().split('T')[0]}`),
                fetch(API_ADMIN_CLIENTS_WITH_MAPPING_INFO),
                fetch(API_ENDPOINTS.ADMIN.MAPPINGS.LIST),
                fetch(API_ADMIN_CONSULTANT_RATING_STATS),
                fetch(API_ADMIN_VACATION_STATISTICS),
                fetch(API_ADMIN_STATISTICS_CONSULTATION_COMPLETION)
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
                // ApiResponse 구조: { success: true, data: { count: ..., consultants: [...] } }
                totalConsultants = consultantsData?.data?.count || consultantsData?.count || 0;
            }

            if (clientsRes.ok) {
                const clientsData = await clientsRes.json();
                // ApiResponse 구조: { success: true, data: { count: ..., clients: [...] } }
                totalClients = clientsData?.data?.count || clientsData?.count || 0;
            }

            if (mappingsRes.ok) {
                const mappingsData = await mappingsRes.json();
                // ApiResponse 구조: { success: true, data: { count: ..., mappings: [...] } }
                const mappings = (mappingsData && typeof mappingsData === 'object' && 'success' in mappingsData && 'data' in mappingsData)
                    ? mappingsData.data
                    : mappingsData;
                totalMappings = mappingsData?.data?.count || mappingsData?.count || mappings?.count || 0;
                const mappingsList = Array.isArray(mappings?.mappings) ? mappings.mappings : (Array.isArray(mappings?.data) ? mappings.data : (Array.isArray(mappings) ? mappings : []));
                // ⚠️ 표준화 2025-12-05: 하드코딩된 상태값을 공통코드에서 동적 조회하세요. getCommonCodes('STATUS_GROUP') 사용
                activeMappings = mappingsList.filter(m => m.status === 'ACTIVE').length;
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
            showToast(t('admin:dashboard.error.statsLoad'), 'danger');
        } finally {
            setLoading(false);
        }
    }, [showToast]);

    const loadRefundStats = useCallback(async() => {
        try {
            const response = await fetch(API_ADMIN_REFUND_STATISTICS);
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

    const loadUnassignedClientsAndConsultants = useCallback(async() => {
        setMatchingQueueLoading(true);
        try {
            const dateStr = new Date().toISOString().split('T')[0];
            const [clientsRes, consultantsRes] = await Promise.all([
                StandardizedApi.get(API_ADMIN_CLIENTS_WITH_MAPPING_INFO),
                StandardizedApi.get(API_ADMIN_CONSULTANTS_WITH_VACATION, { date: dateStr })
            ]);
            const clientsRaw = clientsRes?.clients ?? clientsRes?.data?.clients ?? [];
            const clients = Array.isArray(clientsRaw) ? clientsRaw : [];
            const unassigned = clients.filter((c) => (c.mappingCount ?? 0) === 0);
            setUnassignedClients(unassigned);
            const consultantsRaw = consultantsRes?.consultants ?? consultantsRes?.data?.consultants ?? consultantsRes;
            const consultantsList = Array.isArray(consultantsRaw) ? consultantsRaw : [];
            setConsultants(consultantsList);
        } catch (error) {
            console.error('미배정 내담자/상담사 로드 실패:', error);
            notificationManager.error(error?.message || t('admin:dashboard.error.unassignedLoad'));
            setUnassignedClients([]);
            setConsultants([]);
        } finally {
            setMatchingQueueLoading(false);
        }
    }, [t]);

    const loadPendingDepositStats = useCallback(async() => {
        try {
            const data = await StandardizedApi.get(API_ADMIN_MAPPINGS_PENDING_DEPOSIT);
            const rawMappings = data?.mappings ?? data?.data?.mappings ?? (Array.isArray(data) ? data : []);
            const pendingList = Array.isArray(rawMappings) ? rawMappings : [];
            const count = pendingList.length;
            const totalAmount = pendingList.reduce((sum, m) => sum + (m.packagePrice || 0), 0);
            const oldestHours = pendingList.length > 0
                ? Math.max(...pendingList.map((m) => m.hoursElapsed || 0), 0)
                : 0;
            setPendingDepositStats({ count, totalAmount, oldestHours });
            setPendingDepositList(pendingList);
        } catch (error) {
            console.error('입금 확인 대기 통계 로드 실패:', error);
            notificationManager.error(error?.message || t('admin:dashboard.error.pendingDepositLoad'));
            setPendingDepositStats({ count: 0, totalAmount: 0, oldestHours: 0 });
            setPendingDepositList([]);
        }
    }, [t]);

    const handleConfirmMatch = useCallback(async(clientId, consultantId) => {
        try {
            await StandardizedApi.post(API_ENDPOINTS.ADMIN.MAPPINGS.LIST, {
                clientId: Number(clientId),
                consultantId: Number(consultantId),
                status: 'PENDING_PAYMENT',
                totalSessions: 1,
                remainingSessions: 1,
                packageName: t('admin:dashboard.initialConsultation'),
                packagePrice: 0,
                paymentStatus: 'PENDING'
            });
            notificationManager.success(t('admin:dashboard.success.matchingCreated'));
            await Promise.all([loadUnassignedClientsAndConsultants(), loadStats(), loadPendingDepositStats()]);
        } catch (error) {
            const msg = error?.message || error?.response?.data?.message || t('admin:dashboard.error.matchingCreate');
            notificationManager.error(msg);
        }
    }, [loadUnassignedClientsAndConsultants, loadStats, loadPendingDepositStats, t]);

    const handleAutoCompleteSchedules = async() => {
        setAutoCompleteLoading(true);
        try {
            const response = await csrfTokenManager.post(API_ADMIN_SCHEDULES_AUTO_COMPLETE);

            if (response.ok) {
                const result = await response.json();
                showToast(result.message || t('admin:dashboard.autoComplete.success'));
                loadStats(); // 통계 새로고침
            } else {
                const error = await response.json();
                showToast(error.message || t('admin:dashboard.autoComplete.failed'), 'danger');
            }
        } catch (error) {
            console.error('스케줄 자동 완료 처리 실패:', error);
            showToast(t('admin:dashboard.autoComplete.failed'), 'danger');
        } finally {
            setAutoCompleteLoading(false);
        }
    };

    const handleAutoCompleteWithReminder = async() => {
        setAutoCompleteWithReminderLoading(true);
        try {
            const response = await csrfTokenManager.post(API_ADMIN_SCHEDULES_AUTO_COMPLETE_WITH_REMINDER);

            if (response.ok) {
                const result = await response.json();
                showToast(result.message || t('admin:dashboard.autoCompleteReminder.success'));
                loadStats(); // 통계 새로고침
            } else {
                const error = await response.json();
                showToast(error.message || t('admin:dashboard.autoCompleteReminder.failed'), 'danger');
            }
        } catch (error) {
            console.error('스케줄 자동 완료 처리 및 알림 실패:', error);
            showToast(t('admin:dashboard.autoCompleteReminder.failed'), 'danger');
        } finally {
            setAutoCompleteWithReminderLoading(false);
        }
    };

    const handleMergeDuplicateMappings = async() => {
        try {
            const checkResponse = await fetch(API_ADMIN_DUPLICATE_MAPPINGS);
            if (!checkResponse.ok) {
                showToast(t('admin:dashboard.duplicate.fetchFailed'), 'danger');
                return;
            }
            
            const checkResult = await checkResponse.json();
            if (checkResult.count === 0) {
                showToast(t('admin:dashboard.duplicate.empty'));
                return;
            }
            
            const confirmMessage = t('admin:dashboard.duplicate.confirmMerge', { count: checkResult.count });
            const confirmed = await confirm({ message: confirmMessage, variant: 'warning' });
            if (!confirmed) {
                return;
            }
            
            const response = await csrfTokenManager.post(API_ADMIN_MERGE_DUPLICATE_MAPPINGS);

            if (response.ok) {
                const result = await response.json();
                showToast(result.message || t('admin:dashboard.duplicate.mergeSuccess'));
                loadStats(); // 통계 새로고침
                loadRefundStats(); // 환불 통계 새로고침
            } else {
                const error = await response.json();
                showToast(error.message || t('admin:dashboard.duplicate.mergeFailed'), 'danger');
            }
        } catch (error) {
            console.error('중복 매칭 통합 실패:', error);
            showToast(t('admin:dashboard.duplicate.mergeFailed'), 'danger');
        }
    };

    useEffect(() => {
        loadStats();
        loadRefundStats();
        loadPendingDepositStats();
        loadUnassignedClientsAndConsultants();
    }, [loadStats, loadRefundStats, loadPendingDepositStats, loadUnassignedClientsAndConsultants]);

    const createTestData = async() => {
        try {
            const response = await csrfTokenManager.post(API_TEST_CREATE_TEST_DATA);

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

    const checkSystemStatus = async() => {
        setLoading(true);
        try {
            const [serverRes, dbRes] = await Promise.all([
                fetch(API_HEALTH_SERVER),
                fetch(API_HEALTH_DATABASE)
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

    const viewLogs = async() => {
        try {
            const response = await fetch(API_ADMIN_LOGS_RECENT);
            if (response.ok) {
                const logs = await response.json();
                const logWindow = window.open('', '_blank');
                logWindow.document.write(`
                    <html>
                        <head><title>{t('admin:AdminDashboard.t_e0975ea1')}</title></head>
                        <body>
                            <h2>{t('admin:AdminDashboard.t_4445543b')}</h2>
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

    const clearCache = async() => {
        try {
            const response = await csrfTokenManager.post(API_ADMIN_CACHE_CLEAR);

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

    const createBackup = async() => {
        try {
            const response = await csrfTokenManager.post(API_ADMIN_BACKUP_CREATE);

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

    const topConsultantsData = (stats.consultantRatingStats?.topConsultants || []).slice(0, 4).map((c) => ({
      name: c.consultantName || '-',
      profileImageUrl: c.profileImageUrl || c.consultantProfileImageUrl || null,
      rating: c.averageScore ? c.averageScore.toFixed(1) : '-',
      barWidth: c.averageScore ? Math.min(100, (c.averageScore / 5) * 100) : 0,
      barColor: 'var(--ad-b0kla-green)'
    }));

    if (sessionLoading) {
        return (
            <div className="admin-dashboard">
                <div className="admin-dashboard-content">
                    <UnifiedLoading type="inline" text={t('admin:AdminDashboard.t_06e61b86')} />
                </div>
            </div>
        );
    }

    return (
        <SimpleLayout title={t('admin:dashboard.title')} loading={false}>
        <div className="mg-v2-ad-b0kla">
        <div className="mg-v2-ad-b0kla__container mg-dashboard-layout">
            {/* B0KlA Header */}
            <header className="mg-v2-ad-b0kla__header">
                <div className="mg-v2-ad-b0kla__header-left">
                    <h1>{t('admin:dashboard.subtitle')}</h1>
                    <p>{t('admin:dashboard.summary.systemHealth')}</p>
                </div>
                <div className="mg-v2-ad-b0kla__header-right">
                    <div className="mg-v2-ad-b0kla__search">
                        <Search size={18} className="mg-v2-ad-b0kla__search-icon" />
                        <span className="mg-v2-ad-b0kla__search-placeholder">{t('admin:AdminDashboard.t_21ba917e')}</span>
                    </div>
                    <div className="mg-v2-ad-b0kla__icon-group">
                        <MGButton
                            variant="outline"
                            size="small"
                            className={buildErpMgButtonClassName({
                                variant: 'outline',
                                size: 'sm',
                                loading: false,
                                className: 'mg-v2-ad-b0kla__icon-btn'
                            })}
                            loadingText={ERP_MG_BUTTON_LOADING_TEXT}
                            onClick={() => setShowStatisticsModal(true)}
                            type="button"
                            preventDoubleClick={false}
                            aria-label={t('admin:AdminDashboard.t_4938fae0')}
                        >
                            {t('admin:AdminDashboard.t_4938fae0')}
                        </MGButton>
                        <MGButton
                            type="button"
                            variant="outline"
                            size="small"
                            className={buildErpMgButtonClassName({
                                variant: 'outline',
                                size: 'sm',
                                loading: false,
                                className: 'mg-v2-ad-b0kla__icon-btn'
                            })}
                            loadingText={ERP_MG_BUTTON_LOADING_TEXT}
                            aria-label={t('admin:AdminDashboard.t_fc8c5b69')}
                            preventDoubleClick={false}
                        >
                            {t('admin:AdminDashboard.t_fc8c5b69')}
                        </MGButton>
                        <MGButton
                            type="button"
                            variant="outline"
                            size="small"
                            className={buildErpMgButtonClassName({
                                variant: 'outline',
                                size: 'sm',
                                loading: false,
                                className: 'mg-v2-ad-b0kla__icon-btn'
                            })}
                            loadingText={ERP_MG_BUTTON_LOADING_TEXT}
                            aria-label={t('admin.labels.notification')}
                            onClick={() => navigate(ADMIN_ROUTES.MESSAGES)}
                            preventDoubleClick={false}
                        >
                            {t('admin.labels.notification')}
                        </MGButton>
                        <MGButton
                            type="button"
                            variant="outline"
                            size="small"
                            className={buildErpMgButtonClassName({
                                variant: 'outline',
                                size: 'sm',
                                loading: false,
                                className: 'mg-v2-ad-b0kla__icon-btn'
                            })}
                            loadingText={ERP_MG_BUTTON_LOADING_TEXT}
                            aria-label={t('admin:AdminDashboard.t_5d8fee11')}
                            preventDoubleClick={false}
                        >
                            {t('admin:AdminDashboard.t_5d8fee11')}
                        </MGButton>
                    </div>
                </div>
            </header>

            {/* B0KlA KPI Row */}
            <div className="mg-v2-ad-b0kla__kpi-row">
                <div className="mg-v2-ad-b0kla__kpi-card">
                    <div className="mg-v2-ad-b0kla__kpi-icon mg-v2-ad-b0kla__kpi-icon--green">
                        <Users size={28} />
                    </div>
                    <div className="mg-v2-ad-b0kla__kpi-info">
                        <div className="mg-v2-ad-b0kla__kpi-top">
                            <span className="mg-v2-ad-b0kla__kpi-label">{t('admin:dashboard.summary.totalUsers')}</span>
                            {todayStats.totalUsersGrowthRate !== undefined && (
                                <Badge
                                  variant="kpi"
                                  kpiVariant="green"
                                  value={`${todayStats.totalUsersGrowthRate > 0 ? '+' : ''}${todayStats.totalUsersGrowthRate}%`}
                                  className="mg-v2-ad-b0kla__kpi-badge"
                                />
                            )}
                        </div>
                        <span className="mg-v2-ad-b0kla__kpi-value">
                            {(stats.totalConsultants + stats.totalClients).toLocaleString()}
                        </span>
                    </div>
                </div>
                <div className="mg-v2-ad-b0kla__kpi-card">
                    <div className="mg-v2-ad-b0kla__kpi-icon mg-v2-ad-b0kla__kpi-icon--orange">
                        <Calendar size={28} />
                    </div>
                    <div className="mg-v2-ad-b0kla__kpi-info">
                        <div className="mg-v2-ad-b0kla__kpi-top">
                            <span className="mg-v2-ad-b0kla__kpi-label">{t('admin:dashboard.summary.bookedConsultations')}</span>
                            {todayStats.bookedGrowthRate !== undefined && (
                                <Badge
                                  variant="kpi"
                                  kpiVariant="orange"
                                  value={`${todayStats.bookedGrowthRate > 0 ? '+' : ''}${todayStats.bookedGrowthRate}%`}
                                  className="mg-v2-ad-b0kla__kpi-badge"
                                />
                            )}
                        </div>
                        <span className="mg-v2-ad-b0kla__kpi-value">{todayStats.totalToday}</span>
                    </div>
                </div>
                <div className="mg-v2-ad-b0kla__kpi-card">
                    <div className="mg-v2-ad-b0kla__kpi-icon mg-v2-ad-b0kla__kpi-icon--blue">
                        <Check size={28} />
                    </div>
                    <div className="mg-v2-ad-b0kla__kpi-info">
                        <div className="mg-v2-ad-b0kla__kpi-top">
                            <span className="mg-v2-ad-b0kla__kpi-label">{t('admin:dashboard.summary.completionRate')}</span>
                            {stats.consultationStats?.completionRate !== undefined && (
                                <Badge
                                  variant="kpi"
                                  kpiVariant="blue"
                                  value={`${stats.consultationStats.completionRate}%`}
                                  className="mg-v2-ad-b0kla__kpi-badge"
                                />
                            )}
                        </div>
                        <span className="mg-v2-ad-b0kla__kpi-value">
                            {stats.consultationStats?.completionRate != null ? `${stats.consultationStats.completionRate}%` : todayStats.completedToday}
                        </span>
                    </div>
                </div>
            </div>

            {/* Core Flow Pipeline (5단계) */}
            <div className="mg-v2-ad-b0kla__card">
            <CoreFlowPipeline
              stats={{
                totalMappings: stats.totalMappings,
                pendingDepositCount: pendingDepositStats.count,
                activeMappings: stats.activeMappings,
                schedulePendingCount: 0
              }}
            />
            </div>

            {/* B0KlA Chart + Counselor Row */}
            <div className="mg-v2-ad-b0kla__growth-row">
                <div className="mg-v2-ad-b0kla__card">
                    <div className="mg-v2-ad-b0kla__chart-header">
                        <div>
                            <h3 className="mg-v2-ad-b0kla__chart-title">{t('admin:dashboard.chartTitle')}</h3>
                            <p className="mg-v2-ad-b0kla__chart-desc">{t('admin:dashboard.chartSubtitle')}</p>
                        </div>
                        <div className="mg-v2-ad-b0kla__pill-toggle">
                            <MGButton
                                type="button"
                                variant="outline"
                                className={buildErpMgButtonClassName({
                                    variant: 'outline',
                                    loading: false,
                                    className: `mg-v2-ad-b0kla__pill ${chartPeriod === 'monthly' ? 'mg-v2-ad-b0kla__pill--active' : ''}`
                                })}
                                loadingText={ERP_MG_BUTTON_LOADING_TEXT}
                                onClick={() => setChartPeriod('monthly')}
                                preventDoubleClick={false}
                            >
                                {t('admin:dashboard.v2.period.monthly')}
                            </MGButton>
                            <MGButton
                                type="button"
                                variant="outline"
                                className={buildErpMgButtonClassName({
                                    variant: 'outline',
                                    loading: false,
                                    className: `mg-v2-ad-b0kla__pill ${chartPeriod === 'weekly' ? 'mg-v2-ad-b0kla__pill--active' : ''}`
                                })}
                                loadingText={ERP_MG_BUTTON_LOADING_TEXT}
                                onClick={() => setChartPeriod('weekly')}
                                preventDoubleClick={false}
                            >
                                {t('admin:dashboard.v2.period.weekly')}
                            </MGButton>
                        </div>
                    </div>
                    <div className="mg-v2-ad-b0kla__chart-placeholder">
                        {stats.consultationStats?.monthlyData?.length > 0 ? (
                            (() => {
                                const chartData = resolveRollingMonthlyChartRows(stats.consultationStats.monthlyData);
                                const values = chartData.map((d) => d.completedCount || 0);
                                const allZero = values.length > 0 && values.every((v) => v === 0);
                                if (allZero) {
                                    return (
                                        <p className="mg-v2-ad-b0kla__chart-empty">{t('admin:AdminDashboard.t_385902d3')}</p>
                                    );
                                }
                                return (
                            <div className="mg-v2-ad-b0kla__chart-bars">
                                {chartData.map((data) => {
                                    const maxCount = Math.max(...chartData.map((d) => d.completedCount || 0), 1);
                                    const heightPercent = Math.max(10, ((data.completedCount || 0) / maxCount) * 100);
                                    return (
                                        <div key={data.period} className="mg-v2-ad-b0kla__chart-bar-item">
                                            <span className="mg-v2-ad-b0kla__chart-bar-value">{data.completedCount || 0}</span>
                                            <div
                                                className="mg-v2-ad-b0kla__chart-bar-fill"
                                                style={{ '--chart-bar-height': `${heightPercent}%` }}
                                            />
                                            <span className="mg-v2-ad-b0kla__chart-bar-label">
                                                <SafeText>{data.period}</SafeText>
                                            </span>
                                        </div>
                                    );
                                })}
                            </div>
                                );
                            })()
                        ) : (
                            <>
                                <Activity size={48} className="mg-v2-ad-b0kla__chart-placeholder-icon" />
                                <span>{t('admin:AdminDashboard.t_26d3855d')}</span>
                            </>
                        )}
                    </div>
                </div>
                <div className="mg-v2-ad-b0kla__card">
                    <h3 className="mg-v2-ad-b0kla__counselor-title">{t('admin:AdminDashboard.t_187d6016')}</h3>
                    <div className="mg-v2-ad-b0kla__counselor-list">
                        {topConsultantsData.length > 0 ? (
                            topConsultantsData.map((c, i) => (
                                <ConsultantRatingCard key={i} {...c} />
                            ))
                        ) : (
                            <p className="mg-v2-ad-b0kla__counselor-empty">{t('admin:AdminDashboard.t_4b363218')}</p>
                        )}
                    </div>
                </div>
            </div>

            {/* 미배정 내담자 매칭 대기열 */}
            <ManualMatchingQueue
              items={unassignedClients.map((client) => ({
                id: client.id,
                clientName: client.name || '-',
                clientMeta: client.email || '매칭 없음',
                consultantOptions: consultants.map((c) => ({
                  value: String(c.id),
                  label: c.name || `상담사 ${c.id}`
                }))
              }))}
              onConfirmMatch={handleConfirmMatch}
              loading={matchingQueueLoading}
            />

            {/* 입금 확인 대기 / 스케줄 등록 대기 (파이프라인 하단) */}
            <div className="mg-dashboard-pipeline-detail">
              <DepositPendingList
                items={pendingDepositList.map((m) => ({
                  id: m.id,
                  clientName: m.clientName,
                  amount: m.packagePrice,
                  _raw: m
                }))}
                onDepositConfirm={(item) => {
                  const mapping = item._raw || item;
                  setDepositModalMapping(mapping);
                }}
              />
              <SchedulePendingList
                items={[]}
                onScheduleRegister={() => navigate(ADMIN_ROUTES.SCHEDULES)}
              />
            </div>

            {/* 상세 통계 섹션들 */}
                {/* 시스템 개요 */}
            <DashboardSection
                title={t('admin:dashboard.systemOverview')}
                subtitle={t('admin:dashboard.systemOverviewSubtitle')}
                icon={<Activity />}
            >
                <div className="mg-stats-grid">
                    <StatCard
                        icon={<User />}
                        value={stats.totalConsultants}
                        label={t('admin.labels.consultant')}
                        onClick={() => navigate(ADMIN_ROUTES.CONSULTANT_COMPREHENSIVE)}
                    />
                    <StatCard
                        icon={<Users />}
                        value={stats.totalClients}
                        label={t('admin.labels.client')}
                        onClick={() => navigate(ADMIN_ROUTES.CLIENT_COMPREHENSIVE)}
                    />
                    <StatCard
                        icon={<Link2 />}
                        value={stats.totalMappings}
                        label={t('admin:matching.title')}
                        onClick={() => navigate(ADMIN_ROUTES.MAPPING_MANAGEMENT)}
                    />
                    <StatCard
                        icon={<CheckCircle />}
                        value={stats.activeMappings}
                        label={t('admin:dashboard.summary.activeSessions')}
                        // ⚠️ 표준화 2025-12-05: 하드코딩된 상태값을 공통코드에서 동적 조회하세요. getCommonCodes('STATUS_GROUP') 사용
                        onClick={() => navigate(`${ADMIN_ROUTES.MAPPING_MANAGEMENT}?status=ACTIVE`)}
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
                        title={t('admin:AdminDashboard.t_3e527e81')}
                        subtitle="결제 확인 완료, 입금 대기 중인 매칭"
                        icon={<AlertTriangle />}
                    >
                        <div className="mg-stats-grid">
                            <StatCard
                                icon={<AlertTriangle />}
                                value={`${pendingDepositStats.count}건`}
                                label={t('admin:AdminDashboard.t_8246effd')}
                                onClick={() => navigate(`${ADMIN_ROUTES.MAPPING_MANAGEMENT}?status=PENDING_PAYMENT`)}
                            />
                            <StatCard
                                icon={<DollarSign />}
                                value={`${pendingDepositStats.totalAmount.toLocaleString()}원`}
                                label={t('admin:AdminDashboard.t_f5eb6825')}
                                onClick={() => navigate(`${ADMIN_ROUTES.MAPPING_MANAGEMENT}?status=PENDING_PAYMENT`)}
                            />
                            <StatCard
                                icon={<Clock />}
                                value={`${pendingDepositStats.oldestHours}시간`}
                                label={t('admin:AdminDashboard.t_6937810e')}
                                onClick={() => navigate(`${ADMIN_ROUTES.MAPPING_MANAGEMENT}?status=PENDING_PAYMENT`)}
                            />
                            <StatCard
                                icon={<Settings />}
                                value="처리하기"
                                label={t('admin:AdminDashboard.t_53046e0a')}
                                onClick={() => navigate(ADMIN_ROUTES.MAPPING_MANAGEMENT)}
                            />
                        </div>
                    </DashboardSection>
                )}

                {/* 휴가 통계 섹션 */}
                <div className="mg-mb-lg">
                    <div 
                        onClick={() => setIsVacationExpanded(!isVacationExpanded)}
                        className={`mg-v2-card mg-flex mg-align-center mg-justify-between mg-cursor-pointer ${isVacationExpanded ? 'mg-mb-0' : 'mg-mb-md'}`}
                    >
                        <div className="mg-flex mg-align-center mg-gap-sm">
                            <CalendarDays size={20} />
                            <div>
                                <h3 className="mg-v2-section-title">{t('admin:widget.vacationOverview.title')}</h3>
                                <p className="mg-v2-section-subtitle">{t('admin:widget.vacationOverview.description')}</p>
                            </div>
                        </div>
                        <div className="mg-v2-accordion-toggle-icon">
                            {isVacationExpanded ? '▲' : '▼'}
                        </div>
                    </div>
                    
                    {isVacationExpanded && (
                        <div className="mg-v2-accordion-content">
                            <DashboardSection>
                    <div className="mg-stats-grid">
                        <StatCard
                            icon={<User />}
                            value={`${stats.vacationStats?.summary?.totalConsultants || 0}명`}
                            label={t('admin:dashboard.summary.totalCounselors')}
                        />
                        <StatCard
                            icon={<CalendarDays />}
                            value={`${(stats.vacationStats?.summary?.totalVacationDays || 0).toFixed(1)}일`}
                            label={t('admin:dashboard.totalVacationDays')}
                        />
                        <StatCard
                            icon={<BarChart />}
                            value={`${(stats.vacationStats?.summary?.averageVacationDays || 0).toFixed(1)}일`}
                            label={t('admin:dashboard.avgVacationDays')}
                        />
                    </div>
                    
                    {/* 상담사별 휴가 현황 카드 (표준화 원칙: 테이블 → 카드 전환) */}
                    {stats.vacationStats?.consultantStats && stats.vacationStats.consultantStats.length > 0 && (
                        <div className="mg-vacation-cards-grid">
                            {stats.vacationStats.consultantStats.slice(0, WIDGET_CONSTANTS.DASHBOARD_LIMITS.MAX_ITEMS).map((consultant) => (
                                <ProfileCard
                                    key={consultant.consultantId}
                                    variant="list"
                                    avatar={{ profileImageUrl: consultant.profileImageUrl, displayName: consultant.consultantName }}
                                    name={consultant.consultantName}
                                    contactInfo={{ email: consultant.consultantEmail }}
                                    statsItems={[
                                        { label: '휴가일수', value: `${(consultant.vacationDays || 0).toFixed(1)}일` },
                                        {
                                            label: '최근 휴가',
                                            value: consultant.lastVacationDate
                                                ? new Date(consultant.lastVacationDate).toLocaleDateString('ko-KR')
                                                : '-',
                                            icon: <Clock size={14} />
                                        }
                                    ]}
                                    onClick={() => navigate(`${ADMIN_ROUTES.CONSULTANT_COMPREHENSIVE}?id=${consultant.consultantId}`)}
                                />
                            ))}
                        </div>
                    )}
                            </DashboardSection>
                        </div>
                    )}
                </div>

                {/* 상담사 평가 통계 섹션 */}
                <div className="mg-mb-lg">
                    <div 
                        onClick={() => setIsConsultantRatingExpanded(!isConsultantRatingExpanded)}
                        className={`mg-v2-card mg-flex mg-align-center mg-justify-between mg-cursor-pointer ${isConsultantRatingExpanded ? 'mg-mb-0' : 'mg-mb-md'}`}
                    >
                        <div className="mg-flex mg-align-center mg-gap-sm">
                            <Heart />
                            <div>
                                <h3 className="mg-h4 mg-mb-0">
                                    {t('admin:AdminDashboard.t_5b099eae')}
                                </h3>
                                <p className="mg-v2-text-sm mg-v2-color-text-secondary mg-mb-0">
                                    {t('admin:AdminDashboard.t_daa1a939')}
                                </p>
                            </div>
                        </div>
                        <div className="mg-v2-accordion-toggle-icon">
                            {isConsultantRatingExpanded ? '▲' : '▼'}
                        </div>
                    </div>
                    
                    {isConsultantRatingExpanded && (
                        <div className="mg-v2-accordion-content">
                            <div className="mg-stats-grid mg-mb-lg">
                                <StatCard
                                    icon={<Heart />}
                                    value={`${stats.consultantRatingStats?.totalRatings || 0}개`}
                                    label={t('admin:AdminDashboard.t_0ebac2e7')}
                                    onClick={() => navigate(ADMIN_ROUTES.STATISTICS)}
                                />
                                <StatCard
                                    icon={<Trophy />}
                                    value={(stats.consultantRatingStats?.averageScore || 0).toFixed(1)}
                                    label={t('admin:AdminDashboard.t_380b3971')}
                                    onClick={() => navigate(ADMIN_ROUTES.STATISTICS)}
                                />
                                <StatCard
                                    icon={<Users />}
                                    value={`${stats.consultantRatingStats?.topConsultants?.length || 0}명`}
                                    label={t('admin:AdminDashboard.t_67de8d58')}
                                    onClick={() => navigate(ADMIN_ROUTES.CONSULTANT_COMPREHENSIVE)}
                                />
                            </div>
                            
                            {/* 상세 상담사 평가 통계 */}
                            <ConsultantRatingStatistics />
                        </div>
                    )}
                </div>

                {/* 환불 통계 섹션 */}
                <DashboardSection
                    title={t('admin:AdminDashboard.t_ac9f714d')}
                    subtitle="최근 1개월 환불 통계"
                    icon={<RotateCcw />}
                >
                    <div className="mg-stats-grid">
                        <StatCard
                            icon={<Receipt />}
                            value={`${refundStats.totalRefundCount}건`}
                            label={t('admin:AdminDashboard.t_e07e5754')}
                            onClick={() => navigate(`${ADMIN_ROUTES.MAPPING_MANAGEMENT}?tab=refunds`)}
                        />
                        <StatCard
                            icon={<Calendar />}
                            value={`${refundStats.totalRefundedSessions}회`}
                            label={t('admin:AdminDashboard.t_7362540d')}
                            onClick={() => navigate(`${ADMIN_ROUTES.MAPPING_MANAGEMENT}?tab=refunds`)}
                        />
                        <StatCard
                            icon={<DollarSign />}
                            value={`${refundStats.totalRefundAmount.toLocaleString()}원`}
                            label={t('admin:AdminDashboard.t_ca5c157c')}
                            onClick={() => navigate(`${ADMIN_ROUTES.MAPPING_MANAGEMENT}?tab=refunds`)}
                        />
                        <StatCard
                            icon={<TrendingUp />}
                            value={`${refundStats.averageRefundPerCase.toLocaleString()}원`}
                            label={t('admin:AdminDashboard.t_5c45c1f3')}
                            onClick={() => navigate(`${ADMIN_ROUTES.MAPPING_MANAGEMENT}?tab=refunds`)}
                        />
                    </div>
                </DashboardSection>

            {/* 상담 완료 건수 통계 (어드민/수퍼어드민/지점수퍼어드민) */}
            {RoleUtils.isAdmin(propUser || sessionUser) && (
                    <DashboardSection
                        title={t('admin:AdminDashboard.t_16789d0d')}
                        subtitle="월별 상담 완료 현황 및 성과 지표"
                        icon={<Target />}
                    >
                        <div className="mg-stats-grid">
                            <StatCard
                                icon={<CheckCircle />}
                                value={`${stats.consultationStats?.totalCompleted || 0}건`}
                                label={t('admin:AdminDashboard.t_6911ff22')}
                                onClick={() => navigate(ADMIN_ROUTES.SESSIONS)}
                            />
                            <StatCard
                                icon={<TrendingUp />}
                                value={`${stats.consultationStats?.completionRate || 0}%`}
                                label={t('admin:AdminDashboard.t_611cadb3')}
                                onClick={() => navigate(ADMIN_ROUTES.STATISTICS)}
                            />
                            <StatCard
                                icon={<PieChart />}
                                value={`${stats.consultationStats?.averageCompletionTime || 0}분`}
                                label={t('admin:AdminDashboard.t_ece12c9a')}
                            />
                        </div>
                        
                        {/* 월별 상담 완료 차트 */}
                        {stats.consultationStats?.monthlyData && stats.consultationStats.monthlyData.length > 0 && (
                            <div className="mg-chart-container">
                                <h4 className="mg-chart-title">{t('admin:AdminDashboard.t_6e833dec')}</h4>
                                <div className="mg-chart-grid">
                                    {stats.consultationStats.monthlyData.slice(0, WIDGET_CONSTANTS.DASHBOARD_LIMITS.DEFAULT_ITEMS).map((data, index) => {
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
                title={t('admin:AdminDashboard.t_e05c0827')}
                subtitle="시스템 관리 및 설정 기능"
                icon={<Settings />}
            >
                <div className="mg-v2-ad-b0kla__admin-grid">
                    <MGButton
                        type="button"
                        className={buildErpMgButtonClassName({
                            variant: 'primary',
                            size: 'md',
                            loading: false,
                            className: 'mg-v2-ad-b0kla__admin-card'
                        })}
                        loadingText={ERP_MG_BUTTON_LOADING_TEXT}
                        onClick={() => navigate(ADMIN_ROUTES.USER_MANAGEMENT)}
                        preventDoubleClick={false}
                    >
                        <AdminMgmtCardIcon icon={Users} tone="blue" />
                        <span className="mg-v2-ad-b0kla__admin-label">{t('admin.labels.userManagement')}</span>
                        <span className="mg-v2-ad-b0kla__admin-desc">{t('admin:AdminDashboard.t_5b997a6e')}</span>
                    </MGButton>
                    <MGButton
                        type="button"
                        className={buildErpMgButtonClassName({
                            variant: 'primary',
                            size: 'md',
                            loading: false,
                            className: 'mg-v2-ad-b0kla__admin-card'
                        })}
                        loadingText={ERP_MG_BUTTON_LOADING_TEXT}
                        onClick={() => navigate(ADMIN_ROUTES.INTEGRATED_SCHEDULE)}
                        preventDoubleClick={false}
                    >
                        <AdminMgmtCardIcon icon={CalendarDays} tone="green" />
                        <span className="mg-v2-ad-b0kla__admin-label">{t('admin:AdminDashboard.t_d67bbae4')}</span>
                        <span className="mg-v2-ad-b0kla__admin-desc">{t('admin:AdminDashboard.t_bc774ca3')}</span>
                    </MGButton>
                    <MGButton
                        type="button"
                        className={buildErpMgButtonClassName({
                            variant: 'primary',
                            size: 'md',
                            loading: false,
                            className: 'mg-v2-ad-b0kla__admin-card'
                        })}
                        loadingText={ERP_MG_BUTTON_LOADING_TEXT}
                        onClick={() => navigate(ADMIN_ROUTES.CONSULTATION_LOGS)}
                        preventDoubleClick={false}
                    >
                        <AdminMgmtCardIcon icon={ClipboardList} tone="orange" />
                        <span className="mg-v2-ad-b0kla__admin-label">{t('admin:AdminDashboard.t_f00037ae')}</span>
                        <span className="mg-v2-ad-b0kla__admin-desc">{t('admin:AdminDashboard.t_da19d0b8')}</span>
                    </MGButton>
                    <MGButton
                        type="button"
                        className={buildErpMgButtonClassName({
                            variant: 'primary',
                            size: 'md',
                            loading: false,
                            className: 'mg-v2-ad-b0kla__admin-card'
                        })}
                        loadingText={ERP_MG_BUTTON_LOADING_TEXT}
                        onClick={() => navigate(ADMIN_ROUTES.SCHEDULES)}
                        preventDoubleClick={false}
                    >
                        <AdminMgmtCardIcon icon={Calendar} tone="green" />
                        <span className="mg-v2-ad-b0kla__admin-label">{t('admin:AdminDashboard.t_6ddcca42')}</span>
                        <span className="mg-v2-ad-b0kla__admin-desc">{t('admin:AdminDashboard.t_ad9cf841')}</span>
                    </MGButton>
                    <MGButton
                        type="button"
                        className={buildErpMgButtonClassName({
                            variant: 'primary',
                            size: 'md',
                            loading: false,
                            className: 'mg-v2-ad-b0kla__admin-card'
                        })}
                        loadingText={ERP_MG_BUTTON_LOADING_TEXT}
                        onClick={() => navigate(ADMIN_ROUTES.SESSIONS)}
                        preventDoubleClick={false}
                    >
                        <AdminMgmtCardIcon icon={Target} tone="gray" />
                        <span className="mg-v2-ad-b0kla__admin-label">{t('admin:AdminDashboard.t_be89c264')}</span>
                        <span className="mg-v2-ad-b0kla__admin-desc">{t('admin:AdminDashboard.t_6d774c2e')}</span>
                    </MGButton>
                    <MGButton
                        type="button"
                        className={buildErpMgButtonClassName({
                            variant: 'primary',
                            size: 'md',
                            loading: autoCompleteLoading,
                            className: 'mg-v2-ad-b0kla__admin-card'
                        })}
                        loadingText={ERP_MG_BUTTON_LOADING_TEXT}
                        onClick={handleAutoCompleteSchedules}
                        loading={autoCompleteLoading}
                        preventDoubleClick={false}
                    >
                        <AdminMgmtCardIcon icon={CheckCircle} tone="green" />
                        <span className="mg-v2-ad-b0kla__admin-label">{t('admin:AdminDashboard.t_7ad7a72d')}</span>
                        <span className="mg-v2-ad-b0kla__admin-desc">{t('admin:AdminDashboard.t_b1698575')}</span>
                    </MGButton>
                    <MGButton
                        type="button"
                        className={buildErpMgButtonClassName({
                            variant: 'primary',
                            size: 'md',
                            loading: autoCompleteWithReminderLoading,
                            className: 'mg-v2-ad-b0kla__admin-card'
                        })}
                        loadingText={ERP_MG_BUTTON_LOADING_TEXT}
                        onClick={handleAutoCompleteWithReminder}
                        loading={autoCompleteWithReminderLoading}
                        preventDoubleClick={false}
                    >
                        <AdminMgmtCardIcon icon={BellRing} tone="orange" />
                        <span className="mg-v2-ad-b0kla__admin-label">{t('admin:AdminDashboard.t_4a726da5')}</span>
                        <span className="mg-v2-ad-b0kla__admin-desc">{t('admin:AdminDashboard.t_d9e01adc')}</span>
                    </MGButton>
                    <MGButton
                        type="button"
                        className={buildErpMgButtonClassName({
                            variant: 'primary',
                            size: 'md',
                            loading: false,
                            className: 'mg-v2-ad-b0kla__admin-card'
                        })}
                        loadingText={ERP_MG_BUTTON_LOADING_TEXT}
                        onClick={() => navigate(ADMIN_ROUTES.CONSULTANT_COMPREHENSIVE)}
                        preventDoubleClick={false}
                    >
                        <AdminMgmtCardIcon icon={UserCog} tone="blue" />
                        <span className="mg-v2-ad-b0kla__admin-label">{t('admin.labels.consultantManagement')}</span>
                        <span className="mg-v2-ad-b0kla__admin-desc">{t('admin:AdminDashboard.t_880e9dbb')}</span>
                    </MGButton>
                    <MGButton
                        type="button"
                        className={buildErpMgButtonClassName({
                            variant: 'primary',
                            size: 'md',
                            loading: false,
                            className: 'mg-v2-ad-b0kla__admin-card'
                        })}
                        loadingText={ERP_MG_BUTTON_LOADING_TEXT}
                        onClick={() => navigate(ADMIN_ROUTES.CLIENT_COMPREHENSIVE)}
                        preventDoubleClick={false}
                    >
                        <AdminMgmtCardIcon icon={UserRound} tone="green" />
                        <span className="mg-v2-ad-b0kla__admin-label">{t('admin.labels.clientManagement')}</span>
                        <span className="mg-v2-ad-b0kla__admin-desc">{t('admin:AdminDashboard.t_9ee4da97')}</span>
                    </MGButton>
                    <MGButton
                        type="button"
                        className={buildErpMgButtonClassName({
                            variant: 'primary',
                            size: 'md',
                            loading: false,
                            className: 'mg-v2-ad-b0kla__admin-card'
                        })}
                        loadingText={ERP_MG_BUTTON_LOADING_TEXT}
                        onClick={() => navigate(ADMIN_ROUTES.MAPPING_MANAGEMENT)}
                        preventDoubleClick={false}
                    >
                        <AdminMgmtCardIcon icon={Link2} tone="orange" />
                        <span className="mg-v2-ad-b0kla__admin-label">{t('admin:AdminDashboard.t_fd7633e1')}</span>
                        <span className="mg-v2-ad-b0kla__admin-desc">{t('admin:AdminDashboard.t_04f1992b')}</span>
                    </MGButton>
                    <MGButton
                        type="button"
                        className={buildErpMgButtonClassName({
                            variant: 'primary',
                            size: 'md',
                            loading: false,
                            className: 'mg-v2-ad-b0kla__admin-card'
                        })}
                        loadingText={ERP_MG_BUTTON_LOADING_TEXT}
                        onClick={() => navigate(ADMIN_ROUTES.COMMON_CODES)}
                        preventDoubleClick={false}
                    >
                        <AdminMgmtCardIcon icon={Tags} tone="gray" />
                        <span className="mg-v2-ad-b0kla__admin-label">{t('admin:AdminDashboard.t_8314805e')}</span>
                        <span className="mg-v2-ad-b0kla__admin-desc">{t('admin:AdminDashboard.t_7af6ac13')}</span>
                    </MGButton>
                    <MGButton
                        type="button"
                        className={buildErpMgButtonClassName({
                            variant: 'primary',
                            size: 'md',
                            loading: false,
                            className: 'mg-v2-ad-b0kla__admin-card'
                        })}
                        loadingText={ERP_MG_BUTTON_LOADING_TEXT}
                        onClick={() => navigate(ADMIN_ROUTES.NOTIFICATIONS)}
                        preventDoubleClick={false}
                    >
                        <AdminMgmtCardIcon icon={Megaphone} tone="blue" />
                        <span className="mg-v2-ad-b0kla__admin-label">{t('admin:AdminDashboard.t_2feecd90')}</span>
                        <span className="mg-v2-ad-b0kla__admin-desc">{t('admin:AdminDashboard.t_74a14a1c')}</span>
                    </MGButton>
                    <MGButton
                        type="button"
                        className={buildErpMgButtonClassName({
                            variant: 'primary',
                            size: 'md',
                            loading: false,
                            className: 'mg-v2-ad-b0kla__admin-card'
                        })}
                        loadingText={ERP_MG_BUTTON_LOADING_TEXT}
                        onClick={() => navigate(ADMIN_ROUTES.DASHBOARDS)}
                        preventDoubleClick={false}
                    >
                        <AdminMgmtCardIcon icon={LayoutDashboard} tone="gray" />
                        <span className="mg-v2-ad-b0kla__admin-label">{t('admin:AdminDashboard.t_d8189860')}</span>
                        <span className="mg-v2-ad-b0kla__admin-desc">{t('admin:AdminDashboard.t_4d9e086e')}</span>
                    </MGButton>
                    <MGButton
                        type="button"
                        className={buildErpMgButtonClassName({
                            variant: 'primary',
                            size: 'md',
                            loading: false,
                            className: 'mg-v2-ad-b0kla__admin-card'
                        })}
                        loadingText={ERP_MG_BUTTON_LOADING_TEXT}
                        onClick={() => navigate(ADMIN_ROUTES.SYSTEM_CONFIG)}
                        preventDoubleClick={false}
                    >
                        <AdminMgmtCardIcon icon={Settings} tone="gray" />
                        <span className="mg-v2-ad-b0kla__admin-label">{t('admin.labels.systemSettings')}</span>
                        <span className="mg-v2-ad-b0kla__admin-desc">{t('admin:AdminDashboard.t_9f21b98f')}</span>
                    </MGButton>
                    <MGButton
                        type="button"
                        className={buildErpMgButtonClassName({
                            variant: 'primary',
                            size: 'md',
                            loading: false,
                            className: 'mg-v2-ad-b0kla__admin-card'
                        })}
                        loadingText={ERP_MG_BUTTON_LOADING_TEXT}
                        onClick={() => navigate(ADMIN_ROUTES.CACHE_MONITORING)}
                        preventDoubleClick={false}
                    >
                        <AdminMgmtCardIcon icon={Database} tone="gray" />
                        <span className="mg-v2-ad-b0kla__admin-label">{t('admin:AdminDashboard.t_487a67da')}</span>
                        <span className="mg-v2-ad-b0kla__admin-desc">{t('admin:AdminDashboard.t_1b5bff7b')}</span>
                    </MGButton>
                    <MGButton
                        type="button"
                        className={buildErpMgButtonClassName({
                            variant: 'primary',
                            size: 'md',
                            loading: false,
                            className: 'mg-v2-ad-b0kla__admin-card'
                        })}
                        loadingText={ERP_MG_BUTTON_LOADING_TEXT}
                        onClick={() => navigate(ADMIN_ROUTES.SECURITY_MONITORING)}
                        preventDoubleClick={false}
                    >
                        <AdminMgmtCardIcon icon={Shield} tone="orange" />
                        <span className="mg-v2-ad-b0kla__admin-label">{t('admin:AdminDashboard.t_131144ac')}</span>
                        <span className="mg-v2-ad-b0kla__admin-desc">{t('admin:AdminDashboard.t_af541421')}</span>
                    </MGButton>
                    <MGButton
                        type="button"
                        className={buildErpMgButtonClassName({
                            variant: 'primary',
                            size: 'md',
                            loading: false,
                            className: 'mg-v2-ad-b0kla__admin-card'
                        })}
                        loadingText={ERP_MG_BUTTON_LOADING_TEXT}
                        onClick={() => navigate(ADMIN_ROUTES.API_PERFORMANCE)}
                        preventDoubleClick={false}
                    >
                        <AdminMgmtCardIcon icon={Activity} tone="green" />
                        <span className="mg-v2-ad-b0kla__admin-label">{t('admin:AdminDashboard.t_f0b0eec7')}</span>
                        <span className="mg-v2-ad-b0kla__admin-desc">{t('admin:AdminDashboard.t_684e9439')}</span>
                    </MGButton>
                    <MGButton
                        type="button"
                        className={buildErpMgButtonClassName({
                            variant: 'primary',
                            size: 'md',
                            loading: false,
                            className: 'mg-v2-ad-b0kla__admin-card'
                        })}
                        loadingText={ERP_MG_BUTTON_LOADING_TEXT}
                        onClick={() => navigate(ADMIN_ROUTES.MESSAGES)}
                        preventDoubleClick={false}
                    >
                        <AdminMgmtCardIcon icon={MessageCircle} tone="blue" />
                        <span className="mg-v2-ad-b0kla__admin-label">{t('admin:AdminDashboard.t_e10a5e2d')}</span>
                        <span className="mg-v2-ad-b0kla__admin-desc">{t('admin:AdminDashboard.t_2d82c7b9')}</span>
                    </MGButton>
                    <MGButton
                        type="button"
                        className={buildErpMgButtonClassName({
                            variant: 'primary',
                            size: 'md',
                            loading: false,
                            className: 'mg-v2-ad-b0kla__admin-card'
                        })}
                        loadingText={ERP_MG_BUTTON_LOADING_TEXT}
                        onClick={() => navigate(ADMIN_ROUTES.PSYCH_ASSESSMENTS)}
                        preventDoubleClick={false}
                    >
                        <AdminMgmtCardIcon icon={Brain} tone="orange" />
                        <span className="mg-v2-ad-b0kla__admin-label">{t('admin:AdminDashboard.t_244d1631')}</span>
                        <span className="mg-v2-ad-b0kla__admin-desc">{t('admin:AdminDashboard.t_83b39c2e')}</span>
                    </MGButton>
                    <MGButton
                        type="button"
                        className={buildErpMgButtonClassName({
                            variant: 'primary',
                            size: 'md',
                            loading: false,
                            className: 'mg-v2-ad-b0kla__admin-card'
                        })}
                        loadingText={ERP_MG_BUTTON_LOADING_TEXT}
                        onClick={handleMergeDuplicateMappings}
                        preventDoubleClick={false}
                    >
                        <AdminMgmtCardIcon icon={Merge} tone="orange" />
                        <span className="mg-v2-ad-b0kla__admin-label">{t('admin:AdminDashboard.t_405c91bb')}</span>
                        <span className="mg-v2-ad-b0kla__admin-desc">{t('admin:AdminDashboard.t_4ab1f2f3')}</span>
                    </MGButton>
                </div>
            </DashboardSection>

            {/* 시스템 상태 */}
            <DashboardSection
                title={t('admin:AdminDashboard.t_86a99580')}
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
                title={t('admin:AdminDashboard.t_e9f4e81d')}
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
            {RoleUtils.isAdmin(propUser || sessionUser) && (
                <DashboardSection
                    title={t('admin:AdminDashboard.t_77eda937')}
                    subtitle="규정 준수 및 보안 관리"
                    icon={<Shield />}
                >
                    <div className="mg-management-grid">
                        <div className="mg-management-card" onClick={() => navigate(ADMIN_ROUTES.COMPLIANCE)}>
                            <div className="mg-management-icon">
                                <i className="bi bi-shield-check" />
                            </div>
                            <h3>{t('admin:AdminDashboard.t_9b717d7e')}</h3>
                            <p className="mg-management-description">{t('admin:AdminDashboard.t_eaa6abdf')}</p>
                        </div>
                        
                        <div className="mg-management-card" onClick={() => navigate(ADMIN_ROUTES.COMPLIANCE_DASHBOARD)}>
                            <div className="mg-management-icon">
                                <i className="bi bi-graph-up" />
                            </div>
                            <h3>{t('admin:AdminDashboard.t_857f68b1')}</h3>
                            <p className="mg-management-description">{t('admin:AdminDashboard.t_642671e1')}</p>
                        </div>
                        
                        <div className="mg-management-card" onClick={() => navigate(ADMIN_ROUTES.COMPLIANCE_DESTRUCTION)}>
                            <div className="mg-management-icon">
                                <i className="bi bi-trash" />
                            </div>
                            <h3>{t('admin:AdminDashboard.t_b6746d96')}</h3>
                            <p className="mg-management-description">{t('admin:AdminDashboard.t_0d9a96f5')}</p>
                        </div>
                    </div>
                </DashboardSection>
            )}

            {/* ERP 관리 */}
            <PermissionGroupGuard groupCode="DASHBOARD_ERP">
                <DashboardSection
                    title={t('admin:AdminDashboard.t_27fbf687')}
                    subtitle="운영·재무 메뉴"
                    icon={<Settings />}
                >
                    <div className="mg-management-grid">
                        <div 
                            className="mg-management-card" 
                            onClick={(e) => {
                                e.preventDefault();
                                e.stopPropagation();
                                console.log('🔗 ERP 대시보드 클릭 - 네비게이션 시작');
                                navigate('/erp/dashboard');
                            }}
                        >
                            <div className="mg-management-icon">
                                <FaChartLine />
                            </div>
                            <h3>{t('admin:AdminDashboard.t_03df899e')}</h3>
                            <p className="mg-management-description">{t('admin:AdminDashboard.t_234f86e4')}</p>
                        </div>
                        
                        <div className="mg-management-card" onClick={() => navigate('/erp/purchase-requests')}>
                            <div className="mg-management-icon">
                                <FaShoppingCart />
                            </div>
                            <h3>{t('admin:AdminDashboard.t_eb7ad905')}</h3>
                            <p className="mg-management-description">{t('admin:AdminDashboard.t_fa037cbe')}</p>
                        </div>
                        
                        <div className="mg-management-card" onClick={() => navigate(buildErpApprovalHubPath('admin'))}>
                            <div className="mg-management-icon">
                                <FaCheckCircle />
                            </div>
                            <h3>{t('admin:AdminDashboard.t_f2fe49d3')}</h3>
                            <p className="mg-management-description">{t('admin:AdminDashboard.t_16d95697')}</p>
                        </div>
                        
                        <div className="mg-management-card" onClick={() => navigate(buildErpApprovalHubPath('super'))}>
                            <div className="mg-management-icon">
                                <FaCheckCircle />
                            </div>
                            <h3>{t('admin:AdminDashboard.t_aa9e8662')}</h3>
                            <p className="mg-management-description">{t('admin:AdminDashboard.t_f92efbf4')}</p>
                        </div>
                        
                        <div className="mg-management-card" onClick={() => navigate('/erp/items')}>
                            <div className="mg-management-icon">
                                <FaBox />
                            </div>
                            <h3>{t('admin:AdminDashboard.t_145d6a1a')}</h3>
                            <p className="mg-management-description">{t('admin:AdminDashboard.t_818316a0')}</p>
                        </div>
                        
                        <div className="mg-management-card" onClick={() => setShowErpReport(true)}>
                            <div className="mg-management-icon">
                                <FaFileExport />
                            </div>
                            <h3>{t('admin:AdminDashboard.t_c2178d4f')}</h3>
                            <p className="mg-management-description">{t('admin:AdminDashboard.t_f8cdc578')}</p>
                        </div>
                        
                        <div className="mg-management-card" onClick={() => navigate('/erp/budgets')}>
                            <div className="mg-management-icon">
                                <FaWallet />
                            </div>
                            <h3>{t('admin:AdminDashboard.t_caa5739a')}</h3>
                            <p className="mg-management-description">{t('admin:AdminDashboard.t_8db0f5af')}</p>
                        </div>
                        
                        <div className="mg-management-card" onClick={() => navigate('/erp/orders')}>
                            <div className="mg-management-icon">
                                <FaTruck />
                            </div>
                            <h3>{t('admin:AdminDashboard.t_0078005e')}</h3>
                            <p className="mg-management-description">{t('admin:AdminDashboard.t_60658851')}</p>
                        </div>
                        
                        <div className="mg-management-card" onClick={() => navigate(ADMIN_ROUTES.ERP_FINANCIAL)}>
                            <div className="mg-management-icon">
                                <FaDollarSign />
                            </div>
                            <h3>{t('admin:AdminDashboard.t_9e80e8e0')}</h3>
                            <p className="mg-management-description">{t('admin:AdminDashboard.t_f4e02772')}</p>
                        </div>
                    </div>
                </DashboardSection>
            </PermissionGroupGuard>

            {/* 통계 및 분석 */}
            <DashboardSection
                    title={t('admin:AdminDashboard.t_8110adef')}
                    subtitle="시스템 통계 및 성과 분석"
                    icon={<BarChart />}
                >
                    <div className="mg-management-grid">
                        <div className="mg-management-card" onClick={() => setShowPerformanceMetrics(true)}>
                            <div className="mg-management-icon">
                                <FaChartBar />
                            </div>
                            <h3>{t('admin:AdminDashboard.t_c3d8bc4e')}</h3>
                            <p className="mg-management-description">{t('admin:AdminDashboard.t_9ef7d6a9')}</p>
                        </div>
                    </div>
                </DashboardSection>

            {/* 상담사 관리 */}
            {PermissionChecks.canManageConsultants(userPermissions) && (
                <DashboardSection
                    title={t('admin.labels.consultantManagement')}
                    subtitle="상담사 정보 및 관리 기능"
                    icon={<Users />}
                >
                    <div className="mg-management-grid">
                        <div className="mg-management-card" onClick={() => setShowSpecialtyManagement(true)}>
                            <div className="mg-management-icon">
                                <FaUserGraduate />
                            </div>
                            <h3>{t('admin:AdminDashboard.t_9894b482')}</h3>
                            <p className="mg-management-description">{t('admin:AdminDashboard.t_2102ff28')}</p>
                        </div>
                    </div>
            </DashboardSection>
            )}

            {/* 내담자 관리 */}
            <DashboardSection
                title={t('admin.labels.clientManagement')}
                subtitle="내담자 정보 및 관리 기능"
                icon={<User />}
            >
                <div className="mg-management-grid">
                    <div className="mg-management-card" onClick={() => navigate(ADMIN_ROUTES.CLIENT_COMPREHENSIVE)}>
                        <div className="mg-management-icon">
                            <FaUsers />
                        </div>
                        <h3>{t('admin:AdminDashboard.t_398d1756')}</h3>
                        <p className="mg-management-description">{t('admin:AdminDashboard.t_43e07fb4')}</p>
                    </div>
                </div>
            </DashboardSection>

            {/* 재무 관리 */}
            {PermissionChecks.canAccessFinance(userPermissions) && (
                <DashboardSection
                    title={t('admin:AdminDashboard.t_98b859f6')}
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
                            <h3>{t('admin:AdminDashboard.t_9eb4bb71')}</h3>
                            <p className="mg-management-description">{t('admin:AdminDashboard.t_7a66b026')}</p>
                        </div>
                    </div>
                </DashboardSection>
            )}

            {/* 토스트 알림 */}
            {showToastState && (
                <div className={`mg-toast mg-toast-${toastType}`}>
                    <div className="mg-toast-header">
                        <strong className="me-auto">{t('admin.labels.notification')}</strong>
                        <MGButton
                            type="button"
                            variant="outline"
                            className={buildErpMgButtonClassName({
                                variant: 'outline',
                                loading: false,
                                className: 'mg-toast-close'
                            })}
                            loadingText={ERP_MG_BUTTON_LOADING_TEXT}
                            onClick={() => setShowToastState(false)}
                            preventDoubleClick={false}
                            aria-label={t('admin:AdminDashboard.t_d7556ddd')}
                        >
                            ×
                        </MGButton>
                    </div>
                    <div className="mg-toast-body">{toastMessage}</div>
                </div>
            )}

            {/* 전문분야 관리 모달 */}
            {showSpecialtyManagement && (
                <SpecialtyManagementModal
                    isOpen={showSpecialtyManagement}
                    onClose={() => setShowSpecialtyManagement(false)}
                />
            )}
            
            {/* 성과 지표 모달 */}
            {showPerformanceMetrics && (
                <PerformanceMetricsModal
                    isOpen={showPerformanceMetrics}
                    onClose={() => setShowPerformanceMetrics(false)}
                />
            )}
            
            {/* 반복 지출 모달 */}
            {showRecurringExpense && (
                <RecurringExpenseModal
                    isOpen={showRecurringExpense}
                    onClose={() => setShowRecurringExpense(false)}
                />
            )}

            {/* 통계 모달 */}
            <UnifiedModal
                isOpen={showStatisticsModal}
                onClose={() => setShowStatisticsModal(false)}
                title={t('admin:AdminDashboard.t_505d75b1')}
                size="large"
                showCloseButton={true}
                backdropClick={true}
                zIndex={10001}
                className="mg-v2-ad-b0kla"
            >
                <StatisticsDashboard
                    userRole={(propUser || sessionUser)?.role || USER_ROLES.ADMIN}
                    userId={(propUser || sessionUser)?.id}
                />
            </UnifiedModal>

            {/* ERP 보고서 모달 */}
            {showErpReport && (
                <ErpReportModal
                    isOpen={showErpReport}
                    onClose={() => setShowErpReport(false)}
                />
            )}

            <MappingDepositModal
                isOpen={!!depositModalMapping}
                onClose={() => setDepositModalMapping(null)}
                mapping={depositModalMapping || {}}
                onDepositConfirmed={() => {
                    setDepositModalMapping(null);
                    loadStats();
                    loadPendingDepositStats();
                }}
            />

            {/* AI 및 시스템 모니터링 - 관리자만 접근 가능 */}
            {(() => {
                const user = propUser || sessionUser;
                const canViewMonitoring = RoleUtils.isAdmin(user);
                console.log('🔍 AI 모니터링 섹션 렌더링 체크:', 
                    'currentRole:', user?.role,
                    'canViewMonitoring:', canViewMonitoring
                );
                return canViewMonitoring;
            })() && (
                <AdminDashboardMonitoring user={propUser || sessionUser} />
            )}

        </div>
        </div>
        <ConfirmModal />
        </SimpleLayout>
    );
};

export default AdminDashboard;
