/**
 * 상담사 전용 상담일지 목록 — 공유 ConsultantRecordCard 그리드 + EmptyState
 * 카드 액션·빈 상태 CTA 모두 ghost (primary 는 화면에 두지 않는다).
 *
 * @author Core Solution
 * @updated 2026-10-07 — 상담사 스위트 카드(records·logs 공유)
 */

import React from 'react';
import PropTypes from 'prop-types';
import { useTranslation } from 'react-i18next';
import { FileText } from 'lucide-react';
import EmptyState from '../../common/EmptyState';
import ConsultantRecordCard from '../suite/ConsultantRecordCard';
import ConsultantSuiteButton from '../suite/ConsultantSuiteButton';
import { CONSULTANT_SUITE_CLASS, CONSULTANT_SUITE_NS } from '../../../constants/consultantSuite';

const EMPTY_ICON_SIZE = 40;

const ConsultantRecordListBlock = ({
  records,
  onViewRecord,
  onWriteRecord,
  onNavigateSchedule,
  onNavigateDashboard,
  emptyTitle,
  emptyDesc,
  scheduleCtaLabel,
  dashboardCtaLabel,
  hideScheduleCta
}) => {
  const { t } = useTranslation(CONSULTANT_SUITE_NS);
  const isEmpty = !records || records.length === 0;

  if (isEmpty) {
    const showDashboard = typeof onNavigateDashboard === 'function' && Boolean(dashboardCtaLabel);
    const showSchedule = !hideScheduleCta && typeof onNavigateSchedule === 'function';
    const actions = showDashboard || showSchedule ? (
      <>
        {showDashboard ? (
          <ConsultantSuiteButton onClick={onNavigateDashboard}>{dashboardCtaLabel}</ConsultantSuiteButton>
        ) : null}
        {showSchedule ? (
          <ConsultantSuiteButton onClick={onNavigateSchedule}>
            {scheduleCtaLabel || t('records.scheduleCta')}
          </ConsultantSuiteButton>
        ) : null}
      </>
    ) : null;

    return (
      <section className={CONSULTANT_SUITE_CLASS.PANEL}>
        <EmptyState
          className={CONSULTANT_SUITE_CLASS.EMPTY}
          icon={<FileText size={EMPTY_ICON_SIZE} aria-hidden />}
          title={emptyTitle || t('records.emptyTitle')}
          description={emptyDesc || t('records.emptyDescription')}
          action={actions}
        />
      </section>
    );
  }

  return (
    <section className={CONSULTANT_SUITE_CLASS.CARD_GRID} aria-label={t('records.listAria')}>
      {records.map((record) => (
        <ConsultantRecordCard
          key={record.id}
          record={record}
          onOpen={record.isSessionCompleted === true ? onViewRecord : onWriteRecord}
        />
      ))}
    </section>
  );
};

ConsultantRecordListBlock.propTypes = {
  records: PropTypes.array.isRequired,
  onViewRecord: PropTypes.func.isRequired,
  onWriteRecord: PropTypes.func.isRequired,
  onNavigateSchedule: PropTypes.func.isRequired,
  onNavigateDashboard: PropTypes.func,
  emptyTitle: PropTypes.string,
  emptyDesc: PropTypes.string,
  scheduleCtaLabel: PropTypes.string,
  dashboardCtaLabel: PropTypes.string,
  hideScheduleCta: PropTypes.bool
};

ConsultantRecordListBlock.defaultProps = {
  onNavigateDashboard: undefined,
  emptyTitle: undefined,
  emptyDesc: undefined,
  scheduleCtaLabel: undefined,
  dashboardCtaLabel: undefined,
  hideScheduleCta: false
};

export default ConsultantRecordListBlock;
