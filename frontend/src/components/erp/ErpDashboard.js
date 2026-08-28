/**
 * ERP 운영자 머니 콕핏 (`/erp/dashboard`)
 * 스켈레톤: Quiet header → Hero → 12개월 차트 → Workbench → Ledger
 *
 * @author CoreSolution
 * @since 2026-08-27
 */

import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useSession } from '../../contexts/SessionContext';
import { sessionManager } from '../../utils/sessionManager';
import { fetchUserPermissions, PermissionChecks, PERMISSIONS } from '../../utils/permissionUtils';
import { RoleUtils } from '../../constants/roles';
import { AUTH_API, ERP_API } from '../../constants/api';
import { API_ENDPOINTS } from '../../constants/apiEndpoints';
import { SALARY_API_ENDPOINTS } from '../../constants/salaryConstants';
import StandardizedApi from '../../utils/standardizedApi';
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
  buildDenseFactCaptions,
  buildIncomeMixItems,
  buildOutflowMixItems,
  buildRemainingVsPreviousCaption,
  buildTopExpenseCaption,
  buildTopIncomeCaption,
  parseFinanceDashboardPayload,
  parseMonthlyReportTotals,
  sumPendingConsultationFees,
  sumPendingSalaryNet,
  sumRefundFromTransactions
} from './organisms/moneyCockpit/moneyCockpitData';
import '../../styles/main.css';
import '../../styles/unified-design-tokens.css';
import './ErpCommon.css';
import './organisms/moneyCockpit/MoneyCockpit.css';

