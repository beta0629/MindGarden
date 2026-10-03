/**
 * SmsLogCard — 최근 SMS/알림톡 발송 카드 (Organism).
 *
 * 「푸시 설정 모니터링」 페이지의 「최근 실패 사례」 카드 바로 위에 배치되어,
 * 운영자가 한 화면에서 최근 SMS/알림톡 발송 결과(성공·실패)를 확인할 수 있게 한다.
 *
 * - 목록은 ListTableView(390px 카드 전환), 오류는 SettingsNotice
 * - StandardizedApi 사용 (api/admin/pushMonitoringApi#getRecentSmsLogs)
 * - 본인 테넌트 한정 (백엔드 강제)
 * - 디자인 토큰만 사용 — 하드코딩 금지
 * - 빈 결과 / 로딩 / 에러 / 새로고침 4 상태 지원
 *
 * @author MindGarden core-coder
 * @since 2026-06-13
 * @updated 2026-10-03 — div 표 + 행 molecule → ListTableView
 */

import React, { useCallback, useEffect, useState } from 'react';
import PropTypes from 'prop-types';
import { SettingsButton, SettingsNotice, SettingsSectionPanel } from '../../settings-shell';
import EmptyState from '../../../common/EmptyState';
import ListTableView from '../../../common/ListTableView';
import StatusBadge from '../../../common/StatusBadge';
import PushMonitorMaskedRecipient from '../atoms/PushMonitorMaskedRecipient';
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

const SMS_LOG_COLUMNS = [
  { key: 'time', label: ADMIN_WEB_SCAFFOLD_COPY.PUSH_MONITOR_SMS_LOGS_TH_TIME },
  { key: 'channel', label: ADMIN_WEB_SCAFFOLD_COPY.PUSH_MONITOR_SMS_LOGS_TH_CHANNEL, hideOnMobile: true },
  { key: 'template', label: ADMIN_WEB_SCAFFOLD_COPY.PUSH_MONITOR_SMS_LOGS_TH_TEMPLATE },
  { key: 'recipient', label: ADMIN_WEB_SCAFFOLD_COPY.PUSH_MONITOR_SMS_LOGS_TH_RECIPIENT },
  { key: 'status', label: ADMIN_WEB_SCAFFOLD_COPY.PUSH_MONITOR_SMS_LOGS_TH_STATUS },
  { key: 'error', label: ADMIN_WEB_SCAFFOLD_COPY.PUSH_MONITOR_SMS_LOGS_TH_ERROR, hideOnMobile: true }
];

const formatTime = (iso) => {
  if (!iso) {
    return '';
  }
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) {
    return String(iso);
  }
  const mm = String(date.getMonth() + 1).padStart(2, '0');
  const dd = String(date.getDate()).padStart(2, '0');
  const hh = String(date.getHours()).padStart(2, '0');
  const min = String(date.getMinutes()).padStart(2, '0');
  return `${mm}-${dd} ${hh}:${min}`;
};

const channelLabel = (channel) => {
  if (channel === 'SMS') {
    return ADMIN_WEB_SCAFFOLD_COPY.PUSH_MONITOR_CHANNEL_SMS;
  }
  if (channel === 'ALIMTALK') {
    return ADMIN_WEB_SCAFFOLD_COPY.PUSH_MONITOR_CHANNEL_ALIMTALK;
  }
  return channel || ADMIN_WEB_SCAFFOLD_COPY.PUSH_MONITOR_SMS_LOGS_RECIPIENT_FALLBACK;
};

const statusBadge = (successFlag) => {
  if (successFlag === true) {
    return { variant: 'success', label: ADMIN_WEB_SCAFFOLD_COPY.PUSH_MONITOR_SMS_LOGS_STATUS_SUCCESS };
  }
  if (successFlag === false) {
    return { variant: 'danger', label: ADMIN_WEB_SCAFFOLD_COPY.PUSH_MONITOR_SMS_LOGS_STATUS_FAILURE };
  }
  return { variant: 'neutral', label: ADMIN_WEB_SCAFFOLD_COPY.PUSH_MONITOR_SMS_LOGS_STATUS_PENDING };
};

