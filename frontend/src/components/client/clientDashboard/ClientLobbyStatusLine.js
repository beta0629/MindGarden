/**
 * Client Lobby — 조용한 회기·결제 상태 라인 (KPI 그리드 아님)
 *
 * @author CoreSolution
 * @since 2026-09-17
 */

import React from 'react';
import PropTypes from 'prop-types';
import SafeText from '../../common/SafeText';
import { toSafeNumber } from '../../../utils/safeDisplay';
import {
  CLIENT_LOBBY_REMAIN_PREFIX,
  CLIENT_LOBBY_STATUS_TEST_ID
} from './constants';

const ClientLobbyStatusLine = ({ remainingSessions, chips, paymentSummary }) => {
  const remain = toSafeNumber(remainingSessions);
  const showPay = paymentSummary?.pending || paymentSummary?.recentLabel;

  return (
    <div
      className="client-lobby__status-line"
      role="group"
      aria-label="회기·결제 요약"
      data-testid={CLIENT_LOBBY_STATUS_TEST_ID}
    >
      <span className="client-lobby__remain">
        {CLIENT_LOBBY_REMAIN_PREFIX}
        {' '}
        <SafeText>{remain}</SafeText>
      </span>
      {(Array.isArray(chips) ? chips : []).map((chip) => (
        <span key={chip} className="client-lobby__ink-chip">
          <SafeText>{chip}</SafeText>
        </span>
      ))}
      {showPay ? (
        <>
          <span className="client-lobby__status-dot" aria-hidden="true" />
          {paymentSummary.pending ? (
            <span className="client-lobby__pay client-lobby__pay--amber">
              결제 <strong className="client-lobby__pay-strong">확인 필요</strong>
            </span>
          ) : (
            <span className="client-lobby__pay">
              결제{' '}
              <strong className="client-lobby__pay-strong">
                <SafeText>{paymentSummary.recentLabel}</SafeText>
              </strong>
              {paymentSummary.recentDateLabel ? (
                <>
                  {' · '}
                  <SafeText>{paymentSummary.recentDateLabel}</SafeText>
                </>
              ) : null}
            </span>
          )}
        </>
      ) : null}
    </div>
  );
};

ClientLobbyStatusLine.propTypes = {
  remainingSessions: PropTypes.number,
  chips: PropTypes.arrayOf(PropTypes.string),
  paymentSummary: PropTypes.shape({
    pending: PropTypes.bool,
    recentLabel: PropTypes.string,
    recentDateLabel: PropTypes.string
  })
};

export default ClientLobbyStatusLine;
