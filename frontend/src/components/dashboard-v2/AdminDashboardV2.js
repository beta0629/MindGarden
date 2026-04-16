/**
 * Admin Dashboard V2 - 신규 아토믹 디자인 기반 대시보드
 * mindgarden-design-system.pen B0KlA + RESPONSIVE_LAYOUT_SPEC 기반
 * AdminDashboard 핵심 기능·위젯·비즈니스 로직 이전
 *
 * @author CoreSolution
 * @since 2025-02-22
 */

import React, { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { getLnbMenus } from '../../utils/menuApi';
import {
  deriveGnbQuickNavigateActionsFromLnb,
  getLnbTreeFromResponse,
  mergeSupplementalAdminLnbItems,
  normalizeLnbTree
} from '../../utils/lnbMenuUtils';
import { useNavigate } from 'react-router-dom';
import notificationManager from '../../utils/notification';
import { RoleUtils } from '../../constants/roles';
import { FaCalendarAlt, FaCheckCircle, FaUsers } from 'react-icons/fa';
import {
  Activity,
  Bell,
  BellRing,
  Brain,
  Calendar,
  CalendarDays,
  CheckCircle,
  ClipboardList,
  Database,
  LayoutDashboard,
  Link2,
  Megaphone,
  Merge,
  MessageCircle,
  Package,
  Palette,
  Settings,
  Shield,
  Sparkles,
  Tags,
  Target,
  UserCog,
  UserRound,
  Users
} from 'lucide-react';
import UnifiedLoading from '../common/UnifiedLoading';
import StatCard from '../ui/Card/StatCard';
import {
  ContentArea,
  ContentHeader,
  ContentKpiRow,
  ContentSection,
  ContentCard
} from './content';
import { API_BASE_URL, SCHEDULE_API } from '../../constants/api';
import { getDefaultApiHeaders } from '../../utils/apiHeaders';
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
import { CHART_TYPES, B0KLA_CHART_BAR_FALLBACK, B0KLA_STEP_CHART_HEX } from '../../constants/charts';
import {
  AdminMetricsVisualization,
  ManualMatchingQueue,
  DepositPendingList,
  SchedulePendingList
} from '../admin/AdminDashboard/index';
import { useSession } from '../../contexts/SessionContext';
import csrfTokenManager from '../../utils/csrfTokenManager';
import { sessionManager } from '../../utils/sessionManager';
import { fetchUserPermissions, PermissionChecks } from '../../utils/permissionUtils';
import { useResponsive } from '../../hooks/useResponsive';
import { useBranding } from '../../hooks/useBranding';
import { getTenantGnbLabel } from '../../utils/tenantDisplayName';
import { getGnbLogoUrl } from '../../utils/brandingUtils';
import { DesktopLayout, MobileLayout } from './templates';
import { DEFAULT_MENU_ITEMS, BREAKPOINT_DESKTOP } from './constants/menuItems';
import { ADMIN_ROUTES } from '../../constants/adminRoutes';
import { maskEncryptedDisplay } from '../../utils/codeHelper';
import { toSafeNumber, toDisplayString } from '../../utils/safeDisplay';
import MGButton from '../common/MGButton';
import { buildErpMgButtonClassName, ERP_MG_BUTTON_LOADING_TEXT } from '../erp/common/erpMgButtonProps';
import Icon from '../ui/Icon/Icon';
import '../../styles/main.css';
import '../../styles/unified-design-tokens.css';
import '../../styles/responsive-layout-tokens.css';
import '../../styles/themes/admin-theme.css';
import '../admin/AdminDashboard/AdminDashboardB0KlA.css';
import '../admin/AdminDashboard/AdminDashboardPipeline.css';

/** 단계별 현황 도넛 차트 라벨 (5단계) */
const STEP_CHART_LABELS = [
  '매칭',
  '입금 확인',
  '회기 권한',
  '스케줄 등록',
  '회계처리'
];

/** 차트용 최근 N개월 빈 데이터 (데이터 없을 때 0으로 표시) */
function getEmptyMonthlyChartData(months = 6) {
  const result = [];
  const now = new Date();
  for (let i = months - 1; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    result.push({
      period: `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`,
      completedCount: 0
    });
  }
  return result;
}

/** 대시보드 메뉴(시스템 모니터링, 권한 관리, 환불 현황 등) 숨김 여부 */
const HIDE_DASHBOARD_MENUS = true;

/** 관리 기능 카드 중 숨길 항목 (통합/중복으로 대체된 메뉴) */
const HIDE_ADMIN_CARD_IDS = new Set([
  'sessions',           // 회기 관리
  'schedule-auto-complete',   // 스케줄 자동 완료
  'schedule-complete-reminder', // 스케줄 완료 + 알림
  'consultant-comprehensive',  // 상담사 관리
  'client-comprehensive',     // 내담자 관리
  'dashboards',         // 대시보드 관리
  'cache-monitoring',   // 캐시 모니터링
  'security-monitoring', // 보안 모니터링
  'merge-duplicate-mappings',  // 중복 매칭 통합
  'user-management',    // 사용자 관리 (관리 기능에서 숨김)
  'wellness'            // 웰니스 알림 관리 (관리 기능에서 숨김)
]);

/**
 * period 객체를 차트 라벨 문자열로 변환
 * @param {object} p
 * @returns {string}
 */
function chartPeriodObjectToLabel(p) {
  const { label, value, month, year } = p;
  if (typeof label === 'string') return label;
  if (typeof value === 'string') return value;
  if (typeof month === 'string' && typeof year === 'string') return `${year}-${month}`;
  if (typeof month === 'string') return month;
  if (typeof year === 'string') return year;
  if (label != null) return String(label);
  if (value != null) return String(value);
  try {
    return JSON.stringify(p);
  } catch {
    return '';
  }
}

/** 관리 기능 카드 상단 아이콘 (B0KlA 톤 배지 + Lucide) */
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

/**
 * 차트 X축 라벨용: API가 period를 객체로 줄 때 React/Chart.js에서 객체 자식 오류 방지
 * @param {object} d 월간/주간 데이터 행
 * @returns {string}
 */
function formatChartPeriodLabel(d) {
  const p = d?.period;
  if (p == null) return '';
  if (typeof p !== 'object') return String(p);
  return chartPeriodObjectToLabel(p);
}

/** 차트용 최근 N주 빈 데이터 (데이터 없을 때 0으로 표시) */
function getEmptyWeeklyChartData(weeks = 6) {
  const result = [];
  const now = new Date();
  for (let i = weeks - 1; i >= 0; i--) {
    const d = new Date(now);
    d.setDate(d.getDate() - i * 7);
    const m = d.getMonth() + 1;
    const day = d.getDate();
    result.push({
      period: `${String(m).padStart(2, '0')}/${String(day).padStart(2, '0')}`,
      completedCount: 0
    });
  }
  return result;
}

const AdminDashboardV2 = ({ user: propUser }) => {
  const navigate = useNavigate();
  const { user: sessionUser, isLoading: sessionLoading, logout, hasRole } = useSession();
  const dashboardUser = propUser || sessionUser;
  const { brandingInfo, isLoading: isBrandingLoading } = useBranding({
    autoLoad: Boolean(dashboardUser)
  });
  const logoLabel = useMemo(
    () => getTenantGnbLabel(dashboardUser, brandingInfo),
    [dashboardUser, brandingInfo]
  );
  const logoUrl = useMemo(
    () => getGnbLogoUrl(brandingInfo),
    [brandingInfo]
  );
  const { windowSize } = useResponsive();
  const isDesktop = windowSize.width >= BREAKPOINT_DESKTOP;

  const canManageClients = hasRole('ADMIN') || hasRole('STAFF');

  const [lnbMenuItems, setLnbMenuItems] = useState(null);

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
        i.to === ADMIN_ROUTES.NOTIFICATIONS || i.to === ADMIN_ROUTES.SYSTEM_NOTIFICATIONS || i.label === '알림' || i.label === '알림·메시지 관리'
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
          setLnbMenuItems(
            normalizeLnbMenuItemsForDashboard(
              mergeSupplementalAdminLnbItems(normalizeLnbTree(tree))
            )
          );
        }
      })
      .catch(() => {
        if (!cancelled) setLnbMenuItems(DEFAULT_MENU_ITEMS);
      });
    return () => { cancelled = true; };
  }, [normalizeLnbMenuItemsForDashboard]);

  const [userPermissions, setUserPermissions] = useState([]);
  const [stats, setStats] = useState({
    totalConsultants: 0,
    totalClients: 0,
    totalMappings: 0,
    activeMappings: 0,
    /** 스케줄 등록 대기(의견수렴) 건수. GET /api/v1/admin/schedules/statistics 연동 */
    schedulePendingCount: null,
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
      completionRateChange: null,
      averageCompletionTime: 0,
      monthlyData: [],
      weeklyData: [],
      /** 상담사별 완료 건수/완료율 (consultation-completion API statistics) */
      consultantStatistics: []
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
    cancelledToday: 0,
    bookedToday: 0,
    confirmedToday: 0,
    bookedGrowthRate: null,
    totalUsersGrowthRate: null
  });
  const [loading, setLoading] = useState(false);
  const [showToastState, setShowToastState] = useState(false);
  const [toastMessage, setToastMessage] = useState('');
  const [toastType, setToastType] = useState('success');
  const [autoCompleteLoading, setAutoCompleteLoading] = useState(false);
  const [autoCompleteWithReminderLoading, setAutoCompleteWithReminderLoading] = useState(false);
  const [mergeDuplicateLoading, setMergeDuplicateLoading] = useState(false);
  const [chartPeriod, setChartPeriod] = useState('monthly');
  const [lineChartPeriod, setLineChartPeriod] = useState('monthly');
  /** 상담사 별 통합데이터 뷰: 'table' | 'graph' | 'progress', 기본 프로그레스 바 */
  const [integratedDataView, setIntegratedDataView] = useState('progress');
  /** 상담사 통합데이터 집계 기간: 'all' | 'month' | 'year'. TODO: 년도별은 현재 전체와 동일 동작. consultation-completion에 year 파라미터 지원 시 연동 예정 (ADMIN_DASHBOARD_V2_INTEGRATED_DATA_PERIOD_AND_RANK_PULSE_PLAN Phase 1). */
  const [integratedDataPeriodType, setIntegratedDataPeriodType] = useState('all');
  const [integratedDataYear, setIntegratedDataYear] = useState(() => new Date().getFullYear());
  const [integratedDataMonth, setIntegratedDataMonth] = useState(() => new Date().getMonth() + 1);
  /** 기간별 consultation-completion 결과(월별 선택 시 전용) */
  const [integratedDataConsultationStats, setIntegratedDataConsultationStats] = useState(null);
  /** 순위 변동 펄스: 상승/하락한 consultantId Set */
  const [integratedDataRankUpSet, setIntegratedDataRankUpSet] = useState(() => new Set());
  const [integratedDataRankDownSet, setIntegratedDataRankDownSet] = useState(() => new Set());
  const previousRankByConsultantIdRef = useRef(new Map());
  const [searchValue, setSearchValue] = useState('');
  /** 헤더 통합 검색(placeholder 전용, 라우트/메뉴 연동 없음) */
  /** 상담 현황 추이 막대 차트 색상 (CSS 변수 resolved, Canvas용) */
  const [chartBarColors, setChartBarColors] = useState({
    fill: B0KLA_CHART_BAR_FALLBACK.FILL,
    border: B0KLA_CHART_BAR_FALLBACK.BORDER
  });
  const chartBarWrapperRef = useRef(null);
  const lineChartWrapperRef = useRef(null);
  const isInitialized = useRef(false);

  /** B0KlA 차트 막대/라인 색상: CSS 변수를 resolved 값(hex/rgb)으로 읽어 Canvas에 전달 */
  useEffect(() => {
    const el = chartBarWrapperRef.current || lineChartWrapperRef.current || document.documentElement;
    const style = el && typeof getComputedStyle !== 'undefined' ? getComputedStyle(el) : null;
    if (!style) return;
    const fill = style.getPropertyValue('--ad-b0kla-green').trim();
    const border = style.getPropertyValue('--ad-b0kla-blue').trim();
    setChartBarColors({
      fill: fill || B0KLA_CHART_BAR_FALLBACK.FILL,
      border: border || B0KLA_CHART_BAR_FALLBACK.BORDER
    });
  }, [chartPeriod, lineChartPeriod]);

  const loadTodayStats = useCallback(async() => {
    const user = propUser || sessionUser;
    if (!user?.role) return;
    try {
      const headers = { 'Content-Type': 'application/json', ...getDefaultApiHeaders() };
      const response = await fetch(
        `${API_BASE_URL}/api/v1/schedules/today/statistics?userRole=${user.role}`,
        { method: 'GET', headers, credentials: 'include' }
      );
      if (response.ok) {
        const data = await response.json();
        const payload = data?.data != null ? data.data : data;
        setTodayStats({
          totalToday: payload.totalToday ?? 0,
          completedToday: payload.completedToday ?? 0,
          inProgressToday: payload.inProgressToday ?? 0,
          cancelledToday: payload.cancelledToday ?? 0,
          bookedToday: payload.bookedToday ?? 0,
          confirmedToday: payload.confirmedToday ?? 0,
          bookedGrowthRate: payload.bookedGrowthRate != null ? payload.bookedGrowthRate : null,
          totalUsersGrowthRate: payload.totalUsersGrowthRate != null ? payload.totalUsersGrowthRate : null
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
    const initializeDashboard = async() => {
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

  const loadStats = useCallback(async() => {
    setLoading(true);
    try {
      const headers = { 'Content-Type': 'application/json', ...getDefaultApiHeaders() };
      /** fetch 실패(rejected) 시 res.ok 체크를 통과하지 않도록 쓰는 더미 */
      const dummyFailedResponse = () => ({ ok: false, json: () => Promise.resolve({}) });
      const settled = await Promise.allSettled([
        fetch(`/api/v1/admin/consultants/with-vacation?date=${new Date().toISOString().split('T')[0]}`, { headers, credentials: 'include' }),
        fetch('/api/v1/admin/clients/with-mapping-info', { headers, credentials: 'include' }),
        fetch('/api/v1/admin/mappings', { headers, credentials: 'include' }),
        fetch('/api/v1/admin/consultant-rating-stats', { headers, credentials: 'include' }),
        fetch('/api/v1/admin/vacation-statistics?period=month', { headers, credentials: 'include' }),
        fetch('/api/v1/admin/statistics/consultation-completion', { headers, credentials: 'include' }),
        fetch(SCHEDULE_API.STATISTICS, { headers, credentials: 'include' })
      ]);
      const consultantsRes = settled[0].status === 'fulfilled' ? settled[0].value : dummyFailedResponse();
      const clientsRes = settled[1].status === 'fulfilled' ? settled[1].value : dummyFailedResponse();
      const mappingsRes = settled[2].status === 'fulfilled' ? settled[2].value : dummyFailedResponse();
      const ratingRes = settled[3].status === 'fulfilled' ? settled[3].value : dummyFailedResponse();
      const vacationRes = settled[4].status === 'fulfilled' ? settled[4].value : dummyFailedResponse();
      const consultationRes = settled[5].status === 'fulfilled' ? settled[5].value : dummyFailedResponse();
      const scheduleStatsRes = settled[6].status === 'fulfilled' ? settled[6].value : dummyFailedResponse();

      // [Dashboard Charts] consultation-completion 호출 결과(상담 현황 추이/예약 vs 완료 차트용)
      if (settled[5].status === 'rejected') {
        console.warn('[Dashboard Charts] consultation-completion 요청 실패 (rejected):', settled[5].reason);
      } else {
        const res = settled[5].value;
        console.log('[Dashboard Charts] consultation-completion 응답:', {
          status: res.status,
          ok: res.ok,
          statusText: res.statusText
        });
      }

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
        monthlyData: [],
        weeklyData: [],
        consultantStatistics: []
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
        const mappingsPayload = mappingsData?.data != null ? mappingsData.data : mappingsData;
        const mappingsList = Array.isArray(mappingsPayload?.mappings)
          ? mappingsPayload.mappings
          : Array.isArray(mappingsPayload?.data)
            ? mappingsPayload.data
            : Array.isArray(mappingsPayload)
              ? mappingsPayload
              : [];
        totalMappings = mappingsPayload?.count ?? mappingsData?.data?.count ?? mappingsData?.count ?? mappingsList.length;
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
        const payload = d?.data != null ? d.data : d;
        if (payload != null) {
          consultationStats = {
            totalCompleted: payload.totalCompleted ?? 0,
            completionRate: payload.completionRate ?? 0,
            completionRateChange: payload.completionRateChange != null ? payload.completionRateChange : null,
            averageCompletionTime: payload.averageCompletionTime ?? 0,
            monthlyData: Array.isArray(payload.monthlyData) ? payload.monthlyData : [],
            weeklyData: Array.isArray(payload.weeklyData) ? payload.weeklyData : [],
            consultantStatistics: Array.isArray(payload.statistics) ? payload.statistics : []
          };
        }
        console.log('[Dashboard Charts] consultation-completion payload:', {
          monthlyDataLength: consultationStats.monthlyData?.length ?? 0,
          weeklyDataLength: consultationStats.weeklyData?.length ?? 0,
          monthlySample: consultationStats.monthlyData?.[0],
          weeklySample: consultationStats.weeklyData?.[0]
        });
      } else {
        console.warn('[Dashboard Charts] consultation-completion 응답이 ok가 아님 (차트 데이터 미적용). status:', consultationRes.status);
      }

      let schedulePendingCount = null;
      if (scheduleStatsRes.ok) {
        try {
          const d = await scheduleStatsRes.json();
          const payload = d?.data != null ? d.data : d;
          if (payload != null) {
            const booked = payload.bookedSchedules;
            const { statusCount } = payload;
            if (typeof booked === 'number') {
              schedulePendingCount = booked;
            } else if (statusCount && typeof statusCount.BOOKED === 'number') {
              schedulePendingCount = statusCount.BOOKED;
            } else if (statusCount && typeof statusCount.BOOKED === 'string') {
              schedulePendingCount = parseInt(statusCount.BOOKED, 10) || 0;
            }
          }
        } catch (e) {
          console.error('스케줄 통계 파싱 실패:', e);
        }
      }

      setStats({
        totalConsultants,
        totalClients,
        totalMappings,
        activeMappings,
        schedulePendingCount,
        consultantRatingStats,
        vacationStats,
        consultationStats
      });
      const user = propUser || sessionUser;
      if (user?.role) loadTodayStats();
    } catch (error) {
      console.error('통계 데이터 로드 실패:', error);
      showToast('통계 데이터 로드에 실패했습니다.', 'danger');
    } finally {
      setLoading(false);
    }
  }, [showToast, propUser, sessionUser, loadTodayStats]);

  const loadRefundStats = useCallback(async() => {
    try {
      const headers = { 'Content-Type': 'application/json', ...getDefaultApiHeaders() };
      const response = await fetch('/api/v1/admin/refund-statistics?period=month', { headers, credentials: 'include' });
      if (response.ok) {
        const data = await response.json();
        const summary = data?.data?.summary ?? data?.summary;
        if (summary) {
          setRefundStats({
            totalRefundCount: summary.totalRefundCount ?? 0,
            totalRefundedSessions: summary.totalRefundedSessions ?? 0,
            totalRefundAmount: summary.totalRefundAmount ?? 0,
            averageRefundPerCase: summary.averageRefundPerCase ?? 0
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

  const loadPendingDepositStats = useCallback(async() => {
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
    async(clientId, consultantId) => {
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

  const handleAutoCompleteSchedules = async() => {
    setAutoCompleteLoading(true);
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
    } finally {
      setAutoCompleteLoading(false);
    }
  };

  const handleAutoCompleteWithReminder = async() => {
    setAutoCompleteWithReminderLoading(true);
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
    } finally {
      setAutoCompleteWithReminderLoading(false);
    }
  };

  const handleMergeDuplicateMappings = async() => {
    setMergeDuplicateLoading(true);
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
    } finally {
      setMergeDuplicateLoading(false);
    }
  };

  useEffect(() => {
    loadStats();
    loadRefundStats();
    loadPendingDepositStats();
    loadUnassignedClientsAndConsultants();
    if (!sessionLoading) {
      const user = propUser || sessionUser;
      if (user?.role) loadTodayStats();
    }
  }, [
    loadStats,
    loadRefundStats,
    loadPendingDepositStats,
    loadUnassignedClientsAndConsultants,
    sessionLoading,
    sessionUser,
    propUser,
    loadTodayStats
  ]);

  /** 상담사/내담자 등록·예약 확정 등 시 대시보드 KPI 및 오늘 통계 재조회 */
  useEffect(() => {
    const handler = () => {
      loadStats();
      loadTodayStats();
    };
    window.addEventListener('admin-dashboard-refresh-stats', handler);
    return () => window.removeEventListener('admin-dashboard-refresh-stats', handler);
  }, [loadStats, loadTodayStats]);

  /** 탭 포커스 복귀 시 KPI 한 번 재조회 (다른 탭에서 등록 후 돌아온 경우 등) */
  useEffect(() => {
    const handler = () => {
      if (document.visibilityState === 'visible') loadStats();
    };
    document.addEventListener('visibilitychange', handler);
    return () => document.removeEventListener('visibilitychange', handler);
  }, [loadStats]);

  /** 세션 준비 시 오늘 통계 로드 보장 (첫 로딩에 sessionUser 지연으로 loadTodayStats 미호출 방지) */
  useEffect(() => {
    if (sessionLoading) return;
    const user = propUser || sessionUser;
    if (user?.role) loadTodayStats();
  }, [sessionLoading, propUser, sessionUser, loadTodayStats]);

  /** 상담사 통합데이터 전용: 월별 선택 시 consultation-completion?period=YYYY-MM 호출 */
  useEffect(() => {
    if (integratedDataPeriodType !== 'month') {
      setIntegratedDataConsultationStats(null);
      return;
    }
    const period = `${integratedDataYear}-${String(integratedDataMonth).padStart(2, '0')}`;
    const headers = { 'Content-Type': 'application/json', ...getDefaultApiHeaders() };
    fetch(`/api/v1/admin/statistics/consultation-completion?period=${period}`, { headers, credentials: 'include' })
      .then((res) => res.ok ? res.json() : null)
      .then((d) => {
        const payload = d?.data != null ? d.data : d;
        if (payload && Array.isArray(payload.statistics)) {
          setIntegratedDataConsultationStats({ consultantStatistics: payload.statistics });
        } else {
          setIntegratedDataConsultationStats({ consultantStatistics: [] });
        }
      })
      .catch(() => setIntegratedDataConsultationStats({ consultantStatistics: [] }));
  }, [integratedDataPeriodType, integratedDataYear, integratedDataMonth]);

  /** 상담사 별 통합데이터: 평점(topConsultants) + 완료 통계(consultantStatistics)를 consultantId 기준 머지. 표시 이름은 API 복호화된 consultantName 사용. */
  const completionListForIntegrated = integratedDataPeriodType === 'month' && integratedDataConsultationStats
    ? (integratedDataConsultationStats.consultantStatistics || [])
    : (stats.consultationStats?.consultantStatistics || []);

  const consultantIntegratedData = (() => {
    const byConsultantId = new Map();
    const completionList = completionListForIntegrated;
    completionList.forEach((s, idx) => {
      const key = s.consultantId != null ? String(s.consultantId) : `noid-c-${idx}`;
      const completedCount = toSafeNumber(s.completedCount, 0);
      const totalCount = toSafeNumber(s.totalCount, 0);
      const completionRate =
        s.completionRate != null
          ? toSafeNumber(s.completionRate, 0)
          : totalCount > 0
            ? Math.round((completedCount / totalCount) * 100)
            : 0;
      byConsultantId.set(key, {
        consultantName: s.consultantName || '-',
        consultantId: s.consultantId,
        rating: null,
        completedCount,
        totalCount,
        completionRate
      });
    });
    const topList = stats.consultantRatingStats?.topConsultants || [];
    topList.forEach((c, idx) => {
      const key = c.consultantId != null ? String(c.consultantId) : `noid-r-${idx}`;
      const ratingRaw = c.averageHeartScore ?? c.averageScore;
      const rating = ratingRaw != null ? toSafeNumber(ratingRaw, NaN) : NaN;
      if (byConsultantId.has(key)) {
        const row = byConsultantId.get(key);
        row.rating = Number.isFinite(rating) ? rating : null;
        if ((c.consultantName != null && c.consultantName !== '-') && (row.consultantName == null || row.consultantName === '-')) {
          row.consultantName = c.consultantName;
        }
      } else {
        byConsultantId.set(key, {
          consultantName: c.consultantName || '-',
          consultantId: c.consultantId,
          rating: Number.isFinite(rating) ? rating : null,
          completedCount: 0,
          totalCount: 0,
          completionRate: 0
        });
      }
    });
    return Array.from(byConsultantId.values())
      .sort((a, b) => (b.completedCount - a.completedCount) || ((b.rating ?? 0) - (a.rating ?? 0)))
      .slice(0, 10);
  })();

  /** 순위 변동 감지: 이전 순위와 비교해 rankUp/rankDown Set 갱신 후 ref 업데이트, 2초 뒤 펄스 클래스용 Set 초기화 */
  const integratedDataRankSignature = consultantIntegratedData.map((r) => r.consultantId).join(',');
  useEffect(() => {
    const current = consultantIntegratedData.map((row, i) => ({ consultantId: row.consultantId, rank: i + 1 }));
    const prev = previousRankByConsultantIdRef.current;
    const rankUp = new Set();
    const rankDown = new Set();
    current.forEach(({ consultantId, rank }) => {
      if (consultantId == null) return;
      const prevRank = prev.get(consultantId);
      if (prevRank != null && prevRank !== rank) {
        if (rank < prevRank) rankUp.add(consultantId);
        else rankDown.add(consultantId);
      }
    });
    const nextMap = new Map(current.map(({ consultantId, rank }) => [consultantId, rank]).filter(([id]) => id != null));
    previousRankByConsultantIdRef.current = nextMap;
    setIntegratedDataRankUpSet(rankUp);
    setIntegratedDataRankDownSet(rankDown);
    const t = setTimeout(() => {
      setIntegratedDataRankUpSet(new Set());
      setIntegratedDataRankDownSet(new Set());
    }, 2000);
    return () => clearTimeout(t);
  }, [integratedDataRankSignature]);

  const handleLogout = useCallback(async() => {
    try {
      await logout();
    } catch (e) {
      console.error('로그아웃 실패:', e);
    }
  }, [logout]);

  const dashboardMenuItems = lnbMenuItems ?? DEFAULT_MENU_ITEMS;
  const navigateQuickActionsFromLnb = useMemo(
    () => deriveGnbQuickNavigateActionsFromLnb(dashboardMenuItems),
    [dashboardMenuItems]
  );

  const layoutProps = {
    menuItems: dashboardMenuItems,
    headerTitle: '시스템 관리',
    logoLabel,
    logoUrl,
    logoBrandingLoading: isBrandingLoading,
    searchValue,
    onSearchChange: setSearchValue,
    onBellClick: () => navigate(ADMIN_ROUTES.MESSAGES),
    onLogout: handleLogout,
    navigateQuickActionsFromLnb
  };

  const kpiItems = [
    {
      id: 'users',
      icon: <FaUsers size={28} />,
      label: '총 사용자',
      value: (stats.totalConsultants + stats.totalClients).toLocaleString(),
      subtitle: `상담사 ${stats.totalConsultants} · 내담자 ${stats.totalClients}`,
      subtitleBadge: todayStats.totalUsersGrowthRate != null
        ? (todayStats.totalUsersGrowthRate === 0 ? '변동 없음' : `${todayStats.totalUsersGrowthRate > 0 ? '+' : ''}${todayStats.totalUsersGrowthRate}%`)
        : '-',
      badge: todayStats.totalUsersGrowthRate != null
        ? (todayStats.totalUsersGrowthRate === 0 ? '변동 없음' : `${todayStats.totalUsersGrowthRate > 0 ? '+' : ''}${todayStats.totalUsersGrowthRate}%`)
        : '-',
      badgeVariant: 'green',
      iconVariant: 'green'
    },
    {
      id: 'booked',
      icon: <FaCalendarAlt size={28} />,
      label: '예약된 상담',
      value: toSafeNumber(todayStats.bookedToday, 0) + toSafeNumber(todayStats.confirmedToday, 0),
      badge: todayStats.bookedGrowthRate != null
        ? (todayStats.bookedGrowthRate === 0 ? '변동 없음' : `${todayStats.bookedGrowthRate > 0 ? '+' : ''}${todayStats.bookedGrowthRate}%`)
        : '-',
      badgeVariant: 'orange',
      iconVariant: 'orange'
    },
    {
      id: 'completion',
      icon: <FaCheckCircle size={28} aria-hidden />,
      label: '완료율',
      value: stats.consultationStats?.completionRate != null ? `${stats.consultationStats.completionRate}%` : 'N/A',
      subtitle: stats.consultationStats?.completionRate == null && todayStats.completedToday != null
        ? `오늘 완료 ${todayStats.completedToday}건`
        : undefined,
      badge: stats.consultationStats?.completionRateChange != null
        ? `${stats.consultationStats.completionRateChange > 0 ? '+' : ''}${stats.consultationStats.completionRateChange}%`
        : undefined,
      badgeTitle: stats.consultationStats?.completionRateChange != null ? '전월 대비 변동' : undefined,
      badgeVariant: 'blue',
      iconVariant: 'blue'
    }
  ];

  const HEADER_ICON_SIZE = 20;

  const headerActions = (
      <div className="mg-v2-ad-b0kla__header-actions">
        <div className="mg-v2-ad-b0kla__icon-group">
          <MGButton
            type="button"
            variant="outline"
            size="small"
            className={buildErpMgButtonClassName({ variant: 'outline', size: 'sm', loading: false, className: 'mg-v2-ad-b0kla__icon-btn' })}
            loadingText={ERP_MG_BUTTON_LOADING_TEXT}
            onClick={() => navigate(ADMIN_ROUTES.INTEGRATED_SCHEDULE)}
            aria-label="일정"
            title="일정"
            preventDoubleClick={false}
          >
            <Calendar size={HEADER_ICON_SIZE} strokeWidth={2} aria-hidden />
          </MGButton>
          <MGButton
            type="button"
            variant="outline"
            size="small"
            className={buildErpMgButtonClassName({ variant: 'outline', size: 'sm', loading: false, className: 'mg-v2-ad-b0kla__icon-btn' })}
            loadingText={ERP_MG_BUTTON_LOADING_TEXT}
            onClick={() => navigate(ADMIN_ROUTES.MESSAGES)}
            aria-label="알림"
            title="알림"
            preventDoubleClick={false}
          >
            <Bell size={HEADER_ICON_SIZE} strokeWidth={2} aria-hidden />
          </MGButton>
          <MGButton
            type="button"
            variant="outline"
            size="small"
            className={buildErpMgButtonClassName({ variant: 'outline', size: 'sm', loading: false, className: 'mg-v2-ad-b0kla__icon-btn' })}
            loadingText={ERP_MG_BUTTON_LOADING_TEXT}
            aria-label="테마"
            title="테마"
            onClick={() => {}}
            preventDoubleClick={false}
          >
            <Palette size={HEADER_ICON_SIZE} strokeWidth={2} aria-hidden />
          </MGButton>
        </div>
      </div>
    );

  const mainContent = (
    <ContentArea>
      <ContentHeader
        title="대시보드 개요"
        subtitle="오늘의 주요 지표와 현황을 한눈에 확인하세요."
        actions={headerActions}
      />

      <ContentKpiRow items={kpiItems} />

      <ContentCard className="mg-v2-content-card--pipeline">
        <AdminMetricsVisualization
          variant="pipeline"
          loading={loading}
          stats={{
            totalMappings: stats.totalMappings,
            pendingDepositCount: pendingDepositStats.count,
            activeMappings: stats.activeMappings,
            schedulePendingCount: stats.schedulePendingCount
          }}
        />
      </ContentCard>

      <div className="mg-v2-content-growth-row">
        <div className="mg-v2-content-growth-row__left">
          <section
            className="mg-v2-content-visualization-group"
            aria-labelledby="admin-viz-group-title"
          >
            <div className="mg-v2-content-visualization-group__header">
              <span
                className="mg-v2-content-visualization-group__accent"
                aria-hidden="true"
              />
              <h2
                id="admin-viz-group-title"
                className="mg-v2-content-visualization-group__title"
              >
                시각화
              </h2>
            </div>
            <div className="mg-v2-content-visualization-group__grid">
              <div className="mg-v2-ad-b0kla__card">
                <div className="mg-v2-ad-b0kla__chart-header">
                  <div>
                    <h3 className="mg-v2-ad-b0kla__chart-title">상담 현황 추이</h3>
                <p className="mg-v2-ad-b0kla__chart-desc">
                  {chartPeriod === 'weekly' ? '최근 6주 간의 완료 추이' : '최근 6개월 간의 예약 및 완료 추이'}
                </p>
              </div>
              <div className="mg-v2-ad-b0kla__pill-toggle">
                <MGButton
                  type="button"
                  className={buildErpMgButtonClassName({
                    variant: 'primary',
                    size: 'md',
                    loading: false,
                    className: `mg-v2-ad-b0kla__pill ${chartPeriod === 'monthly' ? 'mg-v2-ad-b0kla__pill--active' : ''}`
                  })}
                  loadingText={ERP_MG_BUTTON_LOADING_TEXT}
                  onClick={() => setChartPeriod('monthly')}
                  preventDoubleClick={false}
                >
                  월간
                </MGButton>
                <MGButton
                  type="button"
                  className={buildErpMgButtonClassName({
                    variant: 'primary',
                    size: 'md',
                    loading: false,
                    className: `mg-v2-ad-b0kla__pill ${chartPeriod === 'weekly' ? 'mg-v2-ad-b0kla__pill--active' : ''}`
                  })}
                  loadingText={ERP_MG_BUTTON_LOADING_TEXT}
                  onClick={() => setChartPeriod('weekly')}
                  preventDoubleClick={false}
                >
                  주간
                </MGButton>
              </div>
            </div>
            <div
              className="mg-v2-ad-b0kla__chart-placeholder mg-v2-ad-b0kla__chart-wrapper"
              ref={chartBarWrapperRef}
            >
              {(() => {
                const isWeekly = chartPeriod === 'weekly';
                const rawData = isWeekly
                  ? (stats.consultationStats?.weeklyData?.length > 0
                      ? stats.consultationStats.weeklyData.slice(0, 6)
                      : getEmptyWeeklyChartData(6))
                  : (stats.consultationStats?.monthlyData?.length > 0
                      ? stats.consultationStats.monthlyData.slice(0, 6)
                      : getEmptyMonthlyChartData(6));
                const values = rawData.map((d) => d.completedCount || 0);
                const allZero = values.length > 0 && values.every((v) => v === 0);
                if (allZero) {
                  return (
                    <p className="mg-v2-ad-b0kla__chart-empty">기간 내 완료된 상담이 없습니다.</p>
                  );
                }
                const maxVal = Math.max(...values, 1);
                return (
                  <Chart
                    type={CHART_TYPES.BAR}
                    data={{
                      labels: rawData.map(formatChartPeriodLabel),
                      datasets: [
                        {
                          label: '완료 상담',
                          data: values,
                          backgroundColor: chartBarColors.fill,
                          borderColor: chartBarColors.border,
                          borderWidth: 1,
                          borderRadius: 6
                        }
                      ]
                    }}
                    height="180px"
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
                          suggestedMax: Math.max(maxVal + 1, 2),
                          ticks: { stepSize: 1 },
                          grid: { color: 'var(--mg-shadow-light)' }
                        }
                      }
                    }}
                  />
                );
              })()}
            </div>
          </div>
          {/* 예약 vs 완료 라인 차트: consultationStats에 bookedCount/scheduledCount 있으면 2선, 없으면 완료 1선 */}
          <div className="mg-v2-ad-b0kla__card">
            <div className="mg-v2-ad-b0kla__chart-header">
              <div>
                <h3 className="mg-v2-ad-b0kla__chart-title">예약 vs 완료</h3>
                <p className="mg-v2-ad-b0kla__chart-desc">
                  {lineChartPeriod === 'weekly'
                    ? '최근 6주 예약·완료 추이'
                    : '최근 6개월 예약·완료 추이'}
                </p>
              </div>
              <div className="mg-v2-ad-b0kla__pill-toggle">
                <MGButton
                  type="button"
                  className={buildErpMgButtonClassName({
                    variant: 'primary',
                    size: 'md',
                    loading: false,
                    className: `mg-v2-ad-b0kla__pill ${lineChartPeriod === 'monthly' ? 'mg-v2-ad-b0kla__pill--active' : ''}`
                  })}
                  loadingText={ERP_MG_BUTTON_LOADING_TEXT}
                  onClick={() => setLineChartPeriod('monthly')}
                  preventDoubleClick={false}
                >
                  월간
                </MGButton>
                <MGButton
                  type="button"
                  className={buildErpMgButtonClassName({
                    variant: 'primary',
                    size: 'md',
                    loading: false,
                    className: `mg-v2-ad-b0kla__pill ${lineChartPeriod === 'weekly' ? 'mg-v2-ad-b0kla__pill--active' : ''}`
                  })}
                  loadingText={ERP_MG_BUTTON_LOADING_TEXT}
                  onClick={() => setLineChartPeriod('weekly')}
                  preventDoubleClick={false}
                >
                  주간
                </MGButton>
              </div>
            </div>
            <div
              className="mg-v2-ad-b0kla__chart-placeholder mg-v2-ad-b0kla__chart-wrapper"
              ref={lineChartWrapperRef}
            >
              {(() => {
                const isWeekly = lineChartPeriod === 'weekly';
                const rawData = isWeekly
                  ? (stats.consultationStats?.weeklyData?.length > 0
                      ? stats.consultationStats.weeklyData.slice(0, 6)
                      : getEmptyWeeklyChartData(6))
                  : (stats.consultationStats?.monthlyData?.length > 0
                      ? stats.consultationStats.monthlyData.slice(0, 6)
                      : getEmptyMonthlyChartData(6));
                const completedValues = rawData.map((d) => d.completedCount ?? 0);
                const hasBooked = rawData.some((d) => (d.bookedCount ?? d.scheduledCount) != null);
                const bookedValues = hasBooked
                  ? rawData.map((d) => d.bookedCount ?? d.scheduledCount ?? 0)
                  : null;
                const allZero =
                  completedValues.every((v) => v === 0) &&
                  (!bookedValues || bookedValues.every((v) => v === 0));
                if (allZero) {
                  return (
                    <p className="mg-v2-ad-b0kla__chart-empty">
                      기간 내 데이터가 없습니다.
                    </p>
                  );
                }
                const maxVal = Math.max(
                  ...completedValues,
                  ...(bookedValues || [0]),
                  1
                );
                const datasets = [
                  {
                    label: '완료',
                    data: completedValues,
                    borderColor: chartBarColors.border,
                    // 범례·포인트 색은 backgroundColor를 쓰므로 선(완료)과 동일하게 파랑(border) 사용. fill(녹색)이면 녹색 점이 됨.
                    backgroundColor: chartBarColors.border,
                    borderWidth: 2,
                    tension: 0.3,
                    fill: false
                  }
                ];
                if (bookedValues && bookedValues.some((v) => v > 0)) {
                  datasets.push({
                    label: '예약',
                    data: bookedValues,
                    borderColor: chartBarColors.fill,
                    backgroundColor: chartBarColors.fill,
                    borderWidth: 2,
                    tension: 0.3,
                    fill: false
                  });
                }
                return (
                  <Chart
                    type={CHART_TYPES.LINE}
                    data={{
                      labels: rawData.map(formatChartPeriodLabel),
                      datasets
                    }}
                    height="180px"
                    options={{
                      maintainAspectRatio: false,
                      plugins: {
                        legend: {
                          display: true,
                          position: 'top',
                          labels: { usePointStyle: true, padding: 12, font: { size: 11 } }
                        },
                        tooltip: {
                          callbacks: {
                            label: (ctx) => `${ctx.dataset.label}: ${ctx.parsed.y}건`
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
                          suggestedMax: Math.max(maxVal + 1, 2),
                          ticks: { stepSize: 1 },
                          grid: { color: 'var(--mg-shadow-light)' }
                        }
                      }
                    }}
                  />
                );
              })()}
            </div>
          </div>
          <div className="mg-v2-ad-b0kla__card">
            <h3 className="mg-v2-ad-b0kla__chart-title">단계별 현황</h3>
            <p className="mg-v2-ad-b0kla__chart-desc">5단계 건수 비율</p>
            <div className="mg-v2-ad-b0kla__chart-placeholder mg-v2-ad-b0kla__chart-wrapper mg-v2-ad-b0kla__chart-wrapper--donut">
              {(() => {
                const stepValues = [
                  stats.totalMappings ?? 0,
                  pendingDepositStats.count ?? 0,
                  stats.activeMappings ?? 0,
                  stats.schedulePendingCount ?? 0,
                  0
                ];
                const total = stepValues.reduce((a, b) => a + b, 0);
                const allZero = total === 0;
                if (allZero) {
                  return (
                    <p className="mg-v2-ad-b0kla__chart-empty">단계별 데이터가 없습니다.</p>
                  );
                }
                return (
                  <Chart
                    type={CHART_TYPES.DOUGHNUT}
                    data={{
                      labels: STEP_CHART_LABELS,
                      datasets: [
                        {
                          data: stepValues,
                          backgroundColor: B0KLA_STEP_CHART_HEX,
                          borderColor: B0KLA_STEP_CHART_HEX,
                          borderWidth: 2
                        }
                      ]
                    }}
                    height="180px"
                    options={{
                      maintainAspectRatio: false,
                      plugins: {
                        legend: {
                          position: 'right',
                          labels: { usePointStyle: true, padding: 12, font: { size: 11 } }
                        },
                        tooltip: {
                          callbacks: {
                            label: (ctx) => {
                              const v = ctx.parsed;
                              const pct = total > 0 ? ((v / total) * 100).toFixed(1) : '0';
                              return `${ctx.label}: ${v}건 (${pct}%)`;
                            }
                          }
                        }
                      }
                    }}
                  />
                );
              })()}
            </div>
          </div>
            </div>
          </section>
        </div>
        <div className="mg-v2-ad-b0kla__card">
          <h3 className="mg-v2-ad-b0kla__counselor-title">상담사 별 통합데이터</h3>
          <p className="mg-v2-ad-b0kla__counselor-subtitle">평점·상담 완료·완료율</p>
          <div className="mg-v2-ad-b0kla__integrated-data-period">
            <span className="mg-v2-ad-b0kla__integrated-data-period-label">집계 기간</span>
            <div className="mg-v2-ad-b0kla__integrated-data-period-tabs">
              <MGButton
                type="button"
                aria-pressed={integratedDataPeriodType === 'all'}
                className={buildErpMgButtonClassName({
                  variant: 'primary',
                  size: 'sm',
                  loading: false,
                  className: `mg-v2-ad-b0kla__pill mg-v2-ad-b0kla__pill--sm ${integratedDataPeriodType === 'all' ? 'mg-v2-ad-b0kla__pill--active' : ''}`
                })}
                loadingText={ERP_MG_BUTTON_LOADING_TEXT}
                onClick={() => setIntegratedDataPeriodType('all')}
                preventDoubleClick={false}
              >
                전체
              </MGButton>
              <MGButton
                type="button"
                aria-pressed={integratedDataPeriodType === 'month'}
                className={buildErpMgButtonClassName({
                  variant: 'primary',
                  size: 'sm',
                  loading: false,
                  className: `mg-v2-ad-b0kla__pill mg-v2-ad-b0kla__pill--sm ${integratedDataPeriodType === 'month' ? 'mg-v2-ad-b0kla__pill--active' : ''}`
                })}
                loadingText={ERP_MG_BUTTON_LOADING_TEXT}
                onClick={() => setIntegratedDataPeriodType('month')}
                preventDoubleClick={false}
              >
                월별
              </MGButton>
              <MGButton
                type="button"
                aria-pressed={integratedDataPeriodType === 'year'}
                className={buildErpMgButtonClassName({
                  variant: 'primary',
                  size: 'sm',
                  loading: false,
                  className: `mg-v2-ad-b0kla__pill mg-v2-ad-b0kla__pill--sm ${integratedDataPeriodType === 'year' ? 'mg-v2-ad-b0kla__pill--active' : ''}`
                })}
                loadingText={ERP_MG_BUTTON_LOADING_TEXT}
                onClick={() => setIntegratedDataPeriodType('year')}
                preventDoubleClick={false}
              >
                년도별
              </MGButton>
            </div>
            {integratedDataPeriodType === 'month' && (
              <div className="mg-v2-ad-b0kla__integrated-data-month-picker">
                <select
                  aria-label="년도 선택"
                  value={integratedDataYear}
                  onChange={(e) => setIntegratedDataYear(Number(e.target.value))}
                  className="mg-v2-ad-b0kla__select mg-v2-ad-b0kla__select--sm"
                >
                  {Array.from({ length: 5 }, (_, i) => new Date().getFullYear() - i).map((y) => (
                    <option key={y} value={y}>{y}년</option>
                  ))}
                </select>
                <select
                  aria-label="월 선택"
                  value={integratedDataMonth}
                  onChange={(e) => setIntegratedDataMonth(Number(e.target.value))}
                  className="mg-v2-ad-b0kla__select mg-v2-ad-b0kla__select--sm"
                >
                  {Array.from({ length: 12 }, (_, i) => i + 1).map((m) => (
                    <option key={m} value={m}>{m}월</option>
                  ))}
                </select>
              </div>
            )}
          </div>
          <div className="mg-v2-ad-b0kla__integrated-data-view-toggle">
            <div className="mg-v2-ad-b0kla__pill-toggle" role="tablist" aria-label="통합데이터 뷰 전환">
              <MGButton
                type="button"
                role="tab"
                aria-selected={integratedDataView === 'table'}
                aria-label="테이블 뷰"
                className={buildErpMgButtonClassName({
                  variant: 'primary',
                  size: 'md',
                  loading: false,
                  className: `mg-v2-ad-b0kla__pill ${integratedDataView === 'table' ? 'mg-v2-ad-b0kla__pill--active' : ''}`
                })}
                loadingText={ERP_MG_BUTTON_LOADING_TEXT}
                onClick={() => setIntegratedDataView('table')}
                preventDoubleClick={false}
              >
                테이블
              </MGButton>
              <MGButton
                type="button"
                role="tab"
                aria-selected={integratedDataView === 'graph'}
                aria-label="그래프 뷰"
                className={buildErpMgButtonClassName({
                  variant: 'primary',
                  size: 'md',
                  loading: false,
                  className: `mg-v2-ad-b0kla__pill ${integratedDataView === 'graph' ? 'mg-v2-ad-b0kla__pill--active' : ''}`
                })}
                loadingText={ERP_MG_BUTTON_LOADING_TEXT}
                onClick={() => setIntegratedDataView('graph')}
                preventDoubleClick={false}
              >
                그래프
              </MGButton>
              <MGButton
                type="button"
                role="tab"
                aria-selected={integratedDataView === 'progress'}
                aria-label="프로그레스 뷰"
                className={buildErpMgButtonClassName({
                  variant: 'primary',
                  size: 'md',
                  loading: false,
                  className: `mg-v2-ad-b0kla__pill ${integratedDataView === 'progress' ? 'mg-v2-ad-b0kla__pill--active' : ''}`
                })}
                loadingText={ERP_MG_BUTTON_LOADING_TEXT}
                onClick={() => setIntegratedDataView('progress')}
                preventDoubleClick={false}
              >
                프로그레스
              </MGButton>
            </div>
          </div>
          <div className="mg-v2-ad-b0kla__integrated-data-wrap">
            {consultantIntegratedData.length > 0 ? (
              <>
                {integratedDataView === 'table' && (
                  <>
                    <div className="mg-v2-ad-b0kla__integrated-data-header">
                      <span className="mg-v2-ad-b0kla__integrated-data-th mg-v2-ad-b0kla__integrated-data-th--rank">순위</span>
                      <span className="mg-v2-ad-b0kla__integrated-data-th">상담사명</span>
                      <span className="mg-v2-ad-b0kla__integrated-data-th">평점</span>
                      <span className="mg-v2-ad-b0kla__integrated-data-th">완료 건수</span>
                      <span className="mg-v2-ad-b0kla__integrated-data-th">완료율</span>
                    </div>
                    <div className="mg-v2-ad-b0kla__counselor-list mg-v2-ad-b0kla__integrated-data-list">
                      {consultantIntegratedData.map((row, index) => {
                        const rankUp = row.consultantId != null && integratedDataRankUpSet.has(row.consultantId);
                        const rankDown = row.consultantId != null && integratedDataRankDownSet.has(row.consultantId);
                        const rowClass = [
                          'mg-v2-ad-b0kla__integrated-data-row',
                          rankUp && 'mg-v2-ad-b0kla__integrated-data-row--rank-up',
                          rankDown && 'mg-v2-ad-b0kla__integrated-data-row--rank-down'
                        ].filter(Boolean).join(' ');
                        return (
                        <div
                          key={`${row.consultantName}-${row.consultantId ?? ''}`}
                          className={rowClass}
                        >
                          <span className="mg-v2-ad-b0kla__integrated-data-rank">{index + 1}</span>
                          <span className="mg-v2-ad-b0kla__counselor-name">{maskEncryptedDisplay(row.consultantName, '상담사')}</span>
                          <span className="mg-v2-ad-b0kla__counselor-rating">
                            {row.rating != null ? Number(row.rating).toFixed(1) : '-'}
                          </span>
                          <span className="mg-v2-ad-b0kla__integrated-data-cell">{`${toSafeNumber(row.completedCount, 0)}건`}</span>
                          <span className="mg-v2-ad-b0kla__integrated-data-cell">{`${toSafeNumber(row.completionRate, 0)}%`}</span>
                        </div>
                        );
                      })}
                    </div>
                  </>
                )}
                {integratedDataView === 'graph' && (
                  <div className="mg-v2-ad-b0kla__chart-placeholder mg-v2-ad-b0kla__chart-wrapper mg-v2-ad-b0kla__integrated-chart-wrapper">
                    <Chart
                      type={CHART_TYPES.BAR}
                      data={{
                        labels: consultantIntegratedData.map((d, i) => `${i + 1}위 ${maskEncryptedDisplay(d.consultantName, '상담사')}`),
                        datasets: [
                          {
                            label: '완료 건수',
                            data: consultantIntegratedData.map((d) => d.completedCount),
                            backgroundColor: chartBarColors.fill,
                            borderColor: chartBarColors.fill,
                            borderWidth: 1,
                            borderRadius: 4
                          }
                        ]
                      }}
                      height="220px"
                      options={{
                        maintainAspectRatio: false,
                        plugins: {
                          legend: { display: false },
                          tooltip: {
                            callbacks: {
                              label: (ctx) => {
                                const d = consultantIntegratedData[ctx.dataIndex];
                                return [
                                  `완료: ${toSafeNumber(d.completedCount, 0)}건`,
                                  `완료율: ${toSafeNumber(d.completionRate, 0)}%`
                                ];
                              }
                            }
                          }
                        },
                        scales: {
                          x: {
                            grid: { display: false },
                            ticks: {
                              font: { size: 11 },
                              color: 'var(--ad-b0kla-text-secondary)',
                              maxRotation: 45,
                              minRotation: 0
                            }
                          },
                          y: {
                            beginAtZero: true,
                            grid: { color: 'var(--mg-shadow-light)' },
                            ticks: { font: { size: 11 }, color: 'var(--ad-b0kla-text-secondary)' }
                          }
                        }
                      }}
                    />
                  </div>
                )}
                {integratedDataView === 'progress' && (
                  <div className="mg-v2-ad-b0kla__integrated-progress-list">
                    {consultantIntegratedData.map((row, index) => {
                      const rank = index + 1;
                      const rate = Math.min(100, Math.max(0, Number(row.completionRate) || 0));
                      const rankUp = row.consultantId != null && integratedDataRankUpSet.has(row.consultantId);
                      const rankDown = row.consultantId != null && integratedDataRankDownSet.has(row.consultantId);
                      const progressRowClass = [
                        'mg-v2-ad-b0kla__integrated-progress-row',
                        rankUp && 'mg-v2-ad-b0kla__integrated-progress-row--rank-up',
                        rankDown && 'mg-v2-ad-b0kla__integrated-progress-row--rank-down'
                      ].filter(Boolean).join(' ');
                      return (
                        <div
                          key={`${row.consultantName}-${row.consultantId ?? ''}`}
                          className={progressRowClass}
                        >
                          <span className="mg-v2-ad-b0kla__integrated-progress-rank">{rank}위</span>
                          <span className="mg-v2-ad-b0kla__integrated-progress-name" title={maskEncryptedDisplay(row.consultantName, '상담사')}>
                            {maskEncryptedDisplay(row.consultantName, '상담사')}
                          </span>
                          <div
                            className="mg-v2-ad-b0kla__integrated-progress-track"
                            role="progressbar"
                            aria-valuenow={rate}
                            aria-valuemin={0}
                            aria-valuemax={100}
                            aria-label={`${maskEncryptedDisplay(row.consultantName, '상담사')} 상담사 완료율 ${rate}%`}
                          >
                            <div
                              className="mg-v2-ad-b0kla__integrated-progress-fill"
                              style={{ width: `${rate}%` }}
                            />
                          </div>
                          <span className="mg-v2-ad-b0kla__integrated-progress-value">{rate}%</span>
                        </div>
                      );
                    })}
                  </div>
                )}
              </>
            ) : (
              <p className="mg-v2-ad-b0kla__counselor-empty mg-v2-ad-b0kla__integrated-data-empty">
                상담사 통합 데이터가 없습니다.
              </p>
            )}
          </div>
        </div>
      </div>

      {!HIDE_DASHBOARD_MENUS && (
      <ContentSection
        title="환불 현황"
        subtitle="최근 1개월 환불 통계"
      >
        <div className="mg-stats-grid">
          <StatCard
            icon={<Icon name="RECEIPT" size="LG" color="TRANSPARENT" />}
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
            icon={<Icon name="DOLLAR_SIGN" size="LG" color="TRANSPARENT" />}
            value={`${refundStats.totalRefundAmount.toLocaleString()}원`}
            label="환불 금액"
            onClick={() => navigate(`${ADMIN_ROUTES.MAPPING_MANAGEMENT}?tab=refunds`)}
          />
          <StatCard
            icon={<Icon name="TRENDING_UP" size="LG" color="TRANSPARENT" />}
            value={`${refundStats.averageRefundPerCase.toLocaleString()}원`}
            label="평균 환불액"
            onClick={() => navigate(`${ADMIN_ROUTES.MAPPING_MANAGEMENT}?tab=refunds`)}
          />
        </div>
      </ContentSection>
      )}

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
        <div className="mg-v2-ad-b0kla__admin-grid">
          <MGButton
            type="button"
            className={buildErpMgButtonClassName({ variant: 'primary', size: 'md', loading: false, className: 'mg-v2-ad-b0kla__admin-card' })}
            loadingText={ERP_MG_BUTTON_LOADING_TEXT}
            onClick={() => navigate(ADMIN_ROUTES.USER_MANAGEMENT)}
            preventDoubleClick={false}
          >
            <AdminMgmtCardIcon icon={Users} tone="blue" />
            <span className="mg-v2-ad-b0kla__admin-label">사용자 관리</span>
            <span className="mg-v2-ad-b0kla__admin-desc">상담사·내담자 통합 관리</span>
          </MGButton>
          <MGButton
            type="button"
            className={buildErpMgButtonClassName({ variant: 'primary', size: 'md', loading: false, className: 'mg-v2-ad-b0kla__admin-card' })}
            loadingText={ERP_MG_BUTTON_LOADING_TEXT}
            onClick={() => navigate(ADMIN_ROUTES.INTEGRATED_SCHEDULE)}
            preventDoubleClick={false}
          >
            <AdminMgmtCardIcon icon={CalendarDays} tone="green" />
            <span className="mg-v2-ad-b0kla__admin-label">통합 스케줄링</span>
            <span className="mg-v2-ad-b0kla__admin-desc">매칭 대기자와 캘린더를 한 화면에서 스케줄 등록</span>
          </MGButton>
          <MGButton
            type="button"
            className={buildErpMgButtonClassName({ variant: 'primary', size: 'md', loading: false, className: 'mg-v2-ad-b0kla__admin-card' })}
            loadingText={ERP_MG_BUTTON_LOADING_TEXT}
            onClick={() => navigate(ADMIN_ROUTES.CONSULTATION_LOGS)}
            preventDoubleClick={false}
          >
            <AdminMgmtCardIcon icon={ClipboardList} tone="orange" />
            <span className="mg-v2-ad-b0kla__admin-label">상담일지 조회</span>
            <span className="mg-v2-ad-b0kla__admin-desc">상담일지를 검색하고 목록에서 클릭해 수정할 수 있습니다</span>
          </MGButton>
          {!HIDE_ADMIN_CARD_IDS.has('sessions') && (
          <MGButton
            type="button"
            className={buildErpMgButtonClassName({ variant: 'primary', size: 'md', loading: false, className: 'mg-v2-ad-b0kla__admin-card' })}
            loadingText={ERP_MG_BUTTON_LOADING_TEXT}
            onClick={() => navigate(ADMIN_ROUTES.SESSIONS)}
            preventDoubleClick={false}
          >
            <AdminMgmtCardIcon icon={Target} tone="gray" />
            <span className="mg-v2-ad-b0kla__admin-label">회기 관리</span>
            <span className="mg-v2-ad-b0kla__admin-desc">상담 회기를 등록하고 관리합니다</span>
          </MGButton>
          )}
          {!HIDE_ADMIN_CARD_IDS.has('schedule-auto-complete') && (
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
            <span className="mg-v2-ad-b0kla__admin-label">스케줄 자동 완료</span>
            <span className="mg-v2-ad-b0kla__admin-desc">지난 스케줄을 자동으로 완료 처리합니다</span>
          </MGButton>
          )}
          {!HIDE_ADMIN_CARD_IDS.has('schedule-complete-reminder') && (
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
            <span className="mg-v2-ad-b0kla__admin-label">스케줄 완료 + 알림</span>
            <span className="mg-v2-ad-b0kla__admin-desc">지난 스케줄 완료 처리 및 상담일지 미작성 알림</span>
          </MGButton>
          )}
          {!HIDE_ADMIN_CARD_IDS.has('consultant-comprehensive') && (
          <MGButton
            type="button"
            className={buildErpMgButtonClassName({ variant: 'primary', size: 'md', loading: false, className: 'mg-v2-ad-b0kla__admin-card' })}
            loadingText={ERP_MG_BUTTON_LOADING_TEXT}
            onClick={() => navigate(ADMIN_ROUTES.CONSULTANT_COMPREHENSIVE)}
            preventDoubleClick={false}
          >
            <AdminMgmtCardIcon icon={UserCog} tone="blue" />
            <span className="mg-v2-ad-b0kla__admin-label">상담사 관리</span>
            <span className="mg-v2-ad-b0kla__admin-desc">상담사 정보를 관리합니다</span>
          </MGButton>
          )}
          {!HIDE_ADMIN_CARD_IDS.has('client-comprehensive') && canManageClients && (
          <MGButton
            type="button"
            className={buildErpMgButtonClassName({ variant: 'primary', size: 'md', loading: false, className: 'mg-v2-ad-b0kla__admin-card' })}
            loadingText={ERP_MG_BUTTON_LOADING_TEXT}
            onClick={() => navigate(ADMIN_ROUTES.CLIENT_COMPREHENSIVE)}
            preventDoubleClick={false}
          >
            <AdminMgmtCardIcon icon={UserRound} tone="green" />
            <span className="mg-v2-ad-b0kla__admin-label">내담자 관리</span>
            <span className="mg-v2-ad-b0kla__admin-desc">내담자 정보를 관리합니다</span>
          </MGButton>
          )}
          <MGButton
            type="button"
            className={buildErpMgButtonClassName({ variant: 'primary', size: 'md', loading: false, className: 'mg-v2-ad-b0kla__admin-card' })}
            loadingText={ERP_MG_BUTTON_LOADING_TEXT}
            onClick={() => navigate(ADMIN_ROUTES.MAPPING_MANAGEMENT)}
            preventDoubleClick={false}
          >
            <AdminMgmtCardIcon icon={Link2} tone="orange" />
            <span className="mg-v2-ad-b0kla__admin-label">매칭 시스템</span>
            <span className="mg-v2-ad-b0kla__admin-desc">상담사와 내담자 매칭을 관리합니다</span>
          </MGButton>
          <MGButton
            type="button"
            className={buildErpMgButtonClassName({ variant: 'primary', size: 'md', loading: false, className: 'mg-v2-ad-b0kla__admin-card' })}
            loadingText={ERP_MG_BUTTON_LOADING_TEXT}
            onClick={() => navigate(ADMIN_ROUTES.SCHEDULES)}
            preventDoubleClick={false}
          >
            <AdminMgmtCardIcon icon={Calendar} tone="green" />
            <span className="mg-v2-ad-b0kla__admin-label">스케줄 관리</span>
            <span className="mg-v2-ad-b0kla__admin-desc">상담 일정을 관리하고 조정합니다</span>
          </MGButton>
          {!HIDE_ADMIN_CARD_IDS.has('user-management') && PermissionChecks.canManageUsers(userPermissions) && (
            <MGButton
              type="button"
              className={buildErpMgButtonClassName({ variant: 'primary', size: 'md', loading: false, className: 'mg-v2-ad-b0kla__admin-card' })}
              loadingText={ERP_MG_BUTTON_LOADING_TEXT}
              onClick={() => navigate(ADMIN_ROUTES.USER_MANAGEMENT)}
              preventDoubleClick={false}
            >
              <AdminMgmtCardIcon icon={Users} tone="blue" />
              <span className="mg-v2-ad-b0kla__admin-label">사용자 관리</span>
              <span className="mg-v2-ad-b0kla__admin-desc">사용자 역할 변경 및 권한 관리</span>
            </MGButton>
          )}
          <MGButton
            type="button"
            className={buildErpMgButtonClassName({ variant: 'primary', size: 'md', loading: false, className: 'mg-v2-ad-b0kla__admin-card' })}
            loadingText={ERP_MG_BUTTON_LOADING_TEXT}
            onClick={() => navigate(ADMIN_ROUTES.COMMON_CODES)}
            preventDoubleClick={false}
          >
            <AdminMgmtCardIcon icon={Tags} tone="gray" />
            <span className="mg-v2-ad-b0kla__admin-label">공통코드</span>
            <span className="mg-v2-ad-b0kla__admin-desc">시스템 공통코드를 관리합니다</span>
          </MGButton>
          <MGButton
            type="button"
            className={buildErpMgButtonClassName({ variant: 'primary', size: 'md', loading: false, className: 'mg-v2-ad-b0kla__admin-card' })}
            loadingText={ERP_MG_BUTTON_LOADING_TEXT}
            onClick={() => navigate(ADMIN_ROUTES.PACKAGE_PRICING)}
            preventDoubleClick={false}
          >
            <AdminMgmtCardIcon icon={Package} tone="orange" />
            <span className="mg-v2-ad-b0kla__admin-label">패키지 요금 관리</span>
            <span className="mg-v2-ad-b0kla__admin-desc">상담 패키지별 가격·회기 수 관리</span>
          </MGButton>
          <MGButton
            type="button"
            className={buildErpMgButtonClassName({ variant: 'primary', size: 'md', loading: false, className: 'mg-v2-ad-b0kla__admin-card' })}
            loadingText={ERP_MG_BUTTON_LOADING_TEXT}
            onClick={() => navigate(ADMIN_ROUTES.NOTIFICATIONS)}
            preventDoubleClick={false}
          >
            <AdminMgmtCardIcon icon={Megaphone} tone="blue" />
            <span className="mg-v2-ad-b0kla__admin-label">알림·메시지 관리</span>
            <span className="mg-v2-ad-b0kla__admin-desc">시스템 공지와 메시지를 한 화면에서 관리합니다</span>
          </MGButton>
          {!HIDE_ADMIN_CARD_IDS.has('dashboards') && (
          <MGButton
            type="button"
            className={buildErpMgButtonClassName({ variant: 'primary', size: 'md', loading: false, className: 'mg-v2-ad-b0kla__admin-card' })}
            loadingText={ERP_MG_BUTTON_LOADING_TEXT}
            onClick={() => navigate(ADMIN_ROUTES.DASHBOARDS)}
            preventDoubleClick={false}
          >
            <AdminMgmtCardIcon icon={LayoutDashboard} tone="gray" />
            <span className="mg-v2-ad-b0kla__admin-label">대시보드 관리</span>
            <span className="mg-v2-ad-b0kla__admin-desc">역할별 대시보드를 관리합니다</span>
          </MGButton>
          )}
          <MGButton
            type="button"
            className={buildErpMgButtonClassName({ variant: 'primary', size: 'md', loading: false, className: 'mg-v2-ad-b0kla__admin-card' })}
            loadingText={ERP_MG_BUTTON_LOADING_TEXT}
            onClick={() => navigate(ADMIN_ROUTES.SYSTEM_CONFIG)}
            preventDoubleClick={false}
          >
            <AdminMgmtCardIcon icon={Settings} tone="gray" />
            <span className="mg-v2-ad-b0kla__admin-label">시스템 설정</span>
            <span className="mg-v2-ad-b0kla__admin-desc">OpenAI API 키 및 시스템 설정을 관리합니다</span>
          </MGButton>
          {!HIDE_ADMIN_CARD_IDS.has('cache-monitoring') && (
          <MGButton
            type="button"
            className={buildErpMgButtonClassName({ variant: 'primary', size: 'md', loading: false, className: 'mg-v2-ad-b0kla__admin-card' })}
            loadingText={ERP_MG_BUTTON_LOADING_TEXT}
            onClick={() => navigate(ADMIN_ROUTES.CACHE_MONITORING)}
            preventDoubleClick={false}
          >
            <AdminMgmtCardIcon icon={Database} tone="gray" />
            <span className="mg-v2-ad-b0kla__admin-label">캐시 모니터링</span>
            <span className="mg-v2-ad-b0kla__admin-desc">시스템 캐시 성능을 실시간으로 모니터링합니다</span>
          </MGButton>
          )}
          {!HIDE_ADMIN_CARD_IDS.has('security-monitoring') && (
          <MGButton
            type="button"
            className={buildErpMgButtonClassName({ variant: 'primary', size: 'md', loading: false, className: 'mg-v2-ad-b0kla__admin-card' })}
            loadingText={ERP_MG_BUTTON_LOADING_TEXT}
            onClick={() => navigate(ADMIN_ROUTES.SECURITY_MONITORING)}
            preventDoubleClick={false}
          >
            <AdminMgmtCardIcon icon={Shield} tone="orange" />
            <span className="mg-v2-ad-b0kla__admin-label">보안 모니터링</span>
            <span className="mg-v2-ad-b0kla__admin-desc">실시간 보안 위협 탐지 및 시스템 보안 관리</span>
          </MGButton>
          )}
          <MGButton
            type="button"
            className={buildErpMgButtonClassName({ variant: 'primary', size: 'md', loading: false, className: 'mg-v2-ad-b0kla__admin-card' })}
            loadingText={ERP_MG_BUTTON_LOADING_TEXT}
            onClick={() => navigate(ADMIN_ROUTES.API_PERFORMANCE)}
            preventDoubleClick={false}
          >
            <AdminMgmtCardIcon icon={Activity} tone="green" />
            <span className="mg-v2-ad-b0kla__admin-label">API 성능 모니터링</span>
            <span className="mg-v2-ad-b0kla__admin-desc">API 응답 시간과 성능 지표를 실시간으로 추적합니다</span>
          </MGButton>
          <MGButton
            type="button"
            className={buildErpMgButtonClassName({ variant: 'primary', size: 'md', loading: false, className: 'mg-v2-ad-b0kla__admin-card' })}
            loadingText={ERP_MG_BUTTON_LOADING_TEXT}
            onClick={() => navigate(ADMIN_ROUTES.MESSAGES)}
            preventDoubleClick={false}
          >
            <AdminMgmtCardIcon icon={MessageCircle} tone="blue" />
            <span className="mg-v2-ad-b0kla__admin-label">메시지 관리</span>
            <span className="mg-v2-ad-b0kla__admin-desc">상담사-내담자 메시지를 관리합니다</span>
          </MGButton>
          <MGButton
            type="button"
            className={buildErpMgButtonClassName({ variant: 'primary', size: 'md', loading: false, className: 'mg-v2-ad-b0kla__admin-card' })}
            loadingText={ERP_MG_BUTTON_LOADING_TEXT}
            onClick={() => navigate(ADMIN_ROUTES.PSYCH_ASSESSMENTS)}
            preventDoubleClick={false}
          >
            <AdminMgmtCardIcon icon={Brain} tone="orange" />
            <span className="mg-v2-ad-b0kla__admin-label">심리검사 리포트(AI)</span>
            <span className="mg-v2-ad-b0kla__admin-desc">TCI/MMPI 업로드 및 리포트 생성을 관리합니다</span>
          </MGButton>
          {!HIDE_ADMIN_CARD_IDS.has('wellness') && (
          <MGButton
            type="button"
            className={buildErpMgButtonClassName({ variant: 'primary', size: 'md', loading: false, className: 'mg-v2-ad-b0kla__admin-card' })}
            loadingText={ERP_MG_BUTTON_LOADING_TEXT}
            onClick={() => navigate('/admin/wellness')}
            preventDoubleClick={false}
          >
            <AdminMgmtCardIcon icon={Sparkles} tone="green" />
            <span className="mg-v2-ad-b0kla__admin-label">웰니스 알림 관리</span>
            <span className="mg-v2-ad-b0kla__admin-desc">AI 기반 웰니스 컨텐츠 생성 및 비용 관리</span>
          </MGButton>
          )}
          {!HIDE_ADMIN_CARD_IDS.has('merge-duplicate-mappings') && (
          <MGButton
            type="button"
            className={buildErpMgButtonClassName({
              variant: 'primary',
              size: 'md',
              loading: mergeDuplicateLoading,
              className: 'mg-v2-ad-b0kla__admin-card'
            })}
            loadingText={ERP_MG_BUTTON_LOADING_TEXT}
            onClick={handleMergeDuplicateMappings}
            loading={mergeDuplicateLoading}
            preventDoubleClick={false}
          >
            <AdminMgmtCardIcon icon={Merge} tone="orange" />
            <span className="mg-v2-ad-b0kla__admin-label">중복 매칭 통합</span>
            <span className="mg-v2-ad-b0kla__admin-desc">중복된 상담사-내담자 매칭을 통합합니다</span>
          </MGButton>
          )}
        </div>
      </ContentSection>

      {showToastState && (
        <div className={`mg-toast mg-toast-${toastType}`}>
          <div className="mg-toast-header">
            <strong className="me-auto">알림</strong>
            <MGButton
              type="button"
              className={buildErpMgButtonClassName({ variant: 'outline', size: 'md', loading: false, className: 'mg-toast-close' })}
              loadingText={ERP_MG_BUTTON_LOADING_TEXT}
              onClick={() => setShowToastState(false)}
              preventDoubleClick={false}
              aria-label="알림 닫기"
            >
              ×
            </MGButton>
          </div>
          <div className="mg-toast-body">{toDisplayString(toastMessage, '')}</div>
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
          loadStats();
          loadPendingDepositStats();
        }}
      />

      {/* AI 모니터링(시스템 모니터링) */}
      {!HIDE_DASHBOARD_MENUS && RoleUtils.isAdmin(propUser || sessionUser) && (
        <AdminDashboardMonitoring user={propUser || sessionUser} />
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
