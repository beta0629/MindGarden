/**
 * PackagePaymentHistoryList — 합산 헤더 + 타임라인 카드 Organism
 * UnifiedModal·Side Peek 양쪽 재사용 (SCREEN_SPEC_CLIENT_PACKAGE_PAYMENT_HISTORY).
 *
 * @author MindGarden
 * @since 2026-07-28
 */

import React, { useCallback, useEffect, useState } from 'react';
import PropTypes from 'prop-types';
import { CreditCard } from 'lucide-react';
import Badge from '../../common/Badge';
import { EmptyState, StatusBadge } from '../../common';
import SafeText from '../../common/SafeText';
import UnifiedLoading from '../../common/UnifiedLoading';
import MGButton from '../../common/MGButton';
import ContentCard from '../../dashboard-v2/content/ContentCard';
import { buildErpMgButtonClassName, ERP_MG_BUTTON_LOADING_TEXT } from '../../erp/common/erpMgButtonProps';
import { API_ENDPOINTS } from '../../../constants/apiEndpoints';
import {
  PACKAGE_PAYMENT_HISTORY_TYPE,
  PACKAGE_PAYMENT_HISTORY_UI
} from '../../../constants/packagePaymentHistory';
import notificationManager from '../../../utils/notification';
import { toDisplayString, toSafeNumber } from '../../../utils/safeDisplay';
import StandardizedApi from '../../../utils/standardizedApi';
import './PackagePaymentHistoryList.css';

const TYPE_ACCENT_CLASS = Object.freeze({
  [PACKAGE_PAYMENT_HISTORY_TYPE.INITIAL_MAPPING]:
    'pkg-payment-history__card--accent-initial',
  [PACKAGE_PAYMENT_HISTORY_TYPE.ADDITIONAL_PACKAGE]:
    'pkg-payment-history__card--accent-additional',
  [PACKAGE_PAYMENT_HISTORY_TYPE.SESSION_EXTENSION]:
    'pkg-payment-history__card--accent-extension'
});

/**
 * @param {string|null|undefined} iso
 * @returns {string}
 */
