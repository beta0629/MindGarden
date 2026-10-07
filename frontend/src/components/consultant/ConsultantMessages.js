import React, { useState, useEffect, useCallback } from 'react';
import UnifiedLoading from '../../components/common/UnifiedLoading';
import UnifiedModal from '../common/modals/UnifiedModal';
import CustomSelect from '../common/CustomSelect';
import BadgeSelect from '../common/BadgeSelect';
import { useNavigate } from 'react-router-dom';
import { useSession } from '../../contexts/SessionContext';
import { useNotification } from '../../contexts/NotificationContext';
import { apiGet, apiPost } from '../../utils/ajax';
import notificationManager from '../../utils/notification';
import AdminCommonLayout from '../layout/AdminCommonLayout';
import { buildErpMgButtonClassName, ERP_MG_BUTTON_LOADING_TEXT } from '../erp/common/erpMgButtonProps';
import MGButton from '../common/MGButton';
import EmptyState from '../common/EmptyState';
import StatusBadge from '../common/StatusBadge';
import SafeText from '../common/SafeText';
import { MessageSquare, Plus } from 'lucide-react';
import ConsultantSuitePage from './suite/ConsultantSuitePage';
import ConsultantSearchField from './suite/ConsultantSearchField';
import ConsultantFilterChips from './suite/ConsultantFilterChips';
import ConsultantSuiteButton from './suite/ConsultantSuiteButton';
import {
  CONSULTANT_MESSAGE_TYPE_FILTER,
  CONSULTANT_SUITE_BUTTON_VARIANT,
  CONSULTANT_SUITE_CLASS,
  CONSULTANT_SUITE_NS,
  CONSULTANT_SUITE_TEST_ID
} from '../../constants/consultantSuite';
import './ConsultantMessages.css';
import { USER_ROLES } from '../../constants/roles';
import { useTranslation } from 'react-i18next';

// T5 표준화 2026-05-21: API 경로 리터럴 → 로컬 상수 (운영 게이트 P0)
const API_CONSULTATION_MESSAGES = '/api/v1/consultation-messages';


/**
 * 상담사 메시지 관리 페이지
 * 내담자들과의 메시지 목록을 확인하고 새 메시지를 전송할 수 있는 화면
 */
const CONSULTANT_MESSAGES_TITLE_ID = 'consultant-messages-title';
const CONSULTANT_MESSAGES_SEARCH_ID = 'consultant-messages-search';
const ACTION_ICON_SIZE = 16;
const EMPTY_ICON_SIZE = 40;
const MESSAGE_PREVIEW_MAX = 100;
const MESSAGE_TYPE_FILTER_ORDER = Object.values(CONSULTANT_MESSAGE_TYPE_FILTER);

/** 메시지 카드 하단 상대/출처 표기용 문구 (사용자 노출) */
const MESSAGE_COUNTERPARTY_COPY = {
  SOURCE_REMINDER_OR_SYSTEM: '출처: 리마인더·알림',
  SENDER_PREFIX: '보낸 사람:',
  RECIPIENT_PREFIX: '받는 사람:',
  RELATED_PREFIX: '관련:',
  NO_SPECIFIC_COUNTERPARTY: '특정 상대 없음 (알림·일괄)'
};

/**
 * 백엔드 messageType·senderType·clientName에 따라 카드 푸터 한 줄 문자열을 반환한다.
 *
 * @param {object} message - API 메시지 객체
 * @returns {string}
 */
