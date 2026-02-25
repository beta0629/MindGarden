/**
 * Admin Dashboard V2 - 신규 아토믹 디자인 기반 대시보드
 * mindgarden-design-system.pen B0KlA + RESPONSIVE_LAYOUT_SPEC 기반
 * AdminDashboard 핵심 기능·위젯·비즈니스 로직 이전
 *
 * @author CoreSolution
 * @since 2025-02-22
 */

import React, { useState, useEffect, useCallback, useRef } from 'react';
import { getLnbMenus } from '../../utils/menuApi';
import { getLnbTreeFromResponse, normalizeLnbTree } from '../../utils/lnbMenuUtils';
import { useNavigate } from 'react-router-dom';
import notificationManager from '../../utils/notification';
import { RoleUtils } from '../../constants/roles';
import {
  Settings, Check, LayoutDashboard, Activity, MessageSquare, Sparkles,
  ShieldCheck, Megaphone, DollarSign, Receipt, TrendingUp
} from 'lucide-react';
import {
  FaCalendarAlt, FaCalendarCheck, FaSyncAlt, FaExclamationTriangle, FaUserTie, FaUsers,
  FaLink, FaUserCog, FaCog, FaBell, FaDatabase, FaShieldAlt, FaRocket, FaFileAlt, FaCompressAlt
} from 'react-icons/fa';
import UnifiedLoading from '../common/UnifiedLoading';
import StatCard from '../ui/Card/StatCard';
import {
  ContentArea,
  ContentHeader,
  ContentKpiRow,
  ContentSection,
  ContentCard
} from './content';
import { API_BASE_URL } from '../../constants/api';
import StatisticsDashboard from '../admin/StatisticsDashboard';
import SpecialtyManagementModal from '../consultant/SpecialtyManagementModal';
import PerformanceMetricsModal from '../statistics/PerformanceMetricsModal';
import RecurringExpenseModal from '../finance/RecurringExpenseModal';
import ErpReportModal from '../erp/ErpReportModal';
import MappingDepositModal from '../admin/mapping/MappingDepositModal';
import AdminDashboardMonitoring from '../admin/AdminDashboard/AdminDashboardMonitoring';
import UnifiedModal from '../common/modals/UnifiedModal';
import StandardizedApi from '../../utils/standardizedApi';
import Chart from '../common/Chart';
import { CHART_TYPES } from '../../constants/charts';
import {
  CoreFlowPipeline,
  ManualMatchingQueue,
  DepositPendingList,
  SchedulePendingList
} from '../admin/AdminDashboard/index';
import { useSession } from '../../contexts/SessionContext';
import csrfTokenManager from '../../utils/csrfTokenManager';
import { sessionManager } from '../../utils/sessionManager';
import { fetchUserPermissions, PermissionChecks } from '../../utils/permissionUtils';
import { useResponsive } from '../../hooks/useResponsive';
import { DesktopLayout, MobileLayout } from './templates';
import { DEFAULT_MENU_ITEMS, BREAKPOINT_DESKTOP } from './constants/menuItems';
import { ADMIN_ROUTES } from '../../constants/adminRoutes';
import '../../styles/main.css';
import '../../styles/unified-design-tokens.css';
import '../../styles/responsive-layout-tokens.css';
import '../../styles/dashboard-common-v3.css';
import '../../styles/themes/admin-theme.css';
import '../admin/AdminDashboard/AdminDashboardB0KlA.css';
import '../admin/AdminDashboard/AdminDashboardPipeline.css';
const AdminDashboardV2 = ({ user: propUser }) => {
  const navigate = useNavigate();
  const { user: sessionUser, isLoading: sessionLoading, logout } = useSession();
  const { windowSize } = useResponsive();
  const isDesktop = windowSize.width >= BREAKPOINT_DESKTOP;

  const [lnbMenuItems, setLnbMenuItems] = useState(DEFAULT_MENU_ITEMS);

  /** API LNB 메뉴 후처리: 매칭관리→통합 스케줄 센터 치환, 알림을 세 번째 위치로 정렬 */
  const normalizeLnbMenuItemsForDashboard = useCallback((items) => {
    if (!Array.isArray(items) || items.length === 0) return items;
    const replaced = items.map((item) => {
      const isMappingManagement =
        item.to === '/admin/mapping-management' || item.label === '매칭 관리';
      if (isMappingManagement) {
        return { ...item, to: ADMIN_ROUTES.INTEGRATED_SCHEDULE, label: '통합 스케줄 센터' };
      }
      return item;
    });
    const dashboard = replaced.find(
      (i) => i.to === ADMIN_ROUTES.DASHBOARD || i.label === '대시보드'
    );
    const integrated = replaced.find(
      (i) =>
        i.to === ADMIN_ROUTES.INTEGRATED_SCHEDULE || i.label === '통합 스케줄 센터'
    );
    const alarm = replaced.find(
      (i) =>
        i.to === ADMIN_ROUTES.SYSTEM_NOTIFICATIONS || i.label === '알림'
    );
    const rest = replaced.filter(
      (i) => i !== dashboard && i !== integrated && i !== alarm
    );
    return [dashboard, integrated, alarm].filter(Boolean).concat(rest);
  }, []);

  useEffect(() => {
    let cancelled = false;
    getLnbMenus()
      .then((res) => {
        if (cancelled) return;
        const tree = getLnbTreeFromResponse(res);
        if (tree && tree.length > 0) {
          setLnbMenuItems(normalizeLnbMenuItemsForDashboard(normalizeLnbTree(tree)));
        }
      })
      .catch(() => {});
    return () => { cancelled = true; };
  }, [normalizeLnbMenuItemsForDashboard]);

  const getAvatarInitial = (name) => {
    if (!name) return '?';
    if (/[가-힣]/.test(name)) {
      const parts = name.trim().split(/\s+/);
      if (parts.length > 1) {
        return parts[0].charAt(0) + parts[1].charAt(0);
      }
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
  const [chartPeriod, setChartPeriod] = useState('monthly');
  const [searchValue, setSearchValue] = useState('');
  const isInitialized = useRef(false);

  const loadTodayStats = useCallback(async () => {
    const user = propUser || sessionUser;
    if (!user?.role) return;
    try {
      const response = await fetch(
        `${API_BASE_URL}/api/v1/schedules/today/statistics?userRole=${user.role}`,
        { method: 'GET', headers: { 'Content-Type': 'application/json' }, credentials: 'include' }
      );
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
  }, [propUser, sessionUser]);

  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const oauth = urlParams.get('oauth');
    if (oauth === 'success') {
      const userInfo = {
        id: parseInt(urlParams.get('userId')) || 0,
        email: urlParams.get('email') || '',
        name: decodeURIComponent(urlParams.get('name') || ''),
        nickname: decodeURIComponent(urlParams.get('nickname') || ''),
        role: urlParams.get('role') || 'ADMIN',
        profileImageUrl: decodeURIComponent(urlParams.get('profileImage') || ''),
        provider: urlParams.get('provider') || 'UNKNOWN'
      };
      sessionManager.setUser(userInfo, {
        accessToken: 'oauth2_token',
        refreshToken: 'oauth2_refresh_token'
      });
      const cleanUrl = window.location.origin + window.location.pathname;
      window.history.replaceState({}, document.title, cleanUrl);
      sessionManager.checkSession(true);
      return;
    }
    if (isInitialized.current) return;
    const initializeDashboard = async () => {
      try {
        await fetchUserPermissions(setUserPermissions);
        loadTodayStats();
        isInitialized.current = true;
      } catch (error) {
        console.error('AdminDashboardV2 초기화 실패:', error);
        setUserPermissions([]);
        isInitialized.current = true;
      }
    };
    initializeDashboard();
  }, []);

  const showToast = useCallback((message, type = 'success') => {
    setToastMessage(message);
    setToastType(type);
    setShowToastState(true);
    setTimeout(() => setShowToastState(false), 3000);
  }, []);

  const loadStats = useCallback(async () => {
    setLoading(true);
    try {
      const [consultantsRes, clientsRes, mappingsRes, ratingRes, vacationRes, consultationRes] =
        await Promise.all([
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
      let consultantRatingStats = { totalRatings: 0, averageScore: 0, topConsultants: [] };
      let vacationStats = {
        summary: { totalConsultants: 0, totalVacationDays: 0, averageVacationDays: 0 },
        consultantStats: []
      };
      let consultationStats = {
        totalCompleted: 0,
        completionRate: 0,
        averageCompletionTime: 0,
        monthlyData: []
      };

      if (consultantsRes.ok) {
        const d = await consultantsRes.json();
        totalConsultants = d?.data?.count || d?.count || 0;
      }
      if (clientsRes.ok) {
        const d = await clientsRes.json();
        totalClients = d?.data?.count || d?.count || 0;
      }
      if (mappingsRes.ok) {
        const mappingsData = await mappingsRes.json();
        const mappings = mappingsData?.data ?? mappingsData;
        totalMappings = mappingsData?.data?.count || mappingsData?.count || mappings?.count || 0;
        const mappingsList = Array.isArray(mappings?.mappings)
          ? mappings.mappings
          : Array.isArray(mappings?.data)
            ? mappings.data
            : Array.isArray(mappings)
              ? mappings
              : [];
        activeMappings = mappingsList.filter((m) => m.status === 'ACTIVE').length;
      }
      if (ratingRes.ok) {
        const d = await ratingRes.json();
        if (d.success && d.data) {
          consultantRatingStats = {
            totalRatings: d.data.totalRatings || 0,
            averageScore: d.data.averageScore || 0,
            topConsultants: d.data.topConsultants || []
          };
        }
      }
      if (vacationRes.ok) {
        const d = await vacationRes.json();
        if (d.success) {
          vacationStats = {
            summary: d.summary || vacationStats.summary,
            consultantStats: d.consultantStats || []
          };
        }
      }
      if (consultationRes.ok) {
        const d = await consultationRes.json();
        if (d.success && d.data) {
          consultationStats = {
            totalCompleted: d.data?.totalCompleted || 0,
            completionRate: d.data?.completionRate || 0,
            averageCompletionTime: d.data?.averageCompletionTime || 0,
            monthlyData: d.data?.monthlyData || []
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
        if (data.success && data.data?.summary) {
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
      const consultantsRaw =
        consultantsRes?.consultants ?? consultantsRes?.data?.consultants ?? consultantsRes;
      setConsultants(Array.isArray(consultantsRaw) ? consultantsRaw : []);
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
      const oldestHours =
        pendingList.length > 0
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

  const handleConfirmMatch = useCallback(
    async (clientId, consultantId) => {
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
        await Promise.all([
          loadUnassignedClientsAndConsultants(),
          loadStats(),
          loadPendingDepositStats()
        ]);
      } catch (error) {
        const msg =
          error?.message || error?.response?.data?.message || '매칭 생성에 실패했습니다.';
        notificationManager.error(msg);
      }
    },
    [loadUnassignedClientsAndConsultants, loadStats, loadPendingDepositStats]
  );

  const handleAutoCompleteSchedules = async () => {
    try {
      const response = await csrfTokenManager.post('/api/v1/admin/schedules/auto-complete');
      if (response.ok) {
        const result = await response.json();
        showToast(result.message || '스케줄 자동 완료 처리가 완료되었습니다.');
        loadStats();
      } else {
        const err = await response.json();
        showToast(err.message || '스케줄 자동 완료 처리에 실패했습니다.', 'danger');
      }
    } catch (error) {
      console.error('스케줄 자동 완료 처리 실패:', error);
      showToast('스케줄 자동 완료 처리에 실패했습니다.', 'danger');
    }
  };

  const handleAutoCompleteWithReminder = async () => {
    try {
      const response = await csrfTokenManager.post(
        '/api/v1/admin/schedules/auto-complete-with-reminder'
      );
      if (response.ok) {
        const result = await response.json();
        showToast(result.message || '스케줄 자동 완료 처리 및 알림이 완료되었습니다.');
        loadStats();
      } else {
        const err = await response.json();
        showToast(err.message || '스케줄 자동 완료 처리 및 알림에 실패했습니다.', 'danger');
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
      const confirmed = await new Promise((resolve) => {
        notificationManager.confirm(
          `중복된 매칭이 ${checkResult.count}개 발견되었습니다. 통합하시겠습니까?`,
          resolve
        );
      });
      if (!confirmed) return;
      const response = await csrfTokenManager.post('/api/v1/admin/merge-duplicate-mappings');
      if (response.ok) {
        const result = await response.json();
        showToast(result.message || '중복 매칭 통합이 완료되었습니다.');
        loadStats();
        loadRefundStats();
      } else {
        const err = await response.json();
        showToast(err.message || '중복 매칭 통합에 실패했습니다.', 'danger');
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

  const topConsultantsData = (stats.consultantRatingStats?.topConsultants || [])
    .slice(0, 4)
    .map((c) => ({
      name: c.consultantName || '-',
      initial: getAvatarInitial(c.consultantName),
      rating: c.averageScore ? c.averageScore.toFixed(1) : '-',
      barWidth: c.averageScore ? Math.min(100, (c.averageScore / 5) * 100) : 0,
      barColor: 'var(--mg-success-600)'
    }));

  const handleLogout = useCallback(async () => {
    try {
      await logout();
    } catch (e) {
      console.error('로그아웃 실패:', e);
    }
  }, [logout]);

  const layoutProps = {
    menuItems: lnbMenuItems,
    headerTitle: '시스템 관리',
    logoLabel: '코어솔류션',
    searchValue,
    onSearchChange: setSearchValue,
    onBellClick: () => navigate(ADMIN_ROUTES.MESSAGES),
    onLogout: handleLogout
  };

  const kpiItems = [
    {
      id: 'users',
      icon: <FaUsers size={28} />,
      label: '총 사용자',
      value: (stats.totalConsultants + stats.totalClients).toLocaleString(),
      badge: todayStats.totalUsersGrowthRate != null ? `${todayStats.totalUsersGrowthRate > 0 ? '+' : ''}${todayStats.totalUsersGrowthRate}%` : undefined,
      badgeVariant: 'green',
      iconVariant: 'green'
    },
    {
      id: 'booked',
      icon: <FaCalendarAlt size={28} />,
      label: '예약된 상담',
      value: todayStats.totalToday,
      badge: todayStats.bookedGrowthRate != null ? `${todayStats.bookedGrowthRate > 0 ? '+' : ''}${todayStats.bookedGrowthRate}%` : undefined,
      badgeVariant: 'orange',
      iconVariant: 'orange'
    },
    {
      id: 'completion',
      icon: <Check size={28} />,
      label: '완료율',
      value: stats.consultationStats?.completionRate != null ? `${stats.consultationStats.completionRate}%` : todayStats.completedToday,
      badge: stats.consultationStats?.completionRate != null ? `${stats.consultationStats.completionRate}%` : undefined,
      badgeVariant: 'blue',
      iconVariant: 'blue'
    }
  ];

  const mainContent = (
    <ContentArea>
      <ContentHeader title="대시보드 개요" subtitle="오늘의 주요 지표와 현황을 한눈에 확인하세요." />

      <ContentKpiRow items={kpiItems} />

      <ContentCard>
        <CoreFlowPipeline
          stats={{
            totalMappings: stats.totalMappings,
            pendingDepositCount: pendingDepositStats.count,
            activeMappings: stats.activeMappings,
            schedulePendingCount: 0
          }}
        />
      </ContentCard>

      <div className="mg-v2-content-growth-row">
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
          <div className="mg-v2-ad-b0kla__chart-placeholder mg-v2-ad-b0kla__chart-wrapper">
            {stats.consultationStats?.monthlyData?.length > 0 ? (
              <Chart
                type={CHART_TYPES.BAR}
                data={{
                  labels: stats.consultationStats.monthlyData.slice(0, 6).map((d) => d.period),
                  datasets: [
                    {
                      label: '완료 상담',
                      data: stats.consultationStats.monthlyData
                        .slice(0, 6)
                        .map((d) => d.completedCount || 0),
                      backgroundColor: 'var(--ad-b0kla-blue)',
                      borderColor: 'var(--ad-b0kla-green)',
                      borderWidth: 1,
                      borderRadius: 6
                    }
                  ]
                }}
                height="200px"
                options={{
                  maintainAspectRatio: false,
                  plugins: {
                    legend: { display: false },
                    tooltip: {
                      callbacks: {
                        label: (ctx) => `완료: ${ctx.parsed.y}건`
                      }
                    }
                  },
                  scales: {
                    x: {
                      grid: { display: false },
                      ticks: { maxRotation: 0, font: { size: 11 } }
                    },
                    y: {
                      beginAtZero: true,
                      ticks: { stepSize: 1 },
                      grid: { color: 'var(--mg-shadow-light)' }
                    }
                  }
                }}
              />
            ) : (
              <>
                <Activity size={48} className="mg-v2-ad-b0kla__chart-placeholder-icon" />
                <span>차트 영역</span>
                <span className="mg-v2-ad-b0kla__chart-empty-desc">데이터가 없습니다.</span>
              </>
            )}
          </div>
        </div>
        <div className="mg-v2-ad-b0kla__card">
          <h3 className="mg-v2-ad-b0kla__counselor-title">우수 상담사 평점</h3>
          <div className="mg-v2-ad-b0kla__counselor-list">
            {topConsultantsData.length > 0 ? (
              topConsultantsData.map((c) => (
                <div
                  key={`${c.name}-${c.rating}`}
                  className="mg-v2-ad-b0kla__counselor-item"
                >
                  <div className="mg-v2-ad-b0kla__counselor-avatar mg-v2-ad-b0kla__counselor-avatar--green">
                    {c.initial}
                  </div>
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

      <ContentSection
        title="환불 현황"
        subtitle="최근 1개월 환불 통계"
      >
        <div className="mg-stats-grid">
          <StatCard
            icon={<Receipt />}
            value={`${refundStats.totalRefundCount}건`}
            label="환불 건수"
            onClick={() => navigate(`${ADMIN_ROUTES.MAPPING_MANAGEMENT}?tab=refunds`)}
          />
          <StatCard
            icon={<FaCalendarAlt />}
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
      </ContentSection>

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

      <div className="mg-v2-content-detail-row">
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

      <ContentSection
        title="관리 기능"
        subtitle="시스템 관리 및 설정 기능"
      >
        <div className="mg-v2-ad-b0kla__admin-grid mg-v2-ad-b0kla__admin-grid--primary">
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
        <div className="mg-management-grid mg-v2-ad-b0kla__admin-grid">
          <button
            type="button"
            className="mg-v2-ad-b0kla__admin-card"
            onClick={() => navigate(ADMIN_ROUTES.USER_MANAGEMENT)}
          >
            <div className="mg-v2-ad-b0kla__admin-icon mg-v2-ad-b0kla__admin-icon--green">
              <FaUsers size={28} />
            </div>
            <span className="mg-v2-ad-b0kla__admin-label">사용자 관리</span>
            <span className="mg-v2-ad-b0kla__admin-desc">상담사·내담자 통합 관리</span>
          </button>
          <button
            type="button"
            className="mg-v2-ad-b0kla__admin-card"
            onClick={() => navigate(ADMIN_ROUTES.SCHEDULES)}
          >
            <div className="mg-v2-ad-b0kla__admin-icon mg-v2-ad-b0kla__admin-icon--green">
              <FaCalendarAlt size={28} />
            </div>
            <span className="mg-v2-ad-b0kla__admin-label">스케줄 관리</span>
            <span className="mg-v2-ad-b0kla__admin-desc">상담 일정을 관리하고 조정합니다</span>
          </button>
          <button
            type="button"
            className="mg-v2-ad-b0kla__admin-card"
            onClick={() => navigate(ADMIN_ROUTES.SESSIONS)}
          >
            <div className="mg-v2-ad-b0kla__admin-icon mg-v2-ad-b0kla__admin-icon--green">
              <FaCalendarCheck size={28} />
            </div>
            <span className="mg-v2-ad-b0kla__admin-label">회기 관리</span>
            <span className="mg-v2-ad-b0kla__admin-desc">상담 회기를 등록하고 관리합니다</span>
          </button>
          <button
            type="button"
            className="mg-v2-ad-b0kla__admin-card"
            onClick={handleAutoCompleteSchedules}
          >
            <div className="mg-v2-ad-b0kla__admin-icon mg-v2-ad-b0kla__admin-icon--blue">
              <FaSyncAlt size={28} />
            </div>
            <span className="mg-v2-ad-b0kla__admin-label">스케줄 자동 완료</span>
            <span className="mg-v2-ad-b0kla__admin-desc">지난 스케줄을 자동으로 완료 처리합니다</span>
          </button>
          <button
            type="button"
            className="mg-v2-ad-b0kla__admin-card"
            onClick={handleAutoCompleteWithReminder}
          >
            <div className="mg-v2-ad-b0kla__admin-icon mg-v2-ad-b0kla__admin-icon--orange">
              <FaExclamationTriangle size={28} />
            </div>
            <span className="mg-v2-ad-b0kla__admin-label">스케줄 완료 + 알림</span>
            <span className="mg-v2-ad-b0kla__admin-desc">지난 스케줄 완료 처리 및 상담일지 미작성 알림</span>
          </button>
          <button
            type="button"
            className="mg-v2-ad-b0kla__admin-card"
            onClick={() => navigate(ADMIN_ROUTES.CONSULTANT_COMPREHENSIVE)}
          >
            <div className="mg-v2-ad-b0kla__admin-icon mg-v2-ad-b0kla__admin-icon--green">
              <FaUserTie size={28} />
            </div>
            <span className="mg-v2-ad-b0kla__admin-label">상담사 관리</span>
            <span className="mg-v2-ad-b0kla__admin-desc">상담사 정보를 관리합니다</span>
          </button>
          <button
            type="button"
            className="mg-v2-ad-b0kla__admin-card"
            onClick={() => navigate(ADMIN_ROUTES.CLIENT_COMPREHENSIVE)}
          >
            <div className="mg-v2-ad-b0kla__admin-icon mg-v2-ad-b0kla__admin-icon--green">
              <FaUsers size={28} />
            </div>
            <span className="mg-v2-ad-b0kla__admin-label">내담자 관리</span>
            <span className="mg-v2-ad-b0kla__admin-desc">내담자 정보를 관리합니다</span>
          </button>
          <button
            type="button"
            className="mg-v2-ad-b0kla__admin-card"
            onClick={() => navigate(ADMIN_ROUTES.MAPPING_MANAGEMENT)}
          >
            <div className="mg-v2-ad-b0kla__admin-icon mg-v2-ad-b0kla__admin-icon--blue">
              <FaLink size={28} />
            </div>
            <span className="mg-v2-ad-b0kla__admin-label">매칭 시스템</span>
            <span className="mg-v2-ad-b0kla__admin-desc">상담사와 내담자 매칭을 관리합니다</span>
          </button>
          <button
            type="button"
            className="mg-v2-ad-b0kla__admin-card"
            onClick={() => navigate(ADMIN_ROUTES.INTEGRATED_SCHEDULE)}
          >
            <div className="mg-v2-ad-b0kla__admin-icon mg-v2-ad-b0kla__admin-icon--green">
              <FaCalendarCheck size={28} />
            </div>
            <span className="mg-v2-ad-b0kla__admin-label">통합 스케줄링</span>
            <span className="mg-v2-ad-b0kla__admin-desc">매칭 대기자와 캘린더를 한 화면에서 스케줄 등록</span>
          </button>
          {PermissionChecks.canManageUsers(userPermissions) && (
            <button
              type="button"
              className="mg-v2-ad-b0kla__admin-card"
              onClick={() => navigate(ADMIN_ROUTES.USER_MANAGEMENT)}
            >
              <div className="mg-v2-ad-b0kla__admin-icon mg-v2-ad-b0kla__admin-icon--gray">
                <FaUserCog size={28} />
              </div>
              <span className="mg-v2-ad-b0kla__admin-label">사용자 관리</span>
              <span className="mg-v2-ad-b0kla__admin-desc">사용자 역할 변경 및 권한 관리</span>
            </button>
          )}
          <button
            type="button"
            className="mg-v2-ad-b0kla__admin-card"
            onClick={() => navigate(ADMIN_ROUTES.COMMON_CODES)}
          >
            <div className="mg-v2-ad-b0kla__admin-icon mg-v2-ad-b0kla__admin-icon--gray">
              <FaCog size={28} />
            </div>
            <span className="mg-v2-ad-b0kla__admin-label">공통코드</span>
            <span className="mg-v2-ad-b0kla__admin-desc">시스템 공통코드를 관리합니다</span>
          </button>
          <button
            type="button"
            className="mg-v2-ad-b0kla__admin-card"
            onClick={() => navigate(ADMIN_ROUTES.SYSTEM_NOTIFICATIONS)}
          >
            <div className="mg-v2-ad-b0kla__admin-icon mg-v2-ad-b0kla__admin-icon--blue">
              <FaBell size={28} />
            </div>
            <span className="mg-v2-ad-b0kla__admin-label">시스템 공지 관리</span>
            <span className="mg-v2-ad-b0kla__admin-desc">전체/상담사/내담자 공지를 관리합니다</span>
          </button>
          <button
            type="button"
            className="mg-v2-ad-b0kla__admin-card"
            onClick={() => navigate(ADMIN_ROUTES.DASHBOARDS)}
          >
            <div className="mg-v2-ad-b0kla__admin-icon mg-v2-ad-b0kla__admin-icon--blue">
              <LayoutDashboard size={28} />
            </div>
            <span className="mg-v2-ad-b0kla__admin-label">대시보드 관리</span>
            <span className="mg-v2-ad-b0kla__admin-desc">역할별 대시보드를 관리합니다</span>
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
            <span className="mg-v2-ad-b0kla__admin-desc">OpenAI API 키 및 시스템 설정을 관리합니다</span>
          </button>
          <button
            type="button"
            className="mg-v2-ad-b0kla__admin-card"
            onClick={() => navigate(ADMIN_ROUTES.CACHE_MONITORING)}
          >
            <div className="mg-v2-ad-b0kla__admin-icon mg-v2-ad-b0kla__admin-icon--blue">
              <FaDatabase size={28} />
            </div>
            <span className="mg-v2-ad-b0kla__admin-label">캐시 모니터링</span>
            <span className="mg-v2-ad-b0kla__admin-desc">시스템 캐시 성능을 실시간으로 모니터링합니다</span>
          </button>
          <button
            type="button"
            className="mg-v2-ad-b0kla__admin-card"
            onClick={() => navigate(ADMIN_ROUTES.SECURITY_MONITORING)}
          >
            <div className="mg-v2-ad-b0kla__admin-icon mg-v2-ad-b0kla__admin-icon--orange">
              <FaShieldAlt size={28} />
            </div>
            <span className="mg-v2-ad-b0kla__admin-label">보안 모니터링</span>
            <span className="mg-v2-ad-b0kla__admin-desc">실시간 보안 위협 탐지 및 시스템 보안 관리</span>
          </button>
          <button
            type="button"
            className="mg-v2-ad-b0kla__admin-card"
            onClick={() => navigate(ADMIN_ROUTES.API_PERFORMANCE)}
          >
            <div className="mg-v2-ad-b0kla__admin-icon mg-v2-ad-b0kla__admin-icon--blue">
              <FaRocket size={28} />
            </div>
            <span className="mg-v2-ad-b0kla__admin-label">API 성능 모니터링</span>
            <span className="mg-v2-ad-b0kla__admin-desc">API 응답 시간과 성능 지표를 실시간으로 추적합니다</span>
          </button>
          <button
            type="button"
            className="mg-v2-ad-b0kla__admin-card"
            onClick={() => navigate(ADMIN_ROUTES.MESSAGES)}
          >
            <div className="mg-v2-ad-b0kla__admin-icon mg-v2-ad-b0kla__admin-icon--green">
              <MessageSquare size={28} />
            </div>
            <span className="mg-v2-ad-b0kla__admin-label">메시지 관리</span>
            <span className="mg-v2-ad-b0kla__admin-desc">상담사-내담자 메시지를 관리합니다</span>
          </button>
          <button
            type="button"
            className="mg-v2-ad-b0kla__admin-card"
            onClick={() => navigate(ADMIN_ROUTES.PSYCH_ASSESSMENTS)}
          >
            <div className="mg-v2-ad-b0kla__admin-icon mg-v2-ad-b0kla__admin-icon--green">
              <FaFileAlt size={28} />
            </div>
            <span className="mg-v2-ad-b0kla__admin-label">심리검사 리포트(AI)</span>
            <span className="mg-v2-ad-b0kla__admin-desc">TCI/MMPI 업로드 및 리포트 생성을 관리합니다</span>
          </button>
          <button
            type="button"
            className="mg-v2-ad-b0kla__admin-card"
            onClick={() => navigate('/admin/wellness')}
          >
            <div className="mg-v2-ad-b0kla__admin-icon mg-v2-ad-b0kla__admin-icon--orange">
              <Sparkles size={28} />
            </div>
            <span className="mg-v2-ad-b0kla__admin-label">웰니스 알림 관리</span>
            <span className="mg-v2-ad-b0kla__admin-desc">AI 기반 웰니스 컨텐츠 생성 및 비용 관리</span>
          </button>
          <button
            type="button"
            className="mg-v2-ad-b0kla__admin-card"
            onClick={handleMergeDuplicateMappings}
          >
            <div className="mg-v2-ad-b0kla__admin-icon mg-v2-ad-b0kla__admin-icon--gray">
              <FaCompressAlt size={28} />
            </div>
            <span className="mg-v2-ad-b0kla__admin-label">중복 매칭 통합</span>
            <span className="mg-v2-ad-b0kla__admin-desc">중복된 상담사-내담자 매칭을 통합합니다</span>
          </button>
        </div>
      </ContentSection>

      {showToastState && (
        <div className={`mg-toast mg-toast-${toastType}`}>
          <div className="mg-toast-header">
            <strong className="me-auto">알림</strong>
            <button type="button" className="mg-toast-close" onClick={() => setShowToastState(false)} />
          </div>
          <div className="mg-toast-body">{toastMessage}</div>
        </div>
      )}

      {/* 모달들 */}
      {showSpecialtyManagement && (
        <SpecialtyManagementModal
          isOpen={showSpecialtyManagement}
          onClose={() => setShowSpecialtyManagement(false)}
        />
      )}
      {showPerformanceMetrics && (
        <PerformanceMetricsModal
          isOpen={showPerformanceMetrics}
          onClose={() => setShowPerformanceMetrics(false)}
        />
      )}
      {showRecurringExpense && (
        <RecurringExpenseModal
          isOpen={showRecurringExpense}
          onClose={() => setShowRecurringExpense(false)}
        />
      )}
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
      {showErpReport && (
        <ErpReportModal isOpen={showErpReport} onClose={() => setShowErpReport(false)} />
      )}
      <MappingDepositModal
        isOpen={!!depositModalMapping}
        onClose={() => setDepositModalMapping(null)}
        mapping={depositModalMapping || {}}
        onDepositConfirmed={() => {
          setDepositModalMapping(null);
          loadPendingDepositStats();
        }}
      />

      {/* AI 모니터링 */}
      {RoleUtils.isAdmin(propUser || sessionUser) && (
        <AdminDashboardMonitoring user={propUser || sessionUser} />
      )}

      {/* 권한 관리 */}
      {RoleUtils.isAdmin(propUser || sessionUser) && (
        <div className="mg-v2-card mg-mb-lg">
          <div className="mg-flex mg-align-center mg-justify-between">
            <div className="mg-flex mg-align-center mg-gap-sm">
              <FaShieldAlt />
              <div>
                <h3 className="mg-h4 mg-mb-0">권한 관리</h3>
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
    </ContentArea>
  );

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
    <div className="mg-v2-ad-b0kla mg-v2-ad-dashboard-v2">
      {isDesktop ? (
        <DesktopLayout {...layoutProps}>{mainContent}</DesktopLayout>
      ) : (
        <MobileLayout {...layoutProps}>{mainContent}</MobileLayout>
      )}
    </div>
  );
};

export default AdminDashboardV2;
