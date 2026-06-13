/**
 * SmsLogCard — 최근 SMS/알림톡 발송 카드 (Organism).
 *
 * 「푸시 설정 모니터링」 페이지의 「최근 실패 사례」 카드 바로 위에 배치되어,
 * 운영자가 한 화면에서 최근 SMS/알림톡 발송 결과(성공·실패)를 확인할 수 있게 한다.
 *
 * - StandardizedApi 사용 (api/admin/pushMonitoringApi#getRecentSmsLogs)
 * - 본인 테넌트 한정 (백엔드 강제)
 * - 디자인 토큰만 사용 — 하드코딩 금지
 * - 빈 결과 / 로딩 / 에러 / 새로고침 4 상태 지원
 *
 * @author MindGarden core-coder
 * @since 2026-06-13
 */

import React, { useCallback, useEffect, useState } from 'react';
import PropTypes from 'prop-types';
import ContentSection from '../../../dashboard-v2/content/ContentSection';
import EmptyState from '../../../common/EmptyState';
import SmsLogRow from '../molecules/SmsLogRow';
import {
  getRecentSmsLogs,
  SMS_LOGS_DEFAULT_LIMIT
} from '../../../../api/admin/pushMonitoringApi';
import { ADMIN_WEB_SCAFFOLD_COPY } from '../../../../constants/adminWebScaffold';
import './SmsLogCard.css';

const unwrapPayload = (response) => {
  if (response && typeof response === 'object' && response.success === true && response.data !== undefined) {
    return response.data;
  }
  return response;
};

const toArray = (payload) => {
  if (Array.isArray(payload)) {
    return payload;
  }
  if (payload && Array.isArray(payload.items)) {
    return payload.items;
  }
  return [];
};

const SmsLogCard = ({ limit = SMS_LOGS_DEFAULT_LIMIT, autoLoad = true }) => {
  const [items, setItems] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [hasLoaded, setHasLoaded] = useState(false);

  const fetchLogs = useCallback(async () => {
    setIsLoading(true);
    setErrorMessage('');
    try {
      const response = await getRecentSmsLogs({ limit });
      const list = toArray(unwrapPayload(response));
      setItems(list);
    } catch (err) {
      const message = err && err.message ? err.message : 'unknown';
      setErrorMessage(`${ADMIN_WEB_SCAFFOLD_COPY.PUSH_MONITOR_SMS_LOGS_ERROR_PREFIX}${message}`);
      setItems([]);
    } finally {
      setIsLoading(false);
      setHasLoaded(true);
    }
  }, [limit]);

  useEffect(() => {
    if (autoLoad) {
      fetchLogs();
    }
  }, [autoLoad, fetchLogs]);

  const actions = (
    <button
      type="button"
      className="mg-sms-log-card__refresh"
      onClick={fetchLogs}
      disabled={isLoading}
      aria-label={ADMIN_WEB_SCAFFOLD_COPY.PUSH_MONITOR_SMS_LOGS_REFRESH}
    >
      {ADMIN_WEB_SCAFFOLD_COPY.PUSH_MONITOR_SMS_LOGS_REFRESH}
    </button>
  );

  return (
    <ContentSection
      title={ADMIN_WEB_SCAFFOLD_COPY.PUSH_MONITOR_SMS_LOGS_TITLE}
      subtitle={ADMIN_WEB_SCAFFOLD_COPY.PUSH_MONITOR_SMS_LOGS_SUBTITLE}
      actions={actions}
      dataTestId="sms-log-card"
    >
      <div className="mg-sms-log-card" role="table">
        <div className="mg-sms-log-card__header" role="row" aria-hidden="true">
          <span className="mg-sms-log-card__th">{ADMIN_WEB_SCAFFOLD_COPY.PUSH_MONITOR_SMS_LOGS_TH_TIME}</span>
          <span className="mg-sms-log-card__th">{ADMIN_WEB_SCAFFOLD_COPY.PUSH_MONITOR_SMS_LOGS_TH_CHANNEL}</span>
          <span className="mg-sms-log-card__th">{ADMIN_WEB_SCAFFOLD_COPY.PUSH_MONITOR_SMS_LOGS_TH_TEMPLATE}</span>
          <span className="mg-sms-log-card__th">{ADMIN_WEB_SCAFFOLD_COPY.PUSH_MONITOR_SMS_LOGS_TH_RECIPIENT}</span>
          <span className="mg-sms-log-card__th">{ADMIN_WEB_SCAFFOLD_COPY.PUSH_MONITOR_SMS_LOGS_TH_STATUS}</span>
          <span className="mg-sms-log-card__th">{ADMIN_WEB_SCAFFOLD_COPY.PUSH_MONITOR_SMS_LOGS_TH_ERROR}</span>
        </div>
        {isLoading && !hasLoaded ? (
          <div className="mg-sms-log-card__loading" role="status">
            {ADMIN_WEB_SCAFFOLD_COPY.PUSH_MONITOR_SMS_LOGS_LOADING}
          </div>
        ) : null}
        {errorMessage ? (
          <div className="mg-sms-log-card__error" role="alert" data-testid="sms-log-card-error">
            {errorMessage}
          </div>
        ) : null}
        {!isLoading && !errorMessage && items.length === 0 ? (
          <div className="mg-sms-log-card__empty" data-testid="sms-log-card-empty">
            <EmptyState
              title={ADMIN_WEB_SCAFFOLD_COPY.PUSH_MONITOR_SMS_LOGS_EMPTY_TITLE}
              description={ADMIN_WEB_SCAFFOLD_COPY.PUSH_MONITOR_SMS_LOGS_EMPTY_DESC}
            />
          </div>
        ) : null}
        {items.length > 0 ? (
          <ol className="mg-sms-log-card__rows">
            {items.map((entry) => (
              <SmsLogRow key={`${entry.id}`} entry={entry} />
            ))}
          </ol>
        ) : null}
      </div>
    </ContentSection>
  );
};

SmsLogCard.propTypes = {
  limit: PropTypes.number,
  autoLoad: PropTypes.bool
};

export default SmsLogCard;
