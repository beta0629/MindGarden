/**
 * ClientEventTimelineList — 내담자 client_event 타임라인 (더보기 append)
 *
 * @author MindGarden
 * @since 2026-11-27
 */

import React, { useCallback, useEffect, useState } from 'react';
import PropTypes from 'prop-types';
import { History } from 'lucide-react';
import { EmptyState } from '../../common';
import SafeText from '../../common/SafeText';
import Timeline from '../../common/timeline/Timeline';
import UnifiedLoading from '../../common/UnifiedLoading';
import MGButton from '../../common/MGButton';
import { buildErpMgButtonClassName, ERP_MG_BUTTON_LOADING_TEXT } from '../../erp/common/erpMgButtonProps';
import { API_ENDPOINTS } from '../../../constants/apiEndpoints';
import {
  CLIENT_EVENT_TIMELINE_DEFAULT_PAGE_SIZE,
  CLIENT_EVENT_TIMELINE_SORT,
  CLIENT_EVENT_TIMELINE_UI,
  resolveClientEventTypeLabel
} from '../../../constants/clientEventTimeline';
import { HTTP_STATUS } from '../../../constants/magicNumbers';
import { PAGED_LIST_FIRST_PAGE } from '../../../constants/pagedList';
import notificationManager from '../../../utils/notification';
import { toDisplayString } from '../../../utils/safeDisplay';
import StandardizedApi from '../../../utils/standardizedApi';
import './ClientEventTimelineList.css';

/**
 * @param {string|null|undefined} iso
 * @returns {string}
 */
const formatOccurredAtKst = (iso) => {
  if (!iso) {
    return '—';
  }
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) {
    return toDisplayString(iso, '—');
  }
  return date.toLocaleString('ko-KR', {
    timeZone: 'Asia/Seoul',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit'
  });
};

/**
 * @param {Object} props
 * @param {number|string} props.clientId
 * @param {boolean} [props.autoLoad]
 * @param {string} [props.className]
 */
const ClientEventTimelineList = ({
  clientId,
  autoLoad = true,
  className = ''
}) => {
  const [loading, setLoading] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const [error, setError] = useState(null);
  const [forbidden, setForbidden] = useState(false);
  const [events, setEvents] = useState([]);
  const [page, setPage] = useState(PAGED_LIST_FIRST_PAGE);
  const [isLast, setIsLast] = useState(true);

  const loadPage = useCallback(async(pageToLoad, append) => {
    if (clientId == null || clientId === '') {
      setError(CLIENT_EVENT_TIMELINE_UI.ERROR);
      setEvents([]);
      setForbidden(false);
      setIsLast(true);
      return;
    }

    if (append) {
      setLoadingMore(true);
    } else {
      setLoading(true);
    }
    setError(null);
    setForbidden(false);

    try {
      const url = API_ENDPOINTS.ADMIN.CLIENTS.EVENTS(clientId);
      const data = await StandardizedApi.get(url, {
        page: pageToLoad,
        size: CLIENT_EVENT_TIMELINE_DEFAULT_PAGE_SIZE,
        sort: CLIENT_EVENT_TIMELINE_SORT.DESC
      });
      const nextEvents = Array.isArray(data?.events) ? data.events : [];
      setEvents((prev) => (append ? [...prev, ...nextEvents] : nextEvents));
      setPage(pageToLoad);
      setIsLast(data?.last === true || data?.last == null);
    } catch (err) {
      if (Number(err?.status) === HTTP_STATUS.FORBIDDEN) {
        setForbidden(true);
        setError(null);
        if (!append) {
          setEvents([]);
        }
        setIsLast(true);
        return;
      }
      const message = toDisplayString(err?.message, CLIENT_EVENT_TIMELINE_UI.ERROR);
      setError(message);
      if (!append) {
        setEvents([]);
      }
      setIsLast(true);
      notificationManager.error(message);
    } finally {
      setLoading(false);
      setLoadingMore(false);
    }
  }, [clientId]);

  useEffect(() => {
    if (!autoLoad) {
      return;
    }
    loadPage(PAGED_LIST_FIRST_PAGE, false);
  }, [autoLoad, loadPage]);

  const handleRetry = useCallback(() => {
    loadPage(PAGED_LIST_FIRST_PAGE, false);
  }, [loadPage]);

  const handleLoadMore = useCallback(() => {
    if (loadingMore || isLast) {
      return;
    }
    loadPage(page + 1, true);
  }, [isLast, loadPage, loadingMore, page]);

  const rootClass = ['client-event-timeline', className].filter(Boolean).join(' ');

  if (loading) {
    return (
      <div className={rootClass} data-testid="client-event-timeline">
        <UnifiedLoading type="inline" text={CLIENT_EVENT_TIMELINE_UI.LOADING} />
      </div>
    );
  }

  if (forbidden) {
    return (
      <div className={rootClass} data-testid="client-event-timeline">
        <p className="client-event-timeline__forbidden" role="status">
          <SafeText>{CLIENT_EVENT_TIMELINE_UI.FORBIDDEN}</SafeText>
        </p>
      </div>
    );
  }

  if (error) {
    return (
      <div className={rootClass} data-testid="client-event-timeline">
        <div className="client-event-timeline__error" role="alert">
          <p className="client-event-timeline__error-message">
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
            onClick={handleRetry}
            preventDoubleClick={false}
          >
            {CLIENT_EVENT_TIMELINE_UI.RETRY}
          </MGButton>
        </div>
      </div>
    );
  }

  if (events.length === 0) {
    return (
      <div className={rootClass} data-testid="client-event-timeline">
        <EmptyState
          icon={<History size={32} aria-hidden />}
          title={CLIENT_EVENT_TIMELINE_UI.EMPTY}
        />
      </div>
    );
  }

  return (
    <div className={rootClass} data-testid="client-event-timeline">
      <Timeline ariaLabel={CLIENT_EVENT_TIMELINE_UI.ARIA_LIST}>
        {events.map((event, index) => {
          const typeLabel = resolveClientEventTypeLabel(event?.eventType);
          const occurredLabel = formatOccurredAtKst(event?.occurredAt);
          const reason = toDisplayString(event?.reason, '');
          const rowKey = event?.id != null ? `ce-${event.id}` : `ce-row-${index}`;

          return (
            <Timeline.Item key={rowKey} label={typeLabel}>
              <div className="client-event-timeline__body">
                <p className="client-event-timeline__when">
                  <SafeText>{occurredLabel}</SafeText>
                </p>
                {reason ? (
                  <p className="client-event-timeline__reason">
                    <SafeText>{reason}</SafeText>
                  </p>
                ) : null}
              </div>
            </Timeline.Item>
          );
        })}
      </Timeline>

      {!isLast ? (
        <div className="client-event-timeline__load-more">
          <MGButton
            type="button"
            variant="secondary"
            size="small"
            className={buildErpMgButtonClassName({
              variant: 'secondary',
              size: 'sm',
              loading: loadingMore
            })}
            loading={loadingMore}
            loadingText={ERP_MG_BUTTON_LOADING_TEXT}
            onClick={handleLoadMore}
            preventDoubleClick={false}
            disabled={loadingMore}
          >
            {CLIENT_EVENT_TIMELINE_UI.LOAD_MORE}
          </MGButton>
        </div>
      ) : null}
    </div>
  );
};

ClientEventTimelineList.propTypes = {
  clientId: PropTypes.oneOfType([PropTypes.string, PropTypes.number]).isRequired,
  autoLoad: PropTypes.bool,
  className: PropTypes.string
};

export default ClientEventTimelineList;
