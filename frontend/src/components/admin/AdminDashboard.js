import React, { useState, useEffect, useCallback, useRef } from 'react';
import Button from '../ui/Button/Button';
import notificationManager from '../../utils/notification';
import { useNavigate } from 'react-router-dom';
import { RoleUtils, USER_ROLES } from '../../constants/roles';
import { WIDGET_CONSTANTS } from '../../constants/widgetConstants';
import { FaUsers, FaUserTie, FaLink, FaCalendarAlt, FaCalendarCheck, FaCog, FaDollarSign, FaChartLine, FaCogs, FaBox, FaShoppingCart, FaCheckCircle, FaWallet, FaTruck, FaSyncAlt, FaExclamationTriangle, FaBuilding, FaMapMarkerAlt, FaUserCog, FaToggleOn, FaCompressAlt, FaChartBar, FaUserGraduate, FaRedo, FaFileExport, FaBell, FaDatabase, FaRocket, FaShieldAlt, FaFileAlt } from 'react-icons/fa';
import { Calendar, CheckCircle, Check, TrendingUp, AlertTriangle, BarChart, Settings, LayoutDashboard, Heart, Trophy, Users, CalendarDays, User, Clock, PieChart, Target, Shield, Activity, Link2, DollarSign, RotateCcw, Receipt, MessageSquare, Sparkles, Search, Bell, Moon, Building, ShieldCheck, Megaphone } from 'lucide-react';
import SimpleLayout from '../layout/SimpleLayout';
import UnifiedLoading from '../../components/common/UnifiedLoading'; // 임시 비활성화
import SystemStatus from './system/SystemStatus';
import DashboardSection from '../layout/DashboardSection';
import StatCard from '../ui/Card/StatCard';
import MGCard from '../common/MGCard';
import { API_BASE_URL } from '../../constants/api';
import SystemTools from './system/SystemTools';
import PermissionManagement from './PermissionManagement';
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
import StandardizedApi from '../../utils/standardizedApi';
import {
  CoreFlowPipeline,
  ManualMatchingQueue,
  DepositPendingList,
  SchedulePendingList
} from './AdminDashboard/index';
import { useSession } from '../../contexts/SessionContext';
import { COMPONENT_CSS } from '../../constants/css-variables';
import csrfTokenManager from '../../utils/csrfTokenManager';
import { sessionManager } from '../../utils/sessionManager';
import { fetchUserPermissions, PermissionChecks } from '../../utils/permissionUtils';
import PermissionGroupGuard from '../common/PermissionGroupGuard';
import '../../styles/main.css';
import '../../styles/unified-design-tokens.css';
import '../../styles/dashboard-tokens-extension.css';
import '../../styles/dashboard-common-v3.css';
import '../../styles/themes/admin-theme.css';
import './AdminDashboard.new.css';
import './AdminDashboard/AdminDashboardPipeline.css';
import './AdminDashboard/AdminDashboardB0KlA.css';
import './system/SystemStatus.css';
import './system/SystemTools.css';
import { ADMIN_ROUTES } from '../../constants/adminRoutes';
import Avatar from '../common/Avatar';

