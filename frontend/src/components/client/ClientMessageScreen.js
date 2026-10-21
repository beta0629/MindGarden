import React, { useState, useEffect, useCallback } from 'react';
import { useClientSessionReady } from '../../hooks/useClientSessionReady';
import { usePagedList } from '../../hooks/usePagedList';
import { useToast } from '../../contexts/ToastContext';
import StandardizedApi from '../../utils/standardizedApi';
import UnifiedLoading from '../../components/common/UnifiedLoading';
import notificationManager from '../../utils/notification';
import ClientWebPageShell from './ClientWebPageShell';
import UnifiedModal from '../common/modals/UnifiedModal';
import ActionBar from '../common/ActionBar';
import ActionBarButton from '../common/ActionBarButton';
import EmptyState from '../common/EmptyState';
import MGPagination from '../common/MGPagination';
import MGButton from '../common/MGButton';
import { buildErpMgButtonClassName, ERP_MG_BUTTON_LOADING_TEXT } from '../erp/common/erpMgButtonProps';
import SafeText from '../common/SafeText';
import NotificationListCard, {
  NotificationSectionLabel,
  NotificationUrgentBadge,
  toNotificationPreview
} from '../notifications/NotificationListCard';
import { ICONS, ICON_SIZES } from '../../constants/icons';
import { toDisplayString } from '../../utils/safeDisplay';
import { formatNotificationSummaryText } from '../../utils/displayId';
import { parseMessageConsultationFields } from '../../utils/messageConsultationFields';
import { buildPagedListSummaryLabel } from '../../utils/pagedListSummary';
import {
  CLIENT_NOTIFICATION_LIST_PAGE_SIZE,
  PAGED_LIST_MODE
} from '../../constants/pagedList';
import { CLIENT_WEB_SUITE_COPY } from '../../constants/clientWebSuiteConstants';
import '../../styles/unified-design-tokens.css';
import '../../styles/themes/client-theme.css';
import '../notifications/UnifiedNotifications.css';
import './ClientMessageScreen.css';
import { useTranslation } from 'react-i18next';

const CLIENT_MESSAGE_TITLE_ID = 'client-message-screen-title';
const REPLY_MAX_LENGTH = 500;
const MessageIcon = ICONS.MESSAGE_CIRCLE;
const CloseIcon = ICONS.X;
const AlertIcon = ICONS.ALERT_CIRCLE;

const MESSAGE_FILTER = {
  ALL: 'all',
  UNREAD: 'unread',
  IMPORTANT: 'important'
};
const MESSAGE_FILTER_ORDER = [MESSAGE_FILTER.ALL, MESSAGE_FILTER.UNREAD, MESSAGE_FILTER.IMPORTANT];

const MESSAGE_COPY = {
  TAB_LIST_LABEL: '메시지 보기 방식',
  TAB_ALL: '전체',
  TAB_UNREAD: '안 읽음',
  TAB_IMPORTANT: '중요',
  SECTION_UNREAD: (count) => `안 읽은 메시지 ${count}건`,
  SECTION_READ: '읽은 메시지',
  UNREAD_SR: '읽지 않은 메시지',
  EMPTY_TITLE: '받은 메시지가 없어요',
  EMPTY_DESC: '상담 선생님이 메시지를 보내면 여기에 보여요.',
  EMPTY_FILTERED_TITLE: '해당하는 메시지가 없어요',
  MODAL_SUBTITLE_LABEL: '상담사 메시지',
  REPLY_LABEL: '답장하기',
  REPLY_PLACEHOLDER: '선생님께 보낼 답장을 적어 주세요.',
  REPLY_SEND: '답장 전송',
  REPLY_COUNT: (length) => `${length} / ${REPLY_MAX_LENGTH}자`
};

const FILTER_PREDICATES = {
  [MESSAGE_FILTER.ALL]: () => true,
  [MESSAGE_FILTER.UNREAD]: (message) => !message.isRead,
  [MESSAGE_FILTER.IMPORTANT]: (message) => Boolean(message.isImportant || message.isUrgent)
};

/**
 * 내담자 메시지 확인 화면
 * 상담사로부터 받은 메시지를 확인하고 답장할 수 있는 화면
 */
