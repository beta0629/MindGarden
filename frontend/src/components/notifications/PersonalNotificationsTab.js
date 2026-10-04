/**
 * 통합 알림 「내 알림」 탭 — 본인 개인 알림(/api/v1/notifications)을 page/size 로 읽고 더 보기로 이어 붙인다.
 * 헤더·컨텍스트는 미리보기 몇 건만 읽으므로 전체는 이 탭에서 본다.
 *
 * @author CoreSolution
 * @since 2026-10-03
 */

import React, { useCallback } from 'react';
import PropTypes from 'prop-types';
import { useTranslation } from 'react-i18next';
import StandardizedApi from '../../utils/standardizedApi';
import { usePagedList } from '../../hooks/usePagedList';
import UnifiedLoading from '../common/UnifiedLoading';
import ListLoadMore from '../common/ListLoadMore';
import SafeText from '../common/SafeText';
import { toDisplayString } from '../../utils/safeDisplay';
import {
  API_PERSONAL_NOTIFICATIONS_LIST,
  PERSONAL_NOTIFICATION_TEST_IDS
} from '../../constants/notificationTabs';

const PREVIEW_MAX_CHARS = 100;

/**
 * @param {*} content
 * @returns {string}
 */
const toPreviewText = (content) => {
  const text = toDisplayString(content, '').replace(/<[^>]*>/g, '');
  return text.length > PREVIEW_MAX_CHARS ? `${text.substring(0, PREVIEW_MAX_CHARS)}...` : text;
};

const PersonalNotificationsTab = ({ enabled, resetKey, formatDate, onSelect }) => {
  const { t } = useTranslation();

  const fetchPage = useCallback(
    (page, size) => StandardizedApi.get(API_PERSONAL_NOTIFICATIONS_LIST, { page, size }),
    []
  );

  const {
    items,
    setItems,
    totalElements,
    loading,
    loadingMore,
    hasMore,
    loadMore
  } = usePagedList({ fetchPage, enabled, resetKey });

  const handleSelect = useCallback((notification) => {
    if (!notification.isRead) {
      setItems((prev) => prev.map((item) => (
        item.id === notification.id ? { ...item, isRead: true } : item
      )));
    }
    onSelect(notification);
  }, [onSelect, setItems]);

  if (loading) {
    return <UnifiedLoading type="inline" text={t('common:notification.unified.loading')} />;
  }

  if (items.length === 0) {
    return (
      <div className="mg-empty-state">
        <div className="mg-empty-state__text">
          {t('common:notification.unified.personalEmpty')}
        </div>
      </div>
    );
  }

  return (
    <div>
      <div className="mg-space-y-sm" data-testid={PERSONAL_NOTIFICATION_TEST_IDS.LIST}>
        {items.map((notification) => (
          <button
            type="button"
            key={notification.id}
            data-testid={PERSONAL_NOTIFICATION_TEST_IDS.ITEM}
            onClick={() => handleSelect(notification)}
            className={`mg-card mg-cursor-pointer mg-w-full mg-text-left ${notification.isRead ? 'mg-card-read' : 'mg-card-unread'}`}
          >
            <div className="mg-flex mg-justify-between mg-align-start mg-mb-sm">
              <h4 className={`mg-h5 mg-mb-0 ${notification.isRead ? '' : 'mg-font-weight-semibold'}`}>
                <SafeText>{notification.title}</SafeText>
              </h4>
              <span className="mg-v2-text-xs mg-v2-color-text-secondary">
                {formatDate(notification.publishedAt || notification.createdAt)}
              </span>
            </div>
            <p className="mg-v2-text-sm mg-v2-color-text-secondary mg-mb-0">
              {toPreviewText(notification.content)}
            </p>
          </button>
        ))}
      </div>
      <ListLoadMore
        loadedCount={items.length}
        totalCount={totalElements}
        hasMore={hasMore}
        loading={loadingMore}
        onLoadMore={loadMore}
      />
    </div>
  );
};

PersonalNotificationsTab.propTypes = {
  enabled: PropTypes.bool.isRequired,
  resetKey: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
  formatDate: PropTypes.func.isRequired,
  onSelect: PropTypes.func.isRequired
};

export default PersonalNotificationsTab;