const AdminDashboard = ({ user: propUser }) => {
    const navigate = useNavigate();
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
    const [isPermissionSectionExpanded, setIsPermissionSectionExpanded] = useState(false);
    const [chartPeriod, setChartPeriod] = useState('monthly');
    const [systemStatus, setSystemStatus] = useState({
        server: 'unknown',
        database: 'unknown',
        lastChecked: null
    });
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
                role: urlParams.get('role') || 'ADMIN',
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
                fetch('/api/v1/admin/consultants/with-vacation?date=' + new Date().toISOString().split('T')[0]),
                fetch('/api/v1/admin/clients/with-mapping-info'),
                fetch('/api/v1/admin/mappings'),
                fetch('/api/v1/admin/consultant-rating-stats'),
                fetch('/api/v1/admin/vacation-statistics?period=month'),
                fetch('/api/v1/admin/statistics/consultation-completion')
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
            showToast('통계 데이터 로드에 실패했습니다.', 'danger');
        } finally {
            setLoading(false);
        }
    }, [showToast]);

    const loadRefundStats = useCallback(async () => {
        try {
            const response = await fetch('/api/v1/admin/refund-statistics?period=month');
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

    const loadUnassignedClientsAndConsultants = useCallback(async () => {
        setMatchingQueueLoading(true);
        try {
            const dateStr = new Date().toISOString().split('T')[0];
            const [clientsRes, consultantsRes] = await Promise.all([
                StandardizedApi.get('/api/v1/admin/clients/with-mapping-info'),
                StandardizedApi.get('/api/v1/admin/consultants/with-vacation', { date: dateStr })
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
            notificationManager.error(error?.message || '미배정 내담자 목록을 불러오는데 실패했습니다.');
            setUnassignedClients([]);
            setConsultants([]);
        } finally {
            setMatchingQueueLoading(false);
        }
    }, []);

    const loadPendingDepositStats = useCallback(async () => {
        try {
            const data = await StandardizedApi.get('/api/v1/admin/mappings/pending-deposit');
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
            notificationManager.error(error?.message || '입금 확인 대기 목록을 불러오는데 실패했습니다.');
            setPendingDepositStats({ count: 0, totalAmount: 0, oldestHours: 0 });
            setPendingDepositList([]);
        }
    }, []);

    const handleConfirmMatch = useCallback(async (clientId, consultantId) => {
        try {
            await StandardizedApi.post('/api/v1/admin/mappings', {
                clientId: Number(clientId),
                consultantId: Number(consultantId),
                status: 'PENDING_PAYMENT',
                totalSessions: 1,
                remainingSessions: 1,
                packageName: '초기 상담',
                packagePrice: 0,
                paymentStatus: 'PENDING'
            });
            notificationManager.success('매칭이 성공적으로 생성되었습니다.');
            await Promise.all([loadUnassignedClientsAndConsultants(), loadStats(), loadPendingDepositStats()]);
        } catch (error) {
            const msg = error?.message || error?.response?.data?.message || '매칭 생성에 실패했습니다.';
            notificationManager.error(msg);
        }
    }, [loadUnassignedClientsAndConsultants, loadStats, loadPendingDepositStats]);

    const handleAutoCompleteSchedules = async () => {
        try {
            const response = await csrfTokenManager.post('/api/v1/admin/schedules/auto-complete');

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
            const response = await csrfTokenManager.post('/api/v1/admin/schedules/auto-complete-with-reminder');

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
            const checkResponse = await fetch('/api/v1/admin/duplicate-mappings');
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
            
            const response = await csrfTokenManager.post('/api/v1/admin/merge-duplicate-mappings');

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
        loadUnassignedClientsAndConsultants();
    }, [loadStats, loadRefundStats, loadPendingDepositStats, loadUnassignedClientsAndConsultants]);

    const createTestData = async () => {
        try {
            const response = await csrfTokenManager.post('/api/v1/test/create-test-data');

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
                fetch('/api/v1/health/server'),
                fetch('/api/v1/health/database')
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
            const response = await fetch('/api/v1/admin/logs/recent');
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
            const response = await csrfTokenManager.post('/api/v1/admin/cache/clear');

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
            const response = await csrfTokenManager.post('/api/v1/admin/backup/create');

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
      barColor: '#4b745c'
    }));

    if (sessionLoading) {
        return (
            <div className="admin-dashboard">
                <div className="admin-dashboard-content">
                    <UnifiedLoading type="inline" text="로딩 중..." />
                </div>
            </div>
        );
    }

    return (
        <SimpleLayout title="관리자 대시보드" loading={false}>
        <div className="mg-v2-ad-b0kla">
        <div className="mg-v2-ad-b0kla__container mg-dashboard-layout">
            {/* B0KlA Header */}
            <header className="mg-v2-ad-b0kla__header">
                <div className="mg-v2-ad-b0kla__header-left">
                    <h1>대시보드 개요</h1>
                    <p>오늘의 주요 지표와 현황을 한눈에 확인하세요.</p>
                </div>
                <div className="mg-v2-ad-b0kla__header-right">
                    <div className="mg-v2-ad-b0kla__search">
                        <Search size={18} className="mg-v2-ad-b0kla__search-icon" />
                        <span className="mg-v2-ad-b0kla__search-placeholder">통합 검색...</span>
                    </div>
                    <div className="mg-v2-ad-b0kla__icon-group">
                        <Button
                            variant="outline"
                            size="small"
                            className="mg-v2-ad-b0kla__icon-btn"
                            onClick={() => setShowStatisticsModal(true)}
                            preventDoubleClick={true}
                            aria-label="통계"
                        >
                            <BarChart size={20} />
                        </Button>
                        <button type="button" className="mg-v2-ad-b0kla__icon-btn" aria-label="캘린더">
                            <Calendar size={20} />
                        </button>
                        <button type="button" className="mg-v2-ad-b0kla__icon-btn" aria-label="알림" onClick={() => navigate(ADMIN_ROUTES.MESSAGES)}>
                            <Bell size={20} />
                        </button>
                        <button type="button" className="mg-v2-ad-b0kla__icon-btn" aria-label="테마">
                            <Moon size={20} />
                        </button>
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
                            <span className="mg-v2-ad-b0kla__kpi-label">총 사용자</span>
                            {todayStats.totalUsersGrowthRate !== undefined && (
                                <span className="mg-v2-ad-b0kla__kpi-badge mg-v2-ad-b0kla__kpi-badge--green">
                                    {todayStats.totalUsersGrowthRate > 0 ? '+' : ''}{todayStats.totalUsersGrowthRate}%
                                </span>
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
                            <span className="mg-v2-ad-b0kla__kpi-label">예약된 상담</span>
                            {todayStats.bookedGrowthRate !== undefined && (
                                <span className="mg-v2-ad-b0kla__kpi-badge mg-v2-ad-b0kla__kpi-badge--orange">
                                    {todayStats.bookedGrowthRate > 0 ? '+' : ''}{todayStats.bookedGrowthRate}%
                                </span>
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
                            <span className="mg-v2-ad-b0kla__kpi-label">완료율</span>
                            {stats.consultationStats?.completionRate !== undefined && (
                                <span className="mg-v2-ad-b0kla__kpi-badge mg-v2-ad-b0kla__kpi-badge--blue">
                                    {stats.consultationStats.completionRate}%
                                </span>
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
                            <h3 className="mg-v2-ad-b0kla__chart-title">상담 현황 추이</h3>
                            <p className="mg-v2-ad-b0kla__chart-desc">최근 6개월 간의 예약 및 완료 추이</p>
                        </div>
                        <div className="mg-v2-ad-b0kla__pill-toggle">
                            <button
                                type="button"
                                className={`mg-v2-ad-b0kla__pill ${chartPeriod === 'monthly' ? 'mg-v2-ad-b0kla__pill--active' : ''}`}
                                onClick={() => setChartPeriod('monthly')}
                            >
                                월간
                            </button>
                            <button
                                type="button"
                                className={`mg-v2-ad-b0kla__pill ${chartPeriod === 'weekly' ? 'mg-v2-ad-b0kla__pill--active' : ''}`}
                                onClick={() => setChartPeriod('weekly')}
                            >
                                주간
                            </button>
                        </div>
                    </div>
                    <div className="mg-v2-ad-b0kla__chart-placeholder">
                        {stats.consultationStats?.monthlyData?.length > 0 ? (
                            (() => {
                                const chartData = stats.consultationStats.monthlyData.slice(0, 6);
                                const values = chartData.map((d) => d.completedCount || 0);
                                const allZero = values.length > 0 && values.every((v) => v === 0);
                                if (allZero) {
                                    return (
                                        <p className="mg-v2-ad-b0kla__chart-empty">기간 내 완료된 상담이 없습니다.</p>
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
                                            <span className="mg-v2-ad-b0kla__chart-bar-label">{data.period}</span>
                                        </div>
                                    );
                                })}
                            </div>
                                );
                            })()
                        ) : (
                            <>
                                <Activity size={48} className="mg-v2-ad-b0kla__chart-placeholder-icon" />
                                <span>차트 영역</span>
                            </>
                        )}
                    </div>
                </div>
                <div className="mg-v2-ad-b0kla__card">
                    <h3 className="mg-v2-ad-b0kla__counselor-title">우수 상담사 평점</h3>
                    <div className="mg-v2-ad-b0kla__counselor-list">
                        {topConsultantsData.length > 0 ? (
                            topConsultantsData.map((c, i) => (
                                <div key={i} className="mg-v2-ad-b0kla__counselor-item">
                                    <Avatar
                                        profileImageUrl={c.profileImageUrl}
                                        displayName={c.name}
                                        className="mg-v2-ad-b0kla__counselor-avatar mg-v2-ad-b0kla__counselor-avatar--green"
                                    />
                                    <div className="mg-v2-ad-b0kla__counselor-data">
                                        <span className="mg-v2-ad-b0kla__counselor-name">{c.name}</span>
                                        <div className="mg-v2-ad-b0kla__counselor-rating-row">
                                            <span className="mg-v2-ad-b0kla__counselor-rating">{c.rating}</span>
                                            <div className="mg-v2-ad-b0kla__counselor-bar-track">
                                                <div
                                                    className="mg-v2-ad-b0kla__counselor-bar-fill"
                                                    style={{ width: `${c.barWidth}%`, backgroundColor: c.barColor }}
                                                />
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            ))
                        ) : (
                            <p className="mg-v2-ad-b0kla__counselor-empty">평가 데이터가 없습니다.</p>
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
                title="시스템 개요"
                subtitle="전체 시스템 현황 요약"
                icon={<Activity />}
            >
                <div className="mg-stats-grid">
                    <StatCard
                        icon={<User />}
                        value={stats.totalConsultants}
                        label="상담사"
                        onClick={() => navigate(ADMIN_ROUTES.CONSULTANT_COMPREHENSIVE)}
                    />
                    <StatCard
                        icon={<Users />}
                        value={stats.totalClients}
                        label="내담자"
                        onClick={() => navigate(ADMIN_ROUTES.CLIENT_COMPREHENSIVE)}
                    />
                    <StatCard
                        icon={<Link2 />}
                        value={stats.totalMappings}
                        label="매칭"
                        onClick={() => navigate(ADMIN_ROUTES.MAPPING_MANAGEMENT)}
                    />
                    <StatCard
                        icon={<CheckCircle />}
                        value={stats.activeMappings}
                        label="활성 매칭"
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
                        title="입금 확인 대기 알림"
                        subtitle="결제 확인 완료, 입금 대기 중인 매칭"
                        icon={<AlertTriangle />}
                    >
                        <div className="mg-stats-grid">
                            <StatCard
                                icon={<AlertTriangle />}
                                value={`${pendingDepositStats.count}건`}
                                label="입금 확인 대기"
                                onClick={() => navigate(`${ADMIN_ROUTES.MAPPING_MANAGEMENT}?status=PENDING_PAYMENT`)}
                            />
                            <StatCard
                                icon={<DollarSign />}
                                value={`${pendingDepositStats.totalAmount.toLocaleString()}원`}
                                label="대기 중인 금액"
                                onClick={() => navigate(`${ADMIN_ROUTES.MAPPING_MANAGEMENT}?status=PENDING_PAYMENT`)}
                            />
                            <StatCard
                                icon={<Clock />}
                                value={`${pendingDepositStats.oldestHours}시간`}
                                label="최장 대기 시간"
                                onClick={() => navigate(`${ADMIN_ROUTES.MAPPING_MANAGEMENT}?status=PENDING_PAYMENT`)}
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
                <div className="mg-mb-lg">
                    <div 
                        onClick={() => setIsVacationExpanded(!isVacationExpanded)}
                        className={`mg-v2-card mg-flex mg-align-center mg-justify-between mg-cursor-pointer ${isVacationExpanded ? 'mg-mb-0' : 'mg-mb-md'}`}
                    >
                        <div className="mg-flex mg-align-center mg-gap-sm">
                            <CalendarDays size={20} />
                            <div>
                                <h3 className="mg-v2-section-title">휴가 현황</h3>
                                <p className="mg-v2-section-subtitle">상담사별 휴가 사용 현황 및 통계</p>
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
                    
                    {/* 상담사별 휴가 현황 카드 (표준화 원칙: 테이블 → 카드 전환) */}
                    {stats.vacationStats?.consultantStats && stats.vacationStats.consultantStats.length > 0 && (
                        <div className="mg-vacation-cards-grid">
                            {stats.vacationStats.consultantStats.slice(0, WIDGET_CONSTANTS.DASHBOARD_LIMITS.MAX_ITEMS).map((consultant) => (
                                <MGCard 
                                    key={consultant.consultantId}
                                    variant="default"
                                    className="mg-vacation-card"
                                    onClick={() => navigate(`${ADMIN_ROUTES.CONSULTANT_COMPREHENSIVE}?id=${consultant.consultantId}`)}
                                >
                                    <div className="mg-vacation-card__header">
                                        <div className="mg-flex mg-v2-items-center mg-gap-2">
                                            <Avatar
                                                profileImageUrl={consultant.profileImageUrl}
                                                displayName={consultant.consultantName}
                                                className="mg-avatar mg-avatar-sm mg-avatar-primary mg-v2-consultant-detail-avatar"
                                            />
                                            <div>
                                                <div className="mg-vacation-card__name">{consultant.consultantName}</div>
                                                <div className="mg-vacation-card__email">{consultant.consultantEmail}</div>
                                            </div>
                                        </div>
                                    </div>
                                    <div className="mg-vacation-card__body">
                                        <div className="mg-vacation-card__field">
                                            <span className="mg-vacation-card__label">휴가일수</span>
                                            <span className="mg-v2-badge mg-v2-badge-primary">
                                                {(consultant.vacationDays || 0).toFixed(1)}일
                                            </span>
                                        </div>
                                        <div className="mg-vacation-card__field">
                                            <span className="mg-vacation-card__label">최근 휴가</span>
                                            <div className="mg-flex mg-v2-items-center mg-gap-1">
                                                <Clock size={14} />
                                                <span>
                                                    {consultant.lastVacationDate ? 
                                                        new Date(consultant.lastVacationDate).toLocaleDateString('ko-KR') : 
                                                        '-'
                                                    }
                                                </span>
                                            </div>
                                        </div>
                                    </div>
                                </MGCard>
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
                                    상담사 평가 통계
                                </h3>
                                <p className="mg-v2-text-sm mg-v2-color-text-secondary mg-mb-0">
                                    전체 상담사 평가 현황 및 만족도 지표 (클릭하여 펼치기/접기)
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
                                    label="총 평가 수"
                                    onClick={() => navigate(ADMIN_ROUTES.STATISTICS)}
                                />
                                <StatCard
                                    icon={<Trophy />}
                                    value={(stats.consultantRatingStats?.averageScore || 0).toFixed(1)}
                                    label="전체 평균 점수"
                                    onClick={() => navigate(ADMIN_ROUTES.STATISTICS)}
                                />
                                <StatCard
                                    icon={<Users />}
                                    value={`${stats.consultantRatingStats?.topConsultants?.length || 0}명`}
                                    label="평가받은 상담사"
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
                    title="환불 현황"
                    subtitle="최근 1개월 환불 통계"
                    icon={<RotateCcw />}
                >
                    <div className="mg-stats-grid">
                        <StatCard
                            icon={<Receipt />}
                            value={`${refundStats.totalRefundCount}건`}
                            label="환불 건수"
                            onClick={() => navigate(`${ADMIN_ROUTES.MAPPING_MANAGEMENT}?tab=refunds`)}
                        />
                        <StatCard
                            icon={<Calendar />}
                            value={`${refundStats.totalRefundedSessions}회`}
                            label="환불 회기"
                            onClick={() => navigate(`${ADMIN_ROUTES.MAPPING_MANAGEMENT}?tab=refunds`)}
                        />
                        <StatCard
                            icon={<DollarSign />}
                            value={`${refundStats.totalRefundAmount.toLocaleString()}원`}
                            label="환불 금액"
                            onClick={() => navigate(`${ADMIN_ROUTES.MAPPING_MANAGEMENT}?tab=refunds`)}
                        />
                        <StatCard
                            icon={<TrendingUp />}
                            value={`${refundStats.averageRefundPerCase.toLocaleString()}원`}
                            label="평균 환불액"
                            onClick={() => navigate(`${ADMIN_ROUTES.MAPPING_MANAGEMENT}?tab=refunds`)}
                        />
                    </div>
                </DashboardSection>

            {/* 상담 완료 건수 통계 (어드민/수퍼어드민/지점수퍼어드민) */}
            {RoleUtils.isAdmin(propUser || sessionUser) && (
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
                                onClick={() => navigate(ADMIN_ROUTES.SESSIONS)}
                            />
                            <StatCard
                                icon={<TrendingUp />}
                                value={`${stats.consultationStats?.completionRate || 0}%`}
                                label="완료율"
                                onClick={() => navigate(ADMIN_ROUTES.STATISTICS)}
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
                title="관리 기능"
                subtitle="시스템 관리 및 설정 기능"
                icon={<Settings />}
            >
                <div className="mg-v2-ad-b0kla__admin-grid mg-v2-ad-b0kla__admin-grid--primary">
                    <button
                        type="button"
                        className="mg-v2-ad-b0kla__admin-card"
                        onClick={() => { if (PermissionChecks.canViewHQDashboard(userPermissions)) navigate('/hq/dashboard'); }}
                    >
                        <div className="mg-v2-ad-b0kla__admin-icon mg-v2-ad-b0kla__admin-icon--green">
                            <Building size={28} />
                        </div>
                        <span className="mg-v2-ad-b0kla__admin-label">신규 입주사 등록</span>
                        <span className="mg-v2-ad-b0kla__admin-desc">계약 및 계정 생성</span>
                    </button>
                    <button
                        type="button"
                        className="mg-v2-ad-b0kla__admin-card"
                        onClick={() => navigate(ADMIN_ROUTES.COMPLIANCE)}
                    >
                        <div className="mg-v2-ad-b0kla__admin-icon mg-v2-ad-b0kla__admin-icon--orange">
                            <ShieldCheck size={28} />
                        </div>
                        <span className="mg-v2-ad-b0kla__admin-label">상담사 승인 관리</span>
                        <span className="mg-v2-ad-b0kla__admin-desc">자격 증명 검토</span>
                    </button>
                    <button
                        type="button"
                        className="mg-v2-ad-b0kla__admin-card"
                        onClick={() => navigate(ADMIN_ROUTES.SYSTEM_NOTIFICATIONS)}
                    >
                        <div className="mg-v2-ad-b0kla__admin-icon mg-v2-ad-b0kla__admin-icon--blue">
                            <Megaphone size={28} />
                        </div>
                        <span className="mg-v2-ad-b0kla__admin-label">전체 공지 발송</span>
                        <span className="mg-v2-ad-b0kla__admin-desc">앱 푸시 및 메일</span>
                    </button>
                    <button
                        type="button"
                        className="mg-v2-ad-b0kla__admin-card"
                        onClick={() => navigate(ADMIN_ROUTES.SYSTEM_CONFIG)}
                    >
                        <div className="mg-v2-ad-b0kla__admin-icon mg-v2-ad-b0kla__admin-icon--gray">
                            <Settings size={28} />
                        </div>
                        <span className="mg-v2-ad-b0kla__admin-label">시스템 설정</span>
                        <span className="mg-v2-ad-b0kla__admin-desc">API 및 연동 관리</span>
                    </button>
                </div>
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
                    
                    <div className="mg-management-card" onClick={() => navigate(ADMIN_ROUTES.CLIENT_COMPREHENSIVE)}>
                        <div className="mg-management-icon">
                            <FaUsers />
                        </div>
                        <h3>내담자 관리</h3>
                        <p className="mg-management-description">내담자 정보를 관리합니다</p>
                    </div>
                    
                    {/* 매칭 시스템 - 관리자 대시보드에서 항상 표시 */}
                    <div className="mg-management-card" onClick={() => navigate(ADMIN_ROUTES.MAPPING_MANAGEMENT)}>
                        <div className="mg-management-icon">
                            <FaLink />
                        </div>
                        <h3>매칭 시스템</h3>
                        <p className="mg-management-description">상담사와 내담자 매칭을 관리합니다</p>
                    </div>
                    
                    {PermissionChecks.canManageUsers(userPermissions) && (
                        <div className="mg-management-card" onClick={() => navigate(ADMIN_ROUTES.USER_MANAGEMENT)}>
                            <div className="mg-management-icon">
                                <FaUserCog />
                            </div>
                            <h3>사용자 관리</h3>
                            <p className="mg-management-description">사용자 역할 변경 및 권한 관리</p>
                        </div>
                    )}
                    
                    <div className="mg-management-card" onClick={() => navigate(ADMIN_ROUTES.COMMON_CODES)}>
                        <div className="mg-management-icon">
                            <FaCog />
                        </div>
                        <h3>공통코드</h3>
                        <p className="mg-management-description">시스템 공통코드를 관리합니다</p>
                    </div>
                    
                    <div className="mg-management-card" onClick={() => navigate(ADMIN_ROUTES.SYSTEM_NOTIFICATIONS)}>
                        <div className="mg-management-icon">
                            <FaBell />
                        </div>
                        <h3>시스템 공지 관리</h3>
                        <p className="mg-management-description">전체/상담사/내담자 공지를 관리합니다</p>
                    </div>
                    
                    <div className="mg-management-card" onClick={() => navigate(ADMIN_ROUTES.DASHBOARDS)}>
                        <div className="mg-management-icon">
                            <LayoutDashboard />
                        </div>
                        <h3>대시보드 관리</h3>
                        <p className="mg-management-description">역할별 대시보드를 관리합니다</p>
                    </div>
                    
                    <div className="mg-management-card" onClick={() => navigate(ADMIN_ROUTES.SYSTEM_CONFIG)}>
                        <div className="mg-management-icon">
                            <Settings />
                        </div>
                        <h3>시스템 설정</h3>
                        <p className="mg-management-description">OpenAI API 키 및 시스템 설정을 관리합니다</p>
                    </div>
                    
                    <div className="mg-management-card" onClick={() => navigate(ADMIN_ROUTES.CACHE_MONITORING)}>
                        <div className="mg-management-icon">
                            <FaDatabase />
                        </div>
                        <h3>캐시 모니터링</h3>
                        <p className="mg-management-description">시스템 캐시 성능을 실시간으로 모니터링합니다</p>
                    </div>

                    <div className="mg-management-card" onClick={() => navigate(ADMIN_ROUTES.SECURITY_MONITORING)}>
                        <div className="mg-management-icon">
                            <FaShieldAlt />
                        </div>
                        <h3>보안 모니터링</h3>
                        <p className="mg-management-description">실시간 보안 위협 탐지 및 시스템 보안 관리</p>
                    </div>
                    
                    <div className="mg-management-card" onClick={() => navigate(ADMIN_ROUTES.API_PERFORMANCE)}>
                        <div className="mg-management-icon">
                            <FaRocket />
                        </div>
                        <h3>API 성능 모니터링</h3>
                        <p className="mg-management-description">API 응답 시간과 성능 지표를 실시간으로 추적합니다</p>
                    </div>
                    
                    <div className="mg-management-card" onClick={() => navigate(ADMIN_ROUTES.MESSAGES)}>
                        <div className="mg-management-icon">
                            <MessageSquare />
                        </div>
                        <h3>메시지 관리</h3>
                        <p className="mg-management-description">상담사-내담자 메시지를 관리합니다</p>
                    </div>

                    <div className="mg-management-card" onClick={() => navigate(ADMIN_ROUTES.PSYCH_ASSESSMENTS)}>
                        <div className="mg-management-icon">
                            <FaFileAlt />
                        </div>
                        <h3>심리검사 리포트(AI)</h3>
                        <p className="mg-management-description">TCI/MMPI 업로드 및 리포트 생성을 관리합니다</p>
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
            {RoleUtils.isAdmin(propUser || sessionUser) && (
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
            <PermissionGroupGuard groupCode="DASHBOARD_ERP">
                <DashboardSection
                    title="ERP 관리"
                    subtitle="기업 자원 계획 시스템 관리"
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
                            style={{ cursor: 'pointer' }}
                        >
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
                        
                        {/* ERP 보고서 카드 - 본사 관리자 전용 (동적 권한) */}
                        {PermissionChecks.canViewHQDashboard(userPermissions) && (
                            <div className="mg-management-card" onClick={() => setShowErpReport(true)}>
                                <div className="mg-management-icon">
                                    <FaFileExport />
                                </div>
                                <h3>ERP 보고서</h3>
                                <p className="mg-management-description">월별/분기별/연별 재무 보고서를 생성합니다</p>
                            </div>
                        )}
                        
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
                        
                        <div className="mg-management-card" onClick={() => navigate(ADMIN_ROUTES.ERP_FINANCIAL)}>
                            <div className="mg-management-icon">
                                <FaDollarSign />
                            </div>
                            <h3>통합 재무 관리</h3>
                            <p className="mg-management-description">수입/지출 통합 관리 및 대차대조표</p>
                        </div>
                    </div>
                </DashboardSection>
            </PermissionGroupGuard>

            {/* 지점 관리 */}
            {PermissionChecks.canViewHQDashboard(userPermissions) && (
                <DashboardSection
                    title="지점 관리"
                    subtitle="지점 정보 및 설정 관리"
                    icon={<Settings />}
                >
                    <div className="mg-management-grid">
                        <div className="mg-management-card" onClick={() => navigate('/hq/dashboard')}>
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
            )}

            {/* 통계 및 분석 - 본사 관리자 전용 (동적 권한) */}
            {PermissionChecks.canViewHQDashboard(userPermissions) && (
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

            {/* 내담자 관리 */}
            <DashboardSection
                title="내담자 관리"
                subtitle="내담자 정보 및 관리 기능"
                icon={<User />}
            >
                <div className="mg-management-grid">
                    <div className="mg-management-card" onClick={() => navigate(ADMIN_ROUTES.CLIENT_COMPREHENSIVE)}>
                        <div className="mg-management-icon">
                            <FaUsers />
                        </div>
                        <h3>내담자 종합 관리</h3>
                        <p className="mg-management-description">내담자 정보를 종합적으로 관리합니다</p>
                    </div>
                </div>
            </DashboardSection>

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
                title="통계 대시보드"
                size="large"
                showCloseButton={true}
                backdropClick={true}
                zIndex={10001}
                className="mg-v2-ad-b0kla"
            >
                <StatisticsDashboard
                    userRole={(propUser || sessionUser)?.role || 'ADMIN'}
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

            {/* 권한 관리 - 지점 수퍼 어드민 이상만 접근 가능 */}
            {(() => {
                const user = propUser || sessionUser;
                const canManagePermissions = RoleUtils.isAdmin(user);
                console.log('🔍 권한 관리 섹션 렌더링 체크:', {
                    currentRole: user?.role,
                    canManagePermissions,
                    userPermissions
                });
                return canManagePermissions;
            })() && (
                <div className="mg-v2-card mg-mb-lg">
                    <div className="mg-flex mg-align-center mg-justify-between">
                        <div className="mg-flex mg-align-center mg-gap-sm">
                            <Shield />
                            <div>
                                <h3 className="mg-h4 mg-mb-0">
                                    권한 관리
                                </h3>
                                <p className="mg-v2-text-sm mg-v2-color-text-secondary mg-mb-0">
                                    사용자 권한 설정 및 관리
                                </p>
                            </div>
                        </div>
                        <button 
                            className="mg-v2-button mg-v2-button-primary"
                            onClick={() => navigate('/admin/permissions')}
                        >
                            권한 관리하기
                        </button>
                    </div>
                </div>
            )}

        </div>
        </div>
        </SimpleLayout>
    );
};

export default AdminDashboard;