function getMessageCounterpartyLine(message) {
  const messageType = (message?.messageType && String(message.messageType).trim().toUpperCase()) || '';
  const senderType = (message?.senderType && String(message.senderType).trim().toUpperCase()) || '';
  const clientName = (message?.clientName && String(message.clientName).trim()) || '';

  if (messageType === 'REMINDER' || senderType === 'SYSTEM') {
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
  const navigate = useNavigate();
  const { user, isLoggedIn, isLoading: sessionLoading } = useSession();
  const { markMessageAsRead } = useNotification();
  
  const [loading, setLoading] = useState(true);
  const [messages, setMessages] = useState([]);
  const [clients, setClients] = useState([]);
  const [selectedMessage, setSelectedMessage] = useState(null);
  const [showSendModal, setShowSendModal] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState('ALL');
  
  // 새 메시지 작성 폼
  const [newMessage, setNewMessage] = useState({
    clientId: '',
    title: '',
    content: '',
    messageType: 'GENERAL',
    isImportant: false,
    isUrgent: false
  });

  const messageTypes = [
    { value: 'GENERAL', label: '일반', icon: 'MessageCircle', color: 'var(--mg-secondary-500)' },
    { value: 'FOLLOW_UP', label: '후속 조치', icon: 'ClipboardList', color: 'var(--mg-primary-500)' },
    { value: 'HOMEWORK', label: '과제 안내', icon: 'FileText', color: 'var(--mg-success-500)' },
    { value: 'REMINDER', label: '알림', icon: 'Bell', color: 'var(--mg-warning-500)' },
    { value: 'URGENT', label: '긴급', icon: 'AlertTriangle', color: 'var(--mg-error-500)' }
  ];

  const loadMessages = useCallback(async() => {
    if (!user?.id) return;
    try {
      setLoading(true);
      // apiGet은 { success, data } 응답 시 data만 반환 → 언랩된 본문으로 처리
      const data = await apiGet(`/api/v1/consultation-messages/consultant/${user.id}`);
      if (data == null) {
        setMessages([]);
        return;
      }
      let list = [];
      if (Array.isArray(data.messages)) {
        list = data.messages;
      } else if (Array.isArray(data)) {
        list = data;
      }
      setMessages(list);
    } catch (err) {
      console.error('메시지 로드 중 오류:', err);
      notificationManager.show('메시지를 불러오는 중 오류가 발생했습니다.', 'error');
      setMessages([]);
    } finally {
      setLoading(false);
    }
  }, [user?.id]);

  const loadClients = useCallback(async() => {
    if (!user?.id) return;
    try {
      const data = await apiGet(`/api/v1/admin/mappings/consultant/${user.id}/clients`);
      if (data == null) {
        setClients([]);
        return;
      }
      let rows = [];
      if (Array.isArray(data.mappings)) {
        rows = data.mappings;
      } else if (Array.isArray(data.clients)) {
        rows = data.clients;
      } else if (Array.isArray(data)) {
        rows = data;
      }
      const list = rows
        .map((item) => (item && typeof item === 'object' ? item.client : null))
        .filter(Boolean);
      setClients(list);
    } catch (err) {
      console.error('내담자 목록 로드 오류:', err);
      setClients([]);
    }
  }, [user?.id]);

  // 데이터 로드
  useEffect(() => {
    if (isLoggedIn && user?.id) {
      loadMessages();
      loadClients();
    }
  }, [isLoggedIn, user?.id, loadMessages, loadClients]);

  // 메시지 필터링
  const filteredMessages = messages.filter(message => {
    const matchesSearch = message.title?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         message.content?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         message.clientName?.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesStatus = filterStatus === 'ALL' || message.messageType === filterStatus;
    
    return matchesSearch && matchesStatus;
  });

  // 내담자별로 메시지 그룹화
  const groupedMessages = filteredMessages.reduce((groups, message) => {
    const clientId = message.clientId || 'unknown';
    const clientName = message.clientName || '알 수 없음';
    
    if (!groups[clientId]) {
      groups[clientId] = {
        clientId,
        clientName,
        messages: [],
        unreadCount: 0
      };
    }
    
    groups[clientId].messages.push(message);
    if (!message.isRead) {
      groups[clientId].unreadCount += 1;
    }
    
    return groups;
  }, {});

  // 객체를 배열로 변환하고 읽지 않은 메시지가 많은 순으로 정렬
  const clientGroups = Object.values(groupedMessages).sort((a, b) => {
    if (b.unreadCount !== a.unreadCount) {
      return b.unreadCount - a.unreadCount; // 읽지 않은 메시지 많은 순
    }
    return a.clientName.localeCompare(b.clientName, 'ko-KR'); // 이름 가나다순
  });

  // 메시지 전송
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
          messageType: 'GENERAL',
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

  // 메시지 상세 보기
  const handleMessageClick = async(message) => {
    setSelectedMessage(message);
    if (!message.isRead && markMessageAsRead) {
      try {
        await markMessageAsRead(message.id);
        setMessages(prev =>
          prev.map(msg => (msg.id === message.id ? { ...msg, isRead: true } : msg))
        );
      } catch (e) {
        console.error('읽음 처리 오류:', e);
      }
    }
  };

  // 메시지 유형 정보 가져오기
  const getMessageTypeInfo = (messageType) => {
    return messageTypes.find(type => type.value === messageType) || messageTypes[0];
  };

  // 날짜 포맷팅
  const formatDate = (dateString) => {
    if (!dateString) return '날짜 없음';
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

      {/* 새 메시지 작성 모달 */}
      <UnifiedModal
        isOpen={showSendModal}
        onClose={() => setShowSendModal(false)}
        title="새 메시지 작성"
        size="auto"
        showCloseButton={true}
        backdropClick={true}
        actions={
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
        }
      >
        <div className="mg-v2-form-group">
          <label className="mg-v2-label">받는 사람 *</label>
          <CustomSelect
            className="mg-v2-select"
            value={newMessage.clientId ?? ''}
            onChange={(val) => setNewMessage({ ...newMessage, clientId: val })}
            options={[
              { value: '', label: '내담자를 선택하세요' },
              ...clients.map(client => ({
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
            options={messageTypes.map((type) => ({
              value: type.value,
              label: type.label
            }))}
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
      const hasMessages = messages.length > 0;
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
      <ul className="consultant-messages__list" aria-label={tSuite('messages.listAria')}>
        {filteredMessages.map((message) => {
          const typeKey = getMessageTypeInfo(message.messageType).value;
          const preview = (message.content || '').length > MESSAGE_PREVIEW_MAX
            ? `${(message.content || '').substring(0, MESSAGE_PREVIEW_MAX)}…`
            : (message.content || '');
          return (
            <li key={message.id}>
              <button
                type="button"
                className={`consultant-messages__row${message.isRead ? '' : ' consultant-messages__row--unread'}`}
                onClick={() => handleMessageClick(message)}
                data-testid={CONSULTANT_SUITE_TEST_ID.MESSAGE_ROW}
                data-gnb-chrome-free="true"
              >
                <span className="consultant-messages__row-head">
                  <span className="consultant-messages__row-chips">
                    <StatusBadge variant="neutral" className={CONSULTANT_SUITE_CLASS.STATUS}>
                      {tSuite(`messages.type.${typeKey}`)}
                    </StatusBadge>
                    {message.isImportant ? (
                      <StatusBadge variant="neutral" className={CONSULTANT_SUITE_CLASS.STATUS}>
                        {tSuite('messages.important')}
                      </StatusBadge>
                    ) : null}
                    {message.isUrgent ? (
                      <StatusBadge variant="neutral" className={CONSULTANT_SUITE_CLASS.STATUS}>
                        {tSuite('messages.urgent')}
                      </StatusBadge>
                    ) : null}
                  </span>
                  <time className="consultant-messages__row-time">{formatDate(message.createdAt)}</time>
                </span>
                <SafeText tag="strong" className="consultant-messages__row-title">{message.title}</SafeText>
                <SafeText tag="span" className="consultant-messages__row-preview">{preview}</SafeText>
                <span className="consultant-messages__row-foot">
                  <span className="consultant-messages__row-counterparty">
                    {getMessageCounterpartyLine(message)}
                  </span>
                  <span className="consultant-messages__row-read">
                    {message.isRead ? tSuite('messages.read') : tSuite('messages.unread')}
                  </span>
                </span>
              </button>
            </li>
          );
        })}
      </ul>
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
