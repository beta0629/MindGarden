/**
 * useMoneyTodoStrip — 「지금 손볼 일」 secondary todo 데이터 (대시보드·장부 공용)
 *
 * @author CoreSolution
 * @since 2026-09-02
 */

import { useState, useEffect, useCallback } from 'react';
import StandardizedApi from '../../../utils/standardizedApi';
import { getCommonCodes } from '../../../utils/commonCodeApi';
import { API_ENDPOINTS } from '../../../constants/apiEndpoints';
import { ERP_API } from '../../../constants/api';
import { SALARY_API_ENDPOINTS } from '../../../constants/salaryConstants';
import { OFD_PERIOD } from '../../../constants/operatorFinanceDashboardStrings';
import { getPeriodRange } from '../organisms/moneyCockpit/moneyCockpitPeriod';
import {
  buildMoneyTodoRuleComments,
  collectPrimaryPreConfirmQueries,
  extractTaxByTypeFromStatistics,
  mergeLateWarningsFromEntries,
  parseFinanceDashboardPayload,
  parsePreConfirmWarningPayload,
  resolveSalaryPayDayFromCodes,
  sumPendingConsultationFees,
  sumPendingSalaryNet,
  sumRefundFromTransactions,
  unwrapEntityList
} from '../organisms/moneyCockpit/moneyCockpitData';

const isDevEnv = process.env.NODE_ENV === 'development';

/**
 * @param {string} periodKey OFD_PERIOD / FM_PERIOD 값 (CUSTOM 등 미지원 키는 이번 달로 처리)
 * @returns {{
 *   pendingConsultation: number|null,
 *   pendingSalary: number|null,
 *   refundAmount: number|null,
 *   todoRuleComments: string[],
 *   reload: () => void
 * }}
 */
export function useMoneyTodoStrip(periodKey) {
  const [pendingConsultation, setPendingConsultation] = useState(null);
  const [pendingSalary, setPendingSalary] = useState(null);
  const [refundAmount, setRefundAmount] = useState(null);
  const [todoRuleComments, setTodoRuleComments] = useState([]);

  const load = useCallback(async(key) => {
    const resolvedKey = key === OFD_PERIOD.THIS_YEAR || key === OFD_PERIOD.LAST_MONTH
      ? key
      : OFD_PERIOD.THIS_MONTH;
    const { startDate, endDate } = getPeriodRange(resolvedKey);

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
      const financeRaw = await StandardizedApi.get(ERP_API.FINANCE_DASHBOARD, { startDate, endDate });
      const parsed = parseFinanceDashboardPayload(financeRaw);
      setRefundAmount(sumRefundFromTransactions(parsed.transactions));
    } catch (err) {
      if (isDevEnv) {
        console.warn('환불 합계 로드 생략:', err);
      }
      setRefundAmount(null);
    }

    try {
      const salaryRaw = await StandardizedApi.get(
        SALARY_API_ENDPOINTS.CALCULATIONS_BY_PERIOD,
        { startDate, endDate }
      );
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
              }
            );
            const parsed = parsePreConfirmWarningPayload(response);
            if (!parsed) {
              return null;
            }
            const primaryId = parsed.primaryCalculationId != null
              ? parsed.primaryCalculationId
              : query.fallbackPrimaryId;
            return [primaryId, parsed];
          } catch (warningErr) {
            if (isDevEnv) {
              console.warn('빠진 회기 경고 조회 생략:', warningErr);
            }
            return null;
          }
        })
      );
      const lateWarningsByPrimaryId = mergeLateWarningsFromEntries(lateWarningEntries);

      let dayOfMonth = 10;
      try {
        const payDayCodes = await getCommonCodes('SALARY_PAY_DAY');
        ({ dayOfMonth } = resolveSalaryPayDayFromCodes(payDayCodes));
      } catch (payDayErr) {
        if (isDevEnv) {
          console.warn('급여일 체크리스트 생략:', payDayErr);
        }
      }

      let profiles = [];
      try {
        const profilesRaw = await StandardizedApi.get(SALARY_API_ENDPOINTS.PROFILES);
        profiles = unwrapEntityList(profilesRaw);
      } catch (profileErr) {
        if (isDevEnv) {
          console.warn('국세청 체크리스트 생략:', profileErr);
        }
      }

      let taxByType = null;
      if (resolvedKey !== OFD_PERIOD.THIS_YEAR) {
        const taxPeriod = startDate?.substring(0, 7);
        if (taxPeriod) {
          try {
            const taxRaw = await StandardizedApi.get(
              SALARY_API_ENDPOINTS.TAX_STATISTICS,
              { period: taxPeriod }
            );
            taxByType = extractTaxByTypeFromStatistics(taxRaw);
          } catch (taxErr) {
            if (isDevEnv) {
              console.warn('원천징수 통계 생략:', taxErr);
            }
          }
        }
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
      if (isDevEnv) {
        console.warn('상담사 지급 예정 로드 생략:', err);
      }
      setPendingSalary(null);
      setTodoRuleComments([]);
    }
  }, []);

  useEffect(() => {
    if (!periodKey) {
      return;
    }
    load(periodKey);
  }, [periodKey, load]);

  const reload = useCallback(() => {
    if (periodKey) {
      load(periodKey);
    }
  }, [periodKey, load]);

  return {
    pendingConsultation,
    pendingSalary,
    refundAmount,
    todoRuleComments,
    reload
  };
}

export default useMoneyTodoStrip;
