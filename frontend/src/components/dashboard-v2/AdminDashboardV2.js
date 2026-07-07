/**
 * Admin Dashboard V2 - 신규 아토믹 디자인 기반 대시보드
 * mindgarden-design-system.pen B0KlA + RESPONSIVE_LAYOUT_SPEC 기반
 * AdminDashboard 핵심 기능·위젯·비즈니스 로직 이전
 *
 * @author CoreSolution
 * @since 2025-02-22
 */

import React, { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import useMonthlyConsultantCounts from '../../hooks/useMonthlyConsultantCounts';
import useCumulativeMissingConsultationLogs from '../../hooks/useCumulativeMissingConsultationLogs';
import useCumulativeConsultantCounts from '../../hooks/useCumulativeConsultantCounts';
import { useNavigate } from 'react-router-dom';
import { AdminMgmtNavCard, AdminMgmtActionCard } from './molecules/AdminMgmtGridCard';
import notificationManager from '../../utils/notification';
import { useConfirm } from '../../hooks/useConfirm';
import { RoleUtils, USER_ROLES } from '../../constants/roles';
import { FaCalendarAlt } from 'react-icons/fa';
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
  Moon,
  Package,
  Palette,
  Settings,
  Shield,
  Sparkles,
  Sun,
  Tags,
  Target,
  UserCog,
  UserRound,
  Users
} from 'lucide-react';
import StatCard from '../ui/Card/StatCard';
import AdminCommonLayout from '../layout/AdminCommonLayout';
import {
  ContentArea,
  ContentHeader,
  ContentSection,
  ContentCard
} from './content';
import { API_BASE_URL } from '../../constants/api';
import { getDefaultApiHeaders } from '../../utils/apiHeaders';
import SpecialtyManagementModal from '../consultant/SpecialtyManagementModal';
import PerformanceMetricsModal from '../statistics/PerformanceMetricsModal';
import RecurringExpenseModal from '../finance/RecurringExpenseModal';
import ErpReportModal from '../erp/ErpReportModal';
import MappingDepositModal from '../admin/mapping/MappingDepositModal';
import AdminDashboardMonitoring from '../admin/AdminDashboard/AdminDashboardMonitoring';
import UnifiedModal from '../common/modals/UnifiedModal';
import StandardizedApi from '../../utils/standardizedApi';
import { getConsultantColor } from '../../utils/consultantColor';
import ConsultantCountsBadgeList from '../ui/Schedule/ConsultantCountsBadgeList';
import MissingConsultationLogsList from '../ui/Schedule/MissingConsultationLogsList';
import KpiFlipCard from '../admin/AdminDashboard/molecules/KpiFlipCard';
import CumulativeConsultantCountsChart from './molecules/CumulativeConsultantCountsChart';
import './molecules/CumulativeConsultantCountsChart.css';
import Chart from '../common/Chart';
import { CHART_TYPES, B0KLA_CHART_BAR_FALLBACK, B0KLA_STEP_CHART_HEX } from '../../constants/charts';
import { resolveCssColorTokensArray, resolveCssColorVarToHex } from '../../utils/resolveCssColorVarToHex';
import {
  AdminMetricsVisualization,
  ManualMatchingQueue,
  DepositPendingList,
  SchedulePendingList
} from '../admin/AdminDashboard/index';
import { useSession } from '../../contexts/SessionContext';
import { useDarkMode, DARK_MODE_VALUES } from '../../contexts/DarkModeContext';
import csrfTokenManager from '../../utils/csrfTokenManager';
import { sessionManager } from '../../utils/sessionManager';
import { fetchUserPermissions, PermissionChecks } from '../../utils/permissionUtils';
import { ADMIN_ROUTES } from '../../constants/adminRoutes';
import {
  HIDE_ADMIN_CARD_IDS,
  HIDE_DASHBOARD_MENUS
} from '../../constants/adminDashboardCardVisibility';
import { API_ENDPOINTS } from '../../constants/apiEndpoints';
import { maskEncryptedDisplay } from '../../utils/codeHelper';
import { toSafeNumber, toDisplayString } from '../../utils/safeDisplay';
import MGButton from '../common/MGButton';
import SegmentedTabs from '../common/SegmentedTabs';
import { buildErpMgButtonClassName, ERP_MG_BUTTON_LOADING_TEXT } from '../erp/common/erpMgButtonProps';
import Icon from '../ui/Icon/Icon';
import {
  buildTrendAriaLabel,
  extractSparklineValues
} from './utils/dashboardKpiSparklineUtils';
import {
  DASHBOARD_CHART_ROLLING_MONTHS,
  DASHBOARD_CHART_ROLLING_WEEKS,
  formatChartPeriodLabel,
  resolveRollingMonthlyChartRows,
  resolveRollingWeeklyChartRows
} from './utils/dashboardChartPeriodUtils';
import '../../styles/main.css';
import '../../styles/unified-design-tokens.css';
import '../../styles/responsive-layout-tokens.css';
import '../../styles/themes/admin-theme.css';
import '../admin/AdminDashboard/AdminDashboardB0KlA.css';
import '../admin/AdminDashboard/AdminDashboardPipeline.css';
import { useTranslation } from 'react-i18next';
import { filterManualMatchingQueueClients } from '../../utils/manualMatchingQueueUtils';
import { DASHBOARD_KPI_IDS, API_ADMIN_SCHEDULES, DASHBOARD_REFUND_SECTION_CTA_LABEL } from '../../constants/adminDashboardWidgetConstants';

// T5 표준화 2026-05-21: API 경로 리터럴 → 로컬 상수 (운영 게이트 P0)
// /api/v1/admin/mappings 는 SSOT(API_ENDPOINTS.ADMIN.MAPPINGS.LIST) 사용
const API_ADMIN_CLIENTS_WITH_MAPPING_INFO = '/api/v1/admin/clients/with-mapping-info';
const API_ADMIN_CONSULTANT_RATING_STATS = '/api/v1/admin/consultant-rating-stats';
const API_ADMIN_STATISTICS_CONSULTATION_COMPLETION = '/api/v1/admin/statistics/consultation-completion';
const API_ADMIN_REFUND_STATISTICS = '/api/v1/admin/refund-statistics?period=month';
const API_ADMIN_MAPPINGS_PENDING_DEPOSIT = '/api/v1/admin/mappings/pending-deposit';
const API_ADMIN_SCHEDULES_AUTO_COMPLETE = '/api/v1/admin/schedules/auto-complete';
const API_ADMIN_SCHEDULES_AUTO_COMPLETE_WITH_REMINDER = '/api/v1/admin/schedules/auto-complete-with-reminder';
const API_ADMIN_DUPLICATE_MAPPINGS = '/api/v1/admin/duplicate-mappings';
const API_ADMIN_MERGE_DUPLICATE_MAPPINGS = '/api/v1/admin/merge-duplicate-mappings';


