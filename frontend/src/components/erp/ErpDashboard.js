/**
 * ERP 운영자 머니 콕핏 (`/erp/dashboard`)
 * 스켈레톤: Quiet header → Hero → 12개월 차트 → Workbench → Ledger
 *
 * @author CoreSolution
 * @since 2026-08-27
 */

import { useState, useEffect, useCallback, useRef } from 'react';
import { adminPendingPaymentMappingsGetAll } from '../../api/adminListFetch';
import { useNavigate } from 'react-router-dom';
import { useSession } from '../../contexts/SessionContext';
import { sessionManager } from '../../utils/sessionManager';
import { fetchUserPermissions, PermissionChecks, PERMISSIONS } from '../../utils/permissionUtils';
import { RoleUtils } from '../../constants/roles';
import { AUTH_API, ERP_API } from '../../constants/api';
import { SALARY_API_ENDPOINTS } from '../../constants/salaryConstants';
import StandardizedApi from '../../utils/standardizedApi';
import { getCommonCodes } from '../../utils/commonCodeApi';
import { useLatestRequest } from '../../hooks/useLatestRequest';
import { isAbortError } from '../../utils/latestRequestGuard';
import AdminCommonLayout from '../layout/AdminCommonLayout';
import UnifiedLoading from '../common/UnifiedLoading';
import { ContentArea } from '../dashboard-v2/content';
import ErpPageShell from './shell/ErpPageShell';
import {
  MoneyQuietHeader,
  MoneyHeroBand,
  MoneyFlowStage,
  MoneyWorkbench,
  MoneyLedgerStrip
} from './organisms/moneyCockpit';
import {
  OFD_ERRORS,
  OFD_HERO,
  OFD_LOADING,
  OFD_MAIN_ARIA_LABEL,
  OFD_PAGE_TITLE,
  OFD_PERIOD
} from '../../constants/operatorFinanceDashboardStrings';
import {
  getPeriodRange,
  getPreviousComparableRange,
  getRolling12MonthKeys
} from './organisms/moneyCockpit/moneyCockpitPeriod';
import {
  buildIncomeMixItems,
  buildMoneyTodoRuleComments,
  buildOutflowMixItems,
  buildRemainingVsPreviousCaption,
  buildStoredTaxCaption,
  buildTopExpenseCaption,
  buildTopIncomeCaption,
  collectPrimaryPreConfirmQueries,
  extractTaxByTypeFromStatistics,
  mergeLateWarningsFromEntries,
  parseFinanceDashboardPayload,
  parseMonthlyReportTotals,
  parsePreConfirmWarningPayload,
  resolveSalaryPayDayFromCodes,
  sumPendingConsultationFees,
  sumPendingSalaryNet,
  sumRefundFromTransactions,
  unwrapEntityList
} from './organisms/moneyCockpit/moneyCockpitData';
import '../../styles/main.css';
import '../../styles/unified-design-tokens.css';
import './ErpCommon.css';
import './organisms/moneyCockpit/MoneyCockpit.css';

const isDevEnv = process.env.NODE_ENV === 'development';

/** 롤링 12개월 차트 — 기간 칩과 무관. 세션 내 중복 호출 방지용 메모리 캐시 */
let rolling12ChartMemoryCache = null;

/**
 * 테스트 전용 — 롤링 12개월 인메모리 캐시 초기화.
 * @returns {void}
 */
export function resetRolling12ChartMemoryCacheForTests() {
  rolling12ChartMemoryCache = null;
}

/**
 * 권한 조회 실패 시 사용자 역할 기반 기본 권한 설정
 * @param {object} user
 * @param {Function} setUserPermissions
 */
const setDefaultPermissionsForRole = (user, setUserPermissions) => {
  if (!user || !user.role) {
    setUserPermissions([]);
    return;
  }

  const defaultPermissions = [];
  if (RoleUtils.isAdmin(user)) {
    defaultPermissions.push(
      PERMISSIONS.ERP_ACCESS,
      PERMISSIONS.ERP_DASHBOARD_VIEW,
      PERMISSIONS.INTEGRATED_FINANCE_VIEW,
      PERMISSIONS.SALARY_MANAGE
    );
  }
  setUserPermissions(defaultPermissions);
};

