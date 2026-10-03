/**
 * PushMonitorFailureList — 최근 실패 사례 ListTableView + 재발송 confirm 모달.
 *
 * 디자이너 핸드오프 §4.8. UnifiedModal 재사용(D8 가드). PII 가드:
 *  - `recipient_phone_masked` 백엔드 응답을 그대로 노출(재마스킹 X)
 *  - `error_message` 한국어 prefix 그대로(FE 추가 가공 금지)
 *
 * @author MindGarden core-coder
 * @since 2026-06-07
 * @updated 2026-10-03 — div 표 그리드·네이티브 버튼 → ListTableView + SettingsButton
 */

import React, { useCallback, useMemo, useState } from 'react';
import PropTypes from 'prop-types';
import EmptyState from '../../../common/EmptyState';
import ListTableView from '../../../common/ListTableView';
import StatusBadge from '../../../common/StatusBadge';
import UnifiedModal from '../../../common/modals/UnifiedModal';
import { SettingsButton } from '../../settings-shell';
import PushMonitorMaskedRecipient from '../atoms/PushMonitorMaskedRecipient';
import { ADMIN_WEB_SCAFFOLD_COPY } from '../../../../constants/adminWebScaffold';
import './PushMonitorFailureList.css';

const PAGE_SIZE = 20;

const FAILURE_COLUMNS = [
  { key: 'time', label: ADMIN_WEB_SCAFFOLD_COPY.PUSH_MONITOR_FAILURES_TH_TIME },
  { key: 'channel', label: ADMIN_WEB_SCAFFOLD_COPY.PUSH_MONITOR_FAILURES_TH_CHANNEL, hideOnMobile: true },
  { key: 'template', label: ADMIN_WEB_SCAFFOLD_COPY.PUSH_MONITOR_FAILURES_TH_TEMPLATE },
  { key: 'recipient', label: ADMIN_WEB_SCAFFOLD_COPY.PUSH_MONITOR_FAILURES_TH_RECIPIENT, hideOnMobile: true },
  { key: 'error', label: ADMIN_WEB_SCAFFOLD_COPY.PUSH_MONITOR_FAILURES_TH_ERROR_CODE },
  { key: 'actions', label: ADMIN_WEB_SCAFFOLD_COPY.PUSH_MONITOR_FAILURES_TH_ACTIONS }
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
  switch (channel) {
    case 'ALIMTALK':
      return ADMIN_WEB_SCAFFOLD_COPY.PUSH_MONITOR_CHANNEL_ALIMTALK;
    case 'SMS':
      return ADMIN_WEB_SCAFFOLD_COPY.PUSH_MONITOR_CHANNEL_SMS;
    case 'PUSH':
      return ADMIN_WEB_SCAFFOLD_COPY.PUSH_MONITOR_CHANNEL_PUSH;
    default:
      return channel || '';
  }
};

const categoryLabel = (category) => {
  switch (category) {
    case 'EXTERNAL_FAILURE':
      return ADMIN_WEB_SCAFFOLD_COPY.PUSH_MONITOR_CATEGORY_EXTERNAL;
    case 'VALIDATION_SKIP':
      return ADMIN_WEB_SCAFFOLD_COPY.PUSH_MONITOR_CATEGORY_VALIDATION;
    case 'POLICY_SKIP':
      return ADMIN_WEB_SCAFFOLD_COPY.PUSH_MONITOR_CATEGORY_POLICY;
    case 'PENDING':
      return ADMIN_WEB_SCAFFOLD_COPY.PUSH_MONITOR_CATEGORY_PENDING;
    default:
      return category || '';
  }
};