/** 단계별 현황 도넛 차트 라벨 (5단계) */
const STEP_CHART_LABELS = [
  '매칭',
  '입금 확인',
  '회기 권한',
  '스케줄 등록',
  '회계처리'
];

const AdminDashboardV2 = ({ user: propUser }) => {
  const { t } = useTranslation(['admin', 'common']);
  const [confirm, ConfirmModal] = useConfirm();
  const navigate = useNavigate();
  const { user: sessionUser, isLoading: sessionLoading, logout, hasRole } = useSession();
  const { mode: darkMode, resolved: darkResolved, toggle: toggleDarkMode } = useDarkMode();
  const dashboardUser = propUser || sessionUser;

  const canManageClients = hasRole(USER_ROLES.ADMIN) || hasRole(USER_ROLES.STAFF);

  const [flippedKpiId, setFlippedKpiId] = useState(null);

  const handleKpiFlip = useCallback((id) => {
    setFlippedKpiId(prev => prev === id ? null : id);
  }, []);

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
  const [pendingDepositList, setPendingDepositList] = useState([]);
  const [schedulePendingList, setSchedulePendingList] = useState([]);
  const [matchingQueueLoading, setMatchingQueueLoading] = useState(false);
  const [depositModalMapping, setDepositModalMapping] = useState(null);
  const [showErpReport, setShowErpReport] = useState(false);
  const [showPerformanceMetrics, setShowPerformanceMetrics] = useState(false);
  const [showSpecialtyManagement, setShowSpecialtyManagement] = useState(false);
  const [showRecurringExpense, setShowRecurringExpense] = useState(false);
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

  /**
   * R6 (2026-06-06) Phase 3-B — 「상담사 별 통합데이터」 카드 확장.
   * - §A 누적: 집계 기간이 '전체' 일 때만 노출 (전체 기간 SSOT — useCumulativeConsultantCounts)
   * - §B 월별: 집계 기간이 '월별' 일 때만 노출 (integratedDataYear/Month — 사용자 선택 월)
   * - §C 누락: 모든 탭에서 항상 노출, «지난 일정» 전체 누적 기준 (월 경계 비의존).
   *   현재 월만 조회하면 월초에 이전 달 누락 건이 사라지는 버그가 있어 누적 SSOT로 통일.
   *
   * 캐시·tenantId 리셋·cancelled race 패턴은 hook 내부에서 보존.
   */
  const { counts: cumulativeConsultantCounts } = useCumulativeConsultantCounts();
  const { counts: monthlyConsultantCountsForCard } = useMonthlyConsultantCounts(
    integratedDataPeriodType === 'month' ? integratedDataYear : null,
    integratedDataPeriodType === 'month' ? integratedDataMonth : null
  );
  const { items: missingConsultationLogsForCard } = useCumulativeMissingConsultationLogs();

  const [searchValue, setSearchValue] = useState('');
  /** 헤더 통합 검색(placeholder 전용, 라우트/메뉴 연동 없음) */
  /** 상담 현황 추이 막대 차트 색상 (CSS 변수 resolved, Canvas용) */
  const [chartBarColors, setChartBarColors] = useState({
    fill: B0KLA_CHART_BAR_FALLBACK.FILL,
    border: B0KLA_CHART_BAR_FALLBACK.BORDER
  });
  const [chartCanvasTheme, setChartCanvasTheme] = useState({
    tick: '#6B7280',
    grid: '#E5E7EB',
    tooltipBg: '#FFFFFF',
    tooltipText: '#111827',
    legend: '#374151'
  });
  const chartBarWrapperRef = useRef(null);
  const lineChartWrapperRef = useRef(null);
  const isInitialized = useRef(false);

  /** B0KlA 차트 막대/라인·축 색상: CSS 변수를 resolved 값으로 읽어 Canvas에 전달 (다크모드 연동) */
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
    setChartCanvasTheme({
      tick: resolveCssColorVarToHex('--mg-v2-color-text-secondary', '#6B7280'),
      grid: resolveCssColorVarToHex('--mg-v2-color-border-light', '#E5E7EB'),
      tooltipBg: resolveCssColorVarToHex('--mg-v2-color-surface-raised', '#FFFFFF'),
      tooltipText: resolveCssColorVarToHex('--mg-v2-color-text-primary', '#111827'),
      legend: resolveCssColorVarToHex('--mg-v2-color-text-secondary', '#6B7280')
    });
  }, [chartPeriod, lineChartPeriod, darkResolved]);

  /**
   * 단계별 도넛 차트 색상: B0KLA_STEP_CHART_HEX 의 `var(--*)` 항목을 Canvas 호환 색으로 resolve.
   *
   * 배경:
   *   Chart.js 는 backgroundColor 문자열을 HTML5 Canvas 의 ctx.fillStyle 에 그대로 대입한다.
   *   Canvas 사양상 `var(--*)` 표기는 파싱되지 않아 잘못된 값은 무시되고 슬라이스가 검정으로
   *   렌더된다 (어드민 대시보드 5단계 도넛 P1 시각 결함).
   *
   * 해결:
   *   B0KLA_STEP_CHART_HEX 는 SSOT 토큰 참조(charts.js)를 그대로 유지하고, Canvas 전달 직전에
   *   :root 의 computed style 에서 토큰 값을 읽어 해석한다. 다크 모드 cascade 도 동일 헬퍼가
   *   자동 처리 (`:root[data-theme="dark"]` override 자동 반영).
   */
  const stepChartCanvasColors = useMemo(
    () => resolveCssColorTokensArray(B0KLA_STEP_CHART_HEX),
    [darkResolved]
  );

  const chartJsScaleOptions = useMemo(
    () => ({
      x: {
        grid: { display: false },
        ticks: { maxRotation: 0, font: { size: 11 }, color: chartCanvasTheme.tick }
      },
      y: {
        beginAtZero: true,
        ticks: { stepSize: 1, color: chartCanvasTheme.tick },
        grid: { color: chartCanvasTheme.grid }
      }
    }),
    [chartCanvasTheme]
  );

  const chartJsTooltipOptions = useMemo(
    () => ({
      backgroundColor: chartCanvasTheme.tooltipBg,
      titleColor: chartCanvasTheme.tooltipText,
      bodyColor: chartCanvasTheme.tooltipText,
      borderColor: chartCanvasTheme.grid,
      borderWidth: 1
    }),
    [chartCanvasTheme]
  );

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
        role: urlParams.get('role') || USER_ROLES.ADMIN,
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
        fetch(API_ADMIN_CLIENTS_WITH_MAPPING_INFO, { headers, credentials: 'include' }),
        fetch(API_ENDPOINTS.ADMIN.MAPPINGS.LIST, { headers, credentials: 'include' }),
        fetch(API_ADMIN_CONSULTANT_RATING_STATS, { headers, credentials: 'include' }),
        fetch(API_ADMIN_STATISTICS_CONSULTATION_COMPLETION, { headers, credentials: 'include' })
      ]);
      const consultantsRes = settled[0].status === 'fulfilled' ? settled[0].value : dummyFailedResponse();
      const clientsRes = settled[1].status === 'fulfilled' ? settled[1].value : dummyFailedResponse();
      const mappingsRes = settled[2].status === 'fulfilled' ? settled[2].value : dummyFailedResponse();
      const ratingRes = settled[3].status === 'fulfilled' ? settled[3].value : dummyFailedResponse();
      const consultationRes = settled[4].status === 'fulfilled' ? settled[4].value : dummyFailedResponse();

      // [Dashboard Charts] consultation-completion 호출 결과(상담 현황 추이/예약 vs 완료 차트용)
      if (settled[4].status === 'rejected') {
        console.warn('[Dashboard Charts] consultation-completion 요청 실패 (rejected):', settled[4].reason);
      } else {
        const res = settled[4].value;
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

      setStats({
        totalConsultants,
        totalClients,
        totalMappings,
        activeMappings,
        consultantRatingStats,
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
      const response = await fetch(API_ADMIN_REFUND_STATISTICS, { headers, credentials: 'include' });
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
      const clientsRes = await StandardizedApi.get(API_ADMIN_CLIENTS_WITH_MAPPING_INFO);
      const clientsRaw = clientsRes?.clients ?? clientsRes?.data?.clients ?? [];
      const clients = Array.isArray(clientsRaw) ? clientsRaw : [];
      const unassigned = filterManualMatchingQueueClients(clients);
      setUnassignedClients(unassigned);
    } catch (error) {
      console.error('미배정 내담자 로드 실패:', error);
      notificationManager.error(error?.message || t('admin:dashboard.error.unassignedLoad'));
      setUnassignedClients([]);
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
      const oldestHours =
        pendingList.length > 0
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

  const loadSchedulePendingList = useCallback(async() => {
    try {
      const data = await StandardizedApi.get(API_ADMIN_SCHEDULES, { status: 'BOOKED' });
      const rawSchedules =
        data?.schedules ?? data?.data?.schedules ?? (Array.isArray(data) ? data : []);
      const bookedList = Array.isArray(rawSchedules) ? rawSchedules : [];
      setSchedulePendingList(bookedList);
    } catch (error) {
      console.error('스케줄 등록 대기 목록 로드 실패:', error);
      notificationManager.error(error?.message || '스케줄 등록 대기 목록을 불러오지 못했습니다.');
      setSchedulePendingList([]);
    }
  }, []);

  const handleAutoCompleteSchedules = async() => {
    setAutoCompleteLoading(true);
    try {
      const response = await csrfTokenManager.post(API_ADMIN_SCHEDULES_AUTO_COMPLETE);
      if (response.ok) {
        const result = await response.json();
        showToast(result.message || t('admin:dashboard.autoComplete.success'));
        loadStats();
      } else {
        const err = await response.json();
        showToast(err.message || t('admin:dashboard.autoComplete.failed'), 'danger');
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
      const response = await csrfTokenManager.post(
        API_ADMIN_SCHEDULES_AUTO_COMPLETE_WITH_REMINDER
      );
      if (response.ok) {
        const result = await response.json();
        showToast(result.message || t('admin:dashboard.autoCompleteReminder.success'));
        loadStats();
      } else {
        const err = await response.json();
        showToast(err.message || t('admin:dashboard.autoCompleteReminder.failed'), 'danger');
      }
    } catch (error) {
      console.error('스케줄 자동 완료 처리 및 알림 실패:', error);
      showToast(t('admin:dashboard.autoCompleteReminder.failed'), 'danger');
    } finally {
      setAutoCompleteWithReminderLoading(false);
    }
  };

  const handleMergeDuplicateMappings = async() => {
    setMergeDuplicateLoading(true);
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
      const confirmed = await confirm({
        message: t('admin:dashboard.duplicate.confirmMerge', { count: checkResult.count }),
        variant: 'warning'
      });
      if (!confirmed) return;
      const response = await csrfTokenManager.post(API_ADMIN_MERGE_DUPLICATE_MAPPINGS);
      if (response.ok) {
        const result = await response.json();
        showToast(result.message || t('admin:dashboard.duplicate.mergeSuccess'));
        loadStats();
        loadRefundStats();
      } else {
        const err = await response.json();
        showToast(err.message || t('admin:dashboard.duplicate.mergeFailed'), 'danger');
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
    loadSchedulePendingList();
    loadUnassignedClientsAndConsultants();
    if (!sessionLoading) {
      const user = propUser || sessionUser;
      if (user?.role) loadTodayStats();
    }
  }, [
    loadStats,
    loadRefundStats,
    loadPendingDepositStats,
    loadSchedulePendingList,
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
      loadSchedulePendingList();
      loadPendingDepositStats();
    };
    window.addEventListener('admin-dashboard-refresh-stats', handler);
    return () => window.removeEventListener('admin-dashboard-refresh-stats', handler);
  }, [loadStats, loadTodayStats, loadSchedulePendingList, loadPendingDepositStats]);

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

  const formatGrowthBadge = useCallback((growthRate) => {
    if (growthRate == null || !Number.isFinite(Number(growthRate))) {
      return null;
    }
    const rate = Number(growthRate);
    if (rate === 0) {
      return '변동 없음';
    }
    return `${rate > 0 ? '+' : ''}${rate}%`;
  }, []);

  const kpiSparklineWeekly = useMemo(() => {
    const weeklyRows = stats.consultationStats?.weeklyData;
    return {
      booked: extractSparklineValues(weeklyRows, 'bookedCount'),
      completed: extractSparklineValues(weeklyRows, 'completedCount')
    };
  }, [stats.consultationStats?.weeklyData]);

  const HEADER_ICON_SIZE = 20;

  // 다크 모드 3단 토글 — 아이콘 / 라벨 / aria-pressed 동기화
  const ThemeIcon = darkMode === DARK_MODE_VALUES.AUTO
    ? Palette
    : darkResolved === DARK_MODE_VALUES.DARK
      ? Sun
      : Moon;
  const themeButtonLabel = t(
    `common:dashboard-v2.AdminDashboardV2.theme_${darkMode}`
  );

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
            aria-label={t('common:dashboard-v2.AdminDashboardV2.t_b2cb2d40')}
            title={t('common:dashboard-v2.AdminDashboardV2.t_b2cb2d40')}
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
            aria-label={t('admin.labels.notification')}
            title={t('admin.labels.notification')}
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
            aria-label={themeButtonLabel}
            aria-pressed={darkResolved === DARK_MODE_VALUES.DARK}
            title={themeButtonLabel}
            onClick={toggleDarkMode}
            preventDoubleClick={false}
          >
            <ThemeIcon size={HEADER_ICON_SIZE} strokeWidth={2} aria-hidden />
          </MGButton>
        </div>
      </div>
    );

  const mainContent = (
    <div className="mg-v2-ad-b0kla" data-testid="admin-dashboard-v2-page">
      <div className="mg-v2-ad-b0kla__container">
    <ContentArea>
      <ContentHeader
        title={t('admin:dashboard.v2.title')}
        subtitle={t('admin:dashboard.subtitle')}
        actions={headerActions}
      />

      {/* KPI 4블록 — Compact KpiFlipCard (G1-02) */}
      <section
        className="mg-v2-dashboard-kpi-zone mg-v2-dashboard-kpi-zone--compact"
        aria-labelledby="admin-dashboard-kpi-zone-title"
      >
        <h2 id="admin-dashboard-kpi-zone-title" className="sr-only">
          {t('admin:dashboard.v2.title')}
        </h2>
        <div className="mg-v2-kpi-flip-row" role="list" aria-label="핵심 KPI">
        <KpiFlipCard
          id={DASHBOARD_KPI_IDS.TODAY_BOOKINGS}
          label="금일 예약"
          value={`${toSafeNumber(todayStats.bookedToday, 0) + toSafeNumber(todayStats.confirmedToday, 0)}건`}
          summary={`예약 ${toSafeNumber(todayStats.bookedToday, 0)} · 확정 ${toSafeNumber(todayStats.confirmedToday, 0)}`}
          variant="orange"
          sparklineData={kpiSparklineWeekly.booked}
          trendBadge={formatGrowthBadge(todayStats.bookedGrowthRate)}
          trendAriaLabel={buildTrendAriaLabel(todayStats.bookedGrowthRate)}
          backContent={
            <ul className="mg-v2-kpi-flip-card__back-list">
              <li className="mg-v2-kpi-flip-card__back-list-item">
                <span>완료</span>
                <strong>{toSafeNumber(todayStats.completedToday, 0)}건</strong>
              </li>
              <li className="mg-v2-kpi-flip-card__back-list-item">
                <span>진행 중</span>
                <strong>{toSafeNumber(todayStats.inProgressToday, 0)}건</strong>
              </li>
            </ul>
          }
          ctaLabel="일정 보기"
          onCtaClick={() => navigate(ADMIN_ROUTES.INTEGRATED_SCHEDULE)}
          isFlipped={flippedKpiId === DASHBOARD_KPI_IDS.TODAY_BOOKINGS}
          onFlip={handleKpiFlip}
        />
        <KpiFlipCard
          id={DASHBOARD_KPI_IDS.PENDING_PAYMENT}
          label="미결제"
          value={`${toSafeNumber(pendingDepositStats.count, 0)}건`}
          summary={`대기 금액 ${toSafeNumber(pendingDepositStats.totalAmount, 0).toLocaleString()}원`}
          variant="blue"
          backContent={
            <p>입금 확인 대기 중인 매칭 건입니다.</p>
          }
          ctaLabel="전체 보기"
          onCtaClick={() => navigate(`${ADMIN_ROUTES.MAPPING_MANAGEMENT}?status=PENDING_PAYMENT`)}
          isFlipped={flippedKpiId === DASHBOARD_KPI_IDS.PENDING_PAYMENT}
          onFlip={handleKpiFlip}
        />
        <KpiFlipCard
          id={DASHBOARD_KPI_IDS.NO_SHOW}
          label="노쇼"
          value={`${toSafeNumber(todayStats.cancelledToday, 0)}건`}
          summary="금일 취소·노쇼"
          variant="gray"
          backContent={
            <p>금일 취소된 일정 건수입니다.</p>
          }
          ctaLabel="알림 센터"
          onCtaClick={() => navigate(ADMIN_ROUTES.NOTIFICATIONS)}
          isFlipped={flippedKpiId === DASHBOARD_KPI_IDS.NO_SHOW}
          onFlip={handleKpiFlip}
        />
        <KpiFlipCard
          id={DASHBOARD_KPI_IDS.ACTIVE_SESSIONS}
          label="활성"
          value={`${toSafeNumber(stats.activeMappings, 0)}건`}
          summary={`전체 매칭 ${toSafeNumber(stats.totalMappings, 0)}건`}
          variant="green"
          sparklineData={kpiSparklineWeekly.completed}
          trendBadge={formatGrowthBadge(stats.consultationStats?.completionRateChange)}
          trendAriaLabel={buildTrendAriaLabel(stats.consultationStats?.completionRateChange)}
          backContent={
            <p>현재 활성 상태의 매칭 세션입니다.</p>
          }
          ctaLabel="매칭 관리"
          onCtaClick={() => navigate(`${ADMIN_ROUTES.MAPPING_MANAGEMENT}?status=ACTIVE`)}
          isFlipped={flippedKpiId === DASHBOARD_KPI_IDS.ACTIVE_SESSIONS}
          onFlip={handleKpiFlip}
        />
        </div>
      </section>

      <ContentCard className="mg-v2-content-card--pipeline">
        <AdminMetricsVisualization
          variant="option-c"
          loading={loading}
          stats={{
            totalMappings: stats.totalMappings,
            pendingDepositCount: pendingDepositStats.count,
            activeMappings: stats.activeMappings,
            schedulePendingCount: schedulePendingList.length
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
                {t('common:dashboard-v2.AdminDashboardV2.t_01c7a211')}
              </h2>
            </div>
            <div className="mg-v2-content-visualization-group__grid">
              <div className="mg-v2-ad-b0kla__card">
                <div className="mg-v2-ad-b0kla__chart-header">
                  <div>
                    <h3 className="mg-v2-ad-b0kla__chart-title">{t('admin:dashboard.chartTitle')}</h3>
                <p className="mg-v2-ad-b0kla__chart-desc">
                  {chartPeriod === 'weekly' ? t('admin:dashboard.chartWeeklySubtitle') : t('admin:dashboard.chartSubtitle')}
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
                  {t('admin:dashboard.v2.period.monthly')}
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
                  {t('admin:dashboard.v2.period.weekly')}
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
                  ? resolveRollingWeeklyChartRows(
                    stats.consultationStats?.weeklyData,
                    DASHBOARD_CHART_ROLLING_WEEKS
                  )
                  : resolveRollingMonthlyChartRows(
                    stats.consultationStats?.monthlyData,
                    DASHBOARD_CHART_ROLLING_MONTHS
                  );
                const values = rawData.map((d) => d.completedCount || 0);
                const allZero = values.length > 0 && values.every((v) => v === 0);
                if (allZero) {
                  return (
                    <p className="mg-v2-ad-b0kla__chart-empty">{t('common:dashboard-v2.AdminDashboardV2.t_385902d3')}</p>
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
                          ...chartJsTooltipOptions,
                          callbacks: {
                            label: (ctx) => `완료: ${ctx.parsed.y}건`
                          }
                        }
                      },
                      scales: {
                        ...chartJsScaleOptions,
                        y: {
                          ...chartJsScaleOptions.y,
                          suggestedMax: Math.max(maxVal + 1, 2)
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
                <h3 className="mg-v2-ad-b0kla__chart-title">{t('common:dashboard-v2.AdminDashboardV2.t_7c466a6b')}</h3>
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
                  {t('common:dashboard-v2.AdminDashboardV2.t_e81e0fc4')}
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
                  {t('common:dashboard-v2.AdminDashboardV2.t_9cbaf58b')}
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
                  ? resolveRollingWeeklyChartRows(
                    stats.consultationStats?.weeklyData,
                    DASHBOARD_CHART_ROLLING_WEEKS
                  )
                  : resolveRollingMonthlyChartRows(
                    stats.consultationStats?.monthlyData,
                    DASHBOARD_CHART_ROLLING_MONTHS
                  );
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
                      {t('common:dashboard-v2.AdminDashboardV2.t_04eae6b1')}
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
                          labels: {
                            usePointStyle: true,
                            padding: 12,
                            font: { size: 11 },
                            color: chartCanvasTheme.legend
                          }
                        },
                        tooltip: {
                          ...chartJsTooltipOptions,
                          callbacks: {
                            label: (ctx) => `${ctx.dataset.label}: ${ctx.parsed.y}건`
                          }
                        }
                      },
                      scales: {
                        ...chartJsScaleOptions,
                        y: {
                          ...chartJsScaleOptions.y,
                          suggestedMax: Math.max(maxVal + 1, 2)
                        }
                      }
                    }}
                  />
                );
              })()}
            </div>
          </div>
          <div className="mg-v2-ad-b0kla__card">
            <h3 className="mg-v2-ad-b0kla__chart-title">{t('common:dashboard-v2.AdminDashboardV2.t_e46896c4')}</h3>
            <p className="mg-v2-ad-b0kla__chart-desc">{t('common:dashboard-v2.AdminDashboardV2.t_0b7b7f1d')}</p>
            <div className="mg-v2-ad-b0kla__chart-placeholder mg-v2-ad-b0kla__chart-wrapper mg-v2-ad-b0kla__chart-wrapper--donut">
              {(() => {
                const stepValues = [
                  stats.totalMappings ?? 0,
                  pendingDepositStats.count ?? 0,
                  stats.activeMappings ?? 0,
                  schedulePendingList.length,
                  0
                ];
                const total = stepValues.reduce((a, b) => a + b, 0);
                const allZero = total === 0;
                if (allZero) {
                  return (
                    <p className="mg-v2-ad-b0kla__chart-empty">{t('common:dashboard-v2.AdminDashboardV2.t_ec38756f')}</p>
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
                          backgroundColor: stepChartCanvasColors,
                          borderColor: stepChartCanvasColors,
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
                          labels: {
                            usePointStyle: true,
                            padding: 12,
                            font: { size: 11 },
                            color: chartCanvasTheme.legend
                          }
                        },
                        tooltip: {
                          ...chartJsTooltipOptions,
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
          <h3 className="mg-v2-ad-b0kla__counselor-title">{t('common:dashboard-v2.AdminDashboardV2.t_8d3e51bd')}</h3>
          <p className="mg-v2-ad-b0kla__counselor-subtitle">{t('common:dashboard-v2.AdminDashboardV2.t_a785fe0e')}</p>
          <div className="mg-v2-ad-b0kla__integrated-data-period">
            <span className="mg-v2-ad-b0kla__integrated-data-period-label">{t('common:dashboard-v2.AdminDashboardV2.t_11d00e88')}</span>
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
                {t('admin.labels.all')}
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
                {t('common:dashboard-v2.AdminDashboardV2.t_12966a35')}
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
                {t('common:dashboard-v2.AdminDashboardV2.t_219c86c5')}
              </MGButton>
            </div>
            {integratedDataPeriodType === 'month' && (
              <div className="mg-v2-ad-b0kla__integrated-data-month-picker">
                <select
                  aria-label={t('common:dashboard-v2.AdminDashboardV2.t_b35716f4')}
                  value={integratedDataYear}
                  onChange={(e) => setIntegratedDataYear(Number(e.target.value))}
                  className="mg-v2-ad-b0kla__select mg-v2-ad-b0kla__select--sm"
                >
                  {Array.from({ length: 5 }, (_, i) => new Date().getFullYear() - i).map((y) => (
                    <option key={y} value={y}>{y}년</option>
                  ))}
                </select>
                <select
                  aria-label={t('common:dashboard-v2.AdminDashboardV2.t_681272a5')}
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
            <SegmentedTabs
              ariaLabel={t('common:dashboard-v2.AdminDashboardV2.t_207726af')}
              items={[
                { value: 'table', label: t('common:dashboard-v2.AdminDashboardV2.t_fac1ca9e') },
                { value: 'graph', label: t('common:dashboard-v2.AdminDashboardV2.t_dde8c315') },
                { value: 'progress', label: t('common:dashboard-v2.AdminDashboardV2.t_24f72a6f') },
              ]}
              activeValue={integratedDataView}
              onChange={setIntegratedDataView}
              size="sm"
              className="mg-v2-ad-b0kla__pill-toggle"
            />
          </div>
          <div className="mg-v2-ad-b0kla__integrated-data-wrap">
            {consultantIntegratedData.length > 0 ? (
              <>
                {integratedDataView === 'table' && (
                  <>
                    <div className="mg-v2-ad-b0kla__integrated-data-header">
                      <span className="mg-v2-ad-b0kla__integrated-data-th mg-v2-ad-b0kla__integrated-data-th--rank">{t('common:dashboard-v2.AdminDashboardV2.t_d15876f1')}</span>
                      <span className="mg-v2-ad-b0kla__integrated-data-th">{t('common:dashboard-v2.AdminDashboardV2.t_55daf2fa')}</span>
                      <span className="mg-v2-ad-b0kla__integrated-data-th">{t('common:dashboard-v2.AdminDashboardV2.t_d2473dd4')}</span>
                      <span className="mg-v2-ad-b0kla__integrated-data-th">{t('common:dashboard-v2.AdminDashboardV2.t_34e293ee')}</span>
                      <span className="mg-v2-ad-b0kla__integrated-data-th">{t('common:dashboard-v2.AdminDashboardV2.t_611cadb3')}</span>
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
                {t('common:dashboard-v2.AdminDashboardV2.t_312e7722')}
              </p>
            )}
          </div>

          {/*
            P1 (2026-06-06) — §A 누적 상담 건수 (집계 기간 = '전체' 일 때만 노출).
            CumulativeConsultantCountsChart: 가로 막대 그래프 + 정확한 카운트(99+ 축약 없음).
            상담사 명단은 통합데이터 rows 에서 가져오고, count 는 useCumulativeConsultantCounts 훅 결과 사용.
          */}
          {integratedDataPeriodType === 'all' && consultantIntegratedData.length > 0 && (
            <section
              className="mg-v2-ad-b0kla__cumulative-section"
              aria-label={t('admin:dashboard.consultationStats.cumulativeTitle', {
                defaultValue: '누적 상담 건수'
              })}
            >
              <h4 className="mg-v2-ad-b0kla__cumulative-title">
                {t('admin:dashboard.consultationStats.cumulativeTitle', {
                  defaultValue: '누적 상담 건수'
                })}
              </h4>
              <CumulativeConsultantCountsChart
                consultants={consultantIntegratedData
                  .filter((row) => row.consultantId != null)
                  .map((row) => ({
                    id: row.consultantId,
                    name: row.consultantName,
                    isActive: true
                  }))}
                getConsultantColor={getConsultantColor}
                consultantCounts={cumulativeConsultantCounts}
                sectionClassName="mg-v2-cumulative-chart mg-v2-ad-b0kla__cumulative-chart"
                titleClassName="sr-only"
                maskName={(name) => maskEncryptedDisplay(name, '상담사')}
              />
            </section>
          )}

          {/*
            R6 (2026-06-06) Phase 3-B — §B 월별 상담 건수 (집계 기간 = '월별' 일 때만 노출).
            integratedDataYear/Month 기준 — 사용자가 선택한 월. ConsultantCountsBadgeList 재사용.
          */}
          {integratedDataPeriodType === 'month' && consultantIntegratedData.length > 0 && (
            <section
              className="mg-v2-ad-b0kla__monthly-counts-section"
              aria-label={t('admin:dashboard.consultationStats.monthlyTitle', {
                defaultValue: '월별 상담 건수'
              })}
            >
              <h4 className="mg-v2-ad-b0kla__monthly-counts-title">
                {t('admin:dashboard.consultationStats.monthlyTitle', {
                  defaultValue: '월별 상담 건수'
                })}
              </h4>
              <ConsultantCountsBadgeList
                consultants={consultantIntegratedData
                  .filter((row) => row.consultantId != null)
                  .map((row) => ({
                    id: row.consultantId,
                    name: row.consultantName,
                    isActive: true
                  }))}
                getConsultantColor={getConsultantColor}
                consultantCounts={monthlyConsultantCountsForCard}
                consultantCountsMonth={integratedDataMonth}
                mode="monthly"
                titleClassName="sr-only"
                itemsClassName="mg-v2-legend-items mg-v2-consultant-legend mg-v2-ad-b0kla__monthly-counts-items"
              />
            </section>
          )}

          {/*
            R6 (2026-06-06) Phase 3-B — §C 상담일지 누락 (모든 탭 — 항상 노출).
            currentYear/Month 기준. items === null (첫 응답 미수신) 시 컴포넌트가 자동 숨김.
            MissingConsultationLogsList variant='dashboard' — 「지난 일정의 모든 상담일지가 작성되었습니다」 placeholder.
          */}
          <section
            className="mg-v2-ad-b0kla__missing-logs-section"
            aria-label={t('admin:dashboard.consultationStats.missingLogsTitle', {
              defaultValue: '상담일지 누락'
            })}
          >
            <h4 className="mg-v2-ad-b0kla__missing-logs-title">
              {t('admin:dashboard.consultationStats.missingLogsTitle', {
                defaultValue: '상담일지 누락'
              })}
            </h4>
            <MissingConsultationLogsList
              items={missingConsultationLogsForCard}
              variant="dashboard"
              sectionClassName="mg-v2-ad-b0kla__missing-logs-body mg-v2-legend-missing-logs"
              showTitle={false}
            />
          </section>
        </div>
      </div>

      {!HIDE_DASHBOARD_MENUS && (
      <ContentSection
        title={t('common:dashboard-v2.AdminDashboardV2.t_ac9f714d')}
        subtitle="최근 1개월 환불 통계"
      >
        <div className="mg-stats-grid mg-stats-grid--display-only">
          <StatCard
            icon={<Icon name="RECEIPT" size="LG" color="TRANSPARENT" />}
            value={`${refundStats.totalRefundCount}건`}
            label={t('common:dashboard-v2.AdminDashboardV2.t_e07e5754')}
          />
          <StatCard
            icon={<FaCalendarAlt />}
            value={`${refundStats.totalRefundedSessions}회`}
            label={t('common:dashboard-v2.AdminDashboardV2.t_7362540d')}
          />
          <StatCard
            icon={<Icon name="DOLLAR_SIGN" size="LG" color="TRANSPARENT" />}
            value={`${refundStats.totalRefundAmount.toLocaleString()}원`}
            label={t('common:dashboard-v2.AdminDashboardV2.t_ca5c157c')}
          />
          <StatCard
            icon={<Icon name="TRENDING_UP" size="LG" color="TRANSPARENT" />}
            value={`${refundStats.averageRefundPerCase.toLocaleString()}원`}
            label={t('common:dashboard-v2.AdminDashboardV2.t_5c45c1f3')}
          />
        </div>
        <div className="mg-v2-ad-b0kla__refund-cta">
          <MGButton
            type="button"
            variant="primary"
            className={buildErpMgButtonClassName({ variant: 'primary', size: 'md', loading: false })}
            loadingText={ERP_MG_BUTTON_LOADING_TEXT}
            onClick={() => navigate(`${ADMIN_ROUTES.MAPPING_MANAGEMENT}?tab=refunds`)}
          >
            {DASHBOARD_REFUND_SECTION_CTA_LABEL}
          </MGButton>
        </div>
      </ContentSection>
      )}

      <ManualMatchingQueue
        items={unassignedClients.map((client) => ({
          id: client.id,
          clientName: client.name || '-',
          clientMeta: client.email || '매칭 없음'
        }))}
        viewAllHref={ADMIN_ROUTES.CLIENT_COMPREHENSIVE}
        loading={matchingQueueLoading}
      />

      <div className="mg-v2-content-detail-row">
        <DepositPendingList
          items={pendingDepositList.map((m) => ({
            id: m.id,
            clientName: m.clientName,
            amount: m.packagePrice
          }))}
          viewAllHref={`${ADMIN_ROUTES.MAPPING_MANAGEMENT}?status=PENDING_PAYMENT`}
        />
        <SchedulePendingList
          items={schedulePendingList.map((s) => ({
            id: String(s.id),
            clientName: s.clientName,
            consultantName: s.consultantName
          }))}
          viewAllHref={ADMIN_ROUTES.INTEGRATED_SCHEDULE}
        />
      </div>

      <ContentSection
        title={t('common:dashboard-v2.AdminDashboardV2.t_e05c0827')}
        subtitle="시스템 관리 및 설정 기능"
      >
        <div className="mg-v2-ad-b0kla__admin-grid">
          <AdminMgmtNavCard
            to={ADMIN_ROUTES.USER_MANAGEMENT}
            icon={Users}
            tone="blue"
            label={t('admin.labels.userManagement')}
            description={t('common:dashboard-v2.AdminDashboardV2.t_5b997a6e')}
          />
          <AdminMgmtNavCard
            to={ADMIN_ROUTES.INTEGRATED_SCHEDULE}
            icon={CalendarDays}
            tone="green"
            label={t('common:dashboard-v2.AdminDashboardV2.t_d67bbae4')}
            description={t('common:dashboard-v2.AdminDashboardV2.t_bc774ca3')}
          />
          <AdminMgmtNavCard
            to={ADMIN_ROUTES.CONSULTATION_LOGS}
            icon={ClipboardList}
            tone="orange"
            label={t('common:dashboard-v2.AdminDashboardV2.t_f00037ae')}
            description={t('common:dashboard-v2.AdminDashboardV2.t_da19d0b8')}
          />
          {!HIDE_ADMIN_CARD_IDS.has('sessions') && (
            <AdminMgmtNavCard
              to={ADMIN_ROUTES.MAPPING_MANAGEMENT}
              icon={Target}
              tone="gray"
              label={t('common:dashboard-v2.AdminDashboardV2.t_be89c264')}
              description={t('common:dashboard-v2.AdminDashboardV2.t_6d774c2e')}
            />
          )}
          {!HIDE_ADMIN_CARD_IDS.has('schedule-auto-complete') && (
            <AdminMgmtActionCard
              onClick={handleAutoCompleteSchedules}
              loading={autoCompleteLoading}
              icon={CheckCircle}
              tone="green"
              label={t('common:dashboard-v2.AdminDashboardV2.t_7ad7a72d')}
              description={t('common:dashboard-v2.AdminDashboardV2.t_b1698575')}
            />
          )}
          {!HIDE_ADMIN_CARD_IDS.has('schedule-complete-reminder') && (
            <AdminMgmtActionCard
              onClick={handleAutoCompleteWithReminder}
              loading={autoCompleteWithReminderLoading}
              icon={BellRing}
              tone="orange"
              label={t('common:dashboard-v2.AdminDashboardV2.t_4a726da5')}
              description={t('common:dashboard-v2.AdminDashboardV2.t_d9e01adc')}
            />
          )}
          {!HIDE_ADMIN_CARD_IDS.has('consultant-comprehensive') && (
            <AdminMgmtNavCard
              to={ADMIN_ROUTES.CONSULTANT_COMPREHENSIVE}
              icon={UserCog}
              tone="blue"
              label={t('admin.labels.consultantManagement')}
              description={t('common:dashboard-v2.AdminDashboardV2.t_880e9dbb')}
            />
          )}
          {!HIDE_ADMIN_CARD_IDS.has('client-comprehensive') && canManageClients && (
            <AdminMgmtNavCard
              to={ADMIN_ROUTES.CLIENT_COMPREHENSIVE}
              icon={UserRound}
              tone="green"
              label={t('admin.labels.clientManagement')}
              description={t('common:dashboard-v2.AdminDashboardV2.t_9ee4da97')}
            />
          )}
          <AdminMgmtNavCard
            to={ADMIN_ROUTES.MAPPING_MANAGEMENT}
            icon={Link2}
            tone="orange"
            label={t('common:dashboard-v2.AdminDashboardV2.t_fd7633e1')}
            description={t('common:dashboard-v2.AdminDashboardV2.t_04f1992b')}
          />
          {!HIDE_ADMIN_CARD_IDS.has('schedule-management') && (
            <AdminMgmtNavCard
              to={ADMIN_ROUTES.INTEGRATED_SCHEDULE}
              icon={Calendar}
              tone="green"
              label={t('common:dashboard-v2.AdminDashboardV2.t_6ddcca42')}
              description={t('common:dashboard-v2.AdminDashboardV2.t_ad9cf841')}
            />
          )}
          {!HIDE_ADMIN_CARD_IDS.has('user-management') && PermissionChecks.canManageUsers(userPermissions) && (
            <AdminMgmtNavCard
              to={ADMIN_ROUTES.USER_MANAGEMENT}
              icon={Users}
              tone="blue"
              label={t('admin.labels.userManagement')}
              description={t('common:dashboard-v2.AdminDashboardV2.t_fbc2c417')}
            />
          )}
          <AdminMgmtNavCard
            to={ADMIN_ROUTES.COMMON_CODES}
            icon={Tags}
            tone="gray"
            label={t('common:dashboard-v2.AdminDashboardV2.t_8314805e')}
            description={t('common:dashboard-v2.AdminDashboardV2.t_7af6ac13')}
          />
          <AdminMgmtNavCard
            to={ADMIN_ROUTES.PACKAGE_PRICING}
            icon={Package}
            tone="orange"
            label={t('common:dashboard-v2.AdminDashboardV2.t_72264d4a')}
            description={t('common:dashboard-v2.AdminDashboardV2.t_fa7e1261')}
          />
          <AdminMgmtNavCard
            to={ADMIN_ROUTES.NOTIFICATIONS}
            icon={Megaphone}
            tone="blue"
            label={t('common:dashboard-v2.AdminDashboardV2.t_78fd5c8c')}
            description={t('common:dashboard-v2.AdminDashboardV2.t_0b3b105a')}
          />
          {!HIDE_ADMIN_CARD_IDS.has('dashboards') && (
            <AdminMgmtNavCard
              to={ADMIN_ROUTES.DASHBOARD}
              icon={LayoutDashboard}
              tone="gray"
              label={t('common:dashboard-v2.AdminDashboardV2.t_d8189860')}
              description={t('common:dashboard-v2.AdminDashboardV2.t_4d9e086e')}
            />
          )}
          <AdminMgmtNavCard
            to={ADMIN_ROUTES.SYSTEM_CONFIG}
            icon={Settings}
            tone="gray"
            label={t('admin.labels.systemSettings')}
            description="OpenAI API 키 및 시스템 설정을 관리합니다"
          />
          {!HIDE_ADMIN_CARD_IDS.has('cache-monitoring') && (
            <AdminMgmtNavCard
              to={ADMIN_ROUTES.CACHE_MONITORING}
              icon={Database}
              tone="gray"
              label={t('common:dashboard-v2.AdminDashboardV2.t_487a67da')}
              description={t('common:dashboard-v2.AdminDashboardV2.t_1b5bff7b')}
            />
          )}
          {!HIDE_ADMIN_CARD_IDS.has('security-monitoring') && (
            <AdminMgmtNavCard
              to={ADMIN_ROUTES.SECURITY_MONITORING}
              icon={Shield}
              tone="orange"
              label={t('common:dashboard-v2.AdminDashboardV2.t_131144ac')}
              description={t('common:dashboard-v2.AdminDashboardV2.t_af541421')}
            />
          )}
          <AdminMgmtNavCard
            to={ADMIN_ROUTES.API_PERFORMANCE}
            icon={Activity}
            tone="green"
            label={t('common:dashboard-v2.AdminDashboardV2.t_f0b0eec7')}
            description={t('common:dashboard-v2.AdminDashboardV2.t_684e9439')}
          />
          <AdminMgmtNavCard
            to={ADMIN_ROUTES.MESSAGES}
            icon={MessageCircle}
            tone="blue"
            label={t('common:dashboard-v2.AdminDashboardV2.t_e10a5e2d')}
            description={t('common:dashboard-v2.AdminDashboardV2.t_2d82c7b9')}
          />
          <AdminMgmtNavCard
            to={ADMIN_ROUTES.PSYCH_ASSESSMENTS}
            icon={Brain}
            tone="orange"
            label={t('common:dashboard-v2.AdminDashboardV2.t_244d1631')}
            description={t('common:dashboard-v2.AdminDashboardV2.t_83b39c2e')}
          />
          {!HIDE_ADMIN_CARD_IDS.has('wellness') && (
            <AdminMgmtNavCard
              to="/admin/wellness"
              icon={Sparkles}
              tone="green"
              label={t('common:dashboard-v2.AdminDashboardV2.t_50acf7af')}
              description={t('common:dashboard-v2.AdminDashboardV2.t_af000453')}
            />
          )}
          {!HIDE_ADMIN_CARD_IDS.has('merge-duplicate-mappings') && (
            <AdminMgmtActionCard
              onClick={handleMergeDuplicateMappings}
              loading={mergeDuplicateLoading}
              icon={Merge}
              tone="orange"
              label={t('common:dashboard-v2.AdminDashboardV2.t_405c91bb')}
              description={t('common:dashboard-v2.AdminDashboardV2.t_4ab1f2f3')}
            />
          )}
        </div>
      </ContentSection>

      {showToastState && (
        <div className={`mg-toast mg-toast-${toastType}`}>
          <div className="mg-toast-header">
            <strong className="me-auto">{t('admin.labels.notification')}</strong>
            <MGButton
              type="button"
              className={buildErpMgButtonClassName({ variant: 'outline', size: 'md', loading: false, className: 'mg-toast-close' })}
              loadingText={ERP_MG_BUTTON_LOADING_TEXT}
              onClick={() => setShowToastState(false)}
              preventDoubleClick={false}
              aria-label={t('common:dashboard-v2.AdminDashboardV2.t_d7556ddd')}
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
      </div>
    </div>
  );

  const dashboardLoadingText = t('common:dashboard-v2.AdminDashboardV2.t_06e61b86');

  return (
    <>
      <AdminCommonLayout
        loading={sessionLoading || loading}
        loadingText={dashboardLoadingText}
        searchValue={searchValue}
        onSearchChange={setSearchValue}
        onBellClick={() => navigate(ADMIN_ROUTES.MESSAGES)}
        onLogout={handleLogout}
      >
        {mainContent}
      </AdminCommonLayout>
      <ConfirmModal />
    </>
  );
};

export default AdminDashboardV2;