const isDevEnv = process.env.NODE_ENV === 'development';

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
  const [ledgerTx, setLedgerTx] = useState([]);
  const [incomeMixItems, setIncomeMixItems] = useState([]);
  const [expenseMixItems, setExpenseMixItems] = useState([]);
  const [denseFacts, setDenseFacts] = useState([]);
  const [monthSeries, setMonthSeries] = useState([]);
  const [pendingConsultation, setPendingConsultation] = useState(null);
  const [pendingSalary, setPendingSalary] = useState(null);
  const [refundAmount, setRefundAmount] = useState(null);

  const loadPeriodFinance = useCallback(async(periodKey) => {
    setFinanceError(null);
    setHeroLoading(true);
    const { startDate, endDate } = getPeriodRange(periodKey);
    try {
      const raw = await StandardizedApi.get(ERP_API.FINANCE_DASHBOARD, { startDate, endDate });
      const parsed = parseFinanceDashboardPayload(raw);
      setHero({
        income: parsed.totalRevenue,
        expense: parsed.totalExpenses,
        remaining: parsed.remaining
      });
      const sortedTx = [...parsed.transactions].sort((a, b) => {
        const da = String(a?.transactionDate ?? a?.date ?? '');
        const db = String(b?.transactionDate ?? b?.date ?? '');
        return db.localeCompare(da);
      });
      setLedgerTx(sortedTx);

      const incomeMix = buildIncomeMixItems(parsed.categoryBreakdown, parsed.transactions);
      const expenseMix = buildOutflowMixItems(parsed.categoryBreakdown, parsed.transactions);
      setIncomeMixItems(incomeMix);
      setExpenseMixItems(expenseMix);
      setDenseFacts(buildDenseFactCaptions(parsed.transactions));

      const refund = sumRefundFromTransactions(parsed.transactions);
      setRefundAmount(refund);

      const incomeCaption = buildTopIncomeCaption(
        parsed.categoryBreakdown,
        parsed.transactions
      );
      const expenseCaption = buildTopExpenseCaption(expenseMix);

      let remainingCaption = '';
      const prevRange = getPreviousComparableRange(periodKey);
      if (prevRange) {
        try {
          const prevRaw = await StandardizedApi.get(ERP_API.FINANCE_DASHBOARD, {
            startDate: prevRange.startDate,
            endDate: prevRange.endDate
          });
          const prevParsed = parseFinanceDashboardPayload(prevRaw);
          remainingCaption = buildRemainingVsPreviousCaption(
            parsed.remaining,
            prevParsed.remaining
          );
        } catch (prevErr) {
          if (isDevEnv) {
            console.warn('이전 기간 비교 생략:', prevErr);
          }
        }
      }

      setHeroCaptions({
        income: incomeCaption,
        expense: expenseCaption,
        remaining: remainingCaption
      });
    } catch (err) {
      console.error('머니 콕핏 대시보드 로드 실패:', err);
      setFinanceError(err?.message || OFD_ERRORS.FINANCE_LOAD);
      setHero({ income: 0, expense: 0, remaining: 0 });
      setHeroCaptions({ income: '', expense: '', remaining: '' });
      setLedgerTx([]);
      setIncomeMixItems([]);
      setExpenseMixItems([]);
      setDenseFacts([]);
      setRefundAmount(null);
    } finally {
      setHeroLoading(false);
    }
  }, []);

  const loadRolling12Chart = useCallback(async() => {
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
    const { startDate, endDate } = getPeriodRange(periodKey);

    try {
      const pendingRaw = await StandardizedApi.get(
        API_ENDPOINTS.ADMIN.MAPPINGS.PENDING_PAYMENT
      );
      setPendingConsultation(sumPendingConsultationFees(pendingRaw));
    } catch (err) {
      if (isDevEnv) {
        console.warn('미수 상담료 로드 생략:', err);
      }
      setPendingConsultation(null);
    }

    try {
      const salaryRaw = await StandardizedApi.get(
        SALARY_API_ENDPOINTS.CALCULATIONS_BY_PERIOD,
        { startDate, endDate }
      );
      setPendingSalary(sumPendingSalaryNet(salaryRaw));
    } catch (err) {
      if (isDevEnv) {
        console.warn('상담사 지급 예정 로드 생략:', err);
      }
      setPendingSalary(null);
    }
  }, []);

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

  useEffect(() => {
    if (!permissionReady) {
      return;
    }

    const user = propUser || sessionUser;
    const admin = user && RoleUtils.isAdmin(user);
    const hasErp = PermissionChecks.canAccessERP(userPermissions, user) || admin;

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
      return;
    }

    const hasFinance =
      PermissionChecks.canViewIntegratedFinance(userPermissions, user) || admin;

    if (hasFinance) {
      loadPeriodFinance(period);
      loadRolling12Chart();
      loadSecondaryTodos(period);
    } else {
      setHeroLoading(false);
      setChartLoading(false);
      setHero({ income: 0, expense: 0, remaining: 0 });
      setHeroCaptions({ income: '', expense: '', remaining: '' });
      setMonthSeries([]);
      setLedgerTx([]);
      setIncomeMixItems([]);
      setExpenseMixItems([]);
      setDenseFacts([]);
      setPendingConsultation(null);
      setPendingSalary(null);
      setRefundAmount(null);
    }
    // userPermissions는 permissionKey로 내용 비교
    // eslint-disable-next-line react-hooks/exhaustive-deps -- stable identity for permission array
  }, [
    permissionReady,
    permissionKey,
    period,
    propUserId,
    sessionUserId,
    navigate,
    loadPeriodFinance,
    loadRolling12Chart,
    loadSecondaryTodos
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
            <MoneyFlowStage loading={chartLoading} series={monthSeries} />
            <MoneyWorkbench
              incomeMixItems={incomeMixItems}
              expenseMixItems={expenseMixItems}
              pendingConsultation={pendingConsultation}
              pendingSalary={pendingSalary}
              refundAmount={refundAmount}
              denseFacts={denseFacts}
            />
            <MoneyLedgerStrip loading={heroLoading} transactions={ledgerTx} />
          </div>
        </ErpPageShell>
      </ContentArea>
    </AdminCommonLayout>
  );
};

export default ErpDashboard;
