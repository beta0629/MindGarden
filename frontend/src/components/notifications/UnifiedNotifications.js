import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useSession } from '../../contexts/SessionContext';
import { useNotification } from '../../contexts/NotificationContext';
import { useToast } from '../../contexts/ToastContext';
import { useTenantComponentFlags } from '../../hooks/useTenantComponentFlags';
import { usePagedList } from '../../hooks/usePagedList';
import { apiGet } from '../../utils/ajax';
import { getConsultationMessagesListPath } from '../../utils/consultationMessagesApi';
import { toDisplayString } from '../../utils/safeDisplay';
import { sanitizeRichNoticeHtml } from '../../utils/safeHtml';
import {
  formatNotificationSummaryText,
  formatPersonalOrderNumber
} from '../../utils/displayId';
import { parseMessageConsultationFields } from '../../utils/messageConsultationFields';
import { buildPagedListSummaryLabel } from '../../utils/pagedListSummary';
import AdminCommonLayout from '../layout/AdminCommonLayout';
import ClientWebPageShell from '../client/ClientWebPageShell';
import { ContentArea, ContentHeader } from '../dashboard-v2/content';
import UnifiedModal from '../common/modals/UnifiedModal';
import MGButton from '../common/MGButton';
import MGPagination from '../common/MGPagination';
import { buildErpMgButtonClassName, ERP_MG_BUTTON_LOADING_TEXT } from '../erp/common/erpMgButtonProps';
import ActionBar from '../common/ActionBar';
import ActionBarButton from '../common/ActionBarButton';
import SafeText from '../common/SafeText';
import EmptyState from '../common/EmptyState';
import { ICONS, ICON_SIZES } from '../../constants/icons';
import {
  CLIENT_NOTIFICATION_LIST_PAGE_SIZE,
  PAGED_LIST_MODE
} from '../../constants/pagedList';
import PersonalNotificationsTab from './PersonalNotificationsTab';
import NotificationListCard, {
  NotificationLoadingList,
  NotificationUrgentBadge,
  toNotificationPreview
} from './NotificationListCard';
import {
  NOTIFICATION_PAGE_TEST_IDS,
  NOTIFICATION_TABS,
  NOTIFICATION_TAB_QUERY_KEY,
  PERSONAL_NOTIFICATION_TEST_IDS
} from '../../constants/notificationTabs';
import {
  PERSONAL_NOTIFICATION_PRESENTATION,
  isClientNotificationUser,
  resolveNotificationsListPath,
  resolvePersonalNotificationDestination,
  usesClientNotificationShell
} from '../../constants/personalNotificationRoutes';
import '../../styles/unified-design-tokens.css';
import './UnifiedNotifications.css';

const API_SYSTEM_NOTIFICATIONS = '/api/v1/system-notifications';
const UNIFIED_NOTIFICATIONS_TITLE_ID = 'unified-notifications-title';
const TAB_ORDER = [
  NOTIFICATION_TABS.SYSTEM,
  NOTIFICATION_TABS.MESSAGES,
  NOTIFICATION_TABS.PERSONAL
];

const CloseIcon = ICONS.X;
const VolumeIcon = ICONS.VOLUME;
const MessageIcon = ICONS.MESSAGE_CIRCLE;
const BellIcon = ICONS.BELL;
const AlertIcon = ICONS.ALERT_CIRCLE;
const InfoIcon = ICONS.INFO;

/**
 * @param {string} search location.search
 * @returns {string}
 */
const resolveInitialTab = (search) => {
  const tab = new URLSearchParams(search || '').get(NOTIFICATION_TAB_QUERY_KEY);
  return Object.values(NOTIFICATION_TABS).includes(tab) ? tab : NOTIFICATION_TABS.SYSTEM;
};

/**
 * 내 알림 모달은 날짜만. 공지·메시지는 보낸 이 · 날짜.
 *
 * @param {{ type: string, data: object }} selectedItem
 * @param {(value: string) => string} formatDate
 * @param {(key: string) => string} t
 * @returns {string}
 */