const renderSmsLogCell = (columnKey, entry) => {
  switch (columnKey) {
    case 'time':
      return formatTime(entry.createdAt);
    case 'channel':
      return <StatusBadge variant="info">{channelLabel(entry.channelUsed)}</StatusBadge>;
    case 'template':
      return (
        <span className="mg-v2-settings-mono">
          {entry.templateCode || ADMIN_WEB_SCAFFOLD_COPY.PUSH_MONITOR_SMS_LOGS_RECIPIENT_FALLBACK}
        </span>
      );
    case 'recipient':
      return (
        <span className="mg-v2-settings-table__cell-stack">
          <span>{entry.recipientName || ADMIN_WEB_SCAFFOLD_COPY.PUSH_MONITOR_SMS_LOGS_RECIPIENT_FALLBACK}</span>
          {entry.recipientPhone ? (
            <PushMonitorMaskedRecipient
              value={entry.recipientPhone}
              ariaLabel={`${ADMIN_WEB_SCAFFOLD_COPY.PUSH_MONITOR_SMS_LOGS_TH_RECIPIENT}: ${entry.recipientPhone}`}
            />
          ) : null}
        </span>
      );
    case 'status': {
      const badge = statusBadge(entry.successFlag);
      return <StatusBadge variant={badge.variant}>{badge.label}</StatusBadge>;
    }
    case 'error':
      return entry.errorMessage
        ? <span className="mg-v2-settings-text--danger">{entry.errorMessage}</span>
        : null;
    default:
      return null;
  }
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
    <SettingsButton
      type="button"
      variant="ghost"
      onClick={fetchLogs}
      disabled={isLoading}
      aria-label={ADMIN_WEB_SCAFFOLD_COPY.PUSH_MONITOR_SMS_LOGS_REFRESH}
    >
      {ADMIN_WEB_SCAFFOLD_COPY.PUSH_MONITOR_SMS_LOGS_REFRESH}
    </SettingsButton>
  );

  return (
    <SettingsSectionPanel
      title={ADMIN_WEB_SCAFFOLD_COPY.PUSH_MONITOR_SMS_LOGS_TITLE}
      description={ADMIN_WEB_SCAFFOLD_COPY.PUSH_MONITOR_SMS_LOGS_SUBTITLE}
      actions={actions}
      body="plain"
      testId="sms-log-card"
    >
      <div className="mg-sms-log-card">
        {isLoading && !hasLoaded ? (
          <p className="mg-v2-settings-muted" role="status">
            {ADMIN_WEB_SCAFFOLD_COPY.PUSH_MONITOR_SMS_LOGS_LOADING}
          </p>
        ) : null}
        {errorMessage ? (
          <SettingsNotice tone="danger" testId="sms-log-card-error">
            {errorMessage}
          </SettingsNotice>
        ) : null}
        {!isLoading && !errorMessage && items.length === 0 ? (
          <div data-testid="sms-log-card-empty">
            <EmptyState
              title={ADMIN_WEB_SCAFFOLD_COPY.PUSH_MONITOR_SMS_LOGS_EMPTY_TITLE}
              description={ADMIN_WEB_SCAFFOLD_COPY.PUSH_MONITOR_SMS_LOGS_EMPTY_DESC}
            />
          </div>
        ) : null}
        {items.length > 0 ? (
          <div className="mg-v2-settings-table" data-testid="sms-log-table">
            <ListTableView
              columns={SMS_LOG_COLUMNS}
              data={items}
              renderCell={renderSmsLogCell}
            />
          </div>
        ) : null}
      </div>
    </SettingsSectionPanel>
  );
};

SmsLogCard.propTypes = {
  limit: PropTypes.number,
  autoLoad: PropTypes.bool
};

export default SmsLogCard;
