/**
 * 통합 알림 「내 알림」 탭 — 본인 개인 알림(/api/v1/notifications)을 page/size 로 읽고 더 보기로 이어 붙인다.
 * 유형·이동은 metadata.kind 만 보고, 본문·제목 문자열은 비교하지 않는다.
 *
 * @author CoreSolution
 * @since 2026-10-03
 */

import React, { useCallback, useMemo } from 'react';
import PropTypes from 'prop-types';
import { useTranslation } from 'react-i18next';
import StandardizedApi from '../../utils/standardizedApi';
import { usePagedList } from '../../hooks/usePagedList';
import ListLoadMore from '../common/ListLoadMore';
import EmptyState from '../common/EmptyState';
import MGButton from '../common/MGButton';
import { buildErpMgButtonClassName, ERP_MG_BUTTON_LOADING_TEXT } from '../erp/common/erpMgButtonProps';
import { ICONS, ICON_SIZES } from '../../constants/icons';
import {
  API_PERSONAL_NOTIFICATIONS_LIST,
  NOTIFICATION_PAGE_TEST_IDS,
  PERSONAL_NOTIFICATION_TEST_IDS
} from '../../constants/notificationTabs';
import {
  PERSONAL_NOTIFICATION_PRESENTATION,
  resolvePersonalNotificationDestination
} from '../../constants/personalNotificationRoutes';
import NotificationListCard, { NotificationLoadingList, toNotificationPreview } from './NotificationListCard';

const BellIcon = ICONS.BELL;
const AlertIcon = ICONS.ALERT_CIRCLE;
const TONE_ICONS = {
  matching: ICONS.USER_CHECK,
  payment: ICONS.CREDIT_CARD,
  deposit: ICONS.BUILDING_2
};

/**
 * @param {number|null} amount
 * @returns {string}
 */
const formatAmount = (amount) => {
  if (amount == null || !Number.isFinite(amount)) {
    return '';
  }
  return new Intl.NumberFormat('ko-KR').format(amount);
};

const PersonalNotificationsTab = ({
  enabled,
  resetKey,
  formatDate,
  onSelect,
  destinationOptions
}) => {
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
    error,
    hasMore,
    loadMore,
    reload
  } = usePagedList({ fetchPage, enabled, resetKey });

  const options = destinationOptions || {};

  const handleSelect = useCallback((notification) => {
    if (!notification.isRead) {
      setItems((prev) => prev.map((item) => (
        item.id === notification.id ? { ...item, isRead: true } : item
      )));
    }
    onSelect(notification);
  }, [onSelect, setItems]);

  const cards = useMemo(() => items.map((notification) => {
    const destination = resolvePersonalNotificationDestination(notification, options);
    const presentation = PERSONAL_NOTIFICATION_PRESENTATION[destination.meta.kind];
    const fields = [];
    if (destination.meta.productName) {
      fields.push({
        label: t('common:notification.unified.personal.field.product'),
        value: destination.meta.productName
      });
    }
    if (destination.meta.amount != null) {
      fields.push({
        label: t('common:notification.unified.personal.field.amount'),
        value: t('common:notification.unified.personal.field.amountValue', {
          amount: formatAmount(destination.meta.amount)
        })
      });
    }
    const when = notification.publishedAt || notification.createdAt;
    return {
      notification,
      destination,
      presentation,
      fields,
      when
    };
  }), [items, options, t]);

  if (loading) {
    return <NotificationLoadingList label={t('common:notification.unified.new_loading')} />;
  }

  if (error) {
    return (
      <div role="alert" data-testid={NOTIFICATION_PAGE_TEST_IDS.ERROR}>
        <EmptyState
          icon={<AlertIcon size={ICON_SIZES.XXL} aria-hidden />}
          title={t('common:notification.unified.new_errorTitle')}
          description={t('common:notification.unified.new_errorDesc')}
          action={(
            <MGButton
              type="button"
              variant="primary"
              className={buildErpMgButtonClassName({ variant: 'primary', loading: false })}
              loadingText={ERP_MG_BUTTON_LOADING_TEXT}
              onClick={() => { void reload(); }}
              preventDoubleClick={false}
            >
              {t('common:notification.unified.new_retry')}
            </MGButton>
          )}
        />
      </div>
    );
  }

  if (items.length === 0) {
    return (
      <EmptyState
        icon={<BellIcon size={ICON_SIZES.XXL} aria-hidden />}
        title={t('common:notification.unified.new_personalEmptyTitle')}
        description={t('common:notification.unified.new_personalEmptyDesc')}
      />
    );
  }

  return (
    <div>
      <ul className="notif-list" data-testid={PERSONAL_NOTIFICATION_TEST_IDS.LIST}>
        {cards.map(({ notification, destination, presentation, fields, when }) => (
          <NotificationListCard
            key={notification.id}
            testId={PERSONAL_NOTIFICATION_TEST_IDS.ITEM}
            title={presentation
              ? t(presentation.titleKey)
              : toNotificationPreview(notification.title)}
            timeLabel={formatDate(when)}
            timeIso={when || ''}
            summary={presentation
              ? t(presentation.summaryKey)
              : toNotificationPreview(notification.content)}
            unread={!notification.isRead}
            unreadLabel={t('common:notification.unified.new_unread')}
            unreadSr={t('common:notification.unified.new_unreadSr')}
            icon={(presentation && TONE_ICONS[presentation.tone]) || BellIcon}
            iconTone={presentation ? presentation.tone : ''}
            fields={fields}
            goLabel={destination.path && presentation ? t(presentation.goKey) : ''}
            showChevron={!destination.path}
            onClick={() => handleSelect(notification)}
          />
        ))}
      </ul>
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
  onSelect: PropTypes.func.isRequired,
  destinationOptions: PropTypes.shape({
    isClient: PropTypes.bool,
    shopEnabled: PropTypes.bool,
    shopGateKnown: PropTypes.bool
  })
};

PersonalNotificationsTab.defaultProps = {
  resetKey: undefined,
  destinationOptions: undefined
};

export default PersonalNotificationsTab;
