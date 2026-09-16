/**
 * SidePeekInitialConsultationPayment — 초기상담 결제 행 (재무 FT SSOT)
 *
 * @author CoreSolution
 * @since 2026-09-16
 */

import React from 'react';
import PropTypes from 'prop-types';
import { useTranslation } from 'react-i18next';
import SafeText from '../../../../common/SafeText';
import StatusBadge from '../../../../common/StatusBadge';
import {
  formatInitialConsultationPaymentAmount,
  formatInitialConsultationPaymentDate,
  resolveInitialConsultationPayment
} from '../utils/initialConsultationPaymentDisplay';

export const SIDE_PEEK_INITIAL_CONSULTATION_PAYMENT_TEST_ID =
  'side-peek-initial-consultation-payment';

const SidePeekInitialConsultationPayment = ({ mapping }) => {
  const { t } = useTranslation(['admin']);
  const payment = resolveInitialConsultationPayment(mapping);
  if (payment == null) {
    return null;
  }

  const amountLabel = formatInitialConsultationPaymentAmount(payment.amount);
  const dateLabel = formatInitialConsultationPaymentDate(payment.transactionDate);
  let statusKey = 'admin:integratedSchedule.sidePeek.initialConsultationPaymentStatusOther';
  if (payment.status === 'COMPLETED') {
    statusKey = 'admin:integratedSchedule.sidePeek.initialConsultationPaymentStatusCompleted';
  } else if (payment.status === 'PENDING') {
    statusKey = 'admin:integratedSchedule.sidePeek.initialConsultationPaymentStatusPending';
  }

  return (
    <div className="integrated-schedule-side-peek-stub__fact">
      <dt>
        {t('admin:integratedSchedule.sidePeek.initialConsultationPaymentLabel', {
          defaultValue: '초기상담 결제'
        })}
      </dt>
      <dd data-testid={SIDE_PEEK_INITIAL_CONSULTATION_PAYMENT_TEST_ID}>
        <span className="integrated-schedule-side-peek-stub__payment-row">
          <SafeText>{amountLabel}</SafeText>
          <StatusBadge variant="success">
            {t(statusKey, { defaultValue: payment.status || '결제완료' })}
          </StatusBadge>
          {dateLabel ? <SafeText>{dateLabel}</SafeText> : null}
        </span>
      </dd>
    </div>
  );
};

SidePeekInitialConsultationPayment.propTypes = {
  mapping: PropTypes.object
};

SidePeekInitialConsultationPayment.defaultProps = {
  mapping: null
};

export default SidePeekInitialConsultationPayment;