const modalSubtitle = (selectedItem, formatDate, t) => {
  const when = formatDate(selectedItem.data.publishedAt || selectedItem.data.createdAt);
  if (selectedItem.type === NOTIFICATION_TABS.PERSONAL) {
    return when;
  }
  const who = selectedItem.data.senderType === 'SYSTEM'
    ? t('common:notification.unified.senderSystem')
    : (selectedItem.data.authorName
      || selectedItem.data.senderName
      || t('common:notification.unified.adminLabel'));
  return when ? `${who} · ${when}` : who;
};

/**
 * 시스템 공지와 일반 메시지, 내 알림을 한 화면에서 본다.
 * 내담자만 ClientWebPageShell. 상담사·관리자는 AdminCommonLayout.
 */
const UnifiedNotifications = () => {
  const { t } = useTranslation();
  const { showToast } = useToast();
  const { user, isLoggedIn } = useSession();
  const location = useLocation();
  const navigate = useNavigate();
  const { markSystemNotificationAsRead } = useNotification();
  const {
    clientShopEnabled,
    loading: shopFlagsLoading,
    fetchFailed: shopFlagsFailed
  } = useTenantComponentFlags();

  const [activeTab, setActiveTab] = useState(() => resolveInitialTab(location.search));
  const [selectedItem, setSelectedItem] = useState(null);
  const tabRefs = useRef({});

  const clientShell = usesClientNotificationShell(user, isLoggedIn);
  const clientUser = Boolean(isLoggedIn && isClientNotificationUser(user));
  const destinationOptions = useMemo(() => ({
    isClient: clientUser,
    shopEnabled: !shopFlagsFailed && clientShopEnabled,
    shopGateKnown: !shopFlagsLoading
  }), [clientUser, shopFlagsFailed, clientShopEnabled, shopFlagsLoading]);

  const sessionReady = Boolean(isLoggedIn && user?.id);

  const fetchSystemPage = useCallback(
    (page, size) => apiGet(API_SYSTEM_NOTIFICATIONS, { page, size }),
    []
  );

  const fetchMessagesPage = useCallback((page, size) => {
    const basePath = getConsultationMessagesListPath(user);
    if (!basePath) {
      return Promise.resolve({ messages: [], totalElements: 0, totalPages: 0 });
    }
    return apiGet(basePath, { page, size });
  }, [user]);

  const systemList = usePagedList({
    fetchPage: fetchSystemPage,
    pageSize: CLIENT_NOTIFICATION_LIST_PAGE_SIZE,
    mode: PAGED_LIST_MODE.REPLACE,
    enabled: sessionReady && activeTab === NOTIFICATION_TABS.SYSTEM,
    resetKey: user?.id
  });

  const messagesList = usePagedList({
    fetchPage: fetchMessagesPage,
    pageSize: CLIENT_NOTIFICATION_LIST_PAGE_SIZE,
    mode: PAGED_LIST_MODE.REPLACE,
    enabled: sessionReady && activeTab === NOTIFICATION_TABS.MESSAGES,
    resetKey: user?.id
  });

  useEffect(() => {
    if (!systemList.error) {
      return;
    }
    // 시스템 공지 목록 API 실패 시에만 AppToast(.app-toast)
    showToast({
      message: t('common:notification.unified.new_errorToast'),
      type: 'error'
    });
  }, [systemList.error, showToast, t]);

  useEffect(() => {
    if (!messagesList.error) {
      return;
    }
    // 일반 메시지 목록 API 실패 시에만 AppToast(.app-toast)
    showToast({
      message: t('common:notification.unified.new_errorToast'),
      type: 'error'
    });
  }, [messagesList.error, showToast, t]);

  const handleTabChange = (tab) => {
    setActiveTab(tab);
    setSelectedItem(null);
    const params = new URLSearchParams(location.search);
    if (tab === NOTIFICATION_TABS.SYSTEM) {
      params.delete(NOTIFICATION_TAB_QUERY_KEY);
    } else {
      params.set(NOTIFICATION_TAB_QUERY_KEY, tab);
    }
    const search = params.toString();
    navigate(
      { pathname: location.pathname, search: search ? `?${search}` : '' },
      { replace: true }
    );
  };

  const handleTabKeyDown = (event) => {
    const index = TAB_ORDER.indexOf(activeTab);
    let nextIndex = null;
    if (event.key === 'ArrowRight') {
      nextIndex = (index + 1) % TAB_ORDER.length;
    } else if (event.key === 'ArrowLeft') {
      nextIndex = (index - 1 + TAB_ORDER.length) % TAB_ORDER.length;
    } else if (event.key === 'Home') {
      nextIndex = 0;
    } else if (event.key === 'End') {
      nextIndex = TAB_ORDER.length - 1;
    } else {
      return;
    }
    event.preventDefault();
    const next = TAB_ORDER[nextIndex];
    handleTabChange(next);
    const node = tabRefs.current[next];
    if (node && typeof node.focus === 'function') {
      node.focus();
    }
  };

  const handlePersonalNotificationClick = (notification) => {
    if (!notification.isRead) {
      void markSystemNotificationAsRead(notification.id);
    }
    const destination = resolvePersonalNotificationDestination(notification, destinationOptions);
    if (destination.path) {
      navigate(destination.path);
      return;
    }
    setSelectedItem({
      type: NOTIFICATION_TABS.PERSONAL,
      data: notification,
      unavailable: true
    });
  };

  const handleSystemNotificationClick = async(notification) => {
    try {
      const response = await apiGet(`/api/v1/system-notifications/${notification.id}`);
      setSelectedItem({ type: NOTIFICATION_TABS.SYSTEM, data: response || notification });
    } catch (error) {
      setSelectedItem({ type: NOTIFICATION_TABS.SYSTEM, data: notification });
    }
  };

  const handleMessageClick = async(message) => {
    try {
      const response = await apiGet(`/api/v1/consultation-messages/${message.id}`);
      setSelectedItem({ type: NOTIFICATION_TABS.MESSAGES, data: response || message });
    } catch (error) {
      setSelectedItem({ type: NOTIFICATION_TABS.MESSAGES, data: message });
    }
  };

  const closeModal = async() => {
    const closed = selectedItem;
    setSelectedItem(null);
    if (!closed || closed.type === NOTIFICATION_TABS.PERSONAL) {
      return;
    }
    if (closed.type === NOTIFICATION_TABS.SYSTEM) {
      await systemList.reload({ silent: true });
      window.dispatchEvent(new Event('notification-read'));
    } else {
      await messagesList.reload({ silent: true });
      window.dispatchEvent(new Event('message-read'));
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) return '';
    const date = new Date(dateString);
    if (Number.isNaN(date.getTime())) return '';
    return date.toLocaleDateString('ko-KR', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getMessageTypeLabel = (type) => {
    const labels = {
      GENERAL: t('common:notification.unified.messageTypeGeneral'),
      FOLLOW_UP: t('common:notification.unified.messageTypeFollowUp'),
      HOMEWORK: t('common:notification.unified.messageTypeHomework'),
      REMINDER: t('common:notification.unified.messageTypeReminder'),
      URGENT: t('common:notification.unified.messageTypeUrgent')
    };
    return labels[type] || t('common:notification.unified.messageTypeGeneral');
  };

  const messageMeta = (message) => {
    const role = message.senderType === 'CONSULTANT'
      ? t('common:notification.unified.senderConsultant')
      : t('common:notification.unified.senderClient');
    const name = message.senderType === 'SYSTEM'
      ? t('common:notification.unified.senderSystem')
      : (message.senderName || t('common:notification.unified.senderUnknown'));
    return `${role} · ${name}`;
  };

  useEffect(() => {
    const openSystemId = location.state?.openSystemNotificationId;
    const openMessageId = location.state?.openConsultationMessageId;
    if (!isLoggedIn || (!openSystemId && !openMessageId)) {
      return undefined;
    }

    let cancelled = false;
    (async() => {
      try {
        if (openSystemId != null) {
          setActiveTab(NOTIFICATION_TABS.SYSTEM);
          const response = await apiGet(`/api/v1/system-notifications/${openSystemId}`);
          if (!cancelled && response) {
            setSelectedItem({ type: NOTIFICATION_TABS.SYSTEM, data: response });
          }
          if (!cancelled) {
            window.dispatchEvent(new Event('notification-read'));
          }
        } else if (openMessageId != null) {
          setActiveTab(NOTIFICATION_TABS.MESSAGES);
          const response = await apiGet(`/api/v1/consultation-messages/${openMessageId}`);
          if (!cancelled && response) {
            setSelectedItem({ type: NOTIFICATION_TABS.MESSAGES, data: response });
          }
          if (!cancelled) {
            window.dispatchEvent(new Event('message-read'));
          }
        }
      } catch (error) {
        if (!cancelled) {
          setSelectedItem(null);
        }
      } finally {
        if (!cancelled) {
          if (isClientNotificationUser(user)) {
            setActiveTab(NOTIFICATION_TABS.PERSONAL);
          }
          navigate(resolveNotificationsListPath(user), { replace: true, state: {} });
        }
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [
    isLoggedIn,
    user,
    location.state?.openSystemNotificationId,
    location.state?.openConsultationMessageId,
    navigate
  ]);

  const pageTitle = t('common:notification.unified.pageTitle');
  const subtitle = t('common:notification.unified.subtitle');
  const unreadSr = t('common:notification.unified.new_unreadSr');
  const urgentLabel = t('common:notification.unified.messageTypeUrgent');

  const tabItems = [
    {
      id: NOTIFICATION_TABS.SYSTEM,
      label: t('common:notification.unified.tabSystem'),
      testId: NOTIFICATION_PAGE_TEST_IDS.TAB_SYSTEM
    },
    {
      id: NOTIFICATION_TABS.MESSAGES,
      label: t('common:notification.unified.tabMessages'),
      testId: NOTIFICATION_PAGE_TEST_IDS.TAB_MESSAGES
    },
    {
      id: NOTIFICATION_TABS.PERSONAL,
      label: t('common:notification.unified.tabPersonal'),
      testId: PERSONAL_NOTIFICATION_TEST_IDS.TAB
    }
  ];

  const errorState = (onRetry) => (
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
            onClick={onRetry}
            preventDoubleClick={false}
          >
            {t('common:notification.unified.new_retry')}
          </MGButton>
        )}
      />
    </div>
  );

  const renderListPagination = (listState) => {
    const total = listState.totalElements;
    if (listState.items.length === 0 && (total == null || total === 0)) {
      return null;
    }
    const resolvedTotalPages = listState.totalPages != null
      ? listState.totalPages
      : Math.max(1, Math.ceil((total || 0) / CLIENT_NOTIFICATION_LIST_PAGE_SIZE));
    return (
      <nav className="unified-notifications__pagination">
        <MGPagination
          currentPage={listState.currentPage}
          totalPages={resolvedTotalPages}
          totalItems={total || listState.items.length}
          itemsPerPage={CLIENT_NOTIFICATION_LIST_PAGE_SIZE}
          onPageChange={(page) => { void listState.goToPage(page); }}
          showInfo
          showItemsPerPage={false}
          summaryLabel={buildPagedListSummaryLabel({
            t,
            total,
            page: listState.currentPage,
            pageSize: CLIENT_NOTIFICATION_LIST_PAGE_SIZE,
            totalPages: resolvedTotalPages
          })}
          variant="compact"
        />
      </nav>
    );
  };

  const renderSystemList = () => {
    if (systemList.loading) {
      return <NotificationLoadingList label={t('common:notification.unified.new_loading')} />;
    }
    if (systemList.error) {
      return errorState(() => { void systemList.reload(); });
    }
    if (systemList.items.length === 0) {
      return (
        <EmptyState
          icon={<VolumeIcon size={ICON_SIZES.XXL} aria-hidden />}
          title={t('common:notification.unified.new_systemEmptyTitle')}
        />
      );
    }
    return (
      <>
        <ul className="notif-list">
          {systemList.items.map((notification) => {
            const when = notification.publishedAt || notification.createdAt;
            return (
              <NotificationListCard
                key={notification.id}
                title={toDisplayString(notification.title, '')}
                timeLabel={formatDate(when)}
                timeIso={when || ''}
                summary={toNotificationPreview(notification.content)}
                badge={notification.isUrgent ? <NotificationUrgentBadge label={urgentLabel} /> : null}
                unread={notification.isRead === false}
                unreadSr={unreadSr}
                icon={VolumeIcon}
                showChevron
                onClick={() => { void handleSystemNotificationClick(notification); }}
              />
            );
          })}
        </ul>
        {renderListPagination(systemList)}
      </>
    );
  };

  const renderMessageList = () => {
    if (messagesList.loading) {
      return <NotificationLoadingList label={t('common:notification.unified.new_loading')} />;
    }
    if (messagesList.error) {
      return errorState(() => { void messagesList.reload(); });
    }
    if (messagesList.items.length === 0) {
      return (
        <EmptyState
          icon={<MessageIcon size={ICON_SIZES.XXL} aria-hidden />}
          title={t('common:notification.unified.new_messagesEmptyTitle')}
        />
      );
    }
    return (
      <>
        <ul className="notif-list">
          {messagesList.items.map((message) => {
            const when = message.createdAt;
            return (
              <NotificationListCard
                key={message.id}
                title={toDisplayString(message.title, '')}
                timeLabel={formatDate(when)}
                timeIso={when || ''}
                summary={toNotificationPreview(message.content)}
                meta={messageMeta(message)}
                badge={message.isUrgent ? <NotificationUrgentBadge label={urgentLabel} /> : null}
                unread={message.isRead === false}
                unreadSr={unreadSr}
                icon={MessageIcon}
                showChevron
                onClick={() => { void handleMessageClick(message); }}
              />
            );
          })}
        </ul>
        {renderListPagination(messagesList)}
      </>
    );
  };

  const personalMeta = selectedItem && selectedItem.type === NOTIFICATION_TABS.PERSONAL
    ? resolvePersonalNotificationDestination(selectedItem.data, destinationOptions).meta
    : null;
  const personalPresentation = personalMeta
    ? PERSONAL_NOTIFICATION_PRESENTATION[personalMeta.kind]
    : null;

  const personalFields = [];
  if (selectedItem && selectedItem.type === NOTIFICATION_TABS.PERSONAL && personalMeta) {
    const orderNumber = formatPersonalOrderNumber(personalMeta.mappingId);
    if (orderNumber) {
      personalFields.push({
        label: t('common:notification.unified.personal.field.orderNumber'),
        value: orderNumber
      });
    }
    if (personalMeta.productName) {
      personalFields.push({
        label: t('common:notification.unified.personal.field.product'),
        value: formatNotificationSummaryText(personalMeta.productName)
      });
    }
    if (personalMeta.amount != null) {
      personalFields.push({
        label: t('common:notification.unified.personal.field.amount'),
        value: t('common:notification.unified.personal.field.amountValue', {
          amount: new Intl.NumberFormat('ko-KR').format(personalMeta.amount)
        })
      });
    }
    const whenRaw = selectedItem.data.publishedAt || selectedItem.data.createdAt;
    const whenLabel = formatDate(whenRaw);
    if (whenLabel) {
      const whenFieldKey = personalMeta.kind === 'PAYMENT_CONFIRMED'
        || personalMeta.kind === 'DEPOSIT_CONFIRMED'
        ? 'common:notification.unified.personal.field.completedAt'
        : 'common:notification.unified.personal.field.occurredAt';
      personalFields.push({
        label: t(whenFieldKey),
        value: whenLabel
      });
    }
  }

  const messageDetailFields = [];
  if (selectedItem && selectedItem.type === NOTIFICATION_TABS.MESSAGES) {
    const senderName = toDisplayString(selectedItem.data.senderName, '');
    if (senderName) {
      messageDetailFields.push({
        label: t('common:notification.unified.messageFieldSender'),
        value: senderName
      });
    }
    const consultation = parseMessageConsultationFields(selectedItem.data);
    if (consultation.relatedConsultation) {
      messageDetailFields.push({
        label: t('common:notification.unified.messageFieldRelatedConsultation'),
        value: consultation.relatedConsultation
      });
    }
    if (consultation.remainingSessions) {
      messageDetailFields.push({
        label: t('common:notification.unified.messageFieldRemainingSessions'),
        value: consultation.remainingSessions
      });
    }
  }

  const personalBodyText = personalPresentation
    ? t(personalPresentation.summaryKey)
    : formatNotificationSummaryText(
      toDisplayString(selectedItem?.data?.content, '')
    );

  const modalDestination = selectedItem && selectedItem.destinationPath && selectedItem.destinationLabel
    ? { path: selectedItem.destinationPath, label: selectedItem.destinationLabel }
    : null;

  const handleModalDestination = (path) => {
    setSelectedItem(null);
    navigate(path);
  };

  const pageBody = !isLoggedIn ? (
    <p className="unified-notifications__login" role="status" data-testid={NOTIFICATION_PAGE_TEST_IDS.LOGIN}>
      {t('common:notification.unified.loginRequired')}
    </p>
  ) : (
    <>
      <div
        className="mg-tab-chip-row unified-notifications__tabs"
        role="tablist"
        aria-label={t('common:notification.unified.new_tabListLabel')}
      >
        {tabItems.map((item) => {
          const selected = activeTab === item.id;
          return (
            <button
              key={item.id}
              type="button"
              role="tab"
              id={`notifications-tab-${item.id}`}
              className="unified-notifications__tab"
              aria-selected={selected}
              tabIndex={selected ? 0 : -1}
              data-gnb-chrome-free="true"
              data-testid={item.testId}
              ref={(node) => { tabRefs.current[item.id] = node; }}
              onClick={() => handleTabChange(item.id)}
              onKeyDown={handleTabKeyDown}
            >
              {item.label}
            </button>
          );
        })}
      </div>

      {activeTab === NOTIFICATION_TABS.SYSTEM ? renderSystemList() : null}
      {activeTab === NOTIFICATION_TABS.MESSAGES ? renderMessageList() : null}
      {activeTab === NOTIFICATION_TABS.PERSONAL ? (
        <PersonalNotificationsTab
          enabled={Boolean(isLoggedIn && user?.id)}
          resetKey={user?.id}
          formatDate={formatDate}
          onSelect={handlePersonalNotificationClick}
          destinationOptions={destinationOptions}
        />
      ) : null}

      {selectedItem ? (
        <UnifiedModal
          isOpen
          onClose={closeModal}
          className="unified-notifications-modal"
          closeChromeFree
          closeContent={<CloseIcon size={ICON_SIZES.XL} aria-hidden />}
          title={personalPresentation
            ? t(personalPresentation.titleKey)
            : toDisplayString(selectedItem.data.title, '')}
          subtitle={modalSubtitle(selectedItem, formatDate, t)}
          size="medium"
          data-testid={selectedItem.unavailable ? NOTIFICATION_PAGE_TEST_IDS.UNAVAILABLE : undefined}
          actions={(
            <ActionBar align="end" gap="md" className="unified-notifications-modal__actions">
              {modalDestination ? (
                <>
                  <ActionBarButton
                    variant="outline"
                    onClick={closeModal}
                    data-gnb-chrome-free="true"
                  >
                    {t('common.actions.close')}
                  </ActionBarButton>
                  <ActionBarButton
                    variant="primary"
                    onClick={() => handleModalDestination(modalDestination.path)}
                    data-gnb-chrome-free="true"
                  >
                    {modalDestination.label}
                  </ActionBarButton>
                </>
              ) : (
                <ActionBarButton
                  variant="primary"
                  onClick={closeModal}
                  data-gnb-chrome-free="true"
                >
                  {t('common.actions.confirm')}
                </ActionBarButton>
              )}
            </ActionBar>
          )}
        >
          {selectedItem.type === NOTIFICATION_TABS.PERSONAL ? (
            <>
              <p className="unified-notifications__content-text">
                <SafeText>{personalBodyText}</SafeText>
              </p>
              {personalFields.length > 0 ? (
                <dl className="unified-notifications__modal-fields">
                  {personalFields.map((field) => (
                    <React.Fragment key={field.label}>
                      <dt>{field.label}</dt>
                      <dd><SafeText>{field.value}</SafeText></dd>
                    </React.Fragment>
                  ))}
                </dl>
              ) : null}
              <div className="unified-notifications__notice">
                <span className="unified-notifications__notice-icon" aria-hidden="true">
                  <InfoIcon size={ICON_SIZES.XL} />
                </span>
                <div>
                  <p className="unified-notifications__notice-title">
                    {t('common:notification.unified.new_targetUnavailableTitle')}
                  </p>
                  <p className="unified-notifications__notice-desc">
                    {t('common:notification.unified.new_targetUnavailableDesc')}
                  </p>
                </div>
              </div>
            </>
          ) : (
            <>
              <div className="unified-notifications-modal__badges">
                {selectedItem.data.isUrgent ? (
                  <NotificationUrgentBadge label={urgentLabel} />
                ) : null}
                {selectedItem.data.isImportant ? (
                  <span className="mg-badge mg-badge-warning">
                    {t('common:notification.unified.important')}
                  </span>
                ) : null}
                {selectedItem.type === NOTIFICATION_TABS.SYSTEM ? (
                  <span className="mg-badge mg-badge-secondary">
                    {selectedItem.data.targetType === 'ALL'
                      ? t('common:notification.unified.targetAll')
                      : selectedItem.data.targetType === 'CONSULTANT'
                        ? t('common:notification.unified.targetConsultant')
                        : t('common:notification.unified.targetClient')}
                  </span>
                ) : null}
                {selectedItem.type === NOTIFICATION_TABS.MESSAGES ? (
                  <span className="mg-badge mg-badge-message-type" data-type={selectedItem.data.messageType}>
                    {getMessageTypeLabel(selectedItem.data.messageType)}
                  </span>
                ) : null}
              </div>
              <div
                className="notification-content unified-notifications__content-text"
                dangerouslySetInnerHTML={{
                  __html: sanitizeRichNoticeHtml(
                    formatNotificationSummaryText(selectedItem.data.content || '')
                  )
                }}
              />
              {messageDetailFields.length > 0 ? (
                <dl className="unified-notifications__modal-fields">
                  {messageDetailFields.map((field) => (
                    <React.Fragment key={field.label}>
                      <dt>{field.label}</dt>
                      <dd><SafeText>{field.value}</SafeText></dd>
                    </React.Fragment>
                  ))}
                </dl>
              ) : null}
            </>
          )}
        </UnifiedModal>
      ) : null}
    </>
  );

  const framed = <div className="unified-notifications">{pageBody}</div>;

  if (clientShell) {
    return (
      <ClientWebPageShell
        className="unified-notifications-shell"
        title={pageTitle}
        titleId={UNIFIED_NOTIFICATIONS_TITLE_ID}
        meta={(
          <p className="unified-notifications__subtitle">
            <SafeText>{subtitle}</SafeText>
          </p>
        )}
      >
        {framed}
      </ClientWebPageShell>
    );
  }

  return (
    <AdminCommonLayout title={pageTitle}>
      <ContentArea ariaLabel={t('common:notification.unified.regionLabel')}>
        <ContentHeader
          title={pageTitle}
          subtitle={subtitle}
          titleId={UNIFIED_NOTIFICATIONS_TITLE_ID}
        />
        {framed}
      </ContentArea>
    </AdminCommonLayout>
  );
};

export default UnifiedNotifications;