const ClientMessageScreen = () => {
  const { t } = useTranslation();
  const { showToast } = useToast();
  const { ready, userId, userRef } = useClientSessionReady();

  const [selectedMessage, setSelectedMessage] = useState(null);
  const [replying, setReplying] = useState(false);
  const [replyContent, setReplyContent] = useState('');
  const [filter, setFilter] = useState(MESSAGE_FILTER.ALL);

  const handleCloseMessageModal = useCallback(() => {
    setSelectedMessage(null);
    setReplyContent('');
  }, []);

  const fetchMessagePage = useCallback((page, size) => StandardizedApi.get(
    `/api/v1/consultation-messages/client/${userRef.current?.id}`,
    { page, size, sort: 'createdAt,desc' }
  ), [userRef]);

  const {
    items: messages,
    setItems: setMessages,
    totalElements,
    totalPages,
    currentPage,
    loading,
    error: messagesError,
    goToPage,
    reload: reloadMessages
  } = usePagedList({
    fetchPage: fetchMessagePage,
    pageSize: CLIENT_NOTIFICATION_LIST_PAGE_SIZE,
    mode: PAGED_LIST_MODE.REPLACE,
    enabled: ready,
    resetKey: userId
  });

  useEffect(() => {
    if (!messagesError) {
      return;
    }
    console.error('메시지 로드 오류:', messagesError);
    // 목록 API 실패 시에만 AppToast(.app-toast) — EmptyState 와 함께 보여 성공 빈 목록과 구분한다.
    showToast({
      message: t('common:notification.unified.new_errorToast'),
      type: 'error'
    });
  }, [messagesError, showToast, t]);

  const handleMessageClick = async(message) => {
    setReplyContent('');
    setSelectedMessage(message);

    if (!message.isRead) {
      try {
        await StandardizedApi.put(`/api/v1/consultation-messages/${message.id}/read`, {});
        setMessages(prev => prev.map(m =>
          m.id === message.id ? { ...m, isRead: true, readAt: new Date().toISOString() } : m
        ));
      } catch (error) {
        console.error('읽음 처리 오류:', error);
      }
    }
  };

  const handleReply = async() => {
    if (!replyContent.trim()) {
      notificationManager.show('답장 내용을 입력해주세요.', 'warning');
      return;
    }

    if (!selectedMessage) {
      return;
    }

    try {
      setReplying(true);

      const replyData = {
        title: `Re: ${toDisplayString(selectedMessage.title, '')}`,
        content: replyContent,
        messageType: 'GENERAL',
        isImportant: false,
        isUrgent: false
      };

      const response = await StandardizedApi.post(
        `/api/v1/consultation-messages/${selectedMessage.id}/reply`,
        replyData
      );

      // post unwrap → null/success===false 만 실패
      if (response != null && response.success !== false) {
        notificationManager.show('답장이 전송되었습니다.', 'success');
        handleCloseMessageModal();
        await reloadMessages({ silent: true });
      } else {
        throw new Error(response?.message || '답장 전송에 실패했습니다.');
      }
    } catch (error) {
      console.error('답장 전송 오류:', error);
      notificationManager.show('답장 전송 중 오류가 발생했습니다.', 'error');
    } finally {
      setReplying(false);
    }
  };

  const getMessageTypeLabel = (messageType) => {
    const labels = {
      GENERAL: '일반',
      FOLLOW_UP: '후속 조치',
      HOMEWORK: '과제 안내',
      REMINDER: '알림',
      URGENT: '긴급'
    };
    return labels[messageType] || '일반';
  };

  const formatDate = (dateInput) => {
    const raw =
      typeof dateInput === 'string' || typeof dateInput === 'number'
        ? dateInput
        : toDisplayString(dateInput, '');
    if (raw === '' || raw === '—') {
      return '';
    }
    const date = new Date(raw);
    if (Number.isNaN(date.getTime())) {
      return '';
    }
    return date.toLocaleDateString('ko-KR', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const messageSource = (message) => {
    const consultantLabel = t('common.labels.consultant');
    const senderName = toDisplayString(message.senderName, '');
    return senderName ? `${consultantLabel} · ${senderName}` : consultantLabel;
  };

  const visibleMessages = messages.filter(FILTER_PREDICATES[filter]);
  const unreadMessages = visibleMessages.filter((message) => !message.isRead);
  const readMessages = visibleMessages.filter((message) => message.isRead);

  const filterLabels = {
    [MESSAGE_FILTER.ALL]: MESSAGE_COPY.TAB_ALL,
    [MESSAGE_FILTER.UNREAD]: MESSAGE_COPY.TAB_UNREAD,
    [MESSAGE_FILTER.IMPORTANT]: MESSAGE_COPY.TAB_IMPORTANT
  };

  const pageShell = (body) => (
    <ClientWebPageShell
      className="unified-notifications-shell"
      title={CLIENT_WEB_SUITE_COPY.MESSAGES_TITLE}
      titleId={CLIENT_MESSAGE_TITLE_ID}
      meta={(
        <p className="unified-notifications__subtitle">
          {CLIENT_WEB_SUITE_COPY.MESSAGES_SUBTITLE}
        </p>
      )}
    >
      <div className="unified-notifications" data-testid="client-messages-page">
        <main aria-labelledby={CLIENT_MESSAGE_TITLE_ID}>
          {body}
        </main>
      </div>
    </ClientWebPageShell>
  );

  const renderMessageCard = (message) => (
    <NotificationListCard
      key={message.id}
      testId="client-messages-message-item"
      title={toDisplayString(message.title, '')}
      timeLabel={formatDate(message.sentAt || message.createdAt)}
      timeIso={toDisplayString(message.sentAt || message.createdAt, '')}
      summary={toNotificationPreview(message.content)}
      meta={messageSource(message)}
      badge={message.isUrgent ? <NotificationUrgentBadge label={t('admin.labels.urgent')} /> : null}
      unread={!message.isRead}
      unreadSr={MESSAGE_COPY.UNREAD_SR}
      icon={MessageIcon}
      showChevron
      onClick={() => { void handleMessageClick(message); }}
    />
  );

  const renderMessageSection = (label, items) => (items.length > 0 ? (
    <>
      <NotificationSectionLabel>{label}</NotificationSectionLabel>
      <ul className="notif-list">
        {items.map(renderMessageCard)}
      </ul>
    </>
  ) : null);

  const renderMessageModalActions = () => (
    <ActionBar align="end" gap="md" className="unified-notifications-modal__actions">
      <ActionBarButton
        variant="outline"
        onClick={handleCloseMessageModal}
        disabled={replying}
        data-gnb-chrome-free="true"
      >
        {t('common.actions.close')}
      </ActionBarButton>
      <ActionBarButton
        variant="primary"
        onClick={handleReply}
        disabled={!replyContent.trim()}
        loading={replying}
        data-testid="client-message-reply-submit"
        data-gnb-chrome-free="true"
      >
        {MESSAGE_COPY.REPLY_SEND}
      </ActionBarButton>
    </ActionBar>
  );

  if (loading) {
    return pageShell(
      <div
        className="client-message-screen-loading"
        aria-busy="true"
        aria-live="polite"
      >
        <UnifiedLoading type="inline" text={CLIENT_WEB_SUITE_COPY.MESSAGES_LOADING} />
      </div>
    );
  }

  if (messagesError) {
    return pageShell(
      <div role="alert" data-testid="client-messages-error">
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
              onClick={() => { void reloadMessages(); }}
              preventDoubleClick={false}
            >
              {t('common:notification.unified.new_retry')}
            </MGButton>
          )}
        />
      </div>
    );
  }

  const selectedSenderName = selectedMessage ? toDisplayString(selectedMessage.senderName, '') : '';
  const consultationFields = selectedMessage
    ? parseMessageConsultationFields(selectedMessage)
    : { relatedConsultation: '', remainingSessions: '' };
  const modalSubtitle = selectedMessage
    ? [MESSAGE_COPY.MODAL_SUBTITLE_LABEL, formatDate(selectedMessage.sentAt || selectedMessage.createdAt)]
      .filter(Boolean)
      .join(' · ')
    : '';
  const showModalFields = Boolean(
    selectedSenderName
    || consultationFields.relatedConsultation
    || consultationFields.remainingSessions
    || (selectedMessage && selectedMessage.isRead && formatDate(selectedMessage.readAt))
  );
  const paginationSummary = buildPagedListSummaryLabel({
    t,
    total: totalElements,
    page: currentPage,
    pageSize: CLIENT_NOTIFICATION_LIST_PAGE_SIZE,
    totalPages
  });
  const resolvedTotalPages = totalPages != null
    ? totalPages
    : Math.max(1, Math.ceil((totalElements || 0) / CLIENT_NOTIFICATION_LIST_PAGE_SIZE));

  return pageShell(
    <>
      <div
        className="mg-tab-chip-row unified-notifications__tabs"
        role="tablist"
        aria-label={MESSAGE_COPY.TAB_LIST_LABEL}
      >
        {MESSAGE_FILTER_ORDER.map((id) => (
          <button
            key={id}
            type="button"
            role="tab"
            className="unified-notifications__tab"
            aria-selected={filter === id}
            data-gnb-chrome-free="true"
            onClick={() => setFilter(id)}
          >
            {filterLabels[id]}
          </button>
        ))}
      </div>

      {messages.length === 0 ? (
        <EmptyState
          icon={<MessageIcon size={ICON_SIZES.XXL} aria-hidden />}
          title={MESSAGE_COPY.EMPTY_TITLE}
          description={MESSAGE_COPY.EMPTY_DESC}
        />
      ) : null}
      {messages.length > 0 && visibleMessages.length === 0 ? (
        <EmptyState
          icon={<MessageIcon size={ICON_SIZES.XXL} aria-hidden />}
          title={MESSAGE_COPY.EMPTY_FILTERED_TITLE}
        />
      ) : null}
      {visibleMessages.length > 0 ? (
        <div data-testid="client-messages-message-list">
          {renderMessageSection(MESSAGE_COPY.SECTION_UNREAD(unreadMessages.length), unreadMessages)}
          {renderMessageSection(MESSAGE_COPY.SECTION_READ, readMessages)}
        </div>
      ) : null}
      {messages.length > 0 && (totalElements == null || totalElements > 0) ? (
        <nav className="unified-notifications__pagination" aria-label={t('common:pagination.pageOf', {
          current: currentPage,
          total: resolvedTotalPages
        })}
        >
          <MGPagination
            currentPage={currentPage}
            totalPages={resolvedTotalPages}
            totalItems={totalElements || messages.length}
            itemsPerPage={CLIENT_NOTIFICATION_LIST_PAGE_SIZE}
            onPageChange={(page) => { void goToPage(page); }}
            showInfo
            showItemsPerPage={false}
            summaryLabel={paginationSummary}
            variant="compact"
          />
        </nav>
      ) : null}

      <UnifiedModal
        isOpen={Boolean(selectedMessage)}
        onClose={handleCloseMessageModal}
        title={selectedMessage ? toDisplayString(selectedMessage.title, '') : ''}
        subtitle={modalSubtitle}
        size="medium"
        backdropClick={!replying}
        closeChromeFree
        closeContent={<CloseIcon size={ICON_SIZES.XL} aria-hidden />}
        closeButtonDataTestId="client-message-detail-close"
        loading={replying}
        className="unified-notifications-modal"
        actions={renderMessageModalActions()}
        data-testid="client-message-detail-modal"
      >
        {selectedMessage && (
          <>
            <div className="unified-notifications-modal__badges">
              {selectedMessage.isUrgent ? (
                <NotificationUrgentBadge label={t('admin.labels.urgent')} />
              ) : null}
              <span className="mg-badge mg-badge-message-type" data-type={selectedMessage.messageType}>
                {getMessageTypeLabel(selectedMessage.messageType)}
              </span>
            </div>
            <SafeText tag="p" className="unified-notifications__content-text">
              {formatNotificationSummaryText(selectedMessage.content)}
            </SafeText>
            {showModalFields ? (
              <dl className="unified-notifications__modal-fields">
                {selectedSenderName ? (
                  <>
                    <dt>{t('common:notification.unified.messageFieldSender')}</dt>
                    <dd><SafeText>{selectedSenderName}</SafeText></dd>
                  </>
                ) : null}
                {consultationFields.relatedConsultation ? (
                  <>
                    <dt>{t('common:notification.unified.messageFieldRelatedConsultation')}</dt>
                    <dd><SafeText>{consultationFields.relatedConsultation}</SafeText></dd>
                  </>
                ) : null}
                {consultationFields.remainingSessions ? (
                  <>
                    <dt>{t('common:notification.unified.messageFieldRemainingSessions')}</dt>
                    <dd><SafeText>{consultationFields.remainingSessions}</SafeText></dd>
                  </>
                ) : null}
                {selectedMessage.isRead && formatDate(selectedMessage.readAt) ? (
                  <>
                    <dt>{t('common:notification.unified.messageFieldReadAt')}</dt>
                    <dd>{formatDate(selectedMessage.readAt)}</dd>
                  </>
                ) : null}
              </dl>
            ) : null}
            <div className="client-message-screen-reply-section">
              <label className="unified-notifications-modal__reply-label" htmlFor="client-message-reply">
                {MESSAGE_COPY.REPLY_LABEL}
              </label>
              <textarea
                id="client-message-reply"
                className="unified-notifications-modal__reply-textarea"
                data-testid="client-message-reply-textarea"
                value={replyContent}
                maxLength={REPLY_MAX_LENGTH}
                onChange={(e) => setReplyContent(e.target.value)}
                placeholder={MESSAGE_COPY.REPLY_PLACEHOLDER}
                disabled={replying}
              />
              <p className="unified-notifications-modal__reply-hint">
                {MESSAGE_COPY.REPLY_COUNT(replyContent.length)}
              </p>
            </div>
          </>
        )}
      </UnifiedModal>
    </>
  );
};

export default ClientMessageScreen;