/**
 * ERP 메인 대시보드 — 머니 콕핏
 * @param {{ user?: object }} props
 */
const ErpDashboard = ({ user: propUser }) => {
  const navigate = useNavigate();
  const { user: sessionUser, isLoggedIn, isLoading: sessionLoading, hasPermission } = useSession();
  const [userPermissions, setUserPermissions] = useState([]);
  const [permissionReady, setPermissionReady] = useState(false);
  const [period, setPeriod] = useState(OFD_PERIOD.THIS_MONTH);

  const [heroLoading, setHeroLoading] = useState(true);
  const [chartLoading, setChartLoading] = useState(true);
  const [financeError, setFinanceError] = useState(null);

  const [hero, setHero] = useState({ income: 0, expense: 0, remaining: 0 });
  const [heroCaptions, setHeroCaptions] = useState({
    income: '',
    expense: '',
    remaining: ''
  });
  const [taxCaption, setTaxCaption] = useState('');
  const [ledgerTx, setLedgerTx] = useState([]);
  const [incomeMixItems, setIncomeMixItems] = useState([]);
  const [expenseMixItems, setExpenseMixItems] = useState([]);
  const [monthSeries, setMonthSeries] = useState([]);
  const [pendingConsultation, setPendingConsultation] = useState(null);
  const [pendingSalary, setPendingSalary] = useState(null);
  const [refundAmount, setRefundAmount] = useState(null);
  const [todoRuleComments, setTodoRuleComments] = useState([]);
  const [financialCategoryRows, setFinancialCategoryRows] = useState([]);

  const beginPeriodFinanceRequest = useLatestRequest();
  const beginSecondaryTodosRequest = useLatestRequest();
  const rolling12LoadedRef = useRef(false);

  useEffect(() => {
    if (sessionLoading || !isLoggedIn) {
      return undefined;
    }
    let cancelled = false;
    const loadFinancialCategories = async() => {
      try {
        const envelope = await StandardizedApi.get(ERP_API.COMMON_CODES_FINANCIAL);
        if (cancelled) {
          return;
        }
        const body = envelope?.data ?? envelope ?? {};
        setFinancialCategoryRows([
          ...(body.incomeCategories || []),
          ...(body.expenseCategories || [])
        ]);
      } catch {
        if (!cancelled) {
          setFinancialCategoryRows([]);
        }
      }
    };
    loadFinancialCategories();
    return () => {
      cancelled = true;
    };
  }, [sessionLoading, isLoggedIn]);

  const loadPeriodFinance = useCallback(async(periodKey) => {
    const { signal, isStale } = beginPeriodFinanceRequest();
    setFinanceError(null);
    setHeroLoading(true);
    const { startDate, endDate } = getPeriodRange(periodKey);
    const apiOptions = signal ? { signal } : {};
    try {
      const raw = await StandardizedApi.get(
        ERP_API.FINANCE_DASHBOARD,
        { startDate, endDate },
        apiOptions
      );
      if (isStale()) {
        return;
      }
      const parsed = parseFinanceDashboardPayload(raw);
      setHero({
        income: parsed.totalRevenue,
        expense: parsed.totalExpenses,
        remaining: parsed.remaining
      });
      setTaxCaption(buildStoredTaxCaption(parsed.taxBreakdown));
      const sortedTx = [...parsed.transactions].sort((a, b) => {
        const da = String(a?.transactionDate ?? a?.date ?? '');
        const db = String(b?.transactionDate ?? b?.date ?? '');
        return db.localeCompare(da);
      });
      setLedgerTx(sortedTx);

      const incomeMix = buildIncomeMixItems(
        parsed.incomeCategoryBreakdown,
        parsed.transactions,
        financialCategoryRows
      );
      const expenseMix = buildOutflowMixItems(
        parsed.expenseCategoryBreakdown,
        parsed.transactions,
        { categoryRows: financialCategoryRows }
      );
      setIncomeMixItems(incomeMix);
      setExpenseMixItems(expenseMix);

      const refund = sumRefundFromTransactions(parsed.transactions);
      setRefundAmount(refund);

      const incomeCaption = buildTopIncomeCaption(
        parsed.incomeCategoryBreakdown,
        parsed.transactions,
        financialCategoryRows
      );
      const expenseCaption = buildTopExpenseCaption(expenseMix);

      let remainingCaption = '';
      const prevRange = getPreviousComparableRange(periodKey);
      if (prevRange) {
        try {
          const prevRaw = await StandardizedApi.get(
            ERP_API.FINANCE_DASHBOARD,
            {
              startDate: prevRange.startDate,
              endDate: prevRange.endDate
            },
            apiOptions
          );
          if (isStale()) {
            return;
          }
          const prevParsed = parseFinanceDashboardPayload(prevRaw);
          remainingCaption = buildRemainingVsPreviousCaption(
            parsed.remaining,
            prevParsed.remaining
          );
        } catch (prevErr) {
          if (isStale() || isAbortError(prevErr)) {
            return;
          }
          if (isDevEnv) {
            console.warn('이전 기간 비교 생략:', prevErr);
          }
        }
      }

      if (isStale()) {
        return;
      }
      setHeroCaptions({
        income: incomeCaption,
        expense: expenseCaption,
        remaining: remainingCaption
      });
    } catch (err) {
      if (isStale() || isAbortError(err)) {
        return;
      }
      console.error('머니 콕핏 대시보드 로드 실패:', err);
      setFinanceError(err?.message || OFD_ERRORS.FINANCE_LOAD);
      setHero({ income: 0, expense: 0, remaining: 0 });
      setHeroCaptions({ income: '', expense: '', remaining: '' });
      setTaxCaption('');
      setLedgerTx([]);
      setIncomeMixItems([]);
      setExpenseMixItems([]);
      setRefundAmount(null);
    } finally {
      if (!isStale()) {
        setHeroLoading(false);
      }
    }
  }, [beginPeriodFinanceRequest, financialCategoryRows]);

  /**
   * 롤링 12개월 차트 — moneyCockpitPeriod / 기간 칩과 무관.
   * 마운트·권한 준비 시 1회(또는 캐시 히트)만 호출한다.
   */
  const loadRolling12Chart = useCallback(async() => {
    if (rolling12ChartMemoryCache) {
      setMonthSeries(rolling12ChartMemoryCache);
      setChartLoading(false);
      return;
    }
    setChartLoading(true);
    const keys = getRolling12MonthKeys();
    try {
      const results = await Promise.all(
        keys.map((key) =>
          StandardizedApi.get(ERP_API.FINANCE_MONTHLY_REPORT, {
            year: key.year,
            month: key.month
          }).catch((err) => {
            if (isDevEnv) {
              console.warn('월간 리포트 로드 실패:', key, err);
            }
            return null;
          })
        )
      );
      const series = keys.map((key, index) => {
        const totals = parseMonthlyReportTotals(results[index]);
        return {
          label: key.label,
          income: totals.income,
          expense: totals.expense,
          year: key.year,
          month: key.month
        };
      });
      rolling12ChartMemoryCache = series;
      setMonthSeries(series);
    } catch (err) {
      console.error('롤링 12개월 차트 로드 실패:', err);
      setMonthSeries(keys.map((key) => ({
        label: key.label,
        income: 0,
        expense: 0,
        year: key.year,
        month: key.month
      })));
    } finally {
      setChartLoading(false);
    }
  }, []);

  const loadSecondaryTodos = useCallback(async(periodKey) => {
    const { signal, isStale } = beginSecondaryTodosRequest();
    const { startDate, endDate } = getPeriodRange(periodKey);
    const apiOptions = signal ? { signal } : {};

    try {
      const pendingRaw = await adminPendingPaymentMappingsGetAll({}, apiOptions);
      if (isStale()) {
        return;
      }
      setPendingConsultation(sumPendingConsultationFees(pendingRaw));
    } catch (err) {
      if (isStale() || isAbortError(err)) {
        return;
      }
      if (isDevEnv) {
        console.warn('미수 상담료 로드 생략:', err);
      }
      setPendingConsultation(null);
    }

    try {
      const salaryRaw = await StandardizedApi.get(
        SALARY_API_ENDPOINTS.CALCULATIONS_BY_PERIOD,
        { startDate, endDate },
        apiOptions
      );
      if (isStale()) {
        return;
      }
      const pending = sumPendingSalaryNet(salaryRaw);
      setPendingSalary(pending);

      const salaryCalcs = unwrapEntityList(salaryRaw);
      const hasUnpaid = pending != null && pending > 0;

      const preConfirmQueries = collectPrimaryPreConfirmQueries(salaryCalcs);
      const lateWarningEntries = await Promise.all(
        preConfirmQueries.map(async(query) => {
          try {
            const response = await StandardizedApi.get(
              SALARY_API_ENDPOINTS.PRE_CONFIRM_WARNING,
              {
                consultantId: query.consultantId,
                periodStart: query.periodStart,
                periodEnd: query.periodEnd
              },
              apiOptions
            );
            if (isStale()) {
              return null;
            }
            const parsed = parsePreConfirmWarningPayload(response);
            if (!parsed) {
              return null;
            }
            const primaryId = parsed.primaryCalculationId != null
              ? parsed.primaryCalculationId
              : query.fallbackPrimaryId;
            return [primaryId, parsed];
          } catch (warningErr) {
            if (isStale() || isAbortError(warningErr)) {
              return null;
            }
            if (isDevEnv) {
              console.warn('빠진 회기 경고 조회 생략:', warningErr);
            }
            return null;
          }
        })
      );
      if (isStale()) {
        return;
      }
      const lateWarningsByPrimaryId = mergeLateWarningsFromEntries(lateWarningEntries);

      let dayOfMonth = 10;
      try {
        const payDayCodes = await getCommonCodes('SALARY_PAY_DAY');
        if (isStale()) {
          return;
        }
        ({ dayOfMonth } = resolveSalaryPayDayFromCodes(payDayCodes));
      } catch (payDayErr) {
        if (isStale() || isAbortError(payDayErr)) {
          return;
        }
        if (isDevEnv) {
          console.warn('급여일 체크리스트 생략:', payDayErr);
        }
      }

      let profiles = [];
      try {
        const profilesRaw = await StandardizedApi.get(
          SALARY_API_ENDPOINTS.PROFILES,
          {},
          apiOptions
        );
        if (isStale()) {
          return;
        }
        profiles = unwrapEntityList(profilesRaw);
      } catch (profileErr) {
        if (isStale() || isAbortError(profileErr)) {
          return;
        }
        if (isDevEnv) {
          console.warn('국세청 체크리스트 생략:', profileErr);
        }
      }

      let taxByType = null;
      if (periodKey !== OFD_PERIOD.THIS_YEAR) {
        const taxPeriod = startDate?.substring(0, 7);
        if (taxPeriod) {
          try {
            const taxRaw = await StandardizedApi.get(
              SALARY_API_ENDPOINTS.TAX_STATISTICS,
              { period: taxPeriod },
              apiOptions
            );
            if (isStale()) {
              return;
            }
            taxByType = extractTaxByTypeFromStatistics(taxRaw);
          } catch (taxErr) {
            if (isStale() || isAbortError(taxErr)) {
              return;
            }
            if (isDevEnv) {
              console.warn('원천징수 통계 생략:', taxErr);
            }
          }
        }
      }

      if (isStale()) {
        return;
      }
      setTodoRuleComments(buildMoneyTodoRuleComments({
        today: new Date(),
        dayOfMonth,
        hasUnpaid,
        profiles,
        salaryCalculations: salaryCalcs,
        taxByType,
        lateWarningsByPrimaryId
      }));
    } catch (err) {
      if (isStale() || isAbortError(err)) {
        return;
      }
      if (isDevEnv) {
        console.warn('상담사 지급 예정 로드 생략:', err);
      }
      setPendingSalary(null);
      setTodoRuleComments([]);
    }
  }, [beginSecondaryTodosRequest]);

  const sessionUserId = sessionUser?.id;
  const sessionUserRole = sessionUser?.role;
  const propUserId = propUser?.id;
  const propUserRole = propUser?.role;

  useEffect(() => {
    if (sessionLoading) {
      return;
    }

    let cancelled = false;

    const checkSessionWithDelay = async() => {
      let user = propUser || sessionUser;

      if (!user || !user.role) {
        try {
          const userData = await StandardizedApi.get(AUTH_API.GET_CURRENT_USER);
          if (userData && userData.role) {
            user = userData;
          }
        } catch (error) {
          if (isDevEnv) {
            console.warn('세션 API 호출 실패:', error);
          }
        }

        if (!user || !user.role) {
          user = sessionManager.getUser();
          if (!user || !user.role) {
            navigate('/login', { replace: true });
            return;
          }
        }
      }

      try {
        const permissions = await fetchUserPermissions(setUserPermissions);
        if (!permissions || permissions.length === 0) {
          setDefaultPermissionsForRole(user, setUserPermissions);
        }
      } catch (error) {
        console.warn('권한 조회 실패 (기본 권한 설정):', error);
        setDefaultPermissionsForRole(user, setUserPermissions);
      }

      if (hasPermission) {
        try {
          await hasPermission(PERMISSIONS.INTEGRATED_FINANCE_VIEW);
        } catch (error) {
          if (isDevEnv) {
            console.warn('권한 체크 실패:', error);
          }
        }
      }

      if (!cancelled) {
        setPermissionReady(true);
      }
    };

    const timerId = setTimeout(checkSessionWithDelay, 100);
    return () => {
      cancelled = true;
      clearTimeout(timerId);
    };
  // hasPermission 참조 불안정 시 세션 부트스트랩 반복 방지
  // eslint-disable-next-line react-hooks/exhaustive-deps -- bootstrap once per user identity
  }, [
    sessionLoading,
    isLoggedIn,
    navigate,
    propUserId,
    propUserRole,
    sessionUserId,
    sessionUserRole,
    propUser,
    sessionUser
  ]);

  const permissionKey = userPermissions.join('|');

  const resolveFinanceAccess = useCallback(() => {
    const user = propUser || sessionUser;
    const admin = user && RoleUtils.isAdmin(user);
    const hasErp = PermissionChecks.canAccessERP(userPermissions, user) || admin;
    const hasFinance =
      PermissionChecks.canViewIntegratedFinance(userPermissions, user) || admin;
    return { user, admin, hasErp, hasFinance };
  }, [propUser, sessionUser, userPermissions]);

  /** ERP 권한 게이트 — period 와 무관 */
  useEffect(() => {
    if (!permissionReady) {
      return;
    }

    const { user, hasErp } = resolveFinanceAccess();

    if (!hasErp) {
      if (userPermissions.length === 0) {
        const timeoutId = setTimeout(() => {
          const u = propUser || sessionUser;
          if (u && RoleUtils.isAdmin(u)) {
            setDefaultPermissionsForRole(u, setUserPermissions);
            return;
          }
          if (u && u.role) {
            navigate('/dashboard', { replace: true });
          }
        }, 3000);
        return () => clearTimeout(timeoutId);
      }
      navigate('/dashboard', { replace: true });
    }
    // userPermissions는 permissionKey로 내용 비교
    // eslint-disable-next-line react-hooks/exhaustive-deps -- stable identity for permission array
  }, [
    permissionReady,
    permissionKey,
    propUserId,
    sessionUserId,
    navigate,
    resolveFinanceAccess
  ]);

  /**
   * 기간 칩 의존 — finance dashboard + secondary todos 만 재조회.
   * 롤링 12개월(monthly-report ×12)은 여기서 호출하지 않는다.
   */
  useEffect(() => {
    if (!permissionReady) {
      return;
    }

    const { hasErp, hasFinance } = resolveFinanceAccess();
    if (!hasErp) {
      return;
    }

    if (hasFinance) {
      loadPeriodFinance(period);
      loadSecondaryTodos(period);
    } else {
      setHeroLoading(false);
      setHero({ income: 0, expense: 0, remaining: 0 });
      setHeroCaptions({ income: '', expense: '', remaining: '' });
      setLedgerTx([]);
      setIncomeMixItems([]);
      setExpenseMixItems([]);
      setPendingConsultation(null);
      setPendingSalary(null);
      setRefundAmount(null);
      setTodoRuleComments([]);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps -- permissionKey for array identity
  }, [
    permissionReady,
    permissionKey,
    period,
    propUserId,
    sessionUserId,
    loadPeriodFinance,
    loadSecondaryTodos,
    resolveFinanceAccess
  ]);

  /**
   * 롤링 12개월 차트 — 기간 칩과 무관.
   * 권한 준비·재무 접근 가능 시 1회(캐시 포함)만 로드한다.
   */
  useEffect(() => {
    if (!permissionReady) {
      return;
    }

    const { hasErp, hasFinance } = resolveFinanceAccess();
    if (!hasErp) {
      return;
    }

    if (!hasFinance) {
      setChartLoading(false);
      setMonthSeries([]);
      rolling12LoadedRef.current = false;
      return;
    }

    if (rolling12LoadedRef.current && rolling12ChartMemoryCache) {
      setMonthSeries(rolling12ChartMemoryCache);
      setChartLoading(false);
      return;
    }

    rolling12LoadedRef.current = true;
    loadRolling12Chart();
    // eslint-disable-next-line react-hooks/exhaustive-deps -- no period; mount/permission only
  }, [
    permissionReady,
    permissionKey,
    propUserId,
    sessionUserId,
    loadRolling12Chart,
    resolveFinanceAccess
  ]);

  const layoutContentClassName = 'erp-dashboard__content money-cockpit-page';

  if (sessionLoading) {
    return (
      <AdminCommonLayout>
        <ContentArea className={layoutContentClassName} ariaLabel={OFD_PAGE_TITLE}>
          <div className="erp-dashboard__session-load" aria-busy="true">
            <UnifiedLoading type="inline" text={OFD_LOADING.SESSION} />
          </div>
        </ContentArea>
      </AdminCommonLayout>
    );
  }

  if (!permissionReady) {
    return (
      <AdminCommonLayout>
        <ContentArea className={layoutContentClassName} ariaLabel={OFD_PAGE_TITLE}>
          <div className="erp-dashboard__data-load" aria-busy="true">
            <UnifiedLoading type="inline" text={OFD_LOADING.DATA} />
          </div>
        </ContentArea>
      </AdminCommonLayout>
    );
  }

  return (
    <AdminCommonLayout>
      <ContentArea className={layoutContentClassName} ariaLabel={OFD_PAGE_TITLE}>
        <ErpPageShell mainAriaLabel={OFD_MAIN_ARIA_LABEL}>
          <div className="money-cockpit" data-testid="money-cockpit">
            <MoneyQuietHeader period={period} onPeriodChange={setPeriod} />
            {financeError ? (
              <p role="alert" className="money-ledger__empty">
                {financeError}
              </p>
            ) : null}
            <MoneyHeroBand
              loading={heroLoading}
              income={hero.income}
              expense={hero.expense}
              remaining={hero.remaining}
              incomeCaption={heroCaptions.income}
              expenseCaption={heroCaptions.expense}
              remainingCaption={heroCaptions.remaining}
            />
            {!heroLoading && taxCaption ? (
              <p
                className="money-hero-band__tax-caption"
                data-testid="money-hero-tax-caption"
                aria-label={OFD_HERO.TAX_STRIP_ARIA}
              >
                {taxCaption}
              </p>
            ) : null}
            <MoneyFlowStage loading={chartLoading} series={monthSeries} />
            <MoneyWorkbench
              incomeMixItems={incomeMixItems}
              expenseMixItems={expenseMixItems}
              pendingConsultation={pendingConsultation}
              pendingSalary={pendingSalary}
              refundAmount={refundAmount}
              denseFacts={todoRuleComments}
            />
            <MoneyLedgerStrip loading={heroLoading} transactions={ledgerTx} />
          </div>
        </ErpPageShell>
      </ContentArea>
    </AdminCommonLayout>
  );
};

export default ErpDashboard;
