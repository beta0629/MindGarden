/**
 * ConsultantSalarySettlement — 관리자 급여 산정 결과(상담사 조회 전용) 본문
 *
 * 흰 카드 on warm stage · 안내(slate) → 요약 3칸 → 지급 상태 칩(slate) → 월 카드.
 * 읽기 전용: 승인·지급·계산 CTA 없음. 금액은 「N원」(₩ 금지) · 실수령 ink.
 * 페이지 제목·부제는 {@link ConsultantSalarySettlementPage}(셸) 또는 상위 AppShell이 담당한다.
 *
 * @author MindGarden
 * @since 2026-05-15
 */

import React, { useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { AlertTriangle, Info, Wallet } from 'lucide-react';
import { useConsultantSalaryCalculations } from '../../hooks/useConsultantSalaryCalculations';
import { toErrorMessage } from '../../utils/safeDisplay';
import { buildSalarySummary, filterSalaryItems } from '../../utils/consultantSalaryView';
import MGButton from '../common/MGButton';
import EmptyState from '../common/EmptyState';
import Skeleton from '../ui/Loading/Skeleton';
import ConsultantSummaryStrip from '../dashboard-v2/consultant/ConsultantSummaryStrip';
import ConsultantFilterChips from './suite/ConsultantFilterChips';
import ConsultantNotice from './suite/ConsultantNotice';
import ConsultantSalaryMonthCard from './molecules/ConsultantSalaryMonthCard';
import { formatConsultantMoney } from './suite/ConsultantMoneyText';
import { buildErpMgButtonClassName, ERP_MG_BUTTON_LOADING_TEXT } from '../erp/common/erpMgButtonProps';
import {
  CONSULTANT_SALARY_FILTER,
  CONSULTANT_SUITE_CLASS,
  CONSULTANT_SUITE_NS
} from '../../constants/consultantSuite';
import '../dashboard-v2/consultant/ConsultantSummaryStrip.css';
import './suite/ConsultantSuite.css';
import './ConsultantSalarySettlement.css';

const SKELETON_CARD_KEYS = ['summary', 'card-1', 'card-2'];
const NOTICE_ICON_SIZE = 16;
const EMPTY_ICON_SIZE = 32;

const ConsultantSalarySettlement = () => {
  const { t } = useTranslation(CONSULTANT_SUITE_NS);
  const { items, loading, error, refetch, hasItems } = useConsultantSalaryCalculations();
  const [filterKey, setFilterKey] = useState(CONSULTANT_SALARY_FILTER.ALL);

  const summary = useMemo(() => buildSalarySummary(items), [items]);
  const visibleItems = useMemo(() => filterSalaryItems(items, filterKey), [items, filterKey]);

  const filterItems = [
    { key: CONSULTANT_SALARY_FILTER.ALL, label: t('salary.filterAll') },
    { key: CONSULTANT_SALARY_FILTER.PENDING, label: t('salary.filterPending') },
    { key: CONSULTANT_SALARY_FILTER.PAID, label: t('salary.filterPaid') }
  ];

  const summaryItems = [
    {
      id: 'latestNet',
      label: t('salary.summaryLatestNet'),
      value: summary.latestNet == null ? '—' : formatConsultantMoney(summary.latestNet)
    },
    {
      id: 'pending',
      label: t('salary.summaryPending'),
      value: t('salary.countUnit', { count: summary.pendingCount })
    },
    {
      id: 'paid',
      label: t('salary.summaryPaid'),
      value: t('salary.countUnit', { count: summary.paidCount })
    }
  ];

  const rootClass = `${CONSULTANT_SUITE_CLASS.ROOT} consultant-salary`;
  const notice = (
    <ConsultantNotice icon={<Info size={NOTICE_ICON_SIZE} />}>{t('salary.notice')}</ConsultantNotice>
  );

  if (loading) {
    return (
      <div className={rootClass} aria-busy="true" aria-label={t('salary.loadingAria')}>
        {notice}
        {SKELETON_CARD_KEYS.map((key) => (
          <Skeleton key={key} variant="card" className="consultant-salary__skeleton" />
        ))}
      </div>
    );
  }

  if (error) {
    return (
      <div className={rootClass}>
        {notice}
        <section className={`${CONSULTANT_SUITE_CLASS.PANEL} consultant-salary__error`} role="alert">
          <EmptyState
            className={CONSULTANT_SUITE_CLASS.EMPTY}
            icon={<AlertTriangle size={EMPTY_ICON_SIZE} aria-hidden />}
            title={toErrorMessage(error, t('salary.loadError'))}
            action={(
              <MGButton
                type="button"
                variant="outline"
                size="medium"
                className={buildErpMgButtonClassName({ variant: 'outline', size: 'md', loading: false })}
                loadingText={ERP_MG_BUTTON_LOADING_TEXT}
                onClick={() => refetch()}
                preventDoubleClick={false}
              >
                {t('actions.retry')}
              </MGButton>
            )}
          />
        </section>
      </div>
    );
  }

  return (
    <div className={rootClass}>
      {notice}
      <ConsultantSummaryStrip
        items={summaryItems}
        className={CONSULTANT_SUITE_CLASS.SUMMARY}
        ariaLabel={t('salary.summaryAria')}
      />
      {hasItems ? (
        <ConsultantFilterChips
          items={filterItems}
          activeKey={filterKey}
          onChange={setFilterKey}
          ariaLabel={t('salary.filterAria')}
          testIdPrefix="consultant-salary-filter"
        />
      ) : null}
      {visibleItems.length > 0 ? (
        <section className="consultant-salary__list" aria-label={t('salary.listAria')}>
          {visibleItems.map((row, idx) => (
            <ConsultantSalaryMonthCard
              key={String(row.id ?? row.calculationId ?? row.settlementId ?? `idx-${idx}`)}
              item={row}
            />
          ))}
        </section>
      ) : (
        <section className={CONSULTANT_SUITE_CLASS.PANEL}>
          <EmptyState
            className={CONSULTANT_SUITE_CLASS.EMPTY}
            icon={<Wallet size={EMPTY_ICON_SIZE} aria-hidden />}
            title={hasItems ? t('salary.filterEmptyTitle') : t('salary.emptyTitle')}
            description={hasItems ? null : t('salary.emptyDescription')}
          />
        </section>
      )}
    </div>
  );
};

export default ConsultantSalarySettlement;