const formatPaymentDate = (iso) => {
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
 * @param {number|string|null|undefined} amount
 * @returns {string}
 */
const formatAmount = (amount) => {
  const num = toSafeNumber(amount, null);
  if (num == null) {
    return '—';
  }
  return `${num.toLocaleString('ko-KR')}${PACKAGE_PAYMENT_HISTORY_UI.AMOUNT_SUFFIX}`;
};

/**
 * @param {Object} summary
 * @returns {string}
 */
const formatSummarySessions = (summary) => {
  const total = toSafeNumber(summary?.totalSessions, 0);
  const remaining = toSafeNumber(summary?.remainingSessions, 0);
  return PACKAGE_PAYMENT_HISTORY_UI.SUMMARY_SESSIONS_FMT
    .replace('{total}', String(total))
    .replace('{remaining}', String(remaining));
};

/**
 * @param {string} type
 * @returns {string}
 */
const resolveTypeLabel = (type) => {
  const key = toDisplayString(type, '');
  return PACKAGE_PAYMENT_HISTORY_UI.TYPE_LABELS[key]
    || toDisplayString(type, '—');
};

/**
 * @param {Object} props
 * @param {number|string} props.clientId
 * @param {boolean} [props.showAdminDetails=true] — false면 매핑ID·참조 등 숨김 (CLIENT variant)
 * @param {boolean} [props.autoLoad=true]
 * @param {string} [props.className]
 */
const PackagePaymentHistoryList = ({
  clientId,
  showAdminDetails = true,
  autoLoad = true,
  className = ''
}) => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [summary, setSummary] = useState(null);
  const [items, setItems] = useState([]);

  const loadHistory = useCallback(async() => {
    if (clientId == null || clientId === '') {
      setError(PACKAGE_PAYMENT_HISTORY_UI.LOAD_FAILED);
      setSummary(null);
      setItems([]);
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const url = API_ENDPOINTS.ADMIN.CLIENTS.PACKAGE_PAYMENT_HISTORY(clientId);
      const data = await StandardizedApi.get(url);
      if (!data) {
        throw new Error(PACKAGE_PAYMENT_HISTORY_UI.LOAD_FAILED);
      }
      setSummary(data.summary || null);
      setItems(Array.isArray(data.items) ? data.items : []);
    } catch (err) {
      const message = toDisplayString(
        err?.message,
        PACKAGE_PAYMENT_HISTORY_UI.LOAD_FAILED
      );
      setError(message);
      setSummary(null);
      setItems([]);
      notificationManager.error(message);
    } finally {
      setLoading(false);
    }
  }, [clientId]);

  useEffect(() => {
    if (!autoLoad) {
      return;
    }
    loadHistory();
  }, [autoLoad, loadHistory]);

  const rootClass = ['pkg-payment-history', className].filter(Boolean).join(' ');

  if (loading) {
    return (
      <div className={rootClass}>
        <UnifiedLoading type="inline" text={PACKAGE_PAYMENT_HISTORY_UI.LOADING_TEXT} />
      </div>
    );
  }

  if (error) {
    return (
      <div className={rootClass}>
        <div className="pkg-payment-history__error" role="alert">
          <p className="pkg-payment-history__error-message">
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
            {PACKAGE_PAYMENT_HISTORY_UI.RETRY_LABEL}
          </MGButton>
        </div>
      </div>
    );
  }

  const clientName = toDisplayString(summary?.clientName, '—');
  const consultantName = toDisplayString(summary?.consultantName, '—');
  const headerTitle = `${clientName} · ${consultantName}`;

  return (
    <div className={rootClass}>
      <header className="pkg-payment-history__header">
        <h3 className="pkg-payment-history__title">
          <SafeText>{headerTitle}</SafeText>
        </h3>
        <p className="pkg-payment-history__summary">
          <SafeText>{formatSummarySessions(summary)}</SafeText>
        </p>
      </header>

      {items.length === 0 ? (
        <EmptyState
          icon={<CreditCard size={32} aria-hidden />}
          title={PACKAGE_PAYMENT_HISTORY_UI.EMPTY_TITLE}
          description={PACKAGE_PAYMENT_HISTORY_UI.EMPTY_DESCRIPTION}
        />
      ) : (
        <ul className="pkg-payment-history__timeline" aria-label={PACKAGE_PAYMENT_HISTORY_UI.SECTION_TITLE}>
          {items.map((item, index) => {
            const typeKey = toDisplayString(item?.type, '');
            const accentClass = TYPE_ACCENT_CLASS[typeKey]
              || TYPE_ACCENT_CLASS[PACKAGE_PAYMENT_HISTORY_TYPE.INITIAL_MAPPING];
            const sessions = toSafeNumber(item?.sessions, null);
            const sessionsLabel = sessions != null
              ? `${sessions}${PACKAGE_PAYMENT_HISTORY_UI.SESSIONS_SUFFIX}`
              : '—';
            const rowKey = item?.extensionRequestId != null
              ? `ext-${item.extensionRequestId}`
              : item?.mappingId != null
                ? `map-${item.mappingId}-${typeKey}`
                : `row-${index}`;

            return (
              <li key={rowKey} className="pkg-payment-history__timeline-item">
                <ContentCard className={`pkg-payment-history__card ${accentClass}`}>
                  <div className="pkg-payment-history__card-top">
                    <span className="pkg-payment-history__date">
                      <SafeText>{formatPaymentDate(item?.paymentDate)}</SafeText>
                    </span>
                    <div className="pkg-payment-history__badges">
                      <Badge variant="status" statusVariant="info">
                        {resolveTypeLabel(item?.type)}
                      </Badge>
                      {item?.status && (
                        <StatusBadge status={toDisplayString(item.status, '')} />
                      )}
                    </div>
                  </div>
                  <p className="pkg-payment-history__package-name">
                    <SafeText>{toDisplayString(item?.packageName, '—')}</SafeText>
                  </p>
                  <p className="pkg-payment-history__amount-row">
                    <SafeText>{sessionsLabel}</SafeText>
                    <span aria-hidden="true"> · </span>
                    <SafeText>{formatAmount(item?.amount)}</SafeText>
                  </p>
                  {showAdminDetails && (
                    <div className="pkg-payment-history__meta">
                      {item?.paymentMethod && (
                        <span>
                          <SafeText>{toDisplayString(item.paymentMethod, '')}</SafeText>
                        </span>
                      )}
                      {item?.paymentReference && (
                        <span>
                          <SafeText>
                            {`${PACKAGE_PAYMENT_HISTORY_UI.REFERENCE_PREFIX} ${toDisplayString(item.paymentReference, '')}`}
                          </SafeText>
                        </span>
                      )}
                      {item?.consultantName && (
                        <span>
                          <SafeText>{toDisplayString(item.consultantName, '')}</SafeText>
                        </span>
                      )}
                      {item?.mappingId != null && (
                        <span>
                          <SafeText>
                            {`${PACKAGE_PAYMENT_HISTORY_UI.MAPPING_ID_PREFIX}${toDisplayString(item.mappingId, '')}`}
                          </SafeText>
                        </span>
                      )}
                    </div>
                  )}
                </ContentCard>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
};

PackagePaymentHistoryList.propTypes = {
  clientId: PropTypes.oneOfType([PropTypes.string, PropTypes.number]).isRequired,
  showAdminDetails: PropTypes.bool,
  autoLoad: PropTypes.bool,
  className: PropTypes.string
};

PackagePaymentHistoryList.defaultProps = {
  showAdminDetails: true,
  autoLoad: true,
  className: ''
};

export default PackagePaymentHistoryList;
