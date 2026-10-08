import React, { useState, useEffect, useCallback } from 'react';
import UnifiedLoading from '../../components/common/UnifiedLoading';
import UnifiedModal from '../common/modals/UnifiedModal';
import CustomSelect from '../common/CustomSelect';
import BadgeSelect from '../common/BadgeSelect';
import { useSession } from '../../contexts/SessionContext';
import { useNotification } from '../../contexts/NotificationContext';
import { apiPost } from '../../utils/ajax';
import notificationManager from '../../utils/notification';
import AdminCommonLayout from '../layout/AdminCommonLayout';
import { buildErpMgButtonClassName, ERP_MG_BUTTON_LOADING_TEXT } from '../erp/common/erpMgButtonProps';
import MGButton from '../common/MGButton';
import MGPagination from '../common/MGPagination';
import EmptyState from '../common/EmptyState';
import SafeText from '../common/SafeText';
import { MessageSquare, Plus } from 'lucide-react';
import ConsultantSuitePage from './suite/ConsultantSuitePage';
import ConsultantSearchField from './suite/ConsultantSearchField';
import ConsultantFilterChips from './suite/ConsultantFilterChips';
import ConsultantSuiteButton from './suite/ConsultantSuiteButton';
import ConsultantSuiteCard, {
  CONSULTANT_SUITE_CARD_VARIANT,
  ConsultantSuitePill
} from './suite/ConsultantSuiteCard';
import {
  CONSULTANT_MESSAGE_TYPE_FILTER,
  CONSULTANT_SUITE_BUTTON_VARIANT,
  CONSULTANT_SUITE_CLASS,
  CONSULTANT_SUITE_NS,
  CONSULTANT_SUITE_PAGE_SIZE,
  CONSULTANT_SUITE_TEST_ID,
  resolveConsultantMessageType
} from '../../constants/consultantSuite';
import {
  fetchConsultantSuitePagedList,
  toServerPageIndex
} from '../../utils/consultantSuiteListApi';
import StandardizedApi from '../../utils/standardizedApi';
import { API_ENDPOINTS } from '../../constants/apiEndpoints';
import './ConsultantMessages.css';
import { USER_ROLES } from '../../constants/roles';
import { useTranslation } from 'react-i18next';

const API_CONSULTATION_MESSAGES = '/api/v1/consultation-messages';
const CONSULTANT_MESSAGES_TITLE_ID = 'consultant-messages-title';
const CONSULTANT_MESSAGES_SEARCH_ID = 'consultant-messages-search';
const ACTION_ICON_SIZE = 16;
const EMPTY_ICON_SIZE = 40;
const MESSAGE_PREVIEW_MAX = 100;
const MESSAGE_TYPE_FILTER_ORDER = Object.values(CONSULTANT_MESSAGE_TYPE_FILTER);
const MESSAGES_ITEM_KEYS = Object.freeze(['messages', 'content', 'items', 'data']);

const MESSAGE_COUNTERPARTY_COPY = {
  SOURCE_REMINDER_OR_SYSTEM: '출처: 리마인더·알림',
  SENDER_PREFIX: '보낸 사람:',
  RECIPIENT_PREFIX: '받는 사람:',
  RELATED_PREFIX: '관련:',
  NO_SPECIFIC_COUNTERPARTY: '특정 상대 없음 (알림·일괄)'
};

/**
 * @param {object} message
 * @returns {string}
 */
function getMessageCounterpartyLine(message) {
  const messageType = resolveConsultantMessageType(message?.messageType);
  const senderType = (message?.senderType && String(message.senderType).trim().toUpperCase()) || '';
  const clientName = (message?.clientName && String(message.clientName).trim()) || '';

  if (messageType === CONSULTANT_MESSAGE_TYPE_FILTER.REMINDER || senderType === 'SYSTEM') {
    return MESSAGE_COUNTERPARTY_COPY.SOURCE_REMINDER_OR_SYSTEM;
  }
  if (senderType === USER_ROLES.CLIENT && clientName) {
    return `${MESSAGE_COUNTERPARTY_COPY.SENDER_PREFIX} ${clientName}`;
  }
  if (senderType === USER_ROLES.CONSULTANT && clientName) {
    return `${MESSAGE_COUNTERPARTY_COPY.RECIPIENT_PREFIX} ${clientName}`;
  }
  if (clientName) {
    return `${MESSAGE_COUNTERPARTY_COPY.RELATED_PREFIX} ${clientName}`;
  }
  return MESSAGE_COUNTERPARTY_COPY.NO_SPECIFIC_COUNTERPARTY;
}

