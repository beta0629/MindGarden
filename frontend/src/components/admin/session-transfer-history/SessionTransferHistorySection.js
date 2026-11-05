/**
 * SessionTransferHistorySection — 회기 승계·이관 이력 (표시 전용)
 *
 * @author CoreSolution
 * @since 2026-09-14
 */

import React, { useCallback, useEffect, useState } from 'react';
import PropTypes from 'prop-types';
import { ArrowLeftRight } from 'lucide-react';
import Badge from '../../common/Badge';
import { EmptyState } from '../../common';
import SafeText from '../../common/SafeText';
import UnifiedLoading from '../../common/UnifiedLoading';
import MGButton from '../../common/MGButton';
import ContentSection from '../../dashboard-v2/content/ContentSection';
import { buildErpMgButtonClassName, ERP_MG_BUTTON_LOADING_TEXT } from '../../erp/common/erpMgButtonProps';
import { API_ENDPOINTS } from '../../../constants/apiEndpoints';
import {
  SESSION_TRANSFER_DIRECTION,
  SESSION_TRANSFER_HISTORY_UI
} from '../../../constants/sessionTransferHistory';
import notificationManager from '../../../utils/notification';
import { toDisplayString } from '../../../utils/safeDisplay';
import {
  mapSessionTransferHistoryResponse
} from '../../../utils/sessionTransferHistory';
import StandardizedApi from '../../../utils/standardizedApi';
import './SessionTransferHistorySection.css';

/**
 * @param {string|null|undefined} iso
 * @returns {string}
 */
const formatOccurredAt = (iso) => {
  if (!iso) {
    return '—';
  }
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) {
    return toDisplayString(iso, '—');
  }
  return date.toLocaleDateString('ko-KR', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit'
  });
};

/**
 * @param {Object} props
 * @param {number|string} [props.clientId]
 * @param {number|string} [props.mappingId]
 * @param {boolean} [props.autoLoad]
 * @param {string} [props.className]
 */
const SessionTransferHistorySection = ({
  clientId = null,
  mappingId = null,
  autoLoad = true,
  className = ''
}) => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [items, setItems] = useState([]);

  const loadHistory = useCallback(async() => {
    const hasMapping = mappingId != null && mappingId !== '';
    const hasClient = clientId != null && clientId !== '';
    if (!hasMapping && !hasClient) {
      setError(SESSION_TRANSFER_HISTORY_UI.LOAD_FAILED);
      setItems([]);
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const url = hasMapping
        ? API_ENDPOINTS.ADMIN.MAPPINGS.SESSION_TRANSFER_HISTORY(mappingId)
        : API_ENDPOINTS.ADMIN.CLIENTS.SESSION_TRANSFER_HISTORY(clientId);
      const data = await StandardizedApi.get(url);
      setItems(mapSessionTransferHistoryResponse(data));
    } catch (err) {
      const message = toDisplayString(
        err?.message,
        SESSION_TRANSFER_HISTORY_UI.LOAD_FAILED
      );
      setError(message);
      setItems([]);
      notificationManager.error(message);
    } finally {
      setLoading(false);
    }
  }, [clientId, mappingId]);

  useEffect(() => {
    if (!autoLoad) {
      return;
    }
    loadHistory();
  }, [autoLoad, loadHistory]);

  const rootClass = ['session-transfer-history', className].filter(Boolean).join(' ');

  let body;
  if (loading) {
    body = (
      <UnifiedLoading type="inline" text={SESSION_TRANSFER_HISTORY_UI.LOADING_TEXT} />
    );
  } else if (error) {
    body = (
      <div className="session-transfer-history__error" role="alert">
        <p className="session-transfer-history__error-message">
          <SafeText>{error}</SafeText>
        </p>
        <MGButton
          type="button"
          variant="secondary"
          size="small"
          className={buildErpMgButtonClassName({
            variant: 'secondary',
            size: 'sm',
            loading: false
          })}
          loading={false}
          loadingText={ERP_MG_BUTTON_LOADING_TEXT}
          onClick={loadHistory}
          preventDoubleClick={false}
        >
          {SESSION_TRANSFER_HISTORY_UI.RETRY_LABEL}
        </MGButton>
      </div>
    );
  } else if (items.length === 0) {
    body = (
      <EmptyState
        icon={<ArrowLeftRight size={32} aria-hidden />}
        title={SESSION_TRANSFER_HISTORY_UI.EMPTY_TITLE}
        description={SESSION_TRANSFER_HISTORY_UI.EMPTY_DESCRIPTION}
      />
    );
  } else {
    body = (
      <ul
        className="session-transfer-history__list"
        aria-label={SESSION_TRANSFER_HISTORY_UI.SECTION_TITLE}
      >
        {items.map((item, index) => {
          const rowKey = item.id != null
            ? `st-${item.id}`
            : `st-${item.fromMappingId}-${item.toMappingId}-${item.sessionCount}-${index}`;
          const isIncoming = item.direction === SESSION_TRANSFER_DIRECTION.INCOMING;
          return (
            <li key={rowKey} className="session-transfer-history__item">
              <div className="session-transfer-history__item-top">
                <p className="session-transfer-history__headline">
                  <SafeText>{item.headline}</SafeText>
                </p>
                <Badge
                  variant="status"
                  statusVariant={isIncoming ? 'warning' : 'info'}
                  size="sm"
                >
                  {isIncoming
                    ? SESSION_TRANSFER_HISTORY_UI.BADGE_INCOMING
                    : SESSION_TRANSFER_HISTORY_UI.BADGE_OUTGOING}
                </Badge>
              </div>
              <p className="session-transfer-history__meta">
                <SafeText>{formatOccurredAt(item.occurredAt)}</SafeText>
                {item.mappingIdsLabel ? (
                  <>
                    <span aria-hidden="true"> · </span>
                    <SafeText>{item.mappingIdsLabel}</SafeText>
                  </>
                ) : null}
              </p>
              {item.reason ? (
                <p className="session-transfer-history__reason">
                  <SafeText>{item.reason}</SafeText>
                </p>
              ) : null}
            </li>
          );
        })}
      </ul>
    );
  }

  return (
    <ContentSection
      title={SESSION_TRANSFER_HISTORY_UI.SECTION_TITLE}
      subtitle={SESSION_TRANSFER_HISTORY_UI.SECTION_SUBTITLE}
      noCard
      className={rootClass}
      dataTestId="session-transfer-history"
    >
      {body}
    </ContentSection>
  );
};

SessionTransferHistorySection.propTypes = {
  clientId: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
  mappingId: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
  autoLoad: PropTypes.bool,
  className: PropTypes.string
};

export default SessionTransferHistorySection;
