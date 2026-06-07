/**
 * PushMonitorFailureList — 최근 실패 사례 테이블 + 재발송 confirm 모달.
 *
 * 디자이너 핸드오프 §4.8. UnifiedModal 재사용(D8 가드). PII 가드:
 *  - `recipient_phone_masked` 백엔드 응답을 그대로 노출(재마스킹 X)
 *  - `error_message` 한국어 prefix 그대로(FE 추가 가공 금지)
 *
 * @author MindGarden core-coder
 * @since 2026-06-07
 */

import React, { useCallback, useMemo, useState } from 'react';
import PropTypes from 'prop-types';
import EmptyState from '../../../common/EmptyState';
import UnifiedModal from '../../../common/modals/UnifiedModal';
import PushMonitorMaskedRecipient from '../atoms/PushMonitorMaskedRecipient';
import { ADMIN_WEB_SCAFFOLD_COPY } from '../../../../constants/adminWebScaffold';
import './PushMonitorFailureList.css';

const PAGE_SIZE = 20;

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

const PushMonitorFailureList = ({ entries, totalCount, onResend, isResending }) => {
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

  const totalText = totalCount > safeEntries.length ? totalCount : safeEntries.length;

  return (
    <div className="mg-push-monitor__failure-list" role="table" aria-rowcount={totalText}>
      <div className="mg-push-monitor__failure-list__header" role="row" aria-hidden="true">
        <span className="mg-push-monitor__failure-list__th">{ADMIN_WEB_SCAFFOLD_COPY.PUSH_MONITOR_FAILURES_TH_TIME}</span>
        <span className="mg-push-monitor__failure-list__th">{ADMIN_WEB_SCAFFOLD_COPY.PUSH_MONITOR_FAILURES_TH_CHANNEL}</span>
        <span className="mg-push-monitor__failure-list__th">{ADMIN_WEB_SCAFFOLD_COPY.PUSH_MONITOR_FAILURES_TH_TEMPLATE}</span>
        <span className="mg-push-monitor__failure-list__th">{ADMIN_WEB_SCAFFOLD_COPY.PUSH_MONITOR_FAILURES_TH_RECIPIENT}</span>
        <span className="mg-push-monitor__failure-list__th">{ADMIN_WEB_SCAFFOLD_COPY.PUSH_MONITOR_FAILURES_TH_ERROR_CODE}</span>
        <span className="mg-push-monitor__failure-list__th">{ADMIN_WEB_SCAFFOLD_COPY.PUSH_MONITOR_FAILURES_TH_ACTIONS}</span>
      </div>
      <ol className="mg-push-monitor__failure-list__rows">
        {pageRows.map((entry) => {
          const channelText = channelLabel(entry.channel);
          const categoryText = categoryLabel(entry.errorCategory);
          const rowClass = [
            'mg-push-monitor__failure-row',
            entry.retryable ? 'mg-push-monitor__failure-row--retryable' : 'mg-push-monitor__failure-row--terminal'
          ].join(' ');
          const ariaLabel = `${formatTime(entry.occurredAt)} ${channelText} ${entry.templateCode || ''} ${entry.recipientPhoneMasked || ''} ${entry.errorCode || ''}`;
          return (
            <li
              key={`${entry.source}-${entry.id}`}
              className={rowClass}
              role="row"
              aria-label={ariaLabel}
              data-testid="push-monitor-failure-row"
            >
              <span className="mg-push-monitor__failure-row__time" role="cell">{formatTime(entry.occurredAt)}</span>
              <span className="mg-push-monitor__failure-row__channel" role="cell">{channelText}</span>
              <span className="mg-push-monitor__failure-row__template" role="cell">{entry.templateCode || '—'}</span>
              <span role="cell">
                <PushMonitorMaskedRecipient value={entry.recipientPhoneMasked} ariaLabel={`${ADMIN_WEB_SCAFFOLD_COPY.PUSH_MONITOR_FAILURES_TH_RECIPIENT}: ${entry.recipientPhoneMasked || ''}`} />
              </span>
              <span className="mg-push-monitor__failure-row__error-code" role="cell">
                <span className="mg-push-monitor__failure-row__category">{categoryText}</span>
                <span className="mg-push-monitor__failure-row__code">{entry.errorCode || ''}</span>
              </span>
              <span role="cell" className="mg-push-monitor__failure-row__actions">
                <button
                  type="button"
                  className="mg-push-monitor__failure-row__resend"
                  onClick={() => handleResendRequest(entry)}
                  disabled={!entry.retryable || isResending}
                  aria-label={`${entry.templateCode || ''} ${ADMIN_WEB_SCAFFOLD_COPY.PUSH_MONITOR_FAILURES_ACTION_RESEND}`}
                  aria-disabled={!entry.retryable || isResending}
                >
                  {ADMIN_WEB_SCAFFOLD_COPY.PUSH_MONITOR_FAILURES_ACTION_RESEND}
                </button>
              </span>
              <span className="mg-push-monitor__failure-row__message" role="cell">{entry.errorMessage}</span>
            </li>
          );
        })}
      </ol>
      <div className="mg-push-monitor__failure-list__pagination">
        <button
          type="button"
          className="mg-push-monitor__failure-list__page-btn"
          onClick={() => setPage((p) => Math.max(0, p - 1))}
          disabled={page === 0}
        >
          {ADMIN_WEB_SCAFFOLD_COPY.PUSH_MONITOR_FAILURES_PAGE_PREV}
        </button>
        <span className="mg-push-monitor__failure-list__page-status">
          {`${page + 1} / ${totalPages}`}
        </span>
        <button
          type="button"
          className="mg-push-monitor__failure-list__page-btn"
          onClick={() => setPage((p) => Math.min(totalPages - 1, p + 1))}
          disabled={page >= totalPages - 1}
        >
          {ADMIN_WEB_SCAFFOLD_COPY.PUSH_MONITOR_FAILURES_PAGE_NEXT}
        </button>
      </div>
      <UnifiedModal
        isOpen={pendingTarget != null}
        onClose={handleCancel}
        title={ADMIN_WEB_SCAFFOLD_COPY.PUSH_MONITOR_RESEND_MODAL_TITLE}
        size="small"
        variant="confirm"
        actions={(
          <div className="mg-push-monitor__failure-list__modal-actions">
            <button
              type="button"
              className="mg-push-monitor__failure-list__modal-cancel"
              onClick={handleCancel}
            >
              {ADMIN_WEB_SCAFFOLD_COPY.PUSH_MONITOR_RESEND_MODAL_CANCEL}
            </button>
            <button
              type="button"
              className="mg-push-monitor__failure-list__modal-confirm"
              onClick={handleConfirm}
              disabled={isResending}
            >
              {ADMIN_WEB_SCAFFOLD_COPY.PUSH_MONITOR_RESEND_MODAL_CONFIRM}
            </button>
          </div>
        )}
      >
        <div className="mg-push-monitor__failure-list__modal-body">
          {pendingTarget ? (
            <>
              <div>
                {channelLabel(pendingTarget.channel)} {ADMIN_WEB_SCAFFOLD_COPY.PUSH_MONITOR_DISTRIBUTION_SEPARATOR} {pendingTarget.templateCode || '—'}
              </div>
              <div>
                <PushMonitorMaskedRecipient value={pendingTarget.recipientPhoneMasked} />
              </div>
              <div>{ADMIN_WEB_SCAFFOLD_COPY.PUSH_MONITOR_RESEND_MODAL_BODY_PREFIX}</div>
            </>
          ) : null}
        </div>
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

PushMonitorFailureList.defaultProps = {
  entries: [],
  totalCount: 0,
  isResending: false
};

export default PushMonitorFailureList;
export { PAGE_SIZE as PUSH_MONITOR_FAILURE_PAGE_SIZE };