const ConsultantMessages = () => {
  const { t } = useTranslation();
  const { t: tSuite } = useTranslation(CONSULTANT_SUITE_NS);
  const { user, isLoggedIn, isLoading: sessionLoading } = useSession();
  const { markMessageAsRead } = useNotification();

  const [loading, setLoading] = useState(true);
  const [messages, setMessages] = useState([]);
  const [totalElements, setTotalElements] = useState(0);
  const [page, setPage] = useState(1);
  const [clients, setClients] = useState([]);
  const [showSendModal, setShowSendModal] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState(CONSULTANT_MESSAGE_TYPE_FILTER.ALL);

  const [newMessage, setNewMessage] = useState({
    clientId: '',
    title: '',
    content: '',
    messageType: CONSULTANT_MESSAGE_TYPE_FILTER.GENERAL,
    isImportant: false,
    isUrgent: false
  });

  const messageTypeOptions = MESSAGE_TYPE_FILTER_ORDER
    .filter((key) => key !== CONSULTANT_MESSAGE_TYPE_FILTER.ALL)
    .map((key) => ({
      value: key,
      label: tSuite(`messages.type.${key}`)
    }));

  const loadMessages = useCallback(async() => {
    if (!user?.id) {
      return;
    }
    try {
      setLoading(true);
      const result = await fetchConsultantSuitePagedList(
        `${API_CONSULTATION_MESSAGES}/consultant/${user.id}`,
        {},
        {
          page: toServerPageIndex(page),
          size: CONSULTANT_SUITE_PAGE_SIZE,
          itemKeys: MESSAGES_ITEM_KEYS
        }
      );
      setMessages(result.items || []);
      setTotalElements(result.totalElements != null ? result.totalElements : (result.items || []).length);
    } catch (err) {
      console.error('메시지 로드 중 오류:', err);
      notificationManager.show('메시지를 불러오는 중 오류가 발생했습니다.', 'error');
      setMessages([]);
      setTotalElements(0);
    } finally {
      setLoading(false);
    }
  }, [user?.id, page]);

  const loadClients = useCallback(async() => {
    if (!user?.id) {
      return;
    }
    try {
      // 수신자: 담당 내담자 전체 목록(ASSIGNED_CLIENTS). page0 size20 캡 금지.
      const res = await StandardizedApi.get(
        API_ENDPOINTS.CONSULTANT_RECORDS.ASSIGNED_CLIENTS(user.id)
      );
      const arr = Array.isArray(res) ? res : (res?.data ?? []);
      const list = (Array.isArray(arr) ? arr : [])
        .map((c) => (c && typeof c === 'object' ? {
          id: c.id,
          name: c.name ?? c.userName,
          email: c.email
        } : null))
        .filter((c) => c && c.id != null);
      setClients(list);
    } catch (err) {
      console.error('내담자 목록 로드 오류:', err);
      setClients([]);
    }
  }, [user?.id]);

  useEffect(() => {
    if (isLoggedIn && user?.id) {
      loadMessages();
      loadClients();
    }
  }, [isLoggedIn, user?.id, loadMessages, loadClients]);

  useEffect(() => {
    setPage(1);
  }, [filterStatus, searchTerm]);

  const filteredMessages = messages.filter((message) => {
    const typeKey = resolveConsultantMessageType(message.messageType);
    const matchesSearch = !searchTerm
      || message.title?.toLowerCase().includes(searchTerm.toLowerCase())
      || message.content?.toLowerCase().includes(searchTerm.toLowerCase())
      || message.clientName?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = filterStatus === CONSULTANT_MESSAGE_TYPE_FILTER.ALL
      || typeKey === filterStatus;
    return matchesSearch && matchesStatus;
  });

  const totalPages = Math.max(1, Math.ceil((totalElements || 0) / CONSULTANT_SUITE_PAGE_SIZE));

  const handleSendMessage = async() => {
    try {
      if (!newMessage.clientId || !newMessage.title || !newMessage.content) {
        notificationManager.show('모든 필드를 입력해주세요.', 'warning');
        return;
      }

      const response = await apiPost(API_CONSULTATION_MESSAGES, {
        ...newMessage,
        consultantId: user?.id
      });

      if (response.success) {
        notificationManager.show('메시지가 전송되었습니다.', 'success');
        setShowSendModal(false);
        setNewMessage({
          clientId: '',
          title: '',
          content: '',
          messageType: CONSULTANT_MESSAGE_TYPE_FILTER.GENERAL,
          isImportant: false,
          isUrgent: false
        });
        loadMessages();
      } else {
        throw new Error(response.message || '메시지 전송에 실패했습니다.');
      }
    } catch (error) {
      console.error('메시지 전송 오류:', error);
      notificationManager.show('메시지 전송 중 오류가 발생했습니다.', 'error');
    }
  };

  const handleMessageClick = async(message) => {
    if (!message.isRead && markMessageAsRead) {
      try {
        await markMessageAsRead(message.id);
        setMessages((prev) => prev.map((msg) => (
          msg.id === message.id ? { ...msg, isRead: true } : msg
        )));
      } catch (e) {
        console.error('읽음 처리 오류:', e);
      }
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) {
      return tSuite('messages.noDate');
    }
    const date = new Date(dateString);
    return date.toLocaleDateString('ko-KR', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const typeFilterItems = MESSAGE_TYPE_FILTER_ORDER.map((key) => ({
    key,
    label: tSuite(`messages.type.${key}`)
  }));

  const openSendModal = () => setShowSendModal(true);

  const newMessageAction = (
    <ConsultantSuiteButton
      variant={CONSULTANT_SUITE_BUTTON_VARIANT.PRIMARY}
      icon={<Plus size={ACTION_ICON_SIZE} aria-hidden />}
      onClick={openSendModal}
      disabled={!isLoggedIn}
    >
      {tSuite('actions.newMessage')}
    </ConsultantSuiteButton>
  );

  const renderPage = (body) => (
    <AdminCommonLayout className="mg-v2-dashboard-layout">
      <ConsultantSuitePage
        title={tSuite('messages.title')}
        subtitle={tSuite('messages.subtitle')}
        titleId={CONSULTANT_MESSAGES_TITLE_ID}
        actions={newMessageAction}
        ariaLabel={tSuite('messages.ariaLabel')}
        testId={CONSULTANT_SUITE_TEST_ID.MESSAGES_PAGE}
      >
        {body}
      </ConsultantSuitePage>

      <UnifiedModal
        isOpen={showSendModal}
        onClose={() => setShowSendModal(false)}
        title="새 메시지 작성"
        size="auto"
        showCloseButton={true}
        backdropClick={true}
        actions={(
          <>
            <MGButton
              variant="secondary"
              className={buildErpMgButtonClassName({ variant: 'secondary', size: 'md', loading: false })}
              loadingText={ERP_MG_BUTTON_LOADING_TEXT}
              onClick={() => setShowSendModal(false)}
            >
              {t('common.actions.cancel')}
            </MGButton>
            <MGButton
              variant="primary"
              className={buildErpMgButtonClassName({ variant: 'primary', size: 'md', loading: false })}
              loadingText={ERP_MG_BUTTON_LOADING_TEXT}
              onClick={handleSendMessage}
            >
              전송
            </MGButton>
          </>
        )}
      >
        <div className="mg-v2-form-group">
          <label className="mg-v2-label">받는 사람 *</label>
          <CustomSelect
            className="mg-v2-select"
            value={newMessage.clientId ?? ''}
            onChange={(val) => setNewMessage({ ...newMessage, clientId: val })}
            options={[
              { value: '', label: '내담자를 선택하세요' },
              ...clients.map((client) => ({
                value: client.id,
                label: `${client.name} (${client.email})`
              }))
            ]}
            placeholder="내담자를 선택하세요"
          />
        </div>
        <div className="mg-v2-form-group">
          <label className="mg-v2-label">메시지 유형</label>
          <BadgeSelect
            className="mg-v2-form-badge-select"
            value={newMessage.messageType}
            onChange={(val) => setNewMessage({ ...newMessage, messageType: val })}
            options={messageTypeOptions}
            placeholder={t('common.messages.pleaseSelect')}
          />
        </div>
        <div className="mg-v2-form-group">
          <label className="mg-v2-label">제목 *</label>
          <input
            type="text"
            className="mg-v2-input"
            value={newMessage.title}
            onChange={(e) => setNewMessage({ ...newMessage, title: e.target.value })}
            placeholder="메시지 제목을 입력하세요"
          />
        </div>
        <div className="mg-v2-form-group">
          <label className="mg-v2-label">내용 *</label>
          <textarea
            className="mg-v2-textarea"
            value={newMessage.content}
            onChange={(e) => setNewMessage({ ...newMessage, content: e.target.value })}
            placeholder="메시지 내용을 입력하세요"
            rows={6}
          />
        </div>
        <div className="mg-flex mg-gap-md">
          <label className="mg-checkbox">
            <input
              type="checkbox"
              checked={newMessage.isImportant}
              onChange={(e) => setNewMessage({ ...newMessage, isImportant: e.target.checked })}
            />
            <span>중요</span>
          </label>
          <label className="mg-checkbox">
            <input
              type="checkbox"
              checked={newMessage.isUrgent}
              onChange={(e) => setNewMessage({ ...newMessage, isUrgent: e.target.checked })}
            />
            <span>{t('admin.labels.urgent')}</span>
          </label>
        </div>
      </UnifiedModal>
    </AdminCommonLayout>
  );

  if (sessionLoading) {
    return renderPage(
      <div className={CONSULTANT_SUITE_CLASS.LOADING} aria-busy="true" aria-live="polite">
        <UnifiedLoading type="inline" text={tSuite('messages.sessionLoading')} variant="pulse" />
      </div>
    );
  }

  if (!isLoggedIn) {
    return renderPage(
      <section className={CONSULTANT_SUITE_CLASS.PANEL}>
        <EmptyState className={CONSULTANT_SUITE_CLASS.EMPTY} title={tSuite('messages.loginRequired')} />
      </section>
    );
  }

  const renderList = () => {
    if (loading) {
      return (
        <div className={CONSULTANT_SUITE_CLASS.LOADING} aria-busy="true" aria-live="polite">
          <UnifiedLoading type="inline" text={tSuite('messages.loading')} variant="pulse" />
        </div>
      );
    }
    if (filteredMessages.length === 0) {
      const hasMessages = messages.length > 0 || totalElements > 0;
      return (
        <section className={CONSULTANT_SUITE_CLASS.PANEL}>
          <EmptyState
            className={CONSULTANT_SUITE_CLASS.EMPTY}
            icon={<MessageSquare size={EMPTY_ICON_SIZE} aria-hidden />}
            title={hasMessages ? tSuite('messages.filterEmptyTitle') : tSuite('messages.emptyTitle')}
            description={hasMessages
              ? tSuite('messages.filterEmptyDescription')
              : tSuite('messages.emptyDescription')}
            action={hasMessages ? null : (
              <ConsultantSuiteButton onClick={openSendModal}>{tSuite('actions.firstMessage')}</ConsultantSuiteButton>
            )}
          />
        </section>
      );
    }
    return (
      <>
        <ul className={CONSULTANT_SUITE_CLASS.CARD_LIST} aria-label={tSuite('messages.listAria')}>
          {filteredMessages.map((message) => {
            const typeKey = resolveConsultantMessageType(message.messageType);
            const preview = (message.content || '').length > MESSAGE_PREVIEW_MAX
              ? `${(message.content || '').substring(0, MESSAGE_PREVIEW_MAX)}…`
              : (message.content || '');
            return (
              <li key={message.id}>
                <ConsultantSuiteCard
                  variant={CONSULTANT_SUITE_CARD_VARIANT.ROW}
                  className={`consultant-messages__suite-card${message.isRead ? '' : ' consultant-messages__suite-card--unread'}`}
                  testId={CONSULTANT_SUITE_TEST_ID.MESSAGE_ROW}
                  onClick={() => handleMessageClick(message)}
                  title={message.title}
                  time={formatDate(message.createdAt)}
                  body={<SafeText>{preview}</SafeText>}
                  foot={(
                    <>
                      <SafeText tag="span" className="consultant-messages__row-counterparty">
                        {getMessageCounterpartyLine(message)}
                      </SafeText>
                      <ConsultantSuitePill>
                        {tSuite(`messages.type.${typeKey}`)}
                      </ConsultantSuitePill>
                    </>
                  )}
                />
              </li>
            );
          })}
        </ul>
        {totalElements > 0 ? (
          <nav className={CONSULTANT_SUITE_CLASS.PAGINATION} aria-label={tSuite('messages.listAria')}>
            {totalElements > CONSULTANT_SUITE_PAGE_SIZE ? (
              <MGPagination
                currentPage={page}
                totalPages={totalPages}
                totalItems={totalElements}
                itemsPerPage={CONSULTANT_SUITE_PAGE_SIZE}
                onPageChange={setPage}
                showInfo
                showItemsPerPage={false}
                variant="compact"
              />
            ) : (
              <p
                className={CONSULTANT_SUITE_CLASS.SUMMARY}
                data-testid="consultant-messages-total"
              >
                {tSuite('messages.totalCount', { count: totalElements })}
              </p>
            )}
          </nav>
        ) : null}
      </>
    );
  };

  return renderPage(
    <>
      <div className={CONSULTANT_SUITE_CLASS.TOOLBAR}>
        <ConsultantSearchField
          id={CONSULTANT_MESSAGES_SEARCH_ID}
          value={searchTerm}
          onChange={setSearchTerm}
          placeholder={tSuite('messages.searchPlaceholder')}
          ariaLabel={tSuite('messages.searchAria')}
        />
        <ConsultantFilterChips
          items={typeFilterItems}
          activeKey={filterStatus}
          onChange={setFilterStatus}
          ariaLabel={tSuite('messages.typeFilterAria')}
          testIdPrefix="consultant-messages-type"
        />
      </div>
      {renderList()}
    </>
  );
};

export default ConsultantMessages;
