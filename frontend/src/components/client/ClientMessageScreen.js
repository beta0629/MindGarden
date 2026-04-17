import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useSession } from '../../contexts/SessionContext';
import StandardizedApi from '../../utils/standardizedApi';
import UnifiedLoading from '../../components/common/UnifiedLoading';
import notificationManager from '../../utils/notification';
import AdminCommonLayout from '../layout/AdminCommonLayout';
import { ContentArea, ContentHeader } from '../dashboard-v2/content';
import MGButton from '../common/MGButton';
import { buildErpMgButtonClassName, ERP_MG_BUTTON_LOADING_TEXT } from '../erp/common/erpMgButtonProps';
import UnifiedModal from '../common/modals/UnifiedModal';
import SafeText from '../common/SafeText';
import { toDisplayString } from '../../utils/safeDisplay';
import '../../styles/unified-design-tokens.css';
import '../admin/AdminDashboard/AdminDashboardB0KlA.css';
import '../../styles/themes/client-theme.css';
import './ClientMessageScreen.css';

const CLIENT_MESSAGE_TITLE_ID = 'client-message-screen-title';

/**
 * 내담자 메시지 확인 화면
 * 상담사로부터 받은 메시지를 확인하고 답장할 수 있는 화면
 */
const ClientMessageScreen = () => {
  const navigate = useNavigate();
  const { user, isLoading: sessionLoading, isLoggedIn } = useSession();

  const [loading, setLoading] = useState(true);
  const [messages, setMessages] = useState([]);
  const [selectedMessage, setSelectedMessage] = useState(null);
  const [replying, setReplying] = useState(false);
  const [replyContent, setReplyContent] = useState('');

  const handleCloseMessageModal = useCallback(() => {
    setSelectedMessage(null);
    setReplyContent('');
  }, []);

  // 데이터 로드
  useEffect(() => {
    if (sessionLoading) {
      return;
    }

    if (isLoggedIn && user && user.id) {
      loadMessages();
    } else if (!isLoggedIn) {
      navigate('/login');
    } else {
      console.warn('⚠️ 로그인되어 있지만 사용자 정보가 없습니다.');
      setLoading(false);
    }
  }, [user, sessionLoading, isLoggedIn, navigate]);

  const loadMessages = async() => {
    if (!user || !user.id) {
      console.warn('사용자 정보가 없어 메시지를 로드할 수 없습니다.');
      setLoading(false);
      return;
    }

    try {
      setLoading(true);

      const response = await StandardizedApi.get(`/api/v1/consultation-messages/client/${user.id}`, {
        page: 0,
        size: 100,
        sort: 'createdAt,desc'
      });

      console.log('📨 메시지 API 응답:', response);

      if (response && response.success) {
        let messageData = [];
        if (response.data) {
          if (Array.isArray(response.data)) {
            messageData = response.data;
          } else if (response.data.messages && Array.isArray(response.data.messages)) {
            messageData = response.data.messages;
          }
        }
        setMessages(messageData);
        console.log('✅ 메시지 로드 성공:', messageData.length, '개');
      } else if (response === null || response === undefined) {
        console.warn('⚠️ 메시지 API 응답이 null입니다. 권한이 없을 수 있습니다.');
        setMessages([]);
      } else {
        console.warn('⚠️ 메시지 API 응답 실패:', response);
        setMessages([]);
      }
    } catch (error) {
      console.error('메시지 로드 오류:', error);
      if (error.status !== 403 && error.message?.includes('접근 권한') === false) {
        notificationManager.show('메시지를 불러오는 중 오류가 발생했습니다.', 'error');
      }
      setMessages([]);
    } finally {
      setLoading(false);
    }
  };

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

      if (response.success) {
        notificationManager.show('답장이 전송되었습니다.', 'success');
        handleCloseMessageModal();
        loadMessages();
      } else {
        throw new Error(response.message || '답장 전송에 실패했습니다.');
      }
    } catch (error) {
      console.error('답장 전송 오류:', error);
      notificationManager.show('답장 전송 중 오류가 발생했습니다.', 'error');
    } finally {
      setReplying(false);
    }
  };

  const getMessageTypeIcon = (messageType) => {
    const icons = {
      GENERAL: '💬',
      FOLLOW_UP: '📋',
      HOMEWORK: '📝',
      REMINDER: '🔔',
      URGENT: '⚠️'
    };
    return icons[messageType] || '💬';
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
      return '—';
    }
    const date = new Date(raw);
    if (Number.isNaN(date.getTime())) {
      return '—';
    }
    return date.toLocaleDateString('ko-KR', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const unreadCount = messages.filter(m => !m.isRead).length;
  const importantCount = messages.filter(m => m.isImportant).length;
  const urgentCount = messages.filter(m => m.isUrgent).length;

  const messageModalSubtitle = selectedMessage
    ? [
      getMessageTypeLabel(selectedMessage.messageType),
      formatDate(selectedMessage.sentAt),
      selectedMessage.isImportant ? '⭐ 중요' : null,
      selectedMessage.isUrgent ? '⚠️ 긴급' : null
    ].filter(Boolean).join(' • ')
    : '';

  const messageModalTitle = selectedMessage
    ? `${getMessageTypeIcon(selectedMessage.messageType)} ${toDisplayString(selectedMessage.title)}`
    : '';

  const pageShell = (body) => (
    <div className="mg-v2-ad-b0kla" data-testid="client-messages-page">
      <div className="mg-v2-ad-b0kla__container">
        <ContentArea ariaLabel="상담사 메시지">
          <ContentHeader
            title="상담사 메시지"
            subtitle="상담사로부터 받은 메시지를 확인하고 답장할 수 있습니다."
            titleId={CLIENT_MESSAGE_TITLE_ID}
          />
          <main aria-labelledby={CLIENT_MESSAGE_TITLE_ID}>
            {body}
          </main>
        </ContentArea>
      </div>
    </div>
  );

  const renderMessageModalActions = () => (
    <>
      <MGButton
        type="button"
        variant="secondary"
        className={buildErpMgButtonClassName({ variant: 'secondary', loading: false })}
        onClick={handleCloseMessageModal}
        disabled={replying}
        preventDoubleClick={false}
      >
        닫기
      </MGButton>
      <MGButton
        type="button"
        variant="primary"
        className={buildErpMgButtonClassName({ variant: 'primary', loading: replying })}
        onClick={handleReply}
        disabled={replying || !replyContent.trim()}
        loading={replying}
        loadingText={ERP_MG_BUTTON_LOADING_TEXT}
        preventDoubleClick={false}
      >
        답장 전송
      </MGButton>
    </>
  );

  if (loading) {
    return (
      <AdminCommonLayout title="메시지">
        {pageShell(
          <div
            className="client-message-screen-loading"
            aria-busy="true"
            aria-live="polite"
          >
            <UnifiedLoading type="inline" text="로딩중..." />
          </div>
        )}
      </AdminCommonLayout>
    );
  }

  return (
    <AdminCommonLayout title="메시지" className="mg-v2-dashboard-layout">
      {pageShell(
        <div className="client-message-screen-container">
          <div className="client-message-screen-stats-card">
            <div className="client-message-screen-stats-grid">
              <div className="client-message-screen-stat-item">
                <div className="client-message-screen-stat-value">{messages.length}</div>
                <div className="client-message-screen-stat-label">전체 메시지</div>
              </div>
              <div className="client-message-screen-stat-item">
                <div className="client-message-screen-stat-value client-message-screen-stat-value-danger">{unreadCount}</div>
                <div className="client-message-screen-stat-label">읽지 않음</div>
              </div>
              <div className="client-message-screen-stat-item">
                <div className="client-message-screen-stat-value client-message-screen-stat-value-warning">{importantCount}</div>
                <div className="client-message-screen-stat-label">중요 메시지</div>
              </div>
              <div className="client-message-screen-stat-item">
                <div className="client-message-screen-stat-value client-message-screen-stat-value-danger">{urgentCount}</div>
                <div className="client-message-screen-stat-label">긴급 메시지</div>
              </div>
            </div>
          </div>

          <div className="client-message-screen-messages-card">
            <h2 className="client-message-screen-messages-title">
              📨 메시지 목록
            </h2>

            {messages.length === 0 ? (
              <div className="client-message-screen-empty-state">
                <div className="client-message-screen-empty-icon">📭</div>
                <div className="client-message-screen-empty-title">받은 메시지가 없습니다</div>
                <div className="client-message-screen-empty-message">상담사로부터 메시지를 받으면 여기에 표시됩니다.</div>
              </div>
            ) : (
              <div
                className="client-message-screen-message-list"
                data-testid="client-messages-message-list"
              >
                {messages.map(message => (
                  <div
                    key={message.id}
                    data-testid="client-messages-message-item"
                    className={`client-message-screen-message-item ${message.isUrgent ? 'client-message-screen-message-item-urgent' : ''} ${message.isImportant && !message.isUrgent ? 'client-message-screen-message-item-important' : ''} ${!message.isRead ? 'client-message-screen-message-item-unread' : ''}`}
                    onClick={() => handleMessageClick(message)}
                  >
                    <div className="client-message-screen-message-header">
                      <div>
                        <div className="client-message-screen-message-title">
                          {getMessageTypeIcon(message.messageType)}{' '}
                          <SafeText>{message.title}</SafeText>
                        </div>
                        <div className="client-message-screen-message-meta">
                          {getMessageTypeLabel(message.messageType)} • {formatDate(message.sentAt)}
                        </div>
                      </div>
                      <div className="client-message-screen-message-badges">
                        {!message.isRead && <span className="client-message-screen-badge client-message-screen-badge-unread">읽지 않음</span>}
                        {message.isImportant && <span className="client-message-screen-badge client-message-screen-badge-important">중요</span>}
                        {message.isUrgent && <span className="client-message-screen-badge client-message-screen-badge-urgent">긴급</span>}
                        {message.isRead && <span className="client-message-screen-badge client-message-screen-badge-read">읽음</span>}
                      </div>
                    </div>
                    <div className="client-message-screen-message-content">
                      <SafeText>
                        {(toDisplayString(message.content, '').length > 100
                          ? `${toDisplayString(message.content, '').substring(0, 100)}...`
                          : toDisplayString(message.content, ''))}
                      </SafeText>
                    </div>
                    <div className="client-message-screen-message-footer">
                      <span>상담사</span>
                      <span>
                        {message.isRead
                          ? `읽음 ${formatDate(message.readAt)}`
                          : '읽지 않음'}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          <UnifiedModal
            isOpen={Boolean(selectedMessage)}
            onClose={handleCloseMessageModal}
            title={messageModalTitle}
            subtitle={messageModalSubtitle}
            size="large"
            backdropClick={!replying}
            showCloseButton={true}
            closeButtonDataTestId="client-message-detail-close"
            loading={replying}
            className="mg-v2-ad-b0kla"
            actions={renderMessageModalActions()}
            data-testid="client-message-detail-modal"
          >
            {selectedMessage && (
              <>
                <div className="client-message-screen-message-detail-content">
                  <SafeText tag="div">{selectedMessage.content}</SafeText>
                </div>
                <div className="client-message-screen-reply-section">
                  <div className="client-message-screen-reply-title">답장하기</div>
                  <textarea
                    className="client-message-screen-reply-textarea"
                    data-testid="client-message-reply-textarea"
                    value={replyContent}
                    onChange={(e) => setReplyContent(e.target.value)}
                    placeholder="답장 내용을 입력하세요..."
                    disabled={replying}
                  />
                </div>
              </>
            )}
          </UnifiedModal>
        </div>
      )}
    </AdminCommonLayout>
  );
};

export default ClientMessageScreen;