const PushMonitorFailureList = ({
  entries = [],
  totalCount = 0,
  onResend,
  isResending = false
}) => {
  const [page, setPage] = useState(0);
  const [pendingTarget, setPendingTarget] = useState(null);

  const safeEntries = Array.isArray(entries) ? entries : [];
  const pageStart = page * PAGE_SIZE;
  const pageEnd = pageStart + PAGE_SIZE;
  const pageRows = useMemo(() => safeEntries.slice(pageStart, pageEnd), [safeEntries, pageStart, pageEnd]);
  const totalPages = Math.max(1, Math.ceil(safeEntries.length / PAGE_SIZE));

  const handleResendRequest = useCallback((entry) => {
    if (!entry || !entry.retryable) {
      return;
    }
    setPendingTarget(entry);
  }, []);

  const handleConfirm = useCallback(() => {
    if (!pendingTarget) {
      return;
    }
    onResend(pendingTarget);
    setPendingTarget(null);
  }, [pendingTarget, onResend]);

  const handleCancel = useCallback(() => {
    setPendingTarget(null);
  }, []);

  if (safeEntries.length === 0) {
    return (
      <div className="mg-push-monitor__failure-list">
        <EmptyState
          title={ADMIN_WEB_SCAFFOLD_COPY.PUSH_MONITOR_FAILURES_EMPTY_TITLE}
          description={ADMIN_WEB_SCAFFOLD_COPY.PUSH_MONITOR_FAILURES_EMPTY_DESC}
        />
      </div>
    );
  }

  const tableRows = pageRows.map((entry) => ({ ...entry, rowKey: `${entry.source}-${entry.id}` }));

  const renderCell = (columnKey, entry) => {
    switch (columnKey) {
      case 'time':
        return formatTime(entry.occurredAt);
      case 'channel':
        return channelLabel(entry.channel);
      case 'template':
        return <span className="mg-v2-settings-mono">{entry.templateCode || '—'}</span>;
      case 'recipient':
        return (
          <PushMonitorMaskedRecipient
            value={entry.recipientPhoneMasked}
            ariaLabel={`${ADMIN_WEB_SCAFFOLD_COPY.PUSH_MONITOR_FAILURES_TH_RECIPIENT}: ${entry.recipientPhoneMasked || ''}`}
          />
        );
      case 'error':
        return (
          <span className="mg-v2-settings-table__cell-stack">
            <StatusBadge variant={entry.retryable ? 'warning' : 'danger'}>
              {categoryLabel(entry.errorCategory)}
            </StatusBadge>
            <span className="mg-v2-settings-mono">{entry.errorCode || ''}</span>
            {entry.errorMessage ? (
              <span className="mg-v2-settings-muted">{entry.errorMessage}</span>
            ) : null}
          </span>
        );
      case 'actions':
        return (
          <SettingsButton
            type="button"
            variant="secondary"
            onClick={() => handleResendRequest(entry)}
            disabled={!entry.retryable || isResending}
            aria-label={`${entry.templateCode || ''} ${ADMIN_WEB_SCAFFOLD_COPY.PUSH_MONITOR_FAILURES_ACTION_RESEND}`}
          >
            {ADMIN_WEB_SCAFFOLD_COPY.PUSH_MONITOR_FAILURES_ACTION_RESEND}
          </SettingsButton>
        );
      default:
        return null;
    }
  };

  return (
    <div className="mg-push-monitor__failure-list">
      <div className="mg-v2-settings-table" data-testid="push-monitor-failure-table">
        <ListTableView
          columns={FAILURE_COLUMNS}
          data={tableRows}
          renderCell={renderCell}
          rowKeyField="rowKey"
        />
      </div>
      <div className="mg-push-monitor__failure-list__pagination">
        <SettingsButton
          type="button"
          variant="ghost"
          onClick={() => setPage((p) => Math.max(0, p - 1))}
          disabled={page === 0}
        >
          {ADMIN_WEB_SCAFFOLD_COPY.PUSH_MONITOR_FAILURES_PAGE_PREV}
        </SettingsButton>
        <span className="mg-v2-settings-muted">
          {`${page + 1} / ${totalPages}`}
        </span>
        <SettingsButton
          type="button"
          variant="ghost"
          onClick={() => setPage((p) => Math.min(totalPages - 1, p + 1))}
          disabled={page >= totalPages - 1}
        >
          {ADMIN_WEB_SCAFFOLD_COPY.PUSH_MONITOR_FAILURES_PAGE_NEXT}
        </SettingsButton>
      </div>
      <UnifiedModal
        isOpen={pendingTarget != null}
        onClose={handleCancel}
        title={ADMIN_WEB_SCAFFOLD_COPY.PUSH_MONITOR_RESEND_MODAL_TITLE}
        size="small"
        variant="confirm"
        actions={(
          <>
            <SettingsButton type="button" variant="secondary" onClick={handleCancel}>
              {ADMIN_WEB_SCAFFOLD_COPY.PUSH_MONITOR_RESEND_MODAL_CANCEL}
            </SettingsButton>
            <SettingsButton
              type="button"
              variant="primary"
              onClick={handleConfirm}
              disabled={isResending}
            >
              {ADMIN_WEB_SCAFFOLD_COPY.PUSH_MONITOR_RESEND_MODAL_CONFIRM}
            </SettingsButton>
          </>
        )}
      >
        {pendingTarget ? (
          <dl className="mg-v2-settings-kv">
            <div>
              <dt>{ADMIN_WEB_SCAFFOLD_COPY.PUSH_MONITOR_FAILURES_TH_CHANNEL}</dt>
              <dd>{channelLabel(pendingTarget.channel)}</dd>
            </div>
            <div>
              <dt>{ADMIN_WEB_SCAFFOLD_COPY.PUSH_MONITOR_FAILURES_TH_TEMPLATE}</dt>
              <dd className="mg-v2-settings-mono">{pendingTarget.templateCode || '—'}</dd>
            </div>
            <div>
              <dt>{ADMIN_WEB_SCAFFOLD_COPY.PUSH_MONITOR_FAILURES_TH_RECIPIENT}</dt>
              <dd><PushMonitorMaskedRecipient value={pendingTarget.recipientPhoneMasked} /></dd>
            </div>
          </dl>
        ) : null}
        {pendingTarget ? (
          <p className="mg-v2-settings-muted">{ADMIN_WEB_SCAFFOLD_COPY.PUSH_MONITOR_RESEND_MODAL_BODY_PREFIX}</p>
        ) : null}
      </UnifiedModal>
    </div>
  );
};

PushMonitorFailureList.propTypes = {
  entries: PropTypes.arrayOf(PropTypes.shape({
    id: PropTypes.oneOfType([PropTypes.string, PropTypes.number]).isRequired,
    source: PropTypes.oneOf(['BATCH', 'ADMIN_TEST']).isRequired,
    occurredAt: PropTypes.string,
    channel: PropTypes.string,
    templateCode: PropTypes.string,
    recipientPhoneMasked: PropTypes.string,
    errorCategory: PropTypes.string,
    errorCode: PropTypes.string,
    errorMessage: PropTypes.string,
    retryable: PropTypes.bool
  })),
  totalCount: PropTypes.number,
  onResend: PropTypes.func.isRequired,
  isResending: PropTypes.bool
};

export default PushMonitorFailureList;
export { PAGE_SIZE as PUSH_MONITOR_FAILURE_PAGE_SIZE };
